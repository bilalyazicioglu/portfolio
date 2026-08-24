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
PNG="$(mktemp)"
trap 'rm -f "${TMP}" "${PNG}"' EXIT
curl -fsSL "${AVATAR_URL}&s=${SIZE}" -o "${TMP}"

# GitHub hands back the avatar in whatever format it was uploaded in, so this is
# usually JPEG. Sniff the magic bytes with od (present everywhere, unlike xxd)
# so a failed fetch that lands HTML or JSON here cannot break the build, then
# normalise to PNG because the site references github-avatar.png.
MAGIC="$(od -An -tx1 -N4 "${TMP}" | tr -d ' \n')"
case "${MAGIC}" in
  89504e47)
    cp "${TMP}" "${PNG}"
    ;;
  ffd8ff??)
    if ! SRC="${TMP}" OUT="${PNG}" node -e 'require("sharp")(process.env.SRC).png().toFile(process.env.OUT).catch((err) => { console.error(err.message); process.exit(1); })'; then
      echo "Downloaded a JPEG avatar but could not convert it to PNG. Run 'npm install' so sharp is available." >&2
      exit 1
    fi
    ;;
  *)
    echo "Downloaded file is not a PNG or JPEG (magic bytes: ${MAGIC:-none}). Leaving ${DEST} untouched." >&2
    exit 1
    ;;
esac

mv "${PNG}" "${DEST}"
chmod 644 "${DEST}" # mktemp creates 0600 files; the checked-in asset must be readable
echo "Updated ${DEST} ($(wc -c < "${DEST}" | tr -d ' ') bytes). Commit and redeploy to publish."
