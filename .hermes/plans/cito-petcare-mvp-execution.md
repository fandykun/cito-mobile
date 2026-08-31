# Cito Petcare MVP Execution Plan

## Purpose

Convert the existing Vite/React Figma prototype into the production MVP defined by `docs/prd.md` and `docs/erd.md`: an offline-first Expo mobile app backed by a Go API and PostgreSQL.

The current web application is a design reference only. It has mock data and local UI state, but no authentication, encrypted persistence, API, PostgreSQL schema, synchronization, receipt generation, or production mobile runtime.

## Authority and constraints

Implementation must follow, in order:

1. `docs/prd.md` for product scope and acceptance criteria.
2. `docs/erd.md` for entities, flows, security layers, and stack.
3. `AGENTS.md` for implementation boundaries.

Non-negotiable constraints:

- React Native through Expo for the production client.
- Go API and PostgreSQL backend.
- Single manually provisioned user; no registration, roles, or multi-tenant scoping.
- Offline-first local writes for visits, retail transactions, expenses, and owner draws.
- Encrypted medical data locally and in backend storage.
- On-device PDF receipt generation that works offline.
- Historical price snapshots on visit and retail line items.
- No appointment calendar, staff management, multi-branch support, insurance, barcode scanning, or physical printer integration in MVP.

## Architecture decisions

These are the smallest concrete decisions consistent with the authoritative documents:

- **Repository layout:** npm workspace for JavaScript projects plus an independent Go module.
- **Mobile:** Expo + TypeScript with Expo Router; production features live under `apps/mobile`.
- **Prototype:** preserve the existing Vite app under `prototype/web`; do not incrementally turn React DOM components into React Native components.
- **API:** Go with Echo, `pgx`, explicit service/repository boundaries, and SQL migrations. Avoid an ORM that obscures transactions and price/stock invariants.
- **Database:** PostgreSQL in Docker Compose for local development; production credentials only through environment variables or a secret manager.
- **API contract:** OpenAPI document under `api/openapi.yaml`; generated or validated typed clients must not drift from handlers.
- **Local persistence:** encrypted SQLite through an Expo development build. A Phase 1 spike must prove the selected native SQLite/SQLCipher adapter works with the current Expo/EAS toolchain before domain implementation.
- **Money:** use integer IDR values in TypeScript and explicit fixed-precision PostgreSQL numeric columns; never use floating-point arithmetic for persisted money.
- **Identifiers and time:** UUIDs generated on-device for offline records; UTC timestamps in storage and explicit clinic timezone for display/day boundaries.
- **Sensitive medical fields:** local SQLCipher plus application-level authenticated encryption for clinical observations, diagnosis, treatment plan, and vet notes before PostgreSQL persistence. Encryption keys must not be stored in the database or committed to Git.
- **Authentication:** Argon2id password hashes, short-lived access JWT, refresh/session rotation, secure device storage, and configurable 24–72 hour session duration. Offline access uses a previously established encrypted local session; first login requires the API.
- **Sync:** durable outbox records in the same local transaction as each domain write. Push operations are idempotent by UUID/idempotency key. Server acknowledgements mark outbox entries complete; retries use bounded exponential backoff.
- **Derived finance:** daily and monthly summaries are computed from source transactions, not editable user records.

## Target repository layout

```text
.
├── AGENTS.md
├── README.md
├── api/
│   └── openapi.yaml
├── apps/
│   └── mobile/
│       ├── app/
│       ├── src/
│       │   ├── db/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── inventory/
│       │   │   ├── patients/
│       │   │   ├── visits/
│       │   │   ├── pos/
│       │   │   ├── finance/
│       │   │   └── sync/
│       │   └── shared/
│       └── package.json
├── services/
│   └── api/
│       ├── cmd/api/
│       ├── internal/
│       │   ├── auth/
│       │   ├── inventory/
│       │   ├── patients/
│       │   ├── visits/
│       │   ├── pos/
│       │   ├── finance/
│       │   ├── sync/
│       │   └── platform/
│       ├── migrations/
│       └── go.mod
├── prototype/
│   └── web/
├── infra/
│   └── compose.yaml
└── docs/
```

## Delivery rules

- Execute one coherent, independently revertible slice at a time.
- Add or observe a failing test before behavior changes when practical.
- Run the narrowest meaningful tests before every commit.
- Commit and push each verified slice immediately.
- Never mark a phase complete based only on scaffolding or mocked success.
- No production feature may read mock constants from the prototype.
- Do not log credentials, tokens, encryption keys, diagnoses, treatment notes, or other sensitive medical content.

## Phase 0 — Align and preserve the prototype

**Status: Complete.** The prototype now lives at `prototype/web`; root npm workspace commands build and run it. Verified with a clean `npm ci`, `npm run prototype:build`, direct workspace build, `npm audit --audit-level=high`, and an HTTP `200 text/html` smoke test from the root development command.

### Work

1. Move the current Vite project into `prototype/web` without changing behavior.
2. Add root workspace metadata and commands that clearly distinguish prototype and production projects.
3. Rewrite `README.md` with repository purpose, prerequisites, and exact commands.
4. Keep the prototype independently runnable as a visual reference.

### Verification

```bash
npm ci
npm run prototype:build
npm run prototype:dev -- --host 127.0.0.1
curl -f http://127.0.0.1:<prototype-port>/
git status --short
```

### Exit criteria

- Prototype renders exactly as before.
- Root structure is ready for Expo and Go projects.
- No production code has been added to the prototype.

### Commit boundary

`chore(repo): separate figma prototype from production workspace`

## Phase 1 — Prove the production foundations

### Slice 1.1: Expo shell — complete

- Created `apps/mobile` with strict TypeScript, Expo Router, linting, Jest tests, and validated public environment configuration.
- Recreated only the prototype's shell/navigation boundaries and design tokens; no mock clinic records or production domain behavior were copied.
- Added a safe diagnostics screen containing app version, Expo SDK, environment name, and configured API URL only.
- Added root mobile scripts and aligned the workspace on React 19 so Expo resolves a single React runtime.

Verification completed from a clean npm install:

```bash
npm ci
npm run mobile:typecheck
npm run mobile:lint
npm run mobile:test
npm run mobile:export:android
cd apps/mobile && npx expo install --check
cd apps/mobile && npx expo-doctor
npm run prototype:build
npm audit --audit-level=high
```

Results: all dependency checks passed, all 10 mobile tests passed, Android export completed, the reference prototype still built, and the audit reported no high-severity vulnerabilities.

Commit: `feat(mobile): scaffold expo application shell`

### Slice 1.2: encrypted local database spike — native validation pending

Completed foundations:

- Selected first-party Expo SQLite with SQLCipher and recorded the decision in `docs/architecture-decisions/0001-encrypted-local-database.md`.
- Installed `expo-sqlite` and `expo-dev-client`, enabled `useSQLCipher`, and added EAS development/preview/production profiles.
- Added a typed proof harness covering key-first open, SQLCipher detection, migration, encrypted restart markers, wrong-key rejection, and exclusive domain/outbox rollback.
- Added a native-only verification screen that keeps its temporary operator-entered key in memory and exposes no native error details.
- Reverified against Expo SDK `57.0.18` that clean Android CNG emits `expo.sqlite.useSQLCipher=true`; all 21 Expo Doctor checks, strict TypeScript, ESLint, the current mobile test suite, Android JavaScript export, and the prototype build pass.

