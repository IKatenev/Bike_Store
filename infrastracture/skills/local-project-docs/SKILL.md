---
name: local-project-docs
description: Исследовать целевой проект и подготовить основанную на исходниках документацию и OpenSpec артефакты с локальным комплектом infrastracture.
---

Работай из корня целевого проекта, родителя infrastracture. Прочитай
infrastracture/protocols/orchestrator.md. Для обследования и документации следуй
infrastracture/prompts/01-document-project.md; для конкретного изменения —
infrastracture/prompts/02-specify-change.md. Используй CLI infrastracture/infra.ps1.
Сохраняй проверенные факты в docs/ai/PROJECT-CONTEXT.md, требования в OpenSpec,
состояние в docs/ai/PROGRESS.md. Не придумывай продукт, стек и реализованные функции.
Уважай запрос только на документацию: он сам по себе не разрешает реализацию.
