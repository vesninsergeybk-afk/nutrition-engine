#!/usr/bin/env python3
"""Read-only audit of the 15 pre-screened wave-2 foods.

Never edits product catalogs, provenance registries, HEI formulas, or runtime.
Inputs are regenerated Step 4F evidence and the canonical 16-food pilot.
"""
import argparse
import json
import math
import re
from collections import Counter
from pathlib import Path

N = "kcal protein_per_100g fat_per_100g carbs_per_100g sugar_per_100g fiber_per_100g sfa unsat added_sugar salt calcium_mg iron_mg magnesium_mg phosphorus_mg potassium_mg sodium_mg zinc_mg copper_mg manganese_mg selenium_ug vitamin_a_mcg vitamin_e_mg vitamin_d_mcg vitamin_c_mg vitamin_b1_mg vitamin_b2_mg vitamin_b3_mg vitamin_b5_mg vitamin_b6_mg vitamin_b9_mcg vitamin_b12_mcg choline_mg vitamin_k_mcg".split()
H = "fruit_cup_eq_per_100g whole_fruit_cup_eq_per_100g veg_cup_eq_per_100g greens_beans_cup_eq_per_100g dairy_cup_eq_per_100g whole_grain_oz_eq_per_100g refined_grain_oz_eq_per_100g protein_oz_eq_per_100g seafood_plant_oz_eq_per_100g added_sugars_tsp_eq_per_100g".split()

def norm(t):
    return re.sub(r"\W+", " ", (t or "").lower()).strip()

def looks_state_mismatch(nutrition, pattern):
    a, b = norm(nutrition), norm(pattern)
    kinds = [("fresh","dried"),("raw","cooked"),("raw","boiled"),("raw","roasted"),("raw","canned"),("dry","cooked")]
    return any((x in a.split() and y in b.split()) or (y in a.split() and x in b.split()) for x,y in kinds)

def examine(p):
    q = p.get("data_quality_v1_3") or {}
    h = p.get("hei_equiv_provenance") or {}
    meta = p.get("external_import_v15") or {}
    methods = p.get("nutrient_provenance_v1_3") or {}
    issues = []
    for key in N+H:
        v = p.get(key)
        if type(v) not in (int,float) or not math.isfinite(v) or v<0:
            issues.append("BAD_OR_MISSING_NUTRIENT:"+key)
    if sum(map(len,methods.values()))!=len(N) or sorted(x for vals in methods.values() for x in vals)!=sorted(N):
        issues.append("PROVENANCE_FIELDS_NOT_UNIQUE")
    if q.get("review_status")!="REVIEW_REQUIRED":
        issues.append("UNEXPECTED_REVIEW_STATUS")
    if h.get("status") not in ("OFFICIAL_EXACT","STRUCTURAL_ZERO"):
        issues.append("UNRESOLVED_HEI_SOURCE")
    if h.get("status")=="OFFICIAL_EXACT" and looks_state_mismatch(p.get("name"),h.get("description")):
        issues.append("HEI_EXACT_STATE_MISMATCH")
    if h.get("status")=="STRUCTURAL_ZERO" and any(p.get(f) for f in H):
        issues.append("NONZERO_HEI_WITH_STRUCTURAL_ZERO")
    if abs(p["salt"]-p["sodium_mg"]*2.54/1000)>0.00001:
        issues.append("SALT_SODIUM_DISAGREEMENT")
    assumed=sorted(methods.get("ASSUMED_ZERO",[]))
    if assumed:
        # Explicitly report, do not silently deem measured or demand ad hoc imputation.
        issues.append("ASSUMED_ZERO:"+",".join(assumed))
    return {
      "name_ru":p.get("name_ru"),
      "name_original":p.get("name"),
      "key":p.get("key"),
      "family_key":meta.get("family_key"),
      "tier":meta.get("tier"),
      "category":p.get("category"),
      "state":p.get("state"),
      "source":p.get("source_id"),
      "HEI_status":h.get("status"),
      "HEI_source":h.get("description",h.get("note")),
      "HEI_code":h.get("code"),
      "nutrient_method_counts":{k:len(v) for k,v in methods.items()},
      "science_flags":issues,
      "hard_blocks":[i for i in issues if not i.startswith("ASSUMED_ZERO:")],
      "requires_independent_science_review":True
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--preview",required=True)
    ap.add_argument("--pilot",required=True)
    ap.add_argument("--out",required=True)
    a=ap.parse_args()
    all_preview=json.loads(Path(a.preview).read_text())
    pilot=json.loads(Path(a.pilot).read_text())
    assert len(all_preview)==32 and len(pilot)==16
    pilot_keys={x["key"] for x in pilot}
    remaining=[p for p in all_preview if p["key"] not in pilot_keys]
    assert len(remaining)==16
    assert any(p["key"]=="ext_spice_thyme" for p in remaining)
    next15=[p for p in remaining if p["key"]!="ext_spice_thyme"]
    assert len(next15)==15
    assert Counter((p.get("external_import_v15") or {}).get("tier") for p in next15)=={"EXTENDED":14,"CHILD":1}
    details=[examine(p) for p in next15]
    report={
      "status":"STAGING_AUDIT_ONLY",
      "source_screening":89,
      "original_preview":32,
      "production_ready_to_publish":0,
      "piloted_separately":16,
      "fresh_thyme_quarantine":1,
      "second_wave_candidates":15,
      "core":0,"extended":14,"variant":1,
      "candidate_names":[p["name_ru"] for p in details],
      "requires_corrections":sum(bool(p["hard_blocks"]) for p in details),
      "details":details
    }
    path=Path(a.out)
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps({k:v for k,v in report.items() if k!="details"},ensure_ascii=False,indent=2))
    print("\nCANDIDATES DETAIL:")
    for d in details:
        print(json.dumps(d,ensure_ascii=False))
    summary=Path(".stage4f/wave2_summary.md")
    lines=["## Wave 2 — реальный состав второго пакета","",
            "| Продукт | Семейство | Тип | HEI | Проверить |",
            "|---|---|---|---|---|"]
    for d in details:
        flags=", ".join(d["hard_blocks"]) if d["hard_blocks"] else "Неявных блокировок не найдено"
        lines.append(f'| {d["name_ru"]} | {d["family_key"]} | {d["tier"]} | {d["HEI_status"]} | {flags} |')
    lines+=["","Статус: ТОЛЬКО АУДИТ; запуск импорта и публикация не разрешены.",
            "ASSUMED_ZERO — оценочный ноль, а не подтверждённое отсутствие нутриента."]
    summary.write_text("\n".join(lines)+"\n")

if __name__=="__main__":
    main()
