"use client";

import { useState } from "react";
import Link from "next/link";
import type { ArticleMeta } from "@/lib/content";
import StartupLogo from "@/components/StartupLogo";
import IndustryMark from "@/components/IndustryMark";

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

      <div className="mt-10 divide-y divide-neutral-200">
        {filtered.map((item, index) => (
          <Link
            key={item.slug}
            href={`/research/${item.slug}`}
            className="flex items-center gap-6 py-6 hover:opacity-70"
          >
            {item.category === "Startups" ? (
              <StartupLogo logo={item.logo} name={item.title} />
            ) : (
              <IndustryMark />
            )}
            <span className="text-sm text-neutral-400">
              / {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {item.category.toUpperCase()} · {item.subcategory} ·{" "}
                {item.date}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}