Remaining native gates:

- Build and install the Android development client.
- Run initialization, force-close/relaunch, correct-key reopen, wrong-key rejection, and rollback checks against the real SQLCipher binary.

Current state: the Expo project is linked, and both Android development and self-contained preview builds previously finished successfully from commit `2381ad8`. The APKs and four-ABI native libraries were inspected and contain the expected SQLCipher symbols. The UI-first feature tracks are now complete, so physical-device execution is the next production-integration gate. This host has neither Java nor an Android SDK, and its EAS CLI session is currently unauthenticated; a new installable build therefore requires private Expo reauthentication before the device sequence can run. Slice 1.2 remains open, and mobile domain persistence remains blocked until the device results are recorded.

Verification gates:

- Correct key opens the database after process restart.
- Wrong key fails without exposing data.
- A rolled-back transaction leaves no domain or outbox row.
- Android development build completes through the selected local/EAS path.

Commit: `spike(mobile): validate encrypted sqlite runtime`

### Slice 1.3: Go API and PostgreSQL — complete

Completed:

- Added `services/api` with validated configuration, structured JSON logging, request IDs, sanitized error responses, graceful shutdown, and `/health/live` plus PostgreSQL-backed `/health/ready`.
- Added localhost-only PostgreSQL 16.10 Compose runtime with a health check and persistent named volume.
- Added embedded checksummed migration tooling with a PostgreSQL advisory lock and idempotent empty-schema integration test.
- Verified PostgreSQL health/readiness, migration execution, migration idempotency, `go test ./...`, `go vet ./...`, both HTTP health endpoints, request-ID propagation, and graceful shutdown.

Verification:

```bash
docker compose -f infra/compose.yaml up -d --wait postgres
cd services/api && go test ./...
cd services/api && go vet ./...
curl -f http://127.0.0.1:<api-port>/health/live
curl -f http://127.0.0.1:<api-port>/health/ready
```

Commit: `feat(api): scaffold go service and postgres runtime`

### Slice 1.4: continuous integration — complete

Completed:

- Added GitHub Actions jobs for the npm workspaces and Go API, triggered for pull requests and pushes to `main`.
- The JavaScript job performs a clean install, mobile type-check/lint/tests, Android export, prototype build, and a high-severity production dependency audit.
- The API job uses PostgreSQL 16.10 and runs formatting verification, race-enabled tests (including migration integration tests), `go vet`, and command builds.
- Applied least-privilege repository permissions, explicit job timeouts, dependency caching, and cancellation of superseded runs.

Verification:

```bash
npm ci
npm run mobile:typecheck
npm run mobile:lint
npm run mobile:test
npm run mobile:export:android
npm run prototype:build
npm audit --omit=dev --audit-level=high
cd services/api && TEST_DATABASE_URL=<local-test-database-url> go test -race ./...
cd services/api && go vet ./...
cd services/api && go build ./...
```

Commit: `ci: validate mobile prototype api and migrations`

### Phase 1 exit criteria

- Expo production shell builds.
- Encrypted local storage is proven on the target Android toolchain.
- API and PostgreSQL start from documented commands.
- CI runs mobile and API checks from a clean checkout.

## Phase 2 — Schema, encryption, and API contract

Backend schema assumptions are documented in `docs/architecture-decisions/0002-postgresql-domain-schema.md`: client-generated UUIDs, integer IDR amounts, optimistic versions, tombstone deletion, restrictive foreign keys, encrypted medical column types, pet weight history, supplier fields, and audited stock adjustments. This backend-only decision does not unblock mobile domain persistence while ADR 0001's physical SQLCipher gates remain pending.

Backend medical encryption is defined by `docs/architecture-decisions/0003-medical-field-encryption.md`: AES-256-GCM, fresh nonces, versioned envelopes, record-and-field-bound associated data, strict size limits, typed non-sensitive errors, and multi-key rotation.

### Slice 2.1: core clinic schema and constraints — complete

Completed:

- Added the PostgreSQL source schema for owners, pets, weight history, vaccinations, inventory, audited stock adjustments, visits, retail transactions, expenses, owner draws, and daily cash reconciliation.
- Added UUID primary keys, restrictive foreign keys, optimistic versions, tombstone metadata, integer-IDR amount columns, domain category checks, non-negative stock/amount checks, receipt uniqueness, and query indexes.
- Stored sensitive pet and visit fields, including the presenting reason, as `BYTEA` so no lasting plaintext medical schema exists.
- Added retail cost/profit columns and database-generated visit/retail profits so persisted profitability cannot drift from income and cost values.
- Prevented duplicate active inventory lines within a visit or retail transaction while allowing historical tombstoned lines to remain available for sync.
- Kept daily and monthly financial summaries out of source tables; they remain deterministic projections for the finance phase.
- Added integration coverage for empty-schema idempotency, foreign-key/check/unique constraints, encrypted column types, immutable price snapshots after inventory price changes, and transactional stock rollback.

Verification:

```bash
cd services/api
TEST_DATABASE_URL=<local-test-database-url> go test -race ./internal/migrations -count=1
TEST_DATABASE_URL=<local-test-database-url> go test -race ./...
go vet ./...
go build ./...
```

Commit: `feat(db): add core clinic schema and constraints`

### Slice 2.2: authenticated medical-field encryption — complete

Completed:

- Added a backend AES-256-GCM service for all authoritative sensitive pet and visit fields.
- Added strict versioned JSON envelopes containing only non-secret key ID, nonce, and ciphertext metadata.
- Bound authentication to envelope version, key ID, entity, canonical record UUID, and field name so moved ciphertext fails explicitly.
- Added bounded plaintext/envelope sizes, strict UUID/entity/field validation, strict base64 and JSON parsing, fresh random nonces, and typed non-sensitive errors.
- Added a multi-key keyring parser and active-key selection so new writes can rotate while old envelopes remain decryptable.
- Added a PostgreSQL integration test proving persisted visit reason and diagnosis values do not contain searchable plaintext and still decrypt correctly.
- Kept encryption construction independent from domain HTTP handlers; repository wiring will occur when the corresponding authenticated APIs are implemented.

Verification:

```bash
cd services/api
go test -race ./internal/medicalcrypto -count=1
go test -race ./... -count=1
go vet ./...
go build ./...
```

Commit: `feat(security): encrypt sensitive medical fields`

### Slice 2.3: OpenAPI contract and validation — complete

Completed:

- Added an OpenAPI 3.1 contract for implemented health probes and planned authentication, synchronization, inventory, owner, pet, weight, vaccination, visit, retail, expense, owner-draw, cash-reconciliation, and financial-summary resources.
- Required bearer authentication for all clinic-data operations while explicitly leaving health, login, and refresh public; no registration or sign-up route exists.
- Defined client UUIDs, idempotency headers, optimistic versions, opaque checkpoints, bounded batches/pages, whole-IDR money values, medical payload limits, price snapshots, generated financial results, and sanitized error responses.
- Kept PDF receipt generation device-local while representing only portable transaction metadata in the backend contract.
- Added a pinned Redocly validator, root `api:lint` command, and mandatory CI contract-validation step.

