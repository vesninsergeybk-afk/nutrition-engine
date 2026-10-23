#!/usr/bin/env python3
"""Read-only comparison of a verified retail snapshot with Nutrient's canonical foods.

The retailer's site cannot reliably be scraped by an unattended client (HTTP 403).
This tool intentionally accepts curated, sourced product cards and DOES NOT alter
the canonical 1105-food database or invent unreported micronutrients.
"""

from __future__ import annotations

import argparse
import glob
import json
import math
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
BASELINE_GLOB = "data/products.v5.3.210-p1.3.part-*.json"
FAT_RE = re.compile(r"(?<!\d)(\d+(?:[.,]\d+)?)\s*%")

# A semantic identity is deliberately narrow: different culinary forms may have
# different composition even when a catalogue search returns the same keyword.
IDENTITY_RE = {
    "plain_curd": r"^творог\b(?!.*(?:зерн|мягк|масса))",
    "sour_cream": r"^сметана\b",
    "couscous": r"^кускус\b",
    "sweet_cherry": r"^черешн",
    "black_radish": r"^редька\s+ч[её]рн",
    "artichoke": r"^артишок",
    "mung_beans": r"^маш(?:\b|,)",
    "edamame": r"эдамаме",
    "sea_bass": r"(?:^сибас|^лаврак)",
    "sea_bream": r"^дорад[оа]",
    "rabbit_meat": r"^кролик|^мясо\s+кролик",
    "pork_tenderloin": r"^свинина,?\s+вырезка|^вырезка\s+свина",
}

COOKED_RE = re.compile(r"вар[её]н|отварн|готов|запеч|жарен|туш[её]н|гриль|печ[её]н|приготовл|су-вид")
FROZEN_RE = re.compile(r"заморож|морожен")
DRY_RE = re.compile(r"сух[оиа]|крупа|крупы|неприготовл")


def load_baseline(root: Path = ROOT) -> list[dict]:
    paths = sorted(glob.glob(str(root / BASELINE_GLOB)))
    if len(paths) != 12:
        raise ValueError(f"Expected 12 canonical product parts, found {len(paths)}")
    rows: list[dict] = []
    for path in paths:
        with open(path, encoding="utf-8") as handle:
            rows.extend(json.load(handle))
    if len(rows) != 1105:
        raise ValueError(f"Unexpected canonical base length: {len(rows)} (expected 1105)")
    return rows


def detect_state(p: dict) -> str:
    name = str(p.get("name_ru", "")).casefold()
    if COOKED_RE.search(name):
        return "cooked"
    if FROZEN_RE.search(name):
        return "frozen"
    if DRY_RE.search(name):
        return "dry"
    # Some older cards say only 'Маш' or 'Кускус' without preparation data;
    # do not presume they are dry or raw solely from the database state field.
    if p.get("state") in {"cooked", "prepared", "recipe_model"}:
        return "cooked"
    return "raw"


def fat_pct(name: str):
    found = FAT_RE.search(name)
    return float(found.group(1).replace(",", ".")) if found else None


def validate_snapshot(snapshot: dict) -> None:
    if snapshot.get("retailer") != "perekrestok.ru":
        raise ValueError("Wrong retailer")
    if not isinstance(snapshot.get("products"), list) or not snapshot["products"]:
        raise ValueError("Missing products")
    ids = set()
    for item in snapshot["products"]:
        if item.get("sku") in ids or not item.get("sku"):
            raise ValueError(f"Duplicate/empty SKU: {item.get('sku')!r}")
        ids.add(item["sku"])
        if item.get("identity") not in IDENTITY_RE:
            raise ValueError(f"Unsupported identity: {item.get('identity')!r}")
        if item.get("state") not in {"raw", "dry", "frozen", "cooked"}:
            raise ValueError(f"Invalid state for {item['sku']}")
        parsed = urlparse(item.get("source_url", ""))
        if parsed.scheme != "https" or parsed.hostname not in {"perekrestok.ru", "www.perekrestok.ru"}:
            raise ValueError(f"Invalid source domain for {item['sku']}")
        if not str(item["sku"]) in parsed.path.rsplit("-", 1)[-1]:
            raise ValueError(f"SKU does not match source URL for {item['sku']}")


