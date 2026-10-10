# Tasks

Прототип разрешён командой владельца 9 октября 2026 года. Эти пункты относятся к макету, не заменяют 69 production-задач `define-bike-store-mvp`.

- [x] 1.1 Создать автономный local server, fixtures, hash-навигацию P/S/E, guide/reset и явные demo/draft обозначения. PRO-01, PRO-06; проверка запуска/syntax, всех маршрутов и отсутствия внешних операций.
- [x] 1.2 Создать адаптивную витрину/подбор/каталог/SKU/корзину и one-page checkout с согласованным получением и ошибками. Зависимость 1.1; PRO-02, PRO-03, PRO-06; behavioural и browser review desktop/mobile.
- [x] 1.3 Создать демонстрационные состояния оплаты/заказов/email proof/помощи и письма, сохраняющие согласованные границы. Зависимость 1.2; PRO-04; проверки retry deadline, immutable snapshot, reorder, pending refund.
- [x] 1.4 Создать S-01–S-10 по ролям, редактирование контента/подборок, отдельные деньги/остатки/получение. Зависимость 1.1; PRO-05; проверки Manager/direct routes и фактического отражения контента в витрине.
- [x] 1.5 Независимо проверить результат, исправить существенные дефекты, сверить deviations, сохранить docs/prototype.md и acceptance; открыть preview владельцу. Зависимости 1.2–1.4; PRO-06; checks, strict OpenSpec, браузер и evidence Sol.

Приёмка Sol 9 октября 2026: docs/ai/tasks/bike-store-prototype/acceptance.md и
корректирующий отчёт bike-store-prototype-checkout-fix. Оба toolkit task accept
выполнены после terminal completion и независимых task check: 84/0, 12/12 parent,
browser review. S-08/S-09 иллюстрируют структуру; полноценная CMS вне этого scope.
