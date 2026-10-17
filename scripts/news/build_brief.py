#!/usr/bin/env python3
"""
Daily Brief builder.

Runs once a day (from GitHub Actions):
  1. Fetches RSS/Atom feeds listed in sources.json
  2. Keeps recent, relevant stories (VC, startups, funding, industry, economy)
  3. Removes duplicates (the same story reported by several papers)
  4. Asks an AI model (Gemini by default, OpenAI optional) to rewrite them
     in simple English, sort them into sections and add a "why a VC cares" line
  5. Writes content/news/YYYY-MM-DD.json, which the website reads

Standard library only, so there is nothing to install.

Environment variables:
  GEMINI_API_KEY   Google AI Studio key (free tier works)
  GEMINI_MODEL     optional, e.g. "gemini-2.5-flash"; auto-detected if unset/unavailable
  OPENAI_API_KEY   optional alternative/fallback provider
  OPENAI_MODEL     optional, default "gpt-5-mini"
  AI_PROVIDER      optional, "gemini" or "openai" to force the first choice

Usage:
  python scripts/news/build_brief.py                 # normal daily run
  python scripts/news/build_brief.py --dry-run       # fetch + filter only, no AI, no file
  python scripts/news/build_brief.py --date 2026-10-16
"""

from __future__ import annotations

import argparse
import gzip
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from difflib import SequenceMatcher
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCES_FILE = Path(__file__).resolve().parent / "sources.json"
OUTPUT_DIR = ROOT / "content" / "news"

IST = timezone(timedelta(hours=5, minutes=30))
LOOKBACK_HOURS = 36
KEEP_DAYS = 7  # how many days of briefs the site keeps
MAX_CANDIDATES = 60
MAX_PER_SOURCE = 12
MIN_SCORE = 3
MIN_STORIES = 5
USER_AGENT = (
    "Mozilla/5.0 (compatible; YogeshResearchDailyBrief/1.0; "
    "+https://yogesh-research-8seo.vercel.app)"
)

SECTIONS = [
    ("funding", "Funding rounds"),
    ("vc", "VC firms & funds"),
    ("exits", "IPOs, acquisitions & exits"),
    ("startups", "Startup & industry moves"),
    ("economy", "Economy, policy & markets"),
    ("global", "Global VC"),
]
SECTION_IDS = {s for s, _ in SECTIONS}


def log(msg: str) -> None:
    print(msg, flush=True)


def _annotate(level: str, msg: str) -> None:
    """On GitHub Actions, also show the message as a run annotation (visible on the run page)."""
    if os.environ.get("GITHUB_ACTIONS") == "true":
        clean = msg.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
        print(f"::{level} title=Daily Brief::{clean}", flush=True)


def fail(msg: str) -> int:
    log(msg)
    _annotate("error", msg)
    return 1


# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------


@dataclass
class Item:
    title: str
    url: str
    source: str
    region: str
    focus: str
    snippet: str = ""
    published: datetime | None = None
    score: int = 0
    also: list[tuple[str, str]] = field(default_factory=list)  # (source, url)


# ---------------------------------------------------------------------------
# Fetching and parsing
# ---------------------------------------------------------------------------


def fetch(url: str, timeout: int = 25, retries: int = 2) -> bytes:
    last: Exception | None = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
                },
            )
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = resp.read()
                if resp.headers.get("Content-Encoding", "").lower() == "gzip" or data[:2] == b"\x1f\x8b":
                    data = gzip.decompress(data)
                return data
        except Exception as exc:  # noqa: BLE001 - any network problem: retry, then give up
            last = exc
            if attempt < retries:
                time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"fetch failed: {last}")


def clean_text(raw: str | None, limit: int | None = None) -> str:
    if not raw:
        return ""
    text = re.sub(r"<!\[CDATA\[|\]\]>", "", raw)
    text = re.sub(r"<(script|style)\b.*?</\1>", " ", text, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(html.unescape(text))
    text = re.sub(r"\s+", " ", text).strip()
    # Common feed boilerplate
    text = re.sub(r"The post .{0,200}? appeared first on .{0,80}?\.?$", "", text).strip()
    if limit and len(text) > limit:
        text = text[:limit].rsplit(" ", 1)[0] + "…"
    return text


def parse_date(raw: str | None) -> datetime | None:
    if not raw:
        return None
    raw = raw.strip()
    try:
        dt = parsedate_to_datetime(raw)
    except (TypeError, ValueError, IndexError):
        dt = None
    if dt is None:
        try:
            dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1].lower() if isinstance(tag, str) else ""


