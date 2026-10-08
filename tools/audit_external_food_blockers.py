#!/usr/bin/env python3
"""Evidence inventory for 56 Step 4E blocked foods, no scientific imputation.

Separates missing nutrient values from HEI crosswalk blockers.
Existing values/provenance are never touched. Outputs a sortable JSON report and
a full per-food Markdown dossier for exact-source research.
"""
from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path

FIELDS = (
    "kcal protein_per_100g fat_per_100g carbs_per_100g sugar_per_100g "
    "fiber_per_100g sfa unsat added_sugar salt calcium_mg iron_mg "
    "magnesium_mg phosphorus_mg potassium_mg sodium_mg zinc_mg copper_mg "
    "manganese_mg selenium_ug vitamin_a_mcg vitamin_e_mg vitamin_d_mcg "
    "vitamin_c_mg vitamin_b1_mg vitamin_b2_mg vitamin_b3_mg vitamin_b5_mg "
    "vitamin_b6_mg vitamin_b9_mcg vitamin_b12_mcg choline_mg vitamin_k_mcg"
).split()


def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--blocked", required=True)
    parser.add_argument("--state-blocked", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    blocked = load(args.blocked)
    state_blocked = load(args.state_blocked)
    assert len(blocked) == 56, len(blocked)
    assert len(state_blocked) == 1

    missing_counts = Counter()
    source_counts = Counter()
    issue_counts = Counter()
    rows = []
    for p in blocked:
        missing = [f for f in FIELDS if p["nutrients"][f] is None]
        src = p["primary_source"]
        source_counts[src["source_registry_id"]] += 1
        issues = p["issues_after_step4d"]
        issue_counts.update(issues)
        assert ("MISSING_CALCULATOR_NUTRIENTS" in issues) == bool(missing), (p["family_key"], missing, issues)
        assert ("HEI_EQUIVALENTS_UNRESOLVED" in issues) == (p.get("hei_equivalents") is None)
        missing_counts.update(missing)
        prov = p.get("nutrient_provenance_final_v15") or {}
        assert all(prov[f]["method"] == "MISSING" for f in missing)
        rows.append({
            "family_key": p["family_key"],
            "family_id": p["family_id"],
            "tier": p["tier"],
            "name_ru": p["name_ru_import"],
            "selected_profile_id": p["selected_profile_id"],
            "source": src,
            "missing_nutrients": missing,
            "missing_count": len(missing),
            "hei_unresolved": p.get("hei_equivalents") is None,
            "hei_source_status": (p.get("hei_equiv_provenance_step4d_v15") or p.get("hei_equiv_provenance_import_v15") or {}).get("status"),
            "issues": issues,
            "remaining_nutrient_count": 33-len(missing)
        })
    assert len(rows) == 56
    assert sum(missing_counts.values()) == 179
    assert sum(r["hei_unresolved"] for r in rows) == 28
    assert sum(r["missing_count"]>0 for r in rows) == 52
    assert sum(r["hei_unresolved"] and r["missing_count"]>0 for r in rows) == 24

    rows.sort(key=lambda r: (r["missing_count"],r["hei_unresolved"],r["family_key"]))
    report = {
        "status": "EVIDENCE_ONLY_NO_IMPORT",
        "count_blocked": len(rows),
        "distinct_foods_missing": 52,
        "distinct_foods_hei_unresolved": 28,
        "both_types": 24,
        "remaining_missing_fields": 179,
        "missing_counts_by_field": dict(missing_counts.most_common()),
        "issues": dict(issue_counts),
        "sources": dict(source_counts),
        "foods": rows,
        "additional_state_blocked": [{
          "family_key":p["family_key"],
          "source":p["primary_source"],
          "block_reason":p.get("step4e_block_reason")
        } for p in state_blocked]
    }
    output=Path(args.output);output.mkdir(parents=True,exist_ok=True)
    (output/"blocked56_inventory.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    lines=["# Blocked foods: independent source-resolution ledger","",
      "DO NOT publish, calculate unknowns as zero, or infer HEI values from other food species/states.","",
      "## Dataset overview","",
      f'- Blocked candidates: {len(rows)}',
      '- With missing nutrients: 52; with unresolved HEI: 28; both: 24',
      f'- Total missing nutrient fields: {sum(missing_counts.values())}',"",
      "### Missing by calculator field", "",
      "| Nutrient field | Missing records |","|---|---:|"]
    lines += [f"| `{k}` | {v} |" for k,v in missing_counts.most_common()]
    lines+=["","### All 56 candidates","",
      "| Family | RU label | Source ID | Missing nutrients | HEI |","|---|---|---|---|---|"]
    for p in rows:
        ss=p["source"]
        lines.append(f'| `{p["family_key"]}` | {p["name_ru"]} | {ss["source_registry_id"]}:{ss["source_record_id"]} | {", ".join(p["missing_nutrients"]) or "0"} | {"UNRESOLVED" if p["hei_unresolved"] else "EXPLICIT"} |')
    lines += ["","### Priority science considerations","",
      "- A nutrient may be derived only with an accepted dimensionally correct formula and documented underlying components; no cross-food interpolation.",
      "- Official food-pattern equivalents (FPED/FPID) are distinct from USDA nutrient records; require exact food, processing state and suitable mapping.",
      "- Reported zero, physiological/structural zero, assumed zero and unmeasured all have different provenance meanings.",
      "- Preserve dataset versions and licensing, specific food species and processing state.",
    ]
    (output/"blocked56_inventory.md").write_text("\n".join(lines)+"\n",encoding="utf-8")

    print("BLOCKER_SUMMARY",json.dumps({
      "count":56,"missing_fields":179,"nutrient_records":52,"hei_records":28,
      "overlap_records":24,"field_counts":dict(missing_counts.most_common()),
      "source_counts":dict(source_counts)},ensure_ascii=False))
    print("BLOCKED_56_DETAIL_START")
    for p in rows:
        s=p["source"]
        print(json.dumps({
          "family":p["family_key"],"tier":p["tier"],
          "source":s["source_registry_id"]+":"+str(s["source_record_id"]),
          "source_name":s.get("source_name"),"missing":p["missing_nutrients"],
          "hei":p["hei_unresolved"],"issues":p["issues"]
        },ensure_ascii=False))
    print("BLOCKED_56_DETAIL_END")
    print("DRY_PINTO",json.dumps(report["additional_state_blocked"],ensure_ascii=False))


if __name__=="__main__":
    main()
