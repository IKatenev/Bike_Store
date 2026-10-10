# Журнал отклонений — задача bike-store-checkout-context

Рабочий корень: `C:/Workspace/01_Projects/Porfolio/Bike_Store`.
Дата: 10 октября 2026. Исполнитель: OpenCode / DeepSeek v4.1 Flash.
Статус: исправление в границах контракта выполнено; результат НЕ принят (приёмка — за Sol).
Ниже — наблюдения, действия, отклонения и открытые вопросы.

## Что сделано

1. Проверка контекста в корзине. Смена fulfilment-радио или магазина в форме
   теперь немедленно переупаковывает `state.cart.context` (capture draft → save →
   render), поэтому строки доступности, предупреждения и кнопки пересчитываются
   сразу, а черновик контактов/адреса сохраняется.
2. Смена контекста в шапке (`set-context`) сначала сохраняет черновик формы, затем
   меняет контекст и рендерит — черновик и фокус больше не теряются.
3. Восстановление из невалидного региона/адреса. Refresh сводки при вводе теперь
   пересчитывает не только суммы, но и shipping-гейт: предупреждение и все
   submit-кнопки переключаются на месте, без повторного рендера (набор продолжает
   жить во время печати).
4. Общий гейт. В `domain.mjs` добавлены `resolveCartContext` (единый переход
   delivery/collection+store) и `checkoutGate` (единый расчёт pending/blocked/
   recovered), используемые и рендером `storefront.cart`, и клиентским refresh.
   Это исключает расхождение логики. Заблокированная корзина не разблокируется
   подменой — кнопки только отражают реальный гейт.
5. Кнопки submit. Фиксированная мобильная кнопка рендерится всегда (disabled при
   блокировке) и обновляется на месте вместе с desktop-итогом и скрытым fallback.
   Единый селектор `[data-checkout-submit]`.
6. Mega-меню (доп. корректировка). Один тап открывает подкатегории, второй —
   закрывает; desktop hover/focus сохранены. Первый pointerdown помечает
   взаимодействие, mouseenter/focus открывают «неявно», а click не закрывает
   то, что открыл этот же тап. Клавиатурный Enter по-прежнему переключает.

Добавленные поведенческие проверки (не строковые заглушки):
`resolveCartContext packs delivery/collection transitions consistently`,
`checkoutGate distinguishes pending, blocked and recovered delivery addresses`,
`collection store transition recovers availability and stays confirmed/unpaid`,
`cart render: an unsupported delivery region blocks, a supported one recovers the gate`.

## D-01. Целевой дефект — контекст корзины не обновлялся при смене магазина

- **Ожидалось:** смена fulfilment/магазина меняет контекст корзины, доступность и
  гейт кнопок немедленно; черновик контактов/адреса сохраняется.
- **Наблюдается (до правки):** обработчик радио в `afterCheckout` только скрывал
  поля и обновлял суммы; `state.cart.context` не менялся. Смена `co-store` не
  трогала контекст вовсе. Отправка без магазина писала `{collection, storeId:null}`
  → нулевая доступность, disabled submit; выбор York уже не помогал.
- **Доказательство (до правки):** `prototype/app.mjs` change-listener не содержал
  case для `checkout-fulfilment`/`storeId`; `updateCheckoutSummary` пересчитывал
  только суммы.
- **Действие:** `syncCheckoutContext` + `resolveCartContext`; `checkoutGate`
  используется и в рендере, и в in-place refresh. Проверки
  `collection store transition recovers availability and stays confirmed/unpaid`
  фиксируют сценарий no-store → York (Sand/S и terracotta: warehouse 0, York 1).
- **Остаётся:** финальная browser-проверка Sol (см. ниже).

## D-02. Mega-меню: первый тап открывал и тут же закрывал

- **Ожидалось:** один тап открывает подкатегории, второй закрывает; на desktop
  hover/focus работают; pointer-focus не отменяет click.
- **Наблюдается:** `attachMega` безусловно открывал панель на `focus`/`mouseenter`,
  затем click видел `wasOpen` и закрывал; со второго тапа открывалось снова.
- **Доказательство:** `prototype/app.mjs` (attachMega + case `toggle-mega`).
- **Действие:** флаг `megaOpenedByImplicit` + `megaPointerActive` (сброс на
  `pointerup`): click сохраняет панель, если её открыл тот же pointer-тап, иначе
  переключает. Desktop hover/focus не изменены. Панели по-прежнему вне
  прокручиваемого ряда; переполнение на 375≤390 не измерено (- исключение снято
  parent до этой правки).
- **Остаётся:** подтверждение одним/двумя тапами и desktop hover — за browser-проверкой Sol.

## D-03. Пре-существующие trailing EOF newlines в parent-документах

- **Ожидалось:** `git diff --check -- . :(exclude)needed-design-changes.md` — exit 0.
- **Наблюдается (до примечания parent):** exit 2, «new blank line at EOF» в
  `docs/ai/PROGRESS.md:370` и `docs/prototype.md:248`. Файлы принадлежат parent
  (design.md п.19: worker правит только `prototype/**` и свой журнал), не тронуты.
- **Доказательство:** `git diff --check` exit 2; `git diff --check -- prototype/...`
  exit 0 (мои изменения чисты).
- **Действие:** parent во время выполнения убрал лишние EOF-переводы (сообщение в
  задаче). Повторный прогон — exit 0, только CRLF-предупреждения. Файлы я не менял.
- **Остаётся:** нет.

## Проверки (фактические результаты)

- `node prototype/check.mjs` — **105 passed, 0 failed** (101 прежних сохранены,
  +4 новых поведенческих; exit 0).
- `node --check prototype/app.mjs` — exit 0.
- `node --check prototype/domain.mjs` — exit 0.
- `node --check prototype/storefront.mjs` — exit 0.
- `git diff --check -- . :(exclude)needed-design-changes.md` — exit 0
  (только CRLF-предупреждения по parent-файлам, не ошибки).

## Что осталось непроверенным

- Реальная браузерная проверка интерактивности (один/два тапа, desktop hover,
  сохранение фокуса при печати) инструментально здесь недоступна — за Sol.
- Наблюдение вне границ: перелёт hover между соседними категориями на desktop
  (mouseleave одной панели через таймаут может закрыть другую) — пре-существующее
  поведение, не изменялось, в контракт не входит.
