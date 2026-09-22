#!/usr/bin/env python3
from __future__ import annotations
import argparse,hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'config/validation-evidence-policy.v5.3.210-pc2.json';OUTS=[ROOT/'assets/data/validation-evidence-policy.v5.3.210-pc2.js',ROOT/'assets/legacy/data/validation-evidence-policy.v5.3.210-pc2.js']
def render():
 raw=SRC.read_bytes();p=json.loads(raw);d=hashlib.sha256(raw).hexdigest();payload=json.dumps(p,ensure_ascii=False,separators=(',',':'))
 text="/* Generated P2.0 validation evidence policy. Do not edit by hand. */\n(function(w){'use strict';var p="+payload+";if(Object.freeze){try{Object.freeze(p);}catch(_){}}w.NutritionValidationEvidenceP20={version:p.release_version,sourceSha256:'"+d+"',policy:p,status:function(){return {stageStatus:p.stage_status,labelRu:p.status_label_ru,claimAllowed:false};}};})(window);\n"
 return p,d,text
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');ap.add_argument('--json-out');a=ap.parse_args();p,d,t=render();stale=any((not o.exists()) or o.read_text()!=t for o in OUTS)
 if not a.check:
  for o in OUTS:o.parent.mkdir(parents=True,exist_ok=True);o.write_text(t);stale=False
 r={'ok':not stale,'version':p['release_version'],'sha256':d,'evidence_domains':len(p['evidence_model']),'stage_status':p['stage_status'],'stale':stale};print(json.dumps(r,ensure_ascii=False,indent=2))
 if a.json_out:Path(a.json_out).write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
 raise SystemExit(0 if r['ok'] else 1)
if __name__=='__main__':main()
