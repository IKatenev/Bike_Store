# Провайдеры для UK

Проверено по официальным источникам 7 октября 2026 года.
Тарифы — текущие ориентиры, не фиксированная смета и не разрешение покупки.
Все варианты требуют проверки условий аккаунта, DPA, регионов/подрядчиков,
данных и окончательной цены. Валюта тарифов email — USD; не выдавать её за GBP.

## Оплата

| Вариант | Возможности и выбор |
|---|---|
| Stripe Checkout — согласован | Hosted checkout, карточная оплата, API частичных возвратов, webhooks. На публичном UK Standard: 1.5% + 20p для standard UK cards; другие карты/услуги могут стоить иначе. |
| Worldpay Hosted Payment Pages — альтернатива | Hosted-форма. Имеет смысл при существующем договоре магазина; условия и стоимость требуют отдельного предложения. Не добавлять второй gateway в MVP. |

Stripe выбран потому, что согласован человеком и покрывает требования без собственной
карточной формы. Checkout резерв 30 минут согласован.
Не включать рассрочку/BNPL и дополнительные способы автоматически при настройке аккаунта.
Магазин не хранит PAN/CVC; hosting формы не означает отсутствие всех обязанностей магазина.
Сумма/GBP/заказ проверяются сервером. Refund request, pending и success различаются.
Денежный возврат на месте регистрируется сотрудником; Terminal/POS-интеграция не нужна.

