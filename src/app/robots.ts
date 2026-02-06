import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bypassrai.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/account", "/account/", "/api/", "/auth/"] },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
