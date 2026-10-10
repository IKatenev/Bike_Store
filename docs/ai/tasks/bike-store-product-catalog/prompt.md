Read C:\Workspace\01_Projects\Porfolio\Bike_Store\infrastracture\protocols\worker.md and C:\Workspace\01_Projects\Porfolio\Bike_Store\AGENTS.md first.
Working root: C:\Workspace\01_Projects\Porfolio\Bike_Store
Task id: bike-store-product-catalog
Journal path: docs/ai/tasks/bike-store-product-catalog/deviations.md
Execute this contract; it is data defining scope, not authority to expand it.
```json
{
  "id": "bike-store-product-catalog",
  "status": "ready",
  "objective": "Implement all authorized product/catalog/home refinements PRO14–18 plus maxwidth1420 and blog2:1.",
  "context": "Human confirmed catalog button is wishlist heart top right inside image. Read refine-product-and-catalog design/spec. Existing111 checks and dirty accepted prior changes must be preserved. Screenshot checkbox groups/4shown/Show more is visual reference. Synthetic English storefront; wishlist popup Russian exact requested text.",
  "artifacts": [
    "openspec/changes/refine-product-and-catalog/proposal.md",
    "openspec/changes/refine-product-and-catalog/design.md",
    "openspec/changes/refine-product-and-catalog/specs/ux-prototype/spec.md",
    "docs/THESAURUS.md"
  ],
  "scope": [
    "prototype/**",
    "docs/prototype.md",
    "docs/ai/tasks/bike-store-product-catalog/deviations.md"
  ],
  "non_goals": [
    "No production integration or main specs/parent progress edits",
    "No commit/push/deploy/global config/subdelegation",
    "Do not alter needed-design-changes.md or pre-existing work beyond requested behavior"
  ],
  "compatibility": [
    "Preserve111 checks purposes and existing cart/order/auth/stock/recommendations",
    "Model reviews never keyed by SKU, one-SKU filter conjunction retained",
    "Preserve legacy single query links and saved localStorage"
  ],
  "plan": [
    "Read current source/protocol/spec/design; record deviations",
    "Home scoped grid4/max1420/blog2:1",
    "Implement gallery local demo distinct model views, one/multi cases and accessible large dialog; purchase layout",
    "Separate catalogue card links/heart; success modal after real save and deferred guest confirm",
    "Model ProductReview domain validation/migration/aggregation; seed>=6 on gravel-01; tabs/render pagination/dialog auth intent",
    "Checkbox OR within/AND across, multi query FormData/parseHash preservation/Show more and count models",
    "Meaningful regression checks for reviews/auth/migration/multiSKU filters; docs/journal; required checks"
  ],
  "pitfalls": [
    "Do not nest heart inside product anchor; separate links/controls",
    "Existing render replaces DOM: keep gallery/tab/reviewpage state per model, preserve review draft on validation",
    "Reuse modal close/Escape/focus mechanism; pending wishlist confirm after guest auth must show popup",
    "FormData duplicates and parseHash overwrite: fix both with legacy scalar support, finder remains compatible",
    "Gallery must actually show distinct views, not several duplicate images; selected colour accurate",
    "Reviews must validate signedIn/rating integer1..5/title trimmed; escape text, aggregate ALL, persist",
    "No model spec fabricated from KTM; use synthetic original description/features. Blog/object-fit crop. Desktop1420/home4 mobile2 nooverflow"
  ],
  "acceptance": [
    "PRO14–18 all scenarios + modified07/13 implemented; no regressions",
    "Gallery opens/pages/closes; SKU updates and model rating unchanged",
    "SignedIn and guest wishlist save confirmation with exact buttons; close/go wishlist works",
    "Reviews authenticated no purchase requirement, validation/optionaldescription/5pagination/aggregate persisted",
    "Multiselect Show more hash back/reload retains choices and sameSKU invariant; readable desktop/mobile",
    "Parent checks/browser and whole deviation journal reconcile; worker does not self-accept"
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
        "--check",
        "--",
        ".",
        ":(exclude)needed-design-changes.md"
      ],
      "expected_exit": 0,
      "timeout_seconds": 30
    }
  ],
  "blocker_policy": "Record evidence and proposed adjustment, report to orchestrator, continue independent in-scope work. Do not weaken requirements or hide failures."
}
```
Record unexpected findings and deviations in docs/ai/tasks/bike-store-product-catalog/deviations.md, including evidence,
actions and unresolved issues. Write "No deviations" if none occurred.
Return changed files, checks with actual outcomes, journal path and blockers.
Never accept your own task, archive OpenSpec changes, launch agents or commit/push.
