# Локальная инфраструктура разработки для Windows

Переносимый комплект: **OpenSpec → GPT-6.1 Sol → Porch → DeepSeek v4.1 Flash в OpenCode → приёмка Sol**.
Поместите всю папку **infrastracture** внутрь целевого проекта. Рабочий корень
определяется как её родитель, независимо от текущей папки терминала.

## Первый запуск

В PowerShell из корня целевого проекта:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\infrastracture\infra.ps1 bootstrap
powershell -NoProfile -ExecutionPolicy Bypass -File .\infrastracture\infra.ps1 doctor
powershell -NoProfile -ExecutionPolicy Bypass -File .\infrastracture\infra.ps1 start docs
```

Bootstrap подключает навыки, инструкции AGENTS.md, OpenSpec и шаблоны контекста.
Существующее содержимое AGENTS.md сохраняется; добавляется обозначенный блок.
Существующие OpenSpec config/specs/changes сохраняются. При несовпадении уже
установленного навыка или генерируемой интеграции скрипт сообщает конфликт и не
перезаписывает его. Повторный запуск поддерживается. Существующие глобальные
настройки и авторизация Codex/OpenCode не изменяются.

В Codex Desktop можно вместо `start` открыть корень проекта, выбрать **GPT-6.1 Sol**
и передать текст одного из файлов `prompts/`. Начните с `00-connect.md` или
`01-document-project.md`. Папка на диске не переключает модель текущего чата;
CLI `start` закрепляет модель явно. После bootstrap новые навыки обнаруживаются
в новой сессии/следующем обновлении каталога навыков соответствующего агента.

## Разработка

Запишите конкретную задачу в UTF-8 файл, например `request.md`, и запустите:

```powershell
.\infrastracture\infra.ps1 start orchestrate --request .\request.md
# После прерывания:
.\infrastracture\infra.ps1 start resume
# Только приёмка завершённых задач:
.\infrastracture\infra.ps1 start accept
```

Если политика PowerShell запрещает прямой вызов, используйте показанный выше
`powershell -NoProfile -ExecutionPolicy Bypass -File ...` для этой команды;
машинную ExecutionPolicy менять не нужно.

Sol исследует код и готовит спецификацию, дизайн и задания. DeepSeek выполняет
ограниченные задания и проверки, ведёт журнал отклонений. Sol контролирует ход,
корректирует через Porch и самостоятельно проверяет результат. Разрешённая
реализация продолжается без повторного запроса согласования обычных действий.

## Команды для оркестратора

```powershell
.\infrastracture\infra.ps1 task new add-feature
# Sol заполняет docs/ai/tasks/add-feature/contract.json и ставит status: ready.
.\infrastracture\infra.ps1 task launch add-feature
.\infrastracture\infra.ps1 task events add-feature
.\infrastracture\infra.ps1 task status add-feature
.\infrastracture\infra.ps1 task steer add-feature --file .\correction.md
.\infrastracture\infra.ps1 task collect add-feature --timeout 45
.\infrastracture\infra.ps1 task check add-feature
# Sol читает diff/журнал и записывает acceptance.md:
.\infrastracture\infra.ps1 task accept add-feature
.\infrastracture\infra.ps1 openspec validate --all --strict
.\infrastracture\infra.ps1 porch delegate list --active --json
```

Код `124` у collect означает, что время ожидания истекло, а воркер продолжает
работать. `cancel` запрашивает остановку; подтвердите её через collect/status,
изучите частичные файлы и только затем назначайте замену. Контракты запускаются
один раз; для оставшихся исправлений создайте отдельную задачу. Команды проверки
задаются массивом argv и исполняются из корня проекта. `python` заменяется на
выбранный интерпретатор. Наличие acceptance.md само по себе не доказывает качество:
Sol обязан проверить его основания. Подробности — `protocols/`.

Все опции `--root` ставятся **перед подкомандой**. Для явно выбранного worktree:

```powershell
.\infrastracture\infra.ps1 --root 'C:\dev\target-worktree' task status add-feature
```

Обычный режим — один писатель в одном корне. Таймер не запускает Sol автоматически:
он должен оставаться активным, проверить воркера в первую минуту и затем по риску,
обычно раз в 5 минут. Завершение родительского чата не принимает работу и не
останавливает detached-воркера. Возобновляйте через `start resume`.

## Что находится в комплекте

| Путь | Назначение |
|---|---|
| `infra.ps1`, `scripts/` | Windows launcher и контроллер команд |
| `config/settings.json`, `config/porch.json` | Закреплённые модели и профили |
| `prompts/00…05` | Подключение, документация, спецификация, оркестрация, восстановление, приёмка |
| `protocols/` | Постоянные правила Sol, воркера и приёмки |
| `templates/` | Контекст, прогресс, OpenSpec config и контракт задания |
| `skills/` | Три управляющих навыка для Codex |
| `vendor/pragmatic-orchestration/` | Porch CLI, навыки/протоколы и offline tests |
| `vendor/ai-driven-development/` | Полная библиотека навыков и hooks upstream |
| `package.json`, `package-lock.json`, `node_modules/` | Локальный OpenSpec и фиксированные зависимости |
| `config/sources.json`, `config/vendor-sha256.json` | Версии upstream и контрольные суммы |
| `VERIFICATION.md` | Проверки этого комплекта и их пределы |

В целевом проекте появляются `openspec/`, `.agents/skills/`, `.opencode/`
интеграции OpenSpec, `docs/ai/` и блок в `AGENTS.md`.
Состояние задач хранится в `docs/ai/tasks/<id>/`. Технические файлы и логи —
в `infrastracture/.runtime/`, реестр Porch — в его приватной папке LocalAppData.
Не переносите активные run ids на другой компьютер: запускавшийся процесс
продолжает работать в исходном корне. Для нового проекта переносите исходный
чистый комплект, а не рабочие журналы старого целевого проекта.

## Зависимости и настройки

Нужны Windows, Git с Git Bash, **Python 3.11+**, **Node.js 20.19+**, Codex CLI
и OpenCode с существующей авторизацией. На этой машине они обнаружены.
`INFRA_PYTHON` и `INFRA_BASH` позволяют выбрать нестандартные исполняемые файлы.
Системные runtime-бинарники не входят в комплект. Если node_modules отсутствует,
bootstrap выполнит `npm ci`; нужны сеть и npm registry. GitHub для обычного
подключения не нужен: исходники уже сохранены в vendor.

Выбрана точная доступная модель `openrouter/deepseek/deepseek-v4.1-flash`.
Авторизация остаётся в OpenCode, ключи в папку не копируются. Глобальные
provider settings объединяются с временной конфигурацией запуска воркера.
Effort установлен в `none`: не передаётся непроверенное имя provider-specific
variant. При смене модели/провайдера обновите оба файла конфигурации согласованно
и проведите smoke test; автоматического перехода на другую модель нет.

По умолчанию активируются шесть профильных навыков ai-driven-development:
code-that-fits-in-your-head, bug-fix-protocol, agentic-readiness,
ubiquitous-language, investigating-repository-history, repo-activity-summary.
Полная библиотека сохранена в vendor. `plan-mode` не активирован: его отдельный
approval gate не должен дублировать ваш разрешённый workflow. Системные cleanup
skills, remote-agents и hooks не устанавливаются автоматически. Подключайте их
для конкретной необходимости. Это не изменение их оригинальных инструкций.

Porch `delegate` даёт полный доступ процессу: это не песочница. Воркер получает
запрет рекурсивного task-delegation в конфигурации OpenCode и явные границы в
контракте, однако процесс имеет возможность выполнять shell-команды. Worktree
отделяет изменения, но не защищает компьютер. Поддержка Windows у upstream
экспериментальная; этот комплект проверен на указанном в VERIFICATION.md окружении.
Опциональный Porch UI и медиа не включены: используется headless CLI.

## Источники и лицензии

- [OpenSpec](https://github.com/Fission-AI/OpenSpec) — версия npm закреплена в lockfile.
- [Pragmatic orchestration](https://github.com/CodeAlive-AI/pragmatic-orchestration) — commit в sources.json.
- [AI-driven development](https://github.com/CodeAlive-AI/ai-driven-development) — commit в sources.json.
- [OpenCode: модели](https://opencode.ai/docs/models/) и [навыки](https://opencode.ai/docs/skills/).
- [Codex: параметры конфигурации](https://developers.openai.com/codex/config-reference).

Лицензии upstream сохранены вместе с исходниками и npm-пакетом. Обновления
вендора делайте осознанно с новым manifest/checksum и повторными проверками;
запуск bootstrap не скачивает новые версии навыков автоматически.

Имена справочных файлов FPF сокращены до 44 символов, длинные имена каталогов
разделов — до 35. Полные заголовки внутри документов сохранены. Ссылки, индексы
и генератор разделов обновлены; соответствие прежних и новых путей находится
в `config/renames.json`. Это локальная адаптация сохранённой версии upstream.
