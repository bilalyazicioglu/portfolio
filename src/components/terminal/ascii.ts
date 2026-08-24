/**
 * The terminal's ASCII art engine.
 *
 * Both halves — text banners and images — end at the same place: a grid of
 * cells sampled off a canvas and mapped to block characters. Text gets there by
 * drawing with the site's own display face (Silkscreen, `--font-display`), so a
 * banner is made of the same letters as the page headings and Turkish glyphs
 * (Ğ, Ş, İ) come for free without shipping a font table. Images get there by
 * scaling the bitmap down to the grid and reading brightness.
 *
 * Nothing here talks to the network: an image dropped on the terminal is
 * decoded, measured and thrown away in the browser.
 */

export type AsciiStyle = "block" | "outline" | "shadow";

export const ASCII_STYLES: AsciiStyle[] = ["block", "outline", "shadow"];

export type AsciiResult = { ok: true; lines: string[] } | { ok: false; error: string };

/** Wide enough to read, narrow enough to fit the panel without wrapping. */
const MAX_COLS = 68;
const BANNER_ROWS = 11;
const BANNER_FONT_PX = 48;

/** Dark → light. The terminal panel is dark, so denser blocks read as brighter. */
const IMAGE_RAMP = [" ", "·", "░", "▒", "▓", "█"];
const IMAGE_MAX_COLS = 78;
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

/**
 * Characters are about twice as tall as they are wide, so a square-looking
 * result needs half as many rows as columns.
 */
const CHAR_ASPECT = 0.5;

type Grid = boolean[][];

function displayFontFamily(): string {
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const family =
    styles.getPropertyValue("--font-display").trim() ||
    styles.getPropertyValue("--font-silkscreen").trim();
  return family || "monospace";
}

function makeCanvas(width: number, height: number): CanvasRenderingContext2D | null {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width));
  canvas.height = Math.max(1, Math.ceil(height));
  return canvas.getContext("2d", { willReadFrequently: true });
}

/** Drops all-empty rows and columns so a banner has no dead margin. */
function trim(grid: Grid): Grid {
  const rowFilled = grid.map((row) => row.some(Boolean));
  const top = rowFilled.indexOf(true);
  const bottom = rowFilled.lastIndexOf(true);
  if (top === -1) return [];

  const cols = grid[0].length;
  let left = cols;
  let right = -1;
  for (let r = top; r <= bottom; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c]) continue;
      if (c < left) left = c;
      if (c > right) right = c;
    }
  }

  return grid.slice(top, bottom + 1).map((row) => row.slice(left, right + 1));
}

function toBlock(grid: Grid): string[] {
  return grid.map((row) => row.map((on) => (on ? "█" : " ")).join("").trimEnd());
}

function toOutline(grid: Grid): string[] {
  const rows = grid.length;
  const cols = rows ? grid[0].length : 0;
  const isEdge = (r: number, c: number) =>
    !grid[r - 1]?.[c] || !grid[r + 1]?.[c] || !grid[r]?.[c - 1] || !grid[r]?.[c + 1];

  const out: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      line += grid[r][c] ? (isEdge(r, c) ? "█" : " ") : " ";
    }
    out.push(line.trimEnd());
  }
  return out;
}

function toShadow(grid: Grid): string[] {
  const rows = grid.length;
  const cols = rows ? grid[0].length : 0;
  const out: string[] = [];
  for (let r = 0; r < rows + 1; r++) {
    let line = "";
    for (let c = 0; c < cols + 1; c++) {
      if (grid[r]?.[c]) line += "█";
      else if (grid[r - 1]?.[c - 1]) line += "░";
      else line += " ";
    }
    out.push(line.trimEnd());
  }
  return out;
}

function render(grid: Grid, style: AsciiStyle): string[] {
  if (style === "outline") return toOutline(grid);
  if (style === "shadow") return toShadow(grid);
  return toBlock(grid);
}

