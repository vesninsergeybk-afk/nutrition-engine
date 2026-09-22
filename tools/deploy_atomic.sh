#!/usr/bin/env bash
set -euo pipefail
ARTIFACT=${1:?Usage: deploy_atomic.sh ARTIFACT.zip RELEASES_DIR CURRENT_SYMLINK}
RELEASES_DIR=${2:?}
CURRENT_LINK=${3:?}
[[ -f "$ARTIFACT" ]] || { echo "Artifact not found" >&2; exit 2; }
mkdir -p "$RELEASES_DIR"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
NAME="nutrition-${STAMP}-$(sha256sum "$ARTIFACT" | cut -c1-12)"
TARGET="$RELEASES_DIR/$NAME"
TMP="$RELEASES_DIR/.${NAME}.tmp"
rm -rf "$TMP"; mkdir -m 0755 "$TMP"
unzip -q "$ARTIFACT" -d "$TMP"
python3 "$(dirname "$0")/verify_release.py" "$ARTIFACT"
find "$TMP" -type d -exec chmod 0755 {} +
find "$TMP" -type f -exec chmod 0644 {} +
mv "$TMP" "$TARGET"
PREVIOUS=''
[[ -L "$CURRENT_LINK" ]] && PREVIOUS=$(readlink -f "$CURRENT_LINK" || true)
ln -sfn "$TARGET" "${CURRENT_LINK}.next"
mv -Tf "${CURRENT_LINK}.next" "$CURRENT_LINK"
printf '%s\n' "$PREVIOUS" > "$RELEASES_DIR/.previous-release"
echo "$TARGET"
