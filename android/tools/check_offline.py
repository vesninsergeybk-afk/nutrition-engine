#!/usr/bin/env python3
"""Fail the APK build if required local assets or offline boundaries are missing."""
from pathlib import Path
import re
import xml.etree.ElementTree as ET

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
android_xml = ET.parse(MANIFEST).getroot()
android_ns = "{http://schemas.android.com/apk/res/android}"
tools_ns = "{http://schemas.android.com/tools}"
internet_nodes = [p for p in android_xml.findall("uses-permission")
                  if p.attrib.get(android_ns+"name") == "android.permission.INTERNET"]
assert len(internet_nodes) == 1 and internet_nodes[0].attrib.get(tools_ns+"node") == "remove", (
    "The manifest must explicitly reject transitive INTERNET permissions"
)
# CI separately inspects the *merged APK* with aapt. This source check cannot
# prove that third-party manifest merger rules were actually applied.
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
