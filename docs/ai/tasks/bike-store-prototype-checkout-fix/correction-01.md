# Mobile table correction within the same bounded task

Sol checked every guide route at 1440 and 360 px. All 31 guide links have real headings and no missing orders with the demo admin/verified persona. At 360 px only staff/order/ord-0006 and ord-0008 overflow the PAGE (scrollWidth 385, innerWidth 360).

DOM evidence: .data-table thead/tr/tbody right386.52 from left43. .data-table has display:block/overflow-x:auto at mobile, but its computed width expands the parent instead of containing its own scroll. Make table horizontal scrolling stay inside the panel; inspect parent min-width and table max-width. Add prototype/styles.css to your authorized write scope; change only the rule needed. Do not hide page overflow globally or truncate content. The parent will repeat 360/390/768/1440 browser acceptance. Update this task journals/docs appropriately; no fake browser claims.
