import { getAllArticles } from "@/lib/content";
import ResearchPageClient from "./ResearchPageClient";

export default function ResearchPage() {
  const articles = getAllArticles();
  return <ResearchPageClient articles={articles} />;
}