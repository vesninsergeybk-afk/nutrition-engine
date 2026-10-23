#!/usr/bin/env python3
"""Fail the APK build if required local assets or offline boundaries are missing."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
BUNDLE = ROOT / "android/app/build/generated-web"
MANIFEST = ROOT / "android/app/src/main/AndroidManifest.xml"
required = [
    "tools/nutrition/index.html", "assets/nutrition-app.js",
    "assets/nutrition-ai-offline.js", "assets/nutrition.css",
    "assets/workspace-storage.js", "assets/nutrient-android.css",
]
for path in required:
    assert (BUNDLE / path).is_file(), f"Missing {path}"
android_xml = MANIFEST.read_text(encoding="utf-8")
assert "android.permission.INTERNET" not in android_xml.replace(
    "<!-- Deliberately no INTERNET permission: all runtime assets and inference are local. -->", ""
), "APK must not have network access"
assert 'nutrition-ai.js?v=' not in (BUNDLE / "assets/nutrition-app.js").read_text(encoding="utf-8")
assert "functions.yandexcloud.net" not in (BUNDLE / "assets/nutrition-ai-offline.js").read_text(encoding="utf-8")
assert not (BUNDLE / "assets/nutrition-ai.js").exists()
ru = (BUNDLE / "tools/nutrition/index.html").read_text(encoding="utf-8")
match = re.search(r'data-nutrition-runtime="(/tools/nutrition/runtime/[^"]+/)"', ru)
assert match
for name in ("engine.js","fields.json","products.json.gz"):
    assert (BUNDLE / match.group(1).lstrip("/") / name).is_file()
assert "nutrient-android.css" in ru
print("Offline static gate PASS — bundled engine, data, local AI bridge, no remote recognition")
