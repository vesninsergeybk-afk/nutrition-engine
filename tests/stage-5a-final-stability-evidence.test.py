#!/usr/bin/env python3
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
report=json.loads((ROOT/'reports/stage-5a-final-stability-chromium.json').read_text(encoding='utf-8'))
checks=[]
def check(name,ok,detail=''):
    checks.append(bool(ok));print(('PASS' if ok else 'FAIL')+' '+name+((' — '+detail) if detail else ''))
check('evidence belongs to HF18',report.get('release_version')=='v5.3.210-rc2-hf18',str(report.get('release_version')))
check('final stability evidence passed',report.get('passed') is True)
for key in ['full_document_quiescence','profile_norm_idempotence','profile_observer_repair','norm_input_refresh','previous_navigation_stability']:
    check(key,report.get('checks',{}).get(key,{}).get('passed') is True)
check('no browser runtime errors',not report.get('errors'),str(report.get('errors')))
print(json.dumps({'suite':'stage-5a-final-stability-evidence','assertions':len(checks),'failed':checks.count(False)},ensure_ascii=False,indent=2))
raise SystemExit(0 if all(checks) else 1)
