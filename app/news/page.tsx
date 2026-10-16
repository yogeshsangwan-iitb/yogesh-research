import type { Metadata } from "next";
import Link from "next/link";
import BriefView from "@/components/BriefView";
import { getAllBriefDates, getBriefArchive, getEdition, getLatestBrief } from "@/lib/news";

export const metadata: Metadata = {
  title: "Daily brief",
  description: "Today's startup, venture capital and finance news, simplified into plain English.",
};

export default function NewsPage() {
  const brief = getLatestBrief();

  if (!brief) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
        <div className="intro-rule h-px w-full bg-ink" />
        <h1 className="mt-8 text-[clamp(2.6rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.035em]">
          Daily brief
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone">
          The first brief is published at 6:45 AM India time. It collects the morning&rsquo;s startup, venture
          capital and finance news and rewrites it in plain English.
        </p>
        <Link href="/research" className="btn btn-line mt-8">
          Read the research instead
        </Link>
      </main>
    );
  }

  const dates = getAllBriefDates();
  const idx = dates.indexOf(brief.date);

  return (
    <BriefView
      brief={brief}
      edition={getEdition(brief.date)}
      isLatest
      newer={null}
      older={dates[idx + 1] ?? null}
      archive={getBriefArchive()}
    />
  );
}
