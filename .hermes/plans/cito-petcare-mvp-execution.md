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
- Verified Expo CNG emits `expo.sqlite.useSQLCipher=true`; Expo Doctor, strict TypeScript, ESLint, 18 tests, and Android JavaScript export pass.

Remaining native gates:

- Build and install the Android development client.
- Run initialization, force-close/relaunch, correct-key reopen, wrong-key rejection, and rollback checks against the real SQLCipher binary.

Current state: EAS authentication is configured, the Expo project is linked, and both Android development and self-contained preview builds finished successfully from commit `2381ad8`. The APKs and four-ABI native libraries were inspected and contain the expected SQLCipher symbols. At the user's direction, physical-device execution is deferred until later development steps are complete. Slice 1.2 therefore remains open; only independent foundation work may proceed, and mobile domain persistence remains blocked until the device results are recorded.

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

## Phase 3 — Authentication and local app lock

### Slice 3.1a: single-account persistence foundation — complete

- Added a database-enforced singleton account with case-insensitive username uniqueness, Argon2id hash storage, optional PIN hash storage, configurable 24–72 hour session duration, and login timestamps.
- Added refresh-session persistence with SHA-256 token hashes, expiry/revocation timestamps, rotation links, restrictive account foreign keys, and an active-session index.
- Added integration tests for the singleton invariant, session-duration policy, refresh-hash length, rotation/revocation coupling, and four-migration idempotency.
- No authentication route is active yet; password primitives, manual provisioning, token issuance, handlers, and middleware remain part of Phase 3.

Commit: `feat(auth): add single-account persistence schema`

### Slice 3.1b: Argon2id password primitives — complete

- Added Argon2id password hashing with 64 MiB memory, three iterations, two lanes, random 16-byte salts, and 32-byte hashes encoded in strict PHC form.
- Added constant-time verification, 12–1024 byte password boundaries, strict format/base64 parsing, and defensive parameter ceilings that prevent attacker-controlled hashes from requesting excessive work.
- Added tests for correct and incorrect passwords, salt uniqueness, malformed/legacy/expensive hash rejection, password policy, and non-sensitive errors.

Commit: `feat(auth): add argon2id password security`

### Work

- Add a CLI/admin command to provision or reset the single account.
- Implement Argon2id password verification, access JWTs, rotated sessions, logout, and configurable duration.
- Add mobile login, secure token storage, session expiry, offline re-entry, and optional PIN/biometric re-lock.
- Ensure every screen and local database open path is gated.

### Required tests

- No app data is accessible before authentication.
- No self-registration route exists.
- Invalid credentials, expired sessions, rotated tokens, logout, and replay are rejected.
- Offline re-entry works only after a successful online login and within configured policy.
- Logs and errors contain no password, token, PIN, or clinical data.

### Commit boundaries

1. `feat(api): add single-account authentication`
2. `feat(mobile): gate local data behind secure session`
3. `feat(mobile): add pin and biometric relock`

## Phase 4 — Inventory vertical slice

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
- Production migration and rollback procedures are exercised on a disposable environment.
- MVP acceptance criteria in `docs/prd.md` are checked individually.

## Immediate execution queue

Start with these independently revertible commits:

1. **Repository separation:** move the Figma prototype to `prototype/web`, establish root workspace commands, and verify identical output.
2. **Expo shell:** scaffold `apps/mobile`, add strict checks, and reproduce the navigation/design shell without business logic.
3. **Encrypted SQLite spike:** prove the native encrypted database path before committing to domain architecture.
4. **API foundation:** scaffold Go/Echo, PostgreSQL Compose, migrations, health checks, and integration tests.
5. **CI foundation — complete:** run clean-install mobile checks, Go checks, migration tests, and prototype build.

Do not begin inventory or patient feature implementation until all five foundation gates pass. The encrypted SQLite spike is the highest-risk prerequisite because offline encrypted medical storage is mandatory and determines the viable Expo development/build workflow.

## Known specification gaps to resolve during implementation

These do not block repository separation, but they must be documented before the affected migration or behavior is committed:

- Exact clinic timezone and currency formatting policy.
- Chosen encrypted SQLite adapter after the native build spike.
- Production secret-manager integration and encrypted key-backup procedure. The envelope, initial environment keyring, and rotation sequence are defined by ADR 0003.
- Server-to-device checkpoint format and tombstone retention duration. Tombstone deletion behavior is defined by ADR 0002.
- Whether the single account is expected to use exactly one device for MVP.
- Retention and audit policy for edits to medical records beyond `updated_at`.
- Backup destination, recovery-point objective, and recovery-time objective.

When a gap affects product behavior, update `docs/prd.md` and its version history. When it affects implementation only, add an architecture decision record without changing product scope.
