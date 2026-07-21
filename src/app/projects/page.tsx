import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { ProjectsExplorer } from "@/components/ProjectsExplorer";
import { CtaBand } from "@/components/CtaBand";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "A selection of products, open source, and experiments.",
};

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        eyebrow={`Projects [${String(projects.length).padStart(2, "0")}]`}
        titleLines={["PRO_", "JECTS"]}
        backHref="/"
        backLabel="Back to home"
      >
        <p className="max-w-lg text-sm leading-relaxed text-ink/70">
          Products, open source libraries, and experiments I&apos;ve built
          and shipped. Filter by category or search by name.
        </p>
      </PageHeader>
      <ProjectsExplorer projects={projects} />
      <CtaBand
        label="Have something in mind?"
        highlight="Let's build it together."
      />
    </>
  );
}
