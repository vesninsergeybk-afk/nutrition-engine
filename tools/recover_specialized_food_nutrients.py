#!/usr/bin/env python3
"""USDA Choline Release 2 (2008): exact NDB-ID crosswalk for 56 nutrient gaps.

Never substitutes betaine for choline; uses nutrient code 421 (total choline),
not the sum of all six measurements. All proposals remain staging-only.
"""
from __future__ import annotations
import argparse,csv,io,json,math,zipfile,re,unicodedata
from collections import Counter,defaultdict
from pathlib import Path

def records(z,filename):
  member=next(x for x in z.namelist() if Path(x).name.lower()==filename.lower())
  return list(csv.DictReader(io.StringIO(z.read(member).decode("utf-8-sig"))))
def fixed_ascii(z,filename):
  text=z.read(filename).decode("latin-1").splitlines()
  return [[x.strip().strip("~").strip() for x in line.split("^")] for line in text if line.strip()]
def norm(s):
  s=unicodedata.normalize("NFKC",str(s or "")).casefold()
  return re.sub(r"\s+"," ",re.sub(r"[^a-z0-9]+"," ",s)).strip()

def main():
  ap=argparse.ArgumentParser()
  for x in ("choline-zip","legacy-zip","cnf-zip","blocked","output"):ap.add_argument("--"+x,required=True)
  a=ap.parse_args()
  blocked=json.loads(Path(a.blocked).read_text(encoding="utf-8"))
  with zipfile.ZipFile(a.choline_zip) as z:
    ch_food=fixed_ascii(z,"FOOD_DES.txt")
    ch_nutr=fixed_ascii(z,"NUT_DATA.txt")
    definitions=fixed_ascii(z,"NUTR_DEF.txt")
  assert any(x[:2]==["421","Total Choline"] for x in definitions),definitions
  name={x[0].zfill(5):x[-1] for x in ch_food if len(x)==3}
  choline_by_ndb={}
  for row in ch_nutr:
    if len(row)<3 or row[1]!="421":continue
    code=row[0].zfill(5)
    val=float(row[2])
    assert code not in choline_by_ndb and math.isfinite(val) and val>=0
    choline_by_ndb[code]=val

  with zipfile.ZipFile(a.legacy_zip) as z:
    fdc_food={x["fdc_id"]:x for x in records(z,"food.csv")}
    legacy={x["fdc_id"]:x for x in records(z,"sr_legacy_food.csv")}
  with zipfile.ZipFile(a.cnf_zip) as z:
    cnf_food={x["Food_Code"]:x for x in records(z,"Food_Name.csv")}
  out=Path(a.output);out.mkdir(exist_ok=True,parents=True)
  candidates=[];identity=[]
  for p in blocked:
    if p["nutrients"].get("choline_mg") is not None:continue
    src=p["primary_source"];rid=str(src["source_record_id"])
    kind=src["source_registry_id"]
    rec={"family":p["family_key"],"source":kind+":"+rid,"source_name":src["source_name"]}
    if kind=="USDA_FDC":
      donor=legacy.get(rid)
      if not donor:
        rec["status"]="NOT_SR_LEGACY";identity.append(rec);continue
      ndb=donor["NDB_number"].zfill(5)
      source_name=fdc_food[rid]["description"]
    elif kind=="HEALTH_CANADA_CNF":
      donor=cnf_food.get(rid)
      if not donor:
        rec["status"]="CNF_ROW_NOT_FOUND";identity.append(rec);continue
      ndb=donor["USDA_NDB_Code"].zfill(5)
      source_name=donor["Food_Description_EN"]
      rec["cnf_source_code"]=donor["Food_Source_Code"]
    else:
      rec["status"]="GERMANY_BLS_NO_NDB_CROSSWALK";identity.append(rec);continue
    rec["ndb"]=ndb
    rec["reported_name"]=source_name
    if not ndb.strip("0"):
      rec["status"]="NO_NDB_CODE";identity.append(rec);continue
    if ndb not in name:
      rec["status"]="CHOLINE_DB_FOOD_ID_ABSENT";identity.append(rec);continue
    rec["choline_db_food_name"]=name[ndb]
    val=choline_by_ndb.get(ndb)
    if val is None:
      rec["status"]="CHOLINE_VALUE_MISSING";identity.append(rec);continue
    rec["value_mg_per_100g"]=val
    exact=norm(name[ndb])==norm(source_name)
    rec["normalized_name_exact"]=exact
    rec["status"]="SAME_NDB_AND_NAME_EXACT" if exact else "SAME_NDB_NAME_DIFF_REVIEW"
    rec["needs_review"]=not exact
    candidates.append({
      "family_key":p["family_key"],"field":"choline_mg",
      "previous_value":None,"proposed_value":val,
      "method":"SOURCE_REPORTED_ZERO" if val==0 else "SOURCE_REPORTED",
      "source_registry_id":"USDA_CHOLINE_R2",
      "source_dataset":"USDA Database for the Choline Content of Common Foods Release 2 (2008)",
      "source_record_id":ndb,
      "source_nutrient_code":"421",
      "source_nutrient_name":"Total Choline",
      "source_unit":"mg / 100 g",
      "reference_primary_source":kind+":"+rid,
      "reference_primary_source_name":source_name,
      "choline_db_name":name[ndb],
      "identity_validation":rec["status"],
      "provenance":"same_NDB_number_crosswalk",
      "source_url":"https://agdatacommons.nal.usda.gov/articles/dataset/USDA_Database_for_the_Choline_Content_of_Common_Foods_Release_2_2008_/24660123",
      "status":"EVIDENCE_ONLY_NEEDS_INDEPENDENT_REVIEW",
    })
    identity.append(rec)
  report={
    "status":"NDB_CROSSWALK_STAGE_ONLY",
    "needed_choline_count":sum(p["nutrients"]["choline_mg"] is None for p in blocked),
    "choline_foods":len(name),"choline_amounts":len(choline_by_ndb),
    "crosswalk_candidates":len(candidates),
    "exact_names":sum(c["identity_validation"]=="SAME_NDB_AND_NAME_EXACT" for c in candidates),
    "name_review":sum(c["identity_validation"]=="SAME_NDB_NAME_DIFF_REVIEW" for c in candidates),
    "source_status_counts":dict(Counter(x["status"] for x in identity)),
    "candidates":candidates,
    "identity_checks":identity,
    "production_changes":0}
  (out/"usda_choline_release2_recovery.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
  print("CHOLINE_56_SUMMARY",json.dumps({k:v for k,v in report.items() if k not in ("candidates","identity_checks")},ensure_ascii=False))
  for x in identity:print("CHOLINE_IDENTITY",json.dumps(x,ensure_ascii=False))
if __name__=="__main__":main()
