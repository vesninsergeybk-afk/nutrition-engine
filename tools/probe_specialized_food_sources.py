#!/usr/bin/env python3
"""Source format and exact-identity probe for standalone USDA choline and Fineli 74.

Research only. No missing values changed or imported.
"""
import argparse,zipfile,json,io,csv,re
from pathlib import Path

def sample_bytes(buf):
    for encoding in ("utf-8-sig","cp1252","latin-1"):
        try:return buf.decode(encoding),encoding
        except UnicodeDecodeError:pass
    return buf.decode("latin-1"),"latin-1"

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--choline",required=True)
    parser.add_argument("--fineli",required=True)
    parser.add_argument("--out",required=True)
    a=parser.parse_args()
    report={}
    for name,archive in (("USDA_CHOLINE_RELEASE_2_2008",a.choline),("FINELI_74",a.fineli)):
        rows=[]
        with zipfile.ZipFile(archive) as z:
            for f in z.infolist():
                if f.is_dir():continue
                rec={"path":f.filename,"bytes":f.file_size}
                if f.file_size<20_000_000 and (f.filename.lower().endswith((".txt",".csv",".dat",".asc",".tsv")) or "." not in Path(f.filename).name):
                    content,encoding=sample_bytes(z.read(f.filename))
                    lines=content.splitlines()
                    rec["encoding"]=encoding
                    rec["samples"]=lines[:8]
                    rec["line_count"]=len(lines)
                    rec["line_len_max_first30"]=max((len(x) for x in lines[:30]),default=0)
                rows.append(rec)
        report[name]={"archive":archive,"members":rows}
    out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
    (out/"specialized_source_schema.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    for kind,d in report.items():
        print("SPECIALIZED_SOURCE",kind)
        for x in d["members"]:
            print(json.dumps(x,ensure_ascii=False)[:6000])

if __name__=="__main__":main()