Источники: [Stripe UK pricing](https://stripe.com/gb/pricing),
[Checkout](https://stripe.com/gb/payments/checkout),
[сроки](https://docs.stripe.com/payments/checkout/managing-limited-inventory.md?payment-ui=stripe-hosted),
[refunds](https://docs.stripe.com/refunds),
[Worldpay HPP](https://docs.worldpay.com/access/products/hosted-payment-pages).

## Транзакционные email

| Вариант | Оценка для этого MVP |
|---|---|
| Postmark — оставлен по указанию человека | API/SMTP, webhooks, transactional streams. Basic публично от $15/месяц; default хранения тела/activity 45 дней. Free 100 писем/месяц только для проверки. Пакет/договор не подключены. |
| Resend — альтернатива | API, webhooks, удобный поток шаблонов. Free: 3000/месяц, 100/день; Pro: $20/месяц за 50000, без дневного лимита по текущему тарифу. Дневной free-limit риск для магазина. |
| Brevo — альтернатива | Transactional API/SMTP и маркетинговые инструменты. Полезен при существующем аккаунте; маркетинговая платформа для MVP не требуется. Проверять тариф/лимиты отдельно. |

Postmark сохранён по указанию человека; разделение потоков и диагностика
транзакций подходят для подтверждения email и заказов.
Resend рационален при большей доле TypeScript-шаблонов/объёме, Brevo — при
существующем договоре. Реальная доставка проверяется тестовыми письмами в UK inboxes;
название сервиса не гарантирует deliverability.
Регион отправки не равен месту хранения всех данных.
Open/click tracking выключить. Принимать default 45 дней как DD-05, не обещать
бесплатное произвольное сокращение retention: custom retention зависит от add-on/плана.
Postmark хранит данные в US: London-хостинг сайта не превращает email в UK-only.
Проверить DPA и применимое UK основание transfers, минимизировать содержание писем.

Источники: [Postmark pricing](https://postmarkapp.com/pricing),
[Message Streams](https://postmarkapp.com/message-streams),
[Postmark GDPR FAQ](https://postmarkapp.com/support/article/1218-gdpr-faq),
[Resend pricing](https://resend.com/pricing),
[Brevo transactional API](https://developers.brevo.com/docs/send-a-transactional-email).

## Hosting и бюджет

**Ограничение человека:** £75–150/месяц для MVP без платёжных комиссий, регистрации
домена и пиков. Надёжные managed-услуги предпочтительны; превышение требует отдельного
обоснования реальной нагрузки/надёжности. Domain TBD не препятствует проектированию,
но нужен до production email/HTTPS. Покупка/подключение не разрешены этим документом.

**Design decision DD-04:** DigitalOcean App Platform web+worker и PostgreSQL Standard,
предпочтительно London, объектное хранилище Spaces/CDN. Минимальная смета:

| Компонент | Размер/условие | Публичный ориентир USD/месяц |
|---|---|---|
| App Platform web | 2 GiB, один контейнер | $25 |
| App Platform worker | 1 GiB, масштабируемый план | $12 |
| Managed PostgreSQL Standard | 2 GiB, один узел | около $30, финальную конфигурацию проверить в калькуляторе |
| Spaces/CDN | base subscription, в пределах включённого объёма | $5 |
| Postmark | Basic, пакет по реальному объёму | от $15 |
| База суммы | До налогов/FX, staging, off-provider archive и мониторинга | около $87 |

Для бюджета резервировать £90–125/месяц, включая небольшой staging, независимые
backup/финансовый архив и мониторинг; это собственная консервативная плановая оценка,
а не текущая конвертация $87 в GBP. Перед покупкой пересчитать реальный GBP-счёт,
налоги, usage, объём email/медиа, staging и срок восстановления. Порог alerts £120/£140,
расходы > £150 отдельно обосновать; alerts сами по себе не останавливают billing.
Нет автоматического разрешения на enterprise/дополнительный standby/второй web.

Для независимых копий — небольшой AWS S3 bucket London в отдельном аккаунте:
шифрование, versioning, lifecycle и ограниченные права; финансовые архивы защищать
Object Lock на нужный законный срок, без бессрочного удержания профилей/полной БД.
Dump хранится 30 дней; минимальные финансовые документы — по DD-05. Расходы requests,
storage и retrieval учитывать в резерве, не обещать бесплатный архив.

PostgreSQL single-node — осознанный минимальный вариант восстановления, не HA.
RPO ≤ 5 min опирается на managed WAL/PITR, RTO ≤ 4h — на измеренное восстановление
со сверкой магазина. Ежедневный dump не доказывает эти цели. Уничтожение кластера
уничтожает его provider backups, поэтому внешняя копия нужна. RPO при полной потере
provider/account ограничен свежестью независимой копии: это отдельный остаточный
риск DD-04, который нельзя скрыть обещанием общего RPO 5 min. Перед запуском проверить
scope recovery, свежесть PITR, поддержку восстановления, квоту нового кластера и drill.

Базовый регион web/worker/БД — London при доступности выбранных планов. Для Spaces
выбрать ближайший EU если London недоступен; финансовый архив S3 — London. Регион
ресурса не доказывает, что логи/support/subprocessors остаются там же. Проверить
контракты/международные передачи отдельно, как и US-обработку Postmark.

**Совместимость:** поддержка Node/container и длительного worker подходит модульному
монолиту, Standard поддерживает pg_trgm. Список расширений и выбранный major проверяются
до provisioning. Не выбирать Advanced Edition автоматически: расширения там имеют
другой порядок подключения. Документация DigitalOcean предупреждает об ограничениях
новых Standard cluster/standby с 15 октября 2026 для новых аккаунтов и 30 ноября для
всех; поэтому дешёвый HA за $60 не является устойчивой гарантией будущего апгрейда.

**Альтернативы:** Render Frankfurt упрощает единый managed web/worker/БД, но его PITR
не позволяет восстановление последних 10 минут, что не подтверждает RPO ≤ 5 min;
без дополнительного решения он не основной выбор. Собственный VPS дешевле по счёту,
но добавляет обслуживание БД/backup/OS, поэтому не соответствует предпочтению managed.
DigitalOcean Advanced/HA или иной managed deployment рассматривать по результатам
drill/роста с новой сметой, не оплачивать без необходимости.

Официальные источники проверены 7 октября 2026:
[App Platform pricing](https://docs.digitalocean.com/products/app-platform/details/pricing/),
[App regions](https://docs.digitalocean.com/products/app-platform/details/availability/),
[PostgreSQL pricing/plan changes](https://docs.digitalocean.com/products/databases/postgresql/details/pricing/),
[WAL/recovery](https://docs.digitalocean.com/products/databases/),
[restore/retention](https://docs.digitalocean.com/products/databases/postgresql/how-to/restore-from-backups/),
[extensions](https://docs.digitalocean.com/products/databases/postgresql/details/supported-extensions/),
[Spaces pricing](https://docs.digitalocean.com/products/spaces/details/pricing/),
[Spaces regions](https://docs.digitalocean.com/products/spaces/details/availability/),
[S3 pricing](https://aws.amazon.com/s3/pricing/),
[S3 Object Lock](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html),
[Render recovery](https://render.com/docs/postgresql-backups).

Retention подробно — [design DD-05](../../openspec/changes/define-bike-store-mvp/design.md).
Реальные аккаунты/договоры/доставка email/restore не проверены, ресурсы не созданы.
[ICO: договоры обработчиков](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/contracts-and-liabilities-between-controllers-and-processors-multi/),
[международные передачи](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/a-brief-guide-to-international-transfers/).
