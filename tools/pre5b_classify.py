#!/usr/bin/env python3
from __future__ import annotations
import argparse, csv, hashlib, json, os, re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNTIME_REPORT = ROOT / 'reports/pre5b-runtime-inventory.json'
CONFIG = ROOT / 'config/runtime-assets.v5.3.210-rc2.json'
TEXT_EXT = {'.py','.sh','.js','.json','.php','.html','.css','.yml','.yaml','.xml','.txt'}
EXCLUDED_SCAN_PREFIXES = ('reports/','release/','archive/','__pycache__/')
EXCLUDED_SCAN_NAMES = {'release-manifest.json','release-sbom.spdx.json'}
VERSION_RE = re.compile(r'(?:^|[-_.])(?:v?\d+(?:\.\d+)+|hf\d+|rc\d+|p\d+(?:\.\d+)?|pc\d+|pass\d+)(?:[-_.]|$)', re.I)
LEGAL_OR_EXAMPLE_RE = re.compile(r'(?:^|/)(?:LICENSE|COPYING|NOTICE)(?:\.|$)|\.example\.|secret\.example', re.I)


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def load_runtime() -> dict:
    if not RUNTIME_REPORT.is_file():
        raise SystemExit(f'missing runtime report: {RUNTIME_REPORT}')
    return json.loads(RUNTIME_REPORT.read_text(encoding='utf-8'))


def config_inputs() -> set[str]:
    cfg = json.loads(CONFIG.read_text(encoding='utf-8'))
    out: set[str] = {CONFIG.relative_to(ROOT).as_posix()}
    for key, value in cfg.items():
        if isinstance(value, list):
            for item in value:
                if isinstance(item, str) and item.startswith(('./assets/','./data/','./api/','assets/','data/','api/')):
                    out.add(item.split('?',1)[0].lstrip('./'))
        elif isinstance(value, str) and value.startswith(('./assets/','./data/','./api/','assets/','data/','api/')):
            out.add(value.split('?',1)[0].lstrip('./'))
    return out


def searchable_files() -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []
    for path in ROOT.rglob('*'):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT).as_posix()
        if rel in EXCLUDED_SCAN_NAMES or rel.startswith(EXCLUDED_SCAN_PREFIXES):
            continue
        if path.suffix.lower() not in TEXT_EXT and path.name not in {'.htaccess','_headers'}:
            continue
        try:
            text = path.read_text(encoding='utf-8')
        except (UnicodeDecodeError, OSError):
            text = path.read_text(encoding='utf-8', errors='ignore')
        rows.append((rel, text))
    return rows


def classify() -> dict:
    inv = load_runtime()
    reachable = set(inv['files'])
    unreachable = list(inv['unreachable'])
    build_inputs = config_inputs()
    search = searchable_files()
    items = []
    counts = Counter()
    bytes_by_category = Counter()

    for rel in unreachable:
        path = ROOT / rel
        exact_refs = []
        for source_rel, text in search:
            if source_rel == rel:
                continue
            if rel in text:
                exact_refs.append(source_rel)
        is_build_input = rel in build_inputs
        is_legal = bool(LEGAL_OR_EXAMPLE_RE.search(rel))
        is_versioned = bool(VERSION_RE.search(Path(rel).name))
        if is_build_input:
            category = 'retain_build_input'
            reason = 'Файл не загружается отдельно, но указан как исходник действующей сборки.'
        elif is_legal:
            category = 'retain_legal_or_example'
            reason = 'Лицензия, уведомление или безопасный пример конфигурации.'
        elif exact_refs:
            roots = sorted({x.split('/',1)[0] for x in exact_refs})
            category = 'retain_source_or_test_dependency'
            reason = 'На файл есть точная ссылка в исходниках, инструментах, тестах или контрактах: ' + ', '.join(roots)
        elif is_versioned:
            category = 'quarantine_high_confidence'
            reason = 'Версионированный файл не входит в runtime, не участвует в сборке и не имеет точных ссылок.'
        else:
            category = 'manual_review_unversioned'
            reason = 'Нет точных ссылок, но имя не позволяет безопасно считать файл устаревшей версией.'
        size = path.stat().st_size if path.is_file() else 0
        row = {
            'path': rel,
            'category': category,
            'reason': reason,
            'size_bytes': size,
            'sha256': sha256(path) if path.is_file() else None,
            'exact_references': exact_refs,
            'build_input': is_build_input,
            'versioned_name': is_versioned,
        }
        items.append(row)
        counts[category] += 1
        bytes_by_category[category] += size

    return {
        'schema_version': 1,
        'source_release': 'v5.3.210-rc2-hf18',
        'runtime_reachable_count': len(reachable),
        'runtime_missing_count': len(inv.get('missing', [])),
        'unreachable_count': len(unreachable),
        'counts': dict(sorted(counts.items())),
        'bytes_by_category': dict(sorted(bytes_by_category.items())),
        'items': items,
    }


