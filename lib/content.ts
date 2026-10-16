import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDirectory = path.join(process.cwd(), "content");

export type KeyFigure = {
  label: string;
  value: string;
  note?: string;
};

export type ReportFiles = {
  /** PDF shown in the side reader, e.g. /reports/<slug>/Report.pdf */
  pdf: string;
  /** Optional original Word file offered as a download */
  docx?: string;
  pages?: number;
};

export type ArticleMeta = {
  slug: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  date: string;
  readingTime: string;
  featured?: boolean;
  logo?: string;
  /** Wide image shown under the title */
  cover?: string;
  coverAlt?: string;
  /** One-line verdict, e.g. "Positive but conditional" */
  view?: string;
  keyFigures?: KeyFigure[];
  /** The full report files, when the article summarises a report */
  report?: ReportFiles;
};

export function getAllSlugs(): string[] {
  return fs
    .readdirSync(contentDirectory)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

export function getArticleBySlug(slug: string) {
  const filePath = path.join(contentDirectory, `${slug}.mdx`);
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    meta: { slug, ...data } as ArticleMeta,
    content,
  };
}

export function getAllArticles(): ArticleMeta[] {
  return getAllSlugs()
    .map((slug) => getArticleBySlug(slug).meta)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getFeaturedArticle(): ArticleMeta | undefined {
  return getAllArticles().find((article) => article.featured);
}