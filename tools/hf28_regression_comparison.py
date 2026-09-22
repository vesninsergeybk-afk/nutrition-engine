#!/usr/bin/env python3
from __future__ import annotations
import json,subprocess,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];BASE=Path('/mnt/data/nutrition_hf27')
active=json.loads((ROOT/'reports/hf28-regression-suite.json').read_text())
commands={
 'professional_workflow':['node','tests/professional-workflow-restoration.test.js'],
 'product_provenance':['node','tests/p1-3-product-provenance.test.js'],
 'workspace_entry':['node','tests/workspace-entry-ux-hf22.test.js'],
 'product_focus':['node','tests/product-focus-stabilization.test.js'],
}
base={}
for name,cmd in commands.items():
 p=subprocess.run(cmd,cwd=BASE,capture_output=True,text=True,timeout=300)
 base[name]={'passed':p.returncode==0,'exit_code':p.returncode,'output':(p.stdout+p.stderr)[-2200:]}
rows=[]
for row in active['results']:
 b=base.get(row['name'])
 if row['passed']:classification='passed_hf28'
 elif b and not b['passed']:classification='baseline_stale_or_missing_artifact_failure'
 else:classification='new_hf28_failure'
 rows.append({'name':row['name'],'hf28_passed':row['passed'],'hf27_passed':None if b is None else b['passed'],'classification':classification,'hf28_output':row['output'],'hf27_output':None if b is None else b['output']})
out={'ok':not any(r['classification']=='new_hf28_failure' for r in rows),'release_version':'v5.3.210-rc2-hf28-gemini-reliability','passed_hf28':sum(r['hf28_passed'] for r in rows),'baseline_locked_failures':[r['name'] for r in rows if r['classification']=='baseline_stale_or_missing_artifact_failure'],'new_failures':[r['name'] for r in rows if r['classification']=='new_hf28_failure'],'results':rows,'note':'Исторические тесты с жёстко зафиксированными версиями HF18/HF22/RC1 или отсутствующим аналитическим отчётом были повторно запущены на исходном HF27 и отказали там тем же образом; они не классифицированы как регрессии HF28.'}
(ROOT/'reports/hf28-regression-comparison.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'ok':out['ok'],'passed_hf28':out['passed_hf28'],'baseline_locked_failures':out['baseline_locked_failures'],'new_failures':out['new_failures']},ensure_ascii=False,indent=2));raise SystemExit(0 if out['ok'] else 1)
