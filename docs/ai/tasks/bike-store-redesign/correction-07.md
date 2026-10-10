# Устранить дублирование общего auth UI

Browser после исправления gate: email dialog request/confirm и focus close работают, wishlist persistence/remove тоже. Но #sign-in одновременно рендерит authFields в main и закрытый authDialog, поэтому document [id] даёт duplicate auth-email, textbox получает двойную label "Email address Email address".

Далее на #sign-in нажатие Google или переключение режима выставляет ui.authDialogOpen=true, что открывает ещё и dialog поверх того же содержимого страницы. Browser видит две кнопки Confirm demo Google sign-in и повторные IDs. Это неправильная композиция одного окна/одного набора полей.

Рендери auth dialog только когда он реально нужен/открыт; не вставляй его закрытую форму во все страницы. Обработчики auth-back/auth-mode/auth-provider должны сохранять текущую поверхность: если action на #sign-in main, обновляется страница без открытия dialog; если action внутри dialog, обновляется dialog. Инициатор/возврат focus остаются. Добавь aria-hidden=true decorative G/A, чтобы accessible name был Continue with Google/Apple, без лишней буквы.

Проверь #sign-in login/create/email request/provider и dialog отдельно: все IDs уникальны и одновременно один видимый набор auth полей/кнопок. Parent повторит эту browser проверку перед приёмкой.
