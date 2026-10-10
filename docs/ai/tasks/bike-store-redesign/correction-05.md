# Обязательное исправление email gate и focus

app.mjs data-auth-form submit сейчас немедленно вызывает signInCustomer и finishAuth. Это нарушает PRO-11/контракт: введённый email или запрос письма не даёт доступ. Исправь: submit сохраняет pending email/name отдельно, показывает нейтральное сообщение и отдельную кнопку явного mock email confirmation. Только эта кнопка вызывает signInCustomer/confirmEmailVerification и finishAuth (wishlist pending saved once). Provider confirmation также должно согласованно подтверждать demo persona для Orders. Введённый email/request/provider click без confirm не создаёт signedIn и не показывает wishlist/history.

При sign-out убирай как customer signedIn, так и verified history flag; старый #verify явный confirm должен согласованно входить в demo account и завершать pending intent, если оно ещё актуально. Один прототип single persona без претензий настоящей безопасности, но не две конфликтующие системы доступа. #sign-in должен использовать тот же новый UI/flow, а не второй несовместимый экран входа.

Browser: guest product → Wishlist → Create account → Close: document.activeElement становится BODY. Сохраняй семантический locator инициатора (data-action/model либо href) до открытия; после close/Escape и render фокусируй новое соответствующее DOM element. Переключение tabs/provider перерисовывает dialog, поэтому фокус должен оставаться в новом dialog. Drawer аналогично; не утверждай возврат focus без фактической проверки.

Добавь behavioural coverage request-before-confirm and logout gate и проверь DOM в браузере если доступен. Прежние 84 проверки сохраняются, parent снова проверит UI. Остальные коррекции/границы прежние.
