"use client";

import { useRef } from "react";
import { useTerminal } from "./TerminalProvider";

/**
 * A `>_` trigger. Both placements — navbar and footer — go through the same
 * provider, so wherever it is opened from it is the same window.
 */
export function TerminalButton({ className = "" }: { className?: string }) {
  const { open } = useTerminal();
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => open(ref.current)}
      title="Terminal (~)"
      aria-label="Open terminal"
      className={`rounded-full border border-ink/25 px-2.5 py-1 font-ui text-[11px] font-bold tracking-wider text-ink/60 transition-colors hover:border-ink hover:text-accent ${className}`}
    >
      &gt;_
    </button>
  );
}
