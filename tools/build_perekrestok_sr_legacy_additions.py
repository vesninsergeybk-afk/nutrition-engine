#!/usr/bin/env python3
"""Build reviewed Nutrient overlays from the official USDA SR Legacy JSON archive.

This program never alters the protected 1105-record core. It produces an
auditable JSON snapshot plus a browser-readable, offline-compatible JS overlay.
Download the source archive from USDA FoodData Central's download-datasets page.
"""

import argparse
import hashlib
import json
import math
import zipfile
from pathlib import Path


USDA_ARCHIVE_URL = "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip"
RELEASE_DATE = "2026-10-23"
ROOT = Path(__file__).resolve().parents[1]
NUTRIENTS = {
    "kcal": 1008,
    "protein_per_100g": 1003,
    "fat_per_100g": 1004,
    "carbs_per_100g": 1005,
    "sugar_per_100g": 2000,
    "fiber_per_100g": 1079,
    "sfa": 1258,
    "calcium_mg": 1087,
    "iron_mg": 1089,
    "magnesium_mg": 1090,
    "phosphorus_mg": 1091,
    "potassium_mg": 1092,
    "sodium_mg": 1093,
    "zinc_mg": 1095,
    "copper_mg": 1098,
    "manganese_mg": 1101,
    "selenium_ug": 1103,
    "vitamin_a_mcg": 1106,
    "vitamin_e_mg": 1109,
    "vitamin_d_mcg": 1114,
    "vitamin_c_mg": 1162,
    "vitamin_b1_mg": 1165,
    "vitamin_b2_mg": 1166,
    "vitamin_b3_mg": 1167,
    "vitamin_b5_mg": 1170,
    "vitamin_b6_mg": 1175,
    "vitamin_b9_mcg": 1177,
    "vitamin_b12_mcg": 1178,
    "choline_mg": 1180,
    "vitamin_k_mcg": 1185,
}
FDC_UNSAT = (1292, 1293)
EXTRA_NUTRIENTS = ("unsat", "salt", "added_sugar")
ALL_NUTRIENTS = set(NUTRIENTS) | set(EXTRA_NUTRIENTS)
HEI_FIELDS = (
    "fruit_cup_eq_per_100g", "whole_fruit_cup_eq_per_100g",
    "veg_cup_eq_per_100g", "greens_beans_cup_eq_per_100g",
    "dairy_cup_eq_per_100g", "whole_grain_oz_eq_per_100g",
    "refined_grain_oz_eq_per_100g", "protein_oz_eq_per_100g",
    "seafood_plant_oz_eq_per_100g", "added_sugars_tsp_eq_per_100g",
    "whole_grains_oz_eq_per_100g", "refined_grains_oz_eq_per_100g",
    "added_sugars_tsp_per_100g",
)

