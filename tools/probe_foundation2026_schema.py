#!/usr/bin/env python3
"""Audit possible exact scientific matches in USDA Foundation Foods April 2026.

No food source switching without identity, state and nutrient parity review.
"""
import argparse,json,zipfile
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
  out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
  (out/"fdc_foundation2026_schema.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
  print("FOUNDATION_SCHEMA",json.dumps(report,ensure_ascii=False)[:7000])
if __name__=="__main__":main()
