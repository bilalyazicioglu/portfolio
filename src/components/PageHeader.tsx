import Link from "next/link";

export function PageHeader({
  eyebrow,
  titleLines,
  backHref,
  backLabel,
  children,
}: {
  eyebrow?: string;
  titleLines: string[];
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b-[1.5px] border-ink px-4 py-8 sm:px-6 sm:py-10">
      {backHref && (
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-1.5 font-ui text-xs font-bold uppercase tracking-wider text-ink/60 hover:text-accent"
        >
          ← {backLabel ?? "Back"}
        </Link>
      )}
      {eyebrow && (
        <p className="mb-2 font-ui text-xs font-bold uppercase tracking-wider text-accent">
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-4xl leading-[1.15] sm:text-6xl">
        {titleLines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </h1>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
