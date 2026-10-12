# Cito Mobile contributor instructions

## Ownership

This repository owns `apps/mobile` (Expo) and `prototype/web` (synthetic mobile-design reference). The website and shared Go/PostgreSQL backend are maintained in `fandykun/cito-petcare`. Do not add a backend or website workspace here.

Read README.md, docs/figma-alignment.md, docs/architecture-decisions/0001-encrypted-local-database.md, and docs/runbooks/android-sqlcipher-validation.md. The PRD, ERD, and execution plan retained here are migration snapshots; consult cito-petcare for the authoritative current product/domain/API definitions and subsequent ADRs. Existing historical web/backend verification entries are not this repository's checklist.

## Constraints

- Preserve Expo app identity and EAS project linkage; run EAS from apps/mobile.
- Synthetic UI review is not a production auth bypass. Restore and test route guards before releasing or exposing real clinic data.
- Never place tokens, encryption keys, or server secrets in EXPO_PUBLIC variables.
- Offline medical storage must be encrypted; domain/outbox writes must be transactional. Do not claim physical-device SQLCipher validation from JavaScript tests or exports.
- Single manually provisioned clinic account; no speculative roles, registration, or booking.
- Keep whole-IDR arithmetic, immutable price snapshots, replay IDs, optimistic versions, and visible conflict handling consistent with the shared API.
- Keep prototype/web synthetic and separate from production data/authentication/business logic.

## Verification and Git

Use npm 10.9.4. Run npm ci, npm run mobile:typecheck, npm run mobile:lint, npm run mobile:test, npm run mobile:export:android, npm run prototype:build, and Expo dependency/Doctor checks from apps/mobile. Keep generated native projects, artifacts, and local secrets ignored.

Work in small independently revertible slices. Verify, review, commit, and push each completed slice. Report blockers honestly; never mark native/release or remote CI gates complete without real evidence.
