import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BriefView from "@/components/BriefView";
import { formatBriefDate, getAllBriefDates, getBrief, getBriefArchive, getEdition } from "@/lib/news";

export function generateStaticParams() {
  return getAllBriefDates().map((date) => ({ date }));
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  const brief = getBrief(date);
  if (!brief) return { title: "Daily brief" };
  return {
    title: `Daily brief, ${formatBriefDate(date, { weekday: false })}`,
    description: brief.tldr[0] ?? "Startup, venture capital and finance news in plain English.",
  };
}

export default async function BriefPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const brief = getBrief(date);
  if (!brief) notFound();

  const dates = getAllBriefDates(); // newest first
  const idx = dates.indexOf(date);

  return (
    <BriefView
      brief={brief}
      edition={getEdition(date)}
      isLatest={idx === 0}
      newer={idx > 0 ? dates[idx - 1] : null}
      older={dates[idx + 1] ?? null}
      archive={getBriefArchive()}
    />
  );
}
