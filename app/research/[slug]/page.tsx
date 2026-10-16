import type { Metadata } from "next";
import Link from "next/link";
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

function load(slug: string) {
  try {
    return getArticleBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = load(slug);
  if (!article) return { title: "Research" };
  return { title: article.meta.title, description: article.meta.description };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = load(slug);
  if (!article) notFound();

  const { meta, content } = article;
  const facts = [
    { label: "Category", value: meta.category },
    { label: "Sector", value: meta.subcategory },
    { label: "Published", value: meta.date },
    { label: "Reading time", value: meta.readingTime },
  ].filter((f) => f.value);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
      <Link href="/research" className="intro-fade link-underline text-sm text-stone">
        Back to research
      </Link>
      <div className="intro-rule mt-6 h-px w-full bg-ink" />

      <header className="mt-10 grid gap-8 lg:grid-cols-[1fr_16rem] lg:gap-16">
        <div>
          <h1 className="intro-line max-w-4xl text-[clamp(2.3rem,5.4vw,4.4rem)] font-semibold leading-[1] tracking-[-0.035em]">
            {meta.title}
          </h1>
          {meta.description && (
            <p className="intro-fade mt-6 max-w-2xl text-xl leading-relaxed text-stone">{meta.description}</p>
          )}
        </div>
        <div className="intro-fade lg:justify-self-end">
          {meta.category === "Startups" ? (
            <StartupLogo logo={meta.logo} name={meta.title} size={72} />
          ) : (
            <IndustryMark size={72} />
          )}
        </div>
      </header>

      <dl className="intro-fade mt-12 grid grid-cols-2 border-y border-ink sm:grid-cols-4">
        {facts.map((f, n) => (
          <div key={f.label} className={`py-4 pr-4 ${n > 0 ? "sm:border-l sm:border-rule sm:pl-5" : ""}`}>
            <dt className="text-xs text-stone">{f.label}</dt>
            <dd className="mt-1 font-medium">{f.value}</dd>
          </div>
        ))}
      </dl>

      <article className="prose prose-lg prose-report mt-14 max-w-3xl">
        <MDXRemote source={content} components={mdxComponents} />
      </article>
    </main>
  );
}
