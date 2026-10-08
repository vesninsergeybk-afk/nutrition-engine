#!/usr/bin/env python3
"""Step 4F: build a non-deployable compatibility preview from Step 4E only.

This script does NOT add anything to product shards or enable the SOURCE_REPORTED
method in production. Original products are copied verbatim into preview.
"""
from __future__ import annotations
import argparse, glob, json, re, unicodedata, math
from collections import Counter, defaultdict
from pathlib import Path

NUTRIENTS=[
"kcal","protein_per_100g","fat_per_100g","carbs_per_100g","sugar_per_100g","fiber_per_100g",
"sfa","unsat","added_sugar","salt","calcium_mg","iron_mg","magnesium_mg","phosphorus_mg",
"potassium_mg","sodium_mg","zinc_mg","copper_mg","manganese_mg","selenium_ug",
"vitamin_a_mcg","vitamin_e_mg","vitamin_d_mcg","vitamin_c_mg","vitamin_b1_mg",
"vitamin_b2_mg","vitamin_b3_mg","vitamin_b5_mg","vitamin_b6_mg","vitamin_b9_mcg",
"vitamin_b12_mcg","choline_mg","vitamin_k_mcg"]
HEI=[
"fruit_cup_eq_per_100g","whole_fruit_cup_eq_per_100g","veg_cup_eq_per_100g",
"greens_beans_cup_eq_per_100g","dairy_cup_eq_per_100g","whole_grain_oz_eq_per_100g",
"refined_grain_oz_eq_per_100g","protein_oz_eq_per_100g","seafood_plant_oz_eq_per_100g",
"added_sugars_tsp_eq_per_100g"]
NAME_OVERRIDES={
"carp":"Карп, сырой",
"perch":"Окунь, сырой (вид не уточнён)",
"rhubarb":"Ревень, сырой",
"spice thyme":"Тимьян свежий",
"lobster":"Омар северный, сырой",
"snapper":"Луциан, сырой (разные виды)",
"swordfish":"Рыба-меч, сырая",
"northern pike":"Щука обыкновенная, сырая",
"striped mullet":"Кефаль полосатая (лобан), сырая",
"channel catfish":"Канальный сом, выращенный, сырой",
"bean pinto solid":"Фасоль пинто, консервированная, с жидкостью, малосолёная",
"oil safflower":"Масло сафлоровое, высокоолеиновое",
"flour soy":"Мука соевая необезжиренная",
}
FISH={"carp","perch","lobster","snapper","swordfish","northern pike","striped mullet","channel catfish"}

def norm(s):
    s=unicodedata.normalize("NFKC",str(s or "")).casefold().replace("ё","е")
    return re.sub(r"\s+"," ",re.sub(r"[^\w]+"," ",s,flags=re.UNICODE)).strip()

def num(v):
    return type(v) in (int,float) and math.isfinite(v)

def hei_category(h):
    if h["dairy_cup_eq_per_100g"]>0:return "dairy"
    if h["whole_fruit_cup_eq_per_100g"]>0 or h["fruit_cup_eq_per_100g"]>0:return "fruits"
    if h["whole_grain_oz_eq_per_100g"]>h["refined_grain_oz_eq_per_100g"] and h["whole_grain_oz_eq_per_100g"]>0:return "whole_grains"
    if h["refined_grain_oz_eq_per_100g"]>0:return "refined_grains"
    if h["seafood_plant_oz_eq_per_100g"]>0:return "seafood_plant_protein"
    if h["veg_cup_eq_per_100g"]>0:return "vegetables"
    return "other"

def category_state(fk,source):
    name=source.lower()
    if fk.startswith("cheese "):return ("Dairy",["dairy","cheese"],"raw")
    if fk.startswith("oil "):return ("Oils",["oil","culinary_fat"],"liquid_oil")
    if fk.startswith("spice "):
        state="raw" if "fresh" in name else ("ground_dry" if any(a in name for a in ("ground","powder","paprika","cinnamon","cloves","turmeric")) else "dry")
        return ("Spices and Herbs",["spice"],state)
    if fk.startswith("flour "):return ("Flour & Bran",["flour","dry_ingredient"],"dry")
    if fk.startswith("bean "):
        return ("Legumes",["legume","mature_legume"],"canned" if "canned" in name else "dry")
    if fk=="rhubarb":return ("Fruits",["fruit","whole_fruit"],"raw")
    if fk in FISH:return ("Seafood & Plant Protein",["seafood","protein_foods"],"raw")
    raise ValueError("Unmapped family "+fk)

