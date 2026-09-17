import { getAllArticles } from "@/lib/content";
import ResearchCard from "@/components/ResearchCard";

export default function Home() {
  const articles = getAllArticles();
  const featured = articles.slice(0, 2);
  const rest = articles.slice(2);

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

        {featured.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </section>
    </main>
  );
}