def _child_text(el: ET.Element, *names: str) -> str | None:
    for child in el:
        if _local(child.tag) in names:
            text = "".join(child.itertext()).strip()
            if text:
                return text
    return None


def _atom_link(el: ET.Element) -> str | None:
    fallback = None
    for child in el:
        if _local(child.tag) == "link":
            href = child.get("href")
            if href and child.get("rel", "alternate") == "alternate":
                return href
            if href and not fallback:
                fallback = href
            if not href and (child.text or "").strip():
                return child.text.strip()
    return fallback


def parse_feed_xml(data: bytes) -> list[dict]:
    """Parse RSS 2.0 / RSS 1.0 / Atom. Falls back to regex for broken XML."""
    try:
        root = ET.fromstring(data)
    except ET.ParseError:
        return parse_feed_regex(data.decode("utf-8", errors="replace"))

    entries = [el for el in root.iter() if _local(el.tag) in ("item", "entry")]
    out = []
    for el in entries:
        title = _child_text(el, "title")
        link = _atom_link(el) if _local(el.tag) == "entry" else (_child_text(el, "link") or _atom_link(el))
        if not link:
            guid = _child_text(el, "guid")
            if guid and guid.startswith("http"):
                link = guid
        desc = _child_text(el, "description", "summary", "encoded", "content")
        date = _child_text(el, "pubdate", "published", "updated", "date")
        if title and link:
            out.append({"title": title, "link": link.strip(), "description": desc, "date": date})
    return out


def parse_feed_regex(text: str) -> list[dict]:
    def grab(block: str, tag: str) -> str | None:
        m = re.search(rf"<{tag}\b[^>]*>(.*?)</{tag}>", block, flags=re.S | re.I)
        return m.group(1).strip() if m else None

    out = []
    for block in re.findall(r"<(?:item|entry)\b[^>]*>(.*?)</(?:item|entry)>", text, flags=re.S | re.I):
        title = grab(block, "title")
        link = grab(block, "link")
        if not link:
            m = re.search(r"<link\b[^>]*href=[\"']([^\"']+)[\"']", block, flags=re.I)
            link = m.group(1) if m else None
        desc = grab(block, "description") or grab(block, "summary") or grab(block, "content:encoded")
        date = grab(block, "pubDate") or grab(block, "published") or grab(block, "updated") or grab(block, "dc:date")
        if title and link:
            out.append({
                "title": clean_text(title),
                "link": clean_text(link),
                "description": desc,
                "date": clean_text(date) if date else None,
            })
    return out


def load_sources() -> list[dict]:
    return json.loads(SOURCES_FILE.read_text(encoding="utf-8"))["feeds"]


def collect(sources: list[dict], fixtures: Path | None = None) -> tuple[list[Item], int]:
    items: list[Item] = []
    ok = 0
    for src in sources:
        try:
            if fixtures is not None:
                path = fixtures / (re.sub(r"[^a-z0-9]+", "-", src["name"].lower()).strip("-") + ".xml")
                if not path.exists():
                    continue
                data = path.read_bytes()
            else:
                data = fetch(src["url"])
            entries = parse_feed_xml(data)
        except Exception as exc:  # noqa: BLE001 - one bad feed must not stop the brief
            log(f"  ! {src['name']}: skipped ({exc})")
            _annotate("warning", f"Feed skipped: {src['name']} ({exc})")
            continue
        ok += 1
        log(f"  ✓ {src['name']}: {len(entries)} items")
        for e in entries:
            title = clean_text(e["title"])
            url = e["link"].strip()
            if not title or not url.startswith("http"):
                continue
            items.append(Item(
                title=title,
                url=url,
                source=src["name"],
                region=src.get("region", "india"),
                focus=src.get("focus", "general"),
                snippet=clean_text(e.get("description"), limit=420),
                published=parse_date(e.get("date")),
            ))
    return items, ok


