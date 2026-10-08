#!/usr/bin/env python3
"""Exploratory, cross-validated food nutrient imputation model (NOT production).

A future complete numerical dataset may mix real observations and imputed
estimates. This experiment assesses whether 1105 historical in-calculator
profiles predict held-out nutrients using similar food items; it documents
high error rather than forcing zeros or pretending model estimates measured.
"""
from __future__ import annotations
import argparse,random,json,math,re,statistics
from pathlib import Path
from collections import Counter,defaultdict
from difflib import SequenceMatcher

FEATURES=("protein_per_100g","fat_per_100g","carbs_per_100g","sfa","sugar_per_100g","fiber_per_100g")
CALCULATOR_FIELDS=("kcal protein_per_100g fat_per_100g carbs_per_100g sugar_per_100g fiber_per_100g sfa unsat added_sugar salt calcium_mg iron_mg magnesium_mg phosphorus_mg potassium_mg sodium_mg zinc_mg copper_mg manganese_mg selenium_ug vitamin_a_mcg vitamin_e_mg vitamin_d_mcg vitamin_c_mg vitamin_b1_mg vitamin_b2_mg vitamin_b3_mg vitamin_b5_mg vitamin_b6_mg vitamin_b9_mcg vitamin_b12_mcg choline_mg vitamin_k_mcg").split()
SKIP_PREDICTION={"added_sugar"} # recipe formulation and recipe-driven sugar exceptions
def load(p):return json.loads(Path(p).read_text(encoding="utf-8"))
def numeric(x):return isinstance(x,(int,float)) and not isinstance(x,bool) and math.isfinite(x) and x>=0
def norm(s):return " ".join(re.sub(r"[^a-z0-9]+"," ",str(s or "").lower()).split())
def symdiff(a,b):return abs(a-b)/max(1.,(abs(a)+abs(b))/2)
def distance(a,b):
    scores=[]
    for f in FEATURES:
        va,vb=a.get(f),b.get(f)
        if numeric(va) and numeric(vb):
            scores.append(abs(math.log1p(va)-math.log1p(vb)))
    if len(scores)<3:return float("inf")
    macro=sum(scores)/len(scores)
    da=norm(a.get("name") or a.get("name_ru") or a.get("family_key"))
    db=norm(b.get("name") or b.get("name_ru"))
    text=1-SequenceMatcher(None,da,db).ratio()
    return macro*.85+text*.15

def predict(target,peers,field):
    eligible=[]
    for p in peers:
        val=p.get(field)
        if numeric(val):
            d=distance(target,p)
            if math.isfinite(d):eligible.append((d,val,p))
    if len(eligible)<5:return None
    eligible.sort(key=lambda x:x[0])
    selected=eligible[:min(9,len(eligible))]
    w=[1/(.05+d) for d,_,_ in selected]
    mid=sum(w)/2
    running=0
    estimate=None
    for (dist,val,_),weight in sorted(zip(selected,w),key=lambda o:o[0][1]):
        running+=weight
        if running>=mid:
            estimate=val;break
    # Numeric estimate is NOT ground truth; report donor span instead of a
    # confidence interval (which requires calibrated probabilistic model).
    ordered=sorted(x[1] for x in selected)
    return {"estimate":estimate,"neighbor_count":len(selected),
        "donor_min":ordered[0],"donor_max":ordered[-1],
        "distance_nearest":round(selected[0][0],5),
        "source_keys":[str(p.get("key")) for _,_,p in selected],
        "method":"weighted_median_9_nearest_macro_and_name_in_same_category",
        "status":"UNVALIDATED_NUMERICAL_ESTIMATE"}

def group(text):
    t=str(text or "").lower()
    groups={
        "dairy":("cheese","milk","dairy","yogurt","кефир","сыр"),
        "spice":("spice","herb","sage","marjoram","pepper","cinnamon","шафран"),
        "oil":("oil","fat","жир","масло"),
        "fish":("fish","seafood","shellfish","shrimp","lobster","рыба"),
        "grain":("flour","grain","cereal","bread","мука","круп"),
        "legume":("bean","pea","legume","lentil","нут"),
        "seed":("seed","nut","coconut","кунжут","орех"),
        "meat":("meat","poultry","game","говядина")
    }
    for g,words in groups.items():
        if any(w in t for w in words):return g
    return "other"

