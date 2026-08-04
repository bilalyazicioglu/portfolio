import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getViewCount, recordView } from "@/lib/views";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const count = getViewCount(slug);
  return NextResponse.json({ count });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const ip =
    request.headers.get("cf-connecting-ip") ||
    forwardedFor.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const count = recordView(slug, ip);
  return NextResponse.json({ count });
}
