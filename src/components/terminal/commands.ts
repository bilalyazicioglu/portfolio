/**
 * The terminal's command set.
 *
 * Every command is a pure function: it reads the context it is given and
 * returns lines plus, at most, an *intent* — navigate, clear, close, copy, draw
 * a banner, open the file picker. Nothing here touches the DOM, the router or
 * the clipboard; `Terminal.tsx` carries the intents out. That split is what
 * keeps the command set readable and lets it be exercised without a browser.
 */

import type { Project } from "@/lib/projects";
import { siteConfig } from "@/site.config";
import { ASCII_STYLES, type AsciiStyle } from "./ascii";

export type PostSummary = {
  slug: string;
  title: string;
  date: string;
};

export type LineTone = "default" | "muted" | "accent" | "error";

export type OutputLine = {
  text: string;
  tone?: LineTone;
  /** Rendered in a horizontally scrollable <pre> — used for ASCII art. */
  art?: boolean;
};

export type CommandIntent =
  | { kind: "navigate"; href: string; external?: boolean }
  | { kind: "clear" }
  | { kind: "close" }
  | { kind: "copy" }
  | { kind: "pick-image" }
  | { kind: "banner"; text: string; style: AsciiStyle };

export type CommandResult = {
  lines: OutputLine[];
  intent?: CommandIntent;
};

export type CommandContext = {
  posts: PostSummary[];
  postsLoading: boolean;
  projects: Project[];
};

type Command = {
  name: string;
  summary: string;
  usage?: string;
  run: (args: string[], ctx: CommandContext) => CommandResult;
};

const PAGES = [
  { name: "home", href: "/", about: "Landing page" },
  { name: "about", href: "/about", about: "Who I am, CV, experience" },
  { name: "projects", href: "/projects", about: "Everything I have shipped" },
  { name: "blog", href: "/blog", about: "Writing" },
];

const line = (text: string, tone?: LineTone): OutputLine => ({ text, tone });
const blank = (): OutputLine => ({ text: "" });

function pad(value: string, width: number): string {
  return value.length >= width ? value : value + " ".repeat(width - value.length);
}

const help: Command = {
  name: "help",
  summary: "Bu listeyi göster",
  run: () => ({
    lines: [
      line("Komutlar", "accent"),
      ...commandList().map((cmd) =>
        line(`  ${pad(cmd.usage ?? cmd.name, 26)}${cmd.summary}`)
      ),
      blank(),
      line("↑/↓ geçmiş · Tab tamamlama · Esc kapat", "muted"),
    ],
  }),
};

const ls: Command = {
  name: "ls",
  summary: "Sayfaları, projeleri veya yazıları listele",
  usage: "ls [projects|blog]",
  run: (args, ctx) => {
    const target = (args[0] ?? "").toLowerCase();

    if (target === "projects") {
      return {
        lines: ctx.projects.map((project) =>
          line(
            `  ${pad(project.slug, 20)}${project.category === "Private" ? "private" : "open source"}`
          )
        ),
      };
    }

    if (target === "blog" || target === "posts") {
      if (ctx.postsLoading) return { lines: [line("  yazılar yükleniyor…", "muted")] };
      if (ctx.posts.length === 0) return { lines: [line("  yazı yok", "muted")] };
      return {
        lines: ctx.posts.map((post) =>
          line(`  ${pad(post.date.slice(0, 10), 12)}${post.slug}`)
        ),
      };
    }

    if (target) {
      return { lines: [line(`ls: ${target}: böyle bir dizin yok`, "error")] };
    }

    return {
      lines: [
        ...PAGES.map((page) => line(`  ${pad(page.name, 12)}${page.about}`)),
        blank(),
        line("  'ls projects' ve 'ls blog' de var", "muted"),
      ],
    };
  },
};

const open: Command = {
  name: "open",
  summary: "Bir sayfayı veya yazıyı aç",
  usage: "open <sayfa|slug>",
  run: (args, ctx) => {
    const target = (args[0] ?? "").toLowerCase().replace(/^\/+/, "");
    if (!target) {
      return { lines: [line("open: ne açayım? 'ls' ile bak", "error")] };
    }

    const page = PAGES.find((candidate) => candidate.name === target);
    if (page) {
      return {
        lines: [line(`${page.href} açılıyor…`, "muted")],
        intent: { kind: "navigate", href: page.href },
      };
    }

    const post = ctx.posts.find((candidate) => candidate.slug === target);
    if (post) {
      return {
        lines: [line(`${post.title} açılıyor…`, "muted")],
        intent: { kind: "navigate", href: `/blog/${post.slug}` },
      };
    }

    const project = ctx.projects.find((candidate) => candidate.slug === target);
    if (project) {
      if (!project.href) {
        return {
          lines: [line(`${project.name} özel bir proje — herkese açık repo yok`, "muted")],
        };
      }
      return {
        lines: [line(`${project.href} açılıyor…`, "muted")],
        intent: { kind: "navigate", href: project.href, external: true },
      };
    }

    return { lines: [line(`open: ${target}: bulunamadı`, "error")] };
  },
};

const cat: Command = {
  name: "cat",
  summary: "about / cv / contact içeriğini bas",
  usage: "cat <about|cv|contact>",
  run: (args) => {
    const target = (args[0] ?? "").toLowerCase();

    if (target === "about") {
      return { lines: [line(siteConfig.bio)] };
    }
    if (target === "cv" || target === "resume") {
      return {
        lines: [line(`${siteConfig.resumeUrl} indiriliyor…`, "muted")],
        intent: { kind: "navigate", href: siteConfig.resumeUrl, external: true },
      };
    }
    if (target === "contact") {
      return {
        lines: [
          line(`email     ${siteConfig.email}`),
          ...siteConfig.socials.map((social) =>
            line(`${pad(social.label.toLowerCase(), 10)}${social.href}`)
          ),
        ],
      };
    }

    return { lines: [line("cat: about, cv veya contact", "error")] };
  },
};

