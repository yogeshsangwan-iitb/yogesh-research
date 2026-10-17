"""Tests for the Daily Brief builder. Run: python -m unittest discover scripts/news/tests"""

import json
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest import mock

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))

import build_brief as bb  # noqa: E402

FIXTURES = HERE / "fixtures"
NOW = datetime(2026, 10, 16, 1, 15, tzinfo=timezone.utc)


def load_items():
    items, ok = bb.collect(bb.load_sources(), FIXTURES)
    return items, ok


class ParsingTests(unittest.TestCase):
    def test_reads_rss_atom_and_broken_xml(self):
        items, ok = load_items()
        self.assertEqual(ok, 4)
        sources = {i.source for i in items}
        self.assertEqual(sources, {"Inc42", "Entrackr", "TechCrunch Venture", "Mint Markets"})
        by_url = {i.url: i for i in items}
        atom = by_url["https://example.com/tc/sequoia-fund"]
        self.assertEqual(atom.published, datetime(2026, 10, 15, 18, tzinfo=timezone.utc))
        broken = by_url["https://example.com/entrackr/zipp"]
        self.assertIn("&", broken.snippet)
        self.assertNotIn("&amp;", broken.snippet)

    def test_cleans_html_and_boilerplate(self):
        items, _ = load_items()
        kredo = next(i for i in items if i.source == "Inc42" and "Kredo" in i.title)
        self.assertIn("₹120 Cr", kredo.snippet)
        self.assertNotIn("<", kredo.snippet)
        self.assertNotIn("appeared first", kredo.snippet)


class SelectionTests(unittest.TestCase):
    def test_filters_dedupes_and_ranks(self):
        items, _ = load_items()
        cands = bb.select_candidates(items, NOW, set())
        titles = [c.title for c in cands]
        self.assertFalse(any("Horoscope" in t for t in titles), "noise removed")
        self.assertFalse(any("Old News" in t for t in titles), "old items removed")
        self.assertFalse(any("gainers" in t.lower() for t in titles), "stock-tip noise removed")
        self.assertFalse(any("Disrupt" in t for t in titles), "event promotions removed")
        kredo = [c for c in cands if "kredo" in c.title.lower()]
        self.assertEqual(len(kredo), 1, "same story from two papers merged")
        self.assertEqual(len(kredo[0].also), 1)
        self.assertTrue(any("RBI" in t for t in titles))
        self.assertGreaterEqual(kredo[0].score, 8, "funding + multi-source boosts score")

    def test_excludes_already_published(self):
        items, _ = load_items()
        exclude = {bb.canonical_url("https://example.com/tc/lumen")}
        cands = bb.select_candidates(items, NOW, exclude)
        self.assertFalse(any("Lumen" in c.title for c in cands))

    def test_canonical_url_strips_tracking(self):
        self.assertEqual(
            bb.canonical_url("https://Example.com/a/b/?utm_source=rss&id=3"),
            "https://example.com/a/b?id=3",
        )


FAKE_AI = {
    "tldr": ["Kredo raised ₹120 Cr.", "RBI held rates."],
    "stories": [
        {"ids": [0], "section": "funding", "sector": "Fintech", "title": "Kredo raises ₹120 Cr Series B",
         "summary": "Kredo raised money.", "why_it_matters": "Lending is hot.", "amount": "₹120 Cr", "stage": "Series B"},
        {"ids": ["1"], "section": "vc", "sector": "VC", "title": "Sequoia closes fund", "summary": "New fund.",
         "why_it_matters": "More capital.", "amount": "$750M", "stage": None},
        {"ids": [2], "section": "nonsense", "sector": "AI", "title": "Lumen raises", "summary": "AI round.",
         "why_it_matters": "AI.", "amount": None, "stage": None},
        {"ids": [3], "section": "economy", "sector": "Macro", "title": "RBI holds", "summary": "Rates same.",
         "why_it_matters": "Cost of money.", "amount": None, "stage": None},
        {"ids": [4], "section": "startups", "sector": "Q-comm", "title": "Zipp shuts", "summary": "Closed.",
         "why_it_matters": "Burn.", "amount": None, "stage": None},
        {"ids": [5], "section": "exits", "sector": "Markets", "title": "SEBI SME IPO", "summary": "Rules.",
         "why_it_matters": "Exits.", "amount": None, "stage": None},
        {"ids": [999], "section": "funding", "title": "Hallucinated", "summary": "x"},
        {"ids": [0], "section": "funding", "title": "Duplicate use of id 0", "summary": "x"},
    ],
    "concept": {"term": "Series B", "explanation": "A later funding round.", "example": "Kredo."},
}


