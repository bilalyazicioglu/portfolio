export type ProjectCategory = "Open Source" | "Private";

export type ProjectStat = {
  label: string;
  value: string;
};

export type Project = {
  slug: string;
  name: string;
  tag: string;
  category: ProjectCategory;
  badges: string[];
  description: string;
  href?: string;
  featured?: boolean;
  private?: boolean;
  live?: boolean;
  stats: ProjectStat[];
};

/**
 * m3nu is a private/confidential project — no public repository link.
 * The rest are the most notable of github.com/bilalyazicioglu's public repos
 * (smaller CLI/course exercises are left off the site).
 */
export const projects: Project[] = [
  {
    slug: "m3nu",
    name: "m3nu",
    tag: "M3",
    category: "Private",
    badges: ["Private", "Featured"],
    description:
      "A web-based augmented reality menu viewer. Restaurants scan a dish into a real 3D model (or upload a .glb); customers open the menu on a phone and view any dish at true real-world scale through the live camera — no app install required.",
    featured: true,
    private: true,
    stats: [
      { label: "Stack", value: "React + Three.js" },
      { label: "Backend", value: "Node / Express" },
      { label: "Tests", value: "90+" },
      { label: "Status", value: "Private" },
    ],
  },
  {
    slug: "yovi",
    name: "YOVI",
    tag: "YV",
    category: "Open Source",
    badges: ["Live", "Team project"],
    live: true,
    description:
      "A full-stack strategy game built for my Software Architecture course — React frontend, Node.js users service, and a Rust game engine, with bots, leaderboards, and a full CI/CD pipeline to production. I worked on game logic & bots.",
    href: "https://github.com/Arquisoft/yovi_en1b",
    stats: [
      { label: "Role", value: "Game Logic & Bots" },
      { label: "Stack", value: "Rust + React" },
      { label: "Stars", value: "6" },
      { label: "Status", value: "Live" },
    ],
  },
  {
    slug: "cashcard-backend",
    name: "CashCard Backend",
    tag: "CC",
    category: "Open Source",
    badges: ["Spring Boot"],
    description: "A Spring Boot REST API for a cash-card ledger service.",
    href: "https://github.com/bilalyazicioglu/CashCard-Backend",
    stats: [
      { label: "Language", value: "Java" },
      { label: "Stars", value: "3" },
      { label: "Forks", value: "0" },
      { label: "Since", value: "2025" },
    ],
  },
  {
    slug: "moneyhandler",
    name: "moneyhandler",
    tag: "MH",
    category: "Open Source",
    badges: ["Open Source"],
    description: "A personal finance tracking app, built around my own needs.",
    href: "https://github.com/bilalyazicioglu/moneyhandler",
    stats: [
      { label: "Language", value: "Python" },
      { label: "Stars", value: "3" },
      { label: "Forks", value: "0" },
      { label: "Since", value: "2026" },
    ],
  },
  {
    slug: "community-portal",
    name: "Community Portal",
    tag: "CP",
    category: "Open Source",
    badges: ["Full-stack"],
    description:
      "A full-stack community portal — TypeScript frontend paired with a Go REST API backend.",
    href: "https://github.com/bilalyazicioglu/Community-Portal-",
    stats: [
      { label: "Frontend", value: "TypeScript" },
      { label: "Backend", value: "Go" },
      { label: "Stars", value: "2" },
      { label: "Since", value: "2025" },
    ],
  },
  {
    slug: "outofmatrix",
    name: "outofmatrix",
    tag: "OM",
    category: "Open Source",
    badges: ["In progress"],
    description:
      "A self-hosted media stasher, currently under active development.",
    href: "https://github.com/bilalyazicioglu/outofmatrix",
    stats: [
      { label: "Language", value: "Go" },
      { label: "Stars", value: "0" },
      { label: "Forks", value: "0" },
      { label: "Since", value: "2026" },
    ],
  },
  {
    slug: "currency-converter",
    name: "Currency Converter",
    tag: "CV",
    category: "Open Source",
    badges: ["CLI"],
    description: "A CLI currency converter built with BubbleTea and Go.",
    href: "https://github.com/bilalyazicioglu/Currency-converter",
    stats: [
      { label: "Language", value: "Go" },
      { label: "Stars", value: "2" },
      { label: "Forks", value: "0" },
      { label: "Since", value: "2025" },
    ],
  },
];
