# Встраивание тренажёра в Tilda

## Рекомендуемая схема

Сам тренажёр остаётся отдельным статическим приложением на Cloudflare Pages. В Tilda он встраивается через `iframe`.

Это предпочтительнее, чем копировать весь проект в Zero Block или T123:

- Three.js, CSS, игровая логика и 3D-данные остаются изолированными от CSS/JavaScript Tilda;
- обновление тренажёра на GitHub/Cloudflare автоматически обновляет содержимое внутри курса;
- не нужно вручную синхронизировать несколько файлов внутри редактора Tilda;
- одна и та же сборка может использоваться на разных уроках.

Для текущей версии отдельный backend не требуется: HTML/CSS/JS и 3D-данные работают как статическое приложение. Cloudflare Pages выполняет роль хостинга.

## Код для T123 или HTML-элемента Zero Block

```html
<div style="width:100%;max-width:1600px;margin:0 auto;">
  <iframe
    id="muscle-memory-frame"
    src="https://muscle-memory-mvp.pages.dev/?embed=1"
    title="Тренажёр анатомии мышц"
    loading="lazy"
    allow="fullscreen"
    style="display:block;width:100%;height:900px;border:0;border-radius:16px;overflow:hidden;"
  ></iframe>
</div>

<script>
(function () {
  var frame = document.getElementById("muscle-memory-frame");
  if (!frame) return;

  window.addEventListener("message", function (event) {
    if (event.origin !== "https://muscle-memory-mvp.pages.dev") return;
    if (!event.data || event.data.type !== "muscle-memory-resize") return;

    var height = Number(event.data.height);
    if (!Number.isFinite(height)) return;

    frame.style.height = Math.max(650, Math.min(height, 2200)) + "px";
  });
})();
</script>
```

Параметр `?embed=1` включает облегчённый режим страницы и отправляет родительской странице её актуальную высоту через `postMessage`.

## Варианты ссылок

Обычный тренажёр:

```
https://muscle-memory-mvp.pages.dev/?embed=1
```

Сразу режим исследования плечевого пояса:

```
https://muscle-memory-mvp.pages.dev/?embed=1&mode=explore&region=shoulder
```

Контрольная модель BodyParts3D 4.0:

```
https://muscle-memory-mvp.pages.dev/quality-lab.html
```

## Когда понадобится backend

Не нужен для:
- просмотра 3D;
- локальной игры;
- поиска и скрытия структур;
- счёта в рамках открытой страницы;
- адаптации вопросов в рамках одной сессии.

Понадобится, если мы захотим:
- сохранять прогресс между устройствами;
- связывать результаты с конкретным учеником Tilda;
- видеть результаты преподавателю;
- хранить интервальные повторения на сервере;
- строить аналитику по группе.

Для этого логично оставить фронтенд на Cloudflare Pages и добавить отдельный API/хранилище (например, Cloudflare Worker + D1/KV или другой backend). Это не требует переносить сам 3D-интерфейс с Pages.
