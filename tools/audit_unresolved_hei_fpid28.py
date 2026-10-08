#!/usr/bin/env python3
"""Find *review candidates* for 28 unresolved HEI ingredient identities.

This report NEVER imports near matches. FPID 2017-2018 includes equivalent food
pattern contributions for exact foods/ingredients; selecting a different
species, processing state, or sweetened product is prohibited.
"""
import argparse,json,re,unicodedata
from pathlib import Path
from collections import Counter
from difflib import SequenceMatcher
import pandas as pd

def norm(s):
  s=unicodedata.normalize("NFKC",str(s or "")).casefold()
  return re.sub(r"\s+"," ",re.sub(r"[^a-z0-9]+"," ",s)).strip()

def value(x):
  try:return float(x) if not pd.isna(x) else 0
  except (ValueError,TypeError):return 0

FP_FIELDS=[
 "F_TOTAL (cup eq.)","F_JUICE (cup eq.)","V_TOTAL (cup eq.)",
 "V_DRKGR (cup eq.)","V_LEGUMES (cup eq.)","D_TOTAL (cup eq.)",
 "G_WHOLE (oz. eq.)","G_REFINED (oz. eq.)","PF_TOTAL (oz. eq.)",
 "PF_SEAFD_HI (oz. eq.)","PF_SEAFD_LOW (oz. eq.)","PF_SOY (oz. eq.)",
 "PF_NUTSDS (oz. eq.)","PF_LEGUMES (oz. eq.)","ADD_SUGARS (tsp. eq.)"
]
def hei(row):
  n={k:value(row.get(k)) for k in FP_FIELDS}
  return {
   "fruit_cup_eq_per_100g":n["F_TOTAL (cup eq.)"],
   "whole_fruit_cup_eq_per_100g":n["F_TOTAL (cup eq.)"]-n["F_JUICE (cup eq.)"],
   "veg_cup_eq_per_100g":n["V_TOTAL (cup eq.)"],
   "greens_beans_cup_eq_per_100g":n["V_DRKGR (cup eq.)"]+n["V_LEGUMES (cup eq.)"],
   "dairy_cup_eq_per_100g":n["D_TOTAL (cup eq.)"],
   "whole_grain_oz_eq_per_100g":n["G_WHOLE (oz. eq.)"],
   "refined_grain_oz_eq_per_100g":n["G_REFINED (oz. eq.)"],
   "protein_oz_eq_per_100g":n["PF_TOTAL (oz. eq.)"],
   "seafood_plant_oz_eq_per_100g":sum(n[x] for x in ("PF_SEAFD_HI (oz. eq.)","PF_SEAFD_LOW (oz. eq.)","PF_SOY (oz. eq.)","PF_NUTSDS (oz. eq.)","PF_LEGUMES (oz. eq.)")),
   "added_sugars_tsp_eq_per_100g":n["ADD_SUGARS (tsp. eq.)"]
  }
def similarity(a,b):
  a,b=norm(a),norm(b)
  ta,tb=set(a.split()),set(b.split())
  overlap=len(ta&tb)/len(ta|tb) if (ta|tb) else 0
  seq=SequenceMatcher(None,a,b).ratio()
  return 0.6*overlap +0.4*seq

def state_conflict(a,b):
  a,b=norm(a).split(),norm(b).split()
  opposites=[("raw","cooked"),("raw","boiled"),("raw","dried"),("fresh","dried"),
   ("dry","cooked"),("unsweetened","sweetened"),("low","high")]
  return any(x in a and y in b or y in a and x in b for x,y in opposites)

def main():
  ap=argparse.ArgumentParser()
  for x in ("blocked","fpid","output"):ap.add_argument("--"+x,required=True)
  a=ap.parse_args()
  props=json.loads(Path(a.blocked).read_text())
  df=pd.read_excel(a.fpid,sheet_name="FPID_1718",dtype=object)
  all_fpid=[]
  for _,r in df.iterrows():
    if pd.isna(r.get("DESCRIPTION")):continue
    desc=str(r["DESCRIPTION"])
    code=str(r.get("CODE"));code=code[:-2] if code.endswith(".0") else code
    all_fpid.append({"code":code,"description":desc,"hei":hei(r)})
  results=[]
  for p in props:
    if p.get("hei_equivalents") is not None:continue
    q=p["primary_source"]["source_name"]
    ranked=sorted(all_fpid,key=lambda x:similarity(q,x["description"]),reverse=True)
    suggestions=[]
    for x in ranked[:7]:
      item=dict(x)
      item["score"]=round(similarity(q,x["description"]),4)
      item["strict_normalized_exact"]=norm(q)==norm(x["description"])
      item["state_conflict_flag"]=state_conflict(q,x["description"])
      item["status"]="RESEARCH_SUGGESTION_NOT_IMPORTABLE"
      suggestions.append(item)
    results.append({"family_key":p["family_key"],"name_ru":p["name_ru_import"],
     "source_name":q,"source_id":p["primary_source"]["source_registry_id"]+":"+str(p["primary_source"]["source_record_id"]),
     "recommendations":suggestions,"true_exact_matches":sum(norm(q)==norm(x["description"]) for x in all_fpid),
     "source_hei_status":"UNRESOLVED_UNTIL_INDEPENDENT_REVIEW"})
  assert len(results)==28,len(results)
  report={"status":"RESEARCH_SUGGESTIONS_ONLY_NO_HEI_NUMBERS_IMPORTED","official_dataset":"USDA FPID 2017-2018",
    "official_url":"https://www.ars.usda.gov/ARSUserFiles/80400530/apps/FPID_1718.xls",
    "unresolved_source_records":28,"food_pattern_records_available":len(all_fpid),
    "exact_name_matches":sum(x["true_exact_matches"]>0 for x in results),
    "foods":results,"runtime_mutation":False}
  out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
  (out/"fpid28_match_candidates.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
  print("FPID_28_SUMMARY",json.dumps({k:v for k,v in report.items() if k!="foods"},ensure_ascii=False))
  for p in results:
    print("FPID_MATCH",json.dumps({"family":p["family_key"],"source_name":p["source_name"],
    "exact":p["true_exact_matches"],"top3":[
    {"description":x["description"],"code":x["code"],"score":x["score"],
     "state_conflict":x["state_conflict_flag"],"hei":x["hei"]} for x in p["recommendations"][:3]]
    },ensure_ascii=False))

if __name__=="__main__":main()
