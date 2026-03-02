# Bypassr AI — Search visibility checklist

So people can find you when they search **"bypassr ai"** or **"bypass ai"**, the site needs to be indexed and associated with those terms. Here’s what’s in place and what to do next.

## Winning queries (Search Console)

Optimized for these top queries: **bypass turnitin ai**, **ai humanizer**, **bypass turnitin ai detector**, **bypassai**. Key pages: homepage, `/humanize`, `/help/bypass-turnitin`. Meta titles, descriptions, keywords, and on-page copy target these terms; homepage also has FAQ schema for rich results.

## Already in place

- **Meta title & description** include "Bypassr AI", "bypass AI", "AI humanizer" (root layout and key pages).
- **H1 on homepage** is now "Bypassr AI — Humanize AI Text & Bypass AI Detection" so the brand and main keywords are in the main heading.
- **JSON-LD structured data** (WebSite + Organization) so search engines can recognize the site and brand.
- **Keywords** meta tag with "bypassr ai", "bypass ai", "AI humanizer", etc.
- **Sitemap** at `https://bypassrai.com/sitemap.xml` (and referenced in `robots.ts`).
- **Robots** allow crawling; only `/account`, `/api/`, `/auth/` are disallowed.

## What you should do next (main reason you get no traction)

1. **Submit the sitemap to Google**
   - Go to [Google Search Console](https://search.google.com/search-console).
   - Add the property `https://bypassrai.com` (or your production domain).
   - In **Sitemaps**, submit: `https://bypassrai.com/sitemap.xml`.
   - Use **URL Inspection** → “Request indexing” for the homepage and `/humanize` so they get crawled soon.

2. **Submit to Bing**
   - [Bing Webmaster Tools](https://www.bing.com/webmasters) → add site → submit the same sitemap URL.

3. **Give it time**
   - New or low-authority sites often take days or weeks to show up for branded terms like "bypassr ai". Indexing and ranking improve after sitemap submission and a few crawls.

4. **Optional: production URL in sitemap**
   - If you use a different production URL (e.g. Vercel URL), set `NEXT_PUBLIC_APP_URL` in production so `robots.ts` and any dynamic sitemap use that base. The static `public/sitemap.xml` is hardcoded to `https://bypassrai.com`; update it if your live domain is different.

## Why you might not see the site when searching

- The site isn’t submitted or isn’t indexed yet (fix with Search Console + sitemap).
- The domain is **bypassrai.com** (one word); people often search **"bypassr ai"** (with a space). The new title, description, H1, and JSON-LD all use "Bypassr AI" so search engines can associate the brand with your site.
- Competition for "bypass ai" is high; ranking for the exact brand "bypassr ai" is more realistic once the site is indexed and verified.

After submitting the sitemap and requesting indexing for the main URLs, re-check in a few days with queries like `bypassr ai` and `site:bypassrai.com`.
