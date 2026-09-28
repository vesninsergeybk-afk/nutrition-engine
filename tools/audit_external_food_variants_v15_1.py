#!/usr/bin/env python3
import argparse,json,re,collections
from pathlib import Path

REQ={
 'fresh':r'\bfresh\b',
 'toasted':r'\btoasted\b',
 'stewed':r'\bstewed\b',
 'poached':r'\bpoached\b',
 'sauteed':r'\bsauteed\b|\bsautéed\b',
}

def requires(tag,name):
    if tag=='blanched':
        return bool(re.search(r'(?<!un)\bblanched\b',name,re.I))
    return bool(re.search(REQ[tag],name,re.I))

def load(path):
    out=[]
    with open(path,encoding='utf-8') as f:
        for line in f:
            if line.strip():
                out.append(json.loads(line))
    return out

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--before',required=True)
    ap.add_argument('--after',required=True)
    ap.add_argument('--report',required=True)
    a=ap.parse_args()
    before=load(a.before); after=load(a.after)
    errors=[]
    if len(before)!=len(after):
        errors.append(f'row_count {len(before)} != {len(after)}')
    key=lambda x:(x['family_id'],x['profile_id'],x['source_registry_id'],str(x['source_record_id']))
    bm={key(x):x for x in before}; am={key(x):x for x in after}
    if set(bm)!=set(am):
        errors.append('membership_identity_changed')
    immutable=['family_id','family_key','profile_id','profile_key','source_registry_id','source_dataset','source_record_id','source_name']
    for k in set(bm)&set(am):
        for field in immutable:
            if bm[k].get(field)!=am[k].get(field):
                errors.append(f'immutable_changed:{k}:{field}')
    misses=[]; tags=['fresh','toasted','stewed','poached','blanched','sauteed']
    counts=collections.Counter(); changed=0
    for k,x in am.items():
        sig=set((x.get('variant_signature') or '').split('|'))
        name=x.get('source_name') or ''
        if x.get('variant_signature_v15_original') is not None:
            changed+=1
        for t in tags:
            if requires(t,name):
                counts[t]+=1
                if t not in sig:
                    misses.append({'tag':t,'family_key':x['family_key'],'source_name':name,'signature':x.get('variant_signature')})
    if misses:
        errors.append(f'missing_required_variant_tags:{len(misses)}')
    report={'schema_version':1,'policy_version':'external-family-variant-v15.1','pass':not errors,'errors':errors,'rows':len(after),'changed_rows':changed,'required_tag_counts':dict(counts),'missing_examples':misses[:50]}
    Path(a.report).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    raise SystemExit(0 if not errors else 1)

if __name__=='__main__':
    main()
