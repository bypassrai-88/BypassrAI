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

## “Page with redirect” in Google Search Console

If GSC shows **Page with redirect** (e.g. for `https://www.bypassrai.com/`, `http://bypassrai.com/`, `http://www.bypassrai.com/`), that’s expected. Those URLs **redirect** to the canonical site; Google does **not** index the redirecting URL, it indexes the **destination**.

- **Canonical site (this is what gets indexed):** `https://bypassrai.com` (no `www`, HTTPS).
- **Redirects:** `http` → `https`, and `www` → non-`www`, with **301** so Google consolidates to the canonical URL.
- **What to do in GSC:**
  1. Use **one property**: `https://bypassrai.com` (no www). Add it as the only property (or the primary one).
  2. Submit the sitemap for that property: `https://bypassrai.com/sitemap.xml`.
  3. Use **URL Inspection** on `https://bypassrai.com/`, `https://bypassrai.com/humanize`, etc. (the canonical URLs), and request indexing for those. Do **not** request indexing for the www or http URLs.
  4. You can ignore “Validate fix” for the redirect URLs: they will always redirect by design. What matters is that the canonical URLs are indexed (check with `site:bypassrai.com` in Google).
- **On the site:** Key pages have `<link rel="canonical">` pointing to `https://bypassrai.com/...` so even if a crawler lands on a variant, the HTML on the final URL states the canonical. Sitemap and internal links use `https://bypassrai.com` only.

## Why you might not see the site when searching

- The site isn’t submitted or isn’t indexed yet (fix with Search Console + sitemap).
- The domain is **bypassrai.com** (one word); people often search **"bypassr ai"** (with a space). The new title, description, H1, and JSON-LD all use "Bypassr AI" so search engines can associate the brand with your site.
- Competition for "bypass ai" is high; ranking for the exact brand "bypassr ai" is more realistic once the site is indexed and verified.

After submitting the sitemap and requesting indexing for the main URLs, re-check in a few days with queries like `bypassr ai` and `site:bypassrai.com`.
