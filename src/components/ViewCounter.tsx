"use client";

import { useEffect, useState } from "react";

export function ViewCounter({
  slug,
  initialViews,
}: {
  slug: string;
  initialViews?: number;
}) {
  const [views, setViews] = useState<number | null>(initialViews ?? null);

  useEffect(() => {
    fetch(`/api/views/${slug}`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.count === "number") {
          setViews(data.count);
        }
      })
      .catch((err) => {
        console.error("ViewCounter fetch error:", err);
      });
  }, [slug]);

  const displayCount = views ?? initialViews ?? 0;

  return (
    <span className="font-ui text-[11px] uppercase tracking-wider text-muted">
      👁️ {displayCount} okunma
    </span>
  );
}
