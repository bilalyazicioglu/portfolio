export function DecorativePlus({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 40 40"
      className={`h-8 w-8 text-ink/25 ${className}`}
      fill="none"
    >
      <path
        d="M20 2v36M2 20h36"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <circle cx="20" cy="20" r="3" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
