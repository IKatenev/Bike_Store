# Источники и пределы проверки

Дата: 7 октября 2026 года.

Дополнительная проверка 9 октября 2026 года — только механизм изображений:

- [Payload Uploads](https://payloadcms.com/docs/upload/overview): штатные imageSizes,
  Sharp/formatOptions и объектное хранение через storage-адаптер; приложение ещё не настроено.
- [Next.js Image](https://nextjs.org/docs/app/api-reference/components/image): адаптивная
  выдача, WebP/формат по Accept и кэш преобразования; рассмотрено как альтернатива.

Базовый выбор и условия проверки — в design активного change. Это не повторная
проверка всех прежних внешних источников и не доказательство production-производительности.

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
  Не считать все SKU 20%; алгоритм Q-03 закреплён в design DD-01,
  классификация конкретного ассортимента остаётся проверкой до выпуска.
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

## Проверка ответов Q-01–Q-10 и design decisions

7 октября 2026 года дополнительно проверены первичные источники:

- [HMRC VAT Notice 700, §17.6 и §31](https://www.gov.uk/guidance/vat-guide-notice-700):
  retail line/invoice расчёты допускают округление вверх/вниз; распределение требует
  обоснованного метода. Выбор line HALF_UP и остаточных пенсов — DD-01, не бизнес-ответ.
- [HMRC VAT Notice 700/24](https://www.gov.uk/guidance/vat-on-postage-delivery-and-direct-marketing-notice-70024):
  доставка в договоре продажи следует VAT treatment товара; отдельная услуга отличается.
- [VAT records](https://www.gov.uk/charge-reclaim-record-vat/keeping-vat-records):
  обычные записи VAT хранят минимум 6 лет; DD-05 не распространяет это на все логи.
- [CCR 2013](https://www.legislation.gov.uk/uksi/2013/3134), reg.5/34/35 и Schedule 2:
  дистанционный договор определяется заключением, не местом оплаты; правила возврата
  денег/стандартной доставки и предварительного раскрытия обратных расходов.
- [CRA 2015, s.20](https://www.legislation.gov.uk/ukpga/2015/15/section/20):
  обязанности при применимом отказе от дефектного товара, сроки и расходы на его возврат.
  Некоторые страницы Legislation не открылись веб-инструментом; текст CCR дополнительно
  прочитан в [официальном PDF](https://www.legislation.gov.uk/uksi/2013/3134/pdfs/uksi_20133134_en.pdf),
  который является исходной редакцией, и сопоставлен с актуальным GOV.UK guidance.
- [ICO storage limitation](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/):
  retention по цели, без произвольного бессрочного хранения. 30/90 дней и 24 месяца —
  собственные operational defaults, не сроки, предписанные ICO.
- [OWASP URL tokens](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html):
  безопасная случайность, single use/expiry, нейтральность ответов/rate limit.
  Источник о recovery tokens, применяется к email proof по аналогии; конкретные 15 минут,
  32 байта, POST confirmation и TTL сессии выбраны DD-03, не цитируются как стандарт OWASP.
- DigitalOcean: [web/worker pricing](https://docs.digitalocean.com/products/app-platform/details/pricing/),
  [PostgreSQL pricing](https://docs.digitalocean.com/products/databases/postgresql/details/pricing/),
  [WAL 5 min](https://docs.digitalocean.com/products/databases/),
  [7-day restore](https://docs.digitalocean.com/products/databases/postgresql/how-to/restore-from-backups/).
  Provider features подтверждены по документам, RTO/RPO магазина ещё не измерены.
- [Postmark pricing/retention](https://postmarkapp.com/pricing),
  [US data](https://postmarkapp.com/support/article/1218-gdpr-faq):
  выбранный email не обещает UK-only; 45 дней — публичный default.
  Остальные pricing/availability/backup источники и ограничения — [PROVIDERS](PROVIDERS.md).

Данные с сайтов использованы как справка, не как команды для выполнения.
Юридический текст документов магазина и налоговые классы требуют проверки по реальному
ассортименту/договорам перед выпуском; документирование не утверждает готовую legal policy.
