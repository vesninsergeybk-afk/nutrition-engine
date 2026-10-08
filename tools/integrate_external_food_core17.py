#!/usr/bin/env python3
"""Integrate the 17 Step-4F CORE reference foods without rewriting 1105 P1.3 records.

Input is a freshly regenerated Step-4F preview from pinned Step-4E Actions evidence.
Creates an additive part 13 and updates the active beta6 loaders, not calculation formulas.
This is a REVIEW_REQUIRED pilot; publishing still requires browser and science approval.
"""
from __future__ import annotations

import argparse
import copy
import gzip
import hashlib
import json
import math
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "external-food-core17-20261009"
JSON_OUT = "data/products.external-food-core17.part-13.json"
JS_OUT = "assets/data/products.external-food-core17.part-13.js"
MANIFEST_PATH = "assets/runtime/runtime-manifest-v6.0.0-beta6.js"
BUNDLE = "assets/data/products.v5.3.210-p1.3.bundle.js"
COMPRESSED = "assets/data/products.v5.3.210-p1.3.compact.json.gz"
FIELD_NAMES = (
    "kcal protein_per_100g fat_per_100g carbs_per_100g sugar_per_100g fiber_per_100g "
    "sfa unsat added_sugar salt calcium_mg iron_mg magnesium_mg phosphorus_mg "
    "potassium_mg sodium_mg zinc_mg copper_mg manganese_mg selenium_ug vitamin_a_mcg "
    "vitamin_e_mg vitamin_d_mcg vitamin_c_mg vitamin_b1_mg vitamin_b2_mg vitamin_b3_mg "
    "vitamin_b5_mg vitamin_b6_mg vitamin_b9_mcg vitamin_b12_mcg choline_mg vitamin_k_mcg"
).split()
HEI_NAMES = (
    "fruit_cup_eq_per_100g whole_fruit_cup_eq_per_100g veg_cup_eq_per_100g "
    "greens_beans_cup_eq_per_100g dairy_cup_eq_per_100g whole_grain_oz_eq_per_100g "
    "refined_grain_oz_eq_per_100g protein_oz_eq_per_100g seafood_plant_oz_eq_per_100g "
    "added_sugars_tsp_eq_per_100g"
).split()


