# Mobile / Figma alignment status

## Reference and scope

Reference: [Veterinary Clinic Management App](https://www.figma.com/design/0MHDMHs5bgTKUbtP97pmdu/Veterinary-Clinic-Management-App), its accessible version notes through **Add visit log form / Version 7**, and the checked-in `prototype/web/src/app/App.tsx` export. The exported source is the reproducible visual/interaction baseline; this review does not certify pixel parity with the live Figma canvas.

PRD and architecture remain authoritative. All work described here is in the Expo UI-first review client, not a conversion of the web prototype into production software.

## Alignment delivered

- [x] Existing full-screen inventory/patient/visit editors and explicitly illustrative QRIS payment review retained.
- [x] Inventory and patient cards expose independent pencil edit buttons without requiring expansion. Existing prefill, save, cancellation, and history behavior remains intact. Touch targets are at least 44×44px.
- [x] Dashboard shortcuts retain their bordered horizontal card styling and navigation in the exported web runtime. Expo Router `Link asChild` lost the original Pressable style callback; static styling fixes the actual rendered layout.
- [x] Finance supports daily, monthly, and six-month views. Historical local expenses/draws are applied to their matching month and included once in aggregate totals, without mutating fixtures.
- [x] Orange owner-draw planner supports 10–55%, one-percent increments, a 28% default, accessible adjustment actions and visible minus/plus controls. This is a native adaptation, not an HTML range slider.
- [x] Planner distinguishes total six-month projection from the monthly average, calculates projected retained funds after operating expenses, and never changes actual draws or creates transactions. Safe-integer boundary and overflow tests cover the calculations.

- [x] Expanded patient cards lead with health flags and visit history/actions; profile information, vaccinations, and weight histories remain available afterward. Section headings expose the same reading order to accessibility tools.

- [x] Dashboard daily income, retained funds, owner draw, and date now derive from Finance’s baseline fixtures. Retained funds include operating expenses; the unsupported trend badge is removed. A visible notice distinguishes shared baseline data from live cross-tab state.

- [x] Inventory display-category chips derive from current items (including local edits), deduplicate case-insensitively, and combine with search and Medical/Retail/low-stock filters without changing domain classification. Empty-state reset clears all filters; cancelling an edit preserves selection.

## Remaining visual / interaction differences

- [ ] Apply Manrope consistently; the mobile shell currently uses system fonts. Refine typography, corner radii, tab highlight treatment, and header spacing.
- [ ] Refine POS catalog/cart density for smaller screens while preserving accessible controls, stock limits, and honest demo notices.
- [ ] Refine finance income visualization and recent medical/retail transaction presentation. Current local activity contains session expense/draw entries, not a shared cross-module transaction history.

These are open tasks, not claims that every screen is fully synchronized.

## Intentional differences and production blockers

- Appointment scheduling remains excluded by the MVP PRD. Dashboard navigation shortcuts replace the prototype's booking section.
- Do not copy hardcoded Figma login credentials, an inert notification bell, automatic 11% tax, or owner draw as an income source.
- Owner draw is separate from operating expenses: net profit is gross income minus operating expenses, and retained funds are net profit minus actual draws. The hypothetical planner is a separate scenario, not withdrawal advice.
- Login activation remains the final integration step. No preview/production release may expose clinic data without restored authentication guards.
- Review data is synthetic/in-memory. Inventory's authenticated API-backed list is a distinct read-only path; mock editors are not production writes. Encrypted domain persistence, cross-module integration, sync, PDF receipts, and physical-device SQLCipher verification remain unfinished.
- Synthetic Finance still uses its explicitly labeled all-expenses-are-cash fixture assumption. Authenticated Finance uses authoritative payment attribution and includes only cash-attributed movements in reconciliation previews.

## Verification

Using Node 22 and npm 10.9.4:

- Mobile TypeScript and ESLint passed.
- All 114 tests across 25 mobile suites passed.
- Android JavaScript export, web export, and prototype production build passed.
- Chromium at 320×844 and 390×844 verified dashboard shortcut card geometry/navigation, collapsed inventory/patient edit and cancel, prefilled fields, edit target size, six-month totals, and planner increments/decrements. No page errors occurred; screenshots were inspected.

Patient-priority follow-up: observed the new regression test fail before implementation, then pass with the full suite. Android/web exports passed. Chromium at 320px and 390px verified heading order, visit entry/cancellation, and retained vaccination/weight data with no page errors. The 390px screenshot was inspected.

Dashboard-finance follow-up: observed the rendering regression fail before implementing. Verified 112 tests, TypeScript, ESLint, Android/web exports, and Chromium at 320px/390px. The browser confirmed baseline agreement, retained-vs-profit labels, removal of the unsupported trend, and truthful unchanged dashboard behavior after a local Finance expense. No page errors; the 320px screenshot was inspected.

Inventory-category follow-up: observed the category regression fail before implementation, then passed all 114 tests, typecheck/lint, Android/web exports. Chromium at 320px/390px verified filter intersection, empty-state reset, edited-category discovery, and a minimum 44px category touch target with no page errors. Inspected the 320px screenshot.

The browser checks exercise Expo's web export, not a physical Android device or an EAS binary. Remote GitHub Actions status requires GitHub API authentication and was not verified by this review.
