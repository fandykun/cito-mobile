# Product Requirements Document: Vet Clinic Management System

## 1. Overview

### 1.1 Purpose
A mobile-first internal system for a single-owner veterinary clinic to manage inventory, record detailed and secure pet medical history, process fast retail transactions, and monitor financial performance — with a specific focus on distinguishing clinic income from personal (owner's draw) income. The production mobile app remains the offline-capable operational client. A later authenticated desktop web companion provides large-screen review and analysis without replacing the mobile workflows.

### 1.2 Background
The clinic currently operates with mixed personal/business finances and no digital system for tracking inventory, patient history, retail sales, or profitability. Bookings are handled externally via WhatsApp. The owner needs visibility into how much the clinic actually earns versus what can safely be withdrawn as personal income each month, along with a reliable, secure medical record system and a quick way to handle over-the-counter medicine/food sales with a shareable receipt.

### 1.3 Goals
- Track inventory (medical and retail stock) with cost and selling prices
- Record patient (pet) visits with detailed, secure medical history, diagnoses, and treatments
- Provide fast retail transactions for medicine & food sales with automatic PDF receipt generation
- Automatically calculate income, cost, and profit per visit and per retail transaction
- Roll up visit and retail data into daily and monthly financial views
- Clearly separate clinic-retained funds from owner's draw (personal income)
- Work offline, syncing when connectivity returns
- Require login before any data (stock, financials, patient records) is accessible, protecting sensitive clinic and financial information
- Provide an authenticated desktop web companion for large-screen financial review, inventory alerts, and patient-history lookup after the mobile MVP is production-ready

### 1.4 Non-Goals (Out of Scope for MVP)
- In-app appointment booking (booking remains on WhatsApp for MVP)
- Multi-user roles/permissions (single user: owner/vet)
- Multi-branch/franchise support
- Staff scheduling, shift management, or commission tracking
- Insurance/claims processing
- Public customer/pet-owner portal, self-service account creation, and public access to clinic data

### 1.5 Target Platforms
- **Primary operational client (MVP):** native mobile app for Android and iOS, with encrypted offline storage and sync-on-reconnect.
- **Web companion (post-MVP):** authenticated desktop-first browser application for the same clinic owner and the same backend data. Its first production release is online-only and read-only: dashboard/financial review, inventory alerts, patient lookup, and visit-history review. It must not silently claim offline capability, cache medical records in browser storage, or replace the mobile app's offline visit, checkout, receipt, expense, draw, or stock-mutation workflows.

The web companion is a separate production client, not a conversion of the existing `prototype/web` Figma export. A dedicated prototype may be created under `prototype/web-console`; production code will live under `apps/web` only after its security and acceptance gates are defined.

Business dates use a configurable IANA clinic timezone, defaulting to `Asia/Jakarta`. This timezone governs inventory expiry alerts and future daily/monthly financial boundaries.

### 1.6 User & Access
Single user: the clinic owner/vet. No role-based access control needed for MVP.

**Login is required** despite being single-user, because the app holds sensitive clinic data (stock/inventory, financial records including income, expenses, and owner's draw, and patient medical records). The account is **provisioned manually** (e.g., by the developer/admin at setup time) — there is **no in-app self-registration or sign-up flow**. Login simply gates access to the app's data; it does not introduce roles, permissions, or multi-user scoping.

---

## 2. User Stories

1. As the owner, I want to add and update inventory items (with cost price and selling price) so I know what I have in stock and what each item is worth.
2. As the owner, I want to be alerted when stock is low or an item is nearing expiry, so I can reorder in time and avoid waste.
3. As the owner, I want to create a patient record for each pet, so I can track that pet's identity and owner contact.
4. As the owner, I want to log a visit for a pet — including behavior notes, diagnosis, and medicine/treatment given — so I have a complete medical history.
5. As the owner, when I log medicine used in a visit, I want stock to auto-deduct and the visit's cost/income to auto-calculate, so I don't have to re-enter data.
6. As the owner, I want to see each visit's income, cost, and profit, so I understand which visits/services are most profitable.
7. As the owner, I want a daily summary of income and expenses (including a cash drawer reconciliation), so I know how the clinic did each day.
8. As the owner, I want a monthly financial overview showing gross income, expenses, net profit, how much I've drawn personally, and how much is retained in the clinic, so I can decide how much I can safely pay myself.
9. As the owner, I want to log an "owner's draw" as a distinct transaction type (not a generic expense), so my personal withdrawals don't distort the clinic's operating expense picture.
10. As the owner, I want the app to work without an internet connection (e.g., logging a visit, viewing inventory/patient history), syncing automatically once I'm back online.
11. As the owner, I want each pet's medical history, diagnoses, and treatments recorded in detail (not just brief notes), so I have a reliable clinical record I can reference for future visits.
12. As the owner, I want medical records stored securely (protected from unauthorized access or loss), so sensitive patient and business data is safe.
13. As the owner, I want to quickly process a retail sale of medicine or food (without needing a full visit/diagnosis record), so walk-in product purchases don't slow down the counter.
14. As the owner, I want a PDF receipt automatically generated after a retail sale, so the customer has proof of purchase (viewable, shareable, or printable later) without me writing one by hand.
15. As the owner, I want to update or correct a pet's profile or past visit record, so I can fix mistakes or add follow-up information without creating a duplicate record.
16. As the owner, I want to log in before accessing the app, so my stock, financial, and patient data stay private if my device is lost or someone else picks it up.
17. As the owner, I want to stay logged in for a configurable period (e.g., 1–3 days) instead of logging in every time I open the app, so daily use stays convenient without sacrificing security.
18. As the owner, I want to review financial performance, inventory alerts, and patient history on a larger desktop screen, so I can audit and plan without using the phone for every read-only task.

---

## 3. Feature Specifications

### 3.1 Authentication & Login
- **Login required at app launch** — no access to any screen (inventory, patient records, financials) without authenticating first
- **Username and password only** — the current product has no PIN or biometric authentication/re-lock flow
- **Single account, manually provisioned** — the owner's login credentials are set up manually (e.g., by the developer/admin during initial setup); there is **no self-registration, sign-up, or "create account" flow** in the app
- **No roles/scopes** — login exists purely as an access gate, not for permission differentiation, since there's only one user
- **Session handling**: once logged in with username and password, the session persists for a **configurable duration** (default suggestion: 1–3 days) so the owner isn't forced to log in every time the app opens; after the session expires, a fresh username/password login is required. Duration is adjustable (e.g., in app settings) rather than hardcoded.
- **Password/credential recovery**: since there's no self-registration, recovery is also a manual/admin-assisted process (e.g., resetting credentials directly in the backend) rather than an automated "forgot password" email flow — acceptable given single-user scale

### 3.2 Inventory Management
- **Item fields**: name, category (Medical / Retail), unit, cost price, selling price, current stock quantity, low-stock threshold, expiry date (optional, required for medical items)
- **Alerts**: low-stock alert (below threshold), expiry alert with a configurable 1–365 day window that defaults to 30 days; the expiry alert includes already-expired items
- **Stock adjustment**: manual adjustment with a reason field (spoilage, correction, breakage)
- **Auto-deduction**: stock automatically decreases when an item is used in a visit
- **Supplier info** (optional, lightweight): name and contact per item, no formal PO workflow needed for MVP

### 3.3 Patient (Pet) Records
- **Pet profile**: name, species, breed, date of birth or age, weight (with history log), owner name & contact
- **Health flags**: allergies, chronic conditions — shown prominently on the record
- **Visit history**: chronological list of all past visits for that pet
- **Vaccination tracking**: vaccine type, date given, next due date (with reminder)
- **Editable records**: owner can update/edit a pet's profile (e.g., correct weight, update allergy/chronic condition info, fix a typo in breed/name) and edit past visit records (e.g., amend a diagnosis or add follow-up notes) after initial save
  - Edits are timestamped (edited_at) so there's a record of when a change was made, distinct from the original creation date — important given these are medical records
  - Since there's only one user, no approval workflow is needed; edits save directly

### 3.4 Detailed Medical History, Diagnoses & Treatments
- **Structured medical record per visit**, going beyond brief notes:
  - Presenting complaint / reason for visit
  - Clinical observations (vitals, physical exam findings, behavior/temperament)
  - Diagnosis (primary and any secondary/differential notes)
  - Treatment plan (medication, dosage, procedure performed, follow-up instructions)
  - Vet's clinical notes (free text for anything not captured in structured fields)
- **Full historical timeline** per pet — every past diagnosis and treatment viewable in one place, so recurring or chronic issues are easy to track over time
- **Security**:
  - Data encrypted at rest and in transit
  - Username/password app login (see 3.1) is the access gate, given the app holds sensitive patient and business data
  - Local (offline) data on-device is protected the same way — not stored in plain text
  - Regular backup/sync to the secured backend so records aren't lost if the device is lost or damaged

### 3.5 Visit Logging (Medical)
- **Visit fields**: date, pet (linked), reason for visit, structured clinical record (per 3.3), medicine/treatment given
- **Medicine/items used**: select from inventory; each selection auto-pulls cost price and selling price, and deducts stock
- **Service fees**: consultation fee, procedure fee (manually entered or from a configurable price list)

### 3.6 Retail Transactions (Medicine & Food Sales)
- **Purpose**: handle quick, walk-in retail sales (e.g., a customer buying pet food or over-the-counter medicine) without going through a full medical visit/diagnosis flow
- **Fast checkout flow**:
  - Search/select item(s) from inventory (retail category, and medical items sellable OTC)
  - Quantity and price auto-populate from inventory (selling price)
  - Multiple items per transaction, running total calculated live
  - Payment method selection (cash, QRIS, transfer, card)
- **Automatic PDF receipt generation**:
  - A PDF receipt is automatically generated immediately after payment is confirmed — no physical printer required for MVP
  - Receipt includes: clinic name, date/time, itemized list, quantities, prices, total, payment method
  - Receipt can be viewed, saved, or shared directly from the app (e.g., via WhatsApp) so the customer gets proof of purchase without needing a physical printer
  - Physical/thermal printer support can be added later as a post-MVP enhancement if needed
- **Stock deduction**: retail sale automatically deducts sold quantity from inventory, same as a medical visit would
- **Speed target**: a retail transaction (item selection → payment → PDF receipt generated) should take well under a minute, since this is meant to be a fast counter transaction, not a full patient workflow

### 3.7 Per-Visit / Per-Transaction Financials
- **Visit income** = sum of (selling price × quantity) for all medicines/items used in a medical visit + service/procedure fees
- **Visit cost** = sum of (cost price × quantity) for all medicines/items used
- **Visit profit** = visit income − visit cost
- **Retail transaction income** = sum of (selling price × quantity) for items sold
- **Retail transaction cost** = sum of (cost price × quantity) for items sold
- **Retail transaction profit** = retail income − retail cost
- Both visit and retail transaction profit are displayed on their respective records and rolled into the daily financial summary automatically

### 3.8 Daily Income & Expense
- **Auto-populated income**: sum of all medical visit incomes + all retail transaction incomes for the day
- **Manual expense entry**: category (restock, utilities, rent, equipment, misc), amount, note
- **Payment method breakdown**: cash, QRIS, transfer, card
- **Payment attribution source of truth**: every medical visit payment, retail sale, operating expense, and owner's draw records exactly one payment method (cash, QRIS, transfer, or card). Legacy records whose method is unknown remain explicitly unattributed and must not be assumed to be cash.
- **Daily payment breakdown**: show medical income, retail income, operating expenses, and owner's draw separately for each payment method. Include legacy unknown amounts in overall accounting totals but never in a known-method bucket. Explicitly report whether attribution is complete, including zero-amount legacy records, so partial cash totals cannot be mistaken for a fully reconciled drawer.
- **Cash drawer reconciliation**: opening balance, calculated expected closing balance, actual closing balance, variance
  - Expected closing cash = opening cash + cash medical income + cash retail income − cash operating expenses − cash owner's draw. QRIS, transfer, and card payments never affect drawer cash.
  - A read-only preview may use operator-entered opening and counted balances without saving a drawer close. Variance = actual closing − expected closing; positive means over, negative means short.
  - Any unattributed source record blocks an authoritative preview, including zero-value legacy records: expected cash and variance remain unavailable until attribution is resolved.
  - A negative calculated closing balance is an explicit inconsistent-cash state, not zero or a successful reconciliation. Expose the negative projection for diagnosis but withhold variance. Do not persist it into the nonnegative reconciliation schema.
  - Preview is based on currently recorded server data, not proof that every offline transaction has synced. Final persisted reconciliation and offline client integration remain separate delivery gates.
- **Daily summary view**: total income (split: medical vs. retail), total expenses, net for the day

### 3.9 Monthly Financial Overview
- **Gross income**: sum of all daily incomes for the month (medical + retail)
- **Operating expenses**: sum of all logged expenses for the month, broken down by category
- **Net profit** = gross income − operating expenses
- **Owner's draw**: a distinct transaction type for personal withdrawals, logged separately from operating expenses
- **Retained in clinic** = net profit − total owner's draw for the month
- **Month-over-month comparison**: table/chart of gross income, expenses, net profit, draw, retained — across months, to spot trends
- **Income breakdown**: medical services vs. retail sales, to see which side of the business drives more revenue

### 3.10 Offline Support
- Core actions available offline: creating/viewing visit records, viewing patient history, viewing inventory, logging expenses, processing retail transactions, generating PDF receipts
- PDF receipt generation works fully offline since it doesn't depend on a connected printer or internet — the PDF can be shared/synced once connectivity returns
- Local data storage on-device, encrypted, with automatic sync to the backend when connectivity is restored
- The mobile MVP assumes one writable mobile client, so concurrent-edit conflict resolution is not required for its initial sync implementation. The first web companion is read-only; any later web writes require an explicit multi-client conflict policy.
- **Login while offline**: since the account is manually provisioned (not tied to a live registration server check), the app should support offline login using a locally cached, securely stored session/credential — so the owner isn't locked out of their own data when there's no internet

### 3.11 Desktop Web Companion (Post-MVP)
- **Purpose:** complement the mobile app with a desktop-optimized clinic console; do not duplicate the mobile UI one-for-one.
- **Initial read-only scope:** overview dashboard, daily/monthly financial views, payment-method and reconciliation status, inventory low-stock/expiry alerts, patient search, pet profile review, and chronological visit/vaccination/weight history.
- **Explicitly excluded from the first web release:** visit creation/editing, retail checkout, receipt generation, inventory/expense/draw mutations, offline mode, background sync, and browser-persisted medical data.
- **Access:** use the same manually provisioned clinic account and existing authorization boundary. No registration, roles, public pages containing clinic data, or separate web-only account system.
- **Security:** production web pages require authentication before rendering clinic data; sensitive responses must not be written to `localStorage`, IndexedDB, service-worker caches, analytics, or client logs. Browser session and CSRF protection must be designed and reviewed before production implementation; a visual prototype must use synthetic data only.
- **Concurrency:** the first release is read-only so it cannot conflict with offline mobile writes. Any future web mutation requires an explicit multi-client conflict policy using optimistic versions/idempotency rather than relying on the current single-writer assumption.
- **Responsive target:** optimize for laptop/desktop widths first, with a usable tablet layout. Phone-sized operation remains the responsibility of the mobile app.

---

## 4. Data Entities (High-Level)

- **Pet** — id, name, species, breed, DOB/age, weight history, allergies, chronic conditions, owner_id
- **Owner** — id, name, contact info
- **InventoryItem** — id, name, category, unit, cost_price, selling_price, stock_quantity, low_stock_threshold, expiry_date
- **Visit** — id, pet_id, date, reason, clinical_observations, diagnosis, treatment_plan, vet_notes, service_fee
- **VisitItem** — id, visit_id, inventory_item_id, quantity, cost_price_at_time, selling_price_at_time
- **RetailTransaction** — id, date, total_amount, payment_method, receipt_number
- **RetailTransactionItem** — id, transaction_id, inventory_item_id, quantity, cost_price_at_time, selling_price_at_time
- **Expense** — id, date, category, amount, note
- **OwnerDraw** — id, date, amount, note
- **DailySummary** (derived/computed) — date, medical_income, retail_income, total_expense, net
- **MonthlySummary** (derived/computed) — month, gross_income, operating_expenses, net_profit, total_draw, retained

*(Full ERD and schema — including security/encryption approach for medical records — to follow as a separate architecture deliverable.)*

---

## 5. Success Criteria (MVP)

- Owner can fully log a patient visit — including detailed medical history and medicine used — in under 2–3 minutes
- Owner can complete a retail transaction, from item selection to generated PDF receipt, in under 1 minute
- Medical records are stored securely (encrypted, access-locked) with no data loss risk
- No app data (inventory, financials, patient records) is viewable without logging in first, including when offline
- Inventory stock levels stay accurate without manual recounting, due to auto-deduction from both visits and retail sales
- Owner can view an accurate monthly financial picture (medical vs. retail income, expenses, profit, draw, retained) without manual spreadsheet work
- App remains usable (core actions, including retail checkout and PDF receipt generation) with no internet connection, syncing cleanly afterward
- Web companion presents the agreed read-only desktop views from authenticated backend data without persisting medical or financial records in browser storage

---

## 6. Version History

| Version | Change |
|---|---|
| v1.0 | Initial PRD: inventory, patient records, per-visit financials, daily/monthly income & expense, owner's draw tracking. Platform: mobile-friendly web app. |
| v1.1 | Platform changed to native mobile app (Android + iOS), added offline support requirement. |
| v1.2 | Renamed to Vet Clinic Management System. Added detailed/secure medical history requirements and retail POS module with receipt printing. |
| v1.3 | Receipt method changed from physical printer to on-device PDF generation. |
| v1.4 | Confirmed React Native + Expo EAS Build as the mobile framework (cloud iOS builds, no Mac required). |
| v1.5 | Added ability to update/edit patient (pet) profiles and past visit records. |
| v1.6 | Added login requirement (single manually-provisioned account, no self-registration, no roles) to protect stock/financial/patient data. |
| v1.7 | Login sessions made persistent for a configurable duration (default ~1–3 days) instead of requiring login every app open. |
| v1.8 | Removed "Future Considerations" section; added this version history for tracking changes going forward. |
| v1.9 | Authentication limited to username and password for the current product; removed PIN and biometric re-lock requirements. |
| v2.0 | Defined the configurable clinic business timezone (`Asia/Jakarta` default) and the inventory expiry-alert window (30-day default, including expired items). |
| v2.1 | Clarified daily per-method financial breakdowns, separate owner draws, explicit legacy-unattributed totals, and completeness reporting before authoritative cash reconciliation. |
| v2.2 | Defined read-only cash-reconciliation preview, cash-only expected/variance formulas, unavailable results for incomplete attribution, and explicit negative-expected-cash handling. |
| v2.3 | Added a post-MVP authenticated, desktop-first, online-only read-only web companion; preserved mobile as the offline operational client and prohibited browser persistence of sensitive clinic data. |

**Process going forward**: new feature requests should be added directly into the relevant section of this PRD (Goals, User Stories, Feature Specifications, Data Entities) rather than creating a separate PRD document — this keeps one source of truth for the product, especially since `AGENTS.md` and the architecture doc both reference this file. Log each meaningful change as a new row above.