#!/usr/bin/env python3
"""Conservative exact-record missing-field lookup in Health Canada's CNF 2026.

This is EVIDENCE ONLY. It deliberately does not edit product cards or assign
HEI food-pattern equivalents. A candidate is proposed only if Food_Code and
food identity both match the selected original source profile. Official zeros
are SOURCE_REPORTED_ZERO (not assumed); missing stays null.
"""
from __future__ import annotations
import argparse,csv,io,json,math,re,unicodedata,zipfile
from collections import Counter,defaultdict
from pathlib import Path

CNF_ZIP_URL="https://open.canada.ca/data/dataset/1b6139bd-ed7e-4043-bc28-ff00e10f3109/resource/019f2a90-e3a9-489d-b6e1-f74f4ba1d006/download/cnf_fcen_all-files-data_2026.zip"
# Code, expected English keyword in official nutrient_name, expected units
MAP={
 "choline_mg":("421",("choline",),"milligram"),
 "vitamin_k_mcg":("430",("vitamin k",),"microgram"),
 "sugar_per_100g":("269",("sugars","total"),"gram"),
 "vitamin_e_mg":("323",("vitamin e",),"milligram"),
 "vitamin_b5_mg":("410",("pantothenic",),"milligram"),
 "selenium_ug":("317",("selenium",),"microgram"),
 "manganese_mg":("315",("manganese",),"milligram"),
 "vitamin_c_mg":("401",("vitamin c",),"milligram"),
 "vitamin_d_mcg":("328",("vitamin d",),"microgram"),
 "vitamin_b9_mcg":("417",("folate","total"),"microgram"),
 "fiber_per_100g":("291",("fibre",),"gram"),
 "vitamin_a_mcg":("320",("vitamin a",),"microgram"),
 "copper_mg":("312",("copper",),"milligram"),
 "sfa":("606",("saturated","total"),"gram"),
 "vitamin_b12_mcg":("418",("vitamin b-12",),"microgram"),
 "vitamin_b2_mg":("405",("riboflavin",),"milligram"),
}
UNSAT_CODES=("645","646")
def norm(s):
  s=unicodedata.normalize("NFKC",str(s or "")).casefold().replace("ё","е")
  return re.sub(r"\s+"," ",re.sub(r"[^\w]+"," ",s)).strip()

def read(z,part):
  m=next((x for x in z.namelist() if Path(x).name.lower()==part.lower()),None)
  if m is None:raise ValueError("CNF archive missing "+part)
  raw=z.read(m).decode("utf-8-sig")
  return list(csv.DictReader(io.StringIO(raw)))

