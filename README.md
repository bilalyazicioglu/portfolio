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
- `src/content/blog/*.mdx` — blog posts (frontmatter: `title`, `summary`, `date`,
  `tags`, `lang: "tr" | "en"`, optional `draft: true`). `lang` drives the TR/EN
  filter on `/blog` and the `lang` attribute on the post itself; anything other
  than `"tr"` is treated as English.

Posts with `draft: true` are hidden from `/blog`, from the sitemap, and return
404 on their public URL. They are only visible through the admin preview.

## Writing posts (`/admin`)

`/admin` is a browser editor for creating, editing, previewing, and deleting
posts. It is reachable **only over the tailnet** — see below.

Locally it is simply available at http://localhost:3000/admin (the gate is
disabled outside production).

### How the access gate works

The real boundary is the network, not application code:

- The container port is bound to `127.0.0.1` (`docker-compose.yml`), so the app
  is only reachable through two doors: the public reverse proxy (nginx, behind
  Cloudflare) and `tailscale serve`.
- `src/proxy.ts` returns **404** for `/admin` and `/api/admin` on anything that
  came through the public door — identified by the `cf-connecting-ip` header
  Cloudflare always sets, and by the `Host` not matching the tailnet hostname.
- There is no login form, no password, and no session token to steal.

`/admin` is deliberately **not** listed in `robots.txt` — that would advertise a
path that is otherwise invisible.

### One-time VPS setup

1. Serve the app on the tailnet:

   ```bash
   tailscale serve --bg 3000
   tailscale serve status   # prints your https://<host>.tailXXXX.ts.net URL
   ```

2. Put the tailnet hostname in a `.env` file next to `docker-compose.yml`
   (gitignored):

   ```bash
   ADMIN_TAILNET_HOST=vps.tailXXXX.ts.net
   ADMIN_TAILSCALE_LOGIN=you@example.com   # optional second check
   ```

   **`ADMIN_TAILNET_HOST` is required in production.** If it is unset the gate
   fails closed: every admin request gets a 404 and a `[admin-gate]` line is
   logged.

3. In the public nginx `server` block, drop any identity header a client tries
   to smuggle in:

   ```nginx
   proxy_set_header Tailscale-User-Login "";
   ```

4. Confirm the origin port is not publicly reachable — from another network:

   ```bash
   curl --connect-timeout 5 http://<vps-ip>:3000   # must fail
   ```

### Where posts are stored in production

The production image does not contain `src/content/blog`. Posts live on the
`content-data` Docker volume at `/app/content/blog` (`BLOG_DIR_PATH`), which is
what makes runtime writing possible. On first boot `docker-entrypoint.sh` seeds
the volume from the git-tracked posts baked into the image.

This means **the volume is the source of truth in production**. Posts written
from `/admin` exist only on the VPS until you pull them back into git:

```bash
./scripts/sync-content.sh <ssh-host-or-tailnet-name>
git add src/content/blog && git commit
```

Publishing calls `revalidatePath`, so a new post appears on the public site
within seconds — no rebuild needed.

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
