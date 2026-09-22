#!/usr/bin/env python3
from __future__ import annotations
import argparse, collections, csv, hashlib, json, math, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VERSION='v5.3.210-p1.3'
POLICY=json.loads((ROOT/'config/product-provenance-policy.v5.3.210-p1.3.json').read_text(encoding='utf-8'))
NUTRIENTS=POLICY['nutrient_fields']

def load_products():
    out=[]
    for i in range(1,13): out += json.loads((ROOT/f'data/products.{VERSION}.part-{i:02d}.json').read_text(encoding='utf-8'))
    return out

def norm_name(p):
    s=str(p.get('name_ru') or p.get('name') or '').lower().replace('ё','е')
    s=re.sub(r'[^a-zа-я0-9]+',' ',s);return ' '.join(s.split())

def vector_hash(p):
    vals=[round(float(p.get(k) or 0),6) for k in NUTRIENTS]
    return hashlib.sha256(json.dumps(vals,separators=(',',':')).encode()).hexdigest()[:16]

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--json-out',default='reports/p1-3b-analytics.json');ap.add_argument('--md-out',default='NUTRITION_CALCULATOR_V5_3_210_P1_3_ANALYTICAL_REVIEW_RU.md');ap.add_argument('--csv-out',default='NUTRITION_CALCULATOR_V5_3_210_P1_3_REVIEW_QUEUE.csv');args=ap.parse_args()
    ps=load_products(); failures=[]; review=[]; method_counts=collections.Counter(); source_counts=collections.Counter(); tier_counts=collections.Counter(); status_counts=collections.Counter(); issue_counts=collections.Counter()
    for p in ps:
        key=p.get('key');q=p.get('data_quality_v1_3') or {};groups=p.get('nutrient_provenance_v1_3') or {}
        classified=[]
        for method,fields in groups.items():
            method_counts[method]+=len(fields);classified+=fields
        missing=set(NUTRIENTS)-set(classified);dups=[k for k,n in collections.Counter(classified).items() if n>1]
        if missing: failures.append(f'{key}: unclassified {sorted(missing)}')
        if dups: failures.append(f'{key}: multiply classified {sorted(dups)}')
        source_counts[q.get('source_kind','UNRESOLVED')]+=1;tier_counts[q.get('confidence_tier','LOW')]+=1;status_counts[q.get('review_status','REVIEW_REQUIRED')]+=1
        for issue in q.get('issues') or []: issue_counts[issue]+=1
        reasons=[x for x in (q.get('issues') or []) if x not in {'ENERGY_MACRO_FORMULA_NOT_APPLICABLE'}]
        if q.get('review_status') in {'REVIEW_REQUIRED','BLOCKED'}: reasons.append(q.get('review_status'))
        if q.get('confidence_tier')=='HIGH' and q.get('source_kind') not in {'PRIMARY_DATASET','OFFICIAL_LABEL','MIXED_SOURCE'}: reasons.append('HIGH_CONFIDENCE_MODEL_RECHECK')
        if q.get('confidence_tier')=='HIGH' and len(p.get('unknown_zero_fields_v1_3') or [])>=10: reasons.append('HIGH_CONFIDENCE_MANY_ASSUMED_ZEROS')
        if reasons:
            review.append({'key':key,'name_ru':p.get('name_ru') or p.get('name'),'state':p.get('state'),'source_kind':q.get('source_kind'),'confidence_tier':q.get('confidence_tier'),'confidence_score':q.get('confidence_score'),'review_status':q.get('review_status'),'assumed_zero_count':len(p.get('unknown_zero_fields_v1_3') or []),'issues':' | '.join(sorted(set(reasons))),'source_id':p.get('source_id'),'source_dataset':p.get('source_dataset'),'source_version':p.get('source_version'),'source_url':p.get('source_url')})
    # Exact duplicate vectors and same-name candidates are analytics, not automatic deletion.
    by_vector=collections.defaultdict(list);by_name_state=collections.defaultdict(list);by_source=collections.defaultdict(list)
    for p in ps:
        by_vector[vector_hash(p)].append(p['key']);by_name_state[(norm_name(p),str(p.get('state') or ''))].append(p['key']);by_source[str(p.get('source_id') or '')].append(p['key'])
    exact_vector_groups=[v for v in by_vector.values() if len(v)>1]
    same_name_state=[v for k,v in by_name_state.items() if k[0] and len(v)>1]
    shared_source=[v for k,v in by_source.items() if k and len(v)>1]
    result={'ok':not failures,'version':VERSION,'products':len(ps),'failures':failures,'counts':{'source_kinds':dict(sorted(source_counts.items())),'confidence_tiers':dict(sorted(tier_counts.items())),'review_statuses':dict(sorted(status_counts.items())),'nutrient_methods':dict(sorted(method_counts.items())),'issues':dict(sorted(issue_counts.items()))},'review_queue_count':len(review),'exact_nutrient_vector_duplicate_groups':len(exact_vector_groups),'same_name_state_duplicate_groups':len(same_name_state),'shared_source_id_groups':len(shared_source),'top_exact_vector_groups':sorted(exact_vector_groups,key=len,reverse=True)[:20],'same_name_state_groups':same_name_state[:30]}
    jout=ROOT/args.json_out;jout.parent.mkdir(parents=True,exist_ok=True);jout.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    with (ROOT/args.csv_out).open('w',encoding='utf-8-sig',newline='') as f:
        fields=list(review[0].keys()) if review else ['key'];w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(sorted(review,key=lambda r:(r['review_status']!='BLOCKED',r['confidence_score'],r['key'])))
    md=[]
    md += ['# P1.3B — аналитический повторный проход продуктовой базы','',f'Версия: `{VERSION}`  ',f'Дата: 2026-07-18  ',f'Карточек: **{len(ps)}**','', '## Итог', '']
    md.append('Структурная миграция воспроизводима и полна: каждый расчётный нутриент каждой карточки отнесён ровно к одному provenance-классу.' if not failures else 'Обнаружены нарушения структурной миграции; выпуск заблокирован.')
    md += ['', '## Распределение confidence', '']+[f'- {k}: **{v}**' for k,v in sorted(tier_counts.items())]
    md += ['', '## Статусы ревью', '']+[f'- {k}: **{v}**' for k,v in sorted(status_counts.items())]
    md += ['', '## Причины аналитической очереди', '']+[f'- {k}: **{v}**' for k,v in issue_counts.most_common()]
    md += ['',f'В расширенную очередь аналитического ревью попало **{len(review)}** карточек. Она включает обязательные ошибки/предупреждения и отдельные случаи возможного завышения confidence.','', '## Дубли и повторное использование источников', '',f'- Группы полностью одинаковых нутриентных векторов: **{len(exact_vector_groups)}**.',f'- Совпадения нормализованного названия и состояния: **{len(same_name_state)}**.',f'- Источники, используемые более чем одной карточкой: **{len(shared_source)}**.','', 'Совпадение вектора или источника само по себе не означает ошибку: рецептурные варианты, состояния приготовления и брендовые карточки могут законно наследовать один профиль. Эти группы не удаляются автоматически и остаются предметом P1.4/golden-case и ручного provenance-review.','', '## Решение P1.3B', '', '- Не изменять числовые нутриенты автоматически на основании эвристики.', '- Не трактовать совместимые нули как измеренное отсутствие.', '- Понижать confidence только по формализованным причинам, а не по названию продукта.', '- Вынести карточки с крупным энергетическим расхождением и нестабильной ссылкой этикетки в явную очередь ревью.', '- Передавать uncertainty и assumed-zero состояние в расчётное ядро и AI-контракт.','']
    (ROOT/args.md_out).write_text('\n'.join(md),encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))
    raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__': main()
