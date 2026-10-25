"""Generate explicitly modelled 33-field dairy records from retailer K/P/F/C."""
from __future__ import annotations

import argparse
from copy import deepcopy
from datetime import date
from calendar import monthrange
import gzip
import json
import re

from catalog_protocol import ROOT, NUTRIENT_FIELDS, validate_products

SPEC = ROOT / "android/data/dairy-reviewed-skus-20261024.json"
OUT = ROOT / "android/data/products-supplemental.json"
LABELS = {"kcal": "kcal", "protein_per_100g": "protein",
          "fat_per_100g": "fat", "carbs_per_100g": "carbs"}
FAT_VITAMINS = ("vitamin_a_mcg", "vitamin_e_mg", "vitamin_d_mcg",
                "vitamin_k_mcg")


def base_catalog():
    source = json.loads((ROOT / "site/tools/nutrition/source.json").read_text())
    path = (ROOT / "site/tools/nutrition/runtime" / source["runtime"]
            / "products.json.gz")
    return {x["key"]: x for x in json.loads(gzip.decompress(path.read_bytes()))}


def make_profile(s, ref):
    p = deepcopy(ref)
    verified_at = s.get("verified_at", "2026-10-24")
    group = "масла и жиры" if s.get("category") == "Oils & Fats" else "молочные продукты"
    p.update(key=s["key"], name=s["name_ru"],
             name_ru=s["name_ru"] + " (микронутриенты — оценка)",
             search_aliases=[s["name_ru"]], tags=[group,
             "КБЖУ этикетки", "расчётный микронутриентный профиль"],
             category=s.get("category", "Dairy"), state="raw")
    # A reference food's barcode or portion size never identifies this SKU.
    p.pop("barcode", None)
    p.pop("package_size_g", None)
    p.pop("package_volume_ml", None)
    match = re.search(r",\s*(\d+)\s*(г|мл)$", s["name_ru"])
    if match:
        p["package_size_g" if match.group(2) == "г" else "package_volume_ml"] = int(match.group(1))
    for f, label in LABELS.items():
        p[f] = s[label]
    ratio = s["fat"] / ref["fat_per_100g"] if ref["fat_per_100g"] else 0
    p["sfa"] = round(min(s["fat"], ref["sfa"] * ratio), 4)
    p["unsat"] = round(min(max(0, s["fat"] - p["sfa"]),
                           ref["unsat"] * ratio), 4)
    p["sugar_per_100g"] = round(s["carbs"] * min(1, (
        ref["sugar_per_100g"] / ref["carbs_per_100g"]
        if ref["carbs_per_100g"] else 0)), 4)
    p["fiber_per_100g"] = 0
    if s.get("sweetened"):
        # The seller publishes carbohydrates but not added sugars. Estimate
        # them from the reference food and keep the uncertainty explicit.
        p["added_sugar"] = round(min(p["sugar_per_100g"],
            s["carbs"] * ref["added_sugar"] / max(ref["carbs_per_100g"], 1e-6)), 4)
        p["added_sugars_tsp_per_100g"] = round(p["added_sugar"] / 4.2, 4)
        p["added_sugars_tsp_eq_per_100g"] = p["added_sugars_tsp_per_100g"]
    else:
        p["added_sugar"] = 0
        p["added_sugars_tsp_per_100g"] = 0
        p["added_sugars_tsp_eq_per_100g"] = 0
    for f in FAT_VITAMINS:
        p[f] = round(ref[f] * min(ratio, 2), 5)
    p["salt"] = round(p["sodium_mg"] * 2.54 / 1000, 5)
    methods = {"LABEL": list(LABELS),
               "CALCULATED": ["sfa", "unsat", "salt"]
                   + (["added_sugar"] if s.get("sweetened") else []),
               "IMPUTED": list(FAT_VITAMINS),
               "ASSUMED_ZERO": ["fiber_per_100g"]
                   + ([] if s.get("sweetened") else ["added_sugar"]),
               "BORROWED": []}
    assigned = {f for v in methods.values() for f in v}
    methods["BORROWED"] = [f for f in NUTRIENT_FIELDS if f not in assigned]
    p["nutrient_provenance_v1_3"] = methods
    p["unknown_zero_fields_v1_3"] = [f for f in NUTRIENT_FIELDS
                                      if p[f] == 0 and f not in LABELS]
    p["source_id"] = "PEREKRESTOK_SKU:" + s["sku"]
    p["source_url"] = s["url"]
    p["source_retailer_sku"] = s["sku"]
    p["reference_profile_key"] = s["model_key"]
    p["source_dataset"] = "RETAIL_KBJU_AND_GENERIC_DAIRY_PROXY"
    p["source_version"] = verified_at
    p["source_exactness"] = "LABEL_MACROS_MODELLED_MICROS"
    p["nutrition_verification_status"] = "RETAIL_LABEL_MACROS_ONLY"
    p["nutrient_completeness_status"] = "COMPLETE_NUMERIC_WITH_MODEL_UNCERTAINTY"
    p["verification_note"] = (
        "Ккал и БЖУ проверены по карточке «Перекрёстка» SKU "
        + s["sku"] + ". Витамины и минералы заимствованы/рассчитаны "
        + "по справочному профилю " + s["model_key"]
        + "; НЕ являются измерением конкретного товара.")
    for f in ("fdc_id", "fdc_description", "source_archive_sha256"):
        p.pop(f, None)
    p["hei_equiv_status"] = "PROXY_BORROWED_APPROX"
    p["hei_equiv_confidence"] = "LOW"
    p["verified_at"] = verified_at
    reviewed = date.fromisoformat(verified_at)
    due_month = ((reviewed.month + 2) % 12) + 1
    due_year = reviewed.year + (reviewed.month + 2) // 12
    review_due = date(due_year, due_month,
                      min(reviewed.day, monthrange(due_year, due_month)[1])).isoformat()
    p["data_quality_v1_3"] = dict(
        schema_version=1, policy_version="v5.3.210-p1.3",
        source_registry_id="USDA_FDC", source_kind="MIXED_SOURCE",
        source_id=p["source_id"], source_dataset=p["source_dataset"],
        source_version=p["source_version"], source_url=s["url"],
        source_record_id=s["sku"], food_state="packaged",
        confidence_tier="LOW", confidence_score=0.49,
        review_status="CONDITIONALLY_ACCEPTED",
        reviewed_at=verified_at, review_due_at=review_due,
        issues=["BRAND_MICRONUTRIENTS_NOT_MEASURED",
                "MODELED_DAIRY_VITAMINS_AND_FATTY_ACIDS"]
                + (["ESTIMATED_ADDED_SUGAR_FROM_REFERENCE"]
                   if s.get("sweetened") else []),
        assumed_zero_count=1 if s.get("sweetened") else 2,
        missing_count=0)
    return p


