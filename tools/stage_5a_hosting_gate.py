#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, os, shutil, signal, socket, subprocess, tempfile, time, zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
UI_RELEASE='v5.3.210-rc2-hf18'
API_RELEASE='v5.3.210-rc2'

def free_port():
    s=socket.socket();s.bind(('127.0.0.1',0));port=s.getsockname()[1];s.close();return port

def run(cmd, *, env=None, cwd=ROOT, timeout=600, capture=True):
    merged=os.environ.copy();
    if env: merged.update(env)
    p=subprocess.run(cmd,cwd=cwd,env=merged,text=True,capture_output=capture,timeout=timeout)
    return {'command':[str(x) for x in cmd],'exit_code':p.returncode,'passed':p.returncode==0,'stdout':p.stdout[-20000:] if capture else '', 'stderr':p.stderr[-10000:] if capture else ''}

def start_apache(docroot:Path, port:int, tmp:Path):
    conf=tmp/'httpd.conf';guard=tmp/'guard';guard.mkdir();os.chmod(guard,0o700)
    conf.write_text(f'''ServerRoot "/etc/apache2"\nPidFile "{tmp/'httpd.pid'}"\nListen 127.0.0.1:{port}\nIncludeOptional mods-enabled/*.load\nIncludeOptional mods-enabled/*.conf\nLoadModule headers_module /usr/lib/apache2/modules/mod_headers.so\nUser www-data\nGroup www-data\nServerName 127.0.0.1\nErrorLog "{tmp/'error.log'}"\nCustomLog "{tmp/'access.log'}" combined\nLogLevel warn\nDocumentRoot "{docroot}"\n<Directory "{docroot}">\n Options -Indexes +FollowSymLinks\n AllowOverride All\n Require all granted\n</Directory>\nDirectoryIndex index.html\n''',encoding='utf-8')
    check=run(['apache2','-t','-f',str(conf)]); 
    if not check['passed']: raise RuntimeError(check['stderr'] or check['stdout'])
    env=os.environ.copy();env.update({'NUTRITION_GEMINI_ENABLED':'0','NUTRITION_GEMINI_GUARD_DIR':str(guard)})
    proc=subprocess.Popen(['apache2','-f',str(conf),'-DFOREGROUND'],env=env,stdout=(tmp/'apache.stdout').open('w'),stderr=subprocess.STDOUT,start_new_session=True)
    return proc

def stop_proc(proc):
    if not proc:return
    try:os.killpg(proc.pid,signal.SIGTERM)
    except ProcessLookupError:return
    try:proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        try:os.killpg(proc.pid,signal.SIGKILL)
        except ProcessLookupError:pass
        proc.wait(timeout=5)

def wait_url(url, timeout=20):
    import urllib.request
    end=time.time()+timeout
    while time.time()<end:
        try:
            with urllib.request.urlopen(url,timeout=2) as r:
                if r.status==200:return True
        except Exception:pass
        time.sleep(.15)
    return False

def atomic_rehearsal(artifact:Path,tmp:Path):
    releases=tmp/'releases';current=tmp/'current';releases.mkdir()
    first=run(['bash','tools/deploy_atomic.sh',str(artifact),str(releases),str(current)],timeout=900)
    first_target=Path(first['stdout'].strip().splitlines()[-1]) if first['passed'] and first['stdout'].strip() else None
    second=run(['bash','tools/deploy_atomic.sh',str(artifact),str(releases),str(current)],timeout=900)
    second_target=Path(second['stdout'].strip().splitlines()[-1]) if second['passed'] and second['stdout'].strip() else None
    rollback=run(['bash','tools/rollback_atomic.sh',str(releases),str(current)],timeout=120)
    current_target=Path(os.path.realpath(current)) if current.exists() or current.is_symlink() else None
    passed=all(x['passed'] for x in (first,second,rollback)) and first_target and second_target and first_target!=second_target and current_target==first_target
    return {'passed':bool(passed),'first_target':str(first_target) if first_target else None,'second_target':str(second_target) if second_target else None,'current_after_rollback':str(current_target) if current_target else None,'steps':{'first':first,'second':second,'rollback':rollback}}

