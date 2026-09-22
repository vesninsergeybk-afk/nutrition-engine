#!/usr/bin/env python3
from __future__ import annotations
import argparse, collections, copy, hashlib, json, math, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
POLICY_PATH=ROOT/'config/product-provenance-policy.v5.3.210-p1.3.json'
SOURCE_REGISTRY_PATH=ROOT/'config/product-source-registry.v5.3.210-p1.3.json'
BASE_VERSION='v5.3.190'
OUT_VERSION='v5.3.210-p1.3'
REVIEWED_AT='2026-07-18'


def sha(data:bytes)->str: return hashlib.sha256(data).hexdigest()
def compact(obj)->bytes: return (json.dumps(obj,ensure_ascii=False,separators=(',',':'))+'\n').encode('utf-8')
def load_json(path:Path): return json.loads(path.read_text(encoding='utf-8'))

def source_text(p):
    fields=['source_id','source_dataset','source_version','source_exactness','nutrition_verification_status','nutrient_derivation_method_v5_3_68','verification_note','verification_note_v20','verification_note_v22','v20_match_reason']
    return ' '.join(str(p.get(k,'') or '') for k in fields).lower()

def concrete_primary(p,text):
    fdc=p.get('fdc_id') or re.search(r'\b(?:fdc|sr)[:_ -]?(\d{5,})\b',str(p.get('source_id','')),re.I)
    primary=bool(re.search(r'usda|fndds|fooddata|sr legacy|sr28|foundation|ciqual|cofid|frida|matvare|nzfcd|foodfiles',text))
    exact=bool(re.search(r'\bexact\b|exact_|_exact|official_source_transcription|revision_scoped_official_transcription|usda_reference_food_match|current_db_fdc_food_match',text))
    return primary and (bool(fdc) or exact)

def classify_source(p):
    text=source_text(p)
    old=(p.get('source_attribution_v5_3_68') or {})
    old_class=str(old.get('class','')).lower(); old_conf=str(old.get('confidence','')).upper()
    mixed=bool(re.search(r'label.*proxy|proxy.*label|brand.*proxy|macro.*micro|external.*proxy',text))
    recipe=bool(re.search(r'recipe|component[_ -]?sum|reverse[_ -]?recipe|ingredient',text))
    proxy=bool(re.search(r'proxy|analogue|analog|borrow|close[_ -]?food|logic_proxy',text))
    model=bool(re.search(r'model|imput|generic_component|canonical_profile|internal_logic',text))
    label=bool(re.search(r'label|manufacturer|retailer|official_store|sku',text))
    primary=concrete_primary(p,text)
    if mixed: kind='MIXED_SOURCE'; score=0.70
    elif primary and not proxy and not recipe: kind='PRIMARY_DATASET'; score=0.95
    elif label and not proxy and not recipe: kind='OFFICIAL_LABEL'; score=0.82
    elif recipe: kind='RECIPE_MODEL'; score=0.74 if ('source_backed' in text or 'usda' in text or 'fdc' in text) else 0.64
    elif proxy: kind='BORROWED_PROXY'; score=0.60
    elif model: kind='DERIVED_MODEL'; score=0.56
    elif re.search(r'external_source_declared|official',old_class+' '+text): kind='OFFICIAL_LABEL'; score=0.72
    elif p.get('source_id') and p.get('source_dataset'): kind='DERIVED_MODEL'; score=0.52
    else: kind='UNRESOLVED'; score=0.25
    if old_conf=='HIGH': score=max(score,0.84)
    elif old_conf=='MEDIUM': score=max(score,0.58)
    elif old_conf=='LOW': score=min(score,0.49)
    # Product-wide HIGH is reserved for concrete primary-dataset rows. Labels, recipes and
    # proxies may be strong for selected nutrients but cannot imply high confidence for all fields.
    if kind!='PRIMARY_DATASET': score=min(score,0.81)
    # Concrete source identity bonuses/penalties.
    if p.get('source_id') and p.get('source_dataset') and p.get('source_version'): score+=0.02
    if p.get('source_url'): score+=0.01
    if kind in {'OFFICIAL_LABEL','MIXED_SOURCE'} and not p.get('source_url'): score-=0.08
    if kind=='PRIMARY_DATASET' and not (p.get('fdc_id') or re.search(r'\d{4,}',str(p.get('source_id','')))): score-=0.08
    if kind!='PRIMARY_DATASET': score=min(score,0.81)
    score=max(0.05,min(0.99,score))
    tier='HIGH' if score>=0.82 else ('MEDIUM' if score>=0.55 else 'LOW')
    return kind,round(score,3),tier

