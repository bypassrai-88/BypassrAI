import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPortfolioMode } from "@/config/site-variant";

const canonicalHost = "bypassrai.com";

export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Portfolio mode: humanizer & detector-focused pages → neutral destinations
  if (isPortfolioMode()) {
    if (url.pathname === "/humanize") {
      return NextResponse.redirect(new URL("/essay-writer", url), 307);
    }
    if (
      url.pathname === "/help/bypass-turnitin" ||
      url.pathname === "/help/humanize-ai-text-for-school" ||
      url.pathname === "/help/ai-detector-tips"
    ) {
      return NextResponse.redirect(new URL("/help", url), 307);
    }
    if (url.pathname === "/ai-check") {
      return NextResponse.redirect(new URL("/summarizer", url), 307);
    }
  }

  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];

  // Only redirect when on production domain (bypassrai.com or www)
  if (host !== "bypassrai.com" && host !== "www.bypassrai.com") {
    return NextResponse.next();
  }

  const isWww = host === "www.bypassrai.com";
  const isHttp = request.headers.get("x-forwarded-proto") === "http";

  if (isWww || isHttp) {
    const canonicalUrl = new URL(`https://${canonicalHost}${url.pathname}${url.search}`);
    return NextResponse.redirect(canonicalUrl, 301);
  }

  return NextResponse.next();
}
