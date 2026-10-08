#!/usr/bin/env python3
"""Inspect FSANZ AFCD Release 3 (Dec 2025) Excel source structure.

This script only extracts the schema and scientifically relevant provenance
metadata. No raw source values imported into product catalog.
"""
from __future__ import annotations
import argparse,json
from pathlib import Path
from openpyxl import load_workbook

def inspect(name,filepath):
  book=load_workbook(filepath,read_only=True,data_only=True)
  tabs=[]
  for ws in book:
    head=[]
    for vals in ws.iter_rows(min_row=1,max_row=min(ws.max_row,15),values_only=True):
      head.append([v for v in vals[:min(ws.max_column,24)]])
    tabs.append({"sheet":ws.title,"rows":ws.max_row,"columns":ws.max_column,"first15_rows":head})
  return {"filename":name,"tabs":tabs}

def main():
  p=argparse.ArgumentParser()
  for k in ("foods","nutrients","details","out"):p.add_argument("--"+k,required=True)
  a=p.parse_args()
  inputs={"food_details":a.foods,"nutrient_profiles":a.nutrients,"nutrient_details":a.details}
  results={}
  for k,path in inputs.items():
    results[k]=inspect(k,path)
    print("AFCD_DATASET",k,"TABS",json.dumps([{x:y for x,y in t.items() if x!="first15_rows"} for t in results[k]["tabs"]],ensure_ascii=False))
    for t in results[k]["tabs"]:
      print("AFCD_SCHEMA",json.dumps({"dataset":k,"sheet":t["sheet"],"preview":t["first15_rows"][:7]},ensure_ascii=False,default=str)[:12000])
  out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
  (out/"afcd2025_schema.json").write_text(json.dumps(results,ensure_ascii=False,indent=2,default=str)+"\n")
if __name__=="__main__":main()
