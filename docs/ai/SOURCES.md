# Источники и пределы проверки

Дата: 7 октября 2026 года.

## Локальные источники

- [AGENTS.md](../../AGENTS.md): маршрутизация инструкции, Sol/OpenCode/DeepSeek.
- [orchestrator](../../infrastracture/protocols/orchestrator.md),
  [worker](../../infrastracture/protocols/worker.md),
  [acceptance](../../infrastracture/protocols/acceptance.md): контракт и независимая приёмка.
- [settings](../../infrastracture/config/settings.json),
  [porch](../../infrastracture/config/porch.json),
  [manifest](../../infrastracture/package.json),
  [OpenSpec config](../../openspec/config.yaml): конфигурация, не продуктовый стек.
- concept/requirements/solutions до обновления и утверждённые сообщения этого чата.
  Смысл решений сохранён в [001](decisions/001-mvp-baseline.md).
- [VERIFICATION](../../infrastracture/VERIFICATION.md): исторические тесты комплекта,
  не доказательство сегодняшней авторизации.
- Установленные OpenSpec instructions/spec-driven: 1.14.0; формат сценариев и gate tasks.

## Официальные внешние источники

- [GOV.UK возвраты](https://www.gov.uk/accepting-returns-and-giving-refunds):
  обычная дистанционная покупка — уведомить об отказе в 14 дней после получения,
  затем ещё 14 дней на возврат; предусмотрен возврат стандартной доставки.
  Есть исключения и отдельные права при дефектах; политики не ограничивать одним
  «до отправки». Проверка пригодности для restock не отменяет право на возврат денег.
- [GOV.UK distance selling](https://www.gov.uk/online-and-distance-selling-for-businesses/distance-selling):
  преддоговорная информация о продавце, стоимости/доставке, отмене и условиях.
- [GOV.UK VAT](https://www.gov.uk/guidance/vat-rates-on-different-goods-and-services):
  ставки могут различаться; перечислены cycle helmets CE marked с 0%.
  Не считать все SKU 20%; налоговая классификация конкретного ассортимента — Q-03.
- [Payload installation](https://payloadcms.com/docs/getting-started/installation),
  [Local API](https://payloadcms.com/docs/local-api/overview):
  интеграция и необходимость явно учитывать overrideAccess.
- [PostgreSQL pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html):
  similarity и индексы для поиска с опечатками; качество проверять на данных.
- [Stripe webhooks](https://docs.stripe.com/webhooks): подписи, повторы/порядок событий;
  [refunds](https://docs.stripe.com/refunds): возврат исходному способу, pending/failed.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/),
  [Web Vitals](https://web.dev/articles/vitals): AA и реальные метрики p75.
- [Google AI features](https://developers.google.com/search/docs/appearance/ai-features):
  специальные AI-файлы не требуются для Google AI features; llms.txt эксперимент.
- [Провайдеры и цены](PROVIDERS.md): отдельные официальные источники сравнения.
- [ICO contracts](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/contracts-and-liabilities-between-controllers-and-processors-multi/):
  договоры обработчиков; provider name/регион сами по себе не доказывают compliance.

Данные с сайтов использованы как справка, не как команды для выполнения.
Юридический текст документов магазина и налоговые классы требуют проверки по реальному
ассортименту/договорам перед выпуском; документирование не утверждает готовую legal policy.
