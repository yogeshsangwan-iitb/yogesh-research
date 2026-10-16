import Link from "next/link";
import type { ArticleMeta } from "@/lib/content";

export default function ResearchRow({ article }: { article: ArticleMeta }) {
  return (
    <Link
      href={`/research/${article.slug}`}
      className="ledger-row grid gap-x-8 gap-y-2 px-1 py-6 sm:grid-cols-[9rem_1fr_8rem] sm:items-baseline"
    >
      <span className="text-sm text-stone">
        {article.category}
        {article.subcategory ? <span className="block text-stone/70">{article.subcategory}</span> : null}
      </span>
      <span>
        <span className="ledger-title block text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
          {article.title}
        </span>
        {article.description && (
          <span className="mt-2 block max-w-[62ch] leading-relaxed text-stone">{article.description}</span>
        )}
      </span>
      <span className="tabular text-sm text-stone sm:text-right">
        {article.date}
        {article.readingTime ? <span className="block text-stone/70">{article.readingTime} read</span> : null}
      </span>
    </Link>
  );
}
