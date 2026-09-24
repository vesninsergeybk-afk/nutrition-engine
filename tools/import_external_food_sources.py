#!/usr/bin/env python3
"""Audit and stage official food-composition datasets without touching production data.

Inputs are official ZIP exports downloaded by GitHub Actions.
Outputs preserve null semantics and source provenance. No missing value is converted to zero.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

CANONICAL_FIELDS = [
    "kcal","protein_per_100g","fat_per_100g","carbs_per_100g","sugar_per_100g",
    "fiber_per_100g","sfa","unsat","added_sugar","salt",
    "calcium_mg","iron_mg","magnesium_mg","phosphorus_mg","potassium_mg","sodium_mg",
    "zinc_mg","copper_mg","manganese_mg","selenium_ug","vitamin_a_mcg","vitamin_e_mg",
    "vitamin_d_mcg","vitamin_c_mg","vitamin_b1_mg","vitamin_b2_mg","vitamin_b3_mg",
    "vitamin_b5_mg","vitamin_b6_mg","vitamin_b9_mcg","vitamin_b12_mcg","choline_mg",
    "vitamin_k_mcg",
]

ALIASES = {
    "kcal": {"energy"},
    "protein_per_100g": {"protein"},
    "fat_per_100g": {"total lipid fat", "fat total lipids", "total fat"},
    "carbs_per_100g": {"carbohydrate by difference", "carbohydrate total", "total carbohydrate"},
    "sugar_per_100g": {"sugars total including nlea", "sugars total", "total sugars"},
    "fiber_per_100g": {"fiber total dietary", "fibre total dietary", "dietary fibre", "dietary fiber"},
    "sfa": {"fatty acids total saturated", "saturated fatty acids total"},
    "calcium_mg": {"calcium ca", "calcium"},
    "iron_mg": {"iron fe", "iron"},
    "magnesium_mg": {"magnesium mg", "magnesium"},
    "phosphorus_mg": {"phosphorus p", "phosphorus"},
    "potassium_mg": {"potassium k", "potassium"},
    "sodium_mg": {"sodium na", "sodium"},
    "zinc_mg": {"zinc zn", "zinc"},
    "copper_mg": {"copper cu", "copper"},
    "manganese_mg": {"manganese mn", "manganese"},
    "selenium_ug": {"selenium se", "selenium"},
    "vitamin_a_mcg": {"vitamin a rae", "vitamin a retinol activity equivalents"},
    "vitamin_e_mg": {"vitamin e alpha tocopherol", "alpha tocopherol"},
    "vitamin_d_mcg": {"vitamin d d2 d3", "vitamin d d2 + d3", "vitamin d total"},
    "vitamin_c_mg": {"vitamin c total ascorbic acid", "vitamin c"},
    "vitamin_b1_mg": {"thiamin", "thiamine"},
    "vitamin_b2_mg": {"riboflavin"},
    "vitamin_b3_mg": {"niacin"},
    "vitamin_b5_mg": {"pantothenic acid"},
    "vitamin_b6_mg": {"vitamin b 6", "vitamin b6"},
    "vitamin_b9_mcg": {"folate total", "folate"},
    "vitamin_b12_mcg": {"vitamin b 12", "vitamin b12"},
    "choline_mg": {"choline total", "choline"},
    "vitamin_k_mcg": {"vitamin k phylloquinone", "phylloquinone"},
}

MUFA_NAMES = {"fatty acids total monounsaturated", "monounsaturated fatty acids total"}
PUFA_NAMES = {"fatty acids total polyunsaturated", "polyunsaturated fatty acids total"}

CNF_TAG_MAP = {
    "ENERC_KCAL": "kcal",
    "PROCNT": "protein_per_100g",
    "FAT": "fat_per_100g",
    "CHOCDF": "carbs_per_100g",
    "SUGAR": "sugar_per_100g",
    "FIBTG": "fiber_per_100g",
    "FASAT": "sfa",
    "CA": "calcium_mg",
    "FE": "iron_mg",
    "MG": "magnesium_mg",
    "P": "phosphorus_mg",
    "K": "potassium_mg",
    "NA": "sodium_mg",
    "ZN": "zinc_mg",
    "CU": "copper_mg",
    "MN": "manganese_mg",
    "SE": "selenium_ug",
    "VITA_RAE": "vitamin_a_mcg",
    "TOCPHA": "vitamin_e_mg",
    "VITAA": "vitamin_a_mcg",
    "VITE": "vitamin_e_mg",
    "VITD": "vitamin_d_mcg",
    "VITC": "vitamin_c_mg",
    "THIA": "vitamin_b1_mg",
    "RIBF": "vitamin_b2_mg",
    "NIA": "vitamin_b3_mg",
    "PANTAC": "vitamin_b5_mg",
    "VITB6A": "vitamin_b6_mg",
    "FOL": "vitamin_b9_mcg",
    "FOLDFE": "vitamin_b9_mcg",
    "VITB12": "vitamin_b12_mcg",
    "CHOLN": "choline_mg",
    "VITK1": "vitamin_k_mcg",
}
CNF_MUFA_TAGS = {"FAMS"}
CNF_PUFA_TAGS = {"FAPU"}

# BLS 4.0 uses EuroFIR-style component codes. Only conceptually equivalent
# fields are mapped here; ambiguous vitamin A/E equivalents are deliberately
# left unmapped until their component definitions are reviewed.
BLS_CODE_MAP = {
    "ENERCC": "kcal",
    "PROT625": "protein_per_100g",
    "FAT": "fat_per_100g",
    "CHO": "carbs_per_100g",
    "FIBT": "fiber_per_100g",
    "SUGAR": "sugar_per_100g",
    "FASAT": "sfa",
    "CA": "calcium_mg",
    "FE": "iron_mg",
    "MG": "magnesium_mg",
    "P": "phosphorus_mg",
    "K": "potassium_mg",
    "NA": "sodium_mg",
    "ZN": "zinc_mg",
    "CU": "copper_mg",
    "MN": "manganese_mg",
    "SE": "selenium_ug",
    "VITD": "vitamin_d_mcg",
    "VITC": "vitamin_c_mg",
    "THIA": "vitamin_b1_mg",
    "RIBF": "vitamin_b2_mg",
    "NIA": "vitamin_b3_mg",
    "PANTAC": "vitamin_b5_mg",
    "VITB6": "vitamin_b6_mg",
    "VITB6A": "vitamin_b6_mg",
    "FOLFD": "vitamin_b9_mcg",
    "VITB12": "vitamin_b12_mcg",
    "CHOLN": "choline_mg",
    "VITK": "vitamin_k_mcg",
    "VITK1": "vitamin_k_mcg",
}
BLS_MUFA_CODES = {"FAMS"}
BLS_PUFA_CODES = {"FAPU"}

def norm(s: str) -> str:
    s = (s or "").lower().replace("µ", "u").replace("μ", "u")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()

def number(v):
    if v is None:
        return None
    s = str(v).strip().replace(",", ".")
    if not s or s.upper() in {"NULL","NA","N/A","TR","TRACE","-"}:
        return None
    try:
        return float(s)
    except ValueError:
        return None

def zip_member(z: zipfile.ZipFile, basename: str) -> str:
    for name in z.namelist():
        if Path(name).name.lower() == basename.lower():
            return name
    raise FileNotFoundError(f"{basename} not found in ZIP; members={z.namelist()[:20]}")

def csv_rows_from_zip(path: Path, basename: str):
    with zipfile.ZipFile(path) as z:
        member = zip_member(z, basename)
        raw = z.read(member)
    text = raw.decode("utf-8-sig", errors="replace")
    return list(csv.DictReader(io.StringIO(text)))

def optional_csv_rows_from_zip(path: Path, basename: str):
    try:
        return csv_rows_from_zip(path, basename)
    except FileNotFoundError:
        return None

def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()

def canonical_field(nutrient_name: str, unit: str | None = None):
    n = norm(nutrient_name)
    u = norm(unit or "")
    if n.startswith("energy"):
        return "kcal" if "kcal" in u or "kilocalorie" in u else None
    for field, aliases in ALIASES.items():
        if n in aliases:
            if field == "vitamin_d_mcg" and u and not any(x in u for x in ("ug","mcg")):
                return None
            return field
    return None

def load_existing(repo: Path):
    fdc_ids = set()
    names = set()
    for p in sorted((repo / "data").glob("products.v5.3.210-p1.3.part-*.json")):
        try:
            rows = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        for row in rows:
            if row.get("fdc_id") is not None:
                fdc_ids.add(str(row["fdc_id"]))
            dq = row.get("data_quality_v1_3") or {}
            if dq.get("source_registry_id") in {"USDA_FDC","USDA_FNDDS"} and dq.get("source_record_id"):
                fdc_ids.add(str(dq["source_record_id"]))
            for key in ("name","name_ru"):
                if row.get(key):
                    names.add(norm(row[key]))
    return fdc_ids, names

def blank_record(source, source_record_id, name):
    rec = {
        "source_registry_id": source,
        "source_record_id": str(source_record_id),
        "name": name,
        "state": None,
        "already_in_current_db": False,
    }
    for f in CANONICAL_FIELDS:
        rec[f] = None
    return rec

def apply_value(rec, field, value):
    if value is None:
        return
    rec[field] = value

def finalize_record(rec, mufa=None, pufa=None):
    if mufa is not None or pufa is not None:
        rec["unsat"] = (mufa or 0.0) + (pufa or 0.0)
    sodium = rec.get("sodium_mg")
    if sodium is not None:
        rec["salt"] = sodium * 2.54 / 1000.0
    present = sum(rec[f] is not None for f in CANONICAL_FIELDS)
    rec["canonical_fields_present"] = present
    rec["canonical_completeness"] = round(present / len(CANONICAL_FIELDS), 4)
    rec["macro_complete"] = all(rec[f] is not None for f in (
        "kcal","protein_per_100g","fat_per_100g","carbs_per_100g"
    ))
    return rec

def parse_usda(path: Path, source_label: str, existing_fdc: set[str]):
    foods = csv_rows_from_zip(path, "food.csv")
    nutrients = csv_rows_from_zip(path, "nutrient.csv")
    amounts = csv_rows_from_zip(path, "food_nutrient.csv")

    # FoodData Central ZIPs include shared lookup/support rows in food.csv.
    # Foundation exports must be restricted to IDs explicitly listed in
    # foundation_food.csv; otherwise tens of thousands of unrelated records
    # appear as false "Foundation Foods".
    allowed_ids = None
    if source_label.startswith("Foundation"):
        foundation_rows = optional_csv_rows_from_zip(path, "foundation_food.csv")
        if foundation_rows is None:
            raise RuntimeError("Foundation ZIP has no foundation_food.csv; refusing unsafe broad import")
        allowed_ids = {
            str(r.get("fdc_id") or r.get("id") or "")
            for r in foundation_rows
            if (r.get("fdc_id") or r.get("id"))
        }

    nutrient_meta = {}
    for r in nutrients:
        nid = str(r.get("id") or r.get("nutrient_id") or "")
        nutrient_meta[nid] = {
            "name": r.get("name") or "",
            "unit": r.get("unit_name") or r.get("unit") or "",
        }

    records = {}
    for f in foods:
        fid = str(f.get("fdc_id") or f.get("id") or "")
        if not fid:
            continue
        if allowed_ids is not None and fid not in allowed_ids:
            continue
        rec = blank_record("USDA_FDC", fid, f.get("description") or "")
        rec["source_dataset"] = source_label
        rec["fdc_id"] = fid
        rec["food_category_id"] = f.get("food_category_id")
        rec["publication_date"] = f.get("publication_date")
        rec["already_in_current_db"] = fid in existing_fdc
        records[fid] = rec

    mufa = defaultdict(lambda: None)
    pufa = defaultdict(lambda: None)
    for r in amounts:
        fid = str(r.get("fdc_id") or "")
        rec = records.get(fid)
        if not rec:
            continue
        nid = str(r.get("nutrient_id") or "")
        meta = nutrient_meta.get(nid, {})
        name = meta.get("name", "")
        unit = meta.get("unit", "")
        val = number(r.get("amount"))
        if val is None:
            continue
        n = norm(name)
        if n in MUFA_NAMES:
            mufa[fid] = val
            continue
        if n in PUFA_NAMES:
            pufa[fid] = val
            continue
        field = canonical_field(name, unit)
        if field:
            apply_value(rec, field, val)

    out = [finalize_record(rec, mufa[fid], pufa[fid]) for fid, rec in records.items()]
    catalog = [{"id": k, **v, "normalized_name": norm(v["name"])} for k, v in nutrient_meta.items()]
    return out, catalog

def pick_col(row, *candidates):
    lower = {norm(k): k for k in row}
    for c in candidates:
        k = lower.get(norm(c))
        if k:
            return row.get(k)
    return None

def parse_cnf(path: Path, existing_names: set[str]):
    foods = csv_rows_from_zip(path, "food_name.csv")
    nutrient_names = csv_rows_from_zip(path, "nutrient_name.csv")
    amounts = csv_rows_from_zip(path, "nutrient_amount.csv")

    nutrient_meta = {}
    for r in nutrient_names:
        code = str(pick_col(r, "Nutrient_Code") or "")
        nutrient_meta[code] = {
            "name": pick_col(r, "Nutrient_Name_EN") or "",
            "unit": pick_col(r, "Nutrient_Unit") or "",
            "symbol": pick_col(r, "Nutrient_Symbol") or "",
            "tagname": pick_col(r, "Tagname") or "",
        }

    records = {}
    for f in foods:
        code = str(pick_col(f, "Food_Code") or "")
        if not code:
            continue
        name = pick_col(f, "Food_Description_EN") or ""
        rec = blank_record("HEALTH_CANADA_CNF", code, name)
        rec["source_dataset"] = "Canadian Nutrient File 2026"
        rec["alternate_name"] = pick_col(f, "Alternate_Description_EN")
        rec["scientific_name"] = pick_col(f, "ScientificName")
        rec["food_group_code"] = pick_col(f, "CNF_Food_Group_Code")
        rec["usda_ndb_code"] = pick_col(f, "USDA_NDB_Code")
        rec["already_in_current_db"] = norm(name) in existing_names
        records[code] = rec

    mufa = defaultdict(lambda: None)
    pufa = defaultdict(lambda: None)
    for r in amounts:
        code = str(pick_col(r, "Food_Code") or "")
        rec = records.get(code)
        if not rec:
            continue
        ncode = str(pick_col(r, "Nutrient_Code") or "")
        meta = nutrient_meta.get(ncode, {})
        val = number(pick_col(r, "Nutrient_Amount"))
        if val is None:
            continue
        name = meta.get("name", "")
        n = norm(name)
        tag = str(meta.get("tagname") or "").strip().upper()
        if tag in CNF_MUFA_TAGS or n in MUFA_NAMES:
            mufa[code] = val
            continue
        if tag in CNF_PUFA_TAGS or n in PUFA_NAMES:
            pufa[code] = val
            continue
        field = CNF_TAG_MAP.get(tag) or canonical_field(name, meta.get("unit"))
        if field:
            apply_value(rec, field, val)

    out = [finalize_record(rec, mufa[code], pufa[code]) for code, rec in records.items()]
    catalog = [{"id": k, **v, "normalized_name": norm(v["name"])} for k, v in nutrient_meta.items()]
    return out, catalog


def convert_bls_value(value, field: str, unit: str):
    """Convert BLS component units to this project's canonical field units."""
    if value is None:
        return None
    u = norm(unit)
    if field.endswith("_mg") and ("ug" in u or "microgram" in u):
        return value / 1000.0
    if (field.endswith("_mcg") or field.endswith("_ug")) and ("mg" in u or "milligram" in u):
        return value * 1000.0
    return value