Verification:

```bash
npm run api:lint
npx redocly bundle cito@v1 --config redocly.yaml --output /tmp/cito-openapi.json
npm ci
```

Commit: `feat(api): define and validate openapi contract`

### Work

1. Translate the ERD into reviewed PostgreSQL migrations without renaming authoritative fields casually.
2. Add missing operational metadata required for safe sync: UUID, `created_at`, `updated_at`, idempotency/version information, and deletion/tombstone policy. Any ERD extension must be documented before migration.
3. Define `api/openapi.yaml` for auth and sync/domain resources.
4. Implement application-level encryption for sensitive visit fields with versioned ciphertext envelopes and associated data bound to record/field IDs.
5. Add test fixtures with synthetic data only.

### Required tests

- Migration up/down or forward-only migration verification on an empty database.
- Unique, foreign-key, non-negative stock, and amount constraints.
- Transactional stock deduction and rollback.
- Price snapshot immutability after inventory price changes.
- Sensitive fields are not searchable/readable as plaintext in PostgreSQL.
- Ciphertext tampering and wrong-key operations fail explicitly.
- API contract validation in CI.

### Commit boundaries

1. `feat(db): add core clinic schema and constraints`
2. `feat(security): encrypt sensitive medical fields`
3. `feat(api): define and validate openapi contract`

## Phase 3 — Single-account authentication foundations

**Production access model:** Authentication remains a required MVP security boundary. The app has exactly one manually provisioned owner/vet account authenticated only by username and password. There is no PIN, biometric authentication/re-lock, in-app registration, sign-up, account creation, roles, permissions, or multi-user scoping. The backend authentication boundary and mobile session implementation are preserved, but mobile login activation is intentionally deferred until the final development slice so the remaining screens can be developed before a login design exists. The dashboard is the temporary unauthenticated development homepage; this bypass must not ship in a preview or production release.

### Slice 3.1a: single-account persistence foundation — complete

- Added a database-enforced singleton account with case-insensitive username uniqueness, Argon2id password-hash storage, configurable 24–72 hour session duration, and login timestamps. The obsolete unused PIN-hash column is removed by the subsequent username/password-only migration.
- Added refresh-session persistence with SHA-256 token hashes, expiry/revocation timestamps, rotation links, restrictive account foreign keys, and an active-session index.
- Added integration tests for the singleton invariant, session-duration policy, refresh-hash length, rotation/revocation coupling, username/password-only credential schema, and migration idempotency.
- No authentication route is active yet; password primitives, manual provisioning, token issuance, handlers, and middleware remain part of Phase 3.

Commit: `feat(auth): add single-account persistence schema`

### Slice 3.1b: Argon2id password primitives — complete

- Added Argon2id password hashing with 64 MiB memory, three iterations, two lanes, random 16-byte salts, and 32-byte hashes encoded in strict PHC form.
- Added constant-time verification, 12–1024 byte password boundaries, strict format/base64 parsing, and defensive parameter ceilings that prevent attacker-controlled hashes from requesting excessive work.
- Added tests for correct and incorrect passwords, salt uniqueness, malformed/legacy/expensive hash rejection, password policy, and non-sensitive errors.

Commit: `feat(auth): add argon2id password security`

### Slice 3.1c: manual account provisioning and reset — complete

- Added `cmd/provision-user`, which reads the password only from `CITO_ADMIN_PASSWORD`, applies migrations, and accepts an explicit username and 24–72 hour session duration.
- Added transactionally serialized create/reset behavior so concurrent operators cannot create multiple accounts.
- Account reset updates the Argon2id hash and revokes all active refresh sessions in the same PostgreSQL transaction.
- Added integration tests proving create/reset behavior, singleton preservation, password replacement, session revocation, input validation, and UUIDv4 account IDs.

Commit: `feat(auth): add secure account provisioning`

### Slice 3.2a: access and refresh token primitives — complete

- Added 15-minute HS256 access JWTs with strict algorithm/type parsing, fixed issuer/audience, UUID subjects and token IDs, exact lifetime validation, and constant-time signature verification.
- Added 256-bit opaque refresh-token generation and SHA-256 hashing so only token digests are persisted.
- Added signing-key minimums, strict JSON/base64 parsing, expiry checks, algorithm-confusion/tamper/wrong-key rejection, and tests for token uniqueness and malformed inputs.

Commit: `feat(auth): add secure token primitives`

### Slice 3.2b: transactional session lifecycle — complete

- Added case-insensitive login with Argon2id verification, unknown-user timing defense, configured/default session duration, 15-minute access tokens, and persisted refresh sessions.
- Added one-time refresh rotation that preserves absolute session expiry and retires the previous token transactionally.
- Added replay defense that revokes every remaining active session when a rotated refresh token is reused, plus explicit expiry revocation and idempotency-resistant logout rejection.
- Added PostgreSQL integration coverage for valid/invalid login, duration policy, rotation, replay, expiry, logout, access claims, and session row state.

Commit: `feat(auth): implement session lifecycle`

### Slice 3.2c: authentication HTTP boundary — complete

- Added contract-aligned login, refresh, and bearer-protected logout handlers with strict JSON/content-type/8 KiB request boundaries and structured sanitized errors carrying request IDs.
- Added bearer middleware with strict scheme parsing and verified account context, plus an in-memory per-IP five-failure/15-minute login throttle with `Retry-After` responses.
- Added required base64url JWT-secret loading without making migration or provisioning commands depend on the runtime signing secret.
- Added handler and real PostgreSQL HTTP integration tests proving login, access authorization, logout, post-logout refresh rejection, malformed body rejection, rate limits, and secret-safe errors.

Commit: `feat(api): expose single-account authentication`

### Slice 3.3a: mobile authentication API boundary — complete

- Added a typed Expo authentication client for login, refresh rotation, and bearer-authenticated logout.
- Added 15-second request cancellation, explicit JSON headers, a 32 KiB response ceiling, strict token/timestamp response validation, and safe error mapping that never embeds credentials or server details.
- Added tests for request payloads, bearer logout, invalid credentials/sessions, missing configuration, transport failures, malformed server payloads, and token expiry ordering.

Commit: `feat(mobile): add authentication api client`

### Slice 3.3b: encrypted mobile session persistence — complete

- Added Expo SecureStore using device-bound after-first-unlock accessibility for access/refresh tokens and expiry metadata; usernames and passwords are never persisted.
- Added strict stored-session validation, automatic malformed/expired session deletion, refusal to persist expired sessions, and a 30-second access-refresh margin.
- Added tests for persistence/restoration, credential absence, malformed and expired cleanup, invalid save rejection, and refresh timing.

Commit: `feat(mobile): persist sessions in secure storage`

### Slice 3.3c: authenticated Expo shell and offline re-entry — complete

