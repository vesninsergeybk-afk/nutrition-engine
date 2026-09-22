#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
report=json.loads((ROOT/'reports/stage-5a-stability-chromium.json').read_text(encoding='utf-8'))
checks=[]
def check(name,ok,detail=''):
    checks.append(bool(ok));print(('PASS' if ok else 'FAIL')+' '+name+((' — '+detail) if detail else ''))
check('evidence belongs to HF17',report.get('release_version')=='v5.3.210-rc2-hf17',str(report.get('release_version')))
check('stability evidence passed',report.get('passed') is True)
for key in ['steady_state_quiescence','route_and_fallback_soak','visibility_drift_repair','idempotent_refresh','synthetic_text_reflow_200_percent','corrupted_storage_fail_safe','query_parameter_preservation']:
    check(key,report.get('checks',{}).get(key,{}).get('passed') is True)
check('no browser runtime errors',not report.get('errors'),str(report.get('errors')))
print(json.dumps({'suite':'stage-5a-stability-evidence','assertions':len(checks),'failed':checks.count(False)},ensure_ascii=False,indent=2))
raise SystemExit(0 if all(checks) else 1)
