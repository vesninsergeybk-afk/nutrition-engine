#!/usr/bin/env python3
from __future__ import annotations
import argparse,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VERSION='v6.0.0-beta4-profile-hierarchy'
INTERACTION_VERSION='v6.0.0-beta3-interaction-coherence'
SECRET_RX=re.compile(rb'(?:AIza[0-9A-Za-z_-]{25,}|AQ\.[0-9A-Za-z_-]{25,}|sk-[0-9A-Za-z_-]{20,})')
REPORTS={
 'profile_hierarchy':'reports/v6-beta4-profile-hierarchy-acceptance.json',
 'profile_persistence':'reports/v6-beta4-profile-acceptance.json',
 'interaction':'reports/v6-beta4-interaction-acceptance.json',
 'group_overview':'reports/v6-beta4-nutrient-group-acceptance.json',
 'analysis':'reports/v6-beta4-analysis-continuity.json',
 'ui':'reports/v6-beta4-ivory-acceptance.json',
 'extended':'reports/v6-beta4-ivory-extended-acceptance.json',
 'media':'reports/v6-beta4-gemini-media-acceptance.json',
 'runtime':'reports/v6-beta4-runtime-inventory.json',
 'protected':'reports/v6-beta4-protected-comparison.json',
 'generator':'reports/v6-beta4-generator-idempotency.json',
 'budget':'reports/v6-beta4-ui-budget.json',
 'http':'reports/hf28-http-contract.json',
 'secret_http':'reports/hf28-packaged-secret-http.json',
}
EXTRACTED='reports/v6-beta4-extracted-hosting-acceptance.json'
def read(rel):return json.loads((ROOT/rel).read_text(encoding='utf-8'))
def add(rows,name,ok,detail=None):
 row={'name':name,'ok':bool(ok)}
 if detail is not None:row['detail']=detail
 rows.append(row)