- Added a production login screen with bounded credential inputs, disabled invalid submission, safe errors, no credential persistence, and first-login connectivity guidance.
- Added an authentication provider that restores SecureStore sessions, rotates near-expiry access tokens, permits offline re-entry only while a previously authenticated session remains within absolute policy, and clears server-rejected sessions.
- Protected every tab, diagnostics route, and encrypted-storage route behind Expo Router guards; unauthenticated users can access only login, while bootstrap shows no application content.
- Added authenticated logout, local cleanup even when remote revocation is unavailable, an offline-session banner, and tests for restore, refresh, offline policy, invalidation, login, persistence, and safe failures.
- Enforced absolute session expiry while the app remains open, immediately closing protected routes and clearing SecureStore rather than relying on an app restart to revalidate policy.
- Pinned the SDK-compatible navigation/animation native modules at the workspace root and added npm overrides so Expo Router cannot auto-install duplicate peer versions; explicitly hoisted Expo Modules Core for Jest Expo's workspace resolver. Expo install validation and all 21 Expo Doctor checks pass.

Commit: `feat(mobile): gate app behind secure authentication`

Current development state: the completed login screen and session code remain in the repository, but the mobile route guard and sign-out UI are disabled. The tab dashboard is the initial route without authentication. Backend clinic APIs remain bearer-protected; no API authentication bypass is permitted. Phase 9 must reactivate the mobile gate and verify every route before release.

### Work

- Preserve the implemented account provisioning, API session lifecycle, secure mobile session storage, and login implementation while domain modules are built; do not weaken backend bearer protection.
- Keep account creation and credential recovery exclusively in the manual admin/provisioning workflow; do not add registration, sign-up, forgot-password email, roles, permissions, or account-management screens.
- Keep username and password as the only authentication mechanism; do not add PIN or biometric authentication/re-lock.
- Defer mobile login activation, final UX, and accessibility work until the final Phase 9 development slice.
- Add authentication work before then only when a domain implementation exposes a concrete security or session integration defect.

### Required tests

- Before release, no app data is accessible before authentication.
- Exactly one manually provisioned owner/vet account is supported.
- No self-registration, sign-up, create-account, role, permission, or multi-user route or screen exists.
- No PIN or biometric authentication/re-lock route or screen exists.
- Invalid credentials, expired sessions, rotated tokens, logout, and replay are rejected.
- Offline re-entry works only after a successful online login and within configured policy.
- Logs and errors contain no password, token, or clinical data.

### Commit boundaries

1. `feat(api): add single-account authentication`
2. `feat(mobile): gate local data behind secure session`

## Phase 4 — Inventory vertical slice

### Slice 4.1: backend inventory domain service — complete

- Added a production PostgreSQL inventory service for client-ID create/replay, active-item reads and bounded listing, optimistic metadata updates that cannot change stock, and auditable stock adjustments.
- Enforced contract boundaries for canonical UUIDs, whole-IDR prices, nonnegative quantities, bounded text, category values, required medical expiry dates, versions, and occurrence timestamps before database access.
- Made stock adjustment atomic with row locking, version checks, nonnegative-stock enforcement, audit-row insertion, rollback safety, and adjustment-ID replay protection that never applies a quantity delta twice.
- Added unit and real PostgreSQL integration coverage for validation, create/update replay, conflicting payloads, tombstones, low-stock calculation, optimistic conflicts, adjustment replay, and failed-adjustment rollback.

Verification: `go test -race ./internal/inventory`

Remaining Phase 4 work starts with authenticated HTTP handlers and contract pagination/alert filters, followed by the mobile API boundary. Encrypted mobile inventory persistence and offline outbox wiring remain blocked by the deferred physical-device SQLCipher gate.

### Slice 4.2: authenticated inventory mutation HTTP boundary — complete

- Exposed bearer-protected create, get, metadata update, and stock-adjustment routes matching the OpenAPI inventory payloads and sanitized error contract.
- Added strict JSON/content-type/16 KiB request boundaries, path/body ID matching, RFC 3339 timestamp and date parsing, and operation-ID header matching for replay-safe creates and adjustments.
- Wired the production inventory service through an explicit HTTP dependency bundle without exposing stock changes through metadata updates.
- Added handler tests for authentication, contract mapping, malformed/oversized requests, path and idempotency mismatches, and domain error mapping, plus a real PostgreSQL HTTP integration flow covering login, create, get, update, adjustment, replay, and persisted audit state.

Verification: `go test -race ./internal/httpserver ./internal/inventory`

Remaining HTTP work starts with clinic-local expiry filtering before adding the mobile inventory API client.

### Slice 4.3: authenticated inventory listing and low-stock filter — complete

- Added bearer-protected active-item listing with deterministic case-insensitive name/UUID ordering, bounded limits, and opaque cursor pagination.
- Fetches one extra row to derive `has_more`, returns contract-shaped page metadata, and excludes tombstoned records on every page.
- Added the PRD-defined strict low-stock filter (`stock_quantity < low_stock_threshold`) without conflating equality with an alert.
- Added unit and real PostgreSQL coverage for malformed cursors/limits, cursor continuation, ordering, page boundaries, authentication, and low-stock filtering.
- Kept expiry filtering out of the implemented contract until its configurable alert window and clinic timezone are explicit; this avoids silently applying UTC or a guessed date window.

Verification: `TEST_DATABASE_URL=<local> go test ./internal/inventory ./internal/httpserver -count=1`

Remaining Phase 4 HTTP work: define clinic timezone and expiry-window configuration, then implement clinic-local expiry filtering.

### Slice 4.4: mobile online inventory read boundary — complete

- Added a contract-validating Expo inventory API client with bounded responses, request timeouts, access-token authentication, safe error mapping, and strict inventory/page parsing.
- Replaced the inventory placeholder with an authenticated read-only online list, cursor-based load-more behavior, IDR prices, low-stock indicators, and medical expiry display.
- Added truthful loading, empty, retryable error, and restored-offline-session states without prototype records or claims of encrypted offline persistence.
- Kept create, edit, and stock-adjustment controls hidden until a production local encrypted repository and atomic outbox path exist.
- Added API boundary and component coverage for malformed responses, transport/session failures, pagination, low-stock rendering, empty data, offline behavior, and retry.

Verification: `npm run mobile:typecheck && npm run mobile:lint && npm run mobile:test`

### Slice 4.5: clinic-local inventory expiry alerts — complete

- Added validated API configuration for the clinic IANA timezone and a 1–365 day expiry-alert window, defaulting to `Asia/Jakarta` and 30 days.
- Added authenticated `alert=expiring` inventory filtering using an inclusive clinic-local boundary; already-expired active items remain visible as urgent alerts.
- Embedded timezone data in the API binary, documented the shared business-date decision in ADR 0004, and aligned the OpenAPI and typed mobile client contracts.
- Added configuration, service, PostgreSQL integration, and HTTP boundary coverage, including the UTC-to-clinic midnight transition and inclusive window boundary.

Verification: `TEST_DATABASE_URL=<local> go test -race ./internal/inventory ./internal/httpserver -count=1`, `go test ./internal/config`, and `npm run api:lint`.

Remaining Phase 4 work: physical-device SQLCipher verification, production local inventory/outbox persistence, then mobile inventory mutations and synchronization.

### Work