def write_outputs(result: dict, json_out: Path, csv_out: Path, md_out: Path) -> None:
    json_out.parent.mkdir(parents=True, exist_ok=True)
    json_out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    with csv_out.open('w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f)
        w.writerow(['path','category','size_bytes','sha256','reason','exact_reference_count'])
        for item in result['items']:
            w.writerow([item['path'], item['category'], item['size_bytes'], item['sha256'] or '', item['reason'], len(item['exact_references'])])
    counts = result['counts']
    sizes = result['bytes_by_category']
    lines = [
        '# Этап 5Б.0 — доказательная классификация старых зависимостей', '',
        f"Активный runtime: **{result['runtime_reachable_count']} файлов**.",
        f"Файлы вне runtime: **{result['unreachable_count']}**.", '',
        '## Классификация', '',
        '| Категория | Файлов | Объём | Решение |',
        '|---|---:|---:|---|',
    ]
    labels = {
        'retain_build_input': 'Исходники действующей сборки',
        'retain_legal_or_example': 'Лицензии и безопасные примеры',
        'retain_source_or_test_dependency': 'Зависимости исходников, тестов и инструментов',
        'quarantine_high_confidence': 'Кандидаты на карантин высокой уверенности',
        'manual_review_unversioned': 'Неверсионированные файлы для ручной проверки',
    }
    decisions = {
        'retain_build_input': 'Сохранить в активном дереве.',
        'retain_legal_or_example': 'Сохранить.',
        'retain_source_or_test_dependency': 'Не удалять до миграции потребителя.',
        'quarantine_high_confidence': 'Перенести в отдельный архив и проверить очищенную копию.',
        'manual_review_unversioned': 'Не трогать автоматически.',
    }
    for key in labels:
        lines.append(f"| {labels[key]} | {counts.get(key,0)} | {sizes.get(key,0)/1024/1024:.2f} МБ | {decisions[key]} |")
    lines += ['', '## Принцип безопасности', '',
              'Файл не признаётся устаревшим только потому, что браузер не загружает его напрямую. '
              'Сначала исключаются исходники CSS-bundle, тестовые и генераторные зависимости, лицензии и примеры конфигурации. '
              'В карантин попадают только версионированные файлы без runtime-достижимости, без участия в сборке и без точных ссылок в рабочем дереве.', '']
    q = [x for x in result['items'] if x['category']=='quarantine_high_confidence']
    lines += ['## Кандидаты на карантин', ''] + [f"- `{x['path']}`" for x in q]
    md_out.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--json-out', default='reports/stage-5b0-classification.json')
    ap.add_argument('--csv-out', default='reports/stage-5b0-classification.csv')
    ap.add_argument('--md-out', default='NUTRITION_CALCULATOR_V5_3_210_RC2_HF18_STAGE5B0_DEPENDENCY_CLASSIFICATION_RU.md')
    args = ap.parse_args()
    result = classify()
    write_outputs(result, ROOT/args.json_out, ROOT/args.csv_out, ROOT/args.md_out)
    print(json.dumps({
        'ok': result['runtime_missing_count']==0,
        'runtime_reachable_count': result['runtime_reachable_count'],
        'unreachable_count': result['unreachable_count'],
        'counts': result['counts'],
        'quarantine_bytes': result['bytes_by_category'].get('quarantine_high_confidence',0),
    }, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