/** Turns a drawn canvas into a grid of on/off cells by alpha coverage. */
function sampleAlpha(
  ctx: CanvasRenderingContext2D,
  cell: number,
  cols: number,
  rows: number
): Grid {
  const { data } = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const { width } = ctx.canvas;
  const grid: Grid = [];

  for (let r = 0; r < rows; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < cols; c++) {
      let hits = 0;
      let total = 0;
      for (let y = Math.floor(r * cell); y < Math.floor((r + 1) * cell); y++) {
        for (let x = Math.floor(c * cell); x < Math.floor((c + 1) * cell); x++) {
          if (y >= ctx.canvas.height || x >= width) continue;
          total++;
          if (data[(y * width + x) * 4 + 3] > 128) hits++;
        }
      }
      row.push(total > 0 && hits / total > 0.3);
    }
    grid.push(row);
  }

  return grid;
}

export async function renderTextBanner(
  text: string,
  style: AsciiStyle = "block"
): Promise<AsciiResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: "ascii: bir metin ver — örnek: ascii merhaba" };
  }
  if (typeof document === "undefined") {
    return { ok: false, error: "ascii: tarayıcı gerekiyor" };
  }

  const family = displayFontFamily();
  const font = `${BANNER_FONT_PX}px ${family}`;

  try {
    await document.fonts.load(font, trimmed);
    await document.fonts.ready;
  } catch {
    // Fall through: a fallback face still produces a readable banner.
  }

  const measureCtx = makeCanvas(1, 1);
  if (!measureCtx) return { ok: false, error: "ascii: canvas kullanılamıyor" };

  measureCtx.font = font;
  const metrics = measureCtx.measureText(trimmed);
  const width = Math.ceil(metrics.width) + BANNER_FONT_PX;
  const height = Math.ceil(BANNER_FONT_PX * 1.6);

  const cell = height / BANNER_ROWS;
  const cols = Math.ceil(width / cell);
  if (cols > MAX_COLS * 3) {
    return { ok: false, error: "ascii: bu metin çok uzun — daha kısa bir şey dene" };
  }

  const ctx = makeCanvas(width, height);
  if (!ctx) return { ok: false, error: "ascii: canvas kullanılamıyor" };

  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000";
  ctx.fillText(trimmed, BANNER_FONT_PX / 2, height / 2);

  const grid = trim(sampleAlpha(ctx, cell, cols, BANNER_ROWS));
  if (grid.length === 0) {
    return { ok: false, error: "ascii: bu karakterlerden banner çıkmadı" };
  }
  if (grid[0].length > MAX_COLS) {
    return {
      ok: false,
      error: `ascii: banner ${grid[0].length} sütun, sığdırabileceğim en fazla ${MAX_COLS} — daha kısa bir metin dene`,
    };
  }

  return { ok: true, lines: render(grid, style) };
}

export async function renderImage(file: File): Promise<AsciiResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: `ascii: ${file.name} bir görsel değil` };
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return { ok: false, error: "ascii: görsel 10 MB'tan büyük" };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { ok: false, error: "ascii: görsel çözülemedi" };
  }

  const cols = Math.min(IMAGE_MAX_COLS, Math.max(16, bitmap.width));
  const rows = Math.max(
    1,
    Math.round((cols * bitmap.height * CHAR_ASPECT) / bitmap.width)
  );

  const ctx = makeCanvas(cols, rows);
  if (!ctx) {
    bitmap.close();
    return { ok: false, error: "ascii: canvas kullanılamıyor" };
  }

  // Transparent pixels must read as background, not as bright ones.
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cols, rows);
  ctx.drawImage(bitmap, 0, 0, cols, rows);
  bitmap.close();

  const { data } = ctx.getImageData(0, 0, cols, rows);
  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      const i = (r * cols + c) * 4;
      const luminance = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      const step = Math.min(
        IMAGE_RAMP.length - 1,
        Math.floor((luminance / 256) * IMAGE_RAMP.length)
      );
      line += IMAGE_RAMP[step];
    }
    lines.push(line.trimEnd());
  }

  return { ok: true, lines };
}