- Implement inventory local schema/repository, API repository/service/handlers, sync operations, and mobile screens.
- Include create/edit, low-stock threshold, expiry date, supplier fields, and stock adjustment with reason.
- Replace prototype mock inventory with production module data only in Expo.

### Required tests

- Boundary validation for prices, quantities, expiry, and categories.
- Stock adjustment is atomic and auditable.
- Low-stock and expiry calculations use clinic-local dates.
- Offline create/edit remains after restart and syncs idempotently.

### Exit criterion

Inventory can be managed end-to-end online and offline without duplicate sync effects.

## Phase 5 — Owners, pets, vaccinations, and medical visits

Phase 4 mobile persistence remains blocked by the deferred physical-device SQLCipher gate. Backend patient-domain work can proceed independently because it writes only to the already-reviewed PostgreSQL schema and does not authorize mobile plaintext or unverified local persistence.

### Slice 5.1: backend pet-owner domain service — complete

- Added the `internal/patients` service boundary with validated owner create, get, bounded cursor listing, and optimistic update operations.
- Enforced contract-sized owner names and contacts, canonical client UUIDs, UTC microsecond timestamps, active-record reads, deterministic case-insensitive ordering, and tombstone exclusion.
- Made creates and updates replay-safe: identical client retries return the persisted record, while conflicting payloads, stale versions, stale timestamps, and tombstoned IDs fail explicitly.
- Added unit and isolated PostgreSQL integration coverage for validation, create/update replay, conflicts, pagination, ordering, and tombstones.

Verification: `TEST_DATABASE_URL=<local> go test -race ./internal/patients -count=1`.

### Slice 5.2: authenticated pet-owner HTTP boundary — complete

- Exposed bearer-protected owner create, get, bounded cursor list, and optimistic update routes matching the OpenAPI owner payloads and metadata.
- Added strict JSON/content-type/8 KiB request limits, unknown-field rejection, path/body ID checks, RFC 3339 timestamp parsing, and create idempotency-header matching.
- Added opaque cursor encoding, sanitized domain error mapping, production service wiring, and explicit OpenAPI validation responses for malformed list/get parameters.
- Added handler coverage for authentication, contract mapping, malformed requests, cursor continuation, oversized bodies, and domain errors, plus a real PostgreSQL HTTP flow covering login, create, paginated list, get, update, and persisted state.

Verification: `TEST_DATABASE_URL=<local> go test -race ./... -count=1`, `go vet ./...`, `go build ./...`, and `npm run api:lint`.

### Slice 5.3: encrypted pet profile domain service — complete

- Added a dedicated backend pet service with validated create, get, and optimistic update operations while leaving the existing owner service boundary unchanged.
- Enforced canonical client UUIDs, active-owner references, bounded identity fields, exact three-decimal weight handling as integer grams, nullable date/weight fields, UTC microsecond event timestamps, and version limits.
- Encrypted allergies and chronic conditions before PostgreSQL persistence with the existing AES-256-GCM keyring and field/record-bound associated data; empty health flags persist as null rather than plaintext.
- Made creates and updates replay-safe: identical retries return the persisted decrypted profile, while payload changes, stale versions, old timestamps, tombstoned IDs, and missing/tombstoned owners fail explicitly.
- Added unit and isolated PostgreSQL integration coverage for validation, dependency requirements, encryption-at-rest, plaintext recovery, create/update replay, conflicts, and active-owner enforcement.
- Hardened the profile boundary after design review: `current_weight` is a read-only projection of the weight-history ledger, so profile creates/updates cannot silently bypass the PRD-required history or invent an offline weight-entry ID.
- Added regression coverage proving create retries preserve the original ciphertext bytes, derived weight changes do not invalidate create replay, profile updates preserve derived weight, and multibyte health text is bounded by encrypted UTF-8 byte size.
- Corrected the pet OpenAPI composition so strict schemas accept valid update/response fields, documented bad-query responses and UTF-8 byte limits, and aligned the ERD/medical-encryption ADR with ciphertext storage and key-ID-bound associated data.
- Added encrypted pet listing with active-row filtering, optional owner scoping, deterministic case-insensitive `(name, id)` cursor ordering, bounded pages, and decrypted health flags.
- Added isolated PostgreSQL coverage for owner filtering, duplicate-name cursor stability, tombstone exclusion, pagination, and medical-field decryption.
- Kept the service unwired from HTTP/configuration until the next slice adds keyring configuration, authenticated handlers, and sanitized crypto failure mapping.

Verification: `TEST_DATABASE_URL=<local> go test -race ./... -count=1`, `go vet ./...`, `go build ./...`, and `npm run api:lint`.

Remaining Phase 5 backend work starts with pet listing and the authenticated pet HTTP boundary, followed by weight history, vaccinations, and transactional visits. Mobile patient persistence remains blocked until the physical SQLCipher device sequence passes.

### UI-first development track

Product UI development is now prioritized before the remaining backend and encrypted-persistence slices. Implement the Expo screens from the existing Figma/Vite visual reference with isolated, strongly typed mock fixtures so navigation, information hierarchy, accessibility, and core interaction flows can be reviewed early.

Rules for this track:

- Build only in `apps/mobile`; the Vite prototype remains a read-only visual reference.
- Keep fixtures under feature-owned `mockData.ts` modules rather than embedding untyped objects throughout components.
- Label mock-backed screens visibly as demo data and never send mock records to the API, local database, sync queue, logs, or analytics.
- Keep data access behind component boundaries that can later receive the encrypted local repository or API adapter without redesigning the screen.
- Do not imply that persistence, encryption, sync, stock deduction, financial calculations, or receipt generation work until their production implementations pass the existing gates.
- Do not port the prototype's appointment schedule: in-app booking/calendar remains outside the MVP.
- Every visible action must navigate or perform a safe local mock interaction; no dead production-looking buttons.

#### UI Slice 1: mock-backed mobile dashboard — complete

- Replaced the foundation-status homepage with the design-backed dashboard layout.
- Added typed demo metrics, owner-draw summary, navigable module shortcuts, and low-stock alerts.
- Added an explicit `Data demo` marker and disclaimer separating fixtures from clinic/API data.
- Excluded the prototype appointment schedule because booking is outside MVP scope.
- Added component tests covering visible metrics, fixture labeling, module links, and appointment exclusion.

Verification: `npm run mobile:typecheck`, `npm run mobile:lint`, `npm run mobile:test`, and `npm run mobile:export:android`.

#### UI Slice 2a: inventory discovery and detail UI — complete

- Replaced the unauthenticated inventory placeholder with a mock-backed Expo inventory screen while preserving the authenticated server-backed inventory path.
- Added feature-owned typed fixtures covering medical and retail items, whole-IDR prices, stock thresholds, suppliers, units, and optional expiry presentation.
- Added working search across item names and display categories, filters for medical, retail, and low-stock records, truthful no-results/reset behavior, and expandable item details.
- Added low/critical stock badges and progress indicators based on each fixture's threshold.
- Kept the screen explicitly labeled as demo data and stated that persistence, API writes, encryption, and synchronization are inactive.
- Added component tests for fixture labeling, search, filtering, detail expansion, IDR display, and empty results.

