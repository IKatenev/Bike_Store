# Desktop submit и мобильное перекрытие

Browser проверка общей корзины: draft имени/email сохраняется после quantity change, desktop summary справа, mobile summary перед формой — хорошо. Но внутри desktop summary остаётся "Proceed to checkout" ссылка. Пользователь требует итог и кнопку оформить заказ справа; нужно заменить ссылку на submit button form=общая_форма, имя Place order. Сохранить возможность фокусировать форму, если ошибки. Все submit buttons используют тот же handler; на mobile достаточно fixed action (скрыть лишние desktop copies по breakpoint).

На 390×844 demo-badge перекрывает текст fixed Place order. При body.has-checkout-submit смести badge выше fixed footer либо сделай badge статичным. Fixed button/footer не должен закрывать важные тексты и поля; не уменьшай доступность.

Mobile header сейчас занимает около 460px (truck correction уменьшит часть). Уплотни мобильную навигацию: категории в одном прокручиваемом внутри контейнера ряду либо раскрываемом menu, компактный context отдельным рядом; Staff/Guide можно перенести в footer на mobile. Не делай горизонтальный overflow страницы. Сохрани доступ к Guide/Staff где-нибудь. Требования desktop 3-tier и подписанные icons прежние.

Также после ввода контактов updateCheckoutSummary сейчас считает тариф по пустому адресу с default England; при незаполненном адресе сохрани честный Calculated at checkout и соответствующий pending total label, затем пересчёт после реального ввода адреса/региона, без rerender при каждой букве.

Ранее коррекции email gate/focus/changed dropdown/new frame storage остаются обязательными. Parent повторит browser после результата.