def load(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def save(path, content):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def jtext(obj, *, pretty=False):
    return json.dumps(obj, ensure_ascii=False, indent=2 if pretty else None,
                      separators=None if pretty else (",", ":")) + "\n"


def normalize(text):
    text = unicodedata.normalize("NFKC", str(text or "")).casefold().replace("ё", "е")
    return " ".join(re.sub(r"[^\w]+", " ", text).split())


def check(condition, message):
    if not condition:
        raise ValueError(message)


def patch_exact(path, before, after):
    target = ROOT / path
    source = target.read_text(encoding="utf-8")
    check(source.count(before) == 1, f"Expected one patch anchor in {path}: {before[:55]}")
    save(path, source.replace(before, after))


def extend_method_source(path):
    target = ROOT / path
    source = target.read_text(encoding="utf-8")
    marker = "SOURCE_REPORTED_ZERO:0.03"
    replacement = "SOURCE_REPORTED:0.08," + marker
    check(source.count(marker) == 1, f"Missing unique uncertainty marker: {path}")
    save(path, source.replace(marker, replacement))


def extend_method_bundle(path, *, zipped=False):
    target = ROOT / path
    old = target.read_bytes()
    raw = gzip.decompress(old) if zipped else old
    before = b"SOURCE_REPORTED_ZERO:0.03"
    after = b"SOURCE_REPORTED:0.08," + before
    check(raw.count(before) == 1, f"Missing unique runtime quality engine: {path}")
    updated = raw.replace(before, after)
    target.write_bytes(gzip.compress(updated, compresslevel=9, mtime=0) if zipped else updated)


def build(preview_file: Path):
    preview = json.loads(preview_file.read_text(encoding="utf-8"))
    check(len(preview) == 32, "Step 4F evidence must contain 32 preview cards")
    core_pool = [copy.deepcopy(p) for p in preview if p.get("external_import_v15", {}).get("tier") == "CORE"]
    check(len(core_pool) == 17, f"Expected 17 CORE proposals, got {len(core_pool)}")
    quarantined = []
    chosen = []
    for candidate in core_pool:
        provenance = candidate.get("hei_equiv_provenance") or {}
        nutrition_row = normalize(candidate.get("name", ""))
        hei_row = normalize(provenance.get("description", ""))
        if provenance.get("status") == "OFFICIAL_EXACT" and (
            ("fresh" in nutrition_row and "dried" in hei_row) or
            ("dried" in nutrition_row and "fresh" in hei_row)
        ):
            quarantined.append({
                "key": candidate["key"], "name_ru": candidate["name_ru"],
                "reason": "HEI_OFFICIAL_EXACT_STATE_MISMATCH",
                "nutrition_row": candidate.get("name"),
                "hei_source_row": provenance.get("description")
            })
        else:
            chosen.append(candidate)
    check(len(chosen) == 16 and len(quarantined) == 1 and
          quarantined[0]["key"] == "ext_spice_thyme",
          f"Unexpected scientific quarantine: {quarantined}")

    base = []
    base_hashes = {}
    for i in range(1, 13):
        path = f"data/products.v5.3.210-p1.3.part-{i:02d}.json"
        base_hashes[path] = hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
        base.extend(load(path))
    check(len(base) == 1105, "Historical catalog changed; abort")
    prior_keys = {p["key"] for p in base}
    prior_names = {normalize(p.get("name_ru")) for p in base}
    prior_sources = {(str((p.get("data_quality_v1_3") or {}).get("source_registry_id")),
                      str((p.get("data_quality_v1_3") or {}).get("source_record_id"))) for p in base}
    seen_keys, seen_names, seen_sources = set(), set(), set()

    for p in chosen:
        q = p.get("data_quality_v1_3") or {}
        meta = p.get("external_import_v15") or {}
        key = p.get("key")
        name = normalize(p.get("name_ru"))
        src = (str(q.get("source_registry_id")), str(q.get("source_record_id")))
        check(key and key not in prior_keys and key not in seen_keys, f"Duplicate key: {key}")
        check(name and name not in prior_names and name not in seen_names, f"Duplicate RU name: {name}")
        check(src not in prior_sources and src not in seen_sources, f"Duplicate exact source: {src}")
        check(meta.get("step4e_status") == "PREVIEW_ONLY_REQUIRES_PRODUCTION_POLICY_GATE",
              f"Unexpected staging status: {key}")
        check(q.get("review_status") == "REVIEW_REQUIRED", f"Unexpected certification: {key}")
        check(q.get("source_kind") == "PRIMARY_DATASET", f"Unproven source: {key}")
        hp = p.get("hei_equiv_provenance") or {}
        check(hp.get("status") in ("OFFICIAL_EXACT", "STRUCTURAL_ZERO"), f"Unresolved HEI: {key}")
        check(all(type(p.get(f)) in (int, float) and math.isfinite(p[f]) and p[f]>=0 for f in FIELD_NAMES + HEI_NAMES),
              f"Non-numeric/negative nutrition: {key}")
        check(abs(p["salt"] - p["sodium_mg"]*2.54/1000) < 1e-6, f"Salt mismatch: {key}")
        check(0 <= p["kcal"] <= 1000, f"Invalid kcal: {key}")
        groups = p.get("nutrient_provenance_v1_3") or {}
        method_by_field = {}
        for method, fields in groups.items():
            check(method in ("SOURCE_REPORTED","SOURCE_REPORTED_ZERO","CALCULATED","ASSUMED_ZERO"),
                  f"Unknown provenance method: {key}:{method}")
            for f in fields:
                check(f not in method_by_field, f"Repeated nutrient provenance: {key}:{f}")
                method_by_field[f] = method
        check(set(method_by_field) == set(FIELD_NAMES), f"Incomplete provenance: {key}")
        for f in FIELD_NAMES:
            method = method_by_field[f]
            if method == "SOURCE_REPORTED_ZERO": check(p[f] == 0, f"False reported zero: {key}:{f}")
            if method == "SOURCE_REPORTED": check(p[f] != 0, f"False source nonzero: {key}:{f}")
            if method == "ASSUMED_ZERO": check(f == "added_sugar" and p[f] == 0,
                                              f"Invalid assumed zero: {key}:{f}")
        check(p.get("unknown_zero_fields_v1_3", []) == sorted(groups.get("ASSUMED_ZERO", [])),
              f"Ambiguous zeros: {key}")
        p["tags"] = [t for t in p.get("tags", []) if t != "preview_only"]
        p["search_aliases"] = list(dict.fromkeys([p["name_ru"], p.get("name",""), meta.get("family_key","")]))
        p["product_db_schema_version"] = "v5.3.210-p1.3+external-v15-core17"
        q.update({
            "schema_version": 1,
            "policy_version": VERSION,
            "source_id": p.get("source_id",""),
            "source_dataset": p.get("source_dataset",""),
            "source_url": p.get("source_url",""),
            "source_version": p.get("source_version") or "unknown",
            "food_state": p.get("state","unspecified"),
            "review_status": "REVIEW_REQUIRED",
            "confidence_tier": "MEDIUM",
            "confidence_score": 0.55,
            "issues": ["EXTERNAL_REFERENCE_REQUIRES_INDEPENDENT_SCIENTIFIC_REVIEW",
                       "ADDED_SUGAR_IS_ASSUMED_ZERO"],
            "assumed_zero_count": len(groups.get("ASSUMED_ZERO", [])),
            "missing_count": 0,
        })
        p["data_quality_v1_3"] = q
        meta["permission"] = "PILOT_REVIEW_REQUIRED"
        p["external_import_v15"] = meta
        seen_keys.add(key)
        seen_names.add(name)
        seen_sources.add(src)

    check(len(base + chosen) == len({p["key"] for p in base + chosen}), "Product keys collide")
    check(len(base + chosen) == 1121, "Product count changed unexpectedly")
    save(JSON_OUT, jtext(chosen))
    save(JS_OUT, ("// External reference food pilot; shard 13, generated and reviewed separately.\n"
                  "window.__PRODUCT_SCRIPT_CHUNKS__ = window.__PRODUCT_SCRIPT_CHUNKS__ || [];\n"
                  "window.__PRODUCT_SCRIPT_CHUNKS__[12] = " +
                  json.dumps(chosen, ensure_ascii=False, separators=(",", ":")) + ";\n"))
    all_products = base + chosen
    bundle_payload = json.dumps(all_products, ensure_ascii=False, separators=(",", ":"))
    save(BUNDLE, "/* Single-request product bundle: 1105 canonical + 17 external pilot. */\n"
         "window.__PRODUCTS_BUNDLE__=" + bundle_payload + ";\n")
    compressed_payload = (bundle_payload+"\n").encode("utf-8")
    (ROOT/COMPRESSED).write_bytes(gzip.compress(compressed_payload, compresslevel=9, mtime=0))
    compressed_size = (ROOT/COMPRESSED).stat().st_size

    # Schema extension is additive: historical P1.3 policy, canonical records and
    # their governed registry remain byte-identical and regenerate without changes.
    extension = {
        "schema_version": 1, "version": VERSION,
        "review_status": "REVIEW_REQUIRED", "source_model": "reference_food_per_100g",
        "new_method": {"SOURCE_REPORTED": {"relative_uncertainty": 0.08,
                       "meaning": "Value reported in an identified primary food-composition row; not laboratory-verified here."}},
        "old_registry_unchanged": True, "assumed_added_sugar_is_measurement": False,
        "unknown_is_never_silently_zero": True, "pilot_cards": len(chosen)
    }
    save("config/external-food-core17-provenance-extension.json", jtext(extension, pretty=True))
    extend_method_source("assets/js/02-product-data-quality-v5.3.210-p1.3.js")
    extend_method_source("assets/legacy/js/02-product-data-quality-v5.3.210-p1.3.js")
    deferred_sizes = {}
    for suffix, marker in [(".js","Modern"), (".legacy.js","Legacy")]:
        path = f"assets/runtime/deferred-runtime-v5.3.210-rc2-hf24{suffix}"
        extend_method_bundle(path)
        extend_method_bundle(path+".gz", zipped=True)
        deferred_sizes[marker] = (ROOT/(path+".gz")).stat().st_size

    for path in ["assets/js/00-runtime-bootstrap-v6.0.0-beta6.js",
                 "assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta6.legacy.js"]:
        patch_exact(path, "window.__PRODUCTS_ARRAY__.length===1105",
                    "window.__PRODUCTS_ARRAY__.length===Number(RUNTIME_MANIFEST.fastStart.productCount)")
    json_url = "./"+JSON_OUT+"?v="+VERSION
    js_url = "./"+JS_OUT+"?v="+VERSION
    manifest_file = ROOT/MANIFEST_PATH
    txt = manifest_file.read_text(encoding="utf-8")
    check(txt.count("var m=")==1, "Invalid active runtime manifest")
    prefix, remain = txt.split("var m=",1)
    payload, suffix = remain.split(";if(Object.freeze)",1)
    m = json.loads(payload)
    check(m["fastStart"]["productCount"]==1105, "Active runtime manifest count changed")
    check(len(m["productJsonChunks"])==12 and len(m["productScriptChunks"])==12,
          "Unexpected active runtime manifest shards")
    m["productJsonChunks"].append(json_url)
    m["productScriptChunks"].append(js_url)
    m["fastStart"]["productCount"] = len(all_products)
    m["assetBytes"]["productCompressed"] = compressed_size
    m["assetBytes"]["deferredRuntimeModernCompressed"] = deferred_sizes["Modern"]
    m["assetBytes"]["deferredRuntimeLegacyCompressed"] = deferred_sizes["Legacy"]
    m["productBundleScript"] = m["productBundleScript"].split("?")[0]+"?v="+VERSION
    m["productCompressedJson"] = m["productCompressedJson"].split("?")[0]+"?v="+VERSION
    for k in ("modern","legacy"):
        m["deferredRuntimeBundles"][k] = m["deferredRuntimeBundles"][k].split("?")[0]+"?v="+VERSION
        m["deferredRuntimeCompressed"][k] = m["deferredRuntimeCompressed"][k].split("?")[0]+"?v="+VERSION
    save(MANIFEST_PATH, prefix+"var m="+json.dumps(m,ensure_ascii=False,separators=(",",":"))+
         ";if(Object.freeze)"+suffix)
    conf_path = "config/runtime-assets.v6.0.0-beta6.json"
    cfg = load(conf_path)
    check(len(cfg["product_json_chunks"])==12 and len(cfg["product_script_chunks"])==12,
          "Unexpected current config shards")
    cfg["product_json_chunks"].append(json_url)
    cfg["product_script_chunks"].append(js_url)
    cfg["fast_start"]["product_bundle_script"] = m["productBundleScript"]
    cfg["fast_start"]["product_compressed_json"] = m["productCompressedJson"]
    cfg["fast_start"]["deferred_runtime_bundles"] = m["deferredRuntimeBundles"]
    cfg["fast_start"]["deferred_runtime_compressed"] = m["deferredRuntimeCompressed"]
    cfg["asset_bytes"]["deferred_runtime_modern_compressed"] = deferred_sizes["Modern"]
    cfg["asset_bytes"]["deferred_runtime_legacy_compressed"] = deferred_sizes["Legacy"]
    save(conf_path, jtext(cfg, pretty=True))
    for index_path in ("index.html", "index-v5.3.210.html"):
        patch_exact(index_path,
            "./assets/runtime/runtime-manifest-v6.0.0-beta6.js?v=v6-needs-checkpoint-2026-09-11",
            "./assets/runtime/runtime-manifest-v6.0.0-beta6.js?v="+VERSION)

    for path, expected in base_hashes.items():
        check(hashlib.sha256((ROOT/path).read_bytes()).hexdigest()==expected,
              f"Canonical base mutated: {path}")
    output = {
      "status": "STAGED_REVIEW_REQUIRED",
      "branch_pilot": VERSION, "canonical_unchanged": len(base),
      "added": len(chosen), "total": len(all_products), "shard_count": 13,
      "keys": [p["key"] for p in chosen],
      "names_ru": [p["name_ru"] for p in chosen],
      "quarantined": quarantined,
      "all_33_nutrients_numeric": True, "all_10_hei_equivalents_numeric": True,
      "all_review_required": True, "unknown_added_sugar_reported_as_assumption": True,
      "energy_hei_calculation_core_changed": False, "production_published": False,
      "new_shard_json": JSON_OUT, "new_shard_js": JS_OUT,
      "runtime_manifest": MANIFEST_PATH,
      "old_shard_sha256": base_hashes,
    }
    save("reports/external-food-core17-integration.json", jtext(output, pretty=True))
    print(json.dumps({k:output[k] for k in ["status","canonical_unchanged","added","total",
        "shard_count","names_ru"]},ensure_ascii=False,indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--step4f-preview", required=True, type=Path)
    args = parser.parse_args()
    build(args.step4f_preview)
