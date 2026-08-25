"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isValidSlug, slugify } from "@/lib/slug";
import type { PostLang } from "@/lib/blog";

export type EditorPost = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
  lang: PostLang;
  draft: boolean;
  content: string;
};

const field =
  "w-full rounded-none border-[1.5px] border-ink bg-surface px-3 py-2 font-ui text-sm text-ink outline-none focus:border-accent";
const label =
  "mb-1.5 block font-ui text-[11px] font-bold uppercase tracking-wider text-ink/60";
const button =
  "inline-flex items-center justify-center gap-1.5 border-[1.5px] border-ink px-4 py-2.5 font-ui text-xs font-bold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40";

function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function PostEditor({
  mode,
  initialPost,
}: {
  mode: "new" | "edit";
  initialPost?: EditorPost;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [summary, setSummary] = useState(initialPost?.summary ?? "");
  const [date, setDate] = useState(initialPost?.date ?? today());
  const [tags, setTags] = useState((initialPost?.tags ?? []).join(", "));
  const [lang, setLang] = useState<PostLang>(initialPost?.lang ?? "tr");
  const [content, setContent] = useState(initialPost?.content ?? "");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  async function save(draft: boolean): Promise<boolean> {
    setError(null);
    setNotice(null);

    if (!isValidSlug(slug)) {
      setError("Slug geçersiz — yalnızca küçük harf, rakam ve tire.");
      return false;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          summary,
          date,
          lang,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          draft,
          content,
          overwrite: mode === "edit",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `Kaydedilemedi (HTTP ${res.status}).`);
        return false;
      }

      setNotice(draft ? "Taslak kaydedildi." : "Yayınlandı.");
      router.refresh();
      return true;
    } catch {
      setError("Ağ hatası — kaydedilemedi.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveAndPreview() {
    if (await save(true)) {
      router.push(`/admin/preview/${slug}`);
    }
  }

  async function publish() {
    if (await save(false)) {
      router.push("/admin");
    }
  }

  async function remove() {
    setError(null);
    // Two-step confirmation instead of window.confirm, which blocks the page.
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        setError(`Silinemedi (HTTP ${res.status}).`);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Ağ hatası — silinemedi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin"
          className="font-ui text-xs font-bold uppercase tracking-wider text-ink/60 hover:text-accent"
        >
          ← Yazılar
        </Link>
        {initialPost?.draft ? (
          <span className="border border-ink/25 px-2 py-0.5 font-ui text-[10px] uppercase tracking-wider text-ink/50">
            Taslak
          </span>
        ) : null}
      </div>

      <div>
        <label className={label} htmlFor="title">
          Başlık
        </label>
        <input
          id="title"
          className={field}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Yazının başlığı"
          autoComplete="off"
        />
      </div>

      <div>
        <label className={label} htmlFor="slug">
          Slug {mode === "edit" ? "(değiştirilemez)" : ""}
        </label>
        <input
          id="slug"
          className={field}
          value={slug}
          readOnly={mode === "edit"}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          placeholder="yazinin-slugi"
          autoComplete="off"
          inputMode="url"
        />
      </div>

      <div>
        <label className={label} htmlFor="summary">
          Özet
        </label>
        <textarea
          id="summary"
          className={`${field} min-h-20 resize-y`}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Liste sayfasında ve arama sonuçlarında görünen kısa açıklama"
        />
      </div>

      <div>
        <span className={label}>Dil</span>
        <div className="flex gap-2">
          {(["tr", "en"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLang(option)}
              aria-pressed={lang === option}
              className={`border-[1.5px] border-ink px-4 py-2 font-ui text-xs font-bold uppercase tracking-wider transition-colors ${
                lang === option ? "bg-ink text-surface" : "text-ink/60 hover:text-ink"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="date">
            Tarih
          </label>
          <input
            id="date"
            type="date"
            className={field}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className={label} htmlFor="tags">
            Etiketler (virgülle)
          </label>
          <input
            id="tags"
            className={field}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="internet, eğlence"
            autoComplete="off"
          />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="content">
          İçerik (Markdown / MDX)
        </label>
        <textarea
          id="content"
          className={`${field} min-h-[50vh] resize-y leading-relaxed`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={"Buraya yaz.\n\n## Ara başlık\n\nParagraf..."}
          spellCheck
        />
      </div>

      {error ? (
        <p className="border-[1.5px] border-ink bg-accent/10 px-3 py-2 font-ui text-xs text-ink">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="font-ui text-xs uppercase tracking-wider text-accent">
          {notice}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={`${button} bg-ink text-surface hover:bg-accent hover:text-accent-ink`}
          disabled={busy}
          onClick={publish}
        >
          Yayınla
        </button>
        <button
          type="button"
          className={`${button} bg-surface text-ink hover:border-accent hover:text-accent`}
          disabled={busy}
          onClick={() => save(true)}
        >
          Taslak kaydet
        </button>
        <button
          type="button"
          className={`${button} bg-surface text-ink hover:border-accent hover:text-accent`}
          disabled={busy}
          onClick={saveAndPreview}
        >
          Kaydet & önizle
        </button>
        {mode === "edit" ? (
          <button
            type="button"
            className={`${button} ml-auto bg-surface ${
              confirmDelete
                ? "border-ink text-ink"
                : "border-ink/30 text-ink/50 hover:border-ink hover:text-ink"
            }`}
            disabled={busy}
            onClick={remove}
          >
            {confirmDelete ? "Emin misin? Tekrar bas" : "Sil"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
