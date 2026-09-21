# Changelog P2.0

Версия: `v5.3.210-p2.0`

- зафиксированы intended use, excluded uses и границы защищённых режимов;
- добавлена пятидоменная validation evidence policy;
- сформирован слепой пакет из 51 кейса и приватный answer key;
- добавлена слепая CSV-матрица для внешнего review;
- reviewer template предзаполнен всеми case IDs без эталонных ответов;
- добавлен privacy-minimised pilot observation template;
- добавлены pending/template evidence ledgers с version/hash binding;
- создан строгий validator подписанного внешнего evidence package;
- добавлен test-only accepted fixture и негативные gate-сценарии;
- runtime и пользовательский отчёт показывают `EXTERNAL_VALIDATION_PENDING`;
- clinical validation claim остаётся заблокированным;
- P2.0 policy включена в modern/legacy runtime, manifest, SBOM и hosting self-test;
- report builder получил новый cache key P2.0;
- release-profile требует manual acceptance и отдельный внешний evidence-файл;
- полный P0–P1.5 regression сохранён.
