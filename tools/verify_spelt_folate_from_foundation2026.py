#!/usr/bin/env python3
"""Pin the sole independently verified same-record folate recovery, staging only.

Primary USDA FDC Foundation Foods 2026 source FDC 2003587 reports Folate,
total (No. 417) = 38.4 micrograms / 100 g. No non-null values are overwritten.
All 55 other profiles are byte-for-byte-equivalent dictionaries.
"""
from __future__ import annotations
import argparse,copy,json,math,zipfile
from pathlib import Path

def main():
  ap=argparse.ArgumentParser()
  for x in ("blocked","foundation-zip","out-dir"):ap.add_argument("--"+x,required=True)
  a=ap.parse_args()
  base=json.loads(Path(a.blocked).read_text(encoding="utf-8"))
  assert len(base)==56
  with zipfile.ZipFile(a.foundation_zip) as z:
    jfile=next(n for n in z.namelist() if n.endswith(".json"))
    official=json.loads(z.read(jfile))["FoundationFoods"]
  found=[x for x in official if isinstance(x,dict) and x.get("fdcId")==2003587]
  assert len(found)==1, "foundation identity ambiguity"
  food=found[0]
  assert food["description"]=="Flour, spelt, whole grain",food["description"]
  selected=[x for x in food["foodNutrients"] if str((x.get("nutrient") or {}).get("number"))=="417"]
  assert len(selected)==1,selected
  n=selected[0]
  assert n["nutrient"]["name"]=="Folate, total",n
  assert n["nutrient"]["unitName"] in ("µg","ug"),n
  assert math.isclose(float(n["amount"]),38.4,abs_tol=1e-8)
  assert n["foodNutrientDerivation"]["code"]=="A",n
  v=copy.deepcopy(base)
  item=next(p for p in v if p["family_key"]=="flour spelt")
  assert item["primary_source"]["source_registry_id"]=="USDA_FDC"
  assert str(item["primary_source"]["source_record_id"])=="2003587"
  assert item["primary_source"]["source_name"]=="Flour, spelt, whole grain"
  assert item["nutrients"]["vitamin_b9_mcg"] is None
  assert item["nutrient_provenance_final_v15"]["vitamin_b9_mcg"]["method"]=="MISSING"
  item["nutrients"]["vitamin_b9_mcg"]=38.4
  item["nutrient_provenance_final_v15"]["vitamin_b9_mcg"]={
    "method":"SOURCE_REPORTED",
    "source_registry_id":"USDA_FDC",
    "source_record_id":"2003587",
    "source_dataset":"USDA Foundation Foods 2026-04-30",
    "source_nutrient_number":"417",
    "source_nutrient_name":"Folate, total",
    "source_unit":"µg / 100 g",
    "derivation_code":"A",
    "claim_scope":"direct_primary_record_official_current_release",
    "source_url":"https://fdc.nal.usda.gov/food-details/2003587/nutrients"
  }
  item["missing_nutrients"]=[x for x in item["missing_nutrients"] if x!="vitamin_b9_mcg"]
  item["nutrient_science_recoveries_2026"]=["folate_total_417"]
  assert all(x==y for x,y in zip(base,v) if x["family_key"]!="flour spelt")
  assert sum(y is None for x in v for y in x["nutrients"].values())==178
  assert item["status_after_step4d"]=="BLOCKED_OTHER_GATES"
  assert "MISSING_CALCULATOR_NUTRIENTS" in item["issues_after_step4d"]
  report={
    "status":"PRIMARY_SOURCE_FIELD_VERIFIED_STAGING_ONLY",
    "family_key":"flour spelt",
    "recovered_field":"vitamin_b9_mcg",
    "recovered_value_per_100g":38.4,
    "units":"µg",
    "source":"USDA Foundation Foods 2026-04-30 / FDC 2003587 / nutrient 417",
    "filled_fields":1,
    "blocked_count_still":56,
    "remaining_missing_fields":178,
    "other_profiles_untouched":55,
    "production_catalog_modified":False,
    "authorized_for_production":False,
    "quality_gate_requires":"complete nutrient and HEI profile or explicit unknown-aware calculation path"
  }
  out=Path(a.out_dir);out.mkdir(parents=True,exist_ok=True)
  (out/"spelt_folate_scientific_patch.json").write_text(json.dumps({
    "field_recovery":report,
    "nutrient_field_provenance":item["nutrient_provenance_final_v15"]["vitamin_b9_mcg"]
  },ensure_ascii=False,indent=2)+"\n")
  (out/"blocked56_with_verified_folate_staging_only.json").write_text(json.dumps(v,ensure_ascii=False,indent=2)+"\n")
  print("SPELT_B9_VERIFIED",json.dumps(report,ensure_ascii=False))

if __name__=="__main__":main()
