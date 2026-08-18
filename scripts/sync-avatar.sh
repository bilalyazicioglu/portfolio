#!/usr/bin/env bash
set -euo pipefail

# Refreshes the local copy of the GitHub profile picture used as the home page
# hero image. The file is committed so the site never depends on GitHub being
# reachable at request time — run this whenever the GitHub avatar changes.

DEST="public/github-avatar.png"
SIZE="${AVATAR_SIZE:-512}"

USERNAME="${GITHUB_USERNAME:-$(sed -n 's/.*githubUsername: "\([^"]*\)".*/\1/p' src/site.config.ts)}"
if [ -z "${USERNAME}" ]; then
  echo "Could not read githubUsername from src/site.config.ts. Set GITHUB_USERNAME to override." >&2
  exit 1
fi

echo "Fetching avatar for github.com/${USERNAME}..."
AVATAR_URL="$(curl -fsSL "https://api.github.com/users/${USERNAME}" \
  | sed -n 's/.*"avatar_url": *"\([^"]*\)".*/\1/p')"
if [ -z "${AVATAR_URL}" ]; then
  echo "GitHub API did not return an avatar_url for ${USERNAME}." >&2
  exit 1
fi

TMP="$(mktemp)"
trap 'rm -f "${TMP}"' EXIT
curl -fsSL "${AVATAR_URL}&s=${SIZE}" -o "${TMP}"

# Reject anything that is not a PNG so a failed fetch cannot break the build.
if [ "$(head -c 8 "${TMP}" | xxd -p)" != "89504e470d0a1a0a" ]; then
  echo "Downloaded file is not a PNG. Leaving ${DEST} untouched." >&2
  exit 1
fi

mv "${TMP}" "${DEST}"
trap - EXIT
echo "Updated ${DEST} ($(wc -c < "${DEST}" | tr -d ' ') bytes). Commit and redeploy to publish."
