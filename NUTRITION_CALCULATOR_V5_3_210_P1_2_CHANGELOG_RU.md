# Changelog v5.3.210-p1.2

## Added

- Канонический JSON-реестр нормативов и provenance.
- Детерминированный генератор modern/legacy runtime.
- 19 карточек источников с URL/DOI, издателем и датой проверки.
- Контрольная сумма канонического реестра в каждом результате.
- Дата обязательного пересмотра реестра.
- API adult/child/life-stage/derived resolvers.
- Coverage registry беременности и лактации.
- Отображение версии реестра в справке США/ЕС.
- Browser regression для EFSA B1, B3, B6 и provenance.
- 74 специализированных нормативных assertions.

## Changed

- App-core больше не содержит независимых `usMin/euMin/usUl/euUl`.
- Protected-modes получает pregnancy/lactation targets из реестра.
- Детская HTML-таблица выведена из эксплуатации.
- Ограничения SFA и added sugars рассчитываются через registry derived rules.
- Runtime manifest и release tooling обновлены до P1.2.
- Hosting closure включает канонический JSON для аудита.

## Corrected

- EFSA vitamin B6 UL: 12 → 12,5 мг/сут.
- EFSA thiamin: фиксированное приближение → 0,1 мг/МДж.
- EFSA niacin: фиксированное приближение → 1,6 мг NE/МДж.
- EFSA lactation potassium: 4000 мг добавлен в подтверждённый поднабор.
- EFSA pantothenic acid pregnancy/lactation: 5/7 мг.

## Safety

- Fail-closed при отсутствующем или невалидном реестре.
- Fail-closed жизненного расчёта при просроченном registry review.
- Взрослые нормы не подставляются вместо отсутствующих life-stage значений.
- Private Gemini secret не изменён.


## Release-candidate correction

- Hosting self-test обновлён до manifest/bundle P1.2.
- Удалена достижимость `runtime-manifest-v5.3.210-p1.1.js` и `runtime-bundle-v5.3.210-p1.1.css` из production closure.
- Verifier теперь подтверждает ровно один application CSS bundle текущего релиза.
- Первый candidate ZIP, содержавший два bundle, отклонён и не является финальным артефактом.

## Final audit correction

- Статический скан и сборщик FULL/SOURCE исключают `__pycache__`, Playwright/test reports и стандартные tool caches, поэтому assertion count и состав ZIP не зависят от порядка запуска тестов.
- Эталонный clean-archive static/file count исправлен с 1768 на 1757; все проверки остаются PASS.
- Provenance WHO sodium guardrail уточнён до официального источника `Sodium reduction` (WHO, 2026) и его канонического URL.