def main():
  ap=argparse.ArgumentParser()
  for k in ("zip","blocked","output"):ap.add_argument("--"+k,required=True)
  a=ap.parse_args()
  blocked=json.loads(Path(a.blocked).read_text(encoding="utf-8"))
  out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
  with zipfile.ZipFile(a.zip) as z:
    food=read(z,"Food_Name.csv"); nutr=read(z,"Nutrient_Amount.csv"); names=read(z,"Nutrient_Name.csv")
  food_by_id={x["Food_Code"]:x for x in food}
  name_by_code={x["Nutrient_Code"]:x for x in names}
  wanted_ids={str(p["primary_source"]["source_record_id"]) for p in blocked if p["primary_source"]["source_registry_id"]=="HEALTH_CANADA_CNF"}
  vals={id:{} for id in wanted_ids}
  for x in nutr:
    id=x["Food_Code"]
    if id in vals:
      vals[id][x["Nutrient_Code"]]=x
  # Name / unit safeguards; no shorthand code silently accepted when it refers
  # to a different analyte, older dietary equivalent or IU.
  defects=[]
  for k,(c,words,unit) in MAP.items():
    row=name_by_code.get(c)
    if not row:
      defects.append("ABSENT_NUTRIENT_CODE:"+k+":"+c);continue
    desc=norm(row.get("Nutrient_Name_EN"))
    if not all(norm(w) in desc for w in words) or norm(unit) not in norm(row.get("Nutrient_Unit")):
      defects.append("NAME_OR_UNIT_MISMATCH:"+k+":"+c+":"+str(row))
  assert not defects, "\n".join(defects)
  matched=[];blocked_name=[];missing_codes=[];fills=[]
  for p in blocked:
    src=p["primary_source"]
    if src["source_registry_id"]!="HEALTH_CANADA_CNF":continue
    id=str(src["source_record_id"]); row=food_by_id.get(id)
    if row is None:
      blocked_name.append({"family":p["family_key"],"reason":"ID_NOT_FOUND_2026","id":id});continue
    if norm(row["Food_Description_EN"])!=norm(src["source_name"]):
      blocked_name.append({"family":p["family_key"],"reason":"NAME_DRIFT","id":id,
                           "previous_name":src["source_name"],"cnf2026_name":row["Food_Description_EN"]});continue
    matched.append(p["family_key"])
    for field in [f for f,v in p["nutrients"].items() if v is None]:
      if field=="unsat":
        source_fields=UNSAT_CODES
      elif field in MAP:
        source_fields=(MAP[field][0],)
      else:
        missing_codes.append({"family":p["family_key"],"field":field,"reason":"NO_VALIDATED_MAPPING"});continue
      srcrows=[vals[id].get(code) for code in source_fields]
      if any(x is None or str(x["Nutrient_Amount"]).strip()=="" for x in srcrows):
        missing_codes.append({"family":p["family_key"],"field":field,"reason":"NO_REPORTED_VALUE_2026"});continue
      vv=[float(x["Nutrient_Amount"]) for x in srcrows]
      if not all(math.isfinite(x) and x>=0 for x in vv):
        missing_codes.append({"family":p["family_key"],"field":field,"reason":"NONFINITE_OR_NEGATIVE"});continue
      v=sum(vv)
      # Do not inject values: only emit scientific review candidates.
      fills.append({
        "family_key":p["family_key"],"field":field,
        "previous_value":None,"proposed_value":v,
        "proposed_method":"CALCULATED" if field=="unsat" else ("SOURCE_REPORTED_ZERO" if v==0 else "SOURCE_REPORTED"),
        "source_registry_id":"HEALTH_CANADA_CNF","source_dataset":"CNF 2026",
        "source_record_id":id,"source_name":row["Food_Description_EN"],
        "source_nutrient_codes":list(source_fields),
        "source_nutrient_name": [name_by_code[x]["Nutrient_Name_EN"] for x in source_fields],
        "unit": [name_by_code[x]["Nutrient_Unit"] for x in source_fields],
        "source_nutrient_metadata":[{
          "Nutrient_Source_Code":x["Nutrient_Source_Code"],
          "Nutrient_Last_Updated_Date":x["Nutrient_Last_Updated_Date"]
        } for x in srcrows],
        "source_url":CNF_ZIP_URL,
        "release_note":"candidate_verified_record_identity_not_cross_dataset_import"
      })
  counts=Counter(f["field"] for f in fills)
  report={
   "status":"MATCHED_FIELD_CANDIDATES_ONLY_NOT_APPROVED_FOR_IMPORT",
   "source_dataset":"Health Canada Canadian Nutrient File 2026",
   "primary_records":len(wanted_ids),"exact_food_identity_matches":len(matched),
   "identity_mismatch_records":blocked_name,
   "fields_newly_found":len(fills),"fields_by_name":dict(counts.most_common()),
   "unavailable_fields":missing_codes,
   "remaining_nulls_in_all_56_if_approved":179-len(fills),
   "scientific_approval_required":True,
   "new_runtime_products":0,"existing_products_modified":0
  }
  (out/"cnf2026_exact_record_recovery_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
  (out/"cnf2026_exact_record_field_candidates.json").write_text(json.dumps(fills,ensure_ascii=False,indent=2)+"\n")
  print("CNF_RECOVERY_SUMMARY",json.dumps({
    k:v for k,v in report.items() if k not in ("unavailable_fields","identity_mismatch_records")
  },ensure_ascii=False))
  for x in blocked_name:print("CNF_NAME_REVIEW",json.dumps(x,ensure_ascii=False))
  for x in fills:print("CNF_FIELD_CANDIDATE",json.dumps({
    k:x[k] for k in ("family_key","field","proposed_value","source_record_id","source_nutrient_codes")
  },ensure_ascii=False))
  for x in missing_codes:print("CNF_STILL_MISSING",json.dumps(x,ensure_ascii=False))

if __name__=="__main__":main()
