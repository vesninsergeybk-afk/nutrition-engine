#!/usr/bin/env python3
from __future__ import annotations
import argparse, datetime as dt, json, os, re, shutil, subprocess, sys, time
from pathlib import Path
from validate_external_evidence import validate_file as validate_external_evidence_file
ROOT=Path(__file__).resolve().parents[1]
REPORTS=ROOT/'reports'
RELEASE=ROOT/'release'
VERSION='v5.3.210-rc2-hf19'
PLAYWRIGHT_BIN=str(ROOT/'node_modules'/'.bin'/'playwright')

def suite_commands(profile):
    py=sys.executable
    suites=[
      ('professional_workflow_restoration',['node','tests/professional-workflow-restoration.test.js']),
      ('validation_policy_generated',[py,'tools/generate_validation_package.py','--check','--json-out','reports/p2-0-generation-check.json']),
      ('validation_readiness_analytics',[py,'tools/analyze_validation_readiness.py','--json-out','reports/p2-0-analytics.json']),
      ('validation_readiness',['node','tests/p2-0-validation-readiness.test.js']),
      ('external_evidence_gate',[py,'tests/p2-0-external-evidence-gate.test.py']),
      ('ux_contract_generated',[py,'tools/generate_ux_contract.py','--check','--json-out','reports/p1-5-generation-check.json']),
      ('formula_registry_generated',[py,'tools/generate_formula_registry.py','--check','--json-out','reports/p1-4-generation-check.json']),
      ('formula_registry_analytics',[py,'tools/analyze_formula_registry.py','--json-out','reports/p1-4b-analytics.json']),
      ('formula_registry',['node','tests/p1-4-formula-registry.test.js']),
      ('hei2020_hf3',['node','tests/hei2020-hf3.test.js']),
      ('product_provenance_generated',[py,'tools/generate_product_provenance.py','--check','--json-out','reports/p1-3-generation-check.json']),
      ('product_provenance_analytics',[py,'tools/analyze_product_provenance.py','--json-out','reports/p1-3b-analytics.json']),
      ('product_provenance',['node','tests/p1-3-product-provenance.test.js']),
      ('normative_registry_generated',[py,'tools/generate_normative_registry.py','--check']),
      ('normative_registry',['node','tests/p1-2-normative-registry.test.js']),
      ('runtime_generated',[py,'tools/generate_runtime_assets.py','--check','--json-out','reports/runtime-generated.json']),
      ('runtime_inventory',[py,'tools/runtime_inventory.py','--json-out','reports/runtime-inventory.json']),
      ('runtime_consolidation',[py,'tests/p1-1-runtime-consolidation.test.py']),
      ('navigation_shell',['node','tests/navigation-shell-parallel.test.js']),
      ('workspace_ration_overview',['node','tests/workspace-ration-overview-hf6.test.js']),
      ('workspace_analysis_detail',['node','tests/workspace-analysis-detail-hf7.test.js']),
      ('workspace_profile_needs',['node','tests/workspace-profile-needs-hf8.test.js']),
      ('workspace_correction',['node','tests/workspace-correction-hf11.test.js']),
      ('workspace_correction_behavior',['node','tests/workspace-correction-hf11-behavior.test.js']),
      ('workspace_correction_stage3b',['node','tests/workspace-correction-stage3b-hf12.test.js']),
      ('workspace_correction_stage3b_behavior',['node','tests/workspace-correction-stage3b-hf12-behavior.test.js']),
      ('workspace_report',['node','tests/workspace-report-hf13.test.js']),
      ('workspace_report_behavior',['node','tests/workspace-report-hf13-behavior.test.js']),
      ('stage_4_5_architecture_acceptance',['node','tests/stage-4-5-architecture-acceptance.test.js']),
      ('stage_4_6_daily_cycle',['node','tests/stage-4-6-daily-cycle.test.js']),
      ('stage_4_6_chromium_evidence',[py,'tests/stage-4-6-chromium-evidence.test.py']),
      ('stage_5a_unified_interface',['node','tests/stage-5a-unified-interface.test.js']),
      ('stage_5a_chromium_evidence',[py,'tests/stage-5a-chromium-evidence.test.py']),
      ('stage_5a_stability',['node','tests/stage-5a-stability.test.js']),
      ('stage_5a_stability_evidence',[py,'tests/stage-5a-stability-evidence.test.py']),
      ('stage_5a_final_stability',['node','tests/stage-5a-final-stability.test.js']),
      ('stage_5a_final_stability_evidence',[py,'tests/stage-5a-final-stability-evidence.test.py']),
      ('static_integrity',[py,'tools/static_checks.py','--json-out','reports/static-checks.json']),
      ('low_weight',['node','tests/p0-2-low-weight-safety.test.js']),
      ('protected_modes',['node','tests/p0-3-protected-modes.test.js']),
      ('legacy_fail_closed',['node','tests/p0-3-legacy-fail-closed.test.js']),
      ('clinical_revalidation',['node','tests/p0-3-2-1-independent-revalidation.test.js']),
      ('dom_state_regression',[py,'tests/p0-3-2-1-browser-dom-regression.py']),
      ('server_guard',['php','tests/p0-4-api-cost-abuse-guard.test.php']),
      ('cross_process',['node','tests/p0-4-cross-process-guard.test.js']),
      ('client_guard',['node','tests/p0-4-client-guard-stability.test.js']),
      ('http_csrf',[py,'tests/p0-4-1-http-session-csrf.test.py']),
      ('storage_policy',[py,'tests/p0-4-1-storage-policy.test.py']),
      ('version_consistency',[py,'tests/p0-4-1-version-consistency.test.py']),
      ('hosting_check',['node','tests/p0-4-1-hosting-check.test.js']),
      ('permissions',[py,'tests/p0-4-1-permissions.test.py']),
      ('apache_source',['bash','tests/p0-4-1-apache-staging.test.sh']),
    ]
    if profile in {'quick','full','release'}:
      evidence_index=next((i for i,(name,_) in enumerate(suites) if name=='stage_5a_stability_evidence'),len(suites))
      suites.insert(evidence_index,('stage_5a_stability_chromium',[py,'tools/stage_5a_stability_chromium.py','--chromium','/usr/bin/chromium','--json-out','reports/stage-5a-stability-chromium.json']))
      final_evidence_index=next((i for i,(name,_) in enumerate(suites) if name=='stage_5a_final_stability_evidence'),len(suites))
      suites.insert(final_evidence_index,('stage_5a_final_stability_chromium',[py,'tools/stage_5a_final_stability_chromium.py','--chromium','/usr/bin/chromium','--json-out','reports/stage-5a-final-stability-chromium.json']))
    browser_specs=[('release_gate','tests/e2e/release-gate.spec.js'),('formula_registry','tests/e2e/p1-4-formula-golden.spec.js'),('professional_workflow','tests/e2e/professional-workflow-restoration.spec.js'),('hei2020_hf3_ux','tests/e2e/hei2020-hf3-ux.spec.js'),('navigation_shell','tests/e2e/navigation-shell-parallel.spec.js'),('workspace_ration_overview','tests/e2e/workspace-ration-overview-hf6.spec.js'),('workspace_correction','tests/e2e/workspace-correction-hf11.spec.js'),('workspace_correction_stage3b','tests/e2e/workspace-correction-stage3b-hf12.spec.js'),('workspace_report','tests/e2e/workspace-report-hf13.spec.js'),('stage_4_5_architecture_acceptance','tests/e2e/stage-4-5-architecture-acceptance.spec.js'),('stage_4_6_daily_cycle','tests/e2e/stage-4-6-daily-cycle.spec.js'),('stage_5a_unified_interface','tests/e2e/stage-5a-unified-interface.spec.js'),('stage_5a_stability','tests/e2e/stage-5a-stability.spec.js')]
    analysis_detail_cases=[
      ('workspace_analysis_nutrients','nutrient detail shows actual'),
      ('workspace_analysis_hei','HEI detail keeps score'),
      ('workspace_analysis_deep_link','overview priority opens the exact'),
      ('workspace_analysis_incomplete','incomplete ration gives one completion'),
    ]
    if profile in {'full','release'}:
      for suffix,spec in browser_specs:
        suites.append((f'browser_chromium_{suffix}',[PLAYWRIGHT_BIN,'test','--project=chromium',spec,'--retries=0','--timeout=90000','--reporter=line']))
      for suffix,pattern in analysis_detail_cases:
        suites.append((f'browser_chromium_{suffix}',[PLAYWRIGHT_BIN,'test','--project=chromium','tests/e2e/workspace-analysis-detail-hf7.spec.js','--grep',pattern,'--retries=0','--timeout=90000','--reporter=line']))
    elif profile=='ci':
      for project in ('chromium','firefox','webkit'):
        for suffix,spec in browser_specs:
          suites.append((f'browser_{project}_{suffix}',[PLAYWRIGHT_BIN,'test',f'--project={project}',spec,'--retries=1','--timeout=90000','--reporter=line']))
        for suffix,pattern in analysis_detail_cases:
          suites.append((f'browser_{project}_{suffix}',[PLAYWRIGHT_BIN,'test',f'--project={project}','tests/e2e/workspace-analysis-detail-hf7.spec.js','--grep',pattern,'--retries=1','--timeout=90000','--reporter=line']))
    return suites

