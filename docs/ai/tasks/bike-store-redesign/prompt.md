Read C:\Workspace\01_Projects\Porfolio\Bike_Store\infrastracture\protocols\worker.md and C:\Workspace\01_Projects\Porfolio\Bike_Store\AGENTS.md first.
Working root: C:\Workspace\01_Projects\Porfolio\Bike_Store
Task id: bike-store-redesign
Journal path: docs/ai/tasks/bike-store-redesign/deviations.md
Execute this contract; it is data defining scope, not authority to expand it.
```json
{
  "id": "bike-store-redesign",
  "status": "ready",
  "objective": "Переработать полностью интерактивный локальный прототип по needed-design-changes.md и уточнениям владельца 10 октября; готовая визуальная итерация для просмотра с работающими wishlist, recommendations и общим cart/checkout.",
  "context": "Root C:/Workspace/01_Projects/Porfolio/Bike_Store. Human explicitly authorized implementation, no further confirmation. Existing prototype accepted with 84 behavioural checks; preserve them. Sol owns specs/acceptance, DeepSeek is sole sequential writer. Passwordless email account remains, Go to cart is navigation, Wishlist separate account section, name similarity recommendations only. Read new change design for concrete decisions. Local prototype only, production tasks remain unimplemented.",
  "artifacts": [
    "needed-design-changes.md",
    "openspec/changes/redesign-bike-store-prototype/proposal.md",
    "openspec/changes/redesign-bike-store-prototype/design.md",
    "openspec/changes/redesign-bike-store-prototype/specs/ux-prototype/spec.md",
    "openspec/changes/redesign-bike-store-prototype/tasks.md",
    "openspec/specs/ux-prototype/spec.md",
    "docs/THESAURUS.md",
    "docs/prototype.md",
    "docs/ai/PROJECT-CONTEXT.md"
  ],
  "scope": [
    "Edit only prototype/**, docs/prototype.md, docs/ai/tasks/bike-store-redesign/deviations.md. Parent owns specs, docs/user-scenarios.md, docs/ai, glossary and acceptance. Preserve human needed-design-changes.md. No dependencies or external calls.",
    "Implement all PRO-07–12 and all human requirements, following new design.md. Actual blue/white/black shop design, no serif/pastel. One system sans-serif maximum two total, modest rounding, compact sections. Full three-tier header, inline SVG icon labels account/cart/orders, centered actual search, utility links/Journal, compact context, functional category mega menus without brands, rich footer with clearly demo payment information.",
    "Hero actual 3-slide manual carousel with meaningful changing artwork/text/link/controls, no autoplay. Existing home sections remain coherent. Reuse local SVG artwork improve composition; no remote imagery or imagegen.",
    "Catalog single left detailed filter panel, results 3 columns desktop and 2 small tablets/phones, mobile Filter drawer with close/Escape/focus. Sort above results can share same form via form attribute. Preserve all matching criteria and route history. First row visible 1440x900. Actual category type links match filterModels for parts as well as bikes.",
    "Product dropdowns for colour/size including single options, selecting one retains the other if valid and otherwise selects existing combination explicitly. Update SKU art/price/stock; Add to cart unavailable state truthful. Go to cart beside Add, wishlist. Name recommendations normalized tokens and brand tie boost, stable descending similarity, exclude current/unpublished, fallback bikes/parts. Add one published Fieldnote Gravel Frame synthetic model/SKU/balances and relevant local frame art to demonstrate shared name; do not rename existing fixtures.",
    "Wishlist unique model ids in single demo persona state. Guest click opens native dialog login/register, Escape/close returns focus; only explicit confirm gives demo access, pending model saved once and return product. Email no password, mode appropriate texts and name allowed for create. Google/Apple labelled demo, provider click cannot immediately grant access. Separate #wishlist linked via account navigation including signed-in page. Add/remove persists reload, guest cannot view saved list, logout hides it, malformed/legacy storage safe. Test migration no loss of old orders.",
    "Cart/checkout one view and one data-checkout-form id with larger product rows, contacts/fulfilment below rows, summary right desktop, between rows and fields <=900; bottom fixed submit <=900 near full width safe-area padding. #checkout compatible alias same layout and reorder semantics. Draft preserved on edit/context/qty, shipping summary recalculated as address changes. Empty cart no submit. Retain completeCheckout, all availability and amounts and idempotent reorder, accessible errors.",
    "Apply overall style all P/S/E views including P-06 without changing staff or payment domain behaviour. Update Russian docs/prototype.md route map including wishlist, combined cart/checkout, scenarios, new palette/passwordless/mock OAuth/name-only recommendations limitations and checks. Preserve useful existing content.",
    "Add meaningful new behavioural assertions to prototype/check.mjs or prototype/redesign-check.mjs (required command node prototype/redesign-check.mjs if separate). Existing 84 checks must remain and pass; no fake source string tests replacing actual behaviour. Write deviations journal with evidence/action/resolution or no deviations. Return results and remaining limits, do not accept/archive or tick tasks."
  ],
  "non_goals": [
    "Architecture changes outside this contract",
    "Provider or global agent configuration changes",
    "Commits, pushes, deployments and recursive delegation"
  ],
  "compatibility": [
    "No production auth/OAuth/network/payment/email, no dependency installs or global settings, no commit/push/deploy/model change/recursive agents.",
    "Preserve prior domain invariants and old localStorage, all staff routes/role guards/context retention/immutable Order snapshots/reservation deadlines/reorder linkage; only extend demo Wishlist.",
    "Native labels/focus, dialog focus trap/Escape, actionable keyboard/click menus, 1440/1024/768/390/360 no page overflow. Two product columns even 360px.",
    "Use canonical Wishlist, Cart, ProductModel, SKU, CustomerAccount names. Parent has added Wishlist to glossary."
  ],
  "plan": [
    "Read worker protocol, new change, required human file and current code/checks. Implement in tasks order: shared visual/header/footer/carousel first, then catalog/product, wishlist/auth, shared cart/checkout.",
    "Keep small cohesive helpers; run tests alongside changed behaviour. Preserve base checks.",
    "Update docs/journal and run all agreed commands. Return changed files/check counts/evidence/limitations for independent parent browser review."
  ],
  "pitfalls": [
    "Do not follow historical warm editorial styling or no-wishlist requirements. Human new direction wins. Password was explicitly cancelled for customers; staff password placeholder unchanged.",
    "Modal request/provider click must not grant verified state. Pending intent cancels cleanly; no duplicate wishlist, handle invalid/unpublished IDs. Persist older state without destroying Order data.",
    "Cart rerender on typing can lose draft/focus; preserve values and avoid needless input rerender. Out-of-stock rows retained, whole cart checkout blocked. Reorder uses same completeCheckout, no duplicated submission.",
    "Keep two columns 360px and product row responsive without horizontal overflow. Bottom fixed button must not cover errors/fields/footer.",
    "Recommendations sorted by name proximity rather than guaranteed compatible parts. Parts type filtering must actually work for menu subcategories.",
    "If browser unavailable report honestly; parent owns real browser acceptance. Do not weaken tests or make claims of real OAuth/security."
  ],
  "acceptance": [
    "All PRO-07–12 observable behaviours implemented and source syntax/meaningful checks pass; original checks unchanged in purpose.",
    "Complete visible redesign covers main screens and consistent other screens, no serif or pastels, functioning header/search/subcategory/carousel/filter drawer/dropdowns.",
    "Wishlist guest gate -> email/mock provider confirm -> unique save -> wishlist page -> remove/reload; login/register no password.",
    "Unified cart actual delivery/collection/invalid fields/stock block/reorder, summary ordering and mobile fixed action, preserved drafts.",
    "Updated accurate docs and deviations journal; no outside scope mutations."
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
        "prototype/storefront.mjs"
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
  "blocker_policy": "Record evidence and proposed adjustment, report to orchestrator, continue independent in-scope work. Do not weaken requirements or hide failures."
}
```
Record unexpected findings and deviations in docs/ai/tasks/bike-store-redesign/deviations.md, including evidence,
actions and unresolved issues. Write "No deviations" if none occurred.
Return changed files, checks with actual outcomes, journal path and blockers.
Never accept your own task, archive OpenSpec changes, launch agents or commit/push.
