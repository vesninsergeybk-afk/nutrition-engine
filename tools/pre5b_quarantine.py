#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--classification',default='reports/stage-5b0-classification.json');ap.add_argument('--quarantine-root',required=True);ap.add_argument('--restore',action='store_true');args=ap.parse_args()
 data=json.loads((ROOT/args.classification).read_text(encoding='utf-8'))
 rows=[x for x in data['items'] if x['category']=='quarantine_high_confidence']
 qroot=Path(args.quarantine_root).resolve(); qroot.mkdir(parents=True,exist_ok=True)
 moved=[];missing=[];conflicts=[]
 for row in rows:
  src=(qroot/row['path']) if args.restore else (ROOT/row['path'])
  dst=(ROOT/row['path']) if args.restore else (qroot/row['path'])
  if not src.is_file(): missing.append(row['path']);continue
  if dst.exists(): conflicts.append(row['path']);continue
  dst.parent.mkdir(parents=True,exist_ok=True);shutil.move(str(src),str(dst));moved.append(row['path'])
 result={'ok':not missing and not conflicts,'operation':'restore' if args.restore else 'quarantine','planned':len(rows),'moved':len(moved),'missing':missing,'conflicts':conflicts,'quarantine_root':str(qroot)}
 out=ROOT/'reports'/('stage-5b0-restore.json' if args.restore else 'stage-5b0-quarantine.json');out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
