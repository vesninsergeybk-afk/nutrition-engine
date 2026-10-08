#!/usr/bin/env python3
"""Inspect the official Canadian Nutrient File 2026 schema and source identities.

No nutrient imputation; source identities are NOT presumed stable across releases.
"""
from __future__ import annotations
import argparse,csv,io,json,zipfile
from pathlib import Path

def read_csv(z,member):
    data=z.read(member)
    try: txt=data.decode("utf-8-sig")
    except UnicodeDecodeError: txt=data.decode("latin-1")
    txt=txt[:80000000]
    first=txt.splitlines()[0]
    delim=";" if first.count(";")>first.count(",") else ","
    return list(csv.DictReader(io.StringIO(txt),delimiter=delim))

def main():
    ap=argparse.ArgumentParser();ap.add_argument("--zip",required=True);ap.add_argument("--blocked",required=True);ap.add_argument("--output",required=True)
    a=ap.parse_args();out=Path(a.output);out.mkdir(exist_ok=True,parents=True)
    blocked=json.loads(Path(a.blocked).read_text())
    cids={str(x["primary_source"]["source_record_id"]):x for x in blocked if x["primary_source"]["source_registry_id"]=="HEALTH_CANADA_CNF"}
    report={"dataset":"Health Canada CNF 2026","source_url":"https://open.canada.ca/data/en/dataset/1b6139bd-ed7e-4043-bc28-ff00e10f3109","selected_old_record_ids":sorted(cids),"tables":[],"exact_identity_validation_required":True}
    with zipfile.ZipFile(a.zip) as z:
      for name in z.namelist():
        if name.endswith("/"):continue
        e={"name":name,"compressed_bytes":z.getinfo(name).compress_size}
        if Path(name).suffix.lower()!=".csv":
          report["tables"].append(e); continue
        try:
          rows=read_csv(z,name)
          e["columns"]=list(rows[0]) if rows else []
          e["nrows"]=len(rows)
          e["first_two"]=rows[:2]
          lower=Path(name).stem.lower()
          if "food_name" in lower:
            cand=[x for x in rows if any(str(v).strip() in cids for v in x.values())]
            # Keep only IDs in the logical numeric food code field if column known.
            likely=[k for k in e["columns"] if "food" in k.lower() and ("code" in k.lower() or "id" in k.lower())]
            if likely:
              cand=[x for x in rows if str(x.get(likely[0],"")).strip() in cids]
            e["old_ids_in_2026"]=cand[:24]
        except Exception as exc:
          e["error"]=str(exc)
        report["tables"].append(e)
    (out/"cnf2026_source_inventory.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n")
    for t in report["tables"]:
      print("CNF_TABLE",json.dumps(t,ensure_ascii=False)[:3500])
    print("CNF_2026_TABLE_COUNT",len(report["tables"]))

if __name__=="__main__":main()
