#!/usr/bin/env python3
import json, os, pathlib, shutil, subprocess, tempfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
PHP=str(ROOT/'api/gemini.php').replace('\\','\\\\').replace("'","\\'")

def run(env, docroot=''):
    code=f'''define('NUTRITION_GEMINI_TEST_MODE',true); $_SERVER['REMOTE_ADDR']='198.51.100.10'; $_SERVER['DOCUMENT_ROOT']='{docroot}'; require '{PHP}'; try{{$d=nutrition_guard_storage_dir();echo json_encode(['ok'=>true,'dir'=>$d,'perms'=>substr(sprintf('%o',fileperms($d)),-4)]);}}catch(Throwable $e){{echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);exit(2);}}'''
    e=os.environ.copy(); e.update(env)
    p=subprocess.run(['php','-r',code],cwd=ROOT,env=e,text=True,capture_output=True)
    try: data=json.loads(p.stdout)
    except Exception: raise RuntimeError(f'bad output {p.returncode}: {p.stdout} {p.stderr}')
    return p.returncode,data

checks=0
# Secure default: without a document root or explicit persistent directory, AI fails closed.
rc,d=run({'NUTRITION_GEMINI_GUARD_DIR':'','NUTRITION_GEMINI_REQUIRE_PERSISTENT_GUARD':'','NUTRITION_GEMINI_ALLOW_EPHEMERAL_GUARD':''})
assert rc==2 and d['error']=='guard_persistent_storage_required',d; checks+=1
# Ephemeral storage is available only through an explicit development override.
rc,d=run({'NUTRITION_GEMINI_GUARD_DIR':'','NUTRITION_GEMINI_ALLOW_EPHEMERAL_GUARD':'1'})
assert rc==0 and d['ok'] and 'nutrition-gemini-guard-' in d['dir'],d; checks+=1
shutil.rmtree(d['dir'],ignore_errors=True)
with tempfile.TemporaryDirectory(prefix='nutrition-p041-policy-') as tmp:
    root=pathlib.Path(tmp); web=root/'public'; web.mkdir(); inside=web/'guard'; outside=root/'guard'
    # Default hosting path is persistent and outside the public document root.
    rc,d=run({'NUTRITION_GEMINI_GUARD_DIR':'','NUTRITION_GEMINI_ALLOW_EPHEMERAL_GUARD':''},str(web))
    assert rc==0 and d['ok'] and pathlib.Path(d['dir']).parent==root and d['perms']=='0700',d; checks+=1
    shutil.rmtree(d['dir'],ignore_errors=True)
    rc,d=run({'NUTRITION_GEMINI_GUARD_DIR':str(inside)},str(web))
    assert rc==2 and d['error']=='guard_storage_inside_webroot',d; checks+=1
    rc,d=run({'NUTRITION_GEMINI_GUARD_DIR':str(inside),'NUTRITION_GEMINI_ALLOW_GUARD_IN_WEBROOT':'1'},str(web))
    assert rc==0 and d['ok'],d; checks+=1
    shutil.rmtree(inside)
    rc,d=run({'NUTRITION_GEMINI_GUARD_DIR':str(outside),'NUTRITION_GEMINI_REQUIRE_PERSISTENT_GUARD':'1'},str(web))
    assert rc==0 and d['ok'] and d['perms']=='0700',d; checks+=1
print(json.dumps({'status':'PASS','assertions':checks},ensure_ascii=False,indent=2))
