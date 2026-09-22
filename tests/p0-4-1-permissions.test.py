#!/usr/bin/env python3
import json, pathlib, stat
root=pathlib.Path(__file__).resolve().parents[1]
assertions=0
bad=[]
for p in root.rglob('*'):
    mode=stat.S_IMODE(p.stat().st_mode)
    if mode & 0o022: bad.append((str(p.relative_to(root)),oct(mode)))
assert not bad, f'group/world writable paths: {bad[:20]}'
assertions+=1
assert stat.S_IMODE((root/'api/gemini.php').stat().st_mode)==0o644
assertions+=1
assert stat.S_IMODE((root/'api/gemini-secret.php').stat().st_mode)==0o644
assertions+=1
assert stat.S_IMODE((root/'index.html').stat().st_mode)==0o644
assertions+=1
for p in list((root/'tests').glob('*.sh'))+list((root/'tests').glob('*.py')):
    assert stat.S_IMODE(p.stat().st_mode)==0o755,(p,oct(stat.S_IMODE(p.stat().st_mode)))
assertions+=1
print(json.dumps({'status':'PASS','assertions':assertions,'group_or_world_writable':0},ensure_ascii=False,indent=2))
