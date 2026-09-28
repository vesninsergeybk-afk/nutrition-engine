#!/usr/bin/env python3
from __future__ import annotations
import argparse, copy, csv, io, json, re, unicodedata, zipfile
from collections import Counter
from pathlib import Path
import pandas as pd

HEI_FIELDS = [
    "fruit_cup_eq_per_100g",
    "whole_fruit_cup_eq_per_100g",
    "veg_cup_eq_per_100g",
    "greens_beans_cup_eq_per_100g",
    "dairy_cup_eq_per_100g",
    "whole_grain_oz_eq_per_100g",
    "refined_grain_oz_eq_per_100g",
    "protein_oz_eq_per_100g",
    "seafood_plant_oz_eq_per_100g",
    "added_sugars_tsp_eq_per_100g",
]

def norm(s):
    s=unicodedata.normalize("NFKC",str(s or "")).casefold().replace("ё","е")
    s=re.sub(r"[^\w]+"," ",s,flags=re.UNICODE)
    return re.sub(r"\s+"," ",s).strip()

def load_fpid(path):
    df=pd.read_excel(path,sheet_name="FPID_1718",dtype=object)
    rows=[]
    for _,r in df.iterrows():
        if pd.isna(r.get("DESCRIPTION")): continue
        code=str(r.get("CODE"))
        if code.endswith(".0"): code=code[:-2]
        rows.append((code,str(r["DESCRIPTION"]),r))
    return rows

def fpid_to_hei(r):
    def num(col):
        v=r.get(col)
        if pd.isna(v): return 0.0
        return float(v)
    return {
        "fruit_cup_eq_per_100g": num("F_TOTAL (cup eq.)"),
        "whole_fruit_cup_eq_per_100g": num("F_TOTAL (cup eq.)")-num("F_JUICE (cup eq.)"),
        "veg_cup_eq_per_100g": num("V_TOTAL (cup eq.)"),
        "greens_beans_cup_eq_per_100g": num("V_DRKGR (cup eq.)")+num("V_LEGUMES (cup eq.)"),
        "dairy_cup_eq_per_100g": num("D_TOTAL (cup eq.)"),
        "whole_grain_oz_eq_per_100g": num("G_WHOLE (oz. eq.)"),
        "refined_grain_oz_eq_per_100g": num("G_REFINED (oz. eq.)"),
        "protein_oz_eq_per_100g": num("PF_TOTAL (oz. eq.)"),
        "seafood_plant_oz_eq_per_100g": (
            num("PF_SEAFD_HI (oz. eq.)")+num("PF_SEAFD_LOW (oz. eq.)")+
            num("PF_SOY (oz. eq.)")+num("PF_NUTSDS (oz. eq.)")+num("PF_LEGUMES (oz. eq.)")
        ),
        "added_sugars_tsp_eq_per_100g": num("ADD_SUGARS (tsp. eq.)"),
    }

