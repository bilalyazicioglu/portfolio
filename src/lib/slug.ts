/**
 * Slug helpers, kept free of `node:fs` so the admin editor can import them
 * on the client without pulling the filesystem into the browser bundle.
 */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Guards against path traversal — every slug reaching the filesystem passes here. */
export function isValidSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= 120 && SLUG_PATTERN.test(slug);
}

const TR_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  â: "a",
  î: "i",
  û: "u",
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[çğıöşüâîû]/g, (ch) => TR_MAP[ch] ?? ch)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}