# The rows below represent generic foods, NOT claimed label measurements of the
# named Perekrestok merchandise. Retail cards are matched by food identity/state.
PRODUCTS = (
    dict(id=173954, key="sour_cherry_raw_sr_173954", name_ru="Вишня кислая, сырая",
         name="Sour cherries, raw", state="raw", category="Fruits",
         hei="fruits_berries", aliases=["вишня", "кислая вишня"],
         retailer_sku=None, hei_values={"fruit_cup_eq_per_100g": 0.6667,
                                     "whole_fruit_cup_eq_per_100g": 0.6667}),
    dict(id=169205, key="artichoke_raw_sr_169205", name_ru="Артишок свежий, сырой",
         name="Artichoke, globe, raw", state="raw", category="Vegetables",
         hei="vegetables", aliases=["артишок", "артишоки сырые"],
         retailer_sku="4388857", hei_values={"veg_cup_eq_per_100g": 0.7692}),
    dict(id=174256, key="mung_beans_dry_sr_174256", name_ru="Маш, сухие зёрна",
         name="Mung beans, dry", state="dry", category="Legumes",
         hei="seafood_plant_protein", aliases=["маш сухой", "бобы мунг", "мунг"],
         retailer_sku="3455460", hei_values={"veg_cup_eq_per_100g": 1.425,
                         "greens_beans_cup_eq_per_100g": 1.425,
                         "protein_oz_eq_per_100g": 5.725,
                         "seafood_plant_oz_eq_per_100g": 5.725}),
    dict(id=175142, key="sea_bass_raw_sr_175142", name_ru="Сибас (морской окунь), сырой",
         name="Sea bass, raw (mixed species)", state="raw",
         category="Seafood & Plant Protein", hei="seafood_plant_protein",
         aliases=["сибас", "лаврак", "морской окунь сырой"],
         retailer_sku="4192696", hei_values={"protein_oz_eq_per_100g": 2.8219,
                         "seafood_plant_oz_eq_per_100g": 2.8219}),
    dict(id=168312, key="pork_tenderloin_raw_sr_168312", name_ru="Вырезка свиная, сырая",
         name="Pork tenderloin, raw", state="raw", category="Meat",
         hei="protein_foods", aliases=["свиная вырезка", "вырезка из свинины"],
         retailer_sku="723", hei_values={"protein_oz_eq_per_100g": 2.6455}),
)
DEFERRED = {168410: "Эдамаме замороженные", 169699: "Кускус сухой",
            172521: "Крольчатина сырая"}
EXISTING_CORRECTION = {
    "key": "cherry", "expected_source_id": "USDA_FDC_SR:171719",
    "expected_fdc_description": "Cherries, sweet, raw", "state": "raw",
    "name": "Sweet cherries, raw", "name_ru": "Черешня, свежая (сырая)",
    "search_aliases": ["черешня", "черешня свежая", "sweet cherries"],
}


def field_values(food):
    """Return complete nutrient data or an explicit list of absent USDA fields."""
    by_id = {row["nutrient"]["id"]: row["amount"]
             for row in food["foodNutrients"] if row.get("amount") is not None}
    missing = [field for field, id_ in NUTRIENTS.items() if id_ not in by_id]
    if any(id_ not in by_id for id_ in FDC_UNSAT):
        missing.append("unsat")
    if "sodium_mg" in missing:
        missing.append("salt")
    if missing:
        return None, sorted(set(missing)), None
    vals = {field: round(float(by_id[id_]), 5) for field, id_ in NUTRIENTS.items()}
    vals["unsat"] = round(sum(float(by_id[id_]) for id_ in FDC_UNSAT), 5)
    vals["salt"] = round(vals["sodium_mg"] * 2.54 / 1000, 5)
    # Foods in this curated batch are plain, unsweetened raw/dry commodities.
    # This is a documented formulation assumption, not an analytical value.
    vals["added_sugar"] = 0
    if set(vals) != ALL_NUTRIENTS or any(not math.isfinite(x) or x < 0 for x in vals.values()):
        raise ValueError("Invalid or incomplete nutrition: " + str(food["fdcId"]))
    if vals["sugar_per_100g"] > vals["carbs_per_100g"] + 0.1:
        raise ValueError("Sugars exceed carbs: " + str(food["fdcId"]))
    if vals["sfa"] + vals["unsat"] > vals["fat_per_100g"] + 0.12:
        raise ValueError("Fatty acid fractions exceed total fat: " + str(food["fdcId"]))
    sources = {"BORROWED": [], "CALCULATED": ["salt", "unsat"],
               "ASSUMED_ZERO": ["added_sugar"], "SOURCE_REPORTED_ZERO": []}
    for field in NUTRIENTS:
        sources["SOURCE_REPORTED_ZERO" if vals[field] == 0 else "BORROWED"].append(field)
    return vals, [], sources


