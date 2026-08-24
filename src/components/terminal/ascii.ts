/**
 * The terminal's ASCII art engine.
 *
 * The main act is images: a photo is scaled down to a character grid and every
 * cell picks a glyph by brightness, the way the classic converters do it. The
 * ramp is ordered by ink coverage, so a dense glyph stands in for a dark patch
 * and a period for a pale one — that ordering, plus stretching the picture's
 * own contrast across the whole ramp, is what makes a face readable at 100
 * characters wide.
 *
 * `banner()` is the smaller sibling: text drawn with the site's own display
 * face (Silkscreen, `--font-display`) and sampled into block characters, so a
 * banner is made of the same letters as the page headings.
 *
 * Nothing here touches the network. An image dropped on the terminal is
 * decoded, measured, and discarded in the browser.
 */

export type AsciiResult = { ok: true; lines: string[] } | { ok: false; error: string };

/**
 * Ordered densest → lightest. Standard 70-step ramp: the extra steps matter on
 * faces, where most of the information sits in a narrow band of mid greys.
 */
const RAMP =
  "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ";

const DEFAULT_COLS = 100;
const MIN_COLS = 20;
const MAX_COLS = 200;
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Anything this pale is treated as nothing at all. A logo or a screenshot on a
 * white sheet should come out as art floating in empty space, not as a slab of
 * glyphs with a shape hidden in it.
 */
const BLANK_ABOVE = 236;

/** Characters are about twice as tall as they are wide. */
const CHAR_ASPECT = 0.5;

const BANNER_FONT_PX = 48;
const BANNER_MAX_COLS = 68;
const BANNER_FALLBACK_ROWS = 11;

export type ImageOptions = {
  /** Output width in characters. */
  cols?: number;
  /** Light text on a dark panel by default; flip for dark-on-light output. */
  invert?: boolean;
};

function makeCanvas(width: number, height: number): CanvasRenderingContext2D | null {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width));
  canvas.height = Math.max(1, Math.ceil(height));
  return canvas.getContext("2d", { willReadFrequently: true });
}

function countBlank(blank: Uint8Array): number {
  let count = 0;
  for (let i = 0; i < blank.length; i++) count += blank[i];
  return count;
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function median(values: Float32Array, min: number, max: number): number {
  const bins = new Uint32Array(256);
  const span = max - min || 1;
  for (let i = 0; i < values.length; i++) {
    bins[Math.min(255, Math.max(0, Math.round(((values[i] - min) / span) * 255)))]++;
  }

  const half = values.length / 2;
  let seen = 0;
  for (let bin = 0; bin < 256; bin++) {
    seen += bins[bin];
    if (seen >= half) return min + (bin / 255) * span;
  }
  return (min + max) / 2;
}

/** The 2nd and 98th percentile of a luminance field, via a 256-bin histogram. */
function percentiles(values: Float32Array, min: number, max: number): [number, number] {
  const bins = new Uint32Array(256);
  const span = max - min || 1;
  for (let i = 0; i < values.length; i++) {
    bins[Math.min(255, Math.max(0, Math.round(((values[i] - min) / span) * 255)))]++;
  }

  const cut = values.length * 0.02;
  let seen = 0;
  let low = 0;
  for (let bin = 0; bin < 256; bin++) {
    seen += bins[bin];
    if (seen >= cut) {
      low = bin;
      break;
    }
  }

  seen = 0;
  let high = 255;
  for (let bin = 255; bin >= 0; bin--) {
    seen += bins[bin];
    if (seen >= cut) {
      high = bin;
      break;
    }
  }

  if (high <= low) return [min, max];
  return [min + (low / 255) * span, min + (high / 255) * span];
}

export function clampCols(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return DEFAULT_COLS;
  return Math.min(MAX_COLS, Math.max(MIN_COLS, Math.round(value)));
}

export async function renderImage(file: File, options: ImageOptions = {}): Promise<AsciiResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: `ascii: ${file.name}: not an image` };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "ascii: image is larger than 10 MB" };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { ok: false, error: "ascii: could not decode that image" };
  }

  const cols = clampCols(options.cols);
  const rows = Math.max(1, Math.round((cols * bitmap.height * CHAR_ASPECT) / bitmap.width));

  const ctx = makeCanvas(cols, rows);
  if (!ctx) {
    bitmap.close();
    return { ok: false, error: "ascii: canvas is unavailable in this browser" };
  }

  // Left un-filled on purpose: a transparent pixel keeps alpha 0 and is read
  // below as empty, the same as a white one.
  ctx.drawImage(bitmap, 0, 0, cols, rows);
  bitmap.close();

  const { data } = ctx.getImageData(0, 0, cols, rows);
  const luminance = new Float32Array(cols * rows);
  /** Cells that should stay empty whatever the ramp says — see BLANK_ABOVE. */
  const blank = new Uint8Array(cols * rows);
  let min = 255;
  let max = 0;

  for (let i = 0; i < luminance.length; i++) {
    const o = i * 4;
    const value = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
    luminance[i] = value;
    if (data[o + 3] < 16 || value >= BLANK_ABOVE) {
      blank[i] = 1;
      continue;
    }
    if (value < min) min = value;
    if (value > max) max = value;
  }

  if (max < min) {
    return { ok: false, error: "ascii: that image is blank" };
  }

  // The tones that will actually be drawn. Blank cells are left out so a large
  // white margin cannot drag the levels — the picture is graded on its ink.
  const ink = new Float32Array(luminance.length - countBlank(blank));
  for (let i = 0, k = 0; i < luminance.length; i++) {
    if (!blank[i]) ink[k++] = luminance[i];
  }

  // Stretch the picture's own range across the ramp, but off the 2nd and 98th
  // percentile rather than the extremes: one blown highlight or one black
  // speck would otherwise set the whole scale, and film grain or paper texture
  // would get amplified into noise.
  const [low, high] = percentiles(ink, min, max);
  const span = high - low || 1;
  const lastStep = RAMP.length - 1;

  // Whichever tone dominates the picture is its background, and the background
  // should come out blank. A photo lit against the dark reads bright-on-black;
  // a drawing on paper reads dark-on-white, and rendering that one the same way
  // would fill the screen with '$'. `--invert` flips whatever this decides.
  const brightSubject = median(ink, min, max) < (low + high) / 2;
  const flip = brightSubject !== Boolean(options.invert);

  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      const index = r * cols + c;
      if (blank[index]) {
        line += " ";
        continue;
      }
      const normalised = clamp01((luminance[index] - low) / span);
      // A dense glyph puts more light on a black screen, so on this side of the
      // flip the bright parts of the picture take the dense end of the ramp.
      const position = flip ? 1 - normalised : normalised;
      line += RAMP[Math.min(lastStep, Math.max(0, Math.round(position * lastStep)))];
    }
    lines.push(line.trimEnd());
  }

  return { ok: true, lines };
}

