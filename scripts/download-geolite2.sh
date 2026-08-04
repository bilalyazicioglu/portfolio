#!/usr/bin/env bash
set -euo pipefail

LICENSE_KEY="${MAXMIND_LICENSE_KEY:?Set MAXMIND_LICENSE_KEY to a GeoLite2 license key (https://www.maxmind.com/en/account/login/license-key)}"

DEST_DIR="monitoring/geolite2"
DEST="${DEST_DIR}/GeoLite2-City.mmdb"
URL="https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=${LICENSE_KEY}&suffix=tar.gz"

mkdir -p "${DEST_DIR}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

curl -fsSL "${URL}" -o "${TMP_DIR}/GeoLite2-City.tar.gz"
tar -xzf "${TMP_DIR}/GeoLite2-City.tar.gz" -C "${TMP_DIR}"
find "${TMP_DIR}" -name "GeoLite2-City.mmdb" -exec mv {} "${DEST}" \;

echo "Saved GeoLite2-City.mmdb to ${DEST}"
