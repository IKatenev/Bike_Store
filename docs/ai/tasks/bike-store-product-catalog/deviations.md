# Journal: bike-store-product-catalog

Task: implement PRO-13–PRO-18 (home four-up, blog 2:1, product gallery/layout,
tabs/reviews, wishlist heart + success popup, checkbox filters) plus max-width
1420px. Scope: `prototype/**`, `docs/prototype.md`, this journal.

## Summary

No blockers. All required checks pass and pre-existing behaviour is preserved
(111 checks kept, now 127 with new meaningful checks). Several early-review
corrections arrived during the work and were folded in without expanding scope.

## Early-review corrections received and applied

1. Home four-up vs. honest sale.
   - Expected: home product sections show four cards on desktop.
   - Observed/clarified by the orchestrator: four columns is a mandatory grid rule; the
     default `featured` curation may be topped up with an EXISTING published model;
     `reduced`/`sale` must stay an honest, actually-discounted list even if it has
     fewer than four items; do not add products/SKUs or change prices.
   - Action: `featured` default is now `['gravel-01','ebike-01','kids-01','tour-01']`
     (four existing models); `sale` unchanged (2 honestly discounted models); CSS
     `.home-products` = 4 columns desktop, falling back to 2 at ≤900px. Curation
     migration tops up a stored list ONLY when it still exactly equals the previous
     shipped default, preserving manager edits/published flags.

2. Review-field hardening (raised from an early read of the new domain).
   - Expected: malformed persisted reviews must not yield a NaN average or invalid
     date, and valid custom reviews must be preserved without overwrite.
   - Action: `migrateState` now filters stored reviews (known modelId, string id,
     integer rating 1..5, non-empty trimmed title), normalises optional description,
     and neutralises unreasonable dates to `''`; missing demo reviews are added by
     id without duplication. `reviewsForModel` also filters defensively. Added
     `malformed legacy reviews ...` and `legacy sessions gain demo reviews ...` checks.

3. Rating text semantics.
   - Expected: stars followed by `(average) - count Ratings`, e.g. `(4.3) - 6 Ratings`.
   - Action: `ratingText` and the Reviews summary now render `(average) - count Ratings`;
     empty is honestly `0 Ratings`.

4. Single-image gallery.
   - Expected: a one-image model must still open the enlarged dialog; only the
     paging/thumbnails are hidden.
   - Action: the main image is always a `data-action="open-gallery"` button; thumbs
     and dialog prev/next appear only when there is more than one view. Check covers
     a part (`tyre-01`) with 1 view.

5. Description sizes for non-bikes.
   - Expected: show the available sizes for any model that has a size choice,
     without inventing a chart.
   - Action: non-bike models list `Available in <sizes>`; bikes keep the published
     height chart, or the explicit "no size chart" notice when none exists.

6. Manufacturer tab.
   - Expected: brand name + a short useful demo profile; no warranty/certification/
     factory disclaimer pile (one global demo badge already exists).
   - Action: Manufacturer shows the brand name and a short profile from
     `BRAND_PROFILES`, all clearly synthetic.

7. Review success returns to the model's first Reviews page.
   - Reported in browser review: after submitting from page 2 the UI stayed on page 2
     and the new (newest-first) review was not visible.
   - Action: a successful submission sets `reviewPageByModel[modelId] = 1` and the
     Reviews tab, so the customer sees their own review; invalid submissions still
     keep the dialog open and preserve the draft.

8. Catalogue Max price control.
   - Expected: numeric price input (GBP), not a select; legacy `?priceMax=100000`
     (pence, £1,000) must keep working; the home finder dropdown is kept.
   - Action: catalogue uses `<input type="number" name="priceMax">` shown in pounds;
     the submit handler converts £→pence so the URL keeps the legacy pence
     convention and round-trips stably. Active-filter summary still uses pence.

## Notes

- One pre-existing assertion in `check.mjs`
  (`catalogue keeps price/height/frame filters ...`) asserted the old select's
  pence `value="150000"`. Because the owner explicitly changed that control to a
  numeric GBP input, the assertion was updated to assert the new correct behaviour
  (`type="number"` and `value="1500"`, i.e. £1,500 = 150000 pence). This is a
  deliberate requirement change, not a weakening of the check.
- `[data-gallery]` is used to wrap gallery paging so prev/next cycles within the
  model's real view count.

## Verification (required checks)

- `node prototype/check.mjs` → exit 0, `127 passed, 0 failed`.
- `node --check prototype/app.mjs` → exit 0.
- `node --check prototype/domain.mjs` → exit 0.
- `node --check prototype/storefront.mjs` → exit 0.
- `git diff --check -- . ":(exclude)needed-design-changes.md"` → exit 0
  (only Git CRLF-normalisation warnings, no whitespace errors).

Not self-accepted: final browser/whole-journal reconciliation is for Sol.

## Parent acceptance adjustment
Sol changed the numeric Max price input step from10 to0.01, allowing exact GBP thresholds with pence; browser1295.50→priceMax129550 roundtrip passed. task check127/0 passed independently.