# ---------------------------------------------------------------------------
# Relevance, recency, de-duplication
# ---------------------------------------------------------------------------

KEYWORDS: list[tuple[int, str]] = [
    # deal flow
    (3, r"fund(ing|raise|raising)|raises?|raised|bags|nabs|snags|secures?|series [a-f]\b|seed round|pre-seed|pre-series|bridge round"),
    (3, r"venture capital|\bvcs?\b|venture fund|\bfund (i{1,3}|iv|v|vi)\b|corpus|limited partners|\blps?\b|first close|final close|closes? .{0,40}fund|(new|maiden|debut|early-stage|growth|seed) fund|launches? .{0,30}fund"),
    (3, r"\bipo\b|drhp|listing|lists on|acquir(es|ed|ition)|merger|buyout|\bexit\b|stake sale|block deal|private equity|\bpe firm"),
    (3, r"valuation|unicorn|soonicorn|decacorn|down round|term sheet|angel invest"),
    # startup world
    (2, r"startups?|founders?|fintech|edtech|healthtech|insurtech|agritech|d2c|saas|deeptech|quick commerce|e-?commerce"),
    (2, r"\bai\b|artificial intelligence|genai|semiconductor|electric vehicle|\bevs?\b|climate tech|spacetech|defence tech"),
    (2, r"revenue|profit|loss|fy2[5-9]|ebitda|layoffs?|downsiz|shuts? down|pivot"),
    # economy / policy that moves startups
    (3, r"\brbi\b|\bsebi\b|repo rate|inflation|\bgdp\b|union budget|\bgst\b|fdi|\bfpi\b|\bfii\b|rupee|interest rate|the fed\b|startup india|dpiit"),
    (1, r"sensex|nifty|markets?|stocks?|shares?|bank|nbfc|policy|regulat"),
]
NOISE = re.compile(
    r"horoscope|recipe|cricket|bollywood|box office|web series|ott release|live updates?:?\s*$|"
    r"stocks to buy|top gainers|top losers|share price today|gold rate today|silver rate today|"
    r"petrol price|weather|lottery|ticket|discount|deal of the day|book review|must read|books? you|lessons from|"
    r"disrupt 20\d\d|techsparks 20\d\d|\bpass(es)?\b.{0,40}(sav|price|discount)|save \d+%|register (now|today)|"
    r"webinar|sponsored|partner content|brand ?connect|days to (go|disrupt)",
    re.I,
)


def score_item(it: Item) -> int:
    text = f"{it.title} {it.snippet}".lower()
    if NOISE.search(it.title):
        return 0
    score = 2 if it.focus == "startup" else 0
    title_l = it.title.lower()
    for weight, pattern in KEYWORDS:
        if re.search(pattern, title_l):
            score += weight
        elif re.search(pattern, text):
            score += max(1, weight - 1)
    if re.search(r"(₹|rs\.?|inr|\$|usd)\s?[\d,.]+\s?(cr|crore|lakh|mn|million|m|bn|billion|b)\b", text):
        score += 2
    return score


_STOP = set("a an the of to in on for and or with by at from as is are was be its it this that after over into new says said will".split())


_UNITS = {"crore": "cr", "crores": "cr", "million": "mn", "m": "mn", "billion": "bn", "b": "bn", "rs": "", "inr": "", "usd": "", "₹": "", "$": ""}
# Words that appear in many different headlines, so sharing them says nothing about being the same event.
_GENERIC = set(
    "raises raised raise bags secures funding fund funds round series seed pre led by investors investment invest "
    "startup startups fintech edtech healthtech saas ai d2c ev quick commerce platform company firm firms india indian "
    "cr mn bn lakh crore million billion new launches launch shuts down closes ipo acquires acquisition stake shares "
    "revenue profit loss fy26 fy27 rbi sebi rate rates market markets report says plans set amid".split()
)


def _ordered_tokens(s: str) -> list[str]:
    s = s.lower().replace("₹", " ₹ ").replace("$", " $ ")
    s = re.sub(r"(\d)(cr|mn|m|bn|b|k)\b", r"\1 \2", s)
    out: list[str] = []
    for w in re.findall(r"[a-z0-9₹$]+", s):
        w = _UNITS.get(w, w)
        if w and w not in _STOP and (len(w) > 1 or w.isdigit()) and w not in out:
            out.append(w)
    return out


