import Link from "next/link";
import StartupLogo from "@/components/StartupLogo";
import IndustryMark from "@/components/IndustryMark";

type ResearchCardProps = {
  slug: string;
  title: string;
  category: string;
  logo?: string;
  size?: "large" | "small";
};

export default function ResearchCard({
  slug,
  title,
  category,
  logo,
  size = "small",
}: ResearchCardProps) {
  const isLarge = size === "large";

  return (
    <Link
      href={`/research/${slug}`}
      className={`flex flex-col items-center justify-center gap-4 rounded-sm border border-neutral-200 text-center transition hover:border-neutral-400 ${
        isLarge ? "p-12" : "p-8"
      }`}
    >
      {category === "Startups" ? (
        <StartupLogo logo={logo} name={title} size={isLarge ? 72 : 48} />
      ) : (
        <IndustryMark size={isLarge ? 72 : 48} />
      )}
      <h3 className={`font-semibold ${isLarge ? "text-xl" : "text-sm"}`}>
        {title}
      </h3>
    </Link>
  );
}