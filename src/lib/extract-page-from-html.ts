/**
 * Server-side helpers to parse HTML from fetched URLs (summarizer link mode).
 * No extra dependencies — regex-based meta extraction + plain-text strip.
 */

export function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) && code > 0 ? String.fromCharCode(code) : _;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
      const code = parseInt(h, 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : _;
    });
}

function metaByProp(html: string, prop: string): string | null {
  const forward = new RegExp(
    `<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']*)["']`,
    "i"
  );
  const backward = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${prop}["']`,
    "i"
  );
  let m = html.match(forward);
  if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  m = html.match(backward);
  if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  return null;
}

function metaByName(html: string, name: string): string | null {
  const forward = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`,
    "i"
  );
  const backward = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`,
    "i"
  );
  let m = html.match(forward);
  if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  m = html.match(backward);
  if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  return null;
}

export function extractHeadline(html: string): string {
  const og = metaByProp(html, "og:title");
  if (og) return og;
  const twTitle = metaByName(html, "twitter:title");
  if (twTitle) return twTitle;
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch?.[1]) {
    return decodeHtmlEntities(titleMatch[1].replace(/\s+/g, " ").trim());
  }
  return "";
}

export function extractDescription(html: string): string {
  return (
    metaByProp(html, "og:description") ||
    metaByName(html, "twitter:description") ||
    metaByName(html, "description") ||
    ""
  );
}

function pushResolved(url: string, baseHref: string, out: string[]) {
  try {
    const abs = new URL(url.trim(), baseHref).href;
    if (abs.startsWith("http://") || abs.startsWith("https://")) {
      out.push(abs);
    }
  } catch {
    // ignore
  }
}

export function extractPreviewImages(html: string, baseHref: string, max = 6): string[] {
  const out: string[] = [];
  const ogRe =
    /<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = ogRe.exec(html)) !== null) {
    pushResolved(m[1], baseHref, out);
  }
  const ogRevRe =
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/gi;
  while ((m = ogRevRe.exec(html)) !== null) {
    pushResolved(m[1], baseHref, out);
  }
  const twRe =
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/gi;
  while ((m = twRe.exec(html)) !== null) {
    pushResolved(m[1], baseHref, out);
  }
  const twRevRe =
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/gi;
  while ((m = twRevRe.exec(html)) !== null) {
    pushResolved(m[1], baseHref, out);
  }
  return Array.from(new Set(out)).slice(0, max);
}

export function htmlToPlainText(html: string, maxChars: number): string {
  const stripped = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.slice(0, maxChars);
}

export function buildSummarizePayloadFromPage(
  html: string,
  pageUrl: string,
  maxPlainChars: number
): { headline: string; description: string; images: string[]; text: string } {
  const headline = extractHeadline(html);
  const description = extractDescription(html);
  const images = extractPreviewImages(html, pageUrl);
  const plain = htmlToPlainText(html, maxPlainChars);
  const parts = [headline, description, plain].filter(Boolean);
  const text = parts.join("\n\n").slice(0, maxPlainChars);
  return { headline, description, images, text };
}

/** Block obvious SSRF targets (localhost, private IPs, metadata hosts). */
export function isUrlAllowedForFetch(raw: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return { ok: false, reason: "Invalid URL." };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return { ok: false, reason: "Only http and https links are supported." };
  }
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "0.0.0.0" ||
    host.endsWith(".internal")
  ) {
    return { ok: false, reason: "That address cannot be fetched." };
  }
  if (host === "metadata.google.internal" || host.endsWith(".metadata.google.internal")) {
    return { ok: false, reason: "That address cannot be fetched." };
  }
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 10) return { ok: false, reason: "That address cannot be fetched." };
    if (a === 172 && b >= 16 && b <= 31) return { ok: false, reason: "That address cannot be fetched." };
    if (a === 192 && b === 168) return { ok: false, reason: "That address cannot be fetched." };
    if (a === 127) return { ok: false, reason: "That address cannot be fetched." };
    if (a === 169 && b === 254) return { ok: false, reason: "That address cannot be fetched." };
    if (a === 0) return { ok: false, reason: "That address cannot be fetched." };
  }
  if (host === "::1" || host === "0:0:0:0:0:0:0:1") {
    return { ok: false, reason: "That address cannot be fetched." };
  }
  return { ok: true, url: u };
}
