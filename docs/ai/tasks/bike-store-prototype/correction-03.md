# Storefront browser checkpoint

Parent independently passed desktop/mobile home, finder, SKU price change, persistent Cart, unavailable-row retention, guest Collection, full-payment/code handover, direct Manager route denial and Manager page/curation publishing. Existing correction-01/02 constraints and both journals stay applicable.

Two concrete remaining storefront mismatches were found:

1. CAT-05 price in fulfilment context: `productCard` chooses cheapest of all published SKUs regardless of current availability, and `filterModels`/catalog search results use min of all matching SKUs. Prefer the matching available variants for From price when any are available in the chosen context; only fall back to matching unavailable variants when none are available, with truthful no-stock label. Do NOT relax filter criteria to get an available SKU. Example: Fieldnote Terracotta is £1195 but warehouse 0; other matching warehouse variants £1295 => Delivery From £1295. York has Terracotta 1 => York From £1195; after collection consumes its last unit, York From £1295 (Forest is still available). Sort by the shown price. Curation/home cards must use same rule and current location stock, even with availability filter off. Add tests.
2. Catalogue refine loses homepage price/height: filter form only has q/category/brand/type/wheels/sort/inStock, and app submit rebuilds query dropping priceMax/heightCm. Include visible labelled price/height/frame-size controls (or retain active finder criteria with clear removable summaries) and preserve current filters on refining search/sort. All filter conditions still apply to one SKU, including frame size. Add render/behaviour evidence that Apply after finder does not silently discard constraints.

Visual final polish within original prototype scope: improve bike SVG so it is recognisably a complete bicycle (closed frame triangles, fork, handlebars/crank) rather than disconnected strokes. Put ordinary shopper copy in hero/finder instead of 'reviewable prototype/full order end to end/every condition one variant'; guide/badge already carries demo details. Keep draft disclaimer badge, simulator label, synthetic shipping and open-security disclosures where they affect a meaningful decision. Prefer sans-serif body/controls with editorial serif headings for reading. This is a reviewable design proposal, no new business promise.

Collection staff page after completed currently still offers payment/handover forms; hide or disable in inapplicable states with readable reason. Keep domain guards and explicit separate payment/handover.

Finish docs/checks/journals after these corrections, and report actual outcomes. Parent will reload and make final independent acceptance; do not edit parent-check.mjs or task acceptance.
