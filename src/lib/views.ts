import fs from "node:fs";
import path from "node:path";

function getFilePath(): string {
  if (process.env.VIEWS_FILE_PATH) {
    return process.env.VIEWS_FILE_PATH;
  }
  const primaryDir = path.join(process.cwd(), "data");
  try {
    if (!fs.existsSync(primaryDir)) {
      fs.mkdirSync(primaryDir, { recursive: true });
    }
    const testFile = path.join(primaryDir, ".writable_test");
    fs.writeFileSync(testFile, "1");
    fs.unlinkSync(testFile);
    return path.join(primaryDir, "views.json");
  } catch {
    // Fallback to /tmp which is always writable by non-root nodejs user in container
    return "/tmp/views.json";
  }
}

type ViewsData = {
  [slug: string]: {
    count: number;
    ips: { [ip: string]: number };
  };
};

function ensureFile(filePath: string): ViewsData {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}), "utf8");
      return {};
    }
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveFile(filePath: string, data: ViewsData) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save views file:", err);
  }
}

export function getViewCount(slug: string): number {
  const filePath = getFilePath();
  const data = ensureFile(filePath);
  return data[slug]?.count ?? 0;
}

export function recordView(slug: string, ip: string): number {
  const filePath = getFilePath();
  const data = ensureFile(filePath);
  if (!data[slug]) {
    data[slug] = { count: 0, ips: {} };
  }

  const now = Date.now();
  const lastVisit = data[slug].ips[ip] ?? 0;
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  if (!lastVisit || now - lastVisit > TWENTY_FOUR_HOURS) {
    data[slug].count = (data[slug].count ?? 0) + 1;
    data[slug].ips[ip] = now;
    saveFile(filePath, data);
  }

  return data[slug].count;
}
