import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { CtaBand } from "@/components/CtaBand";
import { getAllPosts } from "@/lib/blog";
import { getViewCount } from "@/lib/views";
import { ViewCounter } from "@/components/ViewCounter";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on engineering, design, and process.",
  alternates: {
    canonical: "/blog",
  },
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <PageHeader
        eyebrow={`Posts [${String(posts.length).padStart(2, "0")}]`}
        titleLines={["WRIT_", "INGS"]}
        backHref="/"
        backLabel="Back to home"
      >
        <p className="max-w-lg text-sm leading-relaxed text-ink/70">
          Notes on engineering, design, and the process behind the things I
          build.
        </p>
      </PageHeader>

      <ul className="flex flex-col divide-y divide-ink/10 px-4 sm:px-6">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex flex-col gap-2 py-7 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-ui text-[11px] uppercase tracking-wider text-muted">
                    {formatDate(post.date)}
                  </span>
                  <span className="text-ink/20">/</span>
                  <span className="font-ui text-[11px] uppercase tracking-wider text-muted">
                    {post.readingTime}
                  </span>
                  <span className="text-ink/20">/</span>
                  <ViewCounter
                    slug={post.slug}
                    initialViews={getViewCount(post.slug)}
                    trackView={false}
                  />
                </div>
                <h2 className="font-ui text-lg font-bold group-hover:text-accent">
                  {post.title}
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-ink/70">
                  {post.summary}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-ink/15 px-2.5 py-0.5 font-ui text-[10px] uppercase tracking-wider text-ink/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink text-ink transition-colors group-hover:bg-ink group-hover:text-surface">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 11L11 3M11 3H4.5M11 3V9.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <CtaBand label="Enjoying the writing?" highlight="Get in touch." />
    </>
  );
}
