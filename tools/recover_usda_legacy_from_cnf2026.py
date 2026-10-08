#!/usr/bin/env python3
"""NDB-ID anchored cross-check: USDA SR Legacy 2018 -> Health Canada CNF 2026.

No fuzzy food/recipe matches; no assumptions about unreported micronutrients.
Outputs staging-only proposed fields for manual scientific review, never cards.
"""
from __future__ import annotations
import argparse,json,math,zipfile
from collections import Counter,defaultdict
from pathlib import Path
from recover_external_food_from_cnf2026 import read,norm,MAP,UNSAT_CODES,CNF_ZIP_URL

FDC_URL="https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip"
MACRO_FDC_CNF={"kcal":"208","protein_per_100g":"203","fat_per_100g":"204","carbs_per_100g":"205"}

def index_one(rows,key):
  pairs=defaultdict(list)
  for x in rows:pairs[x.get(key)].append(x)
  return pairs

def main():
  ap=argparse.ArgumentParser()
  for arg in ("cnf-zip","fdc-zip","blocked","output"):ap.add_argument("--"+arg,required=True)
  args=ap.parse_args()
  blocked=json.loads(Path(args.blocked).read_text())
  out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
  with zipfile.ZipFile(args.fdc_zip) as z:
    fdc_food=read(z,"food.csv")
    fdc_sr=read(z,"sr_legacy_food.csv")
  with zipfile.ZipFile(args.cnf_zip) as z:
    cnf_food=read(z,"Food_Name.csv")
    cnf_nutr=read(z,"Nutrient_Amount.csv")
    cnf_names=read(z,"Nutrient_Name.csv")
  fdcby=index_one(fdc_food,"fdc_id")
  srby=index_one(fdc_sr,"fdc_id")
  cnfby=index_one(cnf_food,"USDA_NDB_Code")
  cnfnames={x["Nutrient_Code"]:x for x in cnf_names}
  eligible={x["Food_Code"] for x in cnf_food if x["USDA_NDB_Code"]}
  cnfvals=defaultdict(dict)
  for x in cnf_nutr:
    if x["Food_Code"] in eligible:cnfvals[x["Food_Code"]][x["Nutrient_Code"]]=x
  candidates=[];checks=[]
  for p in blocked:
    src=p["primary_source"]
    if src["source_registry_id"]!="USDA_FDC":continue
    id=str(src["source_record_id"])
    rec={"family":p["family_key"],"fdc_id":id,"source_name":src["source_name"]}
    f=fdcby.get(id,[]);sr=srby.get(id,[])
    if len(f)!=1 or len(sr)!=1:
      rec["status"]="NOT_SR_LEGACY_OR_UNMATCHED_ID";checks.append(rec);continue
    ndb=sr[0].get("NDB_number","").zfill(5)
    rec["NDB_number"]=ndb
    cf=cnfby.get(ndb,[])
    if len(cf)!=1:
      rec["status"]="NO_UNIQUE_CNF_NDB_MATCH";rec["CNF_matches"]=len(cf);checks.append(rec);continue
    cnf=cf[0];code=cnf["Food_Code"];rec["cnf_food_code"]=code
    rec["cnf_food_name"]=cnf["Food_Description_EN"]
    rec["fdc_food_name"]=f[0].get("description")
    if not (norm(f[0].get("description"))==norm(src["source_name"])==norm(cnf["Food_Description_EN"])):
      rec["status"]="STRICT_FOOD_NAME_MISMATCH";checks.append(rec);continue
    # Re-measure across two published tables to catch stale or non-equivalent
    # USDA values even with a shared NDB identifier.
    parity=[]
    for field,cnfcode in MACRO_FDC_CNF.items():
      nrow=cnfvals[code].get(cnfcode)
      old=p["nutrients"].get(field)
      if nrow and old is not None:
        new=float(nrow["Nutrient_Amount"])
        maxdiff=max(1.0 if field=="kcal" else 0.3, abs(old)*0.05)
        if abs(new-old)>maxdiff:
          parity.append({"field":field,"fdc_value":old,"cnf_value":new,"difference":new-old})
    rec["macro_disagreements"]=parity
    if parity:
      rec["status"]="MACRO_VALUES_DIVERGE_REQUIRES_MANUAL_REVIEW"
      checks.append(rec);continue
    rec["status"]="EXACT_SOURCE_ID_NAME_AND_MACRO_PARITY"
    rec["found_missing_fields"]=[]
    for field,existing in p["nutrients"].items():
      if existing is not None:continue
      if field=="unsat":codes=list(UNSAT_CODES)
      elif field in MAP:codes=[MAP[field][0]]
      else:continue
      nrows=[cnfvals[code].get(k) for k in codes]
      if not all(x and x["Nutrient_Amount"].strip() for x in nrows):continue
      vv=[float(x["Nutrient_Amount"]) for x in nrows]
      if not all(math.isfinite(v) and v>=0 for v in vv):continue
      v=sum(vv)
      rec["found_missing_fields"].append(field)
      candidates.append({
        "family_key":p["family_key"],"field":field,
        "previous_value":None,"proposed_value":v,
        "method":"CALCULATED" if field=="unsat" else ("SOURCE_REPORTED_ZERO" if v==0 else "SOURCE_REPORTED"),
        "source_registry_id":"HEALTH_CANADA_CNF",
        "source_dataset":"Canadian Nutrient File 2026",
        "source_record_id":code,"source_name":cnf["Food_Description_EN"],
        "source_food_NDB_code":ndb,"source_fdc_SR_legacy_id":id,
        "source_nutrient_codes":codes,
        "source_nutrient_names":[cnfnames[k]["Nutrient_Name_EN"] for k in codes],
        "source_units":[cnfnames[k]["Nutrient_Unit"] for k in codes],
        "nutrient_source_codes":[x["Nutrient_Source_Code"] for x in nrows],
        "crosswalk":"exact_FDC_ID_NDB_ID_CNF_NAME_macro_parity",
        "source_url":CNF_ZIP_URL,
        "production_permission":"DENIED_PENDING_SCIENTIFIC_REVIEW"
      })
    checks.append(rec)
  report={
    "status":"EVIDENCE_ONLY_NOT_DEPLOYABLE",
    "fdc_primaries":sum(x["primary_source"]["source_registry_id"]=="USDA_FDC" for x in blocked),
    "source_match_statuses":dict(Counter(x["status"] for x in checks)),
    "fields_found":len(candidates),"field_counts":dict(Counter(x["field"] for x in candidates)),
    "families_newly_eligible":sorted({x["family_key"] for x in candidates}),
    "source_checks":checks,
    "production_products_modified":0,
  }
  (out/"usda_sr_cnf2026_crosswalk_report.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n")
  (out/"usda_sr_cnf2026_field_candidates.json").write_text(json.dumps(candidates,indent=2,ensure_ascii=False)+"\n")
  print("USDA_CNF_CROSSWALK_SUMMARY",json.dumps({k:v for k,v in report.items() if k!="source_checks"},ensure_ascii=False))
  for x in checks:print("USDA_CNF_IDENTITY",json.dumps(x,ensure_ascii=False))
  for x in candidates:print("USDA_CNF_FIELD",json.dumps({k:x[k] for k in ("family_key","field","proposed_value","source_record_id","source_food_NDB_code")},ensure_ascii=False))

if __name__=="__main__":main()
