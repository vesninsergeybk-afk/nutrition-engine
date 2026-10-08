#!/usr/bin/env python3
"""Probe official Norwegian Matvaretabellen 2026 workbook and matching food names.

Read-only primary source; documents download identity, workbook columns, and
food-description scope. No import of unverified missing nutrients.
"""
from __future__ import annotations
import argparse,json,io,re,requests,hashlib
from pathlib import Path
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from openpyxl import load_workbook

PAGE="https://www.mattilsynet.no/en/food-and-beverages/matvaretabellen/download-the-norwegian-food-composition-table"
def main():
 p=argparse.ArgumentParser()
 for x in ("blocked","out"):p.add_argument("--"+x,required=True)
 a=p.parse_args()
 out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
 s=requests.Session();s.headers["User-Agent"]="nutrition-engine-scientific-research/1.0"
 r=s.get(PAGE,timeout=50);r.raise_for_status()
 links=[]
 for anchor in BeautifulSoup(r.text,"html.parser").find_all("a",href=True):
  href=urljoin(PAGE,anchor["href"])
  name=anchor.get_text(" ",strip=True)
  if "composition table 2026" in name.lower() or ".xlsx" in href.lower() or ".ods" in href.lower():
   links.append({"text":name,"url":href})
 print("NORWAY2026_PUBLIC_LINKS",json.dumps(links,ensure_ascii=False)[:12000])
 wb=None;report={"source_url":PAGE,"download_candidates":links,"status":"DOWNLOAD_AUDIT_ONLY"}
 for item in links:
  if "2026" not in item["text"] or "ods" in item["text"].lower():continue
  try:
   resp=s.get(item["url"],timeout=65)
   print("NORWAY2026_HTTP",resp.status_code,len(resp.content),resp.headers.get("content-type"),item["url"])
   resp.raise_for_status()
   if not resp.content[:2]==b"PK":continue
   wb=load_workbook(io.BytesIO(resp.content),read_only=True,data_only=True)
   report["selected_url"]=item["url"];report["sha256"]=hashlib.sha256(resp.content).hexdigest()
   break
  except Exception as e:print("NORWAY2026_DOWNLOAD_ERROR",str(e)[:250])
 if wb:
  sheets=[]
  for sheet in wb:
   first=[]
   for row in sheet.iter_rows(min_row=1,max_row=min(8,sheet.max_row),values_only=True):
    first.append([str(x or "")[:130] for x in row[:15]])
   sheets.append({"name":sheet.title,"rows":sheet.max_row,"columns":sheet.max_column,"sample":first})
  report["sheets"]=sheets
  print("NORWAY2026_SHEETS",json.dumps(sheets,ensure_ascii=False)[:16000])
 else:report["status"]="WORKBOOK_DOWNLOAD_NOT_RESOLVED"
 (out/"norwegian_matvaretabellen2026_source_probe.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
if __name__=="__main__":main()
