# Nutrient Android — автономное приложение (альфа)

Ветка `feature/nutrient-android-offline-20261023` содержит изолированную Android-оболочку и **явно выбранные** клиентские файлы калькулятора VesninMed. Ветка `main` не изменена.

- Исходники Android: [`android/`](android/README.md).
- Запуск сборки: [Nutrient Android Offline APK](../../actions/workflows/nutrient-android-offline.yml).
- Результат CI: архив `nutrient-android-offline-alpha`, в нём `app-debug.apk`.
- В APK нет разрешения `INTERNET`: ядро, расчёты и данные упакованы локально.
- Фото: экспериментальная локальная классификация. Аудиораспознавания пока нет.

**Статус:** предварительная сборка; точность, интерфейс и сохранность данных необходимо проверить на Android до распространения.

Состав переноса ограничен `site/tools/nutrition/`, выбранными файлами `site/assets/` и `android/`. Серверные каталоги, конфигурации и история закрытого сайта не переносились.