def bls_component_field(code: str, name: str, unit: str):
    code = str(code or "").strip().upper()
    if code in BLS_CODE_MAP:
        return BLS_CODE_MAP[code]
    n = norm(name)
    u = norm(unit)
    # Conservative fallbacks for unambiguous component names.
    if n.startswith("protein ") or n == "protein":
        return "protein_per_100g"
    if n in {"fat", "total fat"}:
        return "fat_per_100g"
    if n in {"carbohydrates available", "available carbohydrates"}:
        return "carbs_per_100g"
    if n in {"dietary fibre total", "dietary fiber total", "fibre total", "fiber total"}:
        return "fiber_per_100g"
    if n in {"sugars total", "total sugars"}:
        return "sugar_per_100g"
    if n in {"saturated fatty acids total", "fatty acids saturated total"}:
        return "sfa"
    if n == "calcium":
        return "calcium_mg"
    if n == "iron":
        return "iron_mg"
    if n == "magnesium":
        return "magnesium_mg"
    if n == "phosphorus":
        return "phosphorus_mg"
    if n == "potassium":
        return "potassium_mg"
    if n == "sodium":
        return "sodium_mg"
    if n == "zinc":
        return "zinc_mg"
    if n == "copper":
        return "copper_mg"
    if n == "manganese":
        return "manganese_mg"
    if n == "selenium":
        return "selenium_ug"
    if "vitamin d" in n and ("ug" in u or "microgram" in u):
        return "vitamin_d_mcg"
    if n in {"vitamin c", "ascorbic acid"}:
        return "vitamin_c_mg"
    if n in {"thiamin", "thiamine"}:
        return "vitamin_b1_mg"
    if n == "riboflavin":
        return "vitamin_b2_mg"
    if n == "niacin":
        return "vitamin_b3_mg"
    if n == "pantothenic acid":
        return "vitamin_b5_mg"
    if n in {"vitamin b6", "vitamin b 6"}:
        return "vitamin_b6_mg"
    if n in {"folate", "folate total"}:
        return "vitamin_b9_mcg"
    if n in {"vitamin b12", "vitamin b 12"}:
        return "vitamin_b12_mcg"
    if n in {"choline", "choline total"}:
        return "choline_mg"
    if n in {"vitamin k", "phylloquinone"}:
        return "vitamin_k_mcg"
    return None

