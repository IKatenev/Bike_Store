# Приёмка Sol — следующая итерация главной

Дата: 10 октября 2026. Run `run_deepseek-flash-bike-store-home-promotions`
13:19:06–13:24:46 UTC (17:19:06–17:24:46 Asia/Yerevan), exit 0.
Итог: **принято** после независимой проверки.

| Критерий | Доказательство | Результат |
|---|---|---|
| PRO-08, 70/30 desktop | Browser 1440: main882px/promo378px, 7/3 без gap, две карточки378×188, колонна396px равна carousel; 1024: grid664.3/284.7, равные карточки | Выполнено |
| Whole-slide и одна CTA | Внутри anchor нет nested links/buttons, один h1 видимого слайда; Next меняет предложение, click city slide открывает #catalog?category=bikes&type=hybrid; controls не переходят | Выполнено |
| Два промо | Northgate/Larkhill открывают свои brand filters; это временные демонстрационные предложения | Выполнено |
| Responsive | 768: слайдер сверху, promo345×177 в двух колонках; 390: promo156×250; 360: promo142.5×252.3; page width<=viewport; текст читабелен после overlay correction | Выполнено |
| PRO-13 latest3 | Последняя секция main перед footer, даты1Oct/27Sep/18Sep descending; три image/time/title/body cards; winter draft скрыт, excerpt не используется | Выполнено |
| Максимум4строки | Browser article-preview line-height22.5px, max-height90px, padding-bottom0, высоты90/90/68; screenshot preview-journal.jpg не показывает пятую строку | Выполнено |
| Переход статьи | City kit card открывает #journal?slug=city-gear-guide и правильный заголовок | Выполнено |
| Legacy/публикация | Parent-check: custom newest/tie/draft/short/empty; migration сохраняет edited title/body и unpublished=false, orders/cart/wishlist; недостающие demo entries/metadata добавлены | Выполнено |

Изменённые файлы и новый suite section прочитаны. 105 предыдущих проверок сохранены,
шесть новых проверяют рендер, выборку, draft/empty и миграцию, прежние проверки не
ослаблены. `task check`: пять команд passed, **111 passed / 0 failed**; дополнительные
parent assertions и syntax assets/fixtures passed. Browser console errors пуст.
Strict OpenSpec validate passed. Whitespace gate исключает только исходный user
needed-design-changes.md; файл пользователя не редактировался.

Полный deviations.md рассмотрен: потеря h1 относится к промежуточной реализации
этой задачи (предыдущая принятая главная имела h1); восстановлена без nested controls.
Clamp/padding bleed и default underline устранены, overlay усиливает читабельность.
Коррекции подтверждены исходниками и реальным браузером. Sol владеет glossary,
OpenSpec/CNT-01/task15.1 и docs/ai; worker соблюдал согласованный scope.

Без production integrations/commit/push/deploy. Окончательные бренды, изображения
и тексты предложений ещё определяются владельцем. Это готовая итерация прототипа,
не утверждение окончательного дизайна и не production-приёмка CWV/WCAG.