def _subject(tokens: list[str]) -> str | None:
    """First distinctive word, usually the company or institution the headline is about."""
    for w in tokens:
        if w.isalpha() and w not in _GENERIC:
            return w
    return None


def same_story(a: str, b: str) -> bool:
    la, lb = _ordered_tokens(a), _ordered_tokens(b)
    if not la or not lb:
        return False
    sa, sb = _subject(la), _subject(lb)
    if sa and sb and sa != sb and sa not in lb and sb not in la:
        return False  # headlines about different companies
    ta, tb = set(la), set(lb)
    if len(ta & tb) / len(ta | tb) >= 0.55:
        return True
    da, db = ta - _GENERIC, tb - _GENERIC
    overlap = len(ta & tb) / min(len(ta), len(tb))
    if da and db and overlap >= 0.6 and len(da & db) / len(da | db) >= 0.5:
        return True
    return SequenceMatcher(None, a.lower(), b.lower()).ratio() >= 0.82


def canonical_url(url: str) -> str:
    p = urllib.parse.urlsplit(url)
    query = "&".join(
        q for q in p.query.split("&") if q and not q.lower().startswith(("utm_", "ref=", "from=", "fbclid"))
    )
    return urllib.parse.urlunsplit((p.scheme, p.netloc.lower(), p.path.rstrip("/"), query, ""))


def recently_published_urls(today: str, days: int = 4) -> set[str]:
    seen: set[str] = set()
    if not OUTPUT_DIR.exists():
        return seen
    for path in sorted(OUTPUT_DIR.glob("*.json"))[-(days + 1):]:
        if path.stem == today:
            continue
        try:
            brief = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        for section in brief.get("sections", []):
            for story in section.get("stories", []):
                for link in story.get("links", []):
                    seen.add(canonical_url(link.get("url", "")))
    return seen


def recent_story_titles(today: str, days: int = 3) -> list[str]:
    """Headlines already published in the last few briefs, so the AI can skip repeats
    that reach us through a different news site (same event, different link)."""
    titles: list[str] = []
    if not OUTPUT_DIR.exists():
        return titles
    for path in sorted(OUTPUT_DIR.glob("*.json"))[-(days + 1):]:
        if path.stem == today:
            continue
        try:
            brief = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        for section in brief.get("sections", []):
            for story in section.get("stories", []):
                if story.get("title"):
                    titles.append(str(story["title"]))
    return titles[-80:]


def recent_concepts(limit: int = 60) -> list[str]:
    terms: list[str] = []
    if not OUTPUT_DIR.exists():
        return terms
    for path in sorted(OUTPUT_DIR.glob("*.json"))[-limit:]:
        try:
            term = json.loads(path.read_text(encoding="utf-8")).get("concept", {}).get("term")
        except (OSError, json.JSONDecodeError):
            continue
        if term:
            terms.append(term)
    return terms


def select_candidates(items: list[Item], now: datetime, exclude_urls: set[str]) -> list[Item]:
    cutoff = now - timedelta(hours=LOOKBACK_HOURS)
    fresh: list[Item] = []
    seen_urls: set[str] = set()
    for it in items:
        if it.published and (it.published < cutoff or it.published > now + timedelta(hours=2)):
            continue
        cu = canonical_url(it.url)
        if cu in seen_urls or cu in exclude_urls:
            continue
        seen_urls.add(cu)
        it.score = score_item(it)
        if it.score >= MIN_SCORE:
            fresh.append(it)

    # Highest score first, newest first among equals
    epoch = datetime(1970, 1, 1, tzinfo=timezone.utc)
    fresh.sort(key=lambda i: (i.score, i.published or epoch), reverse=True)

    merged: list[Item] = []
    for it in fresh:
        for kept in merged:
            if same_story(kept.title, it.title):
                if it.source != kept.source and len(kept.also) < 3:
                    kept.also.append((it.source, it.url))
                kept.score += 1  # covered by several papers = more important
                break
        else:
            merged.append(it)

    merged.sort(key=lambda i: (i.score, i.published or epoch), reverse=True)
    per_source: dict[str, int] = {}
    picked: list[Item] = []
    for it in merged:
        if per_source.get(it.source, 0) >= MAX_PER_SOURCE:
            continue
        per_source[it.source] = per_source.get(it.source, 0) + 1
        picked.append(it)
        if len(picked) >= MAX_CANDIDATES:
            break
    return picked


