## Context
Автономный HTML/CSS/ES modules прототип с localStorage, model/SKU и demo auth. Сохраняем единый SKU invariant и существующие cart/order/auth paths.

## Goals / Non-Goals
Goals: все правки владельца desktop с адаптацией 360/390px. Non-goals: production backend, реальные отзывы/фото/OAuth, изменение внешних настроек, commit/push/deploy.

## Decisions
Gallery хранит несколько локальных демонстрационных видов модели; цвет следует выбранному SKU. Dialog доступен по клавиатуре, Escape/close и возврат focus.
Reviews относятся к modelId; auth проверяется в domain submission, покупки не проверяются. Seed минимум6 отзывов на одной модели для pagination; миграция дополняет missing field без сброса сохранённого состояния. Все строки экранируются. Rating агрегируется по всем отзывам, не текущей странице и не SKU. Пустой список: 0 Ratings без выдуманной оценки.
Checkbox значения объединяются OR внутри группы и AND между группами на одном matching SKU; hash хранит повторные значения с совместимостью одиночных старых ссылок. Show more показывает первые4 и разворачивает остальные; выбранные hidden значения видимы после back/reload. Price/height остаются numeric controls; sort dropdown.
Wishlist подтверждение показывается только после успешного добавления, включая завершение guest auth. Повторный клик сохранённого сердечка удаляет по существующему toggle; confirmation удаления не маскирует добавление.
UI en-GB остаётся; требуемые русские тексты wishlist dialog используем дословно.
Описание synthetic моделей расширяется оригинальными demo features; пример KTM служит структурным образцом, не выдаётся за характеристики другого велосипеда.
Catalog сохраняет grid3 desktop, home получает отдельную grid4. Manufacturer содержит сведения существующего demo бренда без ложных внешних утверждений.

## Risks / Trade-offs
Persistence migration, nested interactive links, потеря multi-values FormData, auth intent, modal keyboard focus, gallery one-image case, mobile horizontal overflow — обязательные проверки.

## Migration Plan
Обратимые изменения локальных модулей; сохранить namespace localStorage и существующее состояние. Sol принимает independently checks+browser before archive.
