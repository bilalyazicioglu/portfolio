import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminPath, isAdminRequestAllowed } from "@/lib/admin-gate";
import { siteConfig } from "@/site.config";

/** The one host every page declares as its canonical — see `siteConfig.url`. */
const CANONICAL_HOST = new URL(siteConfig.url).host;

export function proxy(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const ip =
    request.headers.get("cf-connecting-ip") ||
    forwardedFor.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "-";
  const method = request.method;
  const path = request.nextUrl.pathname;
  const ua = request.headers.get("user-agent") ?? "-";

  console.log(`[access] ip=${ip} method=${method} path=${path} ua=${ua}`);

  // A page must live at exactly one address. www and the apex serve the same
  // app, so send www to the apex instead of letting search engines collect two
  // copies of every URL. Tailnet hostnames are untouched — they never match.
  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
  if (host === `www.${CANONICAL_HOST}`) {
    return NextResponse.redirect(
      new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, siteConfig.url),
      301
    );
  }

  // Admin surface exists only for requests arriving over the tailnet.
  // For everyone else it must be indistinguishable from a route that does not exist.
  if (isAdminPath(path) && !isAdminRequestAllowed(request.headers)) {
    console.log(`[admin-denied] ip=${ip} path=${path} host=${request.headers.get("host") ?? "-"}`);
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher:
    "/((?!metrics|_next/static|_next/image|favicon.ico|favicon-48x48.png|icon.png|icon-48.png|icon-192.png|icon-512.png|apple-touch-icon.png|apple-icon.png|og-image.png|opengraph-image.png|robots.txt|sitemap.xml|manifest.webmanifest).*)",
};