def parse_bls(path: Path, existing_names: set[str]):
    try:
        import openpyxl
    except ImportError as exc:
        raise RuntimeError("openpyxl is required for BLS 4.0 import") from exc

    with zipfile.ZipFile(path) as z:
        components_member = next(
            n for n in z.namelist()
            if n.lower().endswith("components_de_en.xlsx")
        )
        data_member = next(
            n for n in z.namelist()
            if n.lower().endswith("daten_2025_de.xlsx")
        )
        components_bytes = z.read(components_member)
        data_bytes = z.read(data_member)

    cwb = openpyxl.load_workbook(io.BytesIO(components_bytes), read_only=True, data_only=True)
    cws = cwb[cwb.sheetnames[0]]
    crows = cws.iter_rows(values_only=True)
    next(crows, None)
    component_meta = {}
    catalog = []
    for row in crows:
        if not row or row[1] is None:
            continue
        code = str(row[1]).strip().upper()
        meta = {
            "code": code,
            "name_de": "" if row[2] is None else str(row[2]),
            "name": "" if row[3] is None else str(row[3]),
            "unit": "" if row[4] is None else str(row[4]),
            "group_de": "" if row[5] is None else str(row[5]),
            "group": "" if row[6] is None else str(row[6]),
            "formula": "" if row[7] is None else str(row[7]),
            "formula_application": "" if row[8] is None else str(row[8]),
        }
        meta["canonical_field"] = bls_component_field(code, meta["name"], meta["unit"])
        component_meta[code] = meta
        catalog.append(meta)

    dwb = openpyxl.load_workbook(io.BytesIO(data_bytes), read_only=True, data_only=True)
    dws = dwb[dwb.sheetnames[0]]
    rows = dws.iter_rows(values_only=True)
    headers = next(rows)

    columns = []
    for idx in range(3, len(headers), 3):
        header = headers[idx]
        if header is None:
            continue
        code = str(header).split()[0].strip().upper()
        meta = component_meta.get(code, {})
        field = meta.get("canonical_field")
        role = None
        if code in BLS_MUFA_CODES:
            role = "mufa"
        elif code in BLS_PUFA_CODES:
            role = "pufa"
        elif field:
            role = "field"
        if role:
            columns.append((idx, code, role, field))

    records = []
    for row in rows:
        if not row or row[0] is None:
            continue
        bls_code = str(row[0]).strip()
        name_de = "" if row[1] is None else str(row[1])
        name = "" if row[2] is None else str(row[2])
        rec = blank_record("GERMANY_BLS", bls_code, name or name_de)
        rec["source_dataset"] = "BLS 4.0 (2025)"
        rec["bls_code"] = bls_code
        rec["name_de"] = name_de
        rec["already_in_current_db"] = norm(name or name_de) in existing_names
        provenance = {}
        mufa = None
        pufa = None

        for idx, component_code, role, field in columns:
            if idx >= len(row):
                continue
            val = number(row[idx])
            if val is None:
                continue
            origin = row[idx + 1] if idx + 1 < len(row) else None
            reference = row[idx + 2] if idx + 2 < len(row) else None
            if role == "mufa":
                mufa = val
                provenance["mufa_component"] = {
                    "component_code": component_code,
                    "origin": origin,
                    "reference": reference,
                }
                continue
            if role == "pufa":
                pufa = val
                provenance["pufa_component"] = {
                    "component_code": component_code,
                    "origin": origin,
                    "reference": reference,
                }
                continue
            # Never overwrite one canonical concept with a second component.
            if rec.get(field) is None:
                meta = component_meta.get(component_code, {})
                val = convert_bls_value(val, field, meta.get("unit", ""))
                rec[field] = val
                provenance[field] = {
                    "component_code": component_code,
                    "origin": origin,
                    "reference": reference,
                }

        rec = finalize_record(rec, mufa, pufa)
        if rec.get("salt") is not None and "sodium_mg" in provenance:
            provenance["salt"] = {
                "method": "derived_from_sodium",
                "factor": 2.54,
                "source_component": provenance["sodium_mg"],
            }
        if rec.get("unsat") is not None:
            provenance["unsat"] = {
                "method": "mufa_plus_pufa",
                "mufa_component": provenance.get("mufa_component"),
                "pufa_component": provenance.get("pufa_component"),
            }
        rec["source_value_provenance"] = provenance
        records.append(rec)

    return records, catalog

