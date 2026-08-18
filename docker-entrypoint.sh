#!/bin/sh
set -e

# Posts live on the `content-data` volume so /admin can write them at runtime.
# The image ships the git-tracked posts as a seed; copy them in the first time
# the volume is empty, then never touch it again — the volume is the source of
# truth in production (pull it back into git with scripts/sync-content.sh).
CONTENT_DIR="${BLOG_DIR_PATH:-/app/content/blog}"
SEED_DIR="/app/content-seed"

mkdir -p "$CONTENT_DIR"

if [ -d "$SEED_DIR" ] && [ -z "$(ls -A "$CONTENT_DIR" 2>/dev/null)" ]; then
  echo "[entrypoint] seeding $CONTENT_DIR from $SEED_DIR"
  cp -a "$SEED_DIR"/. "$CONTENT_DIR"/
fi

exec "$@"
