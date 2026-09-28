#!/usr/bin/env python3
import argparse, json, re
from pathlib import Path

METHOD_PATTERNS = [
    ('boiled', r'\bboiled\b|\bsimmered\b'),
    ('baked', r'\bbaked\b'),
    ('roasted', r'\broasted\b'),
    ('toasted', r'\btoasted\b'),
    ('grilled', r'\bgrilled\b|\bbroiled\b|\bpan-broiled\b'),
    ('fried', r'\bfried\b|\bpan-fried\b|\bpan-browned\b|\bfast fried\b'),
    ('steamed', r'\bsteamed\b'),
    ('braised', r'\bbraised\b'),
    ('stewed', r'\bstewed\b'),
    ('poached', r'\bpoached\b'),
    ('blanched', r'(?<!un)\bblanched\b'),
    ('sauteed', r'\bsauteed\b|\bsautéed\b'),
    ('microwaved', r'\bmicrowaved\b|\bmicrowave\b'),
]

OTHER_PATTERNS = [
    ('fresh', r'\bfresh\b'),
    ('frozen', r'\bfrozen\b|\bdeep-frozen\b'),
    ('canned', r'\bcanned\b'),
    ('dried', r'\bdried\b|\bdehydrated\b'),
    ('smoked', r'\bsmoked\b'),
    ('pickled', r'\bpickled\b'),
    ('drained', r'\bdrained\b'),
    ('pasteurized', r'\bpasteurized\b'),
]

def enrich(sig: str, name: str) -> str:
    tags=set() if sig in ('',None,'unspecified') else set(sig.split('|'))
    low=(name or '').lower()
    for tag,pat in METHOD_PATTERNS:
        if re.search(pat, low, re.I):
            tags.add(tag)
    if re.search(r'\bcooked\b', low) and not any(t in tags for t,_ in METHOD_PATTERNS):
        tags.add('cooked')
    if re.search(r'\braw\b|\buncooked\b', low) and not any(t in tags for t,_ in METHOD_PATTERNS) and 'cooked' not in tags:
        tags.add('raw')
    for tag,pat in OTHER_PATTERNS:
        if re.search(pat, low, re.I):
            tags.add(tag)
    return '|'.join(sorted(tags)) if tags else 'unspecified'

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--members',required=True)
    ap.add_argument('--out',required=True)
    args=ap.parse_args()
    src=Path(args.members); out=Path(args.out); out.parent.mkdir(parents=True,exist_ok=True)
    changed=0; total=0
    with src.open(encoding='utf-8') as fi, out.open('w',encoding='utf-8') as fo:
        for line in fi:
            if not line.strip():
                continue
            x=json.loads(line); total+=1
            old=x.get('variant_signature') or 'unspecified'
            new=enrich(old,x.get('source_name') or '')
            if new!=old:
                x['variant_signature_v15_original']=old
                x['variant_signature']=new
                changed+=1
            fo.write(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n')
    print(json.dumps({'total':total,'changed':changed},ensure_ascii=False))

if __name__=='__main__':
    main()
