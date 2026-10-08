#!/usr/bin/env python3
"""Audit possible exact scientific matches in USDA Foundation Foods April 2026.

No food source switching without identity, state and nutrient parity review.
"""
import argparse,json,zipfile,re,unicodedata
from collections import defaultdict,Counter
from pathlib import Path

def main():
  ap=argparse.ArgumentParser()
  for x in ("zip","blocked","output"):ap.add_argument("--"+x,required=True)
  a=ap.parse_args()
  z=zipfile.ZipFile(a.zip);names=z.namelist()
  report={"source":"USDA Foundation Foods 2026-04-30","archive_files":names,"samples":[],"matches":[],"status":"SOURCE_INSPECTION_ONLY"}
  for n in names:
    if not n.lower().endswith(".json"):continue
    obj=json.loads(z.read(n))
    report["root_type"]=type(obj).__name__
    if isinstance(obj,dict):
      report["root_keys"]=list(obj)
      for k,v in obj.items():
        if isinstance(v,list) and v:
          report["candidate_root_array"]=k
          report["total_records"]=len(v)
          report["samples"]=[{
            "keys":list(x)[:35],
            "description":x.get("description"),
            "fdcId":x.get("fdcId"),
            "dataType":x.get("dataType"),
            "foodNutrients_sample":x.get("foodNutrients",[])[:1],
          } for x in v[:3] if isinstance(x,dict)]
          break
    elif isinstance(obj,list):
      report["total_records"]=len(obj)
      report["samples"]=[{"keys":list(x)[:35],"description":x.get("description"),"fdcId":x.get("fdcId")} for x in obj[:3] if isinstance(x,dict)]
  obj=json.loads(z.read(next(n for n in names if n.lower().endswith(".json"))))
  foods=obj["FoundationFoods"]
  def norm(s):
    s=unicodedata.normalize("NFKC",str(s or "")).casefold()
    return re.sub(r"\s+"," ",re.sub(r"[^a-z0-9]+"," ",s)).strip()
  by_name=defaultdict(list)
  for f in foods: by_name[norm(f["description"])].append(f)
  blocked=json.loads(Path(a.blocked).read_text())
  candidates=[]
  identity=[]
  for p in blocked:
    q=p["primary_source"]["source_name"]
    xs=by_name.get(norm(q),[])
    if len(xs)!=1:continue
    source=xs[0]
    nut={str(v["nutrient"].get("number")):v for v in source.get("foodNutrients",[]) if v.get("nutrient")}
    macros={"kcal":"208","protein_per_100g":"203","fat_per_100g":"204","carbs_per_100g":"205"}
    deltas=[]
    for field,code in macros.items():
      record=nut.get(code)
      if record and record.get("amount") is not None and p["nutrients"].get(field) is not None:
        v=float(record["amount"]);old=p["nutrients"][field]
        if abs(v-old)>max(1.0 if field=="kcal" else 0.3,old*.05):
          deltas.append({"field":field,"old":old,"foundation":v})
    identity.append({"family":p["family_key"],"description":q,
      "foundation_fdcId":source["fdcId"],"macro_differences":deltas})
    if deltas:continue
    # The values are suggestions from a different source release, not updates
    # to the product. Review analyte identity, units and measurement methods.
    for field,(code,_,_) in __import__("recover_external_food_from_cnf2026").MAP.items():
      if p["nutrients"].get(field) is not None:continue
      v=nut.get(code)
      if not v or v.get("amount") is None:continue
      candidates.append({"family_key":p["family_key"],"field":field,
       "proposed_value":float(v["amount"]),"foundation_fdcId":source["fdcId"],
       "source_nutrient_number":code,"source_nutrient_name":v["nutrient"]["name"],
       "source_unit":v["nutrient"]["unitName"],
       "source_nutrient_derivation":v.get("foodNutrientDerivation"),
       "status":"RESEARCH_DONOR_REVIEW_REQUIRED"})
  report["exact_description_matches"]=identity
  report["candidate_missing_fields"]=candidates
  report["candidate_count"]=len(candidates)
  out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
  (out/"fdc_foundation2026_schema.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
  print("FOUNDATION_SCHEMA",json.dumps({k:v for k,v in report.items() if k not in ("candidate_missing_fields","exact_description_matches")},ensure_ascii=False)[:7000])
  print("FOUNDATION_56_EXACT",json.dumps(identity,ensure_ascii=False)[:11000])
  print("FOUNDATION_FIELD_CANDIDATES",json.dumps(candidates,ensure_ascii=False)[:7000])
if __name__=="__main__":main()
