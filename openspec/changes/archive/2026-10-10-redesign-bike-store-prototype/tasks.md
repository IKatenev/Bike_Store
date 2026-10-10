# Tasks

## 1. Общая композиция

- [x] 1.1 Обновить типографику/палитру, header/search/mega menu/context/footer и остальные экраны (PRO-07); проверить desktop/mobile и мышь/клавиатуру/click, документировать композицию в docs/prototype.md. Зависимостей нет.
- [x] 1.2 Сделать ручной hero-слайдер (PRO-08); проверить переключение трёх сцен/ссылок и описать управление. Зависит от 1.1.

## 2. Каталог и товар

- [x] 2.1 Перенести фильтры в единственный sidebar/drawer и сетку 3/2 (PRO-09); сохранить фильтры/back-forward, проверить первый ряд 1440×900 и drawer/overflow 360/390; обновить руководство. Зависит от 1.1.
- [x] 2.2 Выпадающие варианты, переход в корзину и name recommendations (PRO-10); meaningful assertions ranking/current/unpublished/fallback/SKU selection плюс browser dropdown, добавить синтетическую раму и описание ограничения. Зависит от 2.1.

## 3. Wishlist и аккаунт

- [x] 3.1 Общая email login/register модалка и mock Google/Apple, отдельный wishlist, pending intent и storage migration (PRO-11); meaningful assertions guest gate/unique/remove/migration и browser confirm/cancel/focus, руководство и словарь. Зависит от 2.2.

## 4. Корзина и оформление

- [x] 4.1 Единая cart/checkout форма, крупные строки, итог и fixed submit (PRO-12); сохранить delivery/collection/validation/reorder и draft, meaningful checks, руководство. Зависит от 1.1 и 3.1.

## 5. Независимая интеграционная приёмка

- [x] 5.1 Sol проверяет реальный diff/журнал, отдельно task check, browser 1440/1024/768/390/360, прежние основные сценарии и все новые; фиксирует acceptance, обновляет docs/ai и плановые MVP requirements/tasks, strict OpenSpec validate. Зависит от 1.1–4.1; worker не принимает себя.
