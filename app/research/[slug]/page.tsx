import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllSlugs, getArticleBySlug } from "@/lib/content";
import { notFound } from "next/navigation";
import StartupLogo from "@/components/StartupLogo";
import IndustryMark from "@/components/IndustryMark";
import Figure from "@/components/Figure";
import Sources from "@/components/Sources";

const mdxComponents = { Figure, Sources };

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let article;
  try {
    article = getArticleBySlug(slug);
  } catch {
    notFound();
  }

  const { meta, content } = article!;

  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <div className="mb-6">
        {meta.category === "Startups" ? (
          <StartupLogo logo={meta.logo} name={meta.title} size={56} />
        ) : (
          <IndustryMark size={56} />
        )}
      </div>
      <p className="text-sm uppercase tracking-wide text-neutral-500">
        {meta.category}
      </p>
      <h1 className="mt-2 text-4xl font-bold">{meta.title}</h1>
      <p className="mt-4 text-lg text-neutral-600">{meta.description}</p>
      <p className="mt-4 text-sm text-neutral-400">
        {meta.subcategory} · {meta.date} · {meta.readingTime} read
      </p>

      <article className="prose prose-neutral mt-12 max-w-none">
        <MDXRemote source={content} components={mdxComponents} />
      </article>
    </main>
  );
}