#!/usr/bin/env bash
#
# Pull posts written from /admin back into git.
#
# In production the content volume is the source of truth: /admin writes .mdx
# files straight onto it, so anything published from the phone exists only on
# the VPS until this script copies it down. Run it now and then, review the
# diff, and commit.
#
# Usage:
#   ./scripts/sync-content.sh                  # uses $BLOG_VPS_HOST
#   ./scripts/sync-content.sh my-vps           # tailnet name or ssh alias
#   BLOG_CONTAINER=blog ./scripts/sync-content.sh my-vps
#
set -euo pipefail

HOST="${1:-${BLOG_VPS_HOST:-}}"
CONTAINER="${BLOG_CONTAINER:-blog}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$REPO_ROOT/src/content/blog"

if [ -z "$HOST" ]; then
  echo "error: no host given. Pass one as an argument or set BLOG_VPS_HOST." >&2
  echo "usage: $0 <ssh-host-or-tailnet-name>" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "==> copying posts out of the '$CONTAINER' container on $HOST"
# tar over ssh: works whether or not the volume path is readable from the host.
ssh "$HOST" "docker exec $CONTAINER tar -cf - -C /app/content/blog ." \
  | tar -xf - -C "$TMP_DIR"

if ! ls "$TMP_DIR"/*.mdx >/dev/null 2>&1; then
  echo "error: no .mdx files came back — nothing written." >&2
  exit 1
fi

echo "==> writing into $DEST"
mkdir -p "$DEST"
# Deliberately additive: never delete local files based on what the server has.
cp -a "$TMP_DIR"/*.mdx "$DEST"/

echo "==> done. Review and commit:"
git -C "$REPO_ROOT" status --short -- src/content/blog
