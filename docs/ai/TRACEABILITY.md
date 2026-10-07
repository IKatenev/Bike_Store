# Прослеживаемость

7 октября 2026 года. Первоначальные документы прочитаны до их согласования;
таблица сохраняет происхождение разделов. Последние сообщения человека имеют приоритет.
Идентификаторы используются в проверках и контрактах; сценарии — в соответствующей spec.

| Источник и уточнение | Нормативный артефакт | Требования |
|---|---|---|
| requirements: «Каталог и поиск», «Подбор велосипеда», «Карточка товара»; решения пользователя: SKU, ростовка, опечатки, VAT, история. | [catalog](../../openspec/changes/define-bike-store-mvp/specs/catalog/spec.md) | CAT-01, CAT-02, CAT-03, CAT-04, CAT-05, CAT-06 |
| concept: сеть/склад/самовывоз; solutions: отдельные остатки; последнее сообщение: основной backend, админ-продажи, 30 минут, 3 дня. | [inventory](../../openspec/changes/define-bike-store-mvp/specs/inventory/spec.md) | INV-01, INV-02, INV-03, INV-04, INV-05 |
| requirements: «Корзина», «Checkout и заказы»; solutions: локальная корзина; уточнения: вся корзина одной точки. | [checkout](../../openspec/changes/define-bike-store-mvp/specs/checkout/spec.md) | CHK-01, CHK-02, CHK-03 |
| concept и requirements: аккаунт/история; уточнения: создание при оформлении, подтверждение email, существующий аккаунт. | [customer-accounts](../../openspec/changes/define-bike-store-mvp/specs/customer-accounts/spec.md) | ACC-01, ACC-02, ACC-03 |
| requirements: «Оплата и доставка»; уточнения: сохранение после неудачи, оплата на месте; последнее сообщение: late payment. | [payments](../../openspec/changes/define-bike-store-mvp/specs/payments/spec.md) | PAY-01, PAY-02, PAY-03, PAY-04 |
| concept: склад/страна; уточнения: внутренний тариф, раздельные статусы; последнее сообщение: UK-территории. | [fulfilment](../../openspec/changes/define-bike-store-mvp/specs/fulfilment/spec.md) | FUL-01, FUL-02, FUL-03 |
| requirements: отказ до оплаты/запрос после; уточнения: возвраты/проверка; последнее сообщение: частичный возврат и способы. | [returns](../../openspec/changes/define-bike-store-mvp/specs/returns/spec.md) | RET-01, RET-02, RET-03, RET-04, RET-05 |
| requirements: «Административная панель»; уточнения: все заказы сети; последнее сообщение: остатки через операции. | [administration](../../openspec/changes/define-bike-store-mvp/specs/administration/spec.md) | ADM-01, ADM-02, ADM-03 |
| requirements: «Уведомления», «Контент»; solutions: CMS; уточнения: MVP vs later. | [content-notifications](../../openspec/changes/define-bike-store-mvp/specs/content-notifications/spec.md) | CNT-01, CNT-02, CNT-03 |
| requirements: «Адаптивность»; уточнения: SEO/GEO; последнее сообщение: en-GB, браузеры, WCAG, CWV. | [storefront-quality](../../openspec/changes/define-bike-store-mvp/specs/storefront-quality/spec.md) | QUA-01, QUA-02, QUA-03, QUA-04 |

Всего 39 requirements и 87 scenarios в 10 capabilities.
Это полнота сформулированных правил, не гарантия готовности дизайна.

Границы бизнеса (B2C, исключённые функции) — [proposal](../../openspec/changes/define-bike-store-mvp/proposal.md).
Основная технология и масштаб — [design](../../openspec/changes/define-bike-store-mvp/design.md).
Следующие релизы перечислены в CNT-03 и proposal; их задачи MVP не создаются.
Оставшиеся параметры — [Q-01–Q-10](OPEN-QUESTIONS.md).
Без tasks.md соответствие requirement → исполнимая задача ещё не завершено.
