# Независимая приёмка Sol — переработка прототипа

Дата: 10 октября 2026. Исходный run: `run_deepseek-flash-bike-store-redesign`.
Статус: **принято Sol** после независимой проверки и корректирующей задачи
`bike-store-checkout-context`; завершение процесса само по себе не является приёмкой.

## Критерии и доказательства

| Критерий | Реализация / независимая проверка | Результат |
|---|---|---|
| PRO-07, общая композиция | app/styles/assets; browser 1440×900: тонкая utility полоса, поиск, подписи SVG, категории и компактная локация; screenshot preview-desktop.jpg; sidebar/menu/search проверены | Выполнено; one-tap и клавиатура повторно проверены |
| PRO-08, hero | storefront/app, Next меняет сцену, текст и ссылку; три индикатора, без таймера | Выполнено |
| PRO-09, каталог | Browser 1440: три колонки, первый ряд в viewport; 1024: три; 768: sidebar+две; 390/360: две, drawer Filter/apply/back; document.scrollWidth не превышает viewport | Выполнено |
| PRO-10, товар | Реальные dropdown SKU, изменение размера рамы 54→56 сохраняет размер и меняет цвет с пояснением; Add to cart/Go to cart; поиск Fieldnote и Parts→frames; независимые parent-check.mjs ranking/current/unpublished/fallback assertions | Выполнено |
| PRO-11, wishlist/auth | Guest modal→request email (без доступа)→explicit confirm→сохранение→reload→remove; отмена/возврат фокуса; inline #sign-in не дублирует IDs; Google/Apple explicit demo confirm; logout снимает обе формы доступа; parent-check legacy/malformed/unique | Выполнено |
| PRO-12, корзина | Draft сохраняется при quantity change; desktop rows/main слева, итог справа; mobile rows→summary→fields, fixed submit; доставка: ввод адреса→£19.95→создание заказа→демо отказ платежа сохраняет pending/failed/unfulfilled и срок retry | Выполнено; collection/region recovery повторно проверены |

## Журнал и границы

Весь deviations.md исходного исполнителя прочитан. D-01: исходные пробелы
пользовательского needed-design-changes.md сохранены, только этот файл исключён из
whitespace gate. D-02: совместимый #checkout alias и вторичная ссылка оставлены;
основная desktop кнопка отправляет общую форму. D-03–12: изменения исходников
сопоставлены с реальным browser review, исправления account gate, вариантов SKU,
миграции, композиции и переполнения проверены независимо.

Исходные 84 проверки сохранены по назначению; новые assertions рассмотрены, parent
дополнительно проверил ранжирование и старый storage. Ограничения OAuth/email/payments
демонстрационные, соответствуют scope; production задачи остаются открытыми.

Единственный исходный пользовательский diff — needed-design-changes.md; он не
редактировался. Документы/словарь/OpenSpec вне worker scope изменены оркестратором
для согласования требований и прослеживаемости. Коммиты/внешняя публикация отсутствуют.

Дополнительный browser дефект collection context/disabled submit и one-tap меню
исправлен ограниченной корректирующей задачей. Её acceptance.md подтверждает
самовывоз confirmed/unpaid, stock gate, сохранение draft, invalid→valid region и меню.
Таким образом все строки таблицы выше выполнены; первоначальные pending пометки
сохранены как описание причины коррекции, а не текущий статус.

Финальные независимые `task check` обеих задач: все пять команд каждой прошли,
**105 passed, 0 failed**, исходные 84 сохранены. Parent-check.mjs тоже прошёл;
syntax assets/fixtures/server passed; strict OpenSpec validate passed. Browser
console error log пуст. Итерация технически принята, визуальные уточнения владельца
могут оформляться следующей итерацией без отката завершённого этапа.
