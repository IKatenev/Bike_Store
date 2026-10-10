# Отклонения — задача bike-store-prototype-checkout-fix

Рабочий корень: `C:/Workspace/01_Projects/Porfolio/Bike_Store`.
Дата: 9 октября 2026. Исполнитель: OpenCode / DeepSeek v4.1 Flash.
Журнал фиксирует дефект, тестовый пробел, доказательства, действия и разрешение.
Записи не расширяют рамки задачи; результат принимает Sol.

## D-01. Checkout не начинал оплату доставки (дефект, найден Sol при браузерной приёмке)

- **Ожидалось:** успешное оформление доставки (новой или переоформления) начинает
  оплату ровно один раз и открывает `#payment/<newid>`; заказ pending с действующим
  исходным 30-минутным резервом. Самовывоз остаётся confirmed/unpaid на `#result`.
- **Наблюдалось:** обработчик submit в `prototype/app.mjs` вызывал
  `createOrder`/`submitReorder` и сразу переходил на `#result/<id>`, не вызывая
  `beginPayment`. Резерв не создавался. `canReorder` в `domain.mjs` считал
  `!reservationActive(...)` (в том числе отсутствие резерва) признаком истечения,
  поэтому свежесозданный заказ показывался как «резерв истёк» с предложением
  оформить заново.
- **Тестовый пробел:** доменные проверки вызывали `beginPayment` вручную
  (`expiredDeliveryOrder`, «retry keeps the original deadline» и др.), поэтому
  отсутствие вызова `beginPayment` в реальном UI-пути оформления не выявлялось.
- **Доказательство:** независимая браузерная приёмка Sol — свежее переоформление
  доставки `ord-0010` без резерва отобразилось как истёкшее. В коде до правки
  `storefront.mjs result()` для доставки без `beginPayment` выводил
  «reservation has expired».
- **Действие:** в `domain.mjs` выделен узкий общий чистый `completeCheckout(seed,
  state, options)`: для доставки он вызывает `beginPayment` ровно один раз
  (идемпотентно) и возвращает `next:'payment'`, для самовывоза — `next:'result'`.
  `app.mjs` использует этот helper вместо ручной цепочки. `canReorder` ужесточён:
  требует фактически существовавший и истёкший/освобождённый резерв доставки;
  незапущенная оплата больше не считается истёкшей.
- **Разрешение:** не начатая оплата даёт `canReorder=false` и «Proceed to payment»;
  повторная подача переоформления переиспользует связанный заказ и срок без нового
  резерва/дедлайна. Покрыто новыми проверками (см. итог).

## D-02. Тексты результата заказа были неточными

- **Ожидалось:** самовывоз описывается по фактическому состоянию
  (confirmed/unpaid preparing либо ready+deadline; paid/ready — оплата записана;
  completed/collected — завершено; cancelled — корректная отмена/возврат); доставка
  dispatched/delivered не обещает будущую отправку.
- **Наблюдалось:** ветка `isCollection` шла первой и всегда писала «confirmed и
  unpaid», даже для completed/cancelled самовывоза; ветка `paymentState==='paid'`
  обещала «we will email you when it is dispatched» и для dispatched/delivered.
- **Действие:** переписан `nextStep` в `storefront.mjs result()`: cancelled первым,
  самовывоз — по фактическим состояниям, доставка paid — по `fulfilmentState`
  (awaiting dispatch / dispatched / delivered). В `order()` уведомление «Reservation
  expired» показывается только при реально истёкшем резерве, а для незапущенной
  оплаты — «payment has not started».
- **Доказательство:** 11 независимых parent-проверок (включая добавленные Sol
  «Unstarted delivery…» и «Collection result describes paid completion and
  cancellation truthfully») проходят.

## D-03. «Decline this order» — якорь без href (недоступен с клавиатуры)

- **Ожидалось:** критическое действие реализовано нативной кнопкой.
- **Наблюдалось:** в `storefront.mjs result()` действие отмены было
  `<a class="btn btn-ghost" data-action="cancel-order">` без `href`.