Remaining inventory UI work: add/edit form presentation and stock-adjustment interaction using local-only draft state; these controls must remain visibly non-persistent until production integration.

Verification: `npm run mobile:typecheck`, `npm run mobile:lint`, `npm run mobile:test`, and `npm run mobile:export:android`.

#### UI Slice 2b: local-only inventory add/edit form — complete

- Added working add and edit entry points to the mock-backed inventory screen.
- Added a bounded form for item name, medical/retail type, display category, unit, stock, low-stock threshold, whole-IDR cost/selling prices, supplier, and optional/required expiry presentation.
- Enforced non-empty identifiers, nonnegative safe-integer stock/prices, and mandatory expiry input for medical demo items before accepting local changes.
- Applied successful creates and edits only to in-memory screen state; the form and list continue to state explicitly that no API, encrypted storage, or sync write occurs.
- Preserved authenticated sessions on the existing production server-backed inventory screen rather than exposing demo mutations to authenticated API data.
- Added integration-style component tests for validation, local creation, formatted IDR display, and editing an existing fixture.

Remaining inventory UI work: add auditable stock-adjustment presentation with a required reason and nonnegative-stock validation in local-only state.

Verification: `npm run mobile:typecheck`, `npm run mobile:lint`, `npm run mobile:test`, and `npm run mobile:export:android`.

#### UI Slice 2c: local-only stock adjustment — complete

- Added a dedicated stock-adjustment flow from each expanded demo inventory item, with explicit add/decrease modes and a live projected-stock summary.
- Required a positive whole-unit quantity and one of the bounded reasons: restock, breakage, expiry, or data correction.
- Rejected adjustments that would produce negative stock and kept invalid submissions on the form with an accessible error.
- Applied valid adjustments only to in-memory inventory state and displayed the latest local adjustment reason, signed quantity, and optional note on the item detail as an audit-preview treatment.
- Kept the flow explicitly labeled as demo-only with no API audit event, encrypted local write, production stock mutation, or sync operation.
- Added component and integration tests for required reasons, negative-stock rejection, updated quantities, and local audit presentation.

The mock-backed inventory UI track is complete. Production integration remains deferred to the encrypted repository/API/sync phase; authenticated sessions continue to use the existing protected inventory implementation.

Verification: `npm run mobile:typecheck`, `npm run mobile:lint`, `npm run mobile:test`, and `npm run mobile:export:android`.

#### UI Slice 3a: patient directory and clinical timeline — complete

- Replaced the Records placeholder with a searchable, filterable patient directory backed only by typed synthetic fixtures.
- Added pet identity, species/breed, owner contact, date of birth, current weight, health flags, vaccination status, and structured visit-history presentation.
- Added an attention filter for allergies, chronic conditions, and due/overdue vaccinations, plus truthful search reset and empty-result behavior.
- Made allergies and chronic conditions prominent in expanded records and presented vaccination due dates and structured complaint, observation, diagnosis, treatment, and medicine history.
- Labeled all fixture content as demo-only and explicitly stated that it is not real medical data and is not stored in encrypted persistence, audit history, or sync.
- Added component tests for demo labeling, patient/owner search, attention filtering, profile expansion, vaccination data, clinical timeline content, and empty-state recovery.

Remaining patient UI work: local-only patient profile create/edit presentation, weight and vaccination entry, then the structured visit editor and editable visit-detail flow. These screens must remain synthetic and non-persistent until encrypted storage is proven.

Verification: `npm run mobile:typecheck`, `npm run mobile:lint`, `npm run mobile:test`, and `npm run mobile:export:android`.

#### UI Slice 3b: local-only patient profile create/edit — complete

- Added working create and edit entry points to the synthetic patient directory instead of exposing inert action buttons.
- Added a bounded profile form for patient identity, species, breed, birth date/age label, current weight, owner contact, allergies, and chronic conditions.
- Enforced required identity/contact fields and a finite positive weight of at most 500 kg at the form boundary.
- Normalized comma-separated health flags and added changed weights to a local history preview while preserving existing vaccinations and visits during profile edits.
- Applied creates and edits only to in-memory screen state, automatically expanded the saved profile, and presented truthful empty vaccination/visit states for new patients.
- Kept the form explicitly synthetic and non-persistent: no real medical data, encrypted database write, audit event, API request, or sync operation occurs.
- Added component and integration tests for required fields, invalid weight rejection, local creation, local profile editing, health-flag updates, and weight presentation.

Remaining patient UI work: local vaccination entry and then structured visit create/edit flows with local-only clinical draft state.

Verification: `npm run mobile:typecheck`, `npm run mobile:lint`, `npm run mobile:test`, and `npm run mobile:export:android`.

#### UI Slice 3c: local-only vaccination entry — complete

- Added a working vaccination-entry action to every expanded synthetic patient profile.
- Added required vaccine name, administered-date label, next-due-date label, and explicit current/due-soon/overdue reminder status controls.
- Prepended successful entries to the selected patient's in-memory vaccination timeline, restored the expanded patient detail, and made the new status immediately participate in the attention filter.
- Kept reminder status deliberately manual in the mockup rather than pretending that free-text date labels provide production-grade date calculations or device notifications.
- Kept the flow explicitly synthetic and non-persistent: no encrypted record, reminder, audit event, API request, or sync operation is created.
- Added component and integration tests for required fields, local timeline insertion, administered/due labels, and reminder-status presentation.

Remaining patient UI work: structured visit creation and editing with local-only clinical draft state, followed by inventory-item and service-fee presentation.

Verification: `npm run mobile:typecheck`, `npm run mobile:lint`, `npm run mobile:test`, and `npm run mobile:export:android`.

#### UI Slice 3d: structured local-only visit create/edit — complete

- Added working visit-create and per-visit edit actions to each expanded synthetic patient profile.
- Added structured capture for visit type/date, complaint, observations, diagnosis, treatment plan, optional medicines, and optional veterinarian notes.
- Enforced every core clinical field at the form boundary and normalized comma-separated medicine labels before saving.
- Prepended new visits to the selected patient's local timeline and replaced edited visits in place without disturbing the patient's profile, vaccinations, weights, or other visits.
- Added veterinarian-note presentation and accessible edit actions to visit cards so saved clinical drafts remain reviewable and editable.
- Kept the workflow explicitly synthetic and non-persistent: it does not create encrypted records, audit events, stock deductions, price snapshots, financial entries, API requests, or sync work.
- Added component and integration tests for validation, structured clinical creation, medicine normalization/presentation, note presentation, and local visit editing.

Remaining patient UI work: visit service-fee and inventory-item presentation with explicit demo price snapshots and no stock mutation, before production transactional integration.

Verification: `npm run mobile:typecheck`, `npm run mobile:lint`, `npm run mobile:test`, and `npm run mobile:export:android`.

#### UI Slice 3e: demo visit fees and item price snapshots — complete

