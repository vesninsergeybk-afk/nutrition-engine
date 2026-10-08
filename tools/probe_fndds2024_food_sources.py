#!/usr/bin/env python3
"""Examine 2024 Survey FNDDS official food names and nutrient table schema."""
import argparse,zipfile,csv,io,json,re,unicodedata
from collections import Counter
from pathlib import Path

def norm(s):
  s=unicodedata.normalize("NFKC",str(s or "")).casefold()
  return re.sub(r"\s+"," ",re.sub(r"[^a-z0-9]+"," ",s)).strip()
def csv_read(z,path):
  name=next((n for n in z.namelist() if Path(n).name.lower()==path.lower()),None)
  if not name:return None
  with z.open(name) as fp:
    data=fp.read().decode("utf-8-sig")
  return list(csv.DictReader(io.StringIO(data)))
def main():
  a=argparse.ArgumentParser()
  for x in ("zip","blocked","out"):a.add_argument("--"+x,required=True)
  x=a.parse_args()
  blocked=json.loads(Path(x.blocked).read_text())
  with zipfile.ZipFile(x.zip) as z:
    files=[{"path":n,"bytes":z.getinfo(n).file_size} for n in z.namelist()]
    tables={}
    for basename in ("food.csv","food_nutrient.csv","nutrient.csv","food_attribute.csv"):
      rows=csv_read(z,basename)
      if rows is not None:
        tables[basename]={"rows":len(rows),"cols":list(rows[0]) if rows else [],"sample":rows[:2]}
    food=csv_read(z,"food.csv")
  if not food:raise RuntimeError("Food table absent")
  idx={}
  for f in food:idx.setdefault(norm(f["description"]),[]).append(f)
  exact=[]
  for p in blocked:
    q=p["primary_source"]["source_name"]
    matches=idx.get(norm(q),[])
    if matches:
      exact.append({"family":p["family_key"],"source_name":q,
      "matches":[{"fdc_id":f["fdc_id"],"description":f["description"]} for f in matches]})
  report={"dataset":"USDA FoodData Central Survey FNDDS 2024-10-31",
          "status":"NAMES_AND_SCHEMA_ONLY", "archive_files":files,
          "tables":tables, "blocked":len(blocked),"exact_name_matches":exact}
  out=Path(x.out);out.mkdir(parents=True,exist_ok=True)
  (out/"fndds2024_schema_and_names.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
  print("FNDDS_TABLES",json.dumps(tables,ensure_ascii=False)[:9000])
  print("FNDDS_EXACT_NAMES",json.dumps(exact,ensure_ascii=False)[:12000])
if __name__=="__main__":main()
