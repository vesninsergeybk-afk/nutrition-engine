#!/usr/bin/env python3
"""Verify the APK actually contains every dataset file the offline WebView loads."""
from __future__ import annotations

import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BUNDLE = ROOT / "android/app/build/generated-web"
APK = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "android/app/build/outputs/apk/debug/app-debug.apk"
html = (BUNDLE / "tools/nutrition/index.html").read_text(encoding="utf-8")
match = re.search(r'data-nutrition-runtime="(/tools/nutrition/runtime/[^"]+/)"', html)
if not match:
    raise SystemExit("Missing pinned runtime URL")
prefix = match.group(1).lstrip("/")
required = [
    "tools/nutrition/index.html",
    "assets/nutrition-app.js",
    "assets/nutrition-ai-offline.js",
    "assets/nutrition.css",
    "assets/workspace-storage.js",
    "assets/nutrient-android.css",
    prefix + "engine.js",
    prefix + "fields.json",
    prefix + "products.json",
]
with zipfile.ZipFile(APK) as archive:
    names = set(archive.namelist())
    for path in required:
        name = "assets/" + path
        if name not in names:
            raise SystemExit(f"APK missing required asset: {name}")
        from_apk = archive.read(name)
        from_bundle = (BUNDLE / path).read_bytes()
        if hashlib.sha256(from_apk).digest() != hashlib.sha256(from_bundle).digest():
            raise SystemExit(f"APK changed required asset: {name}")
        if not from_apk:
            raise SystemExit(f"APK asset is empty: {name}")
    products_bytes = archive.read("assets/" + prefix + "products.json")
    products = json.loads(products_bytes)
    fields = json.loads(archive.read("assets/" + prefix + "fields.json"))
    app = archive.read("assets/assets/nutrition-app.js").decode("utf-8")
    if "fetch(prefix+'products.json')" not in app:
        raise SystemExit("APK JS does not point to the bundled JSON file")
    if "fetch(prefix+'products.json.gz')" in app:
        raise SystemExit("APK still loads a gzip URL")
    if "assets/" + prefix + "products.json.gz" in names:
        raise SystemExit("APK ships a redundant gzip database")
    if not products or not fields:
        raise SystemExit("Offline database or field definitions are empty")
print(f"APK bundled-asset gate PASS: {len(required)} resources verified, "
      f"JSON database {len(products_bytes)} bytes")
