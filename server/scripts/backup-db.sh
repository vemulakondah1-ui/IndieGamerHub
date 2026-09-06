#!/usr/bin/env bash
set -euo pipefail

if [ -z "${MONGO_URI:-}" ]; then
  echo "MONGO_URI is not set" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
STAMP=$(date +%Y%m%d_%H%M%S)
DEST="$BACKUP_DIR/$STAMP"

mkdir -p "$DEST"
mongodump --uri="$MONGO_URI" --out="$DEST"

# Keep the 14 most recent backups (~2 weeks at daily cadence); head -n -14 is GNU-only and breaks on macOS/BSD, so this uses awk instead
find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d | sort | awk -v n=14 '{a[NR]=$0} END{for(i=1;i<=NR-n;i++) print a[i]}' | xargs -r rm -rf

echo "Backup written to $DEST"
