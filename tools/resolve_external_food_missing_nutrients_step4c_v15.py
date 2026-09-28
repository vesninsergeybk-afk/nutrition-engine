#!/usr/bin/env python3
from __future__ import annotations
import argparse, copy, json
from collections import Counter
from pathlib import Path

NUTRIENTS = [
"kcal","protein_per_100g","fat_per_100g","carbs_per_100g","sugar_per_100g","fiber_per_100g","sfa","unsat","added_sugar","salt",
"calcium_mg","iron_mg","magnesium_mg","phosphorus_mg","potassium_mg","sodium_mg","zinc_mg","copper_mg","manganese_mg","selenium_ug",
"vitamin_a_mcg","vitamin_e_mg","vitamin_d_mcg","vitamin_c_mg","vitamin_b1_mg","vitamin_b2_mg","vitamin_b3_mg","vitamin_b5_mg",
"vitamin_b6_mg","vitamin_b9_mcg","vitamin_b12_mcg","choline_mg","vitamin_k_mcg"
]

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--proposals",required=True)
    ap.add_argument("--source-staging",required=True)
    ap.add_argument("--members",required=True)
    ap.add_argument("--contract",required=True)
    ap.add_argument("--out-dir",required=True)
    a=ap.parse_args()
    out=Path(a.out_dir); out.mkdir(parents=True,exist_ok=True)

    props=json.load(open(a.proposals,encoding="utf-8"))
    contract=json.load(open(a.contract,encoding="utf-8"))
    members=[json.loads(x) for x in open(a.members,encoding="utf-8") if x.strip()]
    source=[json.loads(x) for x in open(a.source_staging,encoding="utf-8") if x.strip()]

    assert len(props)==89
    assert contract["policy_version"]=="external-food-step4c-missing-nutrients-v15"

    src={(x["source_registry_id"],str(x["source_record_id"])):x for x in source}
    member_idx={(x["source_registry_id"],str(x["source_record_id"])):x for x in members}
    by_family={x["family_id"]:[] for x in props}
    for m in members:
        if m["family_id"] in by_family: by_family[m["family_id"]].append(m)

    original=copy.deepcopy(props)
    out_props=copy.deepcopy(props)
    filled=[]
    errors=[]

    pmap={x["family_key"]:x for x in out_props}
    for fk, donors in contract["approved_exact_donors"].items():
        if fk not in pmap:
            errors.append("missing proposal:"+fk); continue
        p=pmap[fk]
        primary=(p["primary_source"]["source_registry_id"],str(p["primary_source"]["source_record_id"]))
        pm=member_idx.get(primary)
        if not pm or pm["family_id"]!=p["family_id"]:
            errors.append("primary membership:"+fk); continue
        primary_sig=pm.get("variant_signature")
        allowed={(m["source_registry_id"],str(m["source_record_id"])):m for m in by_family[p["family_id"]]}

        prov=copy.deepcopy(p["nutrient_provenance_resolved_v15"])
        nutrients=p["nutrients"]
        for donor in donors:
            dk=(donor["source_registry_id"],str(donor["source_record_id"]))
            if dk not in allowed:
                errors.append("donor not in family:"+fk+":"+":".join(dk)); continue
            dm=allowed[dk]
            if dm.get("variant_signature")!=primary_sig:
                errors.append("variant mismatch:"+fk+":"+":".join(dk)); continue
            row=src.get(dk)
            if not row:
                errors.append("missing source row:"+fk+":"+":".join(dk)); continue
            if row.get("name")!=donor["expected_name"]:
                errors.append("donor name drift:"+fk+":"+":".join(dk)); continue

            for field in NUTRIENTS:
                if nutrients.get(field) is not None or row.get(field) is None:
                    continue
                value=row[field]
                nutrients[field]=value
                if field=="salt":
                    prov[field]={"method":"CALCULATED","formula":"sodium_mg*2.54/1000",
                                 "source_registry_id":dk[0],"source_record_id":dk[1],
                                 "claim_scope":"approved_exact_equivalent_donor"}
                elif field=="unsat":
                    prov[field]={"method":"CALCULATED","formula":"source_MUFA_plus_PUFA",
                                 "source_registry_id":dk[0],"source_record_id":dk[1],
                                 "claim_scope":"approved_exact_equivalent_donor"}
                else:
                    prov[field]={"method":"SOURCE_REPORTED_ZERO" if float(value)==0.0 else "SOURCE_REPORTED",
                                 "source_registry_id":dk[0],"source_record_id":dk[1],
                                 "claim_scope":"approved_exact_equivalent_donor"}
                filled.append({"family_key":fk,"field":field,"value":value,
                               "source_registry_id":dk[0],"source_record_id":dk[1],"source_name":row.get("name")})

        p["nutrient_provenance_step4c_v15"]=prov
        p["missing_nutrients"]=[f for f in NUTRIENTS if p["nutrients"].get(f) is None]
        issues=[x for x in p.get("issues_after_step4b",[]) if x!="MISSING_CALCULATOR_NUTRIENTS"]
        if p["missing_nutrients"]: issues.append("MISSING_CALCULATOR_NUTRIENTS")
        p["issues_after_step4c"]=issues
        p["status_after_step4c"]="READY_FOR_NEXT_STAGING_GATE" if not issues else "BLOCKED_OTHER_GATES"
        p["step4c_policy_version"]=contract["policy_version"]

    # untouched proposals still need explicit step4c fields
    for p in out_props:
        if "nutrient_provenance_step4c_v15" not in p:
            p["nutrient_provenance_step4c_v15"]=copy.deepcopy(p["nutrient_provenance_resolved_v15"])
            p["issues_after_step4c"]=list(p.get("issues_after_step4b",[]))
            p["status_after_step4c"]="READY_FOR_NEXT_STAGING_GATE" if not p["issues_after_step4c"] else "BLOCKED_OTHER_GATES"
            p["step4c_policy_version"]=contract["policy_version"]

    # global invariants: no non-null overwrite, no invented numeric values
    for before, after in zip(original,out_props):
        assert before["family_id"]==after["family_id"]
        for f in NUTRIENTS:
            bv=before["nutrients"].get(f); av=after["nutrients"].get(f)
            if bv is not None and av!=bv:
                errors.append("non-null overwrite:"+after["family_key"]+":"+f)

    resolved=[p["family_key"] for p in out_props
              if "MISSING_CALCULATOR_NUTRIENTS" in p.get("issues_after_step4b",[])
              and "MISSING_CALCULATOR_NUTRIENTS" not in p["issues_after_step4c"]]
    remaining=sum("MISSING_CALCULATOR_NUTRIENTS" in p["issues_after_step4c"] for p in out_props)
    status_counts=Counter(p["status_after_step4c"] for p in out_props)
    remaining_nulls=sum(len(p["missing_nutrients"]) for p in out_props)

    if sorted(resolved)!=["oil cocoa butter","oil peanut"]:
        errors.append("resolved set drift:"+repr(sorted(resolved)))
    if len(filled)!=40: errors.append("filled field count:"+str(len(filled)))
    if remaining!=52: errors.append("remaining blocker count:"+str(remaining))
    if status_counts["READY_FOR_NEXT_STAGING_GATE"]!=31: errors.append("ready count:"+str(status_counts))
    if status_counts["BLOCKED_OTHER_GATES"]!=58: errors.append("blocked count:"+str(status_counts))

    report={
      "schema_version":1,
      "policy_version":contract["policy_version"],
      "step":"4C",
      "status":"PASS" if not errors else "FAIL",
      "proposals":len(out_props),
      "approved_families_touched":len(contract["approved_exact_donors"]),
      "donor_fields_filled":len(filled),
      "fully_resolved_missing_nutrient_families":resolved,
      "missing_nutrient_blockers_before":54,
      "missing_nutrient_blockers_after":remaining,
      "remaining_null_fields":remaining_nulls,
      "status_after_step4c":dict(status_counts),
      "null_to_zero_coercion":False,
      "non_null_overwrites":sum(e.startswith("non-null overwrite:") for e in errors),
      "semantic_widening_used":False,
      "production_main_changed":False,
      "errors":errors
    }

    json.dump(out_props,open(out/"import_proposals_v15_step4c.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)
    json.dump(filled,open(out/"step4c_exact_donor_fills.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)
    json.dump(report,open(out/"step4c_missing_nutrient_gate_report.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if errors: raise SystemExit(1)

if __name__=="__main__": main()
