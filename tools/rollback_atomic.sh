#!/usr/bin/env bash
set -euo pipefail
RELEASES_DIR=${1:?Usage: rollback_atomic.sh RELEASES_DIR CURRENT_SYMLINK}
CURRENT_LINK=${2:?}
PREVIOUS_FILE="$RELEASES_DIR/.previous-release"
[[ -f "$PREVIOUS_FILE" ]] || { echo "No previous release recorded" >&2; exit 2; }
PREVIOUS=$(cat "$PREVIOUS_FILE")
[[ -d "$PREVIOUS" ]] || { echo "Previous release missing: $PREVIOUS" >&2; exit 3; }
CURRENT=$(readlink -f "$CURRENT_LINK" || true)
ln -sfn "$PREVIOUS" "${CURRENT_LINK}.next"
mv -Tf "${CURRENT_LINK}.next" "$CURRENT_LINK"
printf '%s\n' "$CURRENT" > "$PREVIOUS_FILE"
echo "$PREVIOUS"
