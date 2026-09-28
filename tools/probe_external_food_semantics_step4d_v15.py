#!/usr/bin/env python3
from __future__ import annotations
import argparse, csv, io, json, re, unicodedata, zipfile
from difflib import SequenceMatcher
from pathlib import Path
import pandas as pd

def norm(s):
    s=unicodedata.normalize("NFKC",str(s or "")).casefold().replace("ё","е")
    s=re.sub(r"[^\w]+"," ",s,flags=re.UNICODE)
    return re.sub(r"\s+"," ",s).strip()

STOP={"raw","cooked","fresh","dried","dry","whole","type","with","and","or","the","of","in","from","food","foods"}

def toks(s):
    return {x for x in norm(s).split() if len(x)>1 and x not in STOP}

def score(q,c):
    nq,nc=norm(q),norm(c)
    if not nq or not nc: return 0.0
    ratio=SequenceMatcher(None,nq,nc).ratio()
    a,b=toks(nq),toks(nc)
    jac=(len(a&b)/len(a|b)) if a and b else 0.0
    contain=1.0 if (nq in nc or nc in nq) else 0.0
    return round(0.55*ratio+0.35*jac+0.10*contain,6)

def load_fndds(path):
    with zipfile.ZipFile(path) as z:
        names={Path(n).name.lower():n for n in z.namelist()}
        member=names.get("food.csv")
        if not member: raise RuntimeError("food.csv missing in FNDDS zip")
        rows=list(csv.DictReader(io.StringIO(z.read(member).decode("utf-8-sig",errors="replace"))))
    out=[]
    for r in rows:
        desc=r.get("description") or r.get("Description") or ""
        if desc:
            out.append({"fdc_id":str(r.get("fdc_id") or ""), "description":desc})
    return out

def load_fpid(path):
    xls=pd.ExcelFile(path)
    schema={}
    rows=[]
    for sheet in xls.sheet_names:
        df=pd.read_excel(path,sheet_name=sheet,dtype=object)
        schema[sheet]=[str(c) for c in df.columns]
        text_cols=[]
        for c in df.columns:
            vals=df[c].dropna()
            if len(vals)==0: continue
            sample=vals.head(25)
            if sum(isinstance(v,str) for v in sample)>=max(1,len(sample)//3):
                text_cols.append(c)
        # Prefer description/name columns when available.
        desc_cols=[c for c in text_cols if re.search(r"description|desc|food.*name|name",str(c),re.I)]
        use=desc_cols or text_cols[:4]
        for idx,row in df.iterrows():
            parts=[str(row[c]).strip() for c in use if pd.notna(row[c]) and str(row[c]).strip()]
            if not parts: continue
            text=" | ".join(parts)
            code=None
            for c in df.columns:
                if re.search(r"food.*code|^code$|ndb",str(c),re.I) and pd.notna(row[c]):
                    code=str(row[c]); break
            rows.append({"sheet":sheet,"row_index":int(idx),"code":code,"text":text})
    return schema,rows

def top_matches(q,rows,text_key,n=12):
    scored=[]
    for r in rows:
        s=score(q,r[text_key])
        if s>0:
            x=dict(r);x["score"]=s;scored.append(x)
    scored.sort(key=lambda x:(-x["score"],x[text_key]))
    return scored[:n]

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--proposals",required=True)
    ap.add_argument("--fndds",required=True)
    ap.add_argument("--fpid",required=True)
    ap.add_argument("--out-dir",required=True)
    a=ap.parse_args()
    out=Path(a.out_dir);out.mkdir(parents=True,exist_ok=True)
    props=json.load(open(a.proposals,encoding="utf-8"))
    target=[]
    for p in props:
        issues=set(p.get("issues_after_step4c") or [])
        if issues & {"HEI_EQUIVALENTS_UNRESOLVED","FPID_EXACT_NAME_AMBIGUOUS","FNDDS_EXACT_NAME_AMBIGUOUS"}:
            target.append(p)
    assert len(target)==33, len(target)

    fndds=load_fndds(Path(a.fndds))
    fpid_schema,fpid=load_fpid(Path(a.fpid))
    report=[]
    for p in target:
        q=p["primary_source"]["source_name"]
        report.append({
            "family_key":p["family_key"],
            "family_id":p["family_id"],
            "name_ru_import":p["name_ru_import"],
            "query_source_name":q,
            "issues":p.get("issues_after_step4c") or [],
            "current_fndds_exact_matches":p.get("fndds_exact_matches") or [],
            "fpid_top":top_matches(q,fpid,"text",12),
            "fndds_top":top_matches(q,fndds,"description",12),
        })
    json.dump(report,open(out/"step4d_semantic_probe.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)
    json.dump({"fpid_sheets":fpid_schema,"fpid_rows_indexed":len(fpid),"fndds_rows_indexed":len(fndds),"targets":len(target)},
              open(out/"step4d_source_schema.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)
    # Compact CSV for review.
    with open(out/"step4d_semantic_probe_review.csv","w",encoding="utf-8-sig",newline="") as fh:
        w=csv.writer(fh);w.writerow(["family_key","name_ru","issues","query","fpid_1","fpid_1_score","fpid_2","fpid_2_score","fndds_1","fndds_1_score","fndds_2","fndds_2_score"])
        for r in report:
            fp=r["fpid_top"];fd=r["fndds_top"]
            w.writerow([r["family_key"],r["name_ru_import"],";".join(r["issues"]),r["query_source_name"],
                        fp[0]["text"] if len(fp)>0 else "",fp[0]["score"] if len(fp)>0 else "",
                        fp[1]["text"] if len(fp)>1 else "",fp[1]["score"] if len(fp)>1 else "",
                        fd[0]["description"] if len(fd)>0 else "",fd[0]["score"] if len(fd)>0 else "",
                        fd[1]["description"] if len(fd)>1 else "",fd[1]["score"] if len(fd)>1 else ""])
    print(json.dumps({"targets":len(target),"fpid_rows":len(fpid),"fndds_rows":len(fndds)},ensure_ascii=False))

if __name__=="__main__": main()
