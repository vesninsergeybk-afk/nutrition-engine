#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
report=json.loads((ROOT/'reports/stage-5a-chromium-acceptance.json').read_text(encoding='utf-8'))
checks=[]
def check(name,ok,detail=''):
    checks.append({'name':name,'passed':bool(ok),'detail':detail});print(('PASS' if ok else 'FAIL')+' '+name+((' — '+detail) if detail else ''))
check('evidence belongs to HF16',report.get('release_version')=='v5.3.210-rc2-hf16',str(report.get('release_version')))
check('stage 5A Chromium evidence passed',report.get('passed') is True)
check('ordinary workspace startup passed',report.get('checks',{}).get('ordinary_startup',{}).get('passed') is True)
check('query-only fallback roundtrip passed',report.get('checks',{}).get('fallback_roundtrip',{}).get('passed') is True)
check('direct query and retired aliases passed',report.get('checks',{}).get('direct_query_and_aliases',{}).get('passed') is True)
check('report print passed',report.get('checks',{}).get('report_print',{}).get('passed') is True)
rows=report.get('matrix_results',[])
check('all six viewports executed',len(rows)==6,str([x.get('viewport') for x in rows]))
check('all viewport checks passed',all(x.get('passed') for x in rows))
check('no browser runtime errors',not report.get('errors'),str(report.get('errors')))
check('PDF evidence exists',(ROOT/'reports/stage-5a-chromium-print.pdf').stat().st_size>10000)
failed=[x for x in checks if not x['passed']]
print(json.dumps({'suite':'stage-5a-chromium-evidence','assertions':len(checks),'failed':len(failed)},ensure_ascii=False,indent=2))
raise SystemExit(0 if not failed else 1)