class AssembleTests(unittest.TestCase):
    def test_assemble_maps_links_and_validates(self):
        items, ok = load_items()
        cands = bb.select_candidates(items, NOW, set())
        self.assertGreaterEqual(len(cands), 6)
        kredo_id = next(i for i, c in enumerate(cands) if "kredo" in c.title.lower())
        fake = json.loads(json.dumps(FAKE_AI))
        order = [kredo_id] + [i for i in range(len(cands)) if i != kredo_id]
        for story in fake["stories"]:
            story["ids"] = [order[int(i)] if int(i) < len(order) else int(i) for i in story["ids"]]
        brief = bb.assemble(fake, cands, "2026-10-16", "test:model", ok, len(items))
        all_stories = [s for sec in brief["sections"] for s in sec["stories"]]
        self.assertEqual(len(all_stories), 6, "invalid and duplicate ids dropped")
        self.assertNotIn("Hallucinated", [s["title"] for s in all_stories])
        funding = next(s for s in brief["sections"] if s["id"] == "funding")["stories"][0]
        self.assertEqual(funding["title"], "Kredo raises ₹120 Cr Series B")
        self.assertEqual(len(funding["links"]), 2, "primary + other paper's link")
        self.assertEqual({l["source"] for l in funding["links"]}, {"Inc42", "Entrackr"})
        for s in all_stories:
            for link in s["links"]:
                self.assertTrue(link["url"].startswith("https://example.com/"))
        ids = [s["id"] for s in brief["sections"]]
        self.assertEqual(ids, [i for i, _ in bb.SECTIONS if i in ids], "section order fixed")
        self.assertIn("startups", ids, "unknown section falls back to startups")

    def test_too_few_stories_fails(self):
        items, ok = load_items()
        cands = bb.select_candidates(items, NOW, set())
        with self.assertRaises(bb.AIError):
            bb.assemble({"stories": FAKE_AI["stories"][:2]}, cands, "2026-10-16", "m", ok, 1)

    def test_parse_ai_json_handles_fences(self):
        self.assertEqual(bb.parse_ai_json('```json\n{"a": 1}\n```'), {"a": 1})
        self.assertEqual(bb.parse_ai_json('Here: {"a": 2} done'), {"a": 2})


