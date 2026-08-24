# ADR 0001: Use Expo SQLite with SQLCipher

- **Status:** Accepted for native validation
- **Date:** 2026-08-24
- **Scope:** Mobile encrypted local database foundation

## Context

Cito Petcare is offline-first and stores medical records on-device. The local database must therefore be encrypted at rest, support transactional domain and outbox writes, and build through Expo's Android and EAS workflows.

The original architecture named WatermelonDB or OP-SQLite as candidates. Since that architecture was written, Expo SDK 57's first-party `expo-sqlite` package added documented SQLCipher support for Android, iOS, and macOS through its config plugin.

## Decision

Use `expo-sqlite` with the config plugin option `useSQLCipher: true`.

The application will:

1. Compile SQLCipher into native development and release builds through Expo Continuous Native Generation.
2. Apply `PRAGMA key` immediately after opening a connection and before any schema or data query.
3. Keep the encryption key outside source code and public Expo environment variables. Secure key provisioning/storage will be implemented with the authentication foundation; the spike accepts an ephemeral operator-entered test key only.
4. Use exclusive transactions when a domain write and outbox write must commit atomically.
5. Treat database-open and key failures as explicit locked/error states without exposing SQL, keys, or medical values.

## Why this option

- It is maintained in the Expo SDK already used by the app.
- It has a built-in config plugin, reducing custom native configuration.
- Its SQLCipher behavior and `PRAGMA key` flow are documented by Expo.
- Its asynchronous query, prepared-statement, migration, and exclusive-transaction APIs cover the planned offline repository layer.
- It avoids an additional native database bridge and the OP-SQLite documentation's known SQLite compilation conflicts.

## Native-build implications

- SQLCipher is **not supported in Expo Go**.
- Enabling or changing `useSQLCipher` requires a new native binary.
- Development uses `expo-dev-client` with either `npx expo run:android` or an EAS development build.
- EAS commands must run from `apps/mobile` because that directory is the Expo app root.
- The repository keeps generated `android/` and `ios/` directories untracked and uses Expo CNG.

## Validation gates

This decision is not considered proven until a real Android native build demonstrates all of the following:

- a migration creates the spike schema;
- the correct key reopens the database after closing the original connection;
- the wrong key cannot read schema or data;
- a failed exclusive transaction leaves neither its domain row nor outbox row;
- the database reports SQLCipher support from the native runtime;
- an Android development build completes.

If any gate fails, revisit this ADR before building domain repositories.

## Current environment limitation

The development host does not currently have Java or the Android SDK installed, and EAS CLI is not authenticated. Native runtime validation therefore requires provisioning the local Android toolchain or authenticating EAS before the spike can be marked complete.

## References

- [Expo SQLite documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS build configuration](https://docs.expo.dev/build/eas-json/)
- [OP-SQLite installation and conflict notes](https://op-engineering.github.io/op-sqlite/docs/installation)
