#!/usr/bin/env python3
"""Step 4E: independent provenance and current-main compatibility gate.

Only staging results. Does not modify calculation data, HEI values, or production.
"""
from __future__ import annotations
import argparse, copy, glob, json, math, re, unicodedata
from collections import Counter
from pathlib import Path

FIELDS = [
"kcal","protein_per_100g","fat_per_100g","carbs_per_100g","sugar_per_100g",
"fiber_per_100g","sfa","unsat","added_sugar","salt","calcium_mg","iron_mg",
"magnesium_mg","phosphorus_mg","potassium_mg","sodium_mg","zinc_mg","copper_mg",
"manganese_mg","selenium_ug","vitamin_a_mcg","vitamin_e_mg","vitamin_d_mcg",
"vitamin_c_mg","vitamin_b1_mg","vitamin_b2_mg","vitamin_b3_mg","vitamin_b5_mg",
"vitamin_b6_mg","vitamin_b9_mcg","vitamin_b12_mcg","choline_mg","vitamin_k_mcg"
]
HEI = [
"fruit_cup_eq_per_100g","whole_fruit_cup_eq_per_100g","veg_cup_eq_per_100g",
"greens_beans_cup_eq_per_100g","dairy_cup_eq_per_100g","whole_grain_oz_eq_per_100g",
"refined_grain_oz_eq_per_100g","protein_oz_eq_per_100g",
"seafood_plant_oz_eq_per_100g","added_sugars_tsp_eq_per_100g"
]
METHODS = {"SOURCE_REPORTED","SOURCE_REPORTED_ZERO","CALCULATED","ASSUMED_ZERO","MISSING"}

def norm(s):
    s=unicodedata.normalize("NFKC",str(s or "")).casefold().replace("ё","е")
    return re.sub(r"\s+"," ",re.sub(r"[^\w]+"," ",s,flags=re.UNICODE)).strip()

