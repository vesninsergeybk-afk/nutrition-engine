#!/usr/bin/env python3
from __future__ import annotations
import argparse,hashlib,json,os,re,shutil,stat,subprocess,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/mnt/data')
VERSION='v6.0.0-beta6-design-refinement'
PREFIX='NUTRITION_CALCULATOR_V6_0_0_BETA6_DESIGN_REFINEMENT'
HOST=OUT/(PREFIX+'_HOSTING_PRIVATE.zip')
FULL=OUT/(PREFIX+'_ACCEPTED_FULL_PRIVATE_AUDITED.zip')
SECRET='api/gemini-secret.php'
KEY_RX=re.compile(rb'(?:AIza[0-9A-Za-z_-]{20,}|AQ\.[0-9A-Za-z_-]{20,})')
def sha(p:Path):return hashlib.sha256(p.read_bytes()).hexdigest()
def add(rows,name,ok,detail=None):rows.append({'name':name,'ok':bool(ok),'detail':detail})
def inspect_zip(path:Path,kind:str,rows):
 add(rows,kind+' archive exists',path.is_file(),str(path))
 if not path.is_file():return
 with zipfile.ZipFile(path) as z:
  names=z.namelist();infos=z.infolist();bad=z.testzip()
  add(rows,kind+' CRC integrity',bad is None,bad)
  add(rows,kind+' no duplicate entries',len(names)==len(set(names)),{'entries':len(names),'unique':len(set(names))})
  unsafe=[n for n in names if n.startswith('/') or '..' in Path(n).parts or '\\' in n]
  add(rows,kind+' no path traversal',not unsafe,unsafe)
  syms=[]
  for i in infos:
   mode=(i.external_attr>>16)&0o170000
   if mode==stat.S_IFLNK:syms.append(i.filename)
  add(rows,kind+' no symlinks',not syms,syms)
  add(rows,kind+' manifest and SBOM present',all(x in names for x in ('release-manifest.json','release-sbom.spdx.json')))
  man=json.loads(z.read('release-manifest.json'))
  add(rows,kind+' manifest release coherent',man.get('release_version')==VERSION and man.get('artifact_kind')==kind,{'release':man.get('release_version'),'kind':man.get('artifact_kind')})
  indexed={x['path']:x for x in man.get('files',[])}
  payload=[n for n in names if n not in ('release-manifest.json','release-sbom.spdx.json')]
  add(rows,kind+' manifest indexes every payload file',set(indexed)==set(payload),{'indexed':len(indexed),'payload':len(payload)})
  mism=[]
  for n in payload:
   data=z.read(n);r=indexed.get(n,{})
   if r.get('size')!=len(data) or r.get('sha256')!=hashlib.sha256(data).hexdigest():mism.append(n)
  add(rows,kind+' per-file hashes valid',not mism,mism[:20])
  add(rows,kind+' protected secret present',SECRET in names)
  if SECRET in names:
   info=z.getinfo(SECRET);md=(info.external_attr>>16)&0o777;data=z.read(SECRET)
   add(rows,kind+' secret mode 0600',md==0o600,oct(md));add(rows,kind+' two distinct packaged keys',len(set(KEY_RX.findall(data)))==2,{'count':len(set(KEY_RX.findall(data)))})
  leaks=[]
  for n in payload:
   if n==SECRET:continue
   try:data=z.read(n)
   except:continue
   if KEY_RX.search(data):leaks.append(n)
  add(rows,kind+' no credential outside server secret',not leaks,leaks)
  add(rows,kind+' canonical index present',all(x in names for x in ('index.html','index-v5.3.210.html')))
  if 'index.html' in names:
   t=z.read('index.html').decode('utf-8');add(rows,kind+' index boots beta6',VERSION in t and 'design-refinement-v6.0.0-beta6.css' in t and '00-runtime-selector-v6.0.0-beta6.js' in t)

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--json-out',default=str(ROOT/'reports/v6-beta6-archive-verification.json'));ap.add_argument('--extract-dir',default='/mnt/data/v6_beta6_final_extracted');a=ap.parse_args();rows=[]
 original={p.name:sha(p) for p in (HOST,FULL) if p.is_file()}
 inspect_zip(HOST,'hosting-private',rows);inspect_zip(FULL,'full-private-audited',rows)
 extract=Path(a.extract_dir);shutil.rmtree(extract,ignore_errors=True);extract.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(HOST) as z:z.extractall(extract)
 secret=extract/SECRET
 if secret.exists():os.chmod(secret,0o600)
 add(rows,'clean extraction index present',(extract/'index.html').is_file())
 add(rows,'clean extraction release coherent',VERSION in (extract/'index.html').read_text(encoding='utf-8'))
 runtime=json.loads((ROOT/'reports/v6-beta6-runtime-inventory.json').read_text())
 missing=[r for r in runtime['files'] if not (extract/r).is_file()]
 add(rows,'extracted runtime closure complete',not missing and runtime.get('file_count')==317,{'missing':missing,'files':runtime.get('file_count')})
 syntax=[]
 for p in sorted((extract/'api').glob('*.php')):
  r=subprocess.run(['php','-l',str(p)],capture_output=True,text=True);syntax.append({'path':p.name,'ok':r.returncode==0,'detail':(r.stderr or r.stdout)[-200:]})
 for rel in ['assets/js/ivory-brass-shell-v6.js','assets/js/00-runtime-selector-v6.0.0-beta6.js','assets/runtime/runtime-manifest-v6.0.0-beta6.js']:
  r=subprocess.run(['node','--check',str(extract/rel)],capture_output=True,text=True);syntax.append({'path':rel,'ok':r.returncode==0,'detail':(r.stderr or r.stdout)[-200:]})
 add(rows,'extracted runtime syntax valid',all(x['ok'] for x in syntax),syntax)
 # Deterministic rebuild: builder overwrites the same two artifact paths.
 r=subprocess.run(['python',str(ROOT/'tools/build_v6_beta6.py')],cwd=ROOT,capture_output=True,text=True)
 rebuilt={p.name:sha(p) for p in (HOST,FULL) if p.is_file()}
 add(rows,'builder rerun succeeds',r.returncode==0,(r.stderr or r.stdout)[-500:])
 add(rows,'hosting archive byte-reproducible',original.get(HOST.name)==rebuilt.get(HOST.name),{'before':original.get(HOST.name),'after':rebuilt.get(HOST.name)})
 add(rows,'full archive byte-reproducible',original.get(FULL.name)==rebuilt.get(FULL.name),{'before':original.get(FULL.name),'after':rebuilt.get(FULL.name)})
 result={'ok':all(x['ok'] for x in rows),'release_version':VERSION,'assertions':len(rows),'results':rows,'artifacts':{'hosting':{'path':str(HOST),'size':HOST.stat().st_size,'sha256':sha(HOST)},'full':{'path':str(FULL),'size':FULL.stat().st_size,'sha256':sha(FULL)}},'extract_dir':str(extract)}
 out=Path(a.json_out);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
