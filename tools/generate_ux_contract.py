#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'config/ux-decision-hierarchy.v5.3.210-p1.5.json'
OUT=ROOT/'assets/data/ux-decision-hierarchy.v5.3.210-p1.5.js'
LEGACY_OUT=ROOT/'assets/legacy/data/ux-decision-hierarchy.v5.3.210-p1.5.js'

def render():
    raw=SRC.read_bytes(); data=json.loads(raw.decode('utf-8'))
    if data.get('release_version')!='v5.3.210-p1.5': raise SystemExit('unexpected UX contract version')
    digest=hashlib.sha256(raw).hexdigest()
    payload=json.dumps(data,ensure_ascii=False,separators=(',',':'))
    text=("/* Generated P1.5 UX decision hierarchy. Do not edit by hand. */\n"
          "(function(w){'use strict';var c="+payload+";"
          "if(Object.freeze){try{Object.freeze(c);}catch(_){}}"
          "w.NutritionUxDecisionHierarchyP15={version:c.release_version,sourceSha256:'"+digest+"',contract:c};})(window);\n")
    return data,digest,text

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');ap.add_argument('--json-out');args=ap.parse_args()
    data,digest,text=render()
    stale=any((not out.exists()) or out.read_text(encoding='utf-8')!=text for out in (OUT,LEGACY_OUT))
    if not args.check:
        for out in (OUT,LEGACY_OUT):
            out.parent.mkdir(parents=True,exist_ok=True);out.write_text(text,encoding='utf-8')
        stale=False
    result={'ok':not stale,'version':data['release_version'],'sha256':digest,'stages':len(data['stages']),'decision_rules':len(data['decision_rules']),'stale':stale}
    print(json.dumps(result,ensure_ascii=False,indent=2))
    if args.json_out:
        out=Path(args.json_out);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__': main()
