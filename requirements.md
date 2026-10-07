# Требования: индекс

Обновлено 7 октября 2026 года по утверждённым решениям человека.
Противоречивые первоначальные формулировки заменены согласованными.
Код продукта отсутствует. Единственный нормативный набор будущего поведения —
[OpenSpec change](openspec/changes/define-bike-store-mvp/proposal.md).
Этот файл — навигация, а не независимый набор требований.

- [catalog](openspec/changes/define-bike-store-mvp/specs/catalog/spec.md)
- [inventory](openspec/changes/define-bike-store-mvp/specs/inventory/spec.md)
- [checkout](openspec/changes/define-bike-store-mvp/specs/checkout/spec.md)
- [customer-accounts](openspec/changes/define-bike-store-mvp/specs/customer-accounts/spec.md)
- [payments](openspec/changes/define-bike-store-mvp/specs/payments/spec.md)
- [fulfilment](openspec/changes/define-bike-store-mvp/specs/fulfilment/spec.md)
- [returns](openspec/changes/define-bike-store-mvp/specs/returns/spec.md)
- [administration](openspec/changes/define-bike-store-mvp/specs/administration/spec.md)
- [content-notifications](openspec/changes/define-bike-store-mvp/specs/content-notifications/spec.md)
- [storefront-quality](openspec/changes/define-bike-store-mvp/specs/storefront-quality/spec.md)

[Трассировка](docs/ai/TRACEABILITY.md) связывает исходные пункты с requirements.
[Открытые вопросы](docs/ai/OPEN-QUESTIONS.md) не заменяются предположениями.

Основные исправления: SKU вместо остатка модели; подтверждение email вместо
автоматического доступа; онлайн-резерв 30 минут; самовывоз с оплатой на месте;
внутренние тарифы вместо API перевозчика; отдельные состояния; частичные возвраты;
менеджер работает с заказами всей сети; VAT в B2C-ценах; WCAG 2.2 AA и CWV;
ценовые письма/отзывы/автоматические акции отложены.
