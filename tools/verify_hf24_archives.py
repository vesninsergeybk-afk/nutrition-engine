#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, shutil, subprocess, sys, tempfile, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VERSION='v5.3.210-rc2-hf24-media-lazy'
DEFAULT_HOST=Path('/mnt/data/NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX24_MEDIA_LAZY_FAST_PRIVATE.zip')
DEFAULT_FULL=Path('/mnt/data/NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX24_MEDIA_LAZY_FAST_ACCEPTED_FULL_PRIVATE_AUDITED.zip')
def sha(b:bytes)->str:return hashlib.sha256(b).hexdigest()
def verify_zip(path:Path):
    with zipfile.ZipFile(path) as z:
        bad=z.testzip()
        names=set(z.namelist())
        mf=json.loads(z.read('release-manifest.json'))
        errors=[]
        if bad:errors.append('CRC failure: '+bad)
        if mf.get('release_version')!=VERSION:errors.append('release mismatch')
        rows=mf.get('files',[])
        for row in rows:
            rel=row['path']
            if rel not in names:errors.append('missing '+rel);continue
            data=z.read(rel)
            if len(data)!=row['size']:errors.append('size '+rel)
            if sha(data)!=row['sha256']:errors.append('sha256 '+rel)
        expected={x['path'] for x in rows}|{'release-manifest.json','release-sbom.spdx.json'}
        extras=sorted(names-expected);missing=sorted(expected-names)
        if extras:errors.append('extra entries: '+', '.join(extras[:10]))
        if missing:errors.append('missing entries: '+', '.join(missing[:10]))
        return {'path':str(path),'ok':not errors,'zip_bytes':path.stat().st_size,'sha256':sha(path.read_bytes()),'payload_files':len(rows),'errors':errors,'manifest':mf}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--host',default=str(DEFAULT_HOST));ap.add_argument('--full',default=str(DEFAULT_FULL));ap.add_argument('--json-out',default=str(ROOT/'reports/hf24-media-lazy-archive-verification.json'));args=ap.parse_args()
    host=Path(args.host);full=Path(args.full)
    h=verify_zip(host);f=verify_zip(full)
    browser={}
    with tempfile.TemporaryDirectory(prefix='hf24-host-') as td:
        with zipfile.ZipFile(host) as z:z.extractall(td)
        out=Path(td)/'browser.json'
        r=subprocess.run([sys.executable,str(ROOT/'tools/hf24_acceptance_chromium.py'),'--app-root',td,'--json-out',str(out)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
        if out.is_file():browser=json.loads(out.read_text(encoding='utf-8'))
        browser_run={'returncode':r.returncode,'ok':r.returncode==0 and browser.get('ok') is True,'tail':r.stdout[-2000:]}
    # Rebuild once more; deterministic archives must retain the same hashes.
    before=(h['sha256'],f['sha256'])
    rb=subprocess.run([sys.executable,'tools/build_hf24_media_lazy.py'],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    after=(sha(host.read_bytes()),sha(full.read_bytes()))
    reproducible=rb.returncode==0 and before==after
    result={'ok':h['ok'] and f['ok'] and browser_run['ok'] and reproducible,'release_version':VERSION,
      'archives':[ {k:v for k,v in h.items() if k!='manifest'}, {k:v for k,v in f.items() if k!='manifest'} ],
      'extracted_hosting_browser':browser,'browser_run':browser_run,'deterministic_rebuild':{'ok':reproducible,'before':before,'after':after,'build_tail':rb.stdout[-1200:]}}
    p=Path(args.json_out);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