def source_url(s):
    if s["source_registry_id"]=="USDA_FDC":
        return "https://fdc.nal.usda.gov/food-details/"+str(s["source_record_id"])+"/nutrients"
    if s["source_registry_id"]=="HEALTH_CANADA_CNF":return "https://food-nutrition.canada.ca/cnf-fce/"
    raise ValueError("Unsupported source "+str(s))

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--proposals",required=True)
    ap.add_argument("--current-glob",required=True)
    ap.add_argument("--out-dir",required=True)
    a=ap.parse_args(); out=Path(a.out_dir);out.mkdir(parents=True,exist_ok=True)
    ps=json.loads(Path(a.proposals).read_text(encoding="utf-8"))
    current=[]
    for p in sorted(glob.glob(a.current_glob)):
        current.extend(json.loads(Path(p).read_text(encoding="utf-8")))
    errors=[]
    if len(current)!=1105:errors.append("main_current_count")
    if len(ps)!=32:errors.append("candidate_count")
    c_keys={x.get("key") for x in current}
    c_names={norm(x.get("name_ru")) for x in current}
    c_sources={(str((x.get("data_quality_v1_3") or {}).get("source_registry_id")),str((x.get("data_quality_v1_3") or {}).get("source_record_id"))) for x in current}
    existing_vectors={tuple(x.get(f) for f in NUTRIENTS) for x in current}
    new_keys=set();new_names=set();new_sources=set();new_vectors=set()
    methods=Counter();categories=Counter();stage=[]
    for p in ps:
        fk=p["family_key"]
        if p.get("step4e_status")!="PREVIEW_ONLY_REQUIRES_PRODUCTION_POLICY_GATE":
            errors.append("status_not_preview:"+fk)
        n=p["nutrients"];h=p.get("hei_equivalents") or {}
        prov=p.get("nutrient_provenance_final_v15") or {}
        if set(n)!=set(NUTRIENTS) or set(h)!=set(HEI) or set(prov)!=set(NUTRIENTS):
            errors.append("field_coverage:"+fk);continue
        if any(not num(v) for v in n.values()) or any(not num(v) for v in h.values()):
            errors.append("non_numeric:"+fk);continue
        src=p["primary_source"]
        state_name=src["source_name"]
        cat,tags,state=category_state(fk,state_name)
        key=p["product_key_proposed"];ru=NAME_OVERRIDES.get(fk,p["name_ru_import"])
        rid=(str(src["source_registry_id"]),str(src["source_record_id"]))
        if key in c_keys or key in new_keys:errors.append("key_collision:"+fk)
        if norm(ru) in c_names or norm(ru) in new_names:errors.append("name_collision:"+fk)
        if rid in c_sources or rid in new_sources:errors.append("source_collision:"+fk)
        new_keys.add(key);new_names.add(norm(ru));new_sources.add(rid)
        vec=tuple(n[f] for f in NUTRIENTS)
        if vec in existing_vectors or vec in new_vectors:errors.append("nutrient_vector_collision:"+fk)
        new_vectors.add(vec)
        if abs(n["salt"]-n["sodium_mg"]*2.54/1000)>1e-6:errors.append("salt_formula:"+fk)
        if n["kcal"]<0 or n["kcal"]>1000:errors.append("energy_range:"+fk)
        groups=defaultdict(list)
        for f in NUTRIENTS:
            info=prov[f];m=info.get("method");v=n[f]
            if m=="MISSING" or (m=="SOURCE_REPORTED_ZERO" and v!=0):
                errors.append("bad_provenance:"+fk+":"+f)
            if m=="SOURCE_REPORTED" and v==0:errors.append("false_source_zero:"+fk+":"+f)
            if m=="ASSUMED_ZERO" and (f!="added_sugar" or v!=0):errors.append("false_assumed_zero:"+fk+":"+f)
            if m not in {"SOURCE_REPORTED","SOURCE_REPORTED_ZERO","CALCULATED","ASSUMED_ZERO"}:
                errors.append("unsupported_method:"+fk+":"+f)
            groups[m].append(f);methods[m]+=1
        hp=p.get("hei_equiv_provenance_step4d_v15") or p.get("hei_equiv_provenance_import_v15") or {}
        if hp.get("status") not in {"OFFICIAL_EXACT","STRUCTURAL_ZERO"}:errors.append("unverified_hei:"+fk)
        rec={
          "key":key,"name":state_name,"name_ru":ru,
          "hei_category_key":hei_category(h),"category":cat,
          "tags":tags+["external_reference_v15","preview_only"],
          "state":state,
          "product_db_schema_version":"v5.3.210-p1.3+external-v15-preview-only",
          "source_id":src["source_registry_id"]+":"+str(src["source_record_id"]),
          "source_dataset":src.get("source_dataset"),
          "source_url":source_url(src),
          "data_quality_v1_3":{
            "source_registry_id":src["source_registry_id"],
            "source_record_id":str(src["source_record_id"]),
            "source_kind":"PRIMARY_DATASET",
            "review_status":"REVIEW_REQUIRED",
            "confidence_tier":"MEDIUM",
            "issues":["NOT_IMPORTABLE_TO_PRODUCTION","SOURCE_REPORTED_REQUIRES_POLICY_ADAPTATION"]
          },
          "nutrient_provenance_v1_3":{k:sorted(v) for k,v in groups.items()},
          "nutrient_provenance_detail_v15":prov,
          "hei_equiv_provenance":hp,
          "external_import_v15":{
            "family_id":p["family_id"],"family_key":fk,
            "profile_id":p["selected_profile_id"],"tier":p["tier"],
            "step4e_status":p["step4e_status"],"permission":"preview_only"
          }
        }
        rec.update(n);rec.update(h)
        if groups.get("ASSUMED_ZERO"):rec["unknown_zero_fields_v1_3"]=sorted(groups["ASSUMED_ZERO"])
        stage.append(rec);categories[cat]+=1
    if len(stage)!=32:errors.append("stage_count")
    combined=current+stage
    if len(combined)!=1137:errors.append("combined_count")
    if combined[:len(current)]!=current:errors.append("main_modified")
    if len({x["key"] for x in combined})!=len(combined):errors.append("duplicate_global_keys")
    if sum(methods.values())!=32*33:errors.append("incomplete_provenance")
    report={
     "status":"PASS" if not errors else "FAIL",
     "policy":"external-food-step4f-preview-only",
     "production_records_unchanged":len(current),
     "preview_cards":len(stage),"combined_preview_cards":len(combined),
     "new_categories":dict(categories),"new_provenance_methods":dict(methods),
     "not_production_importable":True,
     "production_main_changed":False,
     "errors":errors,
    }
    (out/"step4f_preview_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (out/"step4f_new_preview_products.json").write_text(json.dumps(stage,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (out/"step4f_combined_preview_catalog.json").write_text(json.dumps(combined,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if errors:raise SystemExit(1)

if __name__=="__main__":main()
