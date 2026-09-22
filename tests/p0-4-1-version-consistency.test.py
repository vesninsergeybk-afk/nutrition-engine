#!/usr/bin/env python3
import pathlib,re,json
root=pathlib.Path(__file__).resolve().parents[1]
release='v5.3.210-rc2'
active_shell=[
'index.html','index-v5.3.210.html','hosting-check.html','api/gemini.php',
'assets/js/00-runtime-selector-v5.3.210.js','assets/js/00-runtime-bootstrap-v5.3.210.js',
'assets/legacy/js/00-runtime-bootstrap-v5.3.210.legacy.js','assets/runtime/runtime-manifest-v5.3.210-rc2-hf18.js']
assertions=0
for rel in active_shell:
    text=(root/rel).read_text();assert release in text,f'missing {release} marker in {rel}';assertions+=1
    assert not re.search(r'5\.3\.210-p0\.4(?!\.1)',text),f'stale p0.4 cache key in {rel}';assertions+=1
for rel in ['index-v5.3.208.html','index-v5.3.209.html']:
    text=(root/rel).read_text();assert f'data-retired-entrypoint="{release}"' in text and '00-runtime-selector' not in text;assertions+=2
for rel in ['assets/js/62-gemini-ration-import-v5.js','assets/legacy/js/62-gemini-ration-import-v5.js','assets/js/61-ai-nutrition-planner-v5.3.210.js','assets/legacy/js/61-ai-nutrition-planner-v5.3.210.js']:
    text=(root/rel).read_text();assert 'X-Nutrition-CSRF' in text,f'CSRF header missing in {rel}';assertions+=1
# Runtime lists are versioned through the canonical architecture config, not duplicated in bootstraps.
cfg=json.loads((root/'config/runtime-assets.v5.3.210-rc2.json').read_text());assert cfg['release_version']=='v5.3.210-rc2-hf18';assertions+=1
print(json.dumps({'status':'PASS','assertions':assertions,'files':len(active_shell)},ensure_ascii=False,indent=2))