def main():
    ap=argparse.ArgumentParser(description='Stage 5A actual-HTTP hosting acceptance and rollback rehearsal.')
    ap.add_argument('--artifact',required=True)
    ap.add_argument('--project',action='append',choices=['chromium','firefox','webkit'],default=[])
    ap.add_argument('--json-out',default='reports/stage-5a-hosting-acceptance.json')
    ap.add_argument('--pdf-out',default='reports/stage-5a-hosting-print.pdf')
    ap.add_argument('--keep-extracted');ap.add_argument('--direct-browser',action='store_true',help='Navigate the real local Apache URL (may be blocked by managed browser policy)');ap.add_argument('--skip-browser',action='store_true',help='Run Apache surface and rollback rehearsal only')
    args=ap.parse_args();artifact=Path(args.artifact).resolve();projects=args.project or ['chromium']
    result={'schema_version':1,'ui_release_version':UI_RELEASE,'api_release_version':API_RELEASE,'artifact':str(artifact),'projects':projects,'checks':{},'limitations':[]}
    with tempfile.TemporaryDirectory(prefix='nutrition-stage5a-hosting-') as td:
        tmp=Path(td);os.chmod(tmp,0o755);root=tmp/'hosting';root.mkdir();os.chmod(root,0o755)
        with zipfile.ZipFile(artifact) as z:z.extractall(root)
        for d in [p for p in root.rglob('*') if p.is_dir()]: os.chmod(d,0o755)
        for f in [p for p in root.rglob('*') if p.is_file()]: os.chmod(f,0o644)
        if args.keep_extracted:shutil.copytree(root,Path(args.keep_extracted),dirs_exist_ok=True)
        port=free_port();proc=start_apache(root,port,tmp);base=f'http://127.0.0.1:{port}'
        try:
            if not wait_url(base+'/api/gemini.php'):raise RuntimeError('Apache staging did not become ready')
            smoke=run([str(ROOT/'tools/remote_smoke_stage5a.py'),base,'--expected-ui',UI_RELEASE,'--expected-api',API_RELEASE,'--allow-http','--json-out',str(ROOT/'reports/stage-5a-hosting-remote-smoke.json')],timeout=120)
            result['checks']['remote_smoke']=smoke
            browser=[]
            if not args.skip_browser:
                for project in projects:
                    report=ROOT/f'reports/stage-5a-hosting-browser-{project}.json'
                    browser_base=base if args.direct_browser else 'https://nutrition-stage.test'
                    cmd=[str(ROOT/'tools/stage_5a_hosting_browser.py'),browser_base,'--engine',project,'--json-out',str(report.relative_to(ROOT)),'--pdf-out',args.pdf_out]
                    if not args.direct_browser:cmd.extend(['--virtual-root',str(root)])
                    if project=='chromium':cmd.extend(['--executable','/usr/bin/chromium'])
                    step=run(cmd,timeout=900)
                    step['report']=str(report.relative_to(ROOT));browser.append(step)
                result['checks']['browser_projects']={'passed':all(x['passed'] for x in browser),'status':'PASSED' if all(x['passed'] for x in browser) else 'FAILED','runs':browser}
            else:
                result['checks']['browser_projects']={'passed':False,'status':'PENDING_EXTERNAL_STAGING_BROWSER','runs':[]}
        finally:stop_proc(proc)
        rehearsal=atomic_rehearsal(artifact,tmp);result['checks']['atomic_deploy_rollback']=rehearsal
    unavailable=[p for p,x in zip(projects,result['checks']['browser_projects']['runs']) if not x['passed'] and ('Executable doesn\'t exist' in x['stderr'] or 'browserType.launch' in x['stderr'])]
    if unavailable:result['limitations'].append('Unavailable browser binaries: '+', '.join(unavailable))
    result['local_readiness_passed']=result['checks']['remote_smoke']['passed'] and result['checks']['atomic_deploy_rollback']['passed']
    result['external_browser_passed']=result['checks']['browser_projects']['passed']
    result['passed']=result['local_readiness_passed'] and (args.skip_browser or result['external_browser_passed'])
    result['decision']='READY_FOR_EXTERNAL_STAGING_BROWSER' if result['local_readiness_passed'] and not result['external_browser_passed'] else ('STAGE5A_HOSTING_ACCEPTED' if result['passed'] else 'BLOCKED')
    out=ROOT/args.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'passed':result['passed'],'base_mode':('direct Apache URL' if args.direct_browser else 'Apache network checks + virtual browser origin over extracted artifact'),'projects':projects,'remote_smoke':result['checks']['remote_smoke']['passed'],'browser_status':result['checks']['browser_projects']['status'],'rollback':rehearsal['passed'],'report':str(out.relative_to(ROOT))},ensure_ascii=False,indent=2))
    raise SystemExit(0 if result['passed'] else 1)
if __name__=='__main__':main()