def label_warnings(item: dict) -> list[str]:
    macro = item.get("label_per_100g") or {}
    if not macro:
        return ["NO_MACRONUTRIENT_LABEL"]
    fields = ("kcal", "protein", "fat", "carbs")
    if any(not isinstance(macro.get(f), (int, float)) or not math.isfinite(macro[f]) for f in fields):
        return ["INCOMPLETE_MACRONUTRIENT_LABEL"]
    kcal, protein, fat, carbs = (float(macro[x]) for x in fields)
    warnings = []
    if min(kcal, protein, fat, carbs) < 0 or protein + fat + carbs > 100.1:
        warnings.append("IMPOSSIBLE_LABEL_COMPOSITION")
    if kcal == protein == fat == carbs == 0:
        warnings.append("ZERO_LABEL_PLACEHOLDER_DO_NOT_IMPORT")
    elif abs(kcal - (4 * protein + 9 * fat + 4 * carbs)) > max(35, kcal * 0.3):
        warnings.append("LABEL_ENERGY_MACRO_DISCREPANCY")
    declared_pct = item.get("fat_percent")
    if declared_pct is not None and abs(fat - float(declared_pct)) > max(0.75, float(declared_pct) * 0.15):
        warnings.append("FAT_PERCENT_CONFLICT_WITH_LABEL")
    return warnings


def classify(item: dict, baseline: list[dict]) -> dict:
    matcher = re.compile(IDENTITY_RE[item["identity"]], re.IGNORECASE)
    same_food = [p for p in baseline if matcher.search(str(p.get("name_ru", "")).casefold())]
    matching = [p for p in same_food if detect_state(p) == item["state"]]
    if item.get("fat_percent") is not None:
        matching = [p for p in matching if fat_pct(str(p.get("name_ru", ""))) == item["fat_percent"]]

    # A generic row already covers a basic food form, but a branded formulation
    # still needs a label-level review if its macros differ materially.
    if matching:
        status = "ALREADY_REPRESENTED"
    elif same_food:
        status = "MISSING_VARIANT"
    else:
        status = "MISSING_FOOD"

    warnings = label_warnings(item)
    if warnings and status != "ALREADY_REPRESENTED":
        if "ZERO_LABEL_PLACEHOLDER_DO_NOT_IMPORT" in warnings:
            status = "MISSING_FOOD_LABEL_UNUSABLE" if not same_food else "MISSING_VARIANT_LABEL_UNUSABLE"

    return {
        "sku": item["sku"],
        "name": item["name"],
        "category": item["category"],
        "identity": item["identity"],
        "state": item["state"],
        "fat_percent": item.get("fat_percent"),
        "status": status,
        "related_baseline": [{"key": p["key"], "name_ru": p["name_ru"]} for p in same_food[:12]],
        "matching_baseline": [p["key"] for p in matching],
        "label_per_100g": item.get("label_per_100g"),
        "quality_warnings": warnings,
        "import_eligibility": (
            "BLOCKED_LABEL_INVALID" if warnings else "REQUIRES_FULL_NUTRIENT_PROFILE_AND_REVIEW"
        ),
        "micronutrients": "NOT_PROVIDED_BY_SKU_LABEL",
        "source_url": item["source_url"],
    }


def baseline_mislabelled_fat(baseline: list[dict]) -> list[dict]:
    suspicious = []
    for p in baseline:
        name = str(p.get("name_ru", "")).casefold()
        # A percent on chocolate or cheese may indicate cocoa or dry-matter
        # content; compare declared % to total fat only for these dairy groups.
        if not re.match(r"^(?:кефир|творог|сметана|молоко|сливки|ряженка|простокваша|йогурт)\b", name):
            continue
        value = fat_pct(name)
        recorded = p.get("fat_per_100g")
        if value is None or not isinstance(recorded, (float, int)):
            continue
        # Prefer conservative tolerance; brand names can include percentage
        # as part of another declaration and need manual confirmation.
        if abs(value - recorded) > max(1.2, value * 0.3):
            suspicious.append({"key": p["key"], "name_ru": p["name_ru"], "named_fat_pct": value, "recorded_fat_g_per_100g": recorded})
    return suspicious


def audit(snapshot: dict, baseline: list[dict]) -> dict:
    validate_snapshot(snapshot)
    results = [classify(p, baseline) for p in snapshot["products"]]
    return {
        "snapshot_date": snapshot["snapshot_date"],
        "scope": "SAMPLED_PRODUCT_CARDS_NOT_FULL_STORE_CATALOG",
        "retailer": snapshot["retailer"],
        "baseline_product_count": len(baseline),
        "sampled_sku_count": len(results),
        "distinct_target_variants": len({(p["identity"], p["state"], p.get("fat_percent")) for p in snapshot["products"]}),
        "counts": dict(sorted(Counter(r["status"] for r in results).items())),
        "results": results,
        "baseline_fat_label_warnings": baseline_mislabelled_fat(baseline),
        "policy": "Identification only. Never auto-insert SKU macros as a complete 33-nutrient profile.",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--snapshot", type=Path, default=ROOT / "data/catalog-reviews/perekrestok-2026-10-23.sample.json")
    parser.add_argument("--out", type=Path, help="Optional JSON report output path")
    args = parser.parse_args()
    snapshot = json.loads(args.snapshot.read_text(encoding="utf-8"))
    report = audit(snapshot, load_baseline())
    body = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(body, encoding="utf-8")
    else:
        print(body, end="")


if __name__ == "__main__":
    main()
