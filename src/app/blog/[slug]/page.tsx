import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllSlugs, getPostBySlug } from "@/lib/blog";
import { CtaBand } from "@/components/CtaBand";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = getPostBySlug(slug);
    return { title: post.title, description: post.summary };
  } catch {
    return {};
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let post;
  try {
    post = getPostBySlug(slug);
  } catch {
    notFound();
  }

  return (
    <>
      <div className="border-b-[1.5px] border-ink px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-1.5 font-ui text-xs font-bold uppercase tracking-wider text-ink/60 hover:text-accent"
        >
          ← Back to blog
        </Link>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="font-ui text-[11px] uppercase tracking-wider text-muted">
            {formatDate(post.date)}
          </span>
          <span className="text-ink/20">/</span>
          <span className="font-ui text-[11px] uppercase tracking-wider text-muted">
            {post.readingTime}
          </span>
        </div>
        <h1 className="font-display text-3xl leading-[1.2] sm:text-5xl">
          {post.title}
        </h1>
        <div className="mt-5 flex flex-wrap gap-2">
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

      <article className="prose-post px-4 py-10 sm:px-6">
        <MDXRemote source={post.content} />
      </article>

      <CtaBand label="Have thoughts on this?" highlight="Send me a note." />
    </>
  );
}
