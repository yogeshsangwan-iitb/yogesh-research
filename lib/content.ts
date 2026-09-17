import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDirectory = path.join(process.cwd(), "content");

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