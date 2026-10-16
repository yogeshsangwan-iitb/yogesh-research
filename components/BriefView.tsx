import Link from "next/link";
import type { CSSProperties } from "react";
import Reveal from "@/components/Reveal";
import type { Brief, BriefStory, BriefSummary } from "@/lib/news";
import { formatBriefDate, formatShortDate, storyCount } from "@/lib/news";

type BriefViewProps = {
  brief: Brief;
  edition: number;
  isLatest: boolean;
  newer: string | null;
  older: string | null;
  archive: BriefSummary[];
};

export default function BriefView({ brief, edition, isLatest, newer, older, archive }: BriefViewProps) {
  const total = storyCount(brief);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
      {/* Masthead */}
      <header className="pt-14 sm:pt-20">
        <div className="intro-rule h-px w-full bg-ink" />
        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
          <p className="intro-fade text-sm text-stone">
            {isLatest ? "Latest edition" : "From the archive"}, no.{" "}
            <span className="tabular">{edition}</span>
          </p>
          <nav aria-label="Other days" className="intro-fade flex gap-5 text-sm">
            {older ? (
              <Link className="link-underline" href={`/news/${older}`}>
                Previous day
              </Link>
            ) : (
              <span className="text-stone/60">Previous day</span>
            )}
            {newer ? (
              <Link className="link-underline" href={`/news/${newer}`}>
                Next day
              </Link>
            ) : (
              <span className="text-stone/60">Next day</span>
            )}
          </nav>
        </div>
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

      <Archive archive={archive} current={brief.date} />

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

function Archive({ archive, current }: { archive: BriefSummary[]; current: string }) {
  const others = archive.filter((a) => a.date !== current).slice(0, 30);
  if (others.length === 0) return null;
  return (
    <Reveal as="section" className="mt-20">
      <div className="flex items-baseline justify-between border-t border-ink pt-4">
        <h2 className="text-2xl font-semibold tracking-tight">Earlier briefs</h2>
        <span className="tabular text-sm text-stone">{archive.length} in total</span>
      </div>
      <ul className="divide-y divide-rule border-b border-rule">
        {others.map((a) => (
          <li key={a.date}>
            <Link
              href={`/news/${a.date}`}
              className="ledger-row grid grid-cols-[4.5rem_1fr] gap-4 px-1 py-4 sm:grid-cols-[4.5rem_1fr_7rem]"
            >
              <span className="tabular text-sm text-stone">{formatShortDate(a.date)}</span>
              <span className="ledger-title truncate">{a.lead ?? `Brief no. ${a.edition}`}</span>
              <span className="tabular hidden text-right text-sm text-stone sm:block">{a.storyCount} stories</span>
            </Link>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