def numeric(x):
    return type(x) in (int,float) and math.isfinite(x)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--proposals",required=True)
    ap.add_argument("--current-glob",required=True)
    ap.add_argument("--out-dir",required=True)
    args=ap.parse_args()
    out=Path(args.out_dir);out.mkdir(parents=True,exist_ok=True)
    props=json.loads(Path(args.proposals).read_text(encoding="utf-8"))
    files=sorted(glob.glob(args.current_glob))
    current=[]
    for path in files: current.extend(json.loads(Path(path).read_text(encoding="utf-8")))
    errors=[]
    if len(props)!=89:errors.append("proposal_count:"+str(len(props)))
    if len(current)!=1105:errors.append("current_count:"+str(len(current)))
    if len(files)!=12:errors.append("shard_count:"+str(len(files)))
    current_keys={p.get("key") for p in current}
    current_names={norm(p.get("name_ru")) for p in current}
    current_src={
        (str((p.get("data_quality_v1_3") or {}).get("source_registry_id")),
         str((p.get("data_quality_v1_3") or {}).get("source_record_id")))
        for p in current
    }
    if len(current_keys)!=len(current):errors.append("current_duplicate_keys")
    proposed_keys=set();proposed_names=set()
    repaired=[];state_blocked=[];other_blocked=[];preview=[]
    stale=Counter(); final_methods=Counter();issues=Counter()
    for p in props:
        fk=p.get("family_key")
        q=copy.deepcopy(p)
        n=q.get("nutrients") or {}
        old=q.get("nutrient_provenance_resolved_v15") or {}
        fresh=q.get("nutrient_provenance_step4c_v15") or {}
        hei=q.get("hei_equivalents") or {}
        if set(n)!=set(FIELDS) or set(fresh)!=set(FIELDS) or set(old)!=set(FIELDS):
            errors.append(f"field_set:{fk}")
            continue
        for f in FIELDS:
            v=n[f];m=fresh[f];mt=m.get("method")
            if mt not in METHODS:errors.append(f"invalid_method:{fk}:{f}:{mt}")
            if v is None and mt!="MISSING":errors.append(f"missing_semantics:{fk}:{f}")
            if v is not None and not numeric(v):errors.append(f"invalid_value:{fk}:{f}")
            if mt=="MISSING" and v is not None:errors.append(f"phantom_missing:{fk}:{f}")
            if mt=="SOURCE_REPORTED_ZERO" and v!=0:errors.append(f"false_reported_zero:{fk}:{f}")
            if mt=="SOURCE_REPORTED" and (v is None or v==0):errors.append(f"false_reported_nonzero:{fk}:{f}")
            if mt=="ASSUMED_ZERO" and (v!=0 or f!="added_sugar"):
                errors.append(f"unapproved_assumed_zero:{fk}:{f}")
            if old[f].get("method")!=mt:
                stale[(old[f].get("method"),mt)]+=1
                if old[f].get("method")!="MISSING" or mt=="MISSING":
                    errors.append(f"unexpected_provenance_change:{fk}:{f}")
                if m.get("claim_scope")!="approved_exact_equivalent_donor":
                    errors.append(f"unapproved_donor_claim:{fk}:{f}")
            final_methods[mt]+=1
        if numeric(n.get("salt")) and numeric(n.get("sodium_mg")):
            if abs(n["salt"]-n["sodium_mg"]*2.54/1000)>1e-6:
                errors.append(f"salt_equation:{fk}")
        issues_for_hei=q.get("issues_after_step4d") or []
        unresolved="HEI_EQUIVALENTS_UNRESOLVED" in issues_for_hei
        if unresolved:
            if q.get("hei_equivalents") is not None:
                errors.append(f"hei_unresolved_not_null:{fk}")
        elif set(hei)!=set(HEI) or any(not numeric(v) or v<0 for v in hei.values()):
            errors.append(f"hei_semantics:{fk}")
        hprov=q.get("hei_equiv_provenance_step4d_v15") or q.get("hei_equiv_provenance_import_v15") or {}
        if not unresolved and hprov.get("status") not in ("OFFICIAL_EXACT","STRUCTURAL_ZERO"):
            errors.append(f"hei_provenance_status:{fk}:{hprov.get('status')}")
        if hprov.get("status")=="STRUCTURAL_ZERO" and any(v!=0 for v in hei.values()):
            errors.append(f"structural_zero_nonzero:{fk}")
        k=q.get("product_key_proposed")
        nn=norm(q.get("name_ru_import"))
        if not k or k in proposed_keys:errors.append(f"duplicate_proposed_key:{fk}")
        if not nn or nn in proposed_names:errors.append(f"duplicate_ru_name:{fk}")
        proposed_keys.add(k); proposed_names.add(nn)
        if k in current_keys:errors.append(f"production_key_collision:{fk}")
        if nn in current_names:errors.append(f"production_ru_name_collision:{fk}")
        src=q.get("primary_source") or {}
        source_key=(str(src.get("source_registry_id")),str(src.get("source_record_id")))
        if source_key in current_src:errors.append(f"production_source_collision:{fk}")
        q["nutrient_provenance_final_v15"]=fresh
        q["nutrient_provenance_legacy_pre_step4c_v15"]=old
        q["step4e_policy_version"]="external-food-step4e-integrity-v15"
        these=q.get("issues_after_step4d") or []
        for issue in these:issues[issue]+=1
        if these or q.get("status_after_step4d")!="READY_FOR_NEXT_STAGING_GATE":
            q["step4e_status"]="BLOCKED_EXISTING_GATES"
            other_blocked.append(q)
        elif fk=="bean pinto":
            # Existing known dry-vs-cooked equivalent issue is not fixed by Step 4D.
            q["step4e_status"]="BLOCKED_STATE_HEI"
            q["step4e_block_reason"]="DRY_PINT0_NUTRIENTS_VS_COOKED_FPID_EQUIVALENT"
            state_blocked.append(q)
        else:
            q["step4e_status"]="PREVIEW_ONLY_REQUIRES_PRODUCTION_POLICY_GATE"
            preview.append(q)
        repaired.append(q)
    if sum(stale.values())!=40:errors.append("stale_field_count:"+str(sum(stale.values())))
    if len(preview)!=32:errors.append("preview_count:"+str(len(preview)))
    if len(state_blocked)!=1:errors.append("state_blocked_count:"+str(len(state_blocked)))
    if len(other_blocked)!=56:errors.append("other_blocked_count:"+str(len(other_blocked)))
    if sum(final_methods.values())!=89*33:errors.append("provenance_field_count")
    if len(repaired)!=89:errors.append("output_count")
    r={
      "policy":"external-food-step4e-integrity-v15",
      "status":"PASS" if not errors else "FAIL",
      "source_proposals":len(props),
      "current_main_products":len(current),
      "preview_only_candidates":len(preview),
      "blocked_state_hei":len(state_blocked),
      "blocked_existing_gates":len(other_blocked),
      "legacy_stale_provenance_fields":sum(stale.values()),
      "provenance_transitions":{str(k):v for k,v in stale.items()},
      "final_field_method_counts":dict(final_methods),
      "unresolved_issues":dict(issues),
      "production_provenance_policy_not_changed":True,
      "production_main_changed":False,
      "import_to_production_permitted":False,
      "errors":errors,
    }
    (out/"step4e_integrity_report.json").write_text(json.dumps(r,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (out/"step4e_preview_only_proposals.json").write_text(json.dumps(preview,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (out/"step4e_state_blocked.json").write_text(json.dumps(state_blocked,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (out/"step4e_blocked_other.json").write_text(json.dumps(other_blocked,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(r,ensure_ascii=False,indent=2))
    if errors:raise SystemExit(1)

if __name__=="__main__": main()
