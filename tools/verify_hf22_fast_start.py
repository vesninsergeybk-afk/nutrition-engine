#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, os, subprocess, sys, tempfile, zipfile
from pathlib import Path, PurePosixPath
from runtime_inventory import compute as compute_runtime

ROOT=Path(__file__).resolve().parents[1]
VERSION='v5.3.210-rc2-hf22-fast-start'
HOSTING='NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX22_FAST_START_PRIVATE.zip'
FULL='NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX22_FAST_START_ACCEPTED_FULL_PRIVATE_AUDITED.zip'

def sha(data:bytes)->str: return hashlib.sha256(data).hexdigest()

def verify_zip(path:Path,kind:str):
    checks=[]
    def add(name,ok,detail=''): checks.append({'name':name,'passed':bool(ok),'detail':str(detail)})
    with zipfile.ZipFile(path) as z:
        names=[n for n in z.namelist() if not n.endswith('/')]
        add('zip integrity',z.testzip() is None)
        add('no duplicate names',len(names)==len(set(names)),len(names))
        add('no path traversal',all(not PurePosixPath(n).is_absolute() and '..' not in PurePosixPath(n).parts for n in names))
        add('release manifest present','release-manifest.json' in names)
        add('SPDX SBOM present','release-sbom.spdx.json' in names)
        manifest=json.loads(z.read('release-manifest.json'))
        sbom=json.loads(z.read('release-sbom.spdx.json'))
        add('release version',manifest.get('release_version')==VERSION,manifest.get('release_version'))
        add('artifact kind',manifest.get('artifact_kind')==kind,manifest.get('artifact_kind'))
        rows={x['path']:x for x in manifest.get('files',[])}
        payload=set(names)-{'release-manifest.json','release-sbom.spdx.json'}
        add('manifest allowlist complete',payload==set(rows),f'payload={len(payload)}, rows={len(rows)}')
        bad=[]
        for rel,row in rows.items():
            if rel not in payload: bad.append(rel+':missing'); continue
            data=z.read(rel)
            if len(data)!=row['size'] or sha(data)!=row['sha256']: bad.append(rel)
        add('manifest content integrity',not bad,', '.join(bad[:10]))
        sbom_names={x['fileName'][2:] if x['fileName'].startswith('./') else x['fileName'] for x in sbom.get('files',[])}
        add('SBOM allowlist complete',sbom_names==payload,f'sbom={len(sbom_names)}, payload={len(payload)}')
        index=z.read('index.html').decode('utf-8')
        index2=z.read('index-v5.3.210.html').decode('utf-8')
        add('entrypoints identical',index==index2)
        add('HF22 manifest active','runtime-manifest-v5.3.210-rc2-hf22.js' in index and VERSION in index)
        add('old manifest not active','runtime-manifest-v5.3.210-rc2-hf21.js' not in index)
        required={'assets/runtime/runtime-manifest-v5.3.210-rc2-hf22.js','assets/runtime/critical-shell-v5.3.210-rc2-hf22.js','assets/data/products.v5.3.210-p1.3.bundle.js','assets/runtime/deferred-runtime-v5.3.210-rc2-hf22.js'}
        add('fast-start files present',required.issubset(payload),', '.join(sorted(required-payload)))
        if kind=='hosting-private':
            runtime,missing=compute_runtime(); expected=set(runtime)
            add('runtime inventory complete',not missing,missing)
            add('hosting payload equals runtime closure',payload==expected,f'payload={len(payload)}, expected={len(expected)}, extra={sorted(payload-expected)[:5]}, missing={sorted(expected-payload)[:5]}')
            add('historical HF21 runtime manifest pruned','assets/runtime/runtime-manifest-v5.3.210-rc2-hf21.js' not in payload)
        else:
            required_full={'tools/hf22_fast_start_audit.py','tools/hf22_fast_start_chromium.py','tools/build_hf22_fast_start.py','tools/verify_hf22_fast_start.py','reports/hf22-fast-start-static.json','reports/hf22-fast-start-browser.json','NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX22_FAST_START_TEST_REPORT_RU.md'}
            add('full audit package complete',required_full.issubset(payload),', '.join(sorted(required_full-payload)))
    return {'artifact':str(path),'kind':kind,'sha256':sha(path.read_bytes()),'zip_bytes':path.stat().st_size,'checks':checks,'ok':all(x['passed'] for x in checks)}

def archive_browser_smoke(path:Path,chromium:str):
    with tempfile.TemporaryDirectory(prefix='hf22-hosting-') as td:
        root=Path(td)
        with zipfile.ZipFile(path) as z: z.extractall(root)
        report=root/'archive-browser.json'
        cmd=[sys.executable,str(ROOT/'tools/hf22_fast_start_chromium.py'),'--chromium',chromium,'--app-root',str(root),'--json-out',str(report)]
        r=subprocess.run(cmd,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=180)
        data=json.loads(report.read_text(encoding='utf-8')) if report.is_file() else {}
        return {'passed':r.returncode==0 and data.get('ok') is True,'exit_code':r.returncode,'cases':data.get('cases',[]),'output_tail':r.stdout[-1600:]}

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--artifact-dir',default='/mnt/data'); ap.add_argument('--chromium',default='/usr/bin/chromium'); ap.add_argument('--json-out'); args=ap.parse_args()
    base=Path(args.artifact_dir)
    results=[verify_zip(base/HOSTING,'hosting-private'),verify_zip(base/FULL,'full-private-audited')]
    smoke=archive_browser_smoke(base/HOSTING,args.chromium)
    result={'ok':all(x['ok'] for x in results) and smoke['passed'],'release_version':VERSION,'artifacts':results,'hosting_archive_browser':smoke}
    if args.json_out:
        p=Path(args.json_out); p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))
    raise SystemExit(0 if result['ok'] else 1)

if __name__=='__main__': main()
