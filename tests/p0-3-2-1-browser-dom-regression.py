from playwright.sync_api import sync_playwright
from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1]
html=(root/'index-v5.3.210.html').read_text()
html=re.sub(r'<script\b[^>]*>.*?</script>','',html,flags=re.I|re.S)
html=re.sub(r'<link\b[^>]*>','',html,flags=re.I)
js04=(root/'assets/js/04-needs-norms.js').read_text()
js05=(root/'assets/js/05-protected-modes-v5.3.210.js').read_text()
results=[]; logs=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1200})
 page.on('console',lambda m: logs.append({'type':m.type,'text':m.text}))
 page.on('pageerror',lambda e: logs.append({'type':'pageerror','text':str(e)}))
 page.set_content(html,wait_until='domcontentloaded')
 page.evaluate("""() => { ['kcal','protein_g','fat_g','carbs_g','sfa_g','added_sugars_g'].forEach(k=>{if(!document.getElementById('normInput-'+k)){const i=document.createElement('input');i.id='normInput-'+k;document.body.appendChild(i);}}); }""")
 page.add_script_tag(content="""
 window.State={getRegion:function(){return 'us';}};
 window.Logger={info:function(){},warn:function(){},error:function(){}};
 window.norms={values:{}};
 window.renderTotals=function(){};
 window.html2pdf=function(){return {set:function(){return this},from:function(){return this},save:function(){}}};
 window.__BROWSER_COMPAT__={mode:'modern'};
 """)
 page.add_script_tag(content=js04)
 page.add_script_tag(content=js05)
 # This standalone DOM harness bypasses the production bootstrap. Explicitly
 # complete the same readiness contract before exercising interactive actions.
 page.evaluate("""() => {
   window.__APP_BOOTSTRAP_META__={version:'v5.3.210-rc2',testHarness:true};
   window.dispatchEvent(new CustomEvent('app:ready',{detail:window.__APP_BOOTSTRAP_META__}));
 }""")
 def ev(id,typ='input'):
  page.eval_on_selector('#'+id,"(e,t)=>e.dispatchEvent(new Event(t,{bubbles:true}))",typ)
 def setv(id,val,typ=None):
  page.eval_on_selector('#'+id,"(e,v)=>{if(e.type==='checkbox')e.checked=!!v;else e.value=String(v)}",val)
  if typ: ev(id,typ)
 def calc(): page.click('#needs_calc_btn')
 # standard
 setv('needs_sex','male');setv('needs_h',180);setv('needs_w',70);setv('needs_age',35);setv('needs_state','normal');setv('needs_activity','low');setv('needs_edema','no');setv('needs_goal','maintain');setv('needs_guardrail','none')
 calc()
 results.append({'name':'standard_applied','applied':page.evaluate('window.__lastNeedsProfileApplied===true'),'profilePresent':page.evaluate('!!window.__lastPersonalNeedsProfile'),'kcal':page.input_value('#normInput-kcal'),'printEnabled':page.is_enabled('#needs_print_btn'),'pdfEnabled':page.is_enabled('#needs_pdf_btn')})
 # edit protected field invalidates
 setv('needs_guardrail','pregnancy','change')
 page.wait_for_timeout(250)
 results.append({'name':'edit_invalidates','applied':page.evaluate('window.__lastNeedsProfileApplied===true'),'profileNull':page.evaluate('window.__lastPersonalNeedsProfile===null'),'metaNull':page.evaluate('window.__lastNeedsMeta===null'),'kcal':page.input_value('#normInput-kcal'),'staleVisible':'устарел' in page.inner_text('#needs_out'),'printDisabled':page.is_disabled('#needs_print_btn'),'pdfDisabled':page.is_disabled('#needs_pdf_btn')})
 # blocked ICU after previous standard
 setv('needs_guardrail','none');setv('needs_state','normal');calc();setv('needs_state','icu');calc()
 results.append({'name':'blocked_clears','applied':page.evaluate('window.__lastNeedsProfileApplied'),'profileNull':page.evaluate('window.__lastPersonalNeedsProfile===null'),'blocked':page.evaluate('window.__lastNeedsMeta&&window.__lastNeedsMeta.protectedPolicy.calculationAllowed===false'),'out':page.inner_text('#needs_out')[:180]})
 # valid clinical target
 from datetime import date,timedelta
 today=date.today().isoformat();review=(date.today()+timedelta(days=30)).isoformat()
 for id,val in {'needs_state':'icu','needs_clinical_energy_manual':1800,'needs_protein_manual':90,'needs_clinical_reference_weight':65,'needs_clinical_confirmed_by':'Dr Test','needs_clinical_confirmed_role':'physician','needs_clinical_confirmed_at':today,'needs_clinical_review_due_at':review,'needs_clinical_source_method':'indirect calorimetry and clinical prescription','needs_clinical_phase':'acute_early','needs_clinical_route':'enteral'}.items():setv(id,val)
 setv('needs_clinical_targets_confirmed',True)
 calc()
 results.append({'name':'clinical_valid','applied':page.evaluate('window.__lastNeedsProfileApplied'),'method':page.evaluate('window.__lastNeedsMeta&&window.__lastNeedsMeta.method'),'energy':page.evaluate('window.__lastNeedsMeta&&window.__lastNeedsMeta.energyTarget'),'protein':page.evaluate('window.__lastNeedsMeta&&window.__lastNeedsMeta.totalProtein'),'fat':page.evaluate('window.__lastNeedsMeta&&window.__lastNeedsMeta.fatGrams'),'gemini':page.evaluate('window.__lastNeedsMeta&&window.__lastNeedsMeta.geminiAllowed')})
 # edit target invalidates
 setv('needs_clinical_reference_weight',66,'input')
 results.append({'name':'clinical_edit_invalidates','applied':page.evaluate('window.__lastNeedsProfileApplied'),'profileNull':page.evaluate('window.__lastPersonalNeedsProfile===null'),'metaNull':page.evaluate('window.__lastNeedsMeta===null')})
 # ED risk is external-target-only
 setv('needs_state','normal');setv('needs_guardrail','ed_risk');setv('needs_clinical_targets_confirmed',False);calc()
 results.append({'name':'ed_risk_blocks_without_target','applied':page.evaluate('window.__lastNeedsProfileApplied'),'blocked':page.evaluate('window.__lastNeedsMeta&&window.__lastNeedsMeta.protectedPolicy.calculationAllowed===false')})
 # valid external target works in ED risk without standard-formula fallback
 for id,val in {'needs_clinical_energy_manual':1800,'needs_protein_manual':90,'needs_clinical_reference_weight':65,'needs_clinical_confirmed_by':'Dr Test','needs_clinical_confirmed_role':'physician','needs_clinical_confirmed_at':today,'needs_clinical_review_due_at':review,'needs_clinical_source_method':'specialist prescription','needs_clinical_phase':'stable','needs_clinical_route':'oral'}.items():setv(id,val)
 setv('needs_clinical_targets_confirmed',True);calc()
 results.append({'name':'ed_risk_external_target','method':page.evaluate('window.__lastNeedsMeta&&window.__lastNeedsMeta.method'),'gemini':page.evaluate('window.__lastNeedsMeta&&window.__lastNeedsMeta.geminiAllowed')})
 # current high-risk safety survives invalidation
 setv('needs_state','normal');setv('needs_guardrail','none');setv('needs_w',45);setv('needs_age',35);calc();setv('needs_age',36,'input')
 results.append({'name':'refeeding_after_invalidation','metaNull':page.evaluate('window.__lastNeedsMeta===null'),'geminiAllowed':page.evaluate('ProtectedModesP03.currentPolicy().geminiAllowed'),'plannerAllowed':page.evaluate('ProtectedModesP03.currentPolicy().automaticPlannerAllowed')})
 # manual norm must survive invalidation and delayed MutationObserver callback
 page.click('#needs_reset_btn');setv('needs_sex','male');setv('needs_h',180);setv('needs_w',70);setv('needs_age',35);setv('needs_state','normal');setv('needs_activity','low');setv('needs_edema','no');setv('needs_goal','maintain');setv('needs_guardrail','none');calc()
 setv('normInput-kcal',2222);setv('needs_age',36,'input');page.wait_for_timeout(250)
 results.append({'name':'manual_norm_survives_delayed_invalidation','kcal':page.input_value('#normInput-kcal'),'applied':page.evaluate('window.__lastNeedsProfileApplied===true'),'staleVisible':'устарел' in page.inner_text('#needs_out')})
 # status precedence direct
 results.append({'name':'status_precedence','status':page.evaluate("ProtectedModesP03.evaluate({state:'icu',age:35,refeedingHighRisk:true}).status")})
 b.close()

