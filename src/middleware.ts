import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const canonicalHost = "bypassrai.com";

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
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
