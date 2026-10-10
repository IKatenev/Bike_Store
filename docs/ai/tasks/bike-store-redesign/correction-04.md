# Наблюдения первой desktop browser проверки и dropdown

В браузере 1440×900 screenshot главной показывает oversized truck в верхней полосе (около 70px) и пустую search button. Общего правила .icon нет, размеры заданны только .btn/.header-icon. Добавь базовый .icon width/height около 20px; flex-shrink:0, display:inline-block; utility truck 16px. Верхняя полоса должна быть тонкой (сейчас ~100px из-за intrinsic SVG), значок Search должен быть виден. Проверь все icon contexts/chevrons.

В app select-colour/select-size оба передают одинаковый colour/size в chooseSku. Если выбран новый размер с несовместимым прежним цветом (например frame-01 54 Ink → выбрать 56), chooseSku сначала оставляет старый цвет и отменяет именно введённый размер. Приоритет у изменённого пользователем dropdown: сохранить второй параметр если есть exact SKU, иначе выбрать существующий SKU с новым размером/цветом и явно пояснить изменение другого параметра. Дай chooseSku сведения о changed dimension и behavioural тест именно size-first/colour-first missing combination.

Дополнительно legacy balances не содержат новых frame SKU, и merged state перезаписывает base balances старым массивом. При миграции добавь только новые frame-01 SKU fixture balances, если SKU полностью отсутствует в старом состоянии, не сбрасывая существующие остатки/заказы/резервы. Иначе старая сохранённая сессия не может купить добавленный демонстрационный товар. Зафиксируй конкретный пример в проверках/журнале.

Границы/прочие проверки прежние. Parent продолжает browser review, не принимает до corrections.
