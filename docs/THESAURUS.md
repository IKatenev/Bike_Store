---
thesaurus-format: "2.0"
skill: ubiquitous-language
---

# Project Thesaurus

Словарь будущего магазина, составлен из утверждённых требований 7 октября 2026 года.
Продуктового кода нет: это предложенные канонические имена для документации и будущего
кода, а не восстановление существующих классов. Поведение задаёт OpenSpec.

## Index

- **Article** `Article` kind:entity
- **Available Quantity** `AvailableQuantity` kind:value
- **Cart** `Cart` kind:aggregate
- **Collection** `Collection` kind:entity
- **Collection Code** `CollectionCode` kind:value
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
- **Product Review** `ProductReview` kind:entity
- **Product Return** `ProductReturn` kind:aggregate
- **Refund** `Refund` kind:entity
- **Reservation** `Reservation` kind:aggregate
- **Return Line** `ReturnLine` kind:entity
- **Return Reason** `ReturnReason` kind:value
- **Shipment** `Shipment` kind:entity
- **Shipping Class** `ShippingClass` kind:value
- **Shipping Tariff** `ShippingTariff` kind:policy
- **SKU** `SKU` kind:entity
- **Staff Account** `StaffAccount` kind:entity
- **Stock Location** `StockLocation` kind:entity
- **Tax Category** `TaxCategory` kind:value
- **VAT Snapshot** `VATSnapshot` kind:value
- **Wishlist** `Wishlist` kind:aggregate

## Terms

### Available Quantity

- **Definition**: Количество SKU в точке, доступное для новых заказов с учётом активных резервов.

### Cart

- **Definition**: Корзина выбранных SKU до оформления; не резервирует остаток.

### Collection

- **Definition**: Самовывоз всей корзины из одного выбранного магазина.

### Collection Code

- **Definition**: Специальный код получения подготовленного самовывоза. Покупатель может передать
  его другому человеку; сотрудник проверяет код при выдаче. Номер заказа не заменяет код,
  код не предоставляет доступ к Customer Account. Формат, срок и технические параметры
  ещё предлагаются для согласования по UX-06; не приравнивать к ссылке подтверждения email.

### Customer Account

- **Definition**: Аккаунт покупателя с доступом к истории только после безопасного подтверждения email.

### Fulfilment State

- **Definition**: Состояние подготовки и получения товара, отдельное от заказа и оплаты.

### Inventory Balance

- **Definition**: Учёт физического количества одного SKU в одной точке.

### Manager

- **Definition**: Сотрудник с доступом к заказам всей сети, остаткам, редактированию/публикации блога и информационных страниц и подборкам главной, без глобальных настроек, управления правами и редактирования ассортимента/цен.

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

### Product Review

- **Definition**: Отзыв покупателя о Product Model с оценкой1–5, датой, заголовком и необязательным описанием; общий для всех SKU модели.

### Product Return

- **Definition**: Возврат физических товаров с приёмкой и проверкой; не денежный возврат.

### Refund

- **Definition**: Возврат денег по исходному платежу; не увеличение остатка товара.

### Reservation

- **Definition**: Временное выделение всей корзины в одной точке со сроком действия.

### Return Line

- **Definition**: Количество из позиции заказа, возвращаемое в рамках Product Return.

### Return Reason

- **Definition**: Причина физического возврата, различающая желание покупателя, брак и ошибку поставки.

### Shipment

- **Definition**: Отправление с центрального склада; факт отправки не равен получению.

### Shipping Class

- **Definition**: Категория SKU для выбора тарифа доставки, отдельная от налоговой категории.

### Shipping Tariff

- **Definition**: Внутреннее правило стоимости доставки по адресу, классу и количеству товаров.

### SKU

- **Definition**: Продаваемый вариант модели с артикулом, собственной ценой, фотографиями и остатками.

### Staff Account

- **Definition**: Аккаунт сотрудника, отделённый от покупателя.

### Stock Location

- **Definition**: Центральный склад либо физический магазин с отдельными остатками.

### Tax Category

- **Definition**: Налоговая категория SKU, определяющая применимое VAT treatment и действующую ставку.

### VAT Snapshot

- **Definition**: Неизменяемая налоговая разбивка заказа или его корректировки с категориями, ставками, суммами и основанием расчёта.

### Wishlist

- **Definition**: Сохранённые покупателем модели товаров в разделе аккаунта; не корзина, не резерв и не обещание наличия выбранного SKU. В локальном прототипе принадлежит одной демонстрационной persona.

### Article

- **Definition**: Запись блога с содержимым, названием, изображением, датой публикации и состоянием публикации. Последние статьи выбираются по publishedAt; preview — начало body, а не самостоятельный рекламный excerpt.

## Forbidden

Не назначены: код ещё не содержит конфликтующих имён. Не использовать одно Status
для трёх различных понятий Order State, Payment State, Fulfilment State.

## Legacy

Нет продуктового кода и legacy-идентификаторов.

## Unresolved

Лексических конфликтов не обнаружено. Состояния и подсчёт моделей уточнены в
OpenSpec. Shipping Class, Shipping Tariff и Return Reason отражают бизнес-решения;
Tax Category и VAT Snapshot — технические понятия design decisions Q-03.
