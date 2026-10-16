import Link from "next/link";
import type { CSSProperties } from "react";
import Reveal from "@/components/Reveal";
import type { Brief, BriefStory, BriefSummary } from "@/lib/news";
import { formatBriefDate, storyCount } from "@/lib/news";

type BriefViewProps = {
  brief: Brief;
  /** The briefs a reader can switch between (last 7 days), newest first */
  days: BriefSummary[];
};

export default function BriefView({ brief, days }: BriefViewProps) {
  const total = storyCount(brief);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
      {/* Masthead */}
      <header className="pt-14 sm:pt-20">
        <div className="intro-rule h-px w-full bg-ink" />
        <DayPicker days={days} current={brief.date} />
        <h1 className="mt-6 text-[clamp(2.6rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.035em]">
          <span className="intro-line" style={{ "--i": 0 } as CSSProperties}>
            Daily brief
          </span>
          <span className="intro-line text-stone" style={{ "--i": 1 } as CSSProperties}>
            {formatBriefDate(brief.date)}
          </span>
        </h1>
        <p className="intro-fade mt-6 max-w-2xl text-base leading-relaxed text-stone" style={{ "--i": 2 } as CSSProperties}>
          {total} stories on startups, venture capital and the economy, rewritten in plain English
          {brief.feedsRead > 0 ? ` from ${brief.feedsRead} news sources` : ""}. Each one links to the original report.
        </p>
      </header>

      {/* In one minute */}
      {brief.tldr.length > 0 && (
        <Reveal as="section" className="mt-14 grid gap-4 border-t border-ink pt-6 md:grid-cols-[14rem_1fr] md:gap-10">
          <h2 className="text-lg font-semibold">In one minute</h2>
          <ul className="divide-y divide-rule">
            {brief.tldr.map((line, i) => (
              <li key={i} className="flex gap-4 py-3 text-lg leading-snug">
                <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-rust" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      )}

      <div className="mt-16 grid gap-10 md:grid-cols-[14rem_1fr]">
        {/* Section index */}
        <aside className="hidden md:block">
          <nav aria-label="Sections" className="sticky top-24">
            <ul className="space-y-2 text-sm">
              {brief.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex justify-between gap-3 text-stone hover:text-rust">
                    <span>{s.title}</span>
                    <span className="tabular">{s.stories.length}</span>
                  </a>
                </li>
              ))}
              {brief.concept && (
                <li>
                  <a href="#concept" className="text-stone hover:text-rust">
                    Concept of the day
                  </a>
                </li>
              )}
            </ul>
          </nav>
        </aside>

        <div className="min-w-0">
          {brief.sections.map((section) => (
            <section key={section.id} id={section.id} className="mb-16 scroll-mt-24">
              <Reveal className="flex items-baseline justify-between border-t border-ink pt-4">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{section.title}</h2>
                <span className="tabular text-sm text-stone">
                  {section.stories.length} {section.stories.length === 1 ? "story" : "stories"}
                </span>
              </Reveal>
              <div className="divide-y divide-rule">
                {section.stories.map((story, i) => (
                  <StoryEntry key={`${section.id}-${i}`} story={story} index={i} />
                ))}
              </div>
            </section>
          ))}

          {brief.concept && (
            <Reveal
              as="section"
              variant="pop"
              id="concept"
              className="scroll-mt-24 rounded-[10px] bg-ink px-6 py-10 text-paper sm:px-10 sm:py-12"
            >
              <h2 className="text-sm font-medium text-paper/70">Concept of the day</h2>
              <p className="mt-3 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-none tracking-[-0.03em]">
                {brief.concept.term}
              </p>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/90">{brief.concept.explanation}</p>
              {brief.concept.example && (
                <div className="mt-8 max-w-2xl border-l-2 border-rust pl-5">
                  <p className="text-sm font-semibold text-[#e3a587]">For example</p>
                  <p className="mt-1 leading-relaxed text-paper/85">{brief.concept.example}</p>
                </div>
              )}
            </Reveal>
          )}
        </div>
      </div>


    </main>
  );
}

function StoryEntry({ story, index }: { story: BriefStory; index: number }) {
  const facts = [story.sector, story.stage, story.amount].filter(Boolean) as string[];
  return (
    <Reveal as="article" variant="pop" index={Math.min(index, 4)} className="py-8">
      {facts.length > 0 && (
        <ul className="flex flex-wrap gap-2 text-xs">
          {facts.map((f) => (
            <li
              key={f}
              className={
                f === story.amount
                  ? "tabular rounded-full bg-rust/10 px-2.5 py-1 font-semibold text-rust"
                  : "rounded-full border border-rule px-2.5 py-1 text-stone"
              }
            >
              {f}
            </li>
          ))}
        </ul>
      )}
      <h3 className="mt-3 text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{story.title}</h3>
      <p className="mt-3 max-w-[68ch] leading-relaxed text-ink-soft">{story.summary}</p>
      {story.whyItMatters && (
        <div className="mt-4 max-w-[68ch]">
          <p className="text-sm font-semibold text-rust">Why a VC would care</p>
          <p className="mt-1 leading-relaxed text-ink-soft">{story.whyItMatters}</p>
        </div>
      )}
      {story.links.length > 0 && (
        <p className="mt-4 text-sm text-stone">
          Read the original:{" "}
          {story.links.map((l, i) => (
            <span key={l.url}>
              {i > 0 && ", "}
              <a className="link-underline text-ink" href={l.url} target="_blank" rel="noopener noreferrer">
                {l.source}
              </a>
            </span>
          ))}
        </p>
      )}
    </Reveal>
  );
}

function dayParts(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { ...o, timeZone: "Asia/Kolkata" }).format(d);
  return { weekday: fmt({ weekday: "short" }), day: fmt({ day: "numeric" }), month: fmt({ month: "short" }) };
}

function DayPicker({ days, current }: { days: BriefSummary[]; current: string }) {
  if (days.length === 0) return null;
  const newest = days[0].date;
  return (
    <nav aria-label="Choose a day" className="intro-fade mt-6">
      <p className="text-sm text-stone">
        Pick a day <span className="text-stone/70">(last {days.length === 1 ? "1 day" : `${days.length} days`})</span>
      </p>
      <ul className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {days.map((d) => {
          const active = d.date === current;
          const { weekday, day, month } = dayParts(d.date);
          return (
            <li key={d.date} className="shrink-0">
              <Link
                href={d.date === newest ? "/news" : `/news/${d.date}`}
                aria-current={active ? "page" : undefined}
                className={`flex min-w-[4.75rem] flex-col items-center rounded-[8px] border px-3 py-2 transition-[background-color,border-color,transform] duration-300 hover:-translate-y-0.5 ${
                  active ? "border-ink bg-ink text-paper" : "border-rule bg-paper hover:border-ink"
                }`}
              >
                <span className={`text-xs ${active ? "text-paper/75" : "text-stone"}`}>
                  {d.date === newest ? "Latest" : weekday}
                </span>
                <span className="tabular text-xl font-semibold leading-tight">{day}</span>
                <span className={`text-xs ${active ? "text-paper/75" : "text-stone"}`}>{month}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
