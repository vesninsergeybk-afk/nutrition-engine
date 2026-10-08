#!/usr/bin/env python3
"""Source-bounded study of historical Fineli Release 16 for 56 foods.

Exact token-identity + proximate nutrient parity are mandatory before a donor
value is even proposed. Never auto-import from a historical archive or assume
that a numeric estimated value is analytically measured.
"""
from __future__ import annotations
import argparse,csv,json,math,re,unicodedata
from difflib import SequenceMatcher
from collections import Counter,defaultdict
from pathlib import Path

def rows(path):
  with open(path,encoding="utf-8",errors="replace",newline="") as f:return list(csv.DictReader(f,delimiter=";"))
def norm(s):
  s=unicodedata.normalize("NFKC",str(s or "")).casefold()
  s=re.sub(r"[^a-z0-9]+"," ",s)
  # Vocabulary-level changes restricted to grammatically duplicate ingredient labels.
  s=re.sub(r"\bspices?\b"," ",s)
  s=re.sub(r"\bvegetable\b"," ",s)
  s=re.sub(r"\bseeds?\b","seed",s)
  s=re.sub(r"\boils?\b","oil",s)
  s=re.sub(r"\bflours?\b","flour",s)
  return " ".join(s.split())
def words(s):return tuple(sorted(norm(s).split()))
def score(a,b):
  a,b=norm(a),norm(b);sa,sb=set(a.split()),set(b.split())
  return round(.6*(len(sa&sb)/len(sa|sb) if sa|sb else 0)+.4*SequenceMatcher(None,a,b).ratio(),4)
def num(v):
  if not isinstance(v,str):return None
  try:
    f=float(v.replace(",",".").strip())
    return f if math.isfinite(f) else None
  except (ValueError,TypeError):return None

MAP={"sugar_per_100g":"SUGAR","fiber_per_100g":"FIBC","vitamin_e_mg":"VITE",
   "vitamin_k_mcg":"VITK","vitamin_d_mcg":"VITD","vitamin_c_mg":"VITC",
   "selenium_ug":"SE","vitamin_a_mcg":"VITA","sfa":"FASAT","vitamin_b9_mcg":"FOL",
   "vitamin_b12_mcg":"VITB12"}
MACROS={"protein_per_100g":"PROT","fat_per_100g":"FAT"}
def main():
  p=argparse.ArgumentParser()
  for x in ("source","blocked","out"):p.add_argument("--"+x,required=True)
  a=p.parse_args();root=Path(a.source)
  blocked=json.loads(Path(a.blocked).read_text(encoding="utf-8"))
  names={r["FOODID"]:r["FOODNAME"] for r in rows(root/"foodname_EN.csv")}
  catalog={r["FOODID"]:r for r in rows(root/"food.csv")}
  values=defaultdict(dict)
  for r in rows(root/"component_value.csv"):
    values[r["FOODID"]][r["EUFDNAME"]]=r
  methods={r["THSCODE"]:r["DESCRIPT"] for r in rows(root/"methtype_EN.csv")}
  acquisitions={r["THSCODE"]:r["DESCRIPT"] for r in rows(root/"acqtype_EN.csv")}
  data=[];field_candidates=[]
  for p in blocked:
    q=p["primary_source"]["source_name"]
    ranked=sorted(names,key=lambda id:score(q,names[id]),reverse=True)
    considered=[]
    for id in ranked[:8]:
      similarity=score(q,names[id])
      if similarity<.45:continue
      exact=words(q)==words(names[id])
      vm=values[id]
      parity=[]
      for field,component in MACROS.items():
        reported=num(vm.get(component,{}).get("BESTLOC"))
        primary=p["nutrients"][field]
        if reported is None:continue
        parity.append({"field":field,"primary":primary,"donor":reported,
          "within_tolerance":abs(primary-reported)<=max(0.5,abs(primary)*.20)})
      good_macro=len(parity)==2 and all(x["within_tolerance"] for x in parity)
      obs=[]
      for field,component in MAP.items():
        if p["nutrients"].get(field) is not None:continue
        comp=vm.get(component)
        if not comp:continue
        v=num(comp.get("BESTLOC"))
        if v is None or v<0:continue
        item={
          "family":p["family_key"],
          "field":field,
          "value":v,"source_food_id":id,
          "source_name":names[id],
          "source_component":component,
          "acquisition_code":comp.get("ACQTYPE"),
          "acquisition_method":acquisitions.get(comp.get("ACQTYPE")),
          "method_code":comp.get("METHTYPE"),
          "method":methods.get(comp.get("METHTYPE")),
          "exact_canonical_tokens":exact,
          "macro_parity":good_macro,
          "source_date":"2014","source_mirror_commit":"98fbfd01e0e841ff707d52750437940429fab93d",
          "permission":"NEEDS_SCIENCE_REVIEW_NOT_IMPORTABLE"}
        obs.append(item)
        if exact and good_macro:field_candidates.append(item)
      considered.append({"id":id,"name":names[id],"score":similarity,
          "canonical_token_identity":exact,"parity":parity,"macro_parity":good_macro,
          "candidate_nutrients":obs})
    data.append({"family":p["family_key"],"primary_source":q,"donors":considered})
  report={"status":"HISTORICAL_MIRROR_EVIDENCE_ONLY",
      "source":"Fineli Release 16.0 (2014), CC BY 4.0",
      "publisher":"Finnish Institute for Health and Welfare (THL)",
      "food_count":len(names),"component_count":len(rows(root/"component.csv")),
      "foods_with_exact_token_matches":sum(any(d["canonical_token_identity"] for d in f["donors"]) for f in data),
      "candidate_fields_with_exact_names_and_macro_parity":len(field_candidates),
      "candidate_by_field":dict(Counter(x["field"] for x in field_candidates)),
      "source_candidates":field_candidates,"families":data,
      "runtime_modified":False}
  out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
  (out/"historical_fineli16_crosscheck.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
  print("FINELI16_SOURCE_MATCH_SUMMARY",json.dumps({k:v for k,v in report.items() if k not in ("source_candidates","families")},ensure_ascii=False))
  for x in field_candidates:print("FINELI16_REVIEW_FIELD",json.dumps(x,ensure_ascii=False))
  for x in data:
    matches=[d for d in x["donors"] if d["canonical_token_identity"]]
    if matches:print("FINELI16_EXACT_FOOD",json.dumps({"family":x["family"],"source":x["primary_source"],"matches":matches},ensure_ascii=False)[:4500])
if __name__=="__main__":main()
