"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { projects } from "@/lib/projects";
import { renderImage, renderTextBanner } from "./ascii";
import {
  complete,
  runCommand,
  welcomeLines,
  type CommandContext,
  type OutputLine,
  type PostSummary,
} from "./commands";

const HISTORY_LIMIT = 50;

/** Enough to get somewhere without typing, which is the whole story on a phone. */
const CHIPS = ["help", "ls blog", "neofetch", "ascii merhaba", "ascii --image"];

const TONE_CLASS: Record<string, string> = {
  default: "text-canvas",
  muted: "text-canvas/50",
  accent: "text-accent",
  // The palette has no error colour — this one exists only inside the terminal,
  // where a warm red is the convention and neither ink nor accent would read.
  error: "text-[#ff8f6b]",
};

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

  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
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

  const showArt = useCallback(
    (result: Awaited<ReturnType<typeof renderTextBanner>>, note?: string) => {
      if (!result.ok) {
        push([{ text: result.error, tone: "error" }]);
        lastOutput.current = [result.error];
        return;
      }
      const artLines = result.lines.map((text) => ({ text, art: true }) as OutputLine);
      push([
        ...artLines,
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
      push([{ text: `ascii --image ${file.name}`, tone: "muted" }]);
      const result = await renderImage(file);
      showArt(result, "görsel tarayıcından hiç çıkmadı — 'copy' ile alabilirsin");
      setBusy(false);
      inputRef.current?.focus();
    },
    [push, showArt]
  );

  const submit = useCallback(
    async (raw: string) => {
      const input = raw.trim();
      push([{ text: `$ ${input}`, tone: "accent" }]);
      setValue("");
      setHistoryIndex(null);
      if (!input) return;

      setHistory((prev) => [input, ...prev.filter((h) => h !== input)].slice(0, HISTORY_LIMIT));

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
        fileRef.current?.click();
        return;
      }
      if (intent.kind === "copy") {
        if (lastOutput.current.length === 0) {
          push([{ text: "copy: kopyalanacak bir çıktı yok", tone: "error" }, { text: "" }]);
          return;
        }
        try {
          await navigator.clipboard.writeText(lastOutput.current.join("\n"));
          push([{ text: "panoya kopyalandı", tone: "muted" }, { text: "" }]);
        } catch {
          push([{ text: "copy: tarayıcı panoya izin vermedi", tone: "error" }, { text: "" }]);
        }
        return;
      }
      if (intent.kind === "banner") {
        setBusy(true);
        const result = await renderTextBanner(intent.text, intent.style);
        showArt(result);
        setBusy(false);
      }
    },
    [ctx, onClose, push, router, showArt]
  );

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
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
      setValue(history[next]);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex === null) return;
      const next = historyIndex - 1;
      if (next < 0) {
        setHistoryIndex(null);
        setValue("");
        return;
      }
      setHistoryIndex(next);
      setValue(history[next]);
      return;
    }

    // Tab completes only when there is something to complete, so an empty
    // prompt still hands focus to the close button for keyboard users.
    if (event.key === "Tab" && value.trim()) {
      event.preventDefault();
      const matches = complete(value, ctx);
      if (matches.length === 1) {
        setValue(matches[0]);
      } else if (matches.length > 1) {
        push([
          { text: `$ ${value}`, tone: "accent" },
          { text: `  ${matches.join("   ")}`, tone: "muted" },
          { text: "" },
        ]);
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-ink/50 p-2 backdrop-blur-[2px] sm:items-center sm:p-6"
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
        className={`flex w-full max-w-3xl flex-col overflow-hidden rounded-xl border-[1.5px] bg-ink text-canvas sm:h-[70vh] ${
          dragging ? "border-accent" : "border-canvas/25"
        }`}
      >
        <div className="flex items-center justify-between border-b border-canvas/15 px-4 py-2.5">
          <p className="font-ui text-[11px] uppercase tracking-wider text-canvas/60">
            bilal@web — {dragging ? "görseli bırak" : "terminal"}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Terminali kapat"
            className="font-ui text-[11px] uppercase tracking-wider text-canvas/60 hover:text-accent"
          >
            esc ✕
          </button>
        </div>

        <div
          ref={outputRef}
          role="log"
          aria-live="polite"
          className="flex-1 overflow-y-auto px-4 py-3 font-ui text-[12px] leading-[1.55]"
        >
          {lines.map((entry, index) =>
            entry.art ? (
              <pre
                key={index}
                className="overflow-x-auto whitespace-pre text-[10px] leading-[1.05] text-canvas sm:text-[11px]"
              >
                {entry.text}
              </pre>
            ) : (
              <p
                key={index}
                className={`whitespace-pre-wrap break-words ${TONE_CLASS[entry.tone ?? "default"]}`}
              >
                {entry.text || " "}
              </p>
            )
          )}
          {busy && <p className="text-canvas/50">çiziliyor…</p>}
        </div>

        <div className="border-t border-canvas/15 px-4 py-2">
          <div className="flex items-center gap-2">
            <span aria-hidden className="font-ui text-[12px] text-accent">
              $
            </span>
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={onKeyDown}
              aria-label="Komut"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="help"
              className="w-full bg-transparent font-ui text-[12px] text-canvas placeholder:text-canvas/30 focus:outline-none"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => void submit(chip)}
                className="rounded-full border border-canvas/25 px-2.5 py-1 font-ui text-[10px] uppercase tracking-wider text-canvas/60 hover:border-accent hover:text-accent"
              >
                {chip}
              </button>
            ))}
          </div>
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
