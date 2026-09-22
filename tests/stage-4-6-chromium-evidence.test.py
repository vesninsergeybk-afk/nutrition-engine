#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(name,ok,detail=''):
    checks.append({'name':name,'passed':bool(ok),'detail':detail})
    print(f"{'PASS' if ok else 'FAIL'} {name}{': '+detail if detail else ''}")

report=json.loads((ROOT/'reports/stage-4-6-chromium-acceptance.json').read_text(encoding='utf-8'))
journey=report.get('daily_journey',{})
matrix=report.get('matrix_results',[])
expected=[[360,800],[390,844],[430,932],[768,1024],[1366,768],[1440,900]]

check('evidence belongs to HF15',report.get('release_version')=='v5.3.210-rc2-hf15',str(report.get('release_version')))
check('system Chromium acceptance passed',report.get('passed') is True,str(report.get('engine')))
check('daily working journey passed',journey.get('passed') is True)
check('five sequential products were added',len(journey.get('adds',[]))==5,str(len(journey.get('adds',[]))))
check('every add preserved route, query, focus and visible context',all(all(row.get('checks',{}).get(k) for k in ('route_preserved','query_preserved','focus_preserved','search_context_preserved','state_incremented','focus_not_covered','no_horizontal_overflow')) for row in journey.get('adds',[])))
check('explicit ration action met 44 px target',all(row.get('checks',{}).get('toast_action_visible') and row.get('checks',{}).get('toast_target_44px') for row in journey.get('adds',[])))
check('grams editing changed ration state',journey.get('editing',{}).get('state_changed') is True)
routes=journey.get('routes',{})
history_ok=(routes.get('after_back')=='analysis/overview' if routes.get('history_supported_in_test_context') else routes.get('after_back')=='PENDING_EXTERNAL_URL_CONTEXT' and routes.get('route_after_explicit_restore')=='analysis/overview')
check('browser history is verified where URL history exists, otherwise explicitly pending',history_ok,str(routes.get('after_back')))
check('correction applied and exact undo restored state',journey.get('correction',{}).get('applied') is True and journey.get('correction',{}).get('restored') is True)
check('canonical report preserved ration parity',journey.get('report',{}).get('model') is True and journey.get('report',{}).get('item_count')==journey.get('report',{}).get('state_count'))
check('print controls were hidden and PDF was generated',journey.get('report',{}).get('print_nav_hidden') is True and journey.get('report',{}).get('pdf_bytes',0)>10000,str(journey.get('report',{}).get('pdf_bytes')))
check('full viewport matrix passed',report.get('viewport_matrix')==expected and len(matrix)==len(expected) and all(row.get('passed') for row in matrix))

failed=[row for row in checks if not row['passed']]
print(json.dumps({'suite':'stage-4-6-chromium-evidence','assertions':len(checks),'failed':len(failed)},ensure_ascii=False,indent=2))
raise SystemExit(1 if failed else 0)
