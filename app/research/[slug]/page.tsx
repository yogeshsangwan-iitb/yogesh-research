import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllSlugs, getArticleBySlug } from "@/lib/content";
import { notFound } from "next/navigation";
import StartupLogo from "@/components/StartupLogo";
import IndustryMark from "@/components/IndustryMark";
import Figure from "@/components/Figure";
import Sources from "@/components/Sources";
import Reveal from "@/components/Reveal";
import ReportReader from "@/components/ReportReader";

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
  const { meta } = article;
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "article",
      images: meta.cover ? [{ url: meta.cover }] : undefined,
    },
  };
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
  const keyFigures = Array.isArray(meta.keyFigures) ? meta.keyFigures.filter((k) => k && k.label && k.value) : [];
  const report = meta.report?.pdf ? meta.report : null;

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
          {meta.view ? (
            <div className="rounded-[10px] bg-ink px-5 py-4 text-paper">
              <p className="text-xs text-paper/70">My view</p>
              <p className="mt-1 text-lg font-semibold leading-snug">{meta.view}</p>
            </div>
          ) : meta.category === "Startups" ? (
            <StartupLogo logo={meta.logo} name={meta.title} size={72} />
          ) : (
            <IndustryMark size={72} />
          )}
        </div>
      </header>

      {meta.cover && (
        <div className="intro-photo relative mt-10 aspect-[2.4/1] w-full overflow-hidden rounded-[10px] bg-paper-deep">
          <Image
            src={meta.cover}
            alt={meta.coverAlt ?? ""}
            fill
            priority
            sizes="(min-width: 1152px) 1104px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <dl className="intro-fade mt-10 grid grid-cols-2 border-y border-ink sm:grid-cols-4">
        {facts.map((f, n) => (
          <div key={f.label} className={`py-4 pr-4 ${n > 0 ? "sm:border-l sm:border-rule sm:pl-5" : ""}`}>
            <dt className="text-xs text-stone">{f.label}</dt>
            <dd className="mt-1 font-medium">{f.value}</dd>
          </div>
        ))}
      </dl>

      {keyFigures.length > 0 && (
        <section aria-label="Key figures" className="mt-12">
          <h2 className="text-lg font-semibold">Key figures</h2>
          <ul className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-rule bg-rule md:grid-cols-3">
            {keyFigures.map((k, n) => (
              <Reveal as="li" variant="pop" index={n} key={k.label} className="bg-paper p-5">
                <p className="text-sm text-stone">{k.label}</p>
                <p className="tabular mt-2 text-[clamp(1.35rem,2.6vw,2rem)] font-semibold leading-tight tracking-tight">
                  {k.value}
                </p>
                {k.note && <p className="mt-1 text-sm text-stone">{k.note}</p>}
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      {report ? (
        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-14">
          <aside className="lg:order-2">
            <ReportReader title={meta.title} pdf={report.pdf} docx={report.docx} pages={report.pages} />
          </aside>
          <article className="prose prose-lg prose-report min-w-0 max-w-none lg:order-1">
            <MDXRemote source={content} components={mdxComponents} />
          </article>
        </div>
      ) : (
        <article className="prose prose-lg prose-report mt-14 max-w-3xl">
          <MDXRemote source={content} components={mdxComponents} />
        </article>
      )}
    </main>
  );
}
