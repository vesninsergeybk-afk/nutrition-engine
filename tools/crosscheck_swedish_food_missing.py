#!/usr/bin/env python3
"""Direct Swedish national 2026 API nutritional crosswalk for 56 research foods.

This is read-only. A value is proposed only for a matching food identity and
only when the nutrient code, per-100g unit and official provenance are known.
No candidate is imported automatically, especially reportable zeros.
"""
import argparse,json,re,requests,unicodedata,math,time
from concurrent.futures import ThreadPoolExecutor,as_completed
from pathlib import Path
from collections import Counter
from difflib import SequenceMatcher

BASE="https://dataportal.livsmedelsverket.se/livsmedel/api/v1"
FIELDS={
 "choline_mg":(("CHOLN","CHLON"),"mg"),
 "vitamin_k_mcg":(("VITK","VITK1","PHYLLO"),"µg"),
 "vitamin_e_mg":(("VITE",),"mg"),
 "vitamin_b5_mg":(("PANTAC", "PANTOT"),"mg"),
 "selenium_ug":(("SE",),"µg"),
 "vitamin_b9_mcg":(("FOL","FOLT"),"µg"),
 "vitamin_b12_mcg":(("VITB12",),"µg"),
 "vitamin_c_mg":(("VITC",),"mg"),
 "sugar_per_100g":(("SUGAR","SUGART"),"g"),
 "fiber_per_100g":(("FIBT","FIBC"),"g"),
 "manganese_mg":(("MN",),"mg"),
 "copper_mg":(("CU",),"mg"),
 "vitamin_a_mcg":(("VITA","VITARE"),"µg"),
 "vitamin_d_mcg":(("VITD",),"µg"),
 "vitamin_b2_mg":(("RIBF",),"mg"),
 "sfa":(("FASAT",),"g"),
 "unsat":(("FAMS","FAPU","FAMSCIS"),"g"),
}
def canon(text):
 s=unicodedata.normalize("NFKD",str(text or "").lower())
 s="".join(c for c in s if not unicodedata.combining(c))
 s=s.replace("garbanzo","chickpea").replace("besan","chickpea").replace("spices","").replace("spice","")
 s=s.replace("ground","").replace("seeds","seed").replace("flours","flour")
 s=re.sub(r"[^a-z0-9]+"," ",s)
 return " ".join(s.split())
def sim(x,y):
 x=canon(x);y=canon(y);a=set(x.split());b=set(y.split())
 return round(.66*len(a&b)/len(a|b)+.34*SequenceMatcher(None,x,y).ratio(),4) if a|b else 0
def same(x,y):return sorted(canon(x).split())==sorted(canon(y).split())
def conflict(a,b):
 a=set(canon(a).split());b=set(canon(b).split())
 for p,q in (("raw","cooked"),("fresh","dried"),("raw","dried"),("dry","cooked"),
 ("canned","dry"),("whole","refined"),("low","high"),("creamed","flaked"),("milk","sauce")):
  if (p in a and q in b) or (q in a and p in b):return p+"/"+q
 return ""
def request(path):
 r=requests.get(BASE+path,timeout=24,headers={"Accept":"application/json"})
 r.raise_for_status();return r.json()
