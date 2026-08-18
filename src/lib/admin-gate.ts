/**
 * Access gate for /admin and /api/admin.
 *
 * The real boundary is the network, not this code. The container port is bound
 * to 127.0.0.1 (docker-compose.yml), so only two things can reach the app:
 *
 *   1. the public reverse proxy (nginx :443, fronted by Cloudflare)
 *   2. `tailscale serve`, reachable only from inside the tailnet
 *
 * This module tells those two apart. Anything arriving through (1) is treated
 * as anonymous and gets a 404 for admin routes.
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