def get_category(record):
    # Original calculator categories not identical to sources, map conservatively.
    return group(record.get("category") or record.get("hei_category_key") or record.get("name"))

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--manifest",required=True)
    ap.add_argument("--blocked",required=True)
    ap.add_argument("--out",required=True)
    ap.add_argument("--sample-size",type=int,default=240)
    a=ap.parse_args()
    manifest=load(a.manifest)
    products=[]
    for chunk in manifest["chunks"]:
        part=load(chunk["json"])
        assert len(part)==chunk["count"]
        products.extend(part)
    assert len(products)==1105 and len({p["key"] for p in products})==1105
    profiles=[p for p in products if all(numeric(p.get(f)) for f in CALCULATOR_FIELDS)]
    assert len(profiles)>750,len(profiles)
    classes=defaultdict(list)
    for p in profiles:classes[get_category(p)].append(p)
    eligible=[p for p in profiles if len(classes[get_category(p)])>=12]
    rng=random.Random(20261009);rng.shuffle(eligible)
    observed=eligible[:min(a.sample_size,len(eligible))]
    missing=load(a.blocked)
    # Restricted to actually absent fields, never overwrites catalog entries.
    wanted=[f for f in CALCULATOR_FIELDS if any(p["nutrients"][f] is None for p in missing)]
    measurements=defaultdict(list)
    validation_details=[]
    for t in observed:
        peers=[p for p in classes[get_category(t)] if p["key"]!=t["key"]]
        for field in wanted:
            if field in SKIP_PREDICTION:continue
            result=predict(t,peers,field)
            if result is None:continue
            truth=t[field];est=result["estimate"]
            # sAPE has bounded 0..2; no artificially huge MAPE on true zeros.
            sape=2*abs(truth-est)/(truth+est+0.01)
            measurements[field].append(sape)
            validation_details.append({"test_food":t["key"],"group":get_category(t),
                "field":field,"actual":truth,"estimate":est,
                "symmetric_absolute_percentage_error":round(sape,4)})
    field_metrics={}
    for f,errors in measurements.items():
        data=sorted(errors)
        field_metrics[f]={
            "n":len(data),
            "median_sym_absolute_pct_error":round(data[len(data)//2]*100,1),
            "p90_sym_absolute_pct_error":round(data[min(len(data)-1,int(len(data)*.9))]*100,1),
            "fit_for_source_replacement":False,
            "note":"These compare against existing product catalog, not independent chemical assays"}
    targets=[]
    predicted=0
    for p in missing:
        # Use key/source English name for similarity.
        t={"name":p["primary_source"]["source_name"],"family_key":p["family_key"],
           **p["nutrients"]}
        cat=group(p["family_key"])
        peers=classes.get(cat,[])
        found={}
        for f in CALCULATOR_FIELDS:
            if p["nutrients"][f] is not None:continue
            if f in SKIP_PREDICTION:
                found[f]={"status":"NO_RELIABLE_MODEL_PRODUCT_FORMULATION_UNKNOWN"}
                continue
            res=predict(t,peers,f)
            metric=field_metrics.get(f)
            if res:
                predicted+=1
                res["estimated_from_catalog_with_unverified_provenance"]=True
                res["heldout_median_pct_error"]=metric["median_sym_absolute_pct_error"] if metric else None
                res["not_authorized_for_clinical_use"]=True
                found[f]=res
            else:found[f]={"status":"NO_SAME_FOOD_CATEGORY_DONORS"}
        targets.append({"family_key":p["family_key"],"category":cat,
            "available_donors":len(peers),"unresolved_estimate_proposals":found})
    report={
        "status":"EXPLORATORY_VALIDATION_ONLY_NEVER_APPLY_AUTOMATICALLY",
        "source_note":"Historical 1105 live-catalog entries may have modeled data and are NOT a validated reference laboratory",
        "main_products_count":1105,"historically_numeric_complete_profiles":len(profiles),
        "categories":dict(Counter(get_category(x) for x in profiles)),
        "heldout_products":len(observed),
        "missing_original":sum(p["nutrients"][f] is None for p in missing for f in CALCULATOR_FIELDS),
        "numeric_model_suggestions":predicted,
        "field_metrics":field_metrics,
        "not_predictable_field":["added_sugar"],
        "suggestions":targets,
        "qa_rule":"Release numeric imputation only if field- and food-class validation against external laboratory values meets thresholds; otherwise leave estimate as exploratory",
        "runtime_product_changes":0,"scientifically_validated_imputations":0}
    out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
    (out/"imputation_heldout_quality_report.json").write_text(json.dumps({k:v for k,v in report.items() if k!="suggestions"},ensure_ascii=False,indent=2)+"\n")
    (out/"blocked56_research_only_provisional_numeric_estimates.json").write_text(json.dumps(targets,ensure_ascii=False,indent=2)+"\n")
    print("IMPUTATION_HELDOUT_SUMMARY",json.dumps({k:v for k,v in report.items() if k not in ("suggestions","field_metrics")},ensure_ascii=False))
    for field,metric in sorted(field_metrics.items()):
        print("IMPUTATION_FIELD_EVAL",field,json.dumps(metric,ensure_ascii=False))
if __name__=="__main__":main()