def main():
 p=argparse.ArgumentParser()
 for k in ("blocked","out"):p.add_argument("--"+k,required=True)
 a=p.parse_args()
 targets=json.loads(Path(a.blocked).read_text())
 page=request("/livsmedel?offset=0&limit=2500&sprak=2")
 assert isinstance(page,dict) and "livsmedel" in page,page
 count=page["_meta"]["totalRecords"]
 foods=page["livsmedel"]
 for offset in range(2500,count,2500):
  foods+=request("/livsmedel?offset="+str(offset)+"&limit=2500&sprak=2")["livsmedel"]
 assert len(foods)==count,(len(foods),count)
 per_target=[];needed_ids=set()
 for t in targets:
  name=t["primary_source"]["source_name"]
  best=sorted(foods,key=lambda f:sim(name,f["namn"]),reverse=True)[:7]
  matches=[]
  for f in best:
   s=sim(name,f["namn"]); exact=same(name,f["namn"])
   if s<0.59 and not exact:continue
   ident={"id":f["nummer"],"name":f["namn"],"food_type":f.get("livsmedelsTyp"),
          "scientific_name":f.get("vetenskapligtNamn"),"version":f.get("version"),
          "similarity":s,"canonical_exact":exact,
          "state_issue":conflict(name,f["namn"])}
   matches.append(ident)
   if s>.71 or exact:needed_ids.add(f["nummer"])
  per_target.append({"family":t["family_key"],"source_name":name,"missing_fields":[k for k,v in t["nutrients"].items() if v is None],"matches":matches})
 data={}
 def fetch(n):
  try:return n,request("/livsmedel/"+str(n)+"/naringsvarden?sprak=2")
  except Exception as e:return n,{"error":str(e)}
 with ThreadPoolExecutor(max_workers=6) as pool:
  for n,v in pool.map(fetch,sorted(needed_ids)):data[n]=v
 print("SWEDEN_NUTRIENT_FOOD_FETCHED",len(data),"of",len(foods))
 results=[];observations=[];all_codes={}
 for t,tinfo in zip(targets,per_target):
  for x in tinfo["matches"]:
   if x["id"] not in data:continue
   val=data[x["id"]]
   if not isinstance(val,list):
    x["error"]=str(val)[:250];continue
   lut={str(v.get("euroFIRkod") or v.get("forkortning") or "").upper():v for v in val}
   for k,v in lut.items():all_codes[k]=v.get("namn")
   pr=lut.get("PROT");ft=lut.get("FAT")
   macros=[]
   for code,field,row in (("PROT","protein_per_100g",pr),("FAT","fat_per_100g",ft)):
    if row is not None and isinstance(row.get("varde"),(int,float)):
     original=t["nutrients"].get(field);donor=row["varde"]
     macros.append({"field":field,"source":original,"donor":donor,
        "parity":abs(original-donor)<=max(.5,.18*original)})
   parity=len(macros)==2 and all(z["parity"] for z in macros)
   x["macro"]=macros
   x["macro_parity"]=parity
   x["missing_values"]=[]
   for field in tinfo["missing_fields"]:
    spec=FIELDS.get(field)
    if spec is None:continue
    aliases,unit=spec
    hits=[lut[c] for c in aliases if c in lut and lut[c].get("enhet")==unit and lut[c].get("matrisenhetkod")=="W"]
    if len(hits)!=1:continue
    n=hits[0];v=n.get("varde")
    if not isinstance(v,(int,float)) or v<0 or not math.isfinite(v):continue
    source_details={k:n.get(k) for k in ("namn","euroFIRkod","varde","enhet","viktGram","vardetyp","vardetypkod","ursprung","ursprungkod","publikation","metodtyp","metodtypkod","metodindikator","metodindikatorkod")}
    eligible=(x["canonical_exact"] and parity and not x["state_issue"])
    status="IDENTITY_VERIFIED_REFERENCE_REVIEW" if eligible else "CANDIDATE_NOT_IDENTICAL_OR_MACRO_DIFF"
    observation={"family_key":t["family_key"],"field":field,"value":v,
          "reference_primary_source":t["primary_source"],"donor_food":x["name"],
          "donor_food_id":x["id"],"donor_profile_type":x["food_type"],
          "donor_scientific_name":x["scientific_name"],
          "canonical_exact":x["canonical_exact"],"macro_parity":parity,
          "identity_concerns":x["state_issue"],"nutrient_provenance":source_details,
          "status":status}
    observations.append(observation);x["missing_values"].append(observation)
   results.append(x)
 report={
   "status":"OFFICIAL_SWEDEN_FOOD_CROSSWALK_RESEARCH_ONLY",
   "api":BASE,"swedish_foods":len(foods),"families":len(targets),
   "matched_api_food_ids_fetched":len(data),
   "total_gap_candidate_observations":len(observations),
   "strict_food_identity_gap_observations":sum(x["status"]=="IDENTITY_VERIFIED_REFERENCE_REVIEW" for x in observations),
   "strict_by_field":dict(Counter(x["field"] for x in observations if x["status"]=="IDENTITY_VERIFIED_REFERENCE_REVIEW")),
   "available_nutrient_codes":all_codes,
   "scientific_candidates":observations,
   "target_foods":per_target,"staging_updates":0,"production_updates":0}
 out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
 (out/"sweden2026_exact_food_gap_evidence.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
 print("SWEDEN_GAP_SUMMARY",json.dumps({k:v for k,v in report.items() if k not in ("available_nutrient_codes","scientific_candidates","target_foods")},ensure_ascii=False))
 print("SWEDEN_CODES",json.dumps(all_codes,ensure_ascii=False))
 for row in observations:
  if row["status"]=="IDENTITY_VERIFIED_REFERENCE_REVIEW":
   print("SWEDEN_MATCHED_NUTRIENT",json.dumps(row,ensure_ascii=False))
 for t in per_target:
  if t["matches"]:print("SWEDEN_IDENTITY",json.dumps({"family":t["family"],"name":t["source_name"],
       "donors":[{"id":x["id"],"name":x["name"],"score":x["similarity"],"exact":x["canonical_exact"],"macro_parity":x.get("macro_parity")} for x in t["matches"]]},ensure_ascii=False))
if __name__=="__main__":main()