def main():
 global ROOT
 ap=argparse.ArgumentParser();ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--json-out',default='reports/v6-beta4-release-audit.json');ap.add_argument('--syntax-out',default='reports/v6-beta4-syntax-checks.json');ap.add_argument('--allow-missing-extracted',action='store_true');a=ap.parse_args();ROOT=Path(a.app_root).resolve();rows=[]
 for name,rel in REPORTS.items():
  p=ROOT/rel;data=None;ok=p.is_file()
  if ok:
   try:data=read(rel);ok=data.get('ok') is True
   except Exception as exc:data={'error':str(exc)};ok=False
  add(rows,'required report: '+name,ok,{'path':rel,'assertions':data.get('assertions') if isinstance(data,dict) else None})
 ep=ROOT/EXTRACTED
 if ep.is_file():
  try:ed=read(EXTRACTED);eok=ed.get('ok') is True and ed.get('release_version')==VERSION
  except Exception as exc:ed={'error':str(exc)};eok=False
  add(rows,'required report: extracted hosting',eok,{'path':EXTRACTED,'assertions':ed.get('assertions') if isinstance(ed,dict) else None})
 elif not a.allow_missing_extracted:add(rows,'required report: extracted hosting',False,{'path':EXTRACTED})
 else:add(rows,'preflight permits pending extracted-hosting report',True,{'path':EXTRACTED})
 for rel in ('index.html','index-v5.3.210.html'):
  t=(ROOT/rel).read_text(encoding='utf-8')
  add(rows,rel+' release version',VERSION in t)
  add(rows,rel+' beta4 runtime selector','00-runtime-selector-v6.0.0-beta4.js' in t and 'runtime-manifest-v6.0.0-beta4.js' in t)
  add(rows,rel+' profile CSS order',t.find('profile-continuity-v6.css')<t.find('profile-hierarchy-v6.0.0-beta4.css')<t.find('interaction-states-v6.0.0-beta3.css')<t.find('ivory-brass-print-v6.css'))
  add(rows,rel+' new persistence and hierarchy loaded',all(x in t for x in ('profile-persistence-v6.0.0-beta4.js','profile-hierarchy-v6.0.0-beta4.js')))
  add(rows,rel+' obsolete ivory-only disclosure not loaded','ivory-brass-progressive-disclosure-v6.js' not in t)
  add(rows,rel+' interaction controller retained after theme controller',t.find('theme-controller-v2.js')<t.find('interaction-state-controller-v6.0.0-beta3.js')<t.find('profile-hierarchy-v6.0.0-beta4.js'))
 runtime_files=(
  'config/runtime-assets.v6.0.0-beta4.json','assets/runtime/runtime-manifest-v6.0.0-beta4.js',
  'assets/runtime/critical-shell-v6.0.0-beta4.js','assets/runtime/critical-shell-v6.0.0-beta4.legacy.js',
  'assets/js/00-runtime-bootstrap-v6.0.0-beta4.js','assets/js/00-runtime-selector-v6.0.0-beta4.js',
  'assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta4.legacy.js','assets/css/profile-hierarchy-v6.0.0-beta4.css',
  'assets/js/profile-hierarchy-v6.0.0-beta4.js','assets/js/profile-persistence-v6.0.0-beta4.js',
  'assets/css/interaction-states-v6.0.0-beta3.css','assets/js/interaction-state-controller-v6.0.0-beta3.js')
 for rel in runtime_files:add(rows,'runtime/profile file present: '+rel,(ROOT/rel).is_file())
 cfg=read('config/runtime-assets.v6.0.0-beta4.json');ui=cfg.get('ui_v6',{});hier=ui.get('profile_hierarchy',{})
 add(rows,'profile hierarchy contract recorded',ui.get('profile_hierarchy_contract')=='NutritionProfileHierarchyV2',ui.get('profile_hierarchy_contract'))
 add(rows,'HOTFIX30 recorded complete',ui.get('profile_hierarchy_release')=='hotfix30' and 'completed' in ui.get('future_work_boundaries',{}).get('hotfix30','').lower(),ui.get('future_work_boundaries'))
 add(rows,'five required fields exact',hier.get('required')==['needs_sex','needs_age','needs_h','needs_w','needs_activity'],hier.get('required'))
 add(rows,'preferences exact',hier.get('preferences')==['needs_person_name','needs_goal','needs_diet_style','needs_split'],hier.get('preferences'))
 add(rows,'advanced fields remain available',all(x in hier.get('advanced',[]) for x in ('needs_state','needs_edema','needs_guardrail','needs_protein_manual','needsProtectedModeContext','needsLowWeightSafety')),hier.get('advanced'))
 add(rows,'canonical calculation retained',hier.get('canonical_calculation_button')=='needs_calc_btn' and hier.get('primary_journey_button')=='profileCalculateContinue',hier)
 add(rows,'stable DOM contract',hier.get('stable_after_startup') is True)
 add(rows,'HOTFIX29 remains complete',ui.get('interaction_state_contract')=='NutritionInteractionStatesV1' and ui.get('interaction_state_release')=='hotfix29')
 hjs=(ROOT/'assets/js/profile-hierarchy-v6.0.0-beta4.js').read_text(encoding='utf-8');pjs=(ROOT/'assets/js/profile-persistence-v6.0.0-beta4.js').read_text(encoding='utf-8');hcss=(ROOT/'assets/css/profile-hierarchy-v6.0.0-beta4.css').read_text(encoding='utf-8')
 add(rows,'basic/prefs/advanced hierarchy implemented',all(x in hjs for x in ('profileBasicSection','profilePreferencesSection','profileAdvancedSection','profileUtilitiesSection')))
 add(rows,'purpose explanations wired with aria-describedby','aria-describedby' in hjs and 'PURPOSES' in hjs)
 add(rows,'special profile auto-reveals','specialValues()&&!advanced.open' in hjs)
 add(rows,'invalid hidden field reveals its details','addEventListener(\'invalid\',onInvalid,true)' in hjs and 'revealFor' in hjs)
 add(rows,'canonical button hidden not removed',"canonical.hidden=true" in hjs and "canonical.setAttribute('aria-hidden','true')" in hjs)
 add(rows,'required completion order exact',"BASIC_REQUIRED=['needs_sex','needs_age','needs_h','needs_w','needs_activity']" in pjs)
 add(rows,'draft/current/incomplete states explicit',all(x in pjs for x in ("'current'","'draft'","'incomplete'",'data-profile-calculation-state')))
 add(rows,'draft hydration protected','startupHydrating' in pjs and 'reconcileStoredFields' in pjs and 'unfinished drafts' in pjs)
 add(rows,'current profile skips unnecessary recalculation','if(isCurrentApplied()){navigateRation();return;}' in pjs)
 add(rows,'mobile sequential hierarchy styles',all(x in hcss for x in ('@media(max-width:899px)','grid-template-columns:1fr','min-height:44px')))
 index=(ROOT/'index.html').read_text(encoding='utf-8')
 add(rows,'complete analytics remain',all(('id="'+x+'"') in index for x in ('totalsSection','heiPanel','heiTableBody','dietAnalysisProfilePanel','strictHarvardPlateDetails','globalActions')))
 add(rows,'profile storage contract remains',all(x in index for x in ('profile-persistence-v6.0.0-beta4.js','analysis-feature-continuity-v6.0.0-beta1.js','profile-continuity-v6.css')))
 add(rows,'three themes remain',all(x in index for x in ('modern','retro-2bit','ivory-brass')))
 add(rows,'nutrient overview remains navigation not score','NutrientGroupOverview.v1' in (ROOT/'assets/js/ivory-brass-view-model-v6.js').read_text(encoding='utf-8'))
 secret=ROOT/'api/gemini-secret.php';add(rows,'server Gemini secret present',secret.is_file())
 if secret.is_file():
  keys=SECRET_RX.findall(secret.read_bytes());add(rows,'primary and backup Gemini keys present',len(keys)>=2 and len(set(keys))>=2,{'key_count':len(keys)});add(rows,'secret mode 0600',(secret.stat().st_mode&0o777)==0o600,oct(secret.stat().st_mode&0o777))
 leaks=[]
 for target in ('assets','index.html','index-v5.3.210.html'):
  p=ROOT/target;files=[p] if p.is_file() else [q for q in p.rglob('*') if q.is_file()]
  for q in files:
   if SECRET_RX.search(q.read_bytes()):leaks.append(str(q.relative_to(ROOT)))
 add(rows,'no Gemini key in client payload',not leaks,leaks)
 syntax=[]
 js_files=[x for x in runtime_files if x.endswith('.js')]+['assets/js/ivory-brass-view-model-v6.js','assets/js/ivory-brass-charts-v6.js','assets/js/ivory-brass-shell-v6.js','assets/js/ivory-brass-search-compact-v6.js','assets/js/90-media-entry-resilient-bridge-v5.3.210-rc2-hf28.js']
 for rel in sorted(set(js_files)):
  r=subprocess.run(['node','--check',str(ROOT/rel)],capture_output=True,text=True);syntax.append({'path':rel,'ok':r.returncode==0,'detail':(r.stderr or r.stdout)[-300:]})
 for p in sorted((ROOT/'api').glob('*.php')):
  r=subprocess.run(['php','-l',str(p)],capture_output=True,text=True);syntax.append({'path':str(p.relative_to(ROOT)),'ok':r.returncode==0,'detail':(r.stderr or r.stdout)[-300:]})
 syn={'ok':all(x['ok'] for x in syntax),'release_version':VERSION,'assertions':len(syntax),'results':syntax};sp=ROOT/a.syntax_out;sp.parent.mkdir(parents=True,exist_ok=True);sp.write_text(json.dumps(syn,ensure_ascii=False,indent=2)+'\n')
 add(rows,'changed/generated JS and PHP syntax',syn['ok'],{'assertions':len(syntax)})
 caches=[str(p.relative_to(ROOT)) for p in ROOT.rglob('*') if p.is_file() and (p.suffix=='.pyc' or '__pycache__' in p.parts)]
 add(rows,'no generated bytecode cache',not caches,caches)
 result={'ok':all(x['ok'] for x in rows),'release_version':VERSION,'assertions':len(rows),'results':rows,'scope':'HOTFIX30 final profile hierarchy and progressive disclosure across all themes/layouts; no calculation-engine changes'}
 out=ROOT/a.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
