---
thesaurus-format: "2.0"
skill: ubiquitous-language
---

# Project Thesaurus

Словарь будущего магазина, составлен из утверждённых требований 7 октября 2026 года.
Продуктового кода нет: это предложенные канонические имена для документации и будущего
кода, а не восстановление существующих классов. Поведение задаёт OpenSpec.

## Index

- **Available Quantity** `AvailableQuantity` kind:value
- **Cart** `Cart` kind:aggregate
- **Collection** `Collection` kind:entity
- **Customer Account** `CustomerAccount` kind:entity
- **Fulfilment State** `FulfilmentState` kind:state
- **Inventory Balance** `InventoryBalance` kind:entity
- **Manager** `Manager` kind:role
- **Network Administrator** `NetworkAdministrator` kind:role
- **Order** `Order` kind:aggregate
- **Order Line Item** `OrderLineItem` kind:entity
- **Order State** `OrderState` kind:state
- **Payment Attempt** `PaymentAttempt` kind:entity
- **Payment State** `PaymentState` kind:state
- **Product Model** `ProductModel` kind:entity
- **Product Return** `ProductReturn` kind:aggregate
- **Refund** `Refund` kind:entity
- **Reservation** `Reservation` kind:aggregate
- **Return Line** `ReturnLine` kind:entity
- **Shipment** `Shipment` kind:entity
- **SKU** `SKU` kind:entity
- **Staff Account** `StaffAccount` kind:entity
- **Stock Location** `StockLocation` kind:entity

## Terms

### Available Quantity

- **Definition**: Количество SKU в точке, доступное для новых заказов с учётом активных резервов.

### Cart

- **Definition**: Корзина выбранных SKU до оформления; не резервирует остаток.

### Collection

- **Definition**: Самовывоз всей корзины из одного выбранного магазина.

### Customer Account

- **Definition**: Аккаунт покупателя с доступом к истории только после безопасного подтверждения email.

### Fulfilment State

- **Definition**: Состояние подготовки и получения товара, отдельное от заказа и оплаты.

### Inventory Balance

- **Definition**: Учёт физического количества одного SKU в одной точке.

### Manager

- **Definition**: Сотрудник с доступом к заказам всей сети, остаткам и блогу без глобальных настроек и прав.

### Network Administrator

- **Definition**: Сотрудник с полными разрешениями управления сетью.

### Order

- **Definition**: Оформленный запрос покупателя, сохраняемый независимо от результата оплаты.

### Order Line Item

- **Definition**: Позиция заказа со снимком купленного SKU, количества и денежных значений.

### Order State

- **Definition**: Состояние обработки заказа, отдельное от оплаты и исполнения.

### Payment Attempt

- **Definition**: Отдельная попытка оплаты заказа с собственным результатом провайдера.

### Payment State

- **Definition**: Состояние денежных фактов, не равное состоянию исполнения.

### Product Model

- **Definition**: Карточка модели товара, объединяющая продаваемые варианты SKU.

### Product Return

- **Definition**: Возврат физических товаров с приёмкой и проверкой; не денежный возврат.

### Refund

- **Definition**: Возврат денег по исходному платежу; не увеличение остатка товара.

### Reservation

- **Definition**: Временное выделение всей корзины в одной точке со сроком действия.

### Return Line

- **Definition**: Количество из позиции заказа, возвращаемое в рамках Product Return.

### Shipment

- **Definition**: Отправление с центрального склада; факт отправки не равен получению.

### SKU

- **Definition**: Продаваемый вариант модели с артикулом, собственной ценой, фотографиями и остатками.

### Staff Account

- **Definition**: Аккаунт сотрудника, отделённый от покупателя.

### Stock Location

- **Definition**: Центральный склад либо физический магазин с отдельными остатками.

## Forbidden

Не назначены: код ещё не содержит конфликтующих имён. Не использовать одно Status
для трёх различных понятий Order State, Payment State, Fulfilment State.

## Legacy

Нет продуктового кода и legacy-идентификаторов.

## Unresolved

Лексических конфликтов не обнаружено. Переходы состояний и точная семантика
подсчёта моделей — [открытые бизнес-вопросы](ai/OPEN-QUESTIONS.md), а не новые названия.
