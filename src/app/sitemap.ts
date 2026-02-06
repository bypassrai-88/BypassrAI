import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bypassrai.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/humanize",
    "/ai-check",
    "/paraphrase",
    "/grammar-checker",
    "/summarizer",
    "/translator",
    "/pricing",
    "/help",
    "/help/how-it-works",
    "/contact",
    "/privacy",
    "/terms",
    "/login",
    "/signup",
  ];

  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/pricing" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/humanize" ? 0.9 : 0.8,
  }));
}
