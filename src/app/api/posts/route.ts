import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/blog";

/**
 * The published post list, for the in-page terminal's `ls blog` and `open`.
 *
 * It is a route rather than props baked into the layout because in production
 * posts live on a Docker volume and publishing only revalidates /blog and the
 * post's own page — a list compiled into the layout would go stale. Everything
 * here is already public in the sitemap.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const posts = getAllPosts().map(({ slug, title, date }) => ({
    slug,
    title,
    date,
  }));

  return NextResponse.json(
    { posts },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}
