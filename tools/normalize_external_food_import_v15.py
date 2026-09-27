#!/usr/bin/env python3
from __future__ import annotations
import argparse, glob, json, re, unicodedata
from collections import Counter, defaultdict
from pathlib import Path

NUTRIENTS = [
"kcal","protein_per_100g","fat_per_100g","carbs_per_100g","sugar_per_100g","fiber_per_100g","sfa","unsat","added_sugar","salt",
"calcium_mg","iron_mg","magnesium_mg","phosphorus_mg","potassium_mg","sodium_mg","zinc_mg","copper_mg","manganese_mg","selenium_ug",
"vitamin_a_mcg","vitamin_e_mg","vitamin_d_mcg","vitamin_c_mg","vitamin_b1_mg","vitamin_b2_mg","vitamin_b3_mg","vitamin_b5_mg",
"vitamin_b6_mg","vitamin_b9_mcg","vitamin_b12_mcg","choline_mg","vitamin_k_mcg"
]
NAME_OVERRIDES = {
"carp":"Карп, сырой",
"perch":"Окунь, сырой (вид не уточнён)",
"rhubarb":"Ревень, сырой",
"spice thyme":"Тимьян свежий",
"lobster":"Омар северный, сырой",
"snapper":"Луциан (snapper), сырой",
"swordfish":"Рыба-меч, сырая",
"northern pike":"Щука обыкновенная, сырая",
"striped mullet":"Кефаль полосатая (лобан), сырая",
"channel catfish":"Канальный сом, выращенный, сырой",
"bean pinto solid":"Фасоль пинто, консервированная, с жидкостью, с низким содержанием натрия"
}

def norm(s):
    s=unicodedata.normalize("NFKC",str(s or "")).casefold().replace("ё","е")
    s=re.sub(r"[^\w]+"," ",s,flags=re.UNICODE)
    return re.sub(r"\s+"," ",s).strip()

def hei_key(h):
    if h["dairy_cup_eq_per_100g"]>0: return "dairy"
    if h["whole_fruit_cup_eq_per_100g"]>0 or h["fruit_cup_eq_per_100g"]>0: return "fruits"
    if h["whole_grain_oz_eq_per_100g"]>h["refined_grain_oz_eq_per_100g"] and h["whole_grain_oz_eq_per_100g"]>0: return "whole_grains"
    if h["refined_grain_oz_eq_per_100g"]>0: return "refined_grains"
    if h["seafood_plant_oz_eq_per_100g"]>0: return "seafood_plant_protein"
    if h["veg_cup_eq_per_100g"]>0: return "vegetables"
    return "other"

def category_tags_state(fk,source_name):
    sl=source_name.lower()
    if fk.startswith("cheese "): return "Dairy",["dairy","cheese","external_reference_v15"],"raw"
    if fk.startswith("oil "): return "Oils",["oil","culinary_fat","external_reference_v15"],"liquid_oil"
    if fk.startswith("spice "):
        st="raw" if "fresh" in sl else ("ground_dry" if any(w in sl for w in ["ground","powder","paprika","cinnamon","cloves","turmeric"]) else "dry")
        return "Spices and Herbs",["spice","external_reference_v15"],st
    if fk.startswith("flour "): return "Flour & Bran",["flour","dry_ingredient","external_reference_v15"],"dry"
    if fk.startswith("bean "): return "Legumes",["legume","mature_legume","external_reference_v15"],("canned" if "canned" in sl else "dry")
    if fk=="rhubarb": return "Fruits",["fruit","whole_fruit","external_reference_v15"],"raw"
    if fk in {"carp","perch","lobster","snapper","swordfish","northern pike","striped mullet","channel catfish"}:
        return "Seafood & Plant Protein",["seafood","protein_foods","external_reference_v15"],"raw"
    raise AssertionError("unmapped category "+fk)

