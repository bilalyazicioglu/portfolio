import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const ip =
    forwardedFor.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "-";
  const method = request.method;
  const path = request.nextUrl.pathname;
  const ua = request.headers.get("user-agent") ?? "-";

  console.log(`[access] ip=${ip} method=${method} path=${path} ua=${ua}`);

  return NextResponse.next();
}

export const config = {
  matcher:
    "/((?!metrics|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
};
