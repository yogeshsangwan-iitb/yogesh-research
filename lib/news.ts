import fs from "fs";
import path from "path";

// Shape of content/news/YYYY-MM-DD.json, written daily by scripts/news/build_brief.py

export type BriefLink = { source: string; url: string };

export type BriefStory = {
  title: string;
  summary: string;
  whyItMatters: string;
  sector: string | null;
  amount: string | null;
  stage: string | null;
  links: BriefLink[];
  publishedAt: string | null;
};

export type BriefSection = {
  id: string;
  title: string;
  stories: BriefStory[];
};

export type Brief = {
  date: string;
  generatedAt: string;
  generatedBy: string;
  feedsRead: number;
  storiesScanned: number;
  tldr: string[];
  sections: BriefSection[];
  concept: { term: string; explanation: string; example: string } | null;
};

export type BriefSummary = {
  date: string;
  edition: number;
  storyCount: number;
  lead: string | null;
};

const newsDirectory = path.join(process.cwd(), "content", "news");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** All brief dates, oldest first. */
function allDatesAscending(): string[] {
  if (!fs.existsSync(newsDirectory)) return [];
  return fs
    .readdirSync(newsDirectory)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .filter((d) => DATE_RE.test(d))
    .sort();
}

/** All brief dates, newest first. */
export function getAllBriefDates(): string[] {
  return allDatesAscending().reverse();
}

export function getBrief(date: string): Brief | null {
  if (!DATE_RE.test(date)) return null;
  const filePath = path.join(newsDirectory, `${date}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as Partial<Brief>;
    return {
      date,
      generatedAt: data.generatedAt ?? "",
      generatedBy: data.generatedBy ?? "",
      feedsRead: data.feedsRead ?? 0,
      storiesScanned: data.storiesScanned ?? 0,
      tldr: Array.isArray(data.tldr) ? data.tldr : [],
      sections: Array.isArray(data.sections)
        ? data.sections.filter((s) => s && Array.isArray(s.stories) && s.stories.length > 0)
        : [],
      concept: data.concept?.term ? data.concept : null,
    };
  } catch {
    return null;
  }
}

export function getLatestBrief(): Brief | null {
  for (const date of getAllBriefDates()) {
    const brief = getBrief(date);
    if (brief) return brief;
  }
  return null;
}

/** Edition number: 1 for the first brief ever published, counting up. */
export function getEdition(date: string): number {
  return allDatesAscending().indexOf(date) + 1;
}

export function storyCount(brief: Brief): number {
  return brief.sections.reduce((n, s) => n + s.stories.length, 0);
}

export function getBriefArchive(): BriefSummary[] {
  const ascending = allDatesAscending();
  return ascending
    .map((date, i) => {
      const brief = getBrief(date);
      return {
        date,
        edition: i + 1,
        storyCount: brief ? storyCount(brief) : 0,
        lead: brief?.sections[0]?.stories[0]?.title ?? null,
      };
    })
    .reverse();
}

/** "Friday, 16 October 2026" */
export function formatBriefDate(date: string, opts: { weekday?: boolean } = { weekday: true }): string {
  const d = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: opts.weekday ? "long" : undefined,
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

/** "16 Oct" */
export function formatShortDate(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(d);
}
