import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BriefView from "@/components/BriefView";
import { formatBriefDate, getAllBriefDates, getBrief, getRecentBriefs } from "@/lib/news";

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
  // Only the last 7 days are available to readers
  const brief = getAllBriefDates().includes(date) ? getBrief(date) : null;
  if (!brief) notFound();

  return <BriefView brief={brief} days={getRecentBriefs()} />;
}
