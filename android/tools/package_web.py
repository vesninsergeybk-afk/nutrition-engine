#!/usr/bin/env python3
"""Reproducibly package the public, pinned VesninMed Nutrition runtime for Android.

This only reads the current repository's site/ tree. It neither downloads live
pages nor publishes changes to the website. The app has no INTERNET permission.
"""
from __future__ import annotations

import gzip
import hashlib
import json
import math
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / "site"
DEST = ROOT / "android/app/build/generated-web"
ASSETS = ROOT / "android/assets"


def copy_site(relative: str) -> None:
    src = (SITE / relative).resolve()
    if not src.is_relative_to(SITE.resolve()) or not src.is_file():
        raise RuntimeError(f"Required site asset missing: {relative}")
    target = DEST / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, target)


def build() -> None:
    ru_html = (SITE / "tools/nutrition/index.html").read_text(encoding="utf-8")
    matches = re.findall(r'data-nutrition-runtime="(/tools/nutrition/runtime/[^"]+/)"', ru_html)
    if len(matches) != 1:
        raise RuntimeError("Cannot determine pinned Nutrition runtime")
    runtime = matches[0].lstrip("/")
    manifest = json.loads((SITE / "tools/nutrition/source.json").read_text(encoding="utf-8"))
    if manifest["runtime"] not in runtime:
        raise RuntimeError("Runtime disagrees with the source manifest")
    gz = SITE / runtime / "products.json.gz"
    expected_hash = manifest["files"]["assets/data/products.v5.3.210-p1.3.compact.json.gz"]
    if hashlib.sha256(gz.read_bytes()).hexdigest() != expected_hash:
        raise RuntimeError("Product database hash differs from audited source")

    expected = ROOT / "android/app/build/generated-web"
    if DEST.resolve() != expected.resolve():
        raise RuntimeError("Refusing to replace an unexpected directory")
    if DEST.exists():
        shutil.rmtree(DEST)
    DEST.mkdir(parents=True)

    # The compiled engine is copied byte-for-byte; no formula or product edits.
    for name in ("engine.js", "fields.json"):
        copy_site(runtime + name)

    # Android WebView receives ordinary JSON. Keep the original gzip file in
    # the pinned site source, verify its hash, and decode it only for the APK.
    # This avoids .gz URL handling and DecompressionStream support differences.
    product_json = gzip.decompress(gz.read_bytes())
    products = json.loads(product_json)
    if not isinstance(products, list):
        raise RuntimeError("Audited food catalog is not an array")

    # Android-only, source-attributed food additions. The hash-verified base
    # archive remains untouched so the website and its audited source are safe.
    supplements = json.loads(
        (ROOT / "android/data/products-supplemental.json").read_text(encoding="utf-8")
    )
    if not isinstance(supplements, list):
        raise RuntimeError("Supplemental food catalog must be an array")
    known_keys = {record["key"] for record in products}
    nutrient_fields = (
        "kcal", "protein_per_100g", "fat_per_100g", "carbs_per_100g",
        "sugar_per_100g", "fiber_per_100g", "sfa", "unsat", "added_sugar",
        "salt", "calcium_mg", "iron_mg", "magnesium_mg", "phosphorus_mg",
        "potassium_mg", "sodium_mg", "zinc_mg", "copper_mg", "manganese_mg",
        "selenium_ug", "vitamin_a_mcg", "vitamin_e_mg", "vitamin_d_mcg",
        "vitamin_c_mg", "vitamin_b1_mg", "vitamin_b2_mg", "vitamin_b3_mg",
        "vitamin_b5_mg", "vitamin_b6_mg", "vitamin_b9_mcg", "vitamin_b12_mcg",
        "choline_mg", "vitamin_k_mcg",
    )
    for record in supplements:
        if not isinstance(record, dict) or not isinstance(record.get("key"), str):
            raise RuntimeError("Supplemental food must have a string key")
        if record["key"] in known_keys:
            raise RuntimeError("Duplicate food key: " + record["key"])
        if any(type(record.get(field)) not in (int, float)
               or not math.isfinite(record[field]) or record[field] < 0
               for field in nutrient_fields):
            raise RuntimeError("Incomplete or invalid nutrient profile: " + record["key"])
        provenance = record.get("nutrient_provenance_v1_3")
        if not isinstance(provenance, dict):
            raise RuntimeError("Missing nutrient provenance: " + record["key"])
        reported = [field for values in provenance.values() for field in values]
        if len(reported) != len(nutrient_fields) or set(reported) != set(nutrient_fields):
            raise RuntimeError("Nutrient provenance mismatch: " + record["key"])
        assumed = set(provenance.get("ASSUMED_ZERO", []))
        if any(record[field] == 0 and field not in assumed
               and field not in provenance.get("SOURCE_REPORTED_ZERO", [])
               for field in nutrient_fields):
            raise RuntimeError("Zero with unclassified meaning: " + record["key"])
        known_keys.add(record["key"])
        products.append(record)
    product_json = json.dumps(
        products, ensure_ascii=False, separators=(",", ":")
    ).encode("utf-8")
    product_target = DEST / runtime / "products.json"
    product_target.parent.mkdir(parents=True, exist_ok=True)
    product_target.write_bytes(product_json)
    for route in ("tools/nutrition/index.html", "tools/nutrition/en/index.html"):
        copy_site(route)
    for asset in (SITE / "assets").iterdir():
        if not asset.is_file() or asset.name == "nutrition-ai.js":
            continue
        if asset.name.startswith("nutrition-") or asset.name in (
            "nutrition.css", "shell.css", "workspace-storage.js"
        ):
            copy_site("assets/" + asset.name)
    if (SITE / "favicon.svg").is_file():
        copy_site("favicon.svg")

    # Client-side source has a remote Gemini bridge; the Android copy uses
    # its own explicitly local recognition component.
    app = DEST / "assets/nutrition-app.js"
    source = app.read_text(encoding="utf-8")
    old = "'./nutrition-ai.js?v='+root.dataset.nutritionAiVersion"
    if source.count(old) != 1:
        raise RuntimeError("AI module hook changed; review Android isolation")
    source = source.replace(old, "'./nutrition-ai-offline.js?v='+root.dataset.nutritionAiVersion")

    old_database_fetch = "fetch(prefix+'products.json.gz')"
    if source.count(old_database_fetch) != 1:
        raise RuntimeError("Product database URL changed; review APK packing")
    source = source.replace(old_database_fetch, "fetch(prefix+'products.json')")

    old_fetch_error = "if(!response.ok||!fieldsResponse.ok)throw Error('Загрузка базы прервана.');"
    if source.count(old_fetch_error) != 1:
        raise RuntimeError("Database failure handling changed; review diagnostics")
    source = source.replace(old_fetch_error,
        "if(!fieldsResponse.ok)throw Error('Файл нутриентов не найден (HTTP '+fieldsResponse.status+').');"
        "if(!response.ok)throw Error('База продуктов не найдена (HTTP '+response.status+').');"
    )

    # Emit a one-time boot result to logcat in Android, making a real WebView
    # startup check possible on the CI emulator without adding network access.
    for marker, signal in (
        ("root.dataset.nutritionReady='true';", "console.info('NUTRIENT_SMOKE_READY');"),
        ("root.dataset.nutritionReady='error';", "console.error('NUTRIENT_SMOKE_ERROR:'+String(error.message||'unknown'));"),
    ):
        if source.count(marker) != 1:
            raise RuntimeError("Boot readiness hook changed; review Android startup test")
        source = source.replace(marker, marker + signal)

    original_export = (
        "const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],"
        "{type:'application/json'})),link=document.createElement('a');"
        "link.href=url;link.download='vesninmed-nutrient.json';link.click();"
        "setTimeout(()=>URL.revokeObjectURL(url),1000);$('.nut-file-menu').open=false;"
    )
    if source.count(original_export) != 1:
        raise RuntimeError("Native JSON export hook changed; review before building")
    source = source.replace(
        original_export,
        "if(window.NutrientNative?.exportJson){"
        "window.NutrientNative.exportJson('vesninmed-nutrient.json',"
        "JSON.stringify(payload,null,2));}else{"
        + original_export[:-len("$('.nut-file-menu').open=false;")]
        + "}$('.nut-file-menu').open=false;"
    )
    app.write_text(source, encoding="utf-8")
    shutil.copyfile(ASSETS / "nutrition-ai-offline.js", DEST / "assets/nutrition-ai-offline.js")
    shutil.copyfile(ASSETS / "nutrient-android.css", DEST / "assets/nutrient-android.css")

    for path in (DEST / "tools/nutrition").rglob("index.html"):
        html = path.read_text(encoding="utf-8")
        # Deliberately strip site analytics, site navigation script and PWA registration.
        html = re.sub(r'<script[^>]*src="/assets/(?:metrika|site)\.js[^"]*"[^>]*></script>', '', html)
        html = re.sub(r'<link[^>]*rel="manifest"[^>]*>', '', html)
        html = html.replace(
            "</head>",
            '<link rel="stylesheet" href="/assets/nutrient-android.css">'
            '<script>window.print=function(){if(window.NutrientNative?.printReport)'
            'window.NutrientNative.printReport();};</script></head>',
            1,
        )
        html = html.replace("Добавить по фото или аудио", "Добавить по фотографии (без интернета)")
        html = html.replace("Фото или аудиофайлы", "Фотография")
        html = html.replace(
            'accept="image/jpeg,image/png,image/webp,audio/webm,audio/wav,audio/mpeg,audio/mp4,audio/ogg"',
            'accept="image/jpeg,image/png,image/webp"'
        )
        html = html.replace("Разрешаю передать выбранные файлы AI-сервису для распознавания.",
                            "Разрешаю обработать выбранную фотографию только на устройстве.")
        html = html.replace("Проверьте подключение к интернету и повторите загрузку.",
                            "Не удалось загрузить встроенные файлы приложения.")
        path.write_text(html, encoding="utf-8")

    # A completely offline build must not contain the networked recognition module.
    if (DEST / "assets/nutrition-ai.js").exists():
        raise RuntimeError("Remote AI module accidentally included")
    assert not (DEST / "api").exists()
    assert (DEST / runtime / "products.json").is_file()
    assert not (DEST / runtime / "products.json.gz").exists()
    print(json.dumps({
        "ok": True,
        "runtime": runtime,
        "source_database_gzip_sha256": expected_hash,
        "apk_database_json_sha256": hashlib.sha256(product_json).hexdigest(),
        "products_count": len(products),
        "supplemental_products_count": len(supplements),
        "files": len(list(DEST.rglob("*"))),
        "total_bytes": sum(p.stat().st_size for p in DEST.rglob("*") if p.is_file()),
        "no_internet_permission_required": True,
    }, indent=2))


if __name__ == "__main__":
    build()
