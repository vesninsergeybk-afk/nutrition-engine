#!/usr/bin/env python3
"""Filter staged external food composition records for Russian-market usefulness.

This is a conservative catalog filter, not a claim that a product is currently sold in Russia.
It preserves all source records and assigns one of three catalog tiers:
- core_generic: cross-market generic food/ingredient suitable for default search
- secondary: recipe-, market-, technical- or region-specific record kept as reserve
- exclude_brand: named foreign brand/restaurant-chain record excluded from default catalog

No nutrient values are changed.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

BRAND_TERMS = [
    "McDONALD'S","KFC","PIZZA HUT","BURGER KING","WENDY'S","POPEYES","SUBWAY","TACO BELL","DOMINO'S",
    "APPLEBEE'S","DENNY'S","CRACKER BARREL","T.G.I. FRIDAY'S","FRIDAY'S","LITTLE CAESARS","ARBY'S","CHICK-FIL-A","DAIRY QUEEN",
    "KRAFT","CAMPBELL'S","CAMPBELL","GENERAL MILLS","KELLOGG","QUAKER","MARS SNACKFOOD","M&M MARS","M&M'S","MILKY WAY",
    "SNICKERS","TWIX","HERSHEY'S","HERSHEY","PILLSBURY","NESTLE","GERBER","SIMILAC","ENFAMIL","ABBOTT","MEAD JOHNSON",
    "PROSOBEE","ISOMIL","OCEAN SPRAY","COCA-COLA","CHOBANI","BREYERS","HORMEL","SILK","DIGIORNO","MALT-O-MEAL",
    "NATURE VALLEY","CHEERIOS","BETTY CROCKER","NUTRI-GRAIN","RICE KRISPIES","PEPPERIDGE FARM","GLUTINO","RUDI'S","UDI'S",
    "ON THE BORDER","NABISCO","BIMBO","LA RICURA","PREGO","RAGU","LAY'S","LAYS","DORITOS","FRITOS","CHEETOS","PEPSI","GATORADE",
    "POST ","ALPEN","WEETABIX","BUTTERFINGER","BABY RUTH","OH HENRY","DOVE","3 MUSKETEERS","COMBOS","ENSURE","PEDIASURE",
    "ACT II","ORVILLE REDENBACHER","JIF","SKIPPY","SMUCKER","WESSON","HELLMANN","MIRACLE WHIP","CHEEZ WHIZ","BREAKSTONE",
    "OSCAR MAYER","HEINZ","HUNGRY JACK","EGGO","PRINGLES","TOSTITOS","RITZ","OREO","WHEAT THINS","TRISCUIT","SUNSHINE",
    "KEEBLER","PLANTERS","REESE","CADBURY","GODIVA","TOBLERONE","HAAGEN","BEN & JERRY","YOPLAIT",
    "V8","SMART BALANCE","SMART SOUP","CREAM OF WHEAT","CREAM OF RICE","POWER BAR","OLIVE GARDEN","CARRABBA'S",
    "DANNON","OIKOS","MORI-NU","RALSTON","NAKED JUICE","BOLTHOUSE FARMS","KASHI","SLIMFAST","TWIZZLERS",
    "UNCLE BEN'S","UNCLE BENS","KLONDIKE","SUN COUNTRY","KRETSCHMER","WHEATENA","HEALTHY CHOICE","UNILEVER",
    "FRITOLAY","SUNCHIPS","HEALTH VALLEY","YORK","ODWALLA","BUDWEISER","FARLEY","SUNKIST","POPSICLE","CREAMSICLE",
    "LIFEWAY","SWANSON","RED BULL","AMP","ROCKSTAR","VAULT","GEROLSTEINER","SNAPPLE","OVALTINE","POLAND SPRING",
    "SMART BEAT","HOUSE FOODS","MOM'S BEST","ZEVIA","MARTHA WHITE","VITASOY","NASOYA","PRESIDENT'S CHOICE",
    "BARBARA'S BAKERY","VAN'S","BULL'S-EYE","KAMUT","ANCIENT HARVEST","CANOLA HARVEST","SCHIFF","TIGER'S MILK",
    "V8 V-FUSION","EMI-TSUNOMATA","ALMOND JOY","JELL-O","MAXWELL HOUSE","FOLGERS","WISH-BONE",
    "HIDDEN VALLEY","A.1.","VELVEETA","PHILADELPHIA","SARGENTO","LAND O LAKES","BLUE BONNET","PARKAY",
    "COUNTRY CROCK","I CAN'T BELIEVE IT'S NOT BUTTER","FLEISCHMANN","MAZOLA","PAM","CRISCO","MINUTE MAID",
    "TROPICANA","DASANI","AQUAFINA","DR PEPPER","SPRITE","FANTA","MOUNTAIN DEW","MONSTER","NOS",
]

GENERIC_UPPERCASE_WHITELIST = {"DHA","ARA","USDA","USA","BBQ","MF","NFS","II","III","IV","KA"}

SECONDARY_RE = re.compile(
    r"\b(restaurant|fast foods?|frozen entree|school lunch|usda commodity|meal,? ready-to-eat|"
    r"babyfood|infant formula|formula,? ready-to-feed|formula,? powder|"
    r"pupusa|empanada|chow mein|chop suey|tamale|burrito|taco|enchilada|"
    r"prepared from recipe|homemade|with sauce|in sauce|sandwich|pizza|"
    r"casserole|souffle|instant powder|dry mix|ready-to-serve|cake|cookies?|doughnut|donut|torte|brownie)\b",
    re.I,
)

REGIONAL_EXOTIC_RE = re.compile(
    r"\b(indigenous|alaska native|native,|caribou|moose|seal|walrus|whale|beaver|muskrat|"
    r"opossum|raccoon|squirrel|bear meat|prairie turnip|cloudberry|arrowhead|breadfruit seeds|"
    r"cottonseed|burbot.*indigenous)\b",
    re.I,
)

TECHNICAL_VARIANT_RE = re.compile(
    r"\b(separable lean(?: and fat| only)?|separable fat|trimmed to \d|all grades|usda (?:choice|select|prime)|"
    r"yield grade|wholesale cuts?|retail cuts?|composite cuts?|visible fat content|tendon(?: free| content)|"
    r"food distribution program|with added solution|kid'?s menu|canned entree|frozen dinner|meal replacement)\b",
    re.I,
)

FORTIFICATION_RE = re.compile(
    r"\b(fortified|enriched|added vitamins?|with added vitamin|vitamin d fortified)\b",
    re.I,
)

def term_pattern(term: str) -> str:
    term = term.strip()
    return rf"(?<![A-Za-z0-9]){re.escape(term)}(?![A-Za-z0-9])"

BRAND_RE = re.compile("|".join(term_pattern(x) for x in BRAND_TERMS), re.I)

def automatic_brand_signal(name: str) -> bool:
    tokens = re.findall(r"\b[A-Z][A-Z0-9&'-]{2,}\b", name or "")
    tokens = [
        t for t in tokens
        if t not in GENERIC_UPPERCASE_WHITELIST
        and not re.fullmatch(r"\d+", t)
        and len(t.replace("'", "")) >= 4
    ]
    return len(tokens) >= 2

def normalize_name(name: str) -> str:
    # Keep parenthetical content: "(raw)" / "(cooked)" / flavour or cut
    # can materially distinguish nutrient profiles. Normalize punctuation only.
    s = (name or "").lower()
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()

def classify(row: dict) -> tuple[str, str]:
    name = row.get("name") or ""
    low = name.lower()
    source = row.get("source_registry_id")

    if BRAND_RE.search(name):
        return "exclude_brand", "brand_or_chain"

    if source in {"USDA_FDC", "HEALTH_CANADA_CNF"} and automatic_brand_signal(name):
        return "exclude_brand", "brand_or_chain"

    if source == "GERMANY_BLS":
        # BLS X/Y are largely composed dishes and recipes. Keep them as reserve,
        # not default search entries; ingredient/basic-food categories remain eligible.
        code = str(row.get("bls_code") or "")
        if code[:1] in {"X", "Y"}:
            return "secondary", "bls_prepared_dish"

    if source == "HEALTH_CANADA_CNF":
        # CNF food groups 21/22 are fast foods / mixed dishes; 3 is baby food.
        if str(row.get("food_group_code") or "") in {"21", "22", "3"}:
            return "secondary", "cnf_fast_mixed_baby"

    if row.get("source_dataset") == "SR Legacy 2018":
        if re.match(r"^(Restaurant|Fast foods?)\b", name, re.I):
            return "secondary", "restaurant_or_fast_food"
        if re.match(r"^Babyfood\b", name, re.I) or "infant formula" in low:
            return "secondary", "baby_or_formula"

    if REGIONAL_EXOTIC_RE.search(name):
        return "secondary", "regional_exotic"

    if SECONDARY_RE.search(name):
        return "secondary", "prepared_or_recipe_dependent"

    if FORTIFICATION_RE.search(name):
        return "secondary", "market_specific_fortification"

    if TECHNICAL_VARIANT_RE.search(name):
        return "secondary", "technical_or_market_variant"

    return "core_generic", "generic_cross_market_food"

def write_jsonl(path: Path, records: list[dict]) -> None:
    with path.open("w", encoding="utf-8") as f:
        for row in records:
            f.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n")

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--out-dir", required=True)
    args = ap.parse_args()

    source_path = Path(args.input)
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)

    records = []
    with source_path.open(encoding="utf-8") as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))

    buckets: dict[str, list[dict]] = defaultdict(list)
    reason_counts = Counter()
    source_counts: dict[str, Counter] = defaultdict(Counter)

    for row in records:
        tier, reason = classify(row)
        item = dict(row)
        item["catalog_filter"] = {
            "policy_version": "russia-relevance-v1",
            "tier": tier,
            "reason": reason,
            "availability_claim": "NOT_VERIFIED_IN_RUSSIA",
        }
        buckets[tier].append(item)
        reason_counts[reason] += 1
        source_counts[row.get("source_registry_id") or "UNKNOWN"][tier] += 1

    core = buckets["core_generic"]
    secondary = buckets["secondary"]
    brands = buckets["exclude_brand"]

    # Exact normalized-name groups are reported, but not silently merged.
    name_groups: dict[str, list[dict]] = defaultdict(list)
    for row in core:
        name_groups[normalize_name(row.get("name") or "")].append(row)
    duplicate_groups = [g for key, g in name_groups.items() if key and len(g) > 1]
    exact_duplicate_extra_rows = sum(len(g) - 1 for g in duplicate_groups)

    preferred_rank = {
        ("USDA_FDC", "Foundation Foods 2026-04"): 0,
        ("GERMANY_BLS", "BLS 4.0 (2025)"): 1,
        ("HEALTH_CANADA_CNF", "Canadian Nutrient File 2026"): 2,
        ("USDA_FDC", "SR Legacy 2018"): 3,
    }
    unique_preview = []
    for norm_name, group in name_groups.items():
        if not norm_name:
            continue
        selected = sorted(
            group,
            key=lambda r: (
                preferred_rank.get((r.get("source_registry_id"), r.get("source_dataset")), 99),
                -int(r.get("canonical_fields_present") or 0),
                str(r.get("source_record_id") or ""),
            ),
        )[0]
        unique_preview.append({
            "normalized_name": norm_name,
            "selected_source_registry_id": selected.get("source_registry_id"),
            "selected_source_dataset": selected.get("source_dataset"),
            "selected_source_record_id": selected.get("source_record_id"),
            "selected_name": selected.get("name"),
            "candidate_count": len(group),
            "candidate_sources": [
                {
                    "source_registry_id": r.get("source_registry_id"),
                    "source_dataset": r.get("source_dataset"),
                    "source_record_id": r.get("source_record_id"),
                    "name": r.get("name"),
                }
                for r in group
            ],
        })

    report = {
        "schema_version": 1,
        "policy_version": "russia-relevance-v1",
        "purpose": "Conservative default-catalog filter for Russian-user relevance; not proof of retail availability in Russia.",
        "source_records": len(records),
        "tiers": {
            "core_generic": len(core),
            "secondary": len(secondary),
            "exclude_brand": len(brands),
        },
        "core_exact_normalized_name_unique_count": len(name_groups),
        "core_exact_duplicate_groups": len(duplicate_groups),
        "core_exact_duplicate_extra_rows": exact_duplicate_extra_rows,
        "reason_counts": dict(reason_counts),
        "source_tier_counts": {k: dict(v) for k, v in source_counts.items()},
        "policy": {
            "core_generic": "Generic cross-market food or ingredient suitable as a default-search candidate.",
            "secondary": "Kept for reserve/advanced search because it is recipe-, market-, technical-, regional- or preparation-specific.",
            "exclude_brand": "Named foreign brand or restaurant-chain record; exclude from default generic catalog.",
            "important_limitation": "No record is labelled as currently sold in Russia without a separate Russian-market availability source.",
        },
    }

    write_jsonl(out / "external_foods_core_generic.jsonl", core)
    write_jsonl(out / "external_foods_secondary.jsonl", secondary)
    write_jsonl(out / "external_foods_excluded_brands.jsonl", brands)

    (out / "external_food_filter_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out / "external_food_core_exact_name_groups.json").write_text(
        json.dumps(sorted(unique_preview, key=lambda x: x["selected_name"] or ""), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    # Human-review sample: deterministic first records from every reason/source pair.
    sample_rows = []
    seen = Counter()
    for row in records:
        tier, reason = classify(row)
        key = (row.get("source_registry_id"), tier, reason)
        if seen[key] >= 15:
            continue
        seen[key] += 1
        sample_rows.append({
            "source": row.get("source_registry_id"),
            "dataset": row.get("source_dataset"),
            "tier": tier,
            "reason": reason,
            "name": row.get("name"),
            "source_record_id": row.get("source_record_id"),
        })

    with (out / "external_food_filter_review_sample.csv").open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["source","dataset","tier","reason","name","source_record_id"])
        writer.writeheader()
        writer.writerows(sample_rows)

    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