def source_registry_id(p,kind):
    t=source_text(p)
    if 'fndds' in t: return 'USDA_FNDDS'
    if re.search(r'usda|fooddata|fdc|sr legacy|sr28|foundation',t): return 'USDA_FDC'
    if 'ciqual' in t: return 'ANSES_CIQUAL'
    if 'cofid' in t: return 'UK_COFID'
    if 'frida' in t: return 'FRIDA'
    if 'matvare' in t: return 'MATVARETABELLEN'
    if re.search(r'nzfcd|new zealand|foodfiles',t): return 'NZFCD'
    if kind in {'OFFICIAL_LABEL','MIXED_SOURCE'}: return 'OFFICIAL_LABEL'
    if kind=='RECIPE_MODEL': return 'INTERNAL_RECIPE_MODEL'
    return 'INTERNAL_PROXY_MODEL'

def base_method(kind,field,macro_fields):
    if kind=='PRIMARY_DATASET': return 'MEASURED'
    if kind=='OFFICIAL_LABEL': return 'LABEL' if field in macro_fields else 'MISSING'
    if kind=='RECIPE_MODEL': return 'CALCULATED'
    if kind=='BORROWED_PROXY': return 'BORROWED'
    if kind=='DERIVED_MODEL': return 'IMPUTED'
    if kind=='MIXED_SOURCE': return 'LABEL' if field in macro_fields else 'BORROWED'
    return 'IMPUTED'

def issue_scan(p,kind,nutrients):
    issues=[]
    if not p.get('state'): issues.append('MISSING_STATE')
    if not p.get('source_id'): issues.append('MISSING_SOURCE_ID')
    if not p.get('source_dataset'): issues.append('MISSING_SOURCE_DATASET')
    if not p.get('source_version'): issues.append('MISSING_SOURCE_VERSION')
    if kind in {'OFFICIAL_LABEL','MIXED_SOURCE'} and not p.get('source_url'): issues.append('LABEL_WITHOUT_STABLE_REFERENCE')
    vals={k:p.get(k) for k in nutrients}
    if any(not isinstance(v,(int,float)) or isinstance(v,bool) or not math.isfinite(float(v)) for v in vals.values()): issues.append('NON_NUMERIC_NUTRIENT')
    ptn=float(p.get('protein_per_100g') or 0); fat=float(p.get('fat_per_100g') or 0); carb=float(p.get('carbs_per_100g') or 0); kcal=float(p.get('kcal') or 0)
    if min(ptn,fat,carb,kcal)<0: issues.append('NEGATIVE_MACRO')
    if ptn+fat+carb>110: issues.append('MACRO_SUM_OVER_110G')
    macro_kcal=4*ptn+9*fat+4*carb
    tags=' '.join(str(x).lower() for x in (p.get('tags') or []))
    special_energy_basis=bool(float(p.get('fiber_per_100g') or 0)>=15 or re.search(r'spice|extract|isolated_fiber|technical_food_component|decomposition_component',tags))
    if kcal>0 and abs(kcal-macro_kcal)>max(35,0.22*kcal):
        issues.append('ENERGY_MACRO_FORMULA_NOT_APPLICABLE' if special_energy_basis else 'ENERGY_MACRO_LARGE_DELTA')
    sfa=float(p.get('sfa') or 0); unsat=float(p.get('unsat') or 0)
    if fat>=0 and sfa>fat+0.75: issues.append('SFA_EXCEEDS_TOTAL_FAT')
    if fat>=0 and unsat>fat+1.5: issues.append('UNSAT_EXCEEDS_TOTAL_FAT')
    sodium=float(p.get('sodium_mg') or 0); salt=float(p.get('salt') or 0)
    if salt>0 and sodium>0:
        expected=salt*393.4
        if abs(sodium-expected)>max(120,0.45*max(sodium,expected)): issues.append('SALT_SODIUM_INCONSISTENT')
    return sorted(set(issues))

