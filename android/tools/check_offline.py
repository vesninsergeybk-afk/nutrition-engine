#!/usr/bin/env python3
"""Verify offline calculations and the strictly data-only update boundary."""
from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
BUNDLE = ROOT / "android/app/build/generated-web"
MANIFEST = ROOT / "android/app/src/main/AndroidManifest.xml"
required = [
    "tools/nutrition/index.html", "assets/nutrition-app.js",
    "assets/nutrition-ai-offline.js", "assets/nutrition.css",
    "assets/workspace-storage.js", "assets/nutrient-android.css",
    "assets/nutrient-catalog-sync.js", "assets/nutrient-catalog.json",
]
for path in required:
    assert (BUNDLE / path).is_file(), f"Missing {path}"
android_xml = ET.parse(MANIFEST).getroot()
android_ns = "{http://schemas.android.com/apk/res/android}"
tools_ns = "{http://schemas.android.com/tools}"
internet_nodes = [p for p in android_xml.findall("uses-permission")
                  if p.attrib.get(android_ns+"name") == "android.permission.INTERNET"]
assert len(internet_nodes) == 1 and internet_nodes[0].attrib.get(tools_ns+"node") != "remove", (
    "Native HTTPS catalog checks require the INTERNET permission"
)
# CI separately inspects the *merged APK* with aapt. This source check cannot
# prove that third-party manifest merger rules were actually applied.
assert 'nutrition-ai.js?v=' not in (BUNDLE / "assets/nutrition-app.js").read_text(encoding="utf-8")
assert "functions.yandexcloud.net" not in (BUNDLE / "assets/nutrition-ai-offline.js").read_text(encoding="utf-8")
assert not (BUNDLE / "assets/nutrition-ai.js").exists()
ru = (BUNDLE / "tools/nutrition/index.html").read_text(encoding="utf-8")
match = re.search(r'data-nutrition-runtime="(/tools/nutrition/runtime/[^"]+/)"', ru)
assert match
for name in ("engine.js","fields.json","products.json"):
    assert (BUNDLE / match.group(1).lstrip("/") / name).is_file()
assert "nutrient-android.css" in ru
assert "nutrient-catalog-sync.js" in ru
assert "fetch(prefix+'products.json')" in (BUNDLE / "assets/nutrition-app.js").read_text(encoding="utf-8")
assert not (BUNDLE / match.group(1).lstrip("/") / "products.json.gz").exists()
manifest = json.loads((BUNDLE / "assets/nutrient-catalog.json").read_text(encoding="utf-8"))
assert manifest["format"] == "nutrient-catalog-v1"
assert manifest["schemaVersion"] == 1
assert manifest["minAndroidVersionCode"] <= 2
assert manifest["productCount"] == 1164
assert "android/catalog/" not in ru, "Browser must never fetch update files directly"

# The Android food supplement must be present in the actual offline APK
# database, not only in its source JSON file.
catalog = json.loads(
    (BUNDLE / match.group(1).lstrip("/") / "products.json").read_text(encoding="utf-8")
)
assert len(catalog) == 1164, "Expected pinned 1105-food base plus 59 reviewed additions"
tvorog = [p for p in catalog if p.get("key") == "tvorog_prostokvashino_2pct_200g"]
assert len(tvorog) == 1, "Prostokvashino 2% not found in packed catalog"
p = tvorog[0]
assert p["name_ru"] == "Творог «Простоквашино» 2%, 200 г"
assert p["barcode"] == "4600605029343"
assert (p["kcal"], p["protein_per_100g"], p["fat_per_100g"],
        p["carbs_per_100g"]) == (99, 17, 2, 3.3)
assert round(p["kcal"] * p["package_size_g"] / 100) == 198
assert p["dairy_cup_eq_per_100g"] == round(p["calcium_mg"] / 302, 4)
assert len(set(sum(p["nutrient_provenance_v1_3"].values(), []))) == 33
assert p["data_quality_v1_3"]["source_kind"] == "MIXED_SOURCE"
print("Offline-calculation gate PASS — 1164 foods, local engine and recognition, native-only optional catalog updates")
