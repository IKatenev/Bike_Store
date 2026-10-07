---
name: local-project-orchestrate
description: Оркестрировать разрешённую разработку проекта через GPT-6.1 Sol и DeepSeek v4.1 Flash в OpenCode, включая контракты, контроль и восстановление.
---

Прочитай infrastracture/protocols/orchestrator.md из корня целевого проекта.
Для выполнения следуй infrastracture/prompts/03-orchestrate.md, после прерывания —
infrastracture/prompts/04-resume.md. Запускай внешнего воркера через infra.ps1 task,
чтобы закрепить модель, рабочий корень и журнал. Контролируй первый запуск в
первую минуту. Completed процесса не равно принятому результату. Сохраняй состояние
в docs/ai/PROGRESS.md. Не запускай пересекающихся писателей и не подменяй модель.
