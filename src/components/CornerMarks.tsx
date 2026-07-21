export function CornerMarks() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute -left-2.5 -top-2.5 hidden font-ui text-xs text-muted sm:block"
      >
        ×
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-2.5 -left-2.5 hidden font-ui text-xs text-muted sm:block"
      >
        ×
      </span>
    </>
  );
}