def build_product(spec, food, sha256):
    vals, missing, sources = field_values(food)
    if missing:
        raise ValueError("Incomplete SR Legacy entry: " + str(food["fdcId"]) + ": " + ", ".join(missing))
    id_ = food["fdcId"]
    source_url = "https://fdc.nal.usda.gov/fdc-app.html#/food-details/" + str(id_) + "/nutrients"
    profile = dict(key=spec["key"], name=spec["name"], name_ru=spec["name_ru"],
                   search_aliases=spec["aliases"], category=spec["category"],
                   hei_category_key=spec["hei"], state=spec["state"],
                   tags=[spec["state"], "USDA SR Legacy", *spec["aliases"]], **vals)
    profile.update({field: 0 for field in HEI_FIELDS})
    profile.update(spec["hei_values"])
    for field in ("whole_grain", "refined_grain", "added_sugars_tsp"):
        single = field + "_oz_eq_per_100g" if field != "added_sugars_tsp" else field + "_eq_per_100g"
        plural = field + "s_oz_eq_per_100g" if field != "added_sugars_tsp" else field + "_per_100g"
        if single in profile and plural in profile:
            profile[plural] = profile[single]
    profile.update(source_id=f"USDA_FDC_SR:{id_}", fdc_id=id_,
                   fdc_description=food["description"], source_url=source_url,
                   source_dataset="USDA_FDC_SR_LEGACY_2018", source_version="SR Legacy 04/2018",
                   source_exactness="USDA_GENERIC_MATCHED_FOOD_STATE_NOT_RETAIL_LABEL",
                   nutrition_verification_status="OFFICIAL_USDA_REFERENCE_NOT_BRAND_MEASUREMENT",
                   nutrient_completeness_status="COMPLETE_NUMERIC_WITH_ONE_FORMULATION_ASSUMPTION",
                   verified_at=RELEASE_DATE, product_db_schema_version="v5.3.210-p1.3-product-provenance",
                   calculation_participation_v5_3_68="OK_NUMERIC_NUTRIENTS_AND_HEI_EQUIVALENTS_PRESENT",
                   source_archive_sha256=sha256,
                   source_retailer_sku=spec["retailer_sku"],
                   verification_note=("Справочный пищевой состав USDA для вида и состояния продукта; "
                         "не является анализом партии или этикеткой товара из «Перекрёстка». "
                         "Добавленный сахар условно равен нулю для продукта без добавок."),
                   nutrient_provenance_v1_3=sources,
                   unknown_zero_fields_v1_3=["added_sugar"],
                   hei_equiv_status="FPED_DERIVED_APPROX",
                   hei_equiv_confidence="LOW" if spec["state"] == "dry" else "MEDIUM",
                   hei_equiv_method="FOOD_GROUP_APPROX_WITH_STATE_YIELD_ASSUMPTION",
                   hei_equiv_provenance={
                     "status": "FPED_DERIVED_APPROX", "confidence": "LOW" if spec["state"] == "dry" else "MEDIUM",
                     "source": "https://www.ars.usda.gov/ARSUserFiles/80400530/pdf/fped/FPED_1718.pdf",
                     "method": "Approximate food-group equivalent from 100 g edible portion",
                     "note": ("Для сухого маша применён приближённый выход 2,5 г готового продукта "
                              "из 1 г сухого; для сырого мяса и рыбы принят выход после готовки "
                              "75% и 80% соответственно. Эти коэффициенты не взяты из записи USDA.")},
                   data_quality_v1_3={"schema_version": 1, "policy_version": "v5.3.210-p1.3",
                     "source_registry_id": "USDA_FDC", "source_kind": "PRIMARY_DATASET",
                     "source_id": f"USDA_FDC_SR:{id_}", "source_dataset": "USDA_FDC_SR_LEGACY_2018",
                     "source_version": "SR Legacy 04/2018", "source_url": source_url,
                     "source_record_id": str(id_), "food_state": spec["state"],
                     "confidence_tier": "MEDIUM", "confidence_score": 0.8,
                     "review_status": "CONDITIONALLY_ACCEPTED", "reviewed_at": RELEASE_DATE,
                     "review_due_at": "2027-04-23",
                     "issues": ["GENERIC_FOOD_DATA_NOT_EXACT_RETAIL_SKU", "HEI_EQUIVALENT_APPROXIMATION"],
                     "assumed_zero_count": 1, "missing_count": 0})
    if not spec["retailer_sku"]:
        del profile["source_retailer_sku"]
    return profile


