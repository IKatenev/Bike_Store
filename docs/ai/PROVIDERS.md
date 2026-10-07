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
| Postmark — рекомендован, не утверждён | API/SMTP, webhooks, отдельные transactional/broadcast streams. Basic публично от $15/месяц; бесплатные 100 писем/месяц пригодны для проверки, не магазина. Уточнить пакет/retention перед договором. |
| Resend — альтернатива | API, webhooks, удобный поток шаблонов. Free: 3000/месяц, 100/день; Pro: $20/месяц за 50000, без дневного лимита по текущему тарифу. Дневной free-limit риск для магазина. |
| Brevo — альтернатива | Transactional API/SMTP и маркетинговые инструменты. Полезен при существующем аккаунте; маркетинговая платформа для MVP не требуется. Проверять тариф/лимиты отдельно. |

Рекомендация Postmark — техническое суждение: разделение потоков и диагностика
транзакций подходят для подтверждения email и заказов.
Resend рационален при большей доле TypeScript-шаблонов/объёме, Brevo — при
существующем договоре. Реальная доставка проверяется тестовыми письмами в UK inboxes;
название сервиса не гарантирует deliverability.
Регион отправки не равен месту хранения всех данных.
Не включать open tracking без необходимости; определить retention тела писем.

Источники: [Postmark pricing](https://postmarkapp.com/pricing),
[Message Streams](https://postmarkapp.com/message-streams),
[Resend pricing](https://resend.com/pricing),
[Brevo transactional API](https://developers.brevo.com/docs/send-a-transactional-email).

## Hosting и бюджет

Предложение: managed Node/container с web+worker, managed PostgreSQL с backup,
объектное хранилище/CDN. Регион UK/EU выбирается после проверки доступности,
контрактов и стоимости, не из предположения о юридической достаточности.
Для production не рассчитывать на спящий free web/worker. Без enterprise-пакетов.
Конкретный hosting и месячный потолок — Q-06; аккаунты/платные услуги не созданы.
[ICO: договоры обработчиков](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/contracts-and-liabilities-between-controllers-and-processors-multi/),
[международные передачи](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/a-brief-guide-to-international-transfers/).
