export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "accent";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-ui text-[10px] font-bold uppercase tracking-wider ${
        tone === "accent"
          ? "border-accent bg-accent text-accent-ink"
          : "border-ink/20 bg-ink/[0.03] text-ink/70"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          tone === "accent" ? "bg-accent-ink" : "bg-accent"
        }`}
      />
      {children}
    </span>
  );
}
