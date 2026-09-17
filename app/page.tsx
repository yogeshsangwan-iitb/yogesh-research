import Link from "next/link";
import { getAllArticles } from "@/lib/content";
import StartupLogo from "@/components/StartupLogo";
import IndustryMark from "@/components/IndustryMark";

export default function Home() {
  const articles = getAllArticles();

  return (
    <main className="mx-auto max-w-5xl px-6">
      <section className="py-24">
        <p className="text-sm uppercase tracking-wide text-neutral-500">
          Yogesh
        </p>
        <h1 className="mt-3 text-5xl font-bold leading-tight">
          Researching startups,
          <br />
          industries &amp; markets.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-neutral-600">
          Independent research on startups, businesses, industries, markets
          and emerging opportunities.
        </p>
      </section>

      <section className="border-t border-neutral-200 py-16">
        <p className="text-sm uppercase tracking-wide text-neutral-500">
          Latest Research
        </p>

        <div className="mt-8 divide-y divide-neutral-200">
          {articles.map((item, index) => (
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
      </section>
    </main>
  );
}