#!/usr/bin/env bash
set -euo pipefail

# Benchmark asset fetcher.
# Large source archives are deliberately NOT committed into ordinary Git history.
# Run this on a workstation/build runner with enough disk space.

ROOT="$(cd "$(dirname "$0")" && pwd)"
CACHE="${MODEL_CACHE_DIR:-$ROOT/.model-cache}"
mkdir -p "$CACHE"

download() {
  local id="$1"
  local url="$2"
  local out="$3"
  echo "==> $id"
  if [ -f "$out" ]; then
    echo "    already present: $out"
    return
  fi
  curl -fL --retry 3 --retry-delay 2 "$url" -o "$out"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$out"
  fi
  ls -lh "$out"
}

case "${1:-small}" in
  small)
    download "z-anatomy muscles"       "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c8f0e411f06f9bba592f/systems/kas.glb"       "$CACHE/z-anatomy-kas.glb"
    download "z-anatomy skeleton"       "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c59a3a32966f25ce59165c/systems/iskelet.glb"       "$CACHE/z-anatomy-iskelet.glb"
    ;;

  nih-arms)
    download "Visible Human right arm muscles"       "https://3d.nih.gov/api/submissions/16028/runs/949001c5-c322-4a6e-bfd5-c89b02264de6/output-files/355370"       "$CACHE/visible-human-right-arm.glb"
    download "Visible Human left arm muscles"       "https://3d.nih.gov/api/submissions/16026/runs/89f05a36-4f00-4a5c-99a0-2d8c2c2bdc47/output-files/355423"       "$CACHE/visible-human-left-arm.glb"
    ;;

  bodyparts3d-95)
    download "BodyParts3D 3.0 OBJ 95%"       "https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/BodyParts3D_3.0_obj_95.zip"       "$CACHE/BodyParts3D_3.0_obj_95.zip"
    ;;

  hra-male)
    download "HRA united male v1.10"       "https://cdn.humanatlas.io/digital-objects/ref-organ/united-male/v1.10/assets/3d-vh-m-united.glb"       "$CACHE/hra-united-male-v1.10.glb"
    ;;

  *)
    echo "Usage: $0 {small|nih-arms|bodyparts3d-95|hra-male}"
    exit 2
    ;;
esac
