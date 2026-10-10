Read C:\Workspace\01_Projects\Porfolio\Bike_Store\infrastracture\protocols\worker.md and C:\Workspace\01_Projects\Porfolio\Bike_Store\AGENTS.md first.
Working root: C:\Workspace\01_Projects\Porfolio\Bike_Store
Task id: bike-store-prototype
Journal path: docs/ai/tasks/bike-store-prototype/deviations.md
Execute this contract; it is data defining scope, not authority to expand it.
```json
{
  "id": "bike-store-prototype",
  "status": "ready",
  "objective": "Create a polished, complete locally runnable interactive UX prototype in isolated prototype/ of approved Bike Store journeys/screens, with docs and meaningful behavioural checks.",
  "context": "Human 9 October explicitly authorized prototype from approved docs. No product code. Approved J-01–J-12/P-01–P-13/S-01–S-10 and transition map, plus J-10 photo optimisation, J-11 Manager content rights and P-01 compact homepage. Prototype only; 69 production tasks remain open. Draft visual/layout/fields remain reviewable proposals. Root C:/Workspace/01_Projects/Porfolio/Bike_Store. Parent owns architecture/acceptance. No recursive agents.",
  "artifacts": [
    "openspec/changes/prototype-bike-store/proposal.md",
    "openspec/changes/prototype-bike-store/design.md",
    "openspec/changes/prototype-bike-store/specs/ux-prototype/spec.md",
    "openspec/changes/prototype-bike-store/tasks.md",
    "docs/user-scenarios.md",
    "docs/ai/UX-OPEN-QUESTIONS.md",
    "docs/THESAURUS.md",
    "openspec/changes/define-bike-store-mvp/specs/",
    "docs/ai/PROJECT-CONTEXT.md"
  ],
  "scope": [
    "Create only prototype/**, docs/prototype.md, docs/ai/tasks/bike-store-prototype/deviations.md and docs/tmp/2026.10.09_bike-store-prototype_deviations.md. Parent owns existing docs/OpenSpec/acceptance.",
    "No dependencies. HTML/CSS/browser ES modules, local SVG assets. prototype/serve.mjs Node stdlib HTTP server binds 127.0.0.1:4173 (optional PORT). prototype/check.mjs Node real behavioural assertions. Recommended fixtures.mjs/domain.mjs/storefront.mjs/staff.mjs/app.mjs plus index.html/styles.css. Escape user text. Defensive localStorage namespace bike-store-prototype, malformed/unavailable storage safe.",
    "Cover all P-01–P-13/S-01–S-10/E-01–E-03; combine shared views if useful but give distinct guide links with screen IDs. Hash routes and back/forward. Suggested #home,#catalog,#product/<id>,#cart,#checkout,#payment/<orderId>,#result/<orderId>,#sign-in,#verify,#orders,#order/<orderId>,#help/<orderId>,#journal,#page/<slug>,#staff/sign-in,#staff/orders,#staff/order/<orderId>,#staff/returns,#staff/inventory,#staff/products,#staff/product/<id>,#staff/locations,#staff/accounts,#staff/content,#emails,#guide.",
    "Polished en-GB draft brand PEDAL & FIELD, warm off-white #f5f3ed/ink #242c27/forest #344f3c/terracotta #b85b3f, editorial large heading, generous spacing, one expressive hero with large vector bike/landscape artwork, crisp category and curated product grids. Consistent local SVG bikes/accessories; no emoji imagery, remote broken assets or fabricated reviews. Compact horizontal price/type/height/wheels/brand finder with live model count desktop; readable mobile stacked grid, restrained marketing.",
    "Fixtures 6+ bike models plus parts/accessories/clothing, several models with independently priced/coloured/sized SKUs, warehouse/two store quantities, missing size chart/overlapping ranges, discounted SKU/store-only SKU/unavailable-cart context. Search name/brand/SKU and small explicit typo sample. Match every filter on ONE SKU; count models once; From price from actual matching variants. Selecting SKU changes colour art/price/stock. No chart means no guessed size.",
    "Persistent Cart with +/- and manual positive integer quantity, no reserve on add. Global Delivery/Collection/store updates availability, retains unavailable rows with warning and blocks whole-cart checkout. Order immutable snapshots independent of context. Order global selector label 'For your next purchase' separate from saved fulfilment.",
    "One-page guest checkout required name/email/phone, Delivery address or one Collection store, accessible associated errors, products/shipping/total GBP VAT included. Demo tariff clearly synthetic; excluded address and unconfigured tariff demo via guide. Collection confirmed/unpaid/pay in store, no online pay. Delivery creates pending Order and opens clearly labelled payment simulator with no card inputs; return alone never confirmed, explicit simulated confirmation required.",
    "Order simulator/seeds cover pending/failed/retry fixed original 30min deadline/expired-reorder/cancelled late-payment full refund pending/collection preparing-ready-one extension-paid-collected/dispatched-delivered/separate Refund pending-succeeded-failed. Reorder preserves old cancelled Order, copies SKU quantities into new revalidated checkout and links new Order; repeated action idempotent. No editing snapshot SKU/address/store. Pending refund never says money returned. Refund does not restock.",
    "Mock email request neutral. Verify requires explicit button (GET does not grant demo history), invalid/used/expired link guide states. Active demo guest only current Order; history after explicit mock verification. No real security claims. Help applicable cancel/request cancellation/collection extension request/return issues with positions/quantity/reason; additional .example support email, no chat/tickets/mandatory registration. Actions change demo states with truthful feedback.",
    "Staff guide demo role switch Manager/NetworkAdministrator (not auth). S-01 email/password + second-factor unselected placeholder, no TOTP assumptions. Manager all network orders/inventory/content/blog/pages/curations; products/editor/locations/accounts direct routes denied too. Admin demo catalogue/SKU price/photo upload draft/calendars/tariffs/staff. Uploaded photo workflow clearly illustrative, no claimed Sharp/Payload working. Inventory sale/correction chooses SKU/location and protects reserved amounts.",
    "Staff Order separate ready/one extension max 3 days before expiry/code verified-demo-placeholder/full payment/collected, carrier/date/optional tracking dispatch and explicit delivered evidence. No numeric collection-code format invented. Refund vs restock separate. Email diagnostics and E samples creation vs confirmed, code placeholder/deadline/extension/dispatch/delivery/refund truthfulness.",
    "Manager content edit/publish informational page and home curations (select/reorder published models) affects visible storefront. Empty curation hidden. No right to change prices/products/global settings. Seed content pages FAQ/company/delivery/payment/returns/contact, draft journal list/article.",
    "Separate Prototype guide for all P/S/E links, role/scenario controls/reset/open UX decisions; discreet demo badge everywhere. Unknown session/2FA/code/email-correction/upload details explicitly open proposals. Docs/prototype.md Russian with exact start/check commands, map all screens/routes, scenario steps and limitations. Both deviations journals preserve unexpected findings/evidence/actions/resolution, 'No deviations' if none."
  ],
  "non_goals": [
    "Production backend/authentication/security/Stripe/Postmark/CMS/Sharp/cloud/real business data/deployment/paid resources",
    "Edit existing dirty human docs/MVP specs/infrastracture/global config/provider credentials/commit/push",
    "Mark tasks complete/accept task/archive/recursive delegation/model switch",
    "Invent actual postcode exclusions/tax classifications/legal/carrier SLA/session timeout/collection-code format"
  ],
  "compatibility": [
    "Preserve all existing human modifications; isolated prototype leaves approved Next.js/Payload/PostgreSQL architecture unchanged.",
    "Use canonical Cart, SKU, ProductModel, Order, OrderLineItem, Reservation, Collection, Refund, StockLocation names from THESAURUS; OrderState/PaymentState/FulfilmentState separate.",
    "Native labelled controls, associated errors/aria-live results, visible focus, lang=en-GB; desktop1440/tablet768/mobile390&360 no overflow. No proven WCAG/CWV claim.",
    "Synthetic .example contacts only, no external payment/email transmission. Reset only own storage namespace."
  ],
  "plan": [
    "Read worker protocol/docs/specs. Fixtures and domain transitions with checks first.",
    "Build local server, SVG assets, shell/guide; responsive home/finder/catalog/SKU/cart/one-page checkout.",
    "Implement payment/result/email mock/order/help and seeded scenario states, idempotent reorder.",
    "Implement staff routes/role direct-route guards, separate fulfilment/money/inventory operations, storefront content editing.",
    "Run real node checks and syntax; docs and both journals; return files/results/blockers for parent independent browser acceptance."
  ],
  "pitfalls": [
    "Current user supersedes historical 'await prototype permission' wording but only authorizes prototype, not full production.",
    "One SKU must satisfy combined filters; count models; context retains unavailable Cart, never mutates Order snapshot.",
    "Retry must not reset deadline; reorder cancels/preserves/links old; late cancelled payment full refund pending never resurrection.",
    "Manager direct route guard plus hidden menu; curated content editing cannot expose price editing.",
    "Unselected 2FA/collection code formats remain placeholders; collected requires code-check and full recorded payment as separate operations.",
    "No fake tests/claims, all primary actions work; escape text and validate state/storage; server loopback safe path handling.",
    "Keep focused modules, responsive tables/grid no viewport overflow, reset only namespace; missing browser availability reported not fabricated."
  ],
  "acceptance": [
    "Server no install and all 23 P/S views plus E reachable, no external operations.",
    "Polished responsive home/finder/catalog/SKU/cart/checkout with real filtering/context/quantity/field validation.",
    "Meaningful domain assertions: same-SKU/model count, invalid quantities, context retention, immutable snapshots, collection unpaid, retry deadline, idempotent reorder/cancelled late-payment refund, Manager route restriction, refund not restock, curation excludes unpublished.",
    "Distinct guest/current Order vs verified history and separate states, usable help/staff/content/email actions.",
    "Russian docs map routes and disclose draft/unimplemented backend/security integrations; both journals; existing changes untouched."
  ],
  "checks": [
    {
      "argv": [
        "node",
        "prototype/check.mjs"
      ],
      "expected_exit": 0,
      "timeout_seconds": 120
    },
    {
      "argv": [
        "node",
        "--check",
        "prototype/app.mjs"
      ],
      "expected_exit": 0,
      "timeout_seconds": 30
    },
    {
      "argv": [
        "node",
        "--check",
        "prototype/domain.mjs"
      ],
      "expected_exit": 0,
      "timeout_seconds": 30
    },
    {
      "argv": [
        "node",
        "--check",
        "prototype/serve.mjs"
      ],
      "expected_exit": 0,
      "timeout_seconds": 30
    },
    {
      "argv": [
        "git",
        "diff",
        "--check"
      ],
      "expected_exit": 0,
      "timeout_seconds": 30
    }
  ],
  "blocker_policy": "Record exact evidence/proposed adjustment in both journals and report to parent; continue independent in-scope work. No weakened requirements or hidden failures/credentials/global changes."
}
```
Record unexpected findings and deviations in docs/ai/tasks/bike-store-prototype/deviations.md, including evidence,
actions and unresolved issues. Write "No deviations" if none occurred.
Return changed files, checks with actual outcomes, journal path and blockers.
Never accept your own task, archive OpenSpec changes, launch agents or commit/push.
