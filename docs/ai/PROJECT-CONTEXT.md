# Контекст целевого проекта

Обновлено 8 октября 2026 года. Статус: требования, дизайн и tasks подготовлены до реализации.
Факты о репозитории и утверждённый продукт различаются.

## Наблюдаемое состояние

В корне [AGENTS.md](../../AGENTS.md), concept/requirements/solutions, docs, openspec,
.agents/.opencode и переносимый infrastracture. Продуктового исходного кода,
manifest приложения, тестов и CI нет. Сейчас Git имеет baseline 0be0fe7
(Documentary init); прежняя документация tracked, новый tasks.md пока untracked.
Этот commit существовал до текущей проверки; новых commit не выполнялось.
[PROJECT-CONTEXT](PROJECT-CONTEXT.md) и [PROGRESS](PROGRESS.md) ранее были шаблонами.

Новых разработчиков/воркеров не запускали. Основные openspec/specs пока пусты:
желаемое поведение в [change](../../openspec/changes/define-bike-store-mvp/proposal.md).
Изменение не архивировано. [Tasks](../../openspec/changes/define-bike-store-mvp/tasks.md)
содержит 69 открытых пунктов: документация готова к apply, сам apply не разрешён
текущим запросом планирования. [Реестр](OPEN-QUESTIONS.md) различает ответы,
design decisions и данные запуска; реализация отдельно не разрешена.

## Цель и границы

Согласованная цель UK B2C-магазина — [решения](decisions/001-mvp-baseline.md);
нормативные правила — delta specs активного change, [трассировка](TRACEABILITY.md).
Предыдущие concept/requirements/solutions согласованы с уточнениями.
Они описывают будущее поведение, не доказанные функции.
MVP и исключения — [proposal](../../openspec/changes/define-bike-store-mvp/proposal.md).

## Архитектура и стек

Согласована основа TypeScript/Next.js/Payload/PostgreSQL, pg_trgm, Stripe Checkout,
объектное хранилище и задачи на БД, модульный монолит.
Не путать runtime инструментария с выбранным production runtime приложения:
версии зависимостей приложения предстоит совместимо закрепить при разрешённой разработке.
[Архитектура](../architecture.md), [design](../../openspec/changes/define-bike-store-mvp/design.md).
Email Postmark оставлен по указанию человека. Hosting предложен как DigitalOcean
London/App Platform/managed PostgreSQL Standard/PITR; ресурсы/email не подключены.
[Сравнение](PROVIDERS.md); реальные аккаунты/договоры/доступ не проверены.

## Данные и инварианты

Модель → SKU; остатки SKU × точка; вся корзина из одной точки, склад для доставки.
Backend — источник истины, физические продажи через авторизованные операции.
Резерв всей корзины атомарен, корзина не резервирует.
Срок онлайн 30 минут; после оплаты позиции остаются обеспечением заказа, не истекают.
Самовывоз сразу; понедельник ready → четверг включительно Europe/London, однократное
продление до истечения максимум на 3 дня. Задержка магазина не штрафует клиента.
Заказ не удаляется при ошибке оплаты, хранит снимки товара/цен.
Поздняя оплата после обычного истечения повторно проверяет всю корзину, иначе refund;
явная отмена не восстанавливается. SKU shipping class, max тариф + настроенные доплаты.
Order/payment/fulfilment разделены; возврат денег не restock.
Доступ после проверки email; роли проверяются сервером.
Точный словарь — [THESAURUS](../THESAURUS.md). Q-01/Q-04/Q-05/семантика Q-07/Q-08
— бизнес-решения последнего сообщения; VAT/hosting/retention/link defaults — DD-01–DD-05.
У алгоритмов есть собственное происхождение; они не приписываются человеку.
Production targets RPO ≤ 5 min/RTO ≤ 4h, бюджет £75–150; 24h не финальная production-норма.
Неизвестные тарифы/география/календари и проверка recovery — отдельные launch gates.

## Инструменты и локальные команды

[settings](../../infrastracture/config/settings.json): gpt-6.1-sol/high,
openrouter/deepseek/deepseek-v4.1-flash/none; один писатель.
[package](../../infrastracture/package.json): OpenSpec 1.14.0.
Проверено 7 октября: Node v26.2.0, Python 3.14.6, Codex CLI 0.160.0, OpenCode 1.18.18.
Ранее проверены Git 2.50.1.windows.1 и Git Bash 5.2.37.
Версия CLI не доказывает текущую provider authentication.
[Исторический smoke](../../infrastracture/VERIFICATION.md) не повторён.

В корне проекта:
- infra.ps1 openspec new change define-bike-store-mvp — exit 0, создан только change.
- infra.ps1 openspec instructions specs/tasks --change define-bike-store-mvp --json —
  exit 0, прочитан реальный формат 1.14.0.
- infra.ps1 openspec validate define-bike-store-mvp --strict — exit 0.
- openspec status 8 октября — proposal/specs/design/tasks done; isPlanningComplete:true.
  Статус артефактов не означает выполнение: 0/69 пунктов tasks приняты.
- Приложение build/typecheck/lint/test не запускались: кода нет.

Финальные проверки — [PROGRESS](PROGRESS.md).
doctor/bootstrap/infra test не запускались в этом этапе; модель/квота не расходуются.
Никакие глобальные настройки и provider auth не изменены.
Команды будущей разработки — [development](../development.md), без фиктивных npm scripts.

## Ответственность

[Оркестратор](../../infrastracture/protocols/orchestrator.md) проектирует и принимает;
[воркер](../../infrastracture/protocols/worker.md) исполняет ограниченный контракт,
[приёмка](../../infrastracture/protocols/acceptance.md) независима.
Tasks подготовлен в разрешённом планировании; контракты concrete/ready готовятся
при запуске разработки по принятым зависимостям. Status CLI не заменяет авторизацию.
Секреты/сырые логи не добавлены.
