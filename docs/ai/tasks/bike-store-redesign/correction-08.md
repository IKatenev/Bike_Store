# Устранить мобильный overflow новой навигации

После уплотнения header browser 390×844: document.scrollWidth=509 при innerWidth=390. .nav-row-cats clientWidth=489 left20 right509; overflow-x:auto не работает как внутренний scroll, потому что сам ряд расширен до min-content. .nav-row-util также шириной489; context-picker right402.

Ограничь мобильные .nav-row шириной100%/min-width:0/max-width:100%, flex auto вместо наследуемого flex sizing при flex-column; .header-inner контейнер не должен раздуваться. Context label+select на mobile размести label над select либо уменьши label, select min-width:0/max-width:100%, родитель width100%. На 360/390 document.scrollWidth не превышает viewport; categories scrollWidth может превышать clientWidth только ВНУТРИ контейнера. Mega panel при overflow row не должен клипаться: можно вынести panel или использовать мобильное раскрытие под row.

Parent проверил фактические DOM bounds, это новое переполнение после correction06. Остальные требования сохраняются; проверь 360/390 до передачи.