# ---------------------------------------------------------------------------
# AI step
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You write a daily news brief for an Indian engineering student who wants to become a venture capitalist (VC).
He has NO finance background. Your job: turn raw headlines into a short, clear, simplified brief.

Rules:
- Write everything in your own words, in plain, simple English. Never copy sentences from the snippets.
- Explain any finance or business jargon in a few words the first time it appears (e.g. "Series A (a startup's first big round of outside funding)").
- Keep Indian numbers as given (₹ crore). If useful, add the rough dollar figure in brackets.
- Be factual. Use only facts present in the provided items. Never invent numbers, names, investors or outcomes. If a detail is not given, leave it out.
- Prefer stories that matter to a VC: funding rounds, new funds, exits/IPOs/acquisitions, big startup and industry moves, and policy/economy news that affects startups.
- Skip pure stock tips, daily price moves, celebrity, sport and lifestyle pieces.
- If two items describe the same event, merge them into one story and list both ids."""

USER_TEMPLATE = """Today's date (India): {date}

Candidate news items (id | source | title | snippet):
{items}

Create the brief. Return ONLY valid JSON with exactly this shape:
{{
  "tldr": ["3 to 5 one-line takeaways of the day, each under 25 words"],
  "stories": [
    {{
      "ids": [<one or more candidate ids this story uses>],
      "section": "<one of: funding, vc, exits, startups, economy, global>",
      "sector": "<short sector label, e.g. Fintech, EV, AI, D2C, Climate, SaaS, Healthtech, Consumer, Deeptech, Banking, Macro>",
      "title": "<your own short headline, under 14 words>",
      "summary": "<2-3 sentences, simple English, what happened and the key numbers>",
      "why_it_matters": "<1-2 sentences: why a VC would care, the investing angle or what it signals>",
      "amount": "<deal size if stated, e.g. '₹120 Cr' or '$15M', else null>",
      "stage": "<round stage if stated, e.g. 'Seed', 'Series B', else null>"
    }}
  ],
  "concept": {{
    "term": "<one finance/VC term connected to today's news>",
    "explanation": "<explain it from scratch in 3-5 simple sentences, assume zero finance knowledge>",
    "example": "<one concrete example, ideally tied to a story from today>"
  }}
}}

Section meanings:
- funding: a startup raised money (seed, Series A/B/C, debt rounds)
- vc: news about VC firms themselves (new funds, fund closes, partners, strategy, LPs)
- exits: IPOs, listings, acquisitions, mergers, secondary sales, block deals
- startups: other important startup/company/industry moves (launches, results, layoffs, shutdowns, expansions)
- economy: RBI, SEBI, government policy, budget, inflation, markets and anything macro that affects startups
- global: important non-India VC/startup news

Pick the 18 to 25 most useful stories in total, most important first inside each section. Use "global" only for news outside India.
Do NOT pick these concepts again (already explained recently): {used_concepts}