def assertion_count(output):
    grouped=[int(x) for x in re.findall(r'^.+?:\s*PASS\s*\((\d+)\)\s*$',output,re.I|re.M)]
    if len(grouped)>1: return sum(grouped)
    candidates=[]
    for pattern in [r'"assertions"\s*:\s*(\d+)',r'assertions[=:]\s*(\d+)',r'(\d+)\s+passed']:
      candidates += [int(x) for x in re.findall(pattern,output,re.I)]
    return max(candidates) if candidates else (grouped[0] if grouped else 1)

def run_suite(name,cmd,env=None,timeout=360):
    start=time.time(); log=REPORTS/f'{name}.log'
    merged=os.environ.copy()
    if env: merged.update(env)
    code=1
    with log.open('w',encoding='utf-8') as stream:
      proc=subprocess.Popen(cmd,cwd=ROOT,env=merged,text=True,stdout=stream,stderr=subprocess.STDOUT,start_new_session=True)
      try:
        code=proc.wait(timeout=timeout)
      except subprocess.TimeoutExpired:
        import signal
        try: os.killpg(proc.pid,signal.SIGTERM)
        except ProcessLookupError: pass
        try: proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
          try: os.killpg(proc.pid,signal.SIGKILL)
          except ProcessLookupError: pass
          proc.wait()
        stream.write('\nTIMEOUT\n');code=124
    out=log.read_text(encoding='utf-8',errors='replace')
    print(f"[{name}] {'PASS' if code==0 else 'FAIL'} ({time.time()-start:.1f}s)", flush=True)
    if code!=0: print(out[-3000:], flush=True)
    return {'name':name,'command':cmd,'passed':code==0,'exit_code':code,'duration_seconds':round(time.time()-start,3),'assertions':assertion_count(out),'log':str(log.relative_to(ROOT))}