def load_fndds(path):
    with zipfile.ZipFile(path) as z:
        member=next(n for n in z.namelist() if Path(n).name.lower()=="food.csv")
        rows=list(csv.DictReader(io.StringIO(z.read(member).decode("utf-8-sig",errors="replace"))))
    return rows

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--proposals",required=True)
    ap.add_argument("--fpid",required=True)
    ap.add_argument("--fndds",required=True)
    ap.add_argument("--contract",required=True)
    ap.add_argument("--out-dir",required=True)
    a=ap.parse_args()
    out=Path(a.out_dir);out.mkdir(parents=True,exist_ok=True)

    props=json.load(open(a.proposals,encoding="utf-8"))
    contract=json.load(open(a.contract,encoding="utf-8"))
    fpid=load_fpid(Path(a.fpid))
    fndds=load_fndds(Path(a.fndds))

    assert len(props)==89
    assert contract["policy_version"]=="external-food-step4d-semantic-v15"

    original=copy.deepcopy(props)
    out_props=copy.deepcopy(props)
    pmap={p["family_key"]:p for p in out_props}
    resolutions=[]
    errors=[]

    before_issue_counts=Counter(i for p in props for i in p.get("issues_after_step4c",[]))

    for fk,spec in contract["approved_exact_resolutions"].items():
        if fk not in pmap:
            errors.append("missing proposal:"+fk); continue
        p=pmap[fk]
        q=p["primary_source"]["source_name"]

        fspec=spec["fpid"]
        exact=[(code,desc,row) for code,desc,row in fpid if norm(desc)==norm(q)]
        if len(exact)!=1:
            errors.append(f"fpid exact count:{fk}:{len(exact)}"); continue
        code,desc,row=exact[0]
        if code!=str(fspec["code"]) or desc!=fspec["description"]:
            errors.append(f"fpid contract drift:{fk}:{code}:{desc}"); continue

        hei=fpid_to_hei(row)
        if set(hei)!=set(HEI_FIELDS):
            errors.append("hei field set:"+fk); continue
        if any(v<0 for v in hei.values()):
            errors.append("negative hei:"+fk); continue

        p["hei_equivalents"]=hei
        p["hei_equiv_provenance_step4d_v15"]={
            "status":"OFFICIAL_EXACT",
            "source":"USDA_FPID_2017_2018",
            "code":code,
            "description":desc,
            "resolution_scope":"unique_normalized_exact_match",
        }

        fndds_resolution=None
        if "fndds" in spec:
            dspec=spec["fndds"]
            d_exact=[r for r in fndds if norm(r.get("description"))==norm(dspec["description"])]
            # Exact description may exist only once; selected ID is pinned by contract.
            d_exact_id=[r for r in d_exact if str(r.get("fdc_id"))==str(dspec["fdc_id"])]
            if len(d_exact_id)!=1:
                errors.append(f"fndds exact pinned count:{fk}:{len(d_exact_id)}"); continue
            fndds_resolution={"fdc_id":str(dspec["fdc_id"]),"description":dspec["description"],"match_scope":"exact_description_and_id"}
            p["fndds_exact_match_resolved_step4d_v15"]=fndds_resolution

        issues=[i for i in p.get("issues_after_step4c",[]) if i not in set(spec["remove_issues"])]
        p["issues_after_step4d"]=issues
        p["status_after_step4d"]="READY_FOR_NEXT_STAGING_GATE" if not issues else "BLOCKED_OTHER_GATES"
        p["step4d_policy_version"]=contract["policy_version"]
        resolutions.append({
            "family_key":fk,
            "primary_source_name":q,
            "fpid_code":code,
            "fpid_description":desc,
            "hei_equivalents":hei,
            "fndds_resolution":fndds_resolution,
            "removed_issues":spec["remove_issues"],
        })

    for p in out_props:
        if "issues_after_step4d" not in p:
            p["issues_after_step4d"]=list(p.get("issues_after_step4c",[]))
            p["status_after_step4d"]="READY_FOR_NEXT_STAGING_GATE" if not p["issues_after_step4d"] else "BLOCKED_OTHER_GATES"
            p["step4d_policy_version"]=contract["policy_version"]

    # Invariants: nutrient values and family/profile identity are untouched.
    for b,aft in zip(original,out_props):
        if b["family_id"]!=aft["family_id"] or b["selected_profile_id"]!=aft["selected_profile_id"]:
            errors.append("identity changed:"+aft["family_key"])
        if b["nutrients"]!=aft["nutrients"]:
            errors.append("nutrients changed:"+aft["family_key"])

    after_issue_counts=Counter(i for p in out_props for i in p.get("issues_after_step4d",[]))
    status_counts=Counter(p["status_after_step4d"] for p in out_props)

    expected_before={"HEI_EQUIVALENTS_UNRESOLVED":30,"FPID_EXACT_NAME_AMBIGUOUS":2,"FNDDS_EXACT_NAME_AMBIGUOUS":1}
    for k,v in expected_before.items():
        if before_issue_counts[k]!=v: errors.append(f"before {k}:{before_issue_counts[k]}")
    if after_issue_counts["HEI_EQUIVALENTS_UNRESOLVED"]!=28: errors.append("hei after:"+str(after_issue_counts["HEI_EQUIVALENTS_UNRESOLVED"]))
    if after_issue_counts["FPID_EXACT_NAME_AMBIGUOUS"]!=0: errors.append("fpid after:"+str(after_issue_counts["FPID_EXACT_NAME_AMBIGUOUS"]))
    if after_issue_counts["FNDDS_EXACT_NAME_AMBIGUOUS"]!=0: errors.append("fndds after:"+str(after_issue_counts["FNDDS_EXACT_NAME_AMBIGUOUS"]))
    if status_counts["READY_FOR_NEXT_STAGING_GATE"]!=33: errors.append("ready count:"+str(status_counts))
    if status_counts["BLOCKED_OTHER_GATES"]!=56: errors.append("blocked count:"+str(status_counts))
    if sorted(r["family_key"] for r in resolutions)!=["cheese provolone","cheese swiss"]:
        errors.append("resolution set drift:"+repr(sorted(r["family_key"] for r in resolutions)))

    report={
        "schema_version":1,
        "policy_version":contract["policy_version"],
        "step":"4D",
        "status":"PASS" if not errors else "FAIL",
        "proposals":len(out_props),
        "resolved_families":sorted(r["family_key"] for r in resolutions),
        "issue_counts_before":dict(before_issue_counts),
        "issue_counts_after":dict(after_issue_counts),
        "status_after_step4d":dict(status_counts),
        "fuzzy_or_class_inference_used":False,
        "nutrient_values_changed":False,
        "production_main_changed":False,
        "errors":errors,
    }
    json.dump(out_props,open(out/"import_proposals_v15_step4d.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)
    json.dump(resolutions,open(out/"step4d_exact_semantic_resolutions.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)
    json.dump(report,open(out/"step4d_semantic_gate_report.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if errors: raise SystemExit(1)

if __name__=="__main__": main()