Stories already covered in the last few days. Do NOT include them again unless today's items report a genuinely new development (for example a new amount, a result, or a completed deal); if you do, say what is new in the title:
{recent_titles}"""


class AIError(RuntimeError):
    pass


def _post_json(url: str, payload: dict, headers: dict, timeout: int = 180) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json", **headers}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _get_json(url: str, headers: dict, timeout: int = 60) -> dict:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _http_error_text(exc: urllib.error.HTTPError) -> str:
    try:
        return exc.read().decode("utf-8", errors="replace")[:500]
    except Exception:  # noqa: BLE001
        return ""


GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"


def _version_key(name: str) -> tuple:
    nums = [int(n) for n in re.findall(r"\d+", name)]
    return tuple(nums) + (0,) * (4 - len(nums))


def list_gemini_models(key: str) -> list[str]:
    """Flash models this key can use, newest first; 'lite' models go last (fallback only)."""
    try:
        data = _get_json(f"{GEMINI_BASE}/models?pageSize=200", {"x-goog-api-key": key})
    except Exception as exc:  # noqa: BLE001
        log(f"  could not list Gemini models: {exc}")
        return []
    names = []
    for m in data.get("models", []):
        name = m.get("name", "").removeprefix("models/")
        methods = m.get("supportedGenerationMethods", [])
        if "generateContent" not in methods or "flash" not in name:
            continue
        if re.search(r"image|tts|audio|live|embed|preview|exp|thinking|8b", name):
            continue
        names.append(name)
    full = sorted((n for n in names if "lite" not in n), key=_version_key, reverse=True)
    lite = sorted((n for n in names if "lite" in n), key=_version_key, reverse=True)
    return full + lite


def discover_gemini_model(key: str) -> str | None:
    models = [m for m in list_gemini_models(key) if "lite" not in m]
    return models[0] if models else None


BUSY_CODES = (429, 500, 502, 503, 504)
GEMINI_WAITS = (20, 45)  # seconds to wait before retrying the same model


def call_gemini(system: str, user: str) -> tuple[str, str]:
    """Try Gemini models one after another. A busy model (503 'high demand') is retried
    twice, then the next model is tried, because overload is usually per model."""
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        raise AIError("GEMINI_API_KEY is not set")
    preferred = [os.environ.get("GEMINI_MODEL", "").strip(), "gemini-flash-latest", "gemini-2.5-flash"]
    models = [m for m in dict.fromkeys(preferred) if m]
    payload = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": {"temperature": 0.4, "responseMimeType": "application/json"},
    }
    tried: list[str] = []
    problems: list[str] = []
    listed = False
    while True:
        model = next((m for m in models if m not in tried), None)
        if model is None:
            if listed:
                break
            listed = True
            extra = [m for m in list_gemini_models(key) if m not in tried][:4]
            fallbacks = [m for m in ("gemini-flash-lite-latest",) if m not in tried and m not in extra]
            models.extend(extra + fallbacks)
            continue
        tried.append(model)
        url = f"{GEMINI_BASE}/models/{urllib.parse.quote(model)}:generateContent"
        for attempt in range(len(GEMINI_WAITS) + 1):
            try:
                data = _post_json(url, payload, {"x-goog-api-key": key})
                cand = (data.get("candidates") or [{}])[0]
                parts = (cand.get("content") or {}).get("parts") or []
                text = "".join(p.get("text", "") for p in parts if not p.get("thought"))
                if not text.strip():
                    reason = cand.get("finishReason") or (data.get("promptFeedback") or {}).get("blockReason") or "no text"
                    problems.append(f"{model}: empty answer ({reason})")
                    log(f"  {model} gave an empty answer ({reason}), trying another model")
                    break
                return text, f"gemini:{model}"
            except urllib.error.HTTPError as exc:
                detail = _http_error_text(exc)
                if exc.code == 404 or (exc.code == 400 and "model" in detail.lower() and "not" in detail.lower()):
                    log(f"  model {model} not available, trying another")
                    break
                if exc.code in (401, 403) or (exc.code == 400 and "api key" in detail.lower()):
                    raise AIError(f"Gemini rejected the API key (HTTP {exc.code}). Check the GEMINI_API_KEY secret.") from exc
                if exc.code in BUSY_CODES:
                    if attempt < len(GEMINI_WAITS):
                        wait = GEMINI_WAITS[attempt]
                        log(f"  {model} busy (HTTP {exc.code}), retrying in {wait}s")
                        time.sleep(wait)
                        continue
                    problems.append(f"{model}: busy (HTTP {exc.code})")
                    log(f"  {model} still busy, trying another model")
                    break
                raise AIError(f"Gemini HTTP {exc.code}: {detail}") from exc
            except urllib.error.URLError as exc:
                if attempt < len(GEMINI_WAITS):
                    time.sleep(15)
                    continue
                problems.append(f"{model}: network error ({exc})")
                break
    summary = "; ".join(problems) if problems else f"tried {tried}"
    raise AIError(f"All Gemini models failed or were busy. {summary}. The backup run later this morning will try again.")


def call_openai(system: str, user: str) -> tuple[str, str]:
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not key:
        raise AIError("OPENAI_API_KEY is not set")
    model = os.environ.get("OPENAI_MODEL", "").strip() or "gpt-5-mini"
    payload = {
        "model": model,
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
        "response_format": {"type": "json_object"},
    }
    for attempt in range(3):
        try:
            data = _post_json("https://api.openai.com/v1/chat/completions", payload, {"Authorization": f"Bearer {key}"})
            return data["choices"][0]["message"]["content"], f"openai:{model}"
        except urllib.error.HTTPError as exc:
            if exc.code in (429, 500, 502, 503, 504) and attempt < 2:
                time.sleep(30 * (attempt + 1))
                continue
            raise AIError(f"OpenAI HTTP {exc.code}: {_http_error_text(exc)}") from exc
        except (KeyError, IndexError) as exc:
            raise AIError(f"unexpected OpenAI response: {exc}") from exc
    raise AIError("OpenAI failed")


def ask_ai(system: str, user: str) -> tuple[dict, str]:
    has_gemini = bool(os.environ.get("GEMINI_API_KEY", "").strip())
    has_openai = bool(os.environ.get("OPENAI_API_KEY", "").strip())
    preferred = os.environ.get("AI_PROVIDER", "").strip().lower()
    order: list = []
    if preferred == "openai":
        order = [call_openai, call_gemini]
    else:
        order = [call_gemini, call_openai]
    order = [f for f in order if (f is call_gemini and has_gemini) or (f is call_openai and has_openai)]
    if not order:
        raise AIError("No AI key found. Add GEMINI_API_KEY (or OPENAI_API_KEY) as a GitHub Actions secret.")
    errors = []
    for fn in order:
        try:
            text, used = fn(system, user)
            return parse_ai_json(text), used
        except (AIError, ValueError) as exc:
            log(f"  ! {fn.__name__}: {exc}")
            errors.append(str(exc))
    raise AIError(" | ".join(errors))


def parse_ai_json(text: str) -> dict:
    t = text.strip()
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t)
    try:
        return json.loads(t)
    except json.JSONDecodeError:
        start, end = t.find("{"), t.rfind("}")
        if start != -1 and end > start:
            return json.loads(t[start : end + 1])
        raise ValueError("AI did not return JSON")


# ---------------------------------------------------------------------------
# Assemble the brief
# ---------------------------------------------------------------------------


def format_candidates(cands: list[Item]) -> str:
    lines = []
    for i, it in enumerate(cands):
        region = "" if it.region == "india" else " [GLOBAL]"
        snippet = it.snippet[:300]
        lines.append(f"{i} | {it.source}{region} | {it.title} | {snippet}")
    return "\n".join(lines)


def _s(v, limit: int) -> str:
    if not isinstance(v, str):
        return ""
    v = re.sub(r"\s+", " ", v).strip()
    return v[:limit]


def assemble(result: dict, cands: list[Item], date: str, model: str, feeds_ok: int, scanned: int) -> dict:
    sections: dict[str, list[dict]] = {s: [] for s, _ in SECTIONS}
    used_ids: set[int] = set()
    for st in result.get("stories", []) or []:
        if not isinstance(st, dict):
            continue
        ids = []
        for raw in st.get("ids", []) or []:
            try:
                i = int(raw)
            except (TypeError, ValueError):
                continue
            if 0 <= i < len(cands) and i not in ids:
                ids.append(i)
        ids = [i for i in ids if i not in used_ids]
        title, summary = _s(st.get("title"), 160), _s(st.get("summary"), 700)
        if not ids or not title or not summary:
            continue
        used_ids.update(ids)
        section = st.get("section") if st.get("section") in SECTION_IDS else "startups"
        links: list[dict] = []
        seen: set[str] = set()
        for i in ids:
            for src, url in [(cands[i].source, cands[i].url), *cands[i].also]:
                cu = canonical_url(url)
                if cu not in seen and len(links) < 3:
                    seen.add(cu)
                    links.append({"source": src, "url": url})
        published = [cands[i].published for i in ids if cands[i].published]
        sections[section].append({
            "title": title,
            "summary": summary,
            "whyItMatters": _s(st.get("why_it_matters"), 500),
            "sector": _s(st.get("sector"), 30) or None,
            "amount": _s(st.get("amount"), 40) or None,
            "stage": _s(st.get("stage"), 40) or None,
            "links": links,
            "publishedAt": max(published).isoformat() if published else None,
        })

    total = sum(len(v) for v in sections.values())
    if total < MIN_STORIES:
        raise AIError(f"AI returned only {total} usable stories")

    concept = result.get("concept") if isinstance(result.get("concept"), dict) else {}
    tldr = [_s(t, 240) for t in (result.get("tldr") or []) if _s(t, 240)][:5]
    return {
        "date": date,
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "generatedBy": model,
        "feedsRead": feeds_ok,
        "storiesScanned": scanned,
        "tldr": tldr,
        "sections": [
            {"id": sid, "title": label, "stories": sections[sid]}
            for sid, label in SECTIONS
            if sections[sid]
        ],
        "concept": {
            "term": _s(concept.get("term"), 80),
            "explanation": _s(concept.get("explanation"), 1200),
            "example": _s(concept.get("example"), 600),
        } if concept.get("term") else None,
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--date", help="Brief date YYYY-MM-DD (default: today in India)")
    ap.add_argument("--dry-run", action="store_true", help="Fetch and filter only; print candidates")
    ap.add_argument("--fixtures", type=Path, help="Read feeds from local XML files (testing)")
    ap.add_argument("--now", help="Override current time (ISO, testing)")
    ap.add_argument("--force", action="store_true", help="Rebuild even if today's brief already exists")
    args = ap.parse_args(argv)

    now = parse_date(args.now) if args.now else datetime.now(timezone.utc)
    if now is None:
        log("Invalid --now")
        return 2
    date = args.date or now.astimezone(IST).date().isoformat()
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
        log("Invalid --date, use YYYY-MM-DD")
        return 2

    log(f"Daily Brief for {date}")
    if (OUTPUT_DIR / f"{date}.json").exists() and not args.force and not args.dry_run:
        log("Today's brief already exists, so this backup run has nothing to do.")
        return 0
    log("Reading feeds…")
    items, feeds_ok = collect(load_sources(), args.fixtures)
    if feeds_ok == 0:
        return fail("No news feeds could be read. The feed sites may be down or blocking GitHub; it will retry tomorrow.")

    cands = select_candidates(items, now, recently_published_urls(date))
    log(f"{len(items)} items read, {len(cands)} relevant candidates")
    if args.dry_run:
        for i, it in enumerate(cands):
            log(f"{i:>2} [{it.score}] {it.source}: {it.title}")
        return 0
    if len(cands) < MIN_STORIES:
        return fail(f"Only {len(cands)} relevant stories found today (need {MIN_STORIES}). No brief written.")

    used = recent_concepts()
    user = USER_TEMPLATE.format(
        date=date,
        items=format_candidates(cands),
        used_concepts=", ".join(used) if used else "none yet",
        recent_titles="\n".join(f"- {t}" for t in recent_story_titles(date)) or "- none",
    )
    log("Asking the AI to simplify…")
    try:
        result, model = ask_ai(SYSTEM_PROMPT, user)
        brief = assemble(result, cands, date, model, feeds_ok, len(items))
    except AIError as exc:
        return fail(f"AI step failed: {exc}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUTPUT_DIR / f"{date}.json"
    out.write_text(json.dumps(brief, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    n = sum(len(s["stories"]) for s in brief["sections"])
    log(f"Wrote {out.relative_to(ROOT)} with {n} stories ({model})")
    for old in prune_old_briefs(date):
        log(f"Removed {old} (older than {KEEP_DAYS} days)")
    return 0


def prune_old_briefs(today: str) -> list[str]:
    """Keep only the briefs from the last KEEP_DAYS days (today included). Older ones stay in git history."""
    cutoff = (datetime.fromisoformat(today) - timedelta(days=KEEP_DAYS - 1)).date().isoformat()
    removed = []
    for path in sorted(OUTPUT_DIR.glob("*.json")):
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", path.stem) and path.stem < cutoff:
            path.unlink()
            removed.append(path.name)
    return removed


if __name__ == "__main__":
    sys.exit(main())