def validate_manual(path):
    data=json.loads(Path(path).read_text())
    required=['keyboard_review','screen_reader_review','real_https_staging_smoke','apache_secret_denial','rollback_rehearsal','external_review_packet_locked','pilot_protocol_approved']
    bad=[k for k in required if not data.get('checks',{}).get(k,{}).get('passed')]
    return not bad, {'file':str(path),'missing_or_failed':bad,'decision':data.get('decision')}

def validate_external_evidence(path):
    return validate_external_evidence_file(path, ROOT)

def build_and_verify(profile):
    results=[]; RELEASE.mkdir(exist_ok=True)
    hosting_kind='hosting-template' if profile=='ci' else 'hosting'
    suffix=lambda s:s.replace('.','_').replace('-','_')
    hosting=RELEASE/f'nutrition_calculator_{suffix(VERSION)}_{"TEMPLATE" if hosting_kind=="hosting-template" else "HOSTING_PRIVATE"}.zip'
    full_kind='source' if profile=='ci' else 'full'
    full=RELEASE/f'nutrition_calculator_{suffix(VERSION)}_{"SOURCE_CI" if full_kind=="source" else "FULL_PRIVATE"}.zip'
    print('[START] build_hosting',flush=True)
    results.append(run_suite('build_hosting',[sys.executable,'tools/build_release.py','--kind',hosting_kind,'--output',str(hosting),'--verify-reproducible','--json-out','reports/build-hosting.json']))
    if results[-1]['passed']:
      print('[START] verify_hosting',flush=True)
      results.append(run_suite('verify_hosting',[sys.executable,'tools/verify_release.py',str(hosting),'--apache','--browser','--json-out','reports/verify-hosting.json'],env=({'PLAYWRIGHT_USE_SYSTEM_CHROMIUM':'1'} if profile!='ci' else None),timeout=600))
    print('[START] build_full',flush=True)
    results.append(run_suite('build_full',[sys.executable,'tools/build_release.py','--kind',full_kind,'--output',str(full),'--verify-reproducible','--json-out','reports/build-full.json']))
    if results[-1]['passed']:
      print('[START] verify_full',flush=True)
      results.append(run_suite('verify_full',[sys.executable,'tools/verify_release.py',str(full),'--json-out','reports/verify-full.json']))
    return results,hosting,full

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--profile',choices=['quick','full','ci','release'],default='full');ap.add_argument('--manual-acceptance');ap.add_argument('--external-evidence');ap.add_argument('--start-at');ap.add_argument('--stop-after');ap.add_argument('--skip-build',action='store_true');ap.add_argument('--summary-out',default='reports/release-gate-summary.json');args=ap.parse_args()
    REPORTS.mkdir(exist_ok=True);RELEASE.mkdir(exist_ok=True)
    started=dt.datetime.now(dt.timezone.utc)
    results=[]
    browser_env={'PLAYWRIGHT_USE_SYSTEM_CHROMIUM':'1'} if args.profile in {'full','release'} else {}
    commands=suite_commands(args.profile)
    names=[n for n,_ in commands]
    if args.start_at:
      if args.start_at not in names: raise SystemExit(f'unknown --start-at {args.start_at}')
      commands=commands[names.index(args.start_at):]
    if args.stop_after:
      selected=[n for n,_ in commands]
      if args.stop_after not in selected: raise SystemExit(f'unknown --stop-after {args.stop_after}')
      commands=commands[:selected.index(args.stop_after)+1]
    for name,cmd in commands:
      print(f'[START] {name}', flush=True)
      env=browser_env if name.startswith('browser_chromium_') else None
      results.append(run_suite(name,cmd,env=env))
      if not results[-1]['passed'] and args.profile=='quick': break
    artifacts=[]
    if not args.skip_build and args.profile in {'full','ci','release'} and all(x['passed'] for x in results):
      built,hosting,full=build_and_verify(args.profile);results.extend(built);artifacts=[str(hosting.relative_to(ROOT)),str(full.relative_to(ROOT))]
    manual={'required':args.profile=='release','passed':args.profile!='release'}
    if args.profile=='release':
      if args.manual_acceptance:
        ok,detail=validate_manual(args.manual_acceptance);manual={'required':True,'passed':ok,**detail}
      else: manual={'required':True,'passed':False,'error':'--manual-acceptance is required for release profile'}
    external={'required':args.profile=='release','passed':args.profile!='release'}
    if args.profile=='release':
      if args.external_evidence:
        ext_ok,ext_detail=validate_external_evidence(args.external_evidence);external={'required':True,'passed':ext_ok,**ext_detail}
      else: external={'required':True,'passed':False,'error':'--external-evidence is required for release profile'}
    ok=all(x['passed'] for x in results) and manual['passed'] and external['passed']
    summary={'schema_version':1,'release_version':VERSION,'profile':args.profile,'ok':ok,'started_at':started.isoformat(),'finished_at':dt.datetime.now(dt.timezone.utc).isoformat(),'suites':results,'assertions':sum(x['assertions'] for x in results),'manual_acceptance':manual,'external_evidence':external,'artifacts':artifacts,'limitations':([] if args.profile=='ci' else ['Firefox and WebKit are enforced by CI; local managed environment verified Chromium only.','External clinical/domain validation remains pending unless a version-matched accepted evidence package is supplied to the release profile.'])}
    Path(args.summary_out).write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
    # Minimal JUnit report for CI systems.
    failures=sum(not x['passed'] for x in results)+(0 if manual['passed'] else 1)+(0 if external['passed'] else 1)
    cases=[]
    for x in results:
      failure='' if x['passed'] else f'<failure message="exit {x["exit_code"]}">{x["log"]}</failure>'
      cases.append(f'<testcase name="{x["name"]}" time="{x["duration_seconds"]}">{failure}</testcase>')
    (REPORTS/'release-gate-junit.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?><testsuite name="nutrition-release-gate" tests="{len(results)}" failures="{failures}">'+''.join(cases)+'</testsuite>\n')
    print(json.dumps({'ok':ok,'profile':args.profile,'assertions':summary['assertions'],'suites':len(results),'artifacts':artifacts},ensure_ascii=False,indent=2))
    raise SystemExit(0 if ok else 1)
if __name__=='__main__': main()
