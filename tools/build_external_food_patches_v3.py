#!/usr/bin/env python3
"""Build a reproducible 56-product nutrient patch staging catalog from source manifests.

Maintains field-level evidence and prohibits silent null=0 assumptions.
The staging output never updates runtime. Every non-empty field is frozen.
"""
from __future__ import annotations
import argparse,copy,json
from pathlib import Path
def read(p):return json.loads(Path(p).read_text(encoding="utf-8"))
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--blocked",required=True)
    ap.add_argument("--manifest-dir",required=True)
    ap.add_argument("--out",required=True)
    a=ap.parse_args()
    original=read(a.blocked)
    assert len(original)==56
    patched=copy.deepcopy(original)
    manifests=[read(p) for p in sorted(Path(a.manifest_dir).glob("*.json"))]
    assert len(manifests)>=3, "Require at least three source records"
    allowed={
       ("flour spelt","vitamin_b9_mcg"):("USDA_FDC",2003587,38.4),
       ("spice saffron","sugar_per_100g"):("UK_COFID","13-852",42.4),
       ("flour arrowroot","selenium_ug"):("AUSTRALIA_AFCD","F003983",0),
       ("zander","selenium_ug"):("SWEDEN_SLV",1263,22.6),
       ("flour buckwheat","vitamin_c_mg"):("SWEDEN_SLV",1930,0),
       ("flour barley","selenium_ug"):("FRANCE_CIQUAL","9550",1.0),
       ("flour buckwheat","selenium_ug"):("NORWAY_MATTILSYNET","05.132",3.0)
    }
    assert len(manifests)==len(allowed),"Unreviewed extra patch requires explicit admission"
    list_changed=[]
    for manifest in manifests:
       fk=manifest["family_key"];field=manifest["recovery"]["field"]
       key=(fk,field)
       assert key in allowed,key
       registry,record_id,expected=allowed[key]
       x=manifest["recovery"]
       assert x["previous_value"] is None and x["value"]==expected
       p=next(z for z in patched if z["family_key"]==fk)
       assert p["nutrients"][field] is None
       oldprov=p["nutrient_provenance_final_v15"][field]
       assert oldprov["method"]=="MISSING"
       if fk=="flour spelt":
           assert str(p["primary_source"]["source_record_id"])=="2003587"
           assert str(manifest["source"]["fdc_id"])=="2003587"
           method="SOURCE_REPORTED"
           source_dataset=manifest["source"]["dataset"]+" "+manifest["source"]["release"]
           scientist_review="OFFICIAL_PRIMARY_RECORD_ANALYTICAL"
       elif fk=="spice saffron":
           assert str(p["primary_source"]["source_record_id"])=="170934"
           assert manifest["source_donor"]["food_code"]=="13-852"
           method="SOURCE_REPORTED"
           source_dataset=manifest["source_donor"]["dataset"]
           scientist_review="CROSS_DATASET_MATCH_SCIENTIFIC_REVIEW_REQUIRED"
       elif fk=="flour arrowroot":
           assert p["primary_source"]["source_registry_id"]=="GERMANY_BLS"
           assert str(p["primary_source"]["source_record_id"])=="K550000"
           assert manifest["source_donor"]["food_key"]=="F003983"
           method="SOURCE_REPORTED_ZERO"
           source_dataset=manifest["source_donor"]["dataset"]
           scientist_review="REPORTED_ZERO_REPORTING_LIMIT_SCIENTIFIC_REVIEW_REQUIRED"
       elif fk=="zander" or (fk=="flour buckwheat" and field=="vitamin_c_mg"):
           assert p["primary_source"]["source_registry_id"]=="GERMANY_BLS"
           expected_primary_id="T603100" if fk=="zander" else "C424000"
           assert str(p["primary_source"]["source_record_id"])==expected_primary_id
           assert manifest["source_donor"]["food_number"]==record_id
           method=manifest["recovery"]["method"]
           source_dataset="Swedish Food Agency / Livsmedelsdatabasen 2026"
           scientist_review=("INDEPENDENT_LAB_RAW_FISH" if fk=="zander"
              else "SOURCE_LOGICALLY_DEDUCED_ZERO")
       elif fk=="flour barley":
           assert str(p["primary_source"]["source_record_id"])=="C243000"
           assert manifest["source_donor"]["food_number"]=="9550"
           assert manifest["source_donor"]["data_file_md5"]=="0d9758ce23f3f13dd63a005bc1bb4f2c"
           method="PUBLISHED_CROSS_SOURCE"
           source_dataset="ANSES French Ciqual 2025"
           scientist_review="FOOD_NAME_AND_MACRO_PARITY_MATCHED_ANALYTICAL_METHOD_REVIEW_REQUIRED"
       elif fk=="flour buckwheat":
           assert str(p["primary_source"]["source_record_id"])=="C424000"
           assert manifest["source_donor"]["norway_food_id"]=="05.132"
           assert manifest["source_donor"]["source_sha256"]=="91af92552975dcb259735e833639f8aacd7cf4674b5c7321e7271224000c247c"
           method="SOURCE_REPORTED"
           source_dataset="Norwegian Food Composition Table 2026, provenance 611a"
           scientist_review="EXACT_SOURCE_NORWAY_SELENIUM_REGION_VARIABILITY"
       else:
           raise AssertionError("Unreviewed family profile "+fk)
       p["nutrients"][field]=expected
       p["nutrient_provenance_final_v15"][field]={
           "method":method,"source_registry_id":registry,"source_record_id":str(record_id),
           "source_dataset":source_dataset,
           "source_manifest_path":str(Path(a.manifest_dir)/next(k.name for k in Path(a.manifest_dir).glob("*.json") if read(k)["family_key"]==fk)),
           "scientific_review":scientist_review,
           "status":"STAGING_ONLY_NEVER_IMPORT_WITHOUT_SCIENTIFIC_REVIEW"
       }
       p["missing_nutrients"]=[f for f in p["missing_nutrients"] if f!=field]
       p.setdefault("nutrient_field_recovery_2026",[]).append({"field":field,"value":expected,"status":scientist_review})
       list_changed.append({"family_key":fk,"field":field,"value":expected,"source":registry+":"+str(record_id),"method":method,"science_status":scientist_review})
    diffs=[]
    for p0,p1 in zip(original,patched):
        assert p0["family_key"]==p1["family_key"]
        assert p0["primary_source"]==p1["primary_source"]
        assert p0.get("hei_equivalents")==p1.get("hei_equivalents")
        for f,v in p0["nutrients"].items():
            if p1["nutrients"][f]!=v:
                assert v is None and (p0["family_key"],f) in allowed
                diffs.append((p0["family_key"],f))
    assert len(diffs)==7,diffs
    before=sum(v is None for p in original for v in p["nutrients"].values())
    after=sum(v is None for p in patched for v in p["nutrients"].values())
    assert before==179 and after==172
    assert sum(p["nutrients"]["choline_mg"] is None for p in patched)==41
    assert sum(p.get("hei_equivalents") is None for p in patched)==28
    assert sum("MISSING_CALCULATOR_NUTRIENTS" in p["issues_after_step4d"] for p in patched)==52
    out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
    (out/"blocked56_source_recovered7_staging_only.json").write_text(json.dumps(patched,ensure_ascii=False,indent=2)+"\n")
    report={
        "status":"PASS_STAGING_NOT_SCIENTIFIC_PUBLICATION_APPROVAL",
        "source_verified_observations":7,"field_changes":list_changed,
        "unfilled_nutrient_fields_before":179,"unfilled_nutrient_fields_after":172,
        "hei_unresolved_profiles":28,"blocked_profiles":56,
        "all_preexisting_nutrients_unchanged":True,
        "runtime_changes":0,"production_ready":False
    }
    (out/"field_recovery_seven_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print("RECONSTRUCTED_NUTRIENT_STAGING",json.dumps(report,ensure_ascii=False))
if __name__=="__main__":
    main()