// --- Text banners -----------------------------------------------------------

type Grid = boolean[][];

function displayFontFamily(): string {
  const styles = getComputedStyle(document.documentElement);
  return (
    styles.getPropertyValue("--font-display").trim() ||
    styles.getPropertyValue("--font-silkscreen").trim() ||
    "monospace"
  );
}

/**
 * Finds the size of one of the display face's own pixels.
 *
 * Silkscreen is pixel art: every stem is a whole number of design pixels wide,
 * and the narrowest horizontal run in a drawn word is exactly one of them.
 * Sampling on that measured size rather than a guessed row count is what keeps
 * letters crisp — a grid that lands between the font's pixels turns strokes
 * into mush.
 */
function detectPixelSize(ctx: CanvasRenderingContext2D): number | null {
  const { width, height } = ctx.canvas;
  const { data } = ctx.getImageData(0, 0, width, height);
  let smallest = Infinity;

  for (let y = 0; y < height; y++) {
    let run = 0;
    for (let x = 0; x <= width; x++) {
      const filled = x < width && data[(y * width + x) * 4 + 3] > 128;
      if (filled) {
        run++;
        continue;
      }
      if (run > 1 && run < smallest) smallest = run;
      run = 0;
    }
  }

  return Number.isFinite(smallest) ? smallest : null;
}

function sampleAlpha(ctx: CanvasRenderingContext2D, cell: number, cols: number, rows: number): Grid {
  const { data } = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const { width, height } = ctx.canvas;
  const grid: Grid = [];

  for (let r = 0; r < rows; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < cols; c++) {
      let hits = 0;
      let total = 0;
      for (let y = Math.floor(r * cell); y < Math.floor((r + 1) * cell); y++) {
        for (let x = Math.floor(c * cell); x < Math.floor((c + 1) * cell); x++) {
          if (y >= height || x >= width) continue;
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

export async function renderBanner(text: string): Promise<AsciiResult> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "banner: give me some text" };
  if (typeof document === "undefined") {
    return { ok: false, error: "banner: needs a browser" };
  }

  const font = `${BANNER_FONT_PX}px ${displayFontFamily()}`;
  try {
    await document.fonts.load(font, trimmed);
    await document.fonts.ready;
  } catch {
    // A fallback face still produces a readable banner.
  }

  const measureCtx = makeCanvas(1, 1);
  if (!measureCtx) return { ok: false, error: "banner: canvas is unavailable" };
  measureCtx.font = font;

  const width = Math.ceil(measureCtx.measureText(trimmed).width) + BANNER_FONT_PX;
  const height = Math.ceil(BANNER_FONT_PX * 1.6);

  const ctx = makeCanvas(width, height);
  if (!ctx) return { ok: false, error: "banner: canvas is unavailable" };

  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000";
  ctx.fillText(trimmed, BANNER_FONT_PX / 2, height / 2);

  const cell = detectPixelSize(ctx) ?? height / BANNER_FALLBACK_ROWS;
  const grid = trim(sampleAlpha(ctx, cell, Math.ceil(width / cell), Math.ceil(height / cell)));

  if (grid.length === 0) {
    return { ok: false, error: "banner: nothing came out of those characters" };
  }
  if (grid[0].length > BANNER_MAX_COLS) {
    return {
      ok: false,
      error: `banner: ${grid[0].length} columns wide, ${BANNER_MAX_COLS} is the most that fits — try something shorter`,
    };
  }

  return {
    ok: true,
    lines: grid.map((row) => row.map((on) => (on ? "█" : " ")).join("").trimEnd()),
  };
}
