# Разработка и оркестрация

Продуктового приложения пока нет. Нельзя выдавать будущие npm build/test за проверенные.
Рабочий корень — корень магазина, не infrastracture.
[Протокол](../infrastracture/protocols/orchestrator.md),
[контекст](ai/PROJECT-CONTEXT.md), [прогресс](ai/PROGRESS.md).

## Проверка документов

```powershell
.\infrastracture\infra.ps1 openspec validate define-bike-store-mvp --strict
.\infrastracture\infra.ps1 openspec validate --all --strict
.\infrastracture\infra.ps1 openspec status --change define-bike-store-mvp --json
```

Strict проверяет структуру, не полноту бизнес-решений.
Status done у tasks означает наличие планового файла, не выполнение его пунктов.
[Tasks](../openspec/changes/define-bike-store-mvp/tasks.md) подготовлен: 69 открытых
пунктов с зависимостями и evidence, isPlanningComplete:true;
[реестр](ai/OPEN-QUESTIONS.md) уже содержит ответы, design defaults и отдельные launch gates.

## После отдельной авторизации разработки

Sol использует принятые specs/design/tasks, снимает baseline и готовит ограниченные
контракты на следующие пункты с уже принятыми зависимостями. В каждом контракте реальные scope,
specs/design, зависимости, запреты, проверки argv и deviations.md, без шаблонных полей.
Сначала контракт draft; ready только после проверки Sol.
Исполнитель только DeepSeek v4.1 Flash/OpenCode через toolkit/Porch, один писатель.
Не использовать встроенных субагентов как замену выбранному исполнителю.

task new → launch → events/status в первые 45–60 секунд → контроль обычно каждые
5 минут → collect/check → чтение diff/deviations → acceptance → task accept.
collect timeout 124 означает продолжающуюся работу. completed не равно accepted.
Steer требует проверки доставки и фактического эффекта.
Замена писателя: cancel → подтверждённая остановка → изучение частичных файлов.
Родительский сеанс должен оставаться активен: автоматического таймера у toolkit нет.
Полный доступ воркера — не песочница; рабочая копия не ограничивает доступ к компьютеру.

До начала работы снять исходное состояние. При этой проверке Git имеет baseline
0be0fe7 (Documentary init); прежние документы tracked, новый tasks.md пока untracked.
Сохранить diff/hashes и не приписывать воркеру существовавшие изменения.

Не запускать разработку сейчас. Не архивировать change до завершения и приёмки.
Не коммитить/публиковать/деплоить без соответствующей авторизации.
