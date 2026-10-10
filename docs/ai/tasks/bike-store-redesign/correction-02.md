# Исправить breakpoint фильтров до передачи результата

В текущем styles.css @media max-width:900 скрывает .catalog-sidebar и показывает Filter, но .filter-drawer position/fixed layout только внутри max-width:600. Это оставляет 601–900px без нормальной панели и расходится с требованием скрывать фильтры только начиная с телефонов.

Сохрани sidebar на 601–900px, сетку продуктов две колонки <=900. Перенеси catalog-layout:1fr, sidebar display:none, Filter button visibility в max-width:600. На 768 sidebar + две карточки должны помещаться без overflow (можно сузить sidebar до 200px/уменьшить gaps). На <=600 drawer доступен, закрывается Escape и возвращает focus. Не создавай дубликат подробной формы с одинаковыми IDs.

Остальной контракт неизменен, parent проверит 768/390/360 browser.