def source_meta(member):
    rid=member["source_registry_id"]; rec=str(member["source_record_id"]); ds=member.get("source_dataset") or ""
    if rid=="USDA_FDC":
        return {"source_registry_id":rid,"source_id":"USDA_FDC:"+rec,"source_dataset":ds or "SR Legacy 2018",
                "source_version":"SR Legacy 04/2018" if "Legacy" in ds else ds,
                "source_url":"https://fdc.nal.usda.gov/food-details/"+rec+"/nutrients","source_record_id":rec}
    if rid=="HEALTH_CANADA_CNF":
        return {"source_registry_id":rid,"source_id":"CNF:"+rec,"source_dataset":ds or "Canadian Nutrient File 2026",
                "source_version":"CNF 2026","source_url":"https://food-nutrition.canada.ca/cnf-fce/","source_record_id":rec}
    raise AssertionError(rid)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--proposals",required=True)
    ap.add_argument("--members",required=True)
    ap.add_argument("--current-glob",required=True)
    ap.add_argument("--schema-extension",required=True)
    ap.add_argument("--out-dir",required=True)
    a=ap.parse_args()
    out=Path(a.out_dir);out.mkdir(parents=True,exist_ok=True)
    props=json.load(open(a.proposals,encoding="utf-8"))
    members=[json.loads(x) for x in open(a.members,encoding="utf-8") if x.strip()]
    midx={(m["source_registry_id"],str(m["source_record_id"])):m for m in members}
    ext=json.load(open(a.schema_extension,encoding="utf-8"))
    assert ext["nutrient_method_extension"]["SOURCE_REPORTED"]["production_status"]=="not_enabled"

    current=[]
    for p in sorted(glob.glob(a.current_glob)):
        current.extend(json.load(open(p,encoding="utf-8")))
    cur_keys={x["key"] for x in current}
    cur_names={norm(x.get("name_ru")) for x in current if x.get("name_ru")}

    ready=[x for x in props if x["status"]=="READY_FOR_STAGING_SCHEMA_PATCH"]
    safe=[];blocked=[]
    for x in ready:
        if x["family_key"]=="bean pinto":
            y=dict(x);y["stage_b1_block_reason"]="HEI_STATE_MISMATCH_DRY_VS_COOKED";blocked.append(y)
        else:safe.append(x)

    records=[];errors=[]
    for x in safe:
        fk=x["family_key"]; n=x["nutrients"]; h=dict(x["hei_equivalents"])
        if set(n)!=set(NUTRIENTS): errors.append("nutrient set "+fk);continue
        hp=dict(x.get("hei_equiv_provenance_import_v15") or {})
        if fk=="spice thyme":
            if any(float(v)!=0 for v in h.values()): errors.append("thyme nonzero HEI")
            hp={"status":"STRUCTURAL_ZERO","source":"product_identity",
                "note":"Fresh culinary herb; no HEI food-group equivalent credit in current calculator semantics. Dried FPID row is not used as exact provenance."}
        src=x["primary_source"]
        m=midx.get((src["source_registry_id"],str(src["source_record_id"])))
        if not m: errors.append("missing member "+fk);continue
        sm=source_meta(m)
        name_ru=NAME_OVERRIDES.get(fk,x["name_ru_import"]);key=x["product_key_proposed"]
        if key in cur_keys: errors.append("key collision "+key)
        if norm(name_ru) in cur_names: errors.append("name collision "+name_ru)
        cat,tags,state=category_tags_state(fk,src["source_name"])
        groups=defaultdict(list);detail={}
        for f in NUTRIENTS:
            v=n[f]
            if not isinstance(v,(int,float)) or isinstance(v,bool): errors.append("non numeric "+fk+":"+f);continue
            if f=="added_sugar": method="ASSUMED_ZERO"
            elif f in {"salt","unsat"}: method="CALCULATED"
            elif float(v)==0.0: method="SOURCE_REPORTED_ZERO"
            else: method="SOURCE_REPORTED"
            groups[method].append(f)
            detail[f]={"method":method,"source_registry_id":sm["source_registry_id"],"source_record_id":sm["source_record_id"]}
            if f=="salt": detail[f].update({"formula":"sodium_mg*2.54/1000"})
            elif f=="unsat": detail[f].update({"formula":"MUFA+PUFA from source components"})
            elif f=="added_sugar": detail[f]={"method":"ASSUMED_ZERO","reason":"plain_single_ingredient_identity; no direct added-sugar value used"}
        expected=n["sodium_mg"]*2.54/1000
        if abs(expected-n["salt"])>1e-9: errors.append("salt formula "+fk)
        if not 0<=n["kcal"]<=1000: errors.append("kcal range "+fk)
        for f in ["protein_per_100g","fat_per_100g","carbs_per_100g","sugar_per_100g","fiber_per_100g","sfa","unsat","added_sugar","salt"]:
            if not 0<=n[f]<=110: errors.append("macro range "+fk+":"+f)
        rec={"key":key,"name":src["source_name"],"name_ru":name_ru,"hei_category_key":hei_key(h),"category":cat,"tags":tags,"state":state}
        rec.update(n);rec.update(h)
        rec.update({
            "source_id":sm["source_id"],"source_dataset":sm["source_dataset"],"source_version":sm["source_version"],"source_url":sm["source_url"],
            "hei_equiv_provenance":hp,"hei_equiv_status":hp.get("status"),
            "hei_equiv_confidence":"HIGH" if hp.get("status")=="OFFICIAL_EXACT" else "MEDIUM",
            "hei_equiv_method":"FPID_OFFICIAL_EXACT" if hp.get("status")=="OFFICIAL_EXACT" else "STRUCTURAL_ZERO",
            "product_db_schema_version":"v5.3.210-p1.3+external-v15-staging",
            "data_quality_v1_3":{"schema_version":1,"policy_version":ext["policy_version"],"source_registry_id":sm["source_registry_id"],
                "source_kind":"PRIMARY_DATASET","source_id":sm["source_id"],"source_dataset":sm["source_dataset"],"source_version":sm["source_version"],
                "source_url":sm["source_url"],"source_record_id":sm["source_record_id"],"food_state":state,"confidence_tier":"MEDIUM",
                "confidence_score":ext["confidence"]["staging_product_score"],"review_status":"CONDITIONALLY_ACCEPTED",
                "reviewed_at":"2026-09-27","review_due_at":"2027-03-27","issues":["SOURCE_ACQUISITION_METHOD_NOT_NORMALIZED"],
                "assumed_zero_count":len(groups.get("ASSUMED_ZERO",[])),"missing_count":0},
            "nutrient_provenance_v1_3":{k:sorted(v) for k,v in sorted(groups.items())},
            "nutrient_provenance_detail_v15":detail,
            "external_import_v15":{"family_id":x["family_id"],"family_key":fk,"profile_id":x["selected_profile_id"],"profile_key":x["selected_profile_key"],"tier":x["tier"]},
            "nutrient_units_contract":"external-food-v15-canonical-units-v1"
        })
        if groups.get("ASSUMED_ZERO"): rec["unknown_zero_fields_v1_3"]=sorted(groups["ASSUMED_ZERO"])
        records.append(rec)

    if len(records)!=28: errors.append("expected 28 got "+str(len(records)))
    if len({r["key"] for r in records})!=len(records): errors.append("duplicate keys")
    if len({norm(r["name_ru"]) for r in records})!=len(records): errors.append("duplicate staging ru names")
    for r in records:
        seen=[f for arr in r["nutrient_provenance_v1_3"].values() for f in arr]
        if len(seen)!=33 or set(seen)!=set(NUTRIENTS): errors.append("provenance coverage "+r["key"])
        for f in NUTRIENTS:
            if r[f]==0 and not any(f in r["nutrient_provenance_v1_3"].get(m,[]) for m in ["SOURCE_REPORTED_ZERO","ASSUMED_ZERO","CALCULATED"]):
                errors.append("zero semantics "+r["key"]+":"+f)

    json.dump(records,open(out/"staging_products_v15_b1.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)
    json.dump(blocked,open(out/"blocked_semantic_state_v15_b1.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)
    report={"policy_version":"external-food-import-stage-b1-v15","input_ready_from_prep":len(ready),"staging_products":len(records),
            "semantic_state_blocked":len(blocked),"errors":errors,
            "method_counts":dict(Counter(m for r in records for m,arr in r["nutrient_provenance_v1_3"].items() for _ in arr)),
            "categories":dict(Counter(r["category"] for r in records)),"hei_categories":dict(Counter(r["hei_category_key"] for r in records)),
            "production_main_changed":False}
    json.dump(report,open(out/"stage_b1_report.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if errors: raise SystemExit(1)

if __name__=="__main__": main()
