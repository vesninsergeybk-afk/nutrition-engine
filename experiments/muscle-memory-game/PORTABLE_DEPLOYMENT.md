# Portable deployment / автономная сборка

## Цель

Создать статическую сборку тренажёра, которая не зависит во время работы ученика от GitHub, jsDelivr, Cloudflare или других внешних CDN.

## Важно: текущая версия ещё не автономна

Сейчас runtime обращается к внешним источникам:

- Three.js и addons загружаются с jsDelivr;
- Z-Anatomy web GLB загружаются с `raw.githubusercontent.com`;
- контрольная BodyParts3D 4.0 модель загружает `atlas.json` и binary chunks из закреплённого commit Human Atlas на `raw.githubusercontent.com`.

Поэтому простой ZIP текущей папки **не является автономным production bundle**.

## Целевая структура

```
dist/
  index.html
  quality-lab.html
  app.js
  quality-lab.js
  styles.css
  quality-lab.css

  vendor/
    three/
      three.module.js
      addons/
        controls/OrbitControls.js
        loaders/GLTFLoader.js
        utils/BufferGeometryUtils.js

  models/
    z-anatomy/
      kas.glb
      iskelet.glb

    bodyparts3d-4-control/
      atlas.json
      body-*.bin.gz

  licenses/
    THIRD_PARTY_NOTICES.md
    ...
```

Все URL в runtime должны быть относительными к этой сборке.

## Два способа публикации

### Git / App Platform

Готовая директория `dist` хранится или генерируется в репозитории и деплоится как HTML/CSS/JS приложение.

Плюс: автоматический deploy после commit.

### Portable ZIP

`dist/` упаковывается в архив `muscle-memory-static.zip`.

Такой архив можно:
- загрузить на обычный веб-хостинг;
- распаковать в document root;
- разместить в S3-compatible static website;
- держать как резервную копию production.

Для статического приложения серверная логика не требуется: нужен только HTTP(S)-сервер, корректно отдающий HTML/JS/CSS/GLB/BIN и поддерживающий HTTPS.

## Где хранить большие модели

GitHub подходит для небольших бинарных файлов, но не является хорошим хранилищем для сотен мегабайт high-resolution anatomy.

Для крупных моделей:
- хранить оригиналы/production assets в S3-compatible object storage;
- в portable ZIP включать только те региональные оптимизированные assets, которые реально нужны конкретной версии тренажёра;
- сохранять checksum и source manifest для воспроизводимости.

## Что означает «модели лежат у нас»

После vendor/self-host шага мы будем иметь собственные точные копии используемых файлов и сами отдавать их ученику с нашего хостинга.

Это **не означает владение авторскими правами**. Происхождение, attribution и условия использования каждого набора сохраняются независимо от того, где физически лежит файл.

## Build-задача на следующий этап

Нужен скрипт, который:

1. берёт закреплённые версии зависимостей;
2. копирует Three.js/addons локально;
3. копирует выбранные 3D assets;
4. заменяет внешние URL на относительные;
5. проверяет отсутствие runtime-ссылок на GitHub/jsDelivr/Cloudflare;
6. запускает `verify.mjs`;
7. собирает `dist/`;
8. создаёт `muscle-memory-static.zip`;
9. формирует manifest с SHA-256 всех model assets.