- **Действие:** заменено на `<button type="button">`. Смежные критичные действия
  (retry/reorder/begin-payment в result/order, отмена/возврат в staff) уже были
  `<button>` или ссылками с `href`. Широкого рефакторинга нет.

## D-04. Mobile: таблица распирала страницу (доп. коррекция; первая попытка не сработала)

- **Ожидалось:** горизонтальная прокрутка таблицы остаётся внутри `.panel`, без
  горизонтальной прокрутки страницы на 360 px.
- **Наблюдалось (DOM Sol, 360 px):** `#staff/order/ord-0006` и `ord-0008` —
  page `scrollWidth` 385 при `innerWidth` 360; `.data-table` при
  `display:block/overflow-x:auto` вычислял ширину по min-content (≈343).
- **Первая попытка (неудачная):** добавление `max-width: 100%` к mobile-правилу
  `.data-table`. Sol перепроверил на свежем CSS: tableWidth 259 / tableScroll 344 —
  таблица прокручивается сама, но `document.documentElement.scrollWidth` всё ещё
  385 > 360, и виден page-level horizontal scrollbar. Причина: `max-width` не
  ограничивает фактическую ширину table-бокса ниже min-content, поэтому сам
  `<table>` не может быть надёжным контейнером прокрутки.
- **Действие (корректное):** в `staff.mjs staffOrder()` таблица «Items» обёрнута в
  обычный блочный `<div class="table-scroll">`. В `styles.css` добавлено
  `.table-scroll { max-width:100%; min-width:0; overflow-x:auto; }` и
  `.table-scroll .data-table { display:table; width:100%; max-width:none;
  overflow:visible; }` — обёртка владеет прокруткой, таблица остаётся
  `display:table` (семантика заголовков сохранена). Аналогично обёрнута таблица
  «Items» в гостевом `storefront.mjs order()` (тот же класс дефекта, тот же файл).
  Глобального скрытия overflow и обрезки данных нет.
- **Доказательство (Node):** тесты «Items tables use a block scroll wrapper» и
  «styles.css keeps the scroll-wrapper override» в `check.mjs`.
- **Уточнение причины (Sol, повторный CUA):** обёртка подтверждена (div
  display:block clientWidth259/scroll344, таблица display:table), но page
  scrollWidth всё ещё 385 — overflow давал неразрывный токен в абзаце Email
  diagnostics. См. D-09.
- **Оставшееся:** измерение page `scrollWidth` на 360/390/768/1440 — на стороне Sol.

## D-05. S-04: метки возврата не связаны с полями (доп. коррекция)

- **Ожидалось:** видимые метки связаны с полями (wrapping либо `for`/`id`).
- **Наблюдалось:** только `#staff/returns` — в каждой карточке
  `<label>Line</label><select name="skuId">` и
  `<label>Quantity to accept</label><input name="qty">` без обёртки/`for`/`id`.
- **Действие:** в `staff.mjs staffReturns()` добавлены уникальные `id`/`for`
  `ret-line-<orderId>` и `ret-qty-<orderId>` (из `escapeHtml(order.id)`); имена
  полей и обработчики сохранены; checkbox уже был обёрнут в `label`. Широкого
  рефакторинга нет.
- **Доказательство:** новый тест check.mjs «S-04 return controls are associated
  with their visible labels».

## D-07. Корзина блокировала свежую доставку без адреса (дефект, найден Sol CUA)

- **Ожидалось:** при валидных/доступных строках корзина разрешает оформление даже
  до ввода адреса доставки; неизвестная стоимость доставки помечается
  «Calculated at checkout», а итог — «Total before delivery» / суммой товаров;
  исключённый/ненастроенный тариф проверяется по реальному адресу при оформлении.
- **Наблюдалось:** свежий сценарий `#product/gravel-01` Sand/S (склад 3) → Add to
  cart → `#cart`: «Delivery cannot be priced for this context», Delivery
  «Not configured», «Proceed to checkout» disabled. Контекст доставки не содержит
  адреса до оформления, `computeShipping` возвращал `no_address`, и корзина
  трактовала это как неразрешимую доставку, блокируя обычную покупку ещё до формы
  адреса.
