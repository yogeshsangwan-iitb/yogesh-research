"use client";

import { useState, type CSSProperties } from "react";
import type { ArticleMeta } from "@/lib/content";
import ResearchRow from "@/components/ResearchRow";

const filters = ["All", "Startups", "Industries"] as const;

export default function ResearchPageClient({ articles }: { articles: ArticleMeta[] }) {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");

  const filtered = articles.filter((item) => (activeFilter === "All" ? true : item.category === activeFilter));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
      <div className="intro-rule h-px w-full bg-ink" />
      <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
        <h1 className="intro-line text-[clamp(2.6rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.035em]">
          Research
        </h1>
        <div role="group" aria-label="Filter research" className="intro-fade flex rounded-full border border-rule p-1">
          {filters.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors duration-300 ${
                  active ? "bg-ink text-paper" : "text-stone hover:text-ink"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>
      <p className="intro-fade mt-6 max-w-xl text-lg leading-relaxed text-stone">
        Long-form notes on companies and industries: how they make money, what the numbers say, and what could go
        wrong.
      </p>

      <div key={activeFilter} className="ledger mt-12">
        {filtered.length > 0 ? (
          filtered.map((article, n) => (
            <div key={article.slug} className="intro-line" style={{ "--i": Math.min(n, 6) - 2 } as CSSProperties}>
              <ResearchRow article={article} />
            </div>
          ))
        ) : (
          <p className="py-10 text-stone">Nothing in this category yet. Try another filter.</p>
        )}
      </div>
    </main>
  );
}
