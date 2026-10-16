import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import Reveal from "@/components/Reveal";
import ResearchRow from "@/components/ResearchRow";
import { getAllArticles } from "@/lib/content";
import { formatBriefDate, getLatestBrief } from "@/lib/news";

const focusAreas = [
  {
    title: "Startups",
    text: "Business models, unit economics and due diligence on companies worth a closer look.",
  },
  {
    title: "Industries",
    text: "How a sector makes money, where the margins sit, and who is likely to win.",
  },
  {
    title: "Markets and policy",
    text: "RBI, SEBI and the wider economy, read for what they change for founders and investors.",
  },
  {
    title: "The daily brief",
    text: "Each morning’s venture capital and startup news, rewritten in plain English.",
  },
];

const principles = [
  {
    title: "Sources before opinions",
    text: "Filings, company statements and data come first. Every claim in a report points back to where it came from.",
  },
  {
    title: "Numbers you can check",
    text: "Market sizes, revenue and valuations are shown with their assumptions, so a reader can redo the maths.",
  },
  {
    title: "Plain English",
    text: "Jargon is explained the first time it appears. If a sentence needs a finance degree, it gets rewritten.",
  },
];

const i = (n: number) => ({ "--i": n }) as CSSProperties;

export default function Home() {
  const articles = getAllArticles();
  const brief = getLatestBrief();
  const topStories = brief
    ? brief.sections.flatMap((s) => s.stories.slice(0, 2).map((story) => ({ story, section: s.title }))).slice(0, 4)
    : [];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      {/* Opening */}
      <section className="pb-20 pt-12 sm:pt-16 lg:pb-28">
        <div className="intro-rule h-px w-full bg-ink" />
        <div className="mt-10 grid items-end gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
          <div>
            <h1 className="text-[clamp(2.6rem,5.6vw,4.6rem)] font-semibold leading-[0.98] tracking-[-0.04em]">
              <span className="intro-line" style={i(0)}>
                Learning to read
              </span>
              <span className="intro-line" style={i(1)}>
                startups the way
              </span>
              <span className="intro-line" style={i(2)}>
                an investor does.
              </span>
            </h1>
            <p className="intro-fade mt-8 max-w-[34rem] text-lg leading-relaxed text-stone" style={i(1)}>
              I&rsquo;m Yogesh, an engineering student at IIT Bombay. I write research on startups and industries,
              and publish a plain-English brief of venture capital news every morning.
            </p>
            <div className="intro-fade mt-9 flex flex-wrap gap-3" style={i(2)}>
              <Link href="/news" className="btn btn-rust">
                Read today&rsquo;s brief
              </Link>
              <Link href="/research" className="btn btn-line">
                Browse the research
              </Link>
            </div>
          </div>

          <div className="intro-photo relative mx-auto w-full max-w-[440px] overflow-hidden rounded-[10px] bg-paper-deep lg:mx-0 lg:justify-self-end">
            <Image
              src="/cover-desk.jpg"
              alt="A walnut desk with a laptop and a few books in a quiet office"
              width={447}
              height={447}
              priority
              className="aspect-square h-auto w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* This morning's brief */}
      {brief && topStories.length > 0 && (
        <section className="border-t border-ink py-16 sm:py-20">
          <div className="grid gap-10 md:grid-cols-[1fr_1.6fr] md:gap-16">
            <Reveal>
              <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                This morning&rsquo;s brief
              </h2>
              <p className="mt-3 text-stone">{formatBriefDate(brief.date)}</p>
              {brief.tldr[0] && <p className="mt-6 max-w-sm text-lg leading-relaxed">{brief.tldr[0]}</p>}
              <Link href="/news" className="btn btn-line mt-8">
                Read the full brief
              </Link>
            </Reveal>
            <ul className="divide-y divide-rule border-y border-rule">
              {topStories.map(({ story, section }, n) => (
                <Reveal as="li" variant="pop" index={n} key={`${section}-${n}`}>
                  <Link href="/news" className="ledger-row block px-1 py-5">
                    <span className="text-sm text-stone">
                      {section}
                      {story.amount ? <span className="tabular font-semibold text-rust">, {story.amount}</span> : null}
                    </span>
                    <span className="ledger-title mt-1 block text-lg font-semibold leading-snug sm:text-xl">
                      {story.title}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-stone">{story.summary}</span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* What I research */}
      <section className="border-t border-ink py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <Reveal>
            <h2 className="max-w-md text-[clamp(2.2rem,4.6vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
              Good investing starts with careful reading.
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-stone">
              Behind every funding round is a bet on a market, a team and a set of numbers. This site is where I work
              through those bets in writing, one company and one industry at a time.
            </p>
          </Reveal>
          <ul className="border-t border-ink">
            {focusAreas.map((area, n) => (
              <Reveal as="li" index={n} key={area.title} className="border-b border-rule py-6">
                <h3 className="text-lg font-semibold">{area.title}</h3>
                <p className="mt-1 text-stone">{area.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Latest research */}
      {articles.length > 0 && (
        <section className="py-16 sm:py-20">
          <Reveal className="flex items-end justify-between gap-6 pb-6">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Latest research</h2>
            <Link href="/research" className="link-underline shrink-0 text-sm">
              All research
            </Link>
          </Reveal>
          <Reveal className="ledger">
            {articles.slice(0, 5).map((article) => (
              <ResearchRow key={article.slug} article={article} />
            ))}
          </Reveal>
        </section>
      )}

      {/* How the work is done */}
      <section className="mb-24 rounded-[10px] bg-paper-deep px-6 py-14 sm:px-10 sm:py-16">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How the research is written</h2>
        </Reveal>
        <div className="mt-8 grid gap-8 border-t border-ink/30 pt-8 md:grid-cols-3">
          {principles.map((p, n) => (
            <Reveal key={p.title} index={n}>
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-2 leading-relaxed text-stone">{p.text}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