def source_summary(records):
    field_coverage = {}
    for f in CANONICAL_FIELDS:
        n = sum(r[f] is not None for r in records)
        field_coverage[f] = {"count": n, "pct": round(100*n/len(records), 1) if records else 0}
    return {
        "records": len(records),
        "already_in_current_db": sum(bool(r.get("already_in_current_db")) for r in records),
        "new_candidate_records": sum(not r.get("already_in_current_db") for r in records),
        "macro_complete": sum(bool(r.get("macro_complete")) for r in records),
        "median_like_completeness_distribution": dict(sorted(Counter(
            str(int(r["canonical_completeness"] * 10) * 10) + "-" +
            str(min(100, int(r["canonical_completeness"] * 10) * 10 + 9)) + "%"
            for r in records
        ).items())),
        "field_coverage": field_coverage,
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=".")
    ap.add_argument("--usda-foundation", required=True)
    ap.add_argument("--usda-sr", required=True)
    ap.add_argument("--cnf", required=True)
    ap.add_argument("--bls", default=None)
    ap.add_argument("--out-dir", required=True)
    args = ap.parse_args()

    repo = Path(args.repo)
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    existing_fdc, existing_names = load_existing(repo)

    all_records = []
    catalogs = {}
    summaries = {}
    files = {}

    for label, path_s in [
        ("usda_foundation_2026_04", args.usda_foundation),
        ("usda_sr_legacy_2018", args.usda_sr),
        ("cnf_2026", args.cnf),
    ]:
        p = Path(path_s)
        files[label] = {"filename": p.name, "bytes": p.stat().st_size, "sha256": sha256(p)}

    foundation, cat_found = parse_usda(Path(args.usda_foundation), "Foundation Foods 2026-04", existing_fdc)
    sr, cat_sr = parse_usda(Path(args.usda_sr), "SR Legacy 2018", existing_fdc)
    cnf, cat_cnf = parse_cnf(Path(args.cnf), existing_names)

    datasets = [
        ("USDA Foundation 2026-04", foundation),
        ("USDA SR Legacy 2018", sr),
        ("Canadian Nutrient File 2026", cnf),
    ]
    for name, records in datasets:
        summaries[name] = source_summary(records)
        all_records.extend(records)

    catalogs["USDA Foundation nutrient catalog"] = cat_found
    catalogs["USDA SR nutrient catalog"] = cat_sr
    catalogs["CNF nutrient catalog"] = cat_cnf

    if args.bls:
        p = Path(args.bls)
        if p.exists() and p.stat().st_size:
            with zipfile.ZipFile(p) as z:
                members = [{"name": n, "bytes": z.getinfo(n).file_size} for n in z.namelist()]
            files["bls_4_0_2025"] = {
                "filename": p.name, "bytes": p.stat().st_size, "sha256": sha256(p),
                "zip_members": members,
            }
            bls, cat_bls = parse_bls(p, existing_names)
            summaries["German BLS 4.0 (2025)"] = source_summary(bls)
            all_records.extend(bls)
            catalogs["BLS 4.0 component catalog"] = cat_bls

    report = {
        "schema_version": 1,
        "purpose": "staging audit only; production database unchanged",
        "null_semantics": "missing source values remain null and are never converted to zero",
        "current_database": {
            "products": 1105,
            "known_usda_source_ids": len(existing_fdc),
            "known_normalized_names": len(existing_names),
        },
        "canonical_fields": CANONICAL_FIELDS,
        "source_files": files,
        "sources": summaries,
        "total_staged_records": len(all_records),
        "total_new_candidates_before_cross_source_dedup": sum(not r["already_in_current_db"] for r in all_records),
        "notes": [
            "Cross-source duplicate resolution is intentionally deferred until source quality is audited.",
            "HEI/FPED equivalents are not invented for new records.",
            "Russian names are not fabricated; localization is a separate controlled layer.",
        ],
    }

    (out / "external_food_source_audit.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out / "external_nutrient_catalogs.json").write_text(
        json.dumps(catalogs, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    with (out / "external_foods_staging.jsonl").open("w", encoding="utf-8") as f:
        for rec in all_records:
            f.write(json.dumps(rec, ensure_ascii=False, separators=(",", ":")) + "\n")

    preview = sorted(
        all_records,
        key=lambda r: (r["already_in_current_db"], -r["canonical_fields_present"], r["name"])
    )[:200]
    (out / "external_foods_preview.json").write_text(
        json.dumps(preview, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