class EndToEndTests(unittest.TestCase):
    def test_main_writes_brief(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            with mock.patch.object(bb, "OUTPUT_DIR", out), \
                 mock.patch.object(bb, "ask_ai", return_value=(FAKE_AI, "test:model")), \
                 mock.patch.object(bb, "ROOT", out.parent):
                code = bb.main(["--fixtures", str(FIXTURES), "--now", NOW.isoformat()])
            self.assertEqual(code, 0)
            data = json.loads((out / "2026-10-16.json").read_text(encoding="utf-8"))
            self.assertEqual(data["date"], "2026-10-16")
            self.assertEqual(data["concept"]["term"], "Series B")
            self.assertEqual(data["generatedBy"], "test:model")

    def test_no_key_fails_cleanly(self):
        with mock.patch.dict("os.environ", {"GEMINI_API_KEY": "", "OPENAI_API_KEY": ""}):
            with self.assertRaises(bb.AIError):
                bb.ask_ai("s", "u")


class GeminiTests(unittest.TestCase):
    def test_falls_back_when_model_missing(self):
        import urllib.error

        calls = []

        def fake_post(url, payload, headers, timeout=180):
            calls.append(url)
            if "gemini-flash-latest" in url:
                raise urllib.error.HTTPError(url, 404, "nf", {}, None)
            return {"candidates": [{"content": {"parts": [
                {"text": "thinking...", "thought": True}, {"text": '{"ok": true}'}]}}]}

        with mock.patch.dict("os.environ", {"GEMINI_API_KEY": "k", "GEMINI_MODEL": ""}), \
             mock.patch.object(bb, "_post_json", side_effect=fake_post):
            text, used = bb.call_gemini("s", "u")
        self.assertEqual(text, '{"ok": true}')
        self.assertEqual(used, "gemini:gemini-2.5-flash")
        self.assertEqual(len(calls), 2)

    def test_discovers_model(self):
        listing = {"models": [
            {"name": "models/gemini-2.5-flash", "supportedGenerationMethods": ["generateContent"]},
            {"name": "models/gemini-3.5-flash", "supportedGenerationMethods": ["generateContent"]},
            {"name": "models/gemini-3.5-flash-lite", "supportedGenerationMethods": ["generateContent"]},
            {"name": "models/text-embedding-004", "supportedGenerationMethods": ["embedContent"]},
        ]}
        with mock.patch.object(bb, "_get_json", return_value=listing):
            self.assertEqual(bb.discover_gemini_model("k"), "gemini-3.5-flash")


class HousekeepingTests(unittest.TestCase):
    def test_prune_keeps_last_seven_days(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            for d in ["2026-10-08", "2026-10-09", "2026-10-10", "2026-10-12", "2026-10-16"]:
                (out / f"{d}.json").write_text("{}", encoding="utf-8")
            (out / "notes.json").write_text("{}", encoding="utf-8")
            with mock.patch.object(bb, "OUTPUT_DIR", out):
                removed = bb.prune_old_briefs("2026-10-16")
            self.assertEqual(removed, ["2026-10-08.json", "2026-10-09.json"])
            left = sorted(p.name for p in out.glob("*.json"))
            self.assertEqual(left, ["2026-10-10.json", "2026-10-12.json", "2026-10-16.json", "notes.json"])

    def test_failure_is_annotated_on_github(self):
        import io
        from contextlib import redirect_stdout
        buf = io.StringIO()
        with mock.patch.dict("os.environ", {"GITHUB_ACTIONS": "true"}), redirect_stdout(buf):
            code = bb.fail("No AI key found.\nsecond line")
        self.assertEqual(code, 1)
        self.assertIn("::error title=Daily Brief::No AI key found.%0Asecond line", buf.getvalue())


class GeminiBusyTests(unittest.TestCase):
    def _http(self, url, code):
        import urllib.error
        return urllib.error.HTTPError(url, code, "x", {}, None)

    def test_busy_model_falls_back_to_next(self):
        calls = []

        def fake_post(url, payload, headers, timeout=180):
            calls.append(url)
            if "gemini-flash-latest" in url:
                raise self._http(url, 503)
            return {"candidates": [{"content": {"parts": [{"text": '{"ok": 1}'}]}}]}

        with mock.patch.dict("os.environ", {"GEMINI_API_KEY": "k", "GEMINI_MODEL": ""}), \
             mock.patch.object(bb, "_post_json", side_effect=fake_post), \
             mock.patch.object(bb.time, "sleep") as slept:
            text, used = bb.call_gemini("s", "u")
        self.assertEqual(used, "gemini:gemini-2.5-flash")
        self.assertEqual(sum("gemini-flash-latest" in c for c in calls), 3, "busy model retried twice")
        self.assertEqual([c.args[0] for c in slept.call_args_list], [20, 45])

    def test_all_busy_gives_clear_error(self):
        listing = {"models": [{"name": "models/gemini-3.5-flash", "supportedGenerationMethods": ["generateContent"]}]}

        def always_busy(url, payload, headers, timeout=180):
            raise self._http(url, 503)

        with mock.patch.dict("os.environ", {"GEMINI_API_KEY": "k", "GEMINI_MODEL": ""}), \
             mock.patch.object(bb, "_post_json", side_effect=always_busy), \
             mock.patch.object(bb, "_get_json", return_value=listing), \
             mock.patch.object(bb.time, "sleep"):
            with self.assertRaises(bb.AIError) as ctx:
                bb.call_gemini("s", "u")
        msg = str(ctx.exception)
        for m in ["gemini-flash-latest", "gemini-2.5-flash", "gemini-3.5-flash", "gemini-flash-lite-latest"]:
            self.assertIn(m, msg)

    def test_bad_key_stops_immediately(self):
        n = []

        def bad_key(url, payload, headers, timeout=180):
            n.append(url)
            raise self._http(url, 403)

        with mock.patch.dict("os.environ", {"GEMINI_API_KEY": "k"}), \
             mock.patch.object(bb, "_post_json", side_effect=bad_key):
            with self.assertRaises(bb.AIError):
                bb.call_gemini("s", "u")
        self.assertEqual(len(n), 1)

    def test_backup_run_skips_when_brief_exists(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            (out / "2026-10-16.json").write_text("{}", encoding="utf-8")
            with mock.patch.object(bb, "OUTPUT_DIR", out), mock.patch.object(bb, "collect") as collect:
                code = bb.main(["--now", NOW.isoformat()])
            self.assertEqual(code, 0)
            collect.assert_not_called()


class RepeatTests(unittest.TestCase):
    def test_recent_titles_exclude_today_and_feed_prompt(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            def write(day, title):
                (out / f"{day}.json").write_text(json.dumps({"sections": [{"stories": [{"title": title}]}]}), encoding="utf-8")
            write("2026-10-12", "Too old")
            write("2026-10-14", "Older story")
            write("2026-10-15", "Middle story")
            write("2026-10-16", "RapidCanvas raises $29M")
            write("2026-10-17", "Today's own story")
            with mock.patch.object(bb, "OUTPUT_DIR", out):
                titles = bb.recent_story_titles("2026-10-17")
            self.assertEqual(titles, ["Older story", "Middle story", "RapidCanvas raises $29M"])
        prompt = bb.USER_TEMPLATE.format(date="d", items="i", used_concepts="c", recent_titles="- RapidCanvas raises $29M")
        self.assertIn("RapidCanvas raises $29M", prompt)
        self.assertIn("Do NOT include them again", prompt)


if __name__ == "__main__":
    unittest.main()