const whoami: Command = {
  name: "whoami",
  summary: "Tek satırda kim olduğum",
  run: () => ({
    lines: [
      line(`${siteConfig.name} — ${siteConfig.role}`),
      line(`${siteConfig.location} · ${siteConfig.availability}`, "muted"),
    ],
  }),
};

/** The site's own mark, hand-traced small enough to sit next to the stats. */
const LOGO = [
  "  ██████╗ ",
  "  ██╔══██╗",
  "  ██████╔╝",
  "  ██╔══██╗",
  "  ██████╔╝",
  "  ╚═════╝ ",
];

const neofetch: Command = {
  name: "neofetch",
  summary: "Sitenin künyesi",
  run: (_args, ctx) => {
    const facts = [
      `${siteConfig.name.toLowerCase().replace(/\s+/g, "")}@web`,
      "-".repeat(22),
      `role     ${siteConfig.role}`,
      `location ${siteConfig.location}`,
      `stack    Next.js 16 · TypeScript · Tailwind 4`,
      `projects ${ctx.projects.length}`,
      `posts    ${ctx.postsLoading ? "…" : ctx.posts.length}`,
      `shell    ${siteConfig.url.replace(/^https?:\/\//, "")}/terminal`,
    ];

    const rows = Math.max(LOGO.length, facts.length);
    const lines: OutputLine[] = [];
    for (let i = 0; i < rows; i++) {
      lines.push({ text: `${pad(LOGO[i] ?? "", 12)}${facts[i] ?? ""}`, art: true });
    }
    return { lines };
  },
};

const ascii: Command = {
  name: "ascii",
  summary: "Metni banner'a çevir (veya bir görseli ASCII yap)",
  usage: "ascii <metin> [--style block|outline|shadow]",
  run: (args) => {
    if (args[0] === "--image" || args[0] === "-i") {
      return {
        lines: [line("bir görsel seç — ya da pencereye sürükle", "muted")],
        intent: { kind: "pick-image" },
      };
    }

    let style: AsciiStyle = "block";
    const words: string[] = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === "--style" || arg === "-s") {
        const value = (args[i + 1] ?? "") as AsciiStyle;
        if (!ASCII_STYLES.includes(value)) {
          return {
            lines: [line(`ascii: stiller: ${ASCII_STYLES.join(", ")}`, "error")],
          };
        }
        style = value;
        i++;
        continue;
      }
      words.push(arg);
    }

    const text = words.join(" ");
    if (!text) {
      return {
        lines: [
          line("ascii: bir metin ver", "error"),
          line("  ascii merhaba", "muted"),
          line("  ascii bilal --style shadow", "muted"),
          line("  ascii --image", "muted"),
        ],
      };
    }

    return { lines: [], intent: { kind: "banner", text, style } };
  },
};

const copy: Command = {
  name: "copy",
  summary: "Son çıktıyı panoya kopyala",
  run: () => ({ lines: [], intent: { kind: "copy" } }),
};

const clear: Command = {
  name: "clear",
  summary: "Ekranı temizle",
  run: () => ({ lines: [], intent: { kind: "clear" } }),
};

const exit: Command = {
  name: "exit",
  summary: "Terminali kapat",
  run: () => ({ lines: [], intent: { kind: "close" } }),
};

const sudo: Command = {
  name: "sudo",
  summary: "Denemesi bedava",
  run: (args) => ({
    lines: [
      line(
        `sudo: ${args.join(" ") || "bir şey"}: bu olay senin tarayıcında geçiyor, burada kimse root değil`,
        "muted"
      ),
    ],
  }),
};

const REGISTRY: Command[] = [
  help,
  ls,
  open,
  cat,
  whoami,
  neofetch,
  ascii,
  copy,
  clear,
  exit,
  sudo,
];

function commandList(): Command[] {
  return REGISTRY;
}

export const COMMAND_NAMES = REGISTRY.map((command) => command.name);

/** Command names first, then the arguments that command accepts. */
export function complete(input: string, ctx: CommandContext): string[] {
  const parts = input.split(/\s+/);
  if (parts.length <= 1) {
    return COMMAND_NAMES.filter((name) => name.startsWith(parts[0] ?? ""));
  }

  const [name, ...rest] = parts;
  const prefix = rest[rest.length - 1] ?? "";
  let candidates: string[] = [];

  if (name === "ls") candidates = ["projects", "blog"];
  if (name === "cat") candidates = ["about", "cv", "contact"];
  if (name === "open") {
    candidates = [
      ...PAGES.map((page) => page.name),
      ...ctx.posts.map((post) => post.slug),
      ...ctx.projects.map((project) => project.slug),
    ];
  }
  if (name === "ascii") candidates = ["--image", "--style", ...ASCII_STYLES];

  return candidates
    .filter((candidate) => candidate.startsWith(prefix))
    .map((candidate) => [name, ...rest.slice(0, -1), candidate].join(" "));
}

export function runCommand(input: string, ctx: CommandContext): CommandResult {
  const [name, ...args] = input.trim().split(/\s+/);
  if (!name) return { lines: [] };

  const command = REGISTRY.find((candidate) => candidate.name === name.toLowerCase());
  if (!command) {
    return {
      lines: [line(`command not found: ${name} — 'help' dene`, "error")],
    };
  }

  return command.run(args, ctx);
}

export function welcomeLines(): OutputLine[] {
  return [
    line(`${siteConfig.name} — web terminal`, "accent"),
    line("'help' yaz, ya da 'ascii merhaba' ile başla.", "muted"),
    blank(),
  ];
}