def assemble():
    base = base_catalog()
    specs = json.loads(SPEC.read_text(encoding="utf-8"))["products"]
    existing = json.loads(OUT.read_text(encoding="utf-8"))
    keys = {s["key"] for s in specs}
    if len(keys) != len(specs) or len({s["sku"] for s in specs}) != len(specs):
        raise ValueError("Duplicate dairy product identifiers")
    originals = [x for x in existing if x["key"] not in keys]
    if len(originals) != 6:
        raise ValueError("Previously reviewed six records have changed")
    additions = []
    for s in specs:
        if s["key"] in base or s["model_key"] not in base:
            raise ValueError("Invalid base reference or duplicate: " + s["key"])
        if not s["url"].startswith("https://www.perekrestok.ru/") or not s["url"].endswith(s["sku"]):
            raise ValueError("Retailer URL mismatch: " + s["sku"])
        energy = 4*s["protein"] + 9*s["fat"] + 4*s["carbs"]
        if abs(s["kcal"] - energy) > max(10, s["kcal"]*0.12):
            raise ValueError("Label energy/macro conflict: " + s["sku"])
        additions.append(make_profile(s, base[s["model_key"]]))
    validate_products(list(base.values()) + originals + additions)
    return originals + additions


if __name__ == "__main__":
    cli = argparse.ArgumentParser()
    cli.add_argument("--check", action="store_true")
    args = cli.parse_args()
    foods = assemble()
    result = json.dumps(foods, ensure_ascii=False, indent=2) + "\n"
    if args.check:
        if OUT.read_text(encoding="utf-8") != result:
            raise SystemExit("Generated profiles differ from saved data")
    else:
        OUT.write_text(result, encoding="utf-8")
    print(f"PASS: {len(foods)} supplemental foods; "
          f"{len(json.loads(SPEC.read_text(encoding='utf-8'))['products'])} dairy with per-field provenance")
