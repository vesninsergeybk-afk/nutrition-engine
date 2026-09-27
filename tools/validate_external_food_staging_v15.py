#!/usr/bin/env python3
from __future__ import annotations
import argparse, glob, json, re, unicodedata
from collections import defaultdict
from pathlib import Path

FIELDS=["kcal","protein_per_100g","fat_per_100g","carbs_per_100g","sugar_per_100g","fiber_per_100g","sfa","unsat","added_sugar","salt","calcium_mg","iron_mg","magnesium_mg","phosphorus_mg","potassium_mg","sodium_mg","zinc_mg","copper_mg","manganese_mg","selenium_ug","vitamin_a_mcg","vitamin_e_mg","vitamin_d_mcg","vitamin_c_mg","vitamin_b1_mg","vitamin_b2_mg","vitamin_b3_mg","vitamin_b5_mg","vitamin_b6_mg","vitamin_b9_mcg","vitamin_b12_mcg","choline_mg","vitamin_k_mcg"]
HEI=["fruit_cup_eq_per_100g","whole_fruit_cup_eq_per_100g","veg_cup_eq_per_100g","greens_beans_cup_eq_per_100g","dairy_cup_eq_per_100g","whole_grain_oz_eq_per_100g","refined_grain_oz_eq_per_100g","protein_oz_eq_per_100g","seafood_plant_oz_eq_per_100g","added_sugars_tsp_eq_per_100g"]

def norm(s):
    s=unicodedata.normalize("NFKC",str(s or "")).casefold().replace("ё","е")
    s=re.sub(r"[^\w]+"," ",s,flags=re.UNICODE)
    return re.sub(r"\s+"," ",s).strip()

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--stage",required=True)
    ap.add_argument("--blocked",required=True)
    ap.add_argument("--current-glob",required=True)
    ap.add_argument("--out-dir",required=True)
    a=ap.parse_args();out=Path(a.out_dir);out.mkdir(parents=True,exist_ok=True)
    current=[]
    for p in sorted(glob.glob(a.current_glob)): current.extend(json.load(open(p,encoding="utf-8")))
    stage=json.load(open(a.stage,encoding="utf-8"));blocked=json.load(open(a.blocked,encoding="utf-8"))
    errors=[]
    if len(current)!=1105: errors.append("current_count")
    if len(stage)!=28: errors.append("stage_count")
    if len(blocked)!=1 or blocked[0].get("family_key")!="bean pinto": errors.append("blocked_pinto")
    combined=current+stage
    keys=[x["key"] for x in combined]
    if len(combined)!=1133: errors.append("combined_count")
    if len(set(keys))!=len(keys): errors.append("duplicate_keys")
    if combined[:1105]!=current: errors.append("current_object_drift")

    cur_names=defaultdict(list);cur_src=defaultdict(list);cur_vec=defaultdict(list)
    for x in current:
        cur_names[norm(x.get("name_ru"))].append(x["key"])
        q=x.get("data_quality_v1_3") or {};rid=(q.get("source_registry_id"),str(q.get("source_record_id") or ""))
        if rid[0] and rid[1]: cur_src[rid].append(x["key"])
        cur_vec[tuple(x.get(f) for f in FIELDS)].append(x["key"])
    stage_vec=set()
    for x in stage:
        if norm(x.get("name_ru")) in cur_names: errors.append("ru_name_collision:"+x["key"])
        q=x["data_quality_v1_3"];rid=(q["source_registry_id"],str(q["source_record_id"]))
        if rid in cur_src: errors.append("source_collision:"+x["key"])
        vec=tuple(x.get(f) for f in FIELDS)
        if vec in cur_vec: errors.append("nutrient_vector_current:"+x["key"])
        if vec in stage_vec: errors.append("nutrient_vector_stage:"+x["key"])
        stage_vec.add(vec)
        if any(not isinstance(x.get(f),(int,float)) or isinstance(x.get(f),bool) for f in FIELDS+HEI): errors.append("non_numeric:"+x["key"])
        groups=x.get("nutrient_provenance_v1_3") or {};seen=[f for arr in groups.values() for f in arr]
        if len(seen)!=33 or set(seen)!=set(FIELDS): errors.append("provenance_coverage:"+x["key"])
        if x["data_quality_v1_3"].get("confidence_tier")!="MEDIUM": errors.append("tier:"+x["key"])
        if x["data_quality_v1_3"].get("review_status")!="CONDITIONALLY_ACCEPTED": errors.append("review_status:"+x["key"])
        if abs(x["salt"]-x["sodium_mg"]*2.54/1000)>1e-9: errors.append("salt_formula:"+x["key"])
    if len({norm(x.get("name_ru")) for x in stage})!=len(stage): errors.append("stage_name_collision")
    if any("SOURCE_REPORTED" in (x.get("nutrient_provenance_v1_3") or {}) for x in current): errors.append("source_reported_leaked_into_current")
    report={"policy_version":"external-food-staging-b2-v15","current_products":len(current),"staging_products":len(stage),
            "combined_preview_products":len(combined),"unique_keys":len(set(keys)),
            "current_source_id_collisions":sum(e.startswith("source_collision:") for e in errors),
            "current_exact_nutrient_vector_collisions":sum(e.startswith("nutrient_vector_current:") for e in errors),
            "errors":errors,"production_main_changed":False}
    json.dump(combined,open(out/"combined_catalog_preview_v15_b2.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)
    json.dump(report,open(out/"stage_b2_report.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if errors: raise SystemExit(1)
if __name__=="__main__": main()