def build_snapshot(foods, sha256):
    selected = {spec["id"] for spec in PRODUCTS} | set(DEFERRED) | {171719}
    indexed = {food["fdcId"]: food for food in foods if food.get("fdcId") in selected}
    if selected != set(indexed):
        raise ValueError("Required USDA IDs not found: " + str(selected - set(indexed)))
    products = [build_product(spec, indexed[spec["id"]], sha256) for spec in PRODUCTS]
    blocked = []
    for id_, name in DEFERRED.items():
        _, missing, _ = field_values(indexed[id_])
        if not missing:
            raise ValueError("Deferred USDA profile is now complete: " + str(id_))
        blocked.append(dict(fdc_id=id_, name_ru=name, missing_fields=missing,
                            review_status="NO_AUTOMATIC_ZERO_FILL"))
    return dict(release_date=RELEASE_DATE, source=USDA_ARCHIVE_URL,
                source_sha256=sha256, source_release="SR Legacy 04/2018",
                retailer_sample="data/catalog-reviews/perekrestok-2026-10-23.sample.json",
                nutrient_count=33, products=products, blocked=blocked,
                existing_record_correction=EXISTING_CORRECTION,
                caution="USDA generic macro values intentionally replace inconsistent retail labels; not exact brand nutrition.")


def script_from_snapshot(snapshot):
    def compact(value):
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    return ("/* Generated by tools/build_perekrestok_sr_legacy_additions.py. USDA SR Legacy 2018. */\n"
            "(function(w){'use strict';\n"
            "var original=w.__NUTRIENT_SUPPLEMENTAL_PRODUCTS__;\n"
            "if(!Array.isArray(original))original=[];\n"
            "w.__NUTRIENT_SUPPLEMENTAL_PRODUCTS__=original.concat(" + compact(snapshot["products"]) + ");\n"
            "w.__NUTRIENT_PRODUCT_CORRECTIONS__=" + compact([snapshot["existing_record_correction"]]) + ";\n"
            "w.__NUTRIENT_SUPPLEMENTAL_EXPECTED_COUNT__=6;\n"
            "})(window);\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", required=True, type=Path,
                        help="Official USDA SR Legacy JSON ZIP downloaded from USDA")
    parser.add_argument("--json", type=Path,
                        default=ROOT / "data/catalog-reviews/usda-sr-legacy-2026-10-23.json")
    parser.add_argument("--js", type=Path,
                        default=ROOT / "assets/data/products-perekrestok-reviewed.v20261023.js")
    args = parser.parse_args()
    sha256 = hashlib.sha256(args.archive.read_bytes()).hexdigest()
    with zipfile.ZipFile(args.archive) as archive:
        if archive.namelist() != ["FoodData_Central_sr_legacy_food_json_2018-04.json"]:
            raise ValueError("Unexpected USDA ZIP member list")
        with archive.open(archive.namelist()[0]) as stream:
            foods = json.load(stream)["SRLegacyFoods"]
    snapshot = build_snapshot(foods, sha256)
    args.json.parent.mkdir(parents=True, exist_ok=True)
    args.js.parent.mkdir(parents=True, exist_ok=True)
    args.json.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.js.write_text(script_from_snapshot(snapshot), encoding="utf-8")
    print("Ready:", len(snapshot["products"]), " | Blocked:", len(snapshot["blocked"]),
          " | USDA SHA256:", sha256)
    for item in snapshot["blocked"]:
        print("Defer", item["fdc_id"], item["name_ru"], item["missing_fields"])


if __name__ == "__main__":
    main()
