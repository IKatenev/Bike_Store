# Context

Автономный прототип использует HTML strings, локальные SVG и browser storage.
Сохранённые content.articles могут не содержать новых fixture статей или metadata.
Изменения авторизованы владельцем как следующая итерация главной.

# Goals / Non-Goals

Пропорции hero 70/30 desktop, два равных предложения, одна CTA в каждом слайде,
три свежих опубликованных статьи непосредственно перед footer. Остальные потоки
и 105 проверок сохраняются. Бренды/реальные кампании выбираются позже.

# Decisions

- Desktop от 901px: grid 7fr/3fr с небольшим gap; справа две равные строки,
  высота всей колонны соответствует слайдеру. Controls внутри основного carousel
  снаружи slide anchor. Картинка — фон/сцена, заголовок/CTA поверх неё с контрастом.
- <=900px слайдер сверху, две промокарточки ниже в двух равных колонках;
  на телефоне также две, компактный текст. Без overflow на 360/390.
- Slide anchor содержит span с видом кнопки, но без nested anchor/button.
  Одна ссылка/фокус на слайд; controls самостоятельные buttons. Hidden слайды
  исключены из отображения и фокуса. Не добавлять autoplay.
- Две временные промокарточки — Northgate / Larkhill, существующие brand filters
  каталога с URL encoding. Это демонстрационные предложения, не повтор категорий.
- Статьи берутся из текущего content state, только published, publishedAt descending,
  стабильный slug tie. Preview — начало body, не отдельный excerpt; textContent escaped.
  Локальная artVariant или SVG image, time datetime, en-GB readable date,
  CSS line-clamp:4. Desktop три колонки, phone одна/адаптивная без overflow.
- Добавить две опубликованные synthetic статьи и metadata существующей; unpublished
  winter-commute не публиковать. При legacy migration добавить лишь отсутствующие
  новые fixtures, а существующим missing metadata задать defaults; title/body и
  публикационные изменения пользователя не перезаписывать.
- При менее трёх published показывать доступные, не фабриковать/дублировать записи.
  При нуле секцию скрыть. Картинка/date не требуют внешних запросов.

# Risks / Validation

Legacy storage может скрыть новые статьи; безопасная миграция проверяется отдельно.
Кликабельная сцена не должна накрыть controls. Browser desktop 1440/1024, 768/390/360:
пропорции, равенство promo, links, ручная смена, три latest cards и четыре строки.
Meaningful tests сортировки/публикации/legacy preserve; не тестировать CSS строками.

# Ownership

Sol владеет planning/docs/acceptance; единственный worker — DeepSeek через toolkit,
scope prototype/**, docs/prototype.md, собственный deviations.md. Не менять user file.