by_name={x['name']:x for x in results}
failures=[]
def require(name, condition, detail):
 if not condition: failures.append({'scenario':name,'detail':detail})
require('standard_applied',by_name['standard_applied']['applied'] and by_name['standard_applied']['profilePresent'] and bool(by_name['standard_applied']['kcal']) and by_name['standard_applied']['printEnabled'] and by_name['standard_applied']['pdfEnabled'],by_name['standard_applied'])
require('edit_invalidates',(not by_name['edit_invalidates']['applied']) and by_name['edit_invalidates']['profileNull'] and by_name['edit_invalidates']['metaNull'] and by_name['edit_invalidates']['kcal']=='' and by_name['edit_invalidates']['staleVisible'] and by_name['edit_invalidates']['printDisabled'] and by_name['edit_invalidates']['pdfDisabled'],by_name['edit_invalidates'])
require('blocked_clears',(not by_name['blocked_clears']['applied']) and by_name['blocked_clears']['profileNull'] and by_name['blocked_clears']['blocked'] and 'остановлен' in by_name['blocked_clears']['out'],by_name['blocked_clears'])
require('clinical_valid',by_name['clinical_valid']['applied'] and by_name['clinical_valid']['method']=='clinical_external' and by_name['clinical_valid']['energy']==1800 and by_name['clinical_valid']['protein']==90 and by_name['clinical_valid']['fat'] is None and by_name['clinical_valid']['gemini'] is False,by_name['clinical_valid'])
require('clinical_edit_invalidates',(not by_name['clinical_edit_invalidates']['applied']) and by_name['clinical_edit_invalidates']['profileNull'] and by_name['clinical_edit_invalidates']['metaNull'],by_name['clinical_edit_invalidates'])
require('ed_risk_blocks_without_target',(not by_name['ed_risk_blocks_without_target']['applied']) and by_name['ed_risk_blocks_without_target']['blocked'],by_name['ed_risk_blocks_without_target'])
require('ed_risk_external_target',by_name['ed_risk_external_target']['method']=='clinical_external' and by_name['ed_risk_external_target']['gemini'] is False,by_name['ed_risk_external_target'])
require('refeeding_after_invalidation',by_name['refeeding_after_invalidation']['metaNull'] and by_name['refeeding_after_invalidation']['geminiAllowed'] is False and by_name['refeeding_after_invalidation']['plannerAllowed'] is False,by_name['refeeding_after_invalidation'])
require('manual_norm_survives_delayed_invalidation',by_name['manual_norm_survives_delayed_invalidation']['kcal']=='2222' and (not by_name['manual_norm_survives_delayed_invalidation']['applied']) and by_name['manual_norm_survives_delayed_invalidation']['staleVisible'],by_name['manual_norm_survives_delayed_invalidation'])
require('status_precedence',by_name['status_precedence']['status']=='blocked',by_name['status_precedence'])
error_logs=[x for x in logs if x['type'] in ('error','pageerror')]
if error_logs: failures.append({'scenario':'browser_console','detail':error_logs[:20]})
payload={'status':'FAIL' if failures else 'PASS','assertions':10,'results':results,'logs':logs[:20],'failures':failures}
print(json.dumps(payload,ensure_ascii=False,indent=2))
# Playwright/Chromium may leave an atexit helper waiting under the aggregated release gate.
# Flush the complete result and terminate deterministically after all browser resources are closed.
import sys, os
sys.stdout.flush(); sys.stderr.flush()
os._exit(1 if failures else 0)
