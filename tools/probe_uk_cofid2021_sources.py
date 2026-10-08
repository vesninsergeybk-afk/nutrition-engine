#!/usr/bin/env python3
"""Inspect UK CoFID 2021 workbook for possible exact state food matches.

Unknown codes N, Tr and gap are not converted to numeric zeros.
Do not import food data or even mark a candidate verified from text similarity.
"""
from __future__ import annotations
import argparse, json,re,unicodedata
from openpyxl import load_workbook
from pathlib import Path

def norm(s):
    s=unicodedata.normalize("NFKC",str(s or "")).casefold()
    return re.sub(r"\s+"," ",re.sub(r"[^a-z0-9]+"," ",s)).strip()

def main():
    ap=argparse.ArgumentParser()
    for x in ("xlsx","blocked","out-dir"):ap.add_argument("--"+x,required=True)
    a=ap.parse_args()
    blocked=json.loads(Path(a.blocked).read_text())
    wb=load_workbook(a.xlsx,read_only=True,data_only=True)
    out=Path(a.out_dir);out.mkdir(parents=True,exist_ok=True)
    sheet_audits=[]
    for ws in wb:
      top=list(ws.iter_rows(min_row=1,max_row=8,values_only=True))
      sheet_audits.append({
          "title":ws.title,"rows":ws.max_row,"cols":ws.max_column,
          "header_preview":[list(x[:14]) for x in top],
          "potential_source_match_lines":[]
      })
    # CoFID generally stores food name in the first column (A) or second
    # descriptor and values in consistent food-code rows across sheets.
    # Here we only collect possible exact text identities, never nutrient values.
    wanted={p["family_key"]:norm(p["primary_source"]["source_name"]) for p in blocked}
    target_foods=set(wanted.values())
    exact_matches=[]
    for ws in wb:
      if ws.title.lower() not in ("proximates","vitamins","inorganics"):continue
      for row in ws.iter_rows(min_row=4,values_only=True):
        texts=[norm(x) for x in row[:6] if isinstance(x,str) and len(x)<220]
        for fk,q in wanted.items():
          if q and q in texts:
            exact_matches.append({"family":fk,"sheet":ws.title,"row_preview":list(row[:10])})
    report={
      "dataset":"UK Public Health England CoFID 2021",
      "source_page":"https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid",
      "record_comparison":"strict_normalized_source_name",
      "sheets":sheet_audits,
      "exact_source_name_matches":exact_matches,
      "food_cards_changed":0,
      "proposed_nutrients":0,
      "notes":"Metadata inspection only. CoFID 2021 foods may have different recipes/states; verify before donor fields. N and Tr are not numeric zero."
    }
    (out/"uk_cofid2021_inventory.json").write_text(json.dumps(report,ensure_ascii=False,indent=2,default=str)+"\n")
    print("COFID_SHEETS",json.dumps(sheet_audits,ensure_ascii=False,default=str)[:10000])
    print("COFID_EXACT_SOURCE_NAMES",json.dumps(exact_matches,ensure_ascii=False,default=str)[:7000])
if __name__=="__main__":main()
