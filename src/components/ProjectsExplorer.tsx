"use client";

import { useMemo, useState } from "react";
import type { Project, ProjectCategory } from "@/lib/projects";
import { ProjectCard } from "@/components/ProjectCard";

const categories: (ProjectCategory | "All")[] = ["All", "Open Source", "Private"];

export function ProjectsExplorer({ projects }: { projects: Project[] }) {
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [query, setQuery] = useState("");

  const featured = projects.find((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  const filtered = useMemo(() => {
    return rest.filter((project) => {
      const matchesCategory =
        category === "All" || project.category === category;
      const matchesQuery = project.name
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [category, query, rest]);

  return (
    <div className="flex flex-col gap-8 px-4 py-8 sm:px-6">
      {featured && (
        <div>
          <p className="mb-3 font-ui text-[11px] font-bold uppercase tracking-wider text-muted">
            Featured
          </p>
          <ProjectCard project={featured} />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-2 font-ui text-xs font-bold uppercase tracking-wider transition-colors ${
                category === cat
                  ? "bg-ink text-surface"
                  : "border border-ink/20 text-ink/60 hover:border-ink hover:text-ink"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects"
            className="w-full rounded-full border border-ink/20 bg-transparent py-2 pl-9 pr-4 font-ui text-xs uppercase tracking-wider placeholder:text-ink/40 focus:border-ink focus:outline-none sm:w-56"
          />
          <svg
            aria-hidden
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40"
          >
            <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" />
            <path
              d="M12 12L9 9"
              stroke="currentColor"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      ) : (
        <p className="py-10 text-center font-ui text-xs uppercase tracking-wider text-muted">
          No projects match your search.
        </p>
      )}
    </div>
  );
}
