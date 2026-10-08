#!/usr/bin/env python3
"""Inspect historical Fineli Release 16 source schema for nutrient enrichment.

This dataset is a historical CC-BY 4.0 mirror and MUST NOT be represented as a
current official release. Only research provenance, no production writes.
"""
import argparse,csv,json
from pathlib import Path

def rows(path):
    with open(path,encoding="utf-8-sig",errors="replace",newline="") as fp:
      return list(csv.DictReader(fp,delimiter=";"))
def main():
  parser=argparse.ArgumentParser()
  for arg in ("source","out"):parser.add_argument("--"+arg,required=True)
  a=parser.parse_args()
  root=Path(a.source)
  summary={"source":"Fineli 16.0 (2014) via publicly archived mirror","license":"CC BY 4.0",
           "status":"SCHEMA_INSPECTION_ONLY","tables":[]}
  for name in ("foodname_EN.csv","food.csv","component.csv","component_value.csv","eufdname_EN.csv","descript.txt"):
    if name.endswith(".txt"):
      data=(root/name).read_text(encoding="utf-8",errors="replace")
      item={"file":name,"description_sample":data[:600]}
    else:
      data=rows(root/name)
      item={"file":name,"records":len(data),
            "columns":list(data[0]) if data else [],
            "sample":data[:5]}
    summary["tables"].append(item)
    print("FINELI_TABLE",json.dumps(item,ensure_ascii=False)[:4800])
  out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
  (out/"fineli16_schema_and_source_metadata.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
if __name__=="__main__":main()
