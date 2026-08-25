"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { projects } from "@/lib/projects";
import { renderBanner, renderImage } from "./ascii";
import {
  complete,
  runCommand,
  welcomeLines,
  type CommandContext,
  type OutputLine,
  type PostSummary,
} from "./commands";

const HISTORY_LIMIT = 50;

/** macOS zsh shape, so the window reads as a shell at a glance. */
const PROMPT = "bilal@web ~ %";

/** Enough to get somewhere without typing, which is the whole story on a phone. */
const SUGGESTIONS = ["help", "ls blog", "neofetch", "ascii", "banner hello"];

const TONE_CLASS: Record<string, string> = {
  default: "text-[#f2f2f2]",
  muted: "text-[#f2f2f2]/45",
  accent: "text-[#4fd6be]",
  error: "text-[#ff8f6b]",
};

/**
 * A terminal window, borrowed wholesale from macOS Terminal: traffic lights on
 * the left of a light title bar, the window title in the middle, SF Mono on
 * black underneath, and a zsh-shaped `%` prompt.
 */
export function Terminal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [lines, setLines] = useState<OutputLine[]>(() => welcomeLines());
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const inputRef = useRef<HTMLSpanElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  /** Options the pending file picker was opened with (`ascii --width 120`). */
  const pickOptions = useRef<{ cols?: number; invert?: boolean }>({});
  /** The last command's output, which is what `copy` puts on the clipboard. */
  const lastOutput = useRef<string[]>([]);

  const ctx: CommandContext = useMemo(
    () => ({ posts, postsLoading, projects }),
    [posts, postsLoading]
  );

  useEffect(() => {
    let active = true;
    fetch("/api/posts", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!active || !Array.isArray(data.posts)) return;
        setPosts(data.posts);
      })
      .catch(() => {
        /* `ls blog` simply reports an empty list. */
      })
      .finally(() => {
        if (active) setPostsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const output = outputRef.current;
    if (output) output.scrollTop = output.scrollHeight;
  }, [lines, busy]);

  const push = useCallback((next: OutputLine[]) => {
    setLines((prev) => [...prev, ...next]);
  }, []);

  /**
   * The command line is a contenteditable span rather than an <input>, so
   * Safari's keychain never mistakes it for a username field and offers to fill
   * in a saved login. That means React does not own its text: history, Tab
   * completion and clearing all write it here, and put the caret back at the
   * end afterwards.
   */
  const setCommand = useCallback((next: string) => {
    setValue(next);
    const element = inputRef.current;
    if (!element || element.textContent === next) return;
    element.textContent = next;

    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, []);

  const showArt = useCallback(
    (result: Awaited<ReturnType<typeof renderImage>>, note?: string) => {
      if (!result.ok) {
        push([{ text: result.error, tone: "error" }, { text: "" }]);
        lastOutput.current = [result.error];
        return;
      }
      push([
        ...result.lines.map((text) => ({ text, art: true }) as OutputLine),
        ...(note ? [{ text: note, tone: "muted" } as OutputLine] : []),
        { text: "" },
      ]);
      lastOutput.current = result.lines;
    },
    [push]
  );

  const handleFile = useCallback(
    async (file: File) => {
      setBusy(true);
      push([{ text: `ascii ${file.name}`, tone: "muted" }]);
      const result = await renderImage(file, pickOptions.current);
      showArt(result, "rendered in your browser — nothing was uploaded. 'copy' takes it.");
      pickOptions.current = {};
      setBusy(false);
      inputRef.current?.focus();
    },
    [push, showArt]
  );

  const submit = useCallback(
    async (raw: string) => {
      const input = raw.trim();
      push([{ text: `${PROMPT} ${input}` }]);
      setCommand("");
      setHistoryIndex(null);
      if (!input) return;

      setHistory((prev) => [input, ...prev.filter((entry) => entry !== input)].slice(0, HISTORY_LIMIT));

      const result = runCommand(input, ctx);
      if (result.lines.length > 0) {
        push([...result.lines, { text: "" }]);
        lastOutput.current = result.lines.map((entry) => entry.text);
      }

      const intent = result.intent;
      if (!intent) return;

      if (intent.kind === "clear") {
        setLines(welcomeLines());
        lastOutput.current = [];
        return;
      }
      if (intent.kind === "close") {
        onClose();
        return;
      }
      if (intent.kind === "navigate") {
        if (intent.external) {
          window.open(intent.href, "_blank", "noopener,noreferrer");
        } else {
          router.push(intent.href);
          onClose();
        }
        return;
      }
      if (intent.kind === "pick-image") {
        pickOptions.current = { cols: intent.cols, invert: intent.invert };
        fileRef.current?.click();
        return;
      }
      if (intent.kind === "copy") {
        if (lastOutput.current.length === 0) {
          push([{ text: "copy: nothing to copy yet", tone: "error" }, { text: "" }]);
          return;
        }
        try {
          await navigator.clipboard.writeText(lastOutput.current.join("\n"));
          push([{ text: "copied to clipboard", tone: "muted" }, { text: "" }]);
        } catch {
          push([{ text: "copy: the browser refused clipboard access", tone: "error" }, { text: "" }]);
        }
        return;
      }
      if (intent.kind === "banner") {
        setBusy(true);
        showArt(await renderBanner(intent.text));
        setBusy(false);
      }
    },
    [ctx, onClose, push, router, setCommand, showArt]
  );

  function onKeyDown(event: React.KeyboardEvent<HTMLSpanElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void submit(value);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (history.length === 0) return;
      const next = historyIndex === null ? 0 : Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(next);
      setCommand(history[next]);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex === null) return;
      const next = historyIndex - 1;
      if (next < 0) {
        setHistoryIndex(null);
        setCommand("");
        return;
      }
      setHistoryIndex(next);
      setCommand(history[next]);
      return;
    }

    // Tab completes only when there is something to complete, so an empty
    // prompt still hands focus onward for keyboard users.
    if (event.key === "Tab" && value.trim()) {
      event.preventDefault();
      const matches = complete(value, ctx);
      if (matches.length === 1) {
        setCommand(matches[0]);
      } else if (matches.length > 1) {
        push([
          { text: `${PROMPT} ${value}` },
          { text: matches.join("   "), tone: "muted" },
          { text: "" },
        ]);
      }
    }
  }

  return (
    <div
      className="terminal-backdrop fixed inset-0 z-50 flex items-stretch justify-center bg-ink/50 p-2 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.target === event.currentTarget) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) void handleFile(file);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Terminal"
        className={`terminal-window flex w-full max-w-3xl flex-col overflow-hidden rounded-[10px] shadow-2xl ring-1 sm:h-[70vh] ${
          dragging ? "ring-2 ring-[#4fd6be]" : "ring-black/40"
        }`}
      >
        {/* Title bar */}
        <div className="relative flex h-7 shrink-0 items-center bg-gradient-to-b from-[#e8e6e3] to-[#d6d2ce] px-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close terminal"
              className="h-3 w-3 rounded-full bg-[#ff5f57] ring-1 ring-black/10 transition-opacity hover:opacity-70"
            />
            <span aria-hidden className="h-3 w-3 rounded-full bg-[#febc2e] ring-1 ring-black/10" />
            <span aria-hidden className="h-3 w-3 rounded-full bg-[#28c840] ring-1 ring-black/10" />
          </div>
          <p className="pointer-events-none absolute inset-x-0 text-center text-[12px] font-semibold text-black/60">
            {dragging ? "drop the image" : "bilal@web — -zsh — 100×30"}
          </p>
        </div>

        {/* Screen */}
        <div
          ref={outputRef}
          role="log"
          aria-live="polite"
          onClick={() => inputRef.current?.focus()}
          className="flex-1 overflow-auto bg-[#0b0b0b] px-3 py-2 font-terminal text-[12px] leading-[1.35] text-[#f2f2f2] selection:bg-[#f2f2f2]/25"
        >
          {lines.map((entry, index) =>
            entry.art ? (
              <pre key={index} className="whitespace-pre text-[10px] leading-[1.05] sm:text-[11px]">
                {entry.text}
              </pre>
            ) : (
              <p
                key={index}
                className={`whitespace-pre-wrap break-words ${TONE_CLASS[entry.tone ?? "default"]}`}
              >
                {entry.text || " "}
              </p>
            )
          )}

          {busy && <p className="text-[#f2f2f2]/45">rendering…</p>}

          {/* The live prompt sits in the scroll flow, the way a real one does. */}
          <div className="flex items-baseline gap-2">
            <span aria-hidden className="shrink-0 text-[#4fd6be]">
              {PROMPT}
            </span>
            <span
              ref={inputRef}
              role="textbox"
              aria-label="Command"
              aria-multiline="false"
              contentEditable="plaintext-only"
              suppressContentEditableWarning
              onInput={(event) => setValue(event.currentTarget.textContent ?? "")}
              onKeyDown={onKeyDown}
              onPaste={(event) => {
                // A shell line is one line: paste as plain text, newlines out.
                event.preventDefault();
                const text = event.clipboardData.getData("text/plain").replace(/\s+/g, " ");
                document.execCommand("insertText", false, text);
              }}
              // No autocorrect, no capitalised first letter on a phone, no red
              // squiggles under `neofetch`.
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="min-w-[1ch] flex-1 whitespace-pre-wrap break-words bg-transparent font-terminal text-[12px] text-[#f2f2f2] caret-[#f2f2f2] focus:outline-none"
            />
          </div>
        </div>

        {/* Typing is awkward on a phone; on a desktop the window stays pure. */}
        <div className="flex flex-wrap gap-1.5 bg-[#0b0b0b] px-3 pb-2.5 sm:hidden">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                void submit(suggestion);
                inputRef.current?.focus();
              }}
              className="rounded border border-[#f2f2f2]/20 px-2 py-1 font-terminal text-[10px] text-[#f2f2f2]/60"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
