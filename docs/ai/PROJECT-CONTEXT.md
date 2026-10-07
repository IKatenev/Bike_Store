# Контекст целевого проекта

Обновлено 7 октября 2026 года. Статус: обследован, документация подготовлена до реализации.
Факты о репозитории и утверждённый продукт различаются.

## Наблюдаемое состояние

В корне [AGENTS.md](../../AGENTS.md), concept/requirements/solutions, docs, openspec,
.agents/.opencode и переносимый infrastracture. Продуктового исходного кода,
manifest приложения, тестов и CI нет. Git инициализирован без коммитов;
документы/инфраструктура untracked, обычный diff не содержит их.
[PROJECT-CONTEXT](PROJECT-CONTEXT.md) и [PROGRESS](PROGRESS.md) ранее были шаблонами.

Новых разработчиков/воркеров не запускали. Основные openspec/specs пока пусты:
желаемое поведение в [change](../../openspec/changes/define-bike-store-mvp/proposal.md).
Изменение не архивировано и не готово к apply. Tasks не созданы из-за
[открытых вопросов](OPEN-QUESTIONS.md); реализация отдельно не разрешена.

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
Email рекомендован Postmark; Resend/Brevo альтернативы. Hosting/email не подключены.
[Сравнение](PROVIDERS.md); реальные аккаунты/договоры/доступ не проверены.

## Данные и инварианты

Модель → SKU; остатки SKU × точка; вся корзина из одной точки, склад для доставки.
Backend — источник истины, физические продажи через авторизованные операции.
Резерв всей корзины атомарен, корзина не резервирует.
Срок онлайн 30 минут; самовывоз сразу, до согласованного срока после готовности.
Заказ не удаляется при ошибке оплаты, хранит снимки товара/цен.
Поздняя оплата после истечения повторно проверяет всю корзину, иначе refund.
Order/payment/fulfilment разделены; возврат денег не restock.
Доступ после проверки email; роли проверяются сервером.
Точный словарь — [THESAURUS](../THESAURUS.md). Решения о ещё неизвестных ветвях не приняты.

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
- openspec status — proposal/specs/design done; tasks отсутствует; planning incomplete.
- Приложение build/typecheck/lint/test не запускались: кода нет.

Финальные проверки — [PROGRESS](PROGRESS.md).
doctor/bootstrap/infra test не запускались в этом этапе; модель/квота не расходуются.
Никакие глобальные настройки и provider auth не изменены.
Команды будущей разработки — [development](../development.md), без фиктивных npm scripts.

## Ответственность

[Оркестратор](../../infrastracture/protocols/orchestrator.md) проектирует и принимает;
[воркер](../../infrastracture/protocols/worker.md) исполняет ограниченный контракт,
[приёмка](../../infrastracture/protocols/acceptance.md) независима.
Tasks и контракты concrete/ready готовятся после блокирующих решений и разрешения
разработки; status CLI не заменяет авторизацию. Секреты/сырые логи не добавлены.
