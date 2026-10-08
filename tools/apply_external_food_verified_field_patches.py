#!/usr/bin/env python3
"""Apply only independently source-verified nutrient patches to 56 staging cards.

Changes exactly two null values. Maintains full scientific trace; unapproved
fields, HEI unknowns and 1105 production products remain unchanged.
"""
from __future__ import annotations
import argparse,copy,json,math
from pathlib import Path
def read(p):return json.loads(Path(p).read_text(encoding="utf-8"))
def main():
  parser=argparse.ArgumentParser()
  for opt in ("blocked","folate-patch","saffron-patch","out-dir"):
    parser.add_argument("--"+opt,required=True)
  a=parser.parse_args()
  before=read(a.blocked)
  assert len(before)==56
  old_nulls=sum(v is None for p in before for v in p["nutrients"].values())
  assert old_nulls==179,old_nulls
  spelt=read(a.folate_patch)
  saffron=read(a.saffron_patch)
  assert spelt["family_key"]=="flour spelt" and spelt["recovery"]["field"]=="vitamin_b9_mcg"
  assert saffron["family_key"]=="spice saffron" and saffron["recovery"]["field"]=="sugar_per_100g"
  assert spelt["recovery"]["value"]==38.4 and saffron["recovery"]["value"]==42.4
  assert spelt["verification"]["workflow_run"]==37857800922
  assert saffron["ci_workflow"]==37858984084
  assert spelt["source"]["fdc_id"]==2003587
  assert saffron["source_primary"]["fdc_id"]=="170934"
  after=copy.deepcopy(before)
  patched=[]
  for patch in (spelt,saffron):
    fk=patch["family_key"];field=patch["recovery"]["field"]
    candidates=[p for p in after if p["family_key"]==fk]
    assert len(candidates)==1
    p=candidates[0]
    assert p["nutrients"][field] is None
    assert p["nutrient_provenance_final_v15"][field]["method"]=="MISSING"
    if fk=="flour spelt":
      assert p["primary_source"]["source_registry_id"]=="USDA_FDC"
      assert str(p["primary_source"]["source_record_id"])=="2003587"
      detail={
        "method":"SOURCE_REPORTED",
        "source_registry_id":"USDA_FDC",
        "source_record_id":"2003587",
        "source_dataset":"Foundation Foods 2026-04-30",
        "nutrient_source_number":"417",
        "name":"Folate, total",
        "unit":"µg/100g",
        "derivation":"A analytical or derived from analytical",
        "claim_scope":"verified_source_same_FDC_ID",
        "science_review":"SOURCE_MATCH_VERIFIED"
      }
    else:
      assert p["primary_source"]["source_registry_id"]=="USDA_FDC"
      assert str(p["primary_source"]["source_record_id"])=="170934"
      detail={
        "method":"SOURCE_REPORTED",
        "source_registry_id":"UK_COFID",
        "source_record_id":"13-852",
        "source_dataset":"CoFID 2021",
        "name":"Total sugars",
        "unit":"g/100g",
        "claim_scope":"name_equivalent_with_macro_fingerprint",
        "science_review":"SOURCE_REPORTED_CROSS_DATASET_REVIEW_REQUIRED",
        "reference":"Marsh et al. 1977, composition of spices and herbs"
      }
    p["nutrients"][field]=patch["recovery"]["value"]
    p["nutrient_provenance_final_v15"][field]=detail
    p["missing_nutrients"]=[n for n in p["missing_nutrients"] if n!=field]
    p.setdefault("source_verified_field_patches_2026",[]).append({
      "field":field,"value":p["nutrients"][field],
      "reference_manifest":fk,"verification":detail["science_review"]})
    patched.append({"family":fk,"field":field,"value":p["nutrients"][field],"source":detail["source_registry_id"]+":"+detail["source_record_id"]})
  changes=[]
  for original,modified in zip(before,after):
    assert original["family_key"]==modified["family_key"]
    for nutrient,old in original["nutrients"].items():
      new=modified["nutrients"][nutrient]
      if old!=new:
        changes.append((original["family_key"],nutrient,old,new))
        assert old is None
    assert original.get("hei_equivalents")==modified.get("hei_equivalents")
    assert original["primary_source"]==modified["primary_source"]
  assert len(changes)==2,changes
  assert sum(v is None for p in after for v in p["nutrients"].values())==177
  assert sum(p["nutrients"]["choline_mg"] is None for p in after)==41
  assert sum(p.get("hei_equivalents") is None for p in after)==28
  assert sum("MISSING_CALCULATOR_NUTRIENTS" in p["issues_after_step4d"] for p in after)==52
  out=Path(a.out_dir);out.mkdir(parents=True,exist_ok=True)
  (out/"blocked56_recovered2_source_bounded_staging_only.json").write_text(json.dumps(after,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
  report={
    "status":"PASS_STAGING_ONLY",
    "approved_nutrient_field_additions":2,
    "verified_primary_record_fields":1,
    "cross_source_correspondence_review_required":1,
    "changed":patched,
    "blocked_foods":56,
    "missing_fields_before":179,
    "missing_fields_after":177,
    "unresolved_hei_records":28,
    "production_products_modified":0,
    "authorization_to_publish":False,
    "science_scope":"Only 2 observed entries, not model-inferred null->zero",
  }
  (out/"source_field_recovery_2_scientific_gate.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
  print("SOURCE_NUTRIENT_GATE",json.dumps(report,ensure_ascii=False))
if __name__=="__main__":main()