- Extended typed visit drafts with whole-IDR service fees and explicit inventory-item quantity, unit, cost-price-at-time, and selling-price-at-time snapshots.
- Added bounded medical-inventory quantity controls using the existing synthetic inventory catalog, capped by displayed reference stock without mutating inventory state.
- Added live service-fee, item-income, item-cost, total-income, and gross-profit previews using integer rupiah arithmetic.
- Preserved captured item prices when editing a visit instead of re-reading current catalog prices, and presented both saved selling and cost prices in the visit timeline.
- Added required nonnegative safe-integer service-fee validation and retained local item snapshots across clinical edits.
- Kept the entire flow explicitly presentational: saving does not deduct stock, create a financial transaction, write encrypted medical data, emit audit events, call an API, or enqueue sync.
- Added integration and form tests for invalid fees, quantities, saved price presentation, financial totals, and snapshot preservation across edits.

The mock-backed Patient and Medical Records UI track is complete. Production encrypted persistence, transactional stock/financial writes, audit behavior, and sync remain deferred to the production-integration track.

Verification: `npm run mobile:typecheck`, `npm run mobile:lint`, `npm run mobile:test`, and `npm run mobile:export:android`.

### Work

- Implement owner/pet CRUD, health flags, weight history, vaccinations, and editable visit history.
- Build structured visit capture for complaint, observations, diagnosis, treatment, notes, service fees, and inventory items.
- In one local transaction: save visit, snapshot prices, deduct stock, calculate financials, update local projections, and enqueue sync.
- Mirror the invariant in one server transaction.

### Required tests

- Medical fields are encrypted at rest locally and server-side.
- Visit edits preserve original creation time and update edit time.
- Price snapshots do not change when inventory prices change.
- Insufficient stock rejects the entire visit transaction.
- Failed writes do not partially deduct stock or enqueue malformed sync work.
- A representative visit can be completed within the PRD's 2–3 minute target in a usability smoke test.

### Commit boundaries

Split by owner/pet, vaccination, visit editor, transactional stock/financial logic, and sync behavior.

## Phase 6 — Retail POS and offline PDF receipts

### UI-first progress

#### UI Slice 4a: product discovery and local cart — complete

- Replaced the Kasir placeholder with a typed synthetic catalog derived from the existing demo inventory source.
- Added product-name/category search, medical and retail filters, truthful no-result recovery, selling-price presentation, and reference-stock visibility.
- Added working local cart creation, increment, decrement, removal, and clear behavior with cost/selling prices captured when an item first enters the cart.
- Bounded quantities by synthetic reference stock and surfaced the stock-limit state without mutating the Inventory screen's demo state.
- Added live whole-IDR total, saved-cost, and gross-profit presentation without introducing prototype-only tax behavior that is absent from the PRD.
- Kept the slice explicitly presentational and non-persistent: it does not confirm payment, deduct stock, save a transaction, generate a receipt, call an API, or enqueue sync.
- Added component tests for demo disclosure, catalog search/filter/reset, cart calculations, quantity changes/removal, and stock limits.

Remaining POS UI work: payment-method selection, explicit confirmation, success state, and itemized receipt preview before production checkout/PDF integration.

Verification: `npm run mobile:typecheck`, `npm run mobile:lint`, `npm run mobile:test`, and `npm run mobile:export:android`.

#### UI Slice 4b: payment confirmation and receipt preview — complete

- Added cash, QRIS, transfer, and card selection with accessible selected-state presentation matching the PRD.
- Added an explicit review screen that itemizes the saved cart snapshots, payment method, and total before confirmation.
- Added a separate synthetic receipt-success state containing clinic name, deterministic demo receipt number/time, item names, quantities, saved prices, total paid, and payment method.
- Added working back-to-cart and start-new-sale actions so checkout states are reversible and no controls are inert.
- Kept confirmation idempotent and local to the screen state: it does not accept money, persist a sale, mutate inventory, write financial projections, emit audit events, call an API, or enqueue sync.
- Labeled receipt output truthfully as a UI preview rather than a generated, saved, shared, or printable PDF.
- Added integration coverage for payment selection, review cancellation, explicit confirmation, required receipt content, and resetting into a clean sale.

The mock-backed Retail POS UI track is complete. Production checkout transactions, encrypted local persistence, stock deduction, financial rollups, sync, and offline PDF generation/sharing remain deferred to production integration.

Verification: `npm run mobile:typecheck`, `npm run mobile:lint`, `npm run mobile:test`, and `npm run mobile:export:android`.

### Work

- Implement fast item search, cart, quantity changes, payment method, and checkout.
- In one local transaction: snapshot prices, deduct stock, save sale, update projection, and enqueue sync.
- Generate, persist, view, and share an itemized PDF entirely on-device.
- Keep retail checkout separate from medical visits; no diagnosis is required.

### Required tests

- Totals and profits are correct without floating-point drift.
- Insufficient stock and duplicate confirmation cannot create partial or duplicate sales.
- Receipt includes clinic, time, receipt number, items, quantities, prices, total, and payment method.
- Receipt generation and sharing preparation work with network disabled.
- Checkout meets the under-one-minute target in a usability smoke test.

## Phase 7 — Expenses, owner draw, and financial rollups

### UI-first progress

#### UI Slice 5a: daily/monthly summaries and trends — complete

- Replaced the Finance placeholder with typed synthetic daily and six-month fixtures using the configured `Asia/Jakarta` business-date context.
- Added deterministic whole-IDR calculation helpers for daily income/net and monthly gross income, operating expenses, net profit, owner draw, and retained funds.
- Enforced nonnegative safe-integer money inputs and required the daily payment-method breakdown to reconcile exactly to daily income.
- Added month and day views with accessible period controls, summary metrics, medical-versus-retail income breakdowns, payment-method presentation, and a lightweight six-month trend visualization.
- Kept owner's draw visibly and mathematically separate from operating expenses: `net profit = gross income − operating expenses`; `retained = net profit − owner draw`.
- Kept the slice explicitly presentational and non-persistent: it does not read production transactions, log expenses/draws, close a cash drawer, write encrypted storage, call APIs, or enqueue sync.
- Added pure calculation tests and component tests for monthly metrics, daily switching, payment breakdowns, and owner-draw separation.

Remaining Finance UI work: validated local expense and owner's-draw entry, followed by cash opening/expected/actual reconciliation and variance presentation.

Verification: `npm run mobile:typecheck`, `npm run mobile:lint`, `npm run mobile:test`, and `npm run mobile:export:android`.

#### UI Slice 5b: expense and owner's-draw entry — complete

- Added a shared validated local-entry flow with distinct expense and owner's-draw modes rather than representing personal withdrawals as an expense category.
- Added expense categories from the PRD: restock, utilities, rent, equipment, and miscellaneous.
- Added valid `YYYY-MM-DD` business dates, positive safe whole-IDR amounts, optional trimmed notes, required expense categories, and accessible validation errors.
- Added local activity presentation with record type, category, business date, note, and amount.
- Recomputed the August monthly projection from local entries while preserving the documented order: expense entries increase operating expenses and reduce net profit; owner's-draw entries change only total draw and retained funds.
- Reflected same-day local expense entries in the daily expense/net projection without changing the payment-method income breakdown.
- Kept all mutations in screen memory and explicitly avoided production finance records, encrypted persistence, audit events, APIs, and sync queue writes.
- Added form and integration tests covering invalid money/date input, required expense category, owner's-draw separation, local activity, and recomputed monthly values.

