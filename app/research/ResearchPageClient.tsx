"use client";

import { useState } from "react";
import type { ArticleMeta } from "@/lib/content";
import ResearchCard from "@/components/ResearchCard";

const filters = ["All", "Startups", "Industries"] as const;

export default function ResearchPageClient({
  articles,
}: {
  articles: ArticleMeta[];
}) {
  const [activeFilter, setActiveFilter] =
    useState<(typeof filters)[number]>("All");

  const filtered = articles.filter((item) =>
    activeFilter === "All" ? true : item.category === activeFilter
  );

  const featured = filtered.slice(0, 2);
  const rest = filtered.slice(2);

  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      <p className="text-sm uppercase tracking-wide text-neutral-500">
        Archive
      </p>
      <h1 className="mt-2 text-4xl font-bold">Research</h1>

      <div className="mt-8 flex gap-4">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`text-sm uppercase tracking-wide ${
              activeFilter === filter
                ? "text-black font-semibold"
                : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {featured.length > 0 && (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {featured.map((item) => (
            <ResearchCard
              key={item.slug}
              slug={item.slug}
              title={item.title}
              category={item.category}
              logo={item.logo}
              size="large"
            />
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {rest.map((item) => (
            <ResearchCard
              key={item.slug}
              slug={item.slug}
              title={item.title}
              category={item.category}
              logo={item.logo}
              size="small"
            />
          ))}
        </div>
      )}
    </main>
  );
}