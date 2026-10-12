# Mobile repository extraction

## Source and ownership

Extracted from `fandykun/cito-petcare` main at `70894a3`. Git history was filtered in an isolated clone, preserving mobile/prototype/document history without rewriting the source repository. Paths remain unchanged: the Expo app root is `apps/mobile` and the synthetic mobile-design reference is `prototype/web`.

The website, desktop-console prototype, Go API, PostgreSQL migrations, server infrastructure, authoritative product/domain documentation, and OpenAPI contract remain in cito-petcare. Retained PRD/ERD/execution-plan files here are labeled migration snapshots, not separately authoritative backend specifications.

## Verified during extraction

- All 161 tracked app/prototype files matched their source byte-for-byte.
- Clean lockfile installation using npm 10.9.4 succeeded.
- Mobile typecheck and ESLint passed.
- All 190 tests across 28 suites passed.
- Android JavaScript bundle export and mobile-design prototype production build passed.
- EAS project lookup resolved the existing `@fandykunnns-team/cito-petcare` project, ID `6a19df58-732e-49f8-b24e-fb486082c9c2`.
- Expo Doctor passed 20/21 checks, including native dependency uniqueness. Its version check reported inherited Expo patch mismatches.

## Inherited gates still failing

This extraction preserves dependency versions rather than mixing a framework/security upgrade into a repository move:

- Expo dependency validation requests newer patches for expo, expo-constants, expo-linking, expo-router, and expo-sqlite.
- Production dependency audit reported 16 moderate, 33 high, and 1 critical finding in the extracted repository. The source baseline reported 16 moderate, 52 high, and 1 critical finding. Counts are a migration-time snapshot, not ongoing security guarantees.
- CI intentionally retains the high-severity audit gate and adds the Expo dependency gate; these are not expected to pass until dependency remediation is completed.

GitHub API authentication was unavailable, so remote Actions status and repository settings were not verified. SSH transport is used for source publication/readback. Physical-device SQLCipher execution, native release builds, encrypted domain persistence, sync, receipts, and production login activation are not completed by this migration.

## Local-only files

Generated native directories, node_modules, build output, Expo cache, local environment files, and credentials are excluded. The original checkout's ignored local files are archived locally at `/home/ubuntu/project/.cito-mobile-pre-split-local` (owner-only directory), not copied into Git. Regenerate native projects from the preserved config/plugins; securely configure any needed local environment variables in the new checkout.

## Rollback

Keep cito-mobile available before removing source mobile paths. Revert the cito-petcare removal commit to restore the former monorepo layout. No backend data migration, EAS identity replacement, force-push, or production redeployment is involved.