Remaining Finance UI work: cash opening, expected closing, actual closing, and variance presentation.

Verification: `npm run mobile:typecheck`, `npm run mobile:lint`, `npm run mobile:test`, and `npm run mobile:export:android`.

#### UI Slice 5c: cash-drawer reconciliation — complete

- Added a validated local reconciliation form for nonnegative safe whole-IDR opening and actual closing balances.
- Added a live expected-closing calculation and signed variance preview: `expected = opening + cash income − cash expenses`; `variance = actual − expected`.
- Added saved daily reconciliation presentation for opening, expected, actual, variance, and balanced/short/over status.
- Added working edit/cancel behavior that preloads saved balances while preserving the prior reconciliation when an edit is cancelled.
- Explicitly disclosed the mock-only assumption that all daily expenses are treated as cash outflows because the current `Expense` entity does not capture payment method. Production reconciliation must resolve this before integration.
- Kept the reconciliation snapshot local to screen memory and avoided production cash closing, encrypted persistence, audit events, APIs, and sync writes.
- Added calculation, validation, preview, save, presentation, and edit-state tests.

The mock-backed Finance UI track is complete. Production repositories, transaction attribution, encrypted persistence, API/sync integration, and authoritative rollup generation remain deferred to the production-integration track.

Verification: `npm run mobile:typecheck`, `npm run mobile:lint`, `npm run mobile:test`, and `npm run mobile:export:android`.

### Work

- Implement expenses and owner draws as distinct records.
- Add cash opening/expected/actual closing and variance.
- Compute daily and monthly views from source records locally and server-side.
- Expose medical versus retail income, operating expenses, net profit, draw, and retained amount.

### Required tests

- Owner draw never appears as an operating expense.
- `retained = gross income - operating expenses - owner draw` through the documented intermediate net-profit calculation.
- Recomputing projections is deterministic and idempotent.
- Month boundaries respect the configured clinic timezone.
- Offline records appear immediately and reconcile after sync.

## Phase 8 — Sync reliability and recovery

### Work

- Complete push/pull protocol, checkpoints, retries, connectivity triggers, and dead-letter diagnostics.
- Make all mutations idempotent and transactionally couple domain writes with sync acknowledgements.
- Add backup/restore runbooks and backend health/metrics without sensitive payloads.
- Test interrupted uploads, process death, duplicate delivery, out-of-order retries, and database restore.

### Required tests

- Airplane-mode workflow across every core write.
- App restart with pending outbox records loses no data.
- Repeated operations create no duplicate visits, sales, expenses, draws, or stock deductions.
- Restore drill recovers a known synthetic dataset.
- Sync status is visible without exposing clinical payloads.

## Phase 9 — Release readiness

### Work

- Add production Docker image for API, TLS/reverse-proxy deployment documentation, migration procedure, encrypted backup schedule, and rollback runbook.
- Configure Expo EAS development, preview, and production profiles.
- Run Android release build and iOS EAS build; test on physical devices when available.
- Perform security review, dependency audit, accessibility pass, and PRD acceptance test.
- As the final development slice, design/refine the login screen, reactivate the mobile route guard and sign-out flow, and validate authentication against every completed route and offline workflow. Preserve mandatory username/password login at launch, the single manually provisioned account, the absence of registration/roles/PIN/biometrics, offline re-entry within an authenticated session, and absolute session expiry.

### Release gates

```bash
npm ci
npm run mobile:typecheck
npm run mobile:lint
npm run mobile:test
cd services/api && go test -race ./...
cd services/api && go vet ./...
docker compose -f infra/compose.yaml up -d --build --wait
# Run API integration and end-to-end smoke suites
```

Additionally:

- No secrets or sensitive fixtures in Git history or images.
- No plaintext medical fields in local/backend storage.
- Fresh-device install, login, offline workflow, reconnect/sync, logout, backup, and restore are verified.
- Manual provisioning is exercised, and the shipped app exposes no registration, sign-up, create-account, role, permission, PIN, biometric, or automated credential-recovery flow.
- Production migration and rollback procedures are exercised on a disposable environment.
- MVP acceptance criteria in `docs/prd.md` are checked individually.

## Immediate execution queue

The repository, Expo shell, backend/API foundation, schema, encryption, API contract, and single-account authentication foundations are implemented. The mobile login gate is temporarily disabled so the screens can be reviewed without a finished login design. Continue in these independently revertible product slices, prioritizing the UI-first track requested for the current development cycle:

1. **Dashboard UI — complete:** mock-backed Expo dashboard and reusable presentation primitives without appointment-booking UI.
2. **Inventory UI — complete:** search, filters, expandable details, local add/edit forms, and auditable stock-adjustment presentation are covered with typed demo state.
3. **Patient and medical-record UI — complete:** searchable profiles, profile create/edit, weight/vaccination timelines, structured visit create/edit, service fees, item quantities, and saved price/financial presentation are covered with typed demo state.
4. **Retail POS UI — complete:** typed product discovery, bounded cart controls, saved prices, payment selection, explicit confirmation, success state, and itemized receipt preview are covered with synthetic local state.
5. **Finance UI — complete:** summaries, trends, distinct expense/owner-draw entry, and cash opening/expected/actual reconciliation with variance are covered by synthetic local state.
6. **Production integration — next:** close the physical SQLCipher gate, replace fixtures feature-by-feature with encrypted local repositories/API adapters, and complete backend domain slices, transactions, sync, and PDF generation.
7. **Sync reliability:** complete recovery, retry, idempotency, and diagnostics across every core write.
8. **Login development and activation last:** after the application modules work end to end, finish the username/password login design, reactivate all route guards and sign-out, validate every finished route and offline workflow, then complete accessibility and visual polish.

The temporary mobile bypass applies only to local screen development: keep backend clinic APIs bearer-protected and do not add anonymous production data endpoints. Before any preview or production release, username and password must again be required before stock, financial, or patient data is accessible. The only supported identity is the manually provisioned owner/vet account; do not add in-app registration, roles, permissions, PIN, biometrics, or multi-user scoping. The physical SQLCipher execution remains the highest-risk prerequisite because offline encrypted medical storage is mandatory.

## Known specification gaps to resolve during implementation

These do not block repository separation, but they must be documented before the affected migration or behavior is committed:

- Currency formatting policy beyond the established whole-IDR storage rule. The clinic timezone is resolved by ADR 0004.
- Chosen encrypted SQLite adapter after the native build spike.
- Production secret-manager integration and encrypted key-backup procedure. The envelope, initial environment keyring, and rotation sequence are defined by ADR 0003.
- Server-to-device checkpoint format and tombstone retention duration. Tombstone deletion behavior is defined by ADR 0002.
- Whether the single account is expected to use exactly one device for MVP.
- Retention and audit policy for edits to medical records beyond `updated_at`.
- Backup destination, recovery-point objective, and recovery-time objective.
- Expense payment-method attribution for authoritative cash-drawer reconciliation; the mock UI temporarily treats every daily expense as a cash outflow and labels that assumption.

When a gap affects product behavior, update `docs/prd.md` and its version history. When it affects implementation only, add an architecture decision record without changing product scope.
