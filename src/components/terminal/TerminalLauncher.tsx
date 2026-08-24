"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

/**
 * The footer's `>_` button and the `~` shortcut that open the terminal.
 *
 * The terminal itself — with the ASCII engine and the command set — is only
 * fetched when someone actually opens it, so a visitor who never does pays
 * nothing for it.
 */
const Terminal = dynamic(() => import("./Terminal").then((mod) => mod.Terminal), {
  ssr: false,
});

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable
  );
}

export function TerminalLauncher() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Never steal the key from someone filling in a field — the projects
      // search box and the admin editor both live on this layout.
      if (event.key !== "~" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTyping(event.target)) return;
      event.preventDefault();
      setOpen(true);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        title="Terminal (~)"
        aria-label="Terminali aç"
        className="rounded-full border border-ink/25 px-2.5 py-1 font-ui text-[11px] font-bold tracking-wider text-ink/60 transition-colors hover:border-ink hover:text-accent"
      >
        &gt;_
      </button>
      {open && (
        <Terminal
          onClose={() => {
            setOpen(false);
            buttonRef.current?.focus();
          }}
        />
      )}
    </>
  );
}
