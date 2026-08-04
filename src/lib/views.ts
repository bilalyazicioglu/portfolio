import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const VIEWS_FILE = path.join(DATA_DIR, "views.json");

type ViewsData = {
  [slug: string]: {
    count: number;
    ips: { [ip: string]: number }; // ip -> timestamp
  };
};

function ensureFile(): ViewsData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(VIEWS_FILE)) {
    fs.writeFileSync(VIEWS_FILE, JSON.stringify({}), "utf8");
    return {};
  }
  try {
    const raw = fs.readFileSync(VIEWS_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveFile(data: ViewsData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(VIEWS_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save views.json:", err);
  }
}

export function getViewCount(slug: string): number {
  const data = ensureFile();
  return data[slug]?.count ?? 0;
}

export function recordView(slug: string, ip: string): number {
  const data = ensureFile();
  if (!data[slug]) {
    data[slug] = { count: 0, ips: {} };
  }

  const now = Date.now();
  const lastVisit = data[slug].ips[ip] ?? 0;
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  // Count as new view if IP hasn't visited this slug in last 24 hours
  if (!lastVisit || now - lastVisit > TWENTY_FOUR_HOURS) {
    data[slug].count = (data[slug].count ?? 0) + 1;
    data[slug].ips[ip] = now;
    saveFile(data);
  }

  return data[slug].count;
}
