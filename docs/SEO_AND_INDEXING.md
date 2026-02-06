# Getting BypassrAI to show up in search (SEO & indexing)

The app is set up for crawlers and sharing. Use the steps below to get indexed.

---

## What’s already in the app

- **Sitemap** – `https://bypassrai.com/sitemap.xml` lists your main pages so search engines can discover them.
- **robots.txt** – `https://bypassrai.com/robots.txt` allows crawling of public pages and points to the sitemap. Account and API routes are disallowed.
- **Metadata** – Title and description in the layout; **Open Graph** and **Twitter** tags so links to your site look good when shared.
- **metadataBase** – Uses `NEXT_PUBLIC_APP_URL` (set to `https://bypassrai.com` in Vercel) so canonical and OG URLs are correct.

---

## 1. Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console).
2. Add a property: **URL prefix** → enter `https://bypassrai.com`.
3. Verify ownership (e.g. HTML tag in layout, or DNS record – use the option that fits you).
4. After verification, open **Sitemaps** and submit: `https://bypassrai.com/sitemap.xml`.
5. Optionally use **URL Inspection** and “Request indexing” for `https://bypassrai.com` to speed up the first crawl.

---

## 2. Bing Webmaster Tools

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Add your site: `https://bypassrai.com`.
3. Verify (e.g. XML file or meta tag).
4. Submit your sitemap: **Sitemaps** → Add `https://bypassrai.com/sitemap.xml`.

---

## 3. Optional: better social preview image

Right now Open Graph uses your favicon. For a nicer preview when the site is shared (e.g. on Twitter or Slack), add a larger image (e.g. 1200×630) to `public/` (e.g. `og-image.png`) and reference it in `src/app/layout.tsx` under `openGraph.images` (and Twitter if you use a separate image).

---

## 4. After deploying

- Confirm **NEXT_PUBLIC_APP_URL** is set to `https://bypassrai.com` in Vercel so the sitemap and metadata use the right domain.
- Check that these work:
  - https://bypassrai.com/sitemap.xml  
  - https://bypassrai.com/robots.txt  

Indexing can take a few days to a few weeks. Submitting the sitemap and requesting indexing in Search Console usually helps the first crawl happen sooner.
