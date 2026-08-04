# Personal site & blog

A personal website and blog built with Next.js (App Router), TypeScript,
Tailwind CSS, and MDX.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## Content

- `src/site.config.ts` — name, role, bio, socials, contact info.
- `src/lib/projects.ts` — portfolio project data.
- `src/content/blog/*.mdx` — blog posts (frontmatter: `title`, `summary`, `date`, `tags`).

## Build

```bash
npm run build
npm run start
```

`npm run build` produces a standard Node.js server build. Deploy it to any
Node-capable host (a VPS, Docker container, Railway, Render, Fly.io, Netlify,
Cloudflare, etc.) — no platform-specific configuration is required.

## Monitoring (Prometheus + Grafana)

The app exposes Prometheus metrics at `/metrics` (Node.js process metrics via
`prom-client`, plus `blog_request_errors_total` and
`blog_last_request_timestamp_seconds`). The Docker Compose stack includes:

- `node-exporter` — host metrics (CPU, memory, disk, network)
- `prometheus` — scrapes the blog and the host (bound to 127.0.0.1:9090)
- `grafana` — provisioned datasource + "Blog Monitoring" dashboard (port 3001)

Start everything:

```bash
GRAFANA_ADMIN_PASSWORD=<strong-password> docker compose up -d --build
```

Then open:

- Grafana: http://localhost:3001 (admin / `$GRAFANA_ADMIN_PASSWORD`)
- Prometheus: http://localhost:9090 (localhost only — use an SSH tunnel or
  restrict it via firewall if you need remote access)

By default the stack retains Prometheus data for 30 days
(`--storage.tsdb.retention.time=30d`). Data persists in the
`prometheus-data` and `grafana-data` volumes.

Restart just the app after a code change:

```bash
docker compose up -d --build blog
```

Notes:

- `/metrics` is unauthenticated; block it from the public internet (firewall /
  reverse proxy) if you don't want it exposed.
- The Grafana admin password defaults to `admin` if `GRAFANA_ADMIN_PASSWORD`
  is not set — always set it on a live host.
# portfolio