- **Тестовый пробел:** Node-помощники подставляли `ADDRESS`, поэтому реальный
  UI-гейт корзины без адреса не проверялся.
- **Действие:** в `storefront.mjs cart()` различаются «ожидание адреса»
  (`shippingReason === 'no_address'`) и реальная проблема доставки
  (`excluded`/`no_tariff`/прочее). Блокировка — только для реальной проблемы и
  для недоступной строки. Метка доставки при ожидании — «Calculated at checkout»,
  итог — «Total before delivery (VAT included)» (фактически сумма товаров; нулевая
  доставка не выдаётся за настроенную). Валидация по адресу не ослаблена:
  `validateCheckout`/`computeShipping` при отправке формы работают как раньше.
  Выдуманный адрес/регион по умолчанию не подставляется.
- **Доказательство (Node):** тесты «cart render: a fresh delivery cart with an
  available item allows checkout before an address» и «cart render: a retained
  unavailable row still blocks whole-cart checkout».

## D-08. Итог первой попытки правки таблицы зафиксирован

Первая правка (только `max-width: 100%`) не устранила page overflow; см. D-04.
Замена — обёртка `.table-scroll` — задокументирована там же. Это честно
зафиксированный неудачный первый фикс и фактическое итоговое решение.

## D-09. Остаточный page overflow — неразрывный токен диагностики (уточнённая причина)

- **Ожидалось:** после обёртки таблицы page `scrollWidth` == `innerWidth` на 360.
- **Наблюдалось (Sol, повторный CUA):** обёртка корректна (div display:block
  clientWidth259/scroll344, таблица display:table), но page `scrollWidth` всё ещё
  385 на `#staff/order/ord-0006`/`ord-0008`; на скриншоте абзац Email diagnostics
  с неразрывным токеном `placeholder/deadline/extension/dispatch/delivery/refund`
  выходит за панель. Мой прежний фильтр bounding-box видел границы детей таблицы
  (уже корректно обрезаны) и пропустил текстовое переполнение вне элемента-абзаца.
- **Действие:** в `staff.mjs staffOrder()` копия переписана на обычное предложение
  «E samples created vs confirmed; code placeholder, deadline, extension, dispatch,
  delivery and refund are kept truthful.» — токен разделён пробелами, обычный
  перенос, ничего не скрывается. Обёртка таблицы сохранена.
- **Доказательство (Node):** тест «staff order diagnostics copy has no unbreakable
  separator token». Широких правок нет.
- **Оставшееся:** измерение/скриншот page width — на стороне Sol.

## D-06. Запрет браузерного инструментария (указание Sol) — harness отозван

- Изначально я поднял локальный harness (`serve.mjs` на порту 5123 и headless Chrome
  с CDP) и однократно измерил. Sol явно запретил Chrome/remote debugging/CDP/
  Playwright: браузерная проверка принадлежит родителю. Harness остановлен
  (сервер PID 12888, Chrome PID 16516 и его дочерние), временные файлы измерения
  удалены (`%TEMP%/opencode/measure.mjs` и профиль Chrome). Результаты браузера как
  доказательство не используются и не заявляются.
- Процесс PID16656 на 4173 не был запущен (порт не отвечал) и мной не трогался.

## Наблюдение (не моё изменение)

Во время работы `docs/ai/tasks/bike-store-prototype/parent-check.mjs` вырос с 9 до
11 проверок (добавлены Sol: «Unstarted delivery is distinct from an expired payment
reservation» и «Collection result describes paid completion and cancellation
truthfully»). Этот файл мной не редактировался; все 11 проходят.

## Итог

- `node prototype/check.mjs` — exit 0, 84 passed / 0 failed (было 70; добавлено 14).
- `node --check` для app/domain/storefront/staff/serve/check — exit 0.
- `git diff --check` — exit 0.
- `parent-check.mjs` — 11/11 passed (не редактировался мной).
- Блокеров нет. Изменены только файлы из разрешённой области. Результат проверяет
  Sol; задача исполнителем не принимается.