def enrich(p,policy):
    p=copy.deepcopy(p)
    if not p.get('state') and (p.get('is_composite_food') is True or 'recipe' in source_text(p) or str(p.get('key','')).startswith('cmp_')):
        p['state']='recipe_model'
    nutrients=policy['nutrient_fields']; macro_fields=set(policy['macro_label_fields'])
    kind,score,tier=classify_source(p); registry_id=source_registry_id(p,kind)
    groups=collections.defaultdict(list); assumed=[]; missing=[]
    for field in nutrients:
        val=p.get(field)
        if val is None:
            method='MISSING'; missing.append(field)
        else:
            method=base_method(kind,field,macro_fields)
            if method=='MISSING' and isinstance(val,(int,float)):
                # A numeric value exists but the declared label does not cover this nutrient.
                method='IMPUTED'
            if isinstance(val,(int,float)) and float(val)==0.0:
                if kind=='PRIMARY_DATASET' or (kind=='OFFICIAL_LABEL' and field in macro_fields): method='SOURCE_REPORTED_ZERO'
                else: method='ASSUMED_ZERO'; assumed.append(field)
        groups[method].append(field)
    issues=issue_scan(p,kind,nutrients)
    if missing or any(x in issues for x in ['NON_NUMERIC_NUTRIENT','NEGATIVE_MACRO']): status='BLOCKED'
    elif kind=='UNRESOLVED' or tier=='LOW' or any(x in issues for x in ['MISSING_SOURCE_ID','MISSING_SOURCE_DATASET','MISSING_SOURCE_VERSION','ENERGY_MACRO_LARGE_DELTA','SFA_EXCEEDS_TOTAL_FAT','UNSAT_EXCEEDS_TOTAL_FAT']): status='REVIEW_REQUIRED'
    elif kind=='PRIMARY_DATASET' and tier=='HIGH' and not issues: status='VERIFIED'
    else: status='CONDITIONALLY_ACCEPTED'
    review_due='2027-07-18' if status=='VERIFIED' else ('2027-01-18' if status=='CONDITIONALLY_ACCEPTED' else '2026-10-18')
    p['product_db_schema_version']='v5.3.210-p1.3-product-provenance'
    p['data_quality_v1_3']={
      'schema_version':1,'policy_version':policy['policy_version'],'source_registry_id':registry_id,
      'source_kind':kind,'source_id':str(p.get('source_id') or ''),'source_dataset':str(p.get('source_dataset') or ''),
      'source_version':str(p.get('source_version') or ''),'source_url':str(p.get('source_url') or ''),
      'source_record_id':str(p.get('fdc_id') or p.get('source_record_id') or p.get('source_id') or ''),
      'food_state':str(p.get('state') or 'unspecified'),'confidence_tier':tier,'confidence_score':score,
      'review_status':status,'reviewed_at':REVIEWED_AT,'review_due_at':review_due,
      'issues':issues,'assumed_zero_count':len(assumed),'missing_count':len(missing)
    }
    p['nutrient_provenance_v1_3']={k:sorted(v) for k,v in sorted(groups.items()) if v}
    if assumed: p['unknown_zero_fields_v1_3']=sorted(assumed)
    elif 'unknown_zero_fields_v1_3' in p: del p['unknown_zero_fields_v1_3']
    return p

