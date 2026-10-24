"""Validated, deterministic data-only catalog shared by APK and update channel.

The site runtime is pinned by source.json. Supplemental Android records must be
merged into that authoritative runtime until they are also published on the site.
"""
from __future__ import annotations

import gzip
import hashlib
import io
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CATALOG_DIR = ROOT / "android/catalog"
SCHEMA = "nutrient-catalog-v1"
NUTRIENT_FIELDS = (
    "kcal", "protein_per_100g", "fat_per_100g", "carbs_per_100g",
    "sugar_per_100g", "fiber_per_100g", "sfa", "unsat", "added_sugar",
    "salt", "calcium_mg", "iron_mg", "magnesium_mg", "phosphorus_mg",
    "potassium_mg", "sodium_mg", "zinc_mg", "copper_mg", "manganese_mg",
    "selenium_ug", "vitamin_a_mcg", "vitamin_e_mg", "vitamin_d_mcg",
    "vitamin_c_mg", "vitamin_b1_mg", "vitamin_b2_mg", "vitamin_b3_mg",
    "vitamin_b5_mg", "vitamin_b6_mg", "vitamin_b9_mcg", "vitamin_b12_mcg",
    "choline_mg", "vitamin_k_mcg",
)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def validate_products(products: object) -> list[dict]:
    if not isinstance(products, list) or not products or len(products) > 100_000:
        raise ValueError("Catalog must be a nonempty bounded array")
    keys: set[str] = set()
    for record in products:
        if not isinstance(record, dict):
            raise ValueError("Product must be an object")
        key = record.get("key")
        if not isinstance(key, str) or not 1 <= len(key) <= 160 or key in keys:
            raise ValueError(f"Missing or duplicate food key: {key!r}")
        keys.add(key)
        if not isinstance(record.get("name_ru"), str) or not record["name_ru"].strip():
            raise ValueError(f"Missing Russian food name: {key}")
        for field in NUTRIENT_FIELDS:
            value = record.get(field)
            if type(value) not in (int, float) or not math.isfinite(value) or value < 0:
                raise ValueError(f"Missing/invalid {field}: {key}")
        provenance = record.get("nutrient_provenance_v1_3")
        if not isinstance(provenance, dict):
            raise ValueError(f"Missing nutrient provenance: {key}")
        mentioned = [name for values in provenance.values()
                     if isinstance(values, list) for name in values]
        if len(mentioned) != len(NUTRIENT_FIELDS) or set(mentioned) != set(NUTRIENT_FIELDS):
            raise ValueError(f"Incomplete provenance classification: {key}")
        for category in ("ASSUMED_ZERO", "SOURCE_REPORTED_ZERO"):
            for field in provenance.get(category, []):
                if record[field] != 0:
                    raise ValueError(f"Nonzero value declared as zero: {key}:{field}")
    return products


def assemble_catalog() -> tuple[bytes, dict]:
    site = ROOT / "site"
    source = json.loads((site / "tools/nutrition/source.json").read_text(encoding="utf-8"))
    runtime = source["runtime"]
    base_gz = (site / "tools/nutrition/runtime" / runtime / "products.json.gz").read_bytes()
    expected = source["files"]["assets/data/products.v5.3.210-p1.3.compact.json.gz"]
    if sha256(base_gz) != expected:
        raise ValueError("Pinned site source has changed unexpectedly")
    products = json.loads(gzip.decompress(base_gz))
    if not isinstance(products, list):
        raise ValueError("Pinned site catalog must be an array")
    # Reviewed correction: the pinned USDA sweet-cherry profile was
    # previously labelled as sour cherry. Preserve its key and nutrients.
    cherry = next((p for p in products if p.get("key") == "cherry"), None)
    if (cherry is None or cherry.get("source_id") != "USDA_FDC_SR:171719"
            or cherry.get("fdc_description") != "Cherries, sweet, raw"):
        raise ValueError("Pinned USDA cherry source changed; manual review required")
    cherry.update({"state": "raw","name": "Sweet cherries, raw","name_ru": "Черешня, свежая (сырая)","search_aliases": ["черешня","черешня свежая","sweet cherries"]})
    supplement_path = ROOT / "android/data/products-supplemental.json"
    supplements = json.loads(supplement_path.read_text(encoding="utf-8"))
    if not isinstance(supplements, list):
        raise ValueError("Supplemental products must be an array")
    validate_products(products + supplements)
    payload = json.dumps(products + supplements, ensure_ascii=False,
                         separators=(",", ":")).encode("utf-8")
    manifest = {
        "format": SCHEMA,
        "schemaVersion": 1,
        "minAndroidVersionCode": 2,
        "version": sha256(payload),
        "productCount": len(products) + len(supplements),
        "jsonSha256": sha256(payload),
        "origin": {
            "sourceCommit": source["sourceCommit"],
            "runtime": runtime,
            "baseSha256": expected,
            "baseCount": len(products),
            "supplementalCount": len(supplements),
        },
    }
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="wb", filename="", mtime=0,
                       compresslevel=9) as gz:
        gz.write(payload)
    archive = buf.getvalue()
    manifest["gzipSha256"] = sha256(archive)
    manifest["archive"] = "catalog-" + manifest["gzipSha256"] + ".json.gz"
    return payload, {"manifest": manifest, "archive": archive}


def manifest_bytes(manifest: dict) -> bytes:
    return (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
