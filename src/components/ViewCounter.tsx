"use client";

import { useEffect, useState } from "react";

export function ViewCounter({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    // Record view and fetch updated count
    fetch(`/api/views/${slug}`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => setViews(data.count))
      .catch(() => {
        // Fallback to GET if POST fails
        fetch(`/api/views/${slug}`)
          .then((res) => res.json())
          .then((data) => setViews(data.count))
          .catch(() => setViews(null));
      });
  }, [slug]);

  if (views === null) {
    return <span className="font-ui text-[11px] uppercase tracking-wider text-muted">... okunma</span>;
  }

  return (
    <span className="font-ui text-[11px] uppercase tracking-wider text-muted">
      👁️ {views} okunma
    </span>
  );
}
