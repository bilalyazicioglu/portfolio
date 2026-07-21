import { Button } from "@/components/Button";
import { DecorativePlus } from "@/components/DecorativePlus";
import { siteConfig } from "@/site.config";

export function CtaBand({
  label,
  highlight,
}: {
  label: string;
  highlight: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-6 border-t-[1.5px] border-ink px-4 py-8 sm:px-6">
      <p className="font-ui text-sm font-bold uppercase tracking-wide">
        <span className="text-accent">▸ </span>
        {label}{" "}
        <span className="underline decoration-accent decoration-2 underline-offset-4">
          {highlight}
        </span>
      </p>
      <DecorativePlus className="hidden md:block" />
      <div className="flex flex-wrap gap-3">
        <Button href={`mailto:${siteConfig.email}`} variant="primary">
          Get in touch
        </Button>
        <Button href="/projects" variant="outline">
          View projects
        </Button>
      </div>
    </div>
  );
}