def build(write=True):
    policy=load_json(POLICY_PATH); source_registry=load_json(SOURCE_REGISTRY_PATH)
    chunks=[]; all_products=[]
    for i in range(1,13):
        src=ROOT/f'data/products.{BASE_VERSION}.part-{i:02d}.json'
        arr=load_json(src); enriched=[enrich(p,policy) for p in arr]
        chunks.append(enriched); all_products.extend(enriched)
    keys=[p.get('key') for p in all_products]
    if len(keys)!=len(set(keys)): raise SystemExit('duplicate product keys after migration')
    stats={
      'products':len(all_products),'source_kinds':collections.Counter(),'confidence_tiers':collections.Counter(),
      'review_statuses':collections.Counter(),'nutrient_methods':collections.Counter(),'issues':collections.Counter(),
      'assumed_zero_products':0,'assumed_zero_fields':0
    }
    for p in all_products:
        q=p['data_quality_v1_3']; stats['source_kinds'][q['source_kind']]+=1;stats['confidence_tiers'][q['confidence_tier']]+=1;stats['review_statuses'][q['review_status']]+=1
        for method,fields in p['nutrient_provenance_v1_3'].items(): stats['nutrient_methods'][method]+=len(fields)
        for issue in q['issues']: stats['issues'][issue]+=1
        n=len(p.get('unknown_zero_fields_v1_3') or []);stats['assumed_zero_fields']+=n;stats['assumed_zero_products']+=bool(n)
    manifest_chunks=[]
    for i,arr in enumerate(chunks,1):
        jrel=f'data/products.{OUT_VERSION}.part-{i:02d}.json'; jdata=compact(arr)
        jsrel=f'assets/data/products.{OUT_VERSION}.part-{i:02d}.js'
        js=('// Generated product chunk '+str(i)+' for '+OUT_VERSION+'; do not edit.\nwindow.__PRODUCT_SCRIPT_CHUNKS__ = window.__PRODUCT_SCRIPT_CHUNKS__ || [];\nwindow.__PRODUCT_SCRIPT_CHUNKS__['+str(i-1)+'] = '+json.dumps(arr,ensure_ascii=False,separators=(',',':'))+';\n').encode('utf-8')
        if write:
            (ROOT/jrel).write_bytes(jdata);(ROOT/jsrel).write_bytes(js)
        manifest_chunks.append({'json':jrel,'script':jsrel,'count':len(arr),'json_bytes':len(jdata),'json_sha256':sha(jdata),'script_bytes':len(js),'script_sha256':sha(js)})
    registry={
      'schema_version':1,'registry_version':OUT_VERSION,'generated_at':'2026-07-18T00:00:00Z',
      'policy_path':str(POLICY_PATH.relative_to(ROOT)),'source_registry_path':str(SOURCE_REGISTRY_PATH.relative_to(ROOT)),
      'baseline_version':BASE_VERSION,'products_count':len(all_products),'nutrient_fields':policy['nutrient_fields'],
      'method_relative_uncertainty':policy['method_relative_uncertainty'],
      'statistics':{k:(dict(sorted(v.items())) if isinstance(v,collections.Counter) else v) for k,v in stats.items()},
      'chunks':manifest_chunks,'sources':source_registry['sources']
    }
    rdata=(json.dumps(registry,ensure_ascii=False,sort_keys=True,indent=2)+'\n').encode('utf-8')
    if write:
        (ROOT/f'data/products.{OUT_VERSION}.manifest.json').write_text(json.dumps({'schema_version':'chunked-json-v2-provenance','app_version':OUT_VERSION,'products_count':len(all_products),'chunk_count':12,'chunks':manifest_chunks},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        (ROOT/f'data/product-provenance-registry.{OUT_VERSION}.json').write_bytes(rdata)
        jsreg=('/* Generated product provenance registry; do not edit. */\n(function(w){\'use strict\';w.__PRODUCT_PROVENANCE_REGISTRY__='+json.dumps(registry,ensure_ascii=False,separators=(',',':'))+';})(window);\n').encode('utf-8')
        (ROOT/f'assets/data/product-provenance-registry.{OUT_VERSION}.js').write_bytes(jsreg)
        (ROOT/'assets/legacy/data').mkdir(parents=True,exist_ok=True)
        (ROOT/f'assets/legacy/data/product-provenance-registry.{OUT_VERSION}.js').write_bytes(jsreg)
    return registry

def snapshot_outputs():
    names=[]
    for i in range(1,13): names += [ROOT/f'data/products.{OUT_VERSION}.part-{i:02d}.json',ROOT/f'assets/data/products.{OUT_VERSION}.part-{i:02d}.js']
    names += [ROOT/f'data/products.{OUT_VERSION}.manifest.json',ROOT/f'data/product-provenance-registry.{OUT_VERSION}.json',ROOT/f'assets/data/product-provenance-registry.{OUT_VERSION}.js',ROOT/f'assets/legacy/data/product-provenance-registry.{OUT_VERSION}.js']
    return {str(p.relative_to(ROOT)):p.read_bytes() for p in names if p.exists()}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');ap.add_argument('--json-out');args=ap.parse_args()
    before=snapshot_outputs();registry=build(write=True);after=snapshot_outputs();changed=before!=after
    result={'ok':True,'version':OUT_VERSION,'products':registry['products_count'],'statistics':registry['statistics'],'changed':changed}
    if args.json_out:
        p=Path(args.json_out);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))
    if args.check and changed: raise SystemExit('generated product provenance assets were stale')
if __name__=='__main__': main()
