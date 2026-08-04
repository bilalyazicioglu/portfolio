#!/usr/bin/env bash
set -euo pipefail

DEST_DIR="monitoring/geolite2"
DEST="${DEST_DIR}/GeoLite2-City.mmdb"
mkdir -p "${DEST_DIR}"

if [ -n "${MAXMIND_LICENSE_KEY:-}" ]; then
  echo "Downloading GeoLite2-City from official MaxMind API..."
  URL="https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=${MAXMIND_LICENSE_KEY}&suffix=tar.gz"
  TMP_DIR="$(mktemp -d)"
  trap 'rm -rf "${TMP_DIR}"' EXIT
  curl -fsSL "${URL}" -o "${TMP_DIR}/GeoLite2-City.tar.gz"
  tar -xzf "${TMP_DIR}/GeoLite2-City.tar.gz" -C "${TMP_DIR}"
  find "${TMP_DIR}" -name "GeoLite2-City.mmdb" -exec mv {} "${DEST}" \;
else
  echo "No MAXMIND_LICENSE_KEY set. Downloading free GeoLite2-City.mmdb open source mirror..."
  URL="https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-City.mmdb"
  curl -fsSL "${URL}" -o "${DEST}"
fi

echo "Saved GeoLite2-City.mmdb to ${DEST}"
