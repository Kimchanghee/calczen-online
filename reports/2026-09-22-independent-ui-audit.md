# Independent local UI audit, 2026-09-22

Base: 5419ef0. Local only; no push or deployment. Environment file values were not inspected.

## Observed and fixed
- Loan: empty principal preserved the previous monthly payment, interest, total and table. Invalid inputs now show a Korean alert and hide obsolete results; valid inputs restore results.
- BMI: zero height preserved the previous BMI and nutrition values. Invalid/empty height, weight or age now shows an alert and hides result panels; valid inputs restore results.
- 390px loan table wrapped monetary amounts into several lines. Values now stay intact within a horizontally scrollable region, with Korean guidance and keyboard focus.
- Detail introduction touched the calculator panel; section utility spacing/leading classes used in the markup were absent from the static CSS. Restored spacing without changing copy.

## Verification
- Direct TypeScript typecheck passed.
- Direct Astro build passed: 35 pages, including all 27 calculator routes.
- Arithmetic smoke passed: 27 calculators (4 dedicated + 23 shared). Seven legacy quarantine checks passed.
- Actual built dist served locally over HTTP and rendered with installed Chrome through Playwright, viewports 1440x900 and 390x900, DPR 1. Browser accessibility snapshots read before interaction.
- Home, search matches, search empty, keyboard focus, loan default/changed/empty/table, capital-gains-tax long detail, BMI default/invalid/recovered, unknown 404 were rendered at both widths.
- Every captured state: innerWidth = visualViewport.width = document scrollWidth = body scrollWidth = 1440 or 390; no page errors.
- Regression assertions passed for stale-result hiding and valid-input recovery in loan and BMI.
- Homepage indexable. Inspected calculator and 404 pages retained noindex/nofollow/noarchive.
- Unknown path returned HTTP 404 with the built 404 page under the audit server.

## Evidence and limitations
Evidence directory: C:\Users\HOME\.aside\u\0\sessions\2026-09-22_oHm4n90dSQeoYOji\tmp

Screenshots: calczen-1440-home.png, calczen-390-home.png, calczen-390-empty.png, calczen-390-focus.png, calczen-1440-loan-table.png, calczen-390-loan-table.png, calczen-390-loan-empty.png, calczen-1440-capital-gains-tax.png, calczen-390-capital-gains-tax.png, calczen-390-bmi-invalid.png, calczen-390-bmi-recovered.png, calczen-390-404.png. Structured results: calczen-audit.json. Harness: calczen-audit.cjs.

Persistent preview processes were unavailable through the task shell, so a short-lived read-only static HTTP server and Chrome ran in the same process lifetime. Its missing-path handler explicitly serves dist/404.html with status 404. This establishes local static render/404-content correctness, not production hosting fallback semantics. No deployed checks or production readiness claim. npm wrappers failed on this machine; direct node entrypoints completed successfully. Existing formulas, routes and notices remain unchanged. Full business-rule validation of every calculator is outside this UI follow-up.
