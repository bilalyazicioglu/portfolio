/**
 * Access gate for /admin and /api/admin.
 *
 * The real boundary is the network, not this code. Everything below is read off
 * plain request headers, which anyone who can reach the app directly can set
 * themselves; this module only tells apart the two callers that are supposed to
 * be the only ones able to connect at all:
 *
 *   1. the public door — a reverse proxy fronted by Cloudflare
 *   2. `tailscale serve`, reachable only from inside the tailnet
 *
 * Anything arriving through (1) is treated as anonymous and gets a 404 for
 * admin routes.
 *
 * That holds only as far as the deployment keeps the container port out of
 * reach (see docker-compose.yml). Where the port is published more widely — as
 * it is on the homeserver, whose cloudflared runs in a container and so cannot
 * use the host's loopback — everyone on that network can pose as (2), and this
 * gate is doing less than it looks.
 *
 * It fails closed: if the expected configuration is missing in production,
 * admin access is denied rather than granted.
 */

type HeaderSource = { get(name: string): string | null };

/** Injected by `tailscale serve` for tailnet requests; stripped by nginx on the public path. */
const IDENTITY_HEADER = "tailscale-user-login";

/** Present on every request Cloudflare proxies. Its presence means "came from the public door". */
const CLOUDFLARE_HEADER = "cf-connecting-ip";

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin");
}

export function isAdminRequestAllowed(headers: HeaderSource): boolean {
  // Local development: the app is only bound to localhost anyway.
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  // Came through Cloudflare, i.e. the public internet. Never admin.
  if (headers.get(CLOUDFLARE_HEADER)) {
    return false;
  }

  // Required in production: without it we would accept any *.ts.net Host.
  const expectedHost = process.env.ADMIN_TAILNET_HOST?.trim().toLowerCase();
  if (!expectedHost) {
    console.error(
      "[admin-gate] ADMIN_TAILNET_HOST is not set — denying admin access. " +
        "Set it to your tailnet hostname, e.g. vps.tailXXXX.ts.net"
    );
    return false;
  }

  const host = (headers.get("host") ?? "").toLowerCase().split(":")[0];
  if (host !== expectedHost) {
    return false;
  }

  // Defence in depth: require the Tailscale-verified identity to match.
  const expectedLogin = process.env.ADMIN_TAILSCALE_LOGIN?.toLowerCase();
  if (expectedLogin) {
    const login = (headers.get(IDENTITY_HEADER) ?? "").toLowerCase();
    if (login !== expectedLogin) {
      return false;
    }
  }

  return true;
}
