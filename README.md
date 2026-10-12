# Cito Mobile

Expo / React Native client for Cito Petcare. Mobile development now lives in **fandykun/cito-mobile**; the website, Go API, PostgreSQL migrations, deployment infrastructure, and authoritative OpenAPI contract remain in **fandykun/cito-petcare**.

## Layout and status

- `apps/mobile`: existing Expo app, assets, strict TypeScript, tests, authentication foundations, online Inventory/Finance readers, and synthetic review screens.
- `prototype/web`: synthetic Vite/React mobile-design reference, not the production website.
- `docs/figma-alignment.md`: mobile visual/interaction status.
- `docs/runbooks/android-sqlcipher-validation.md`: outstanding physical-device storage validation.
- `docs/prd.md`, `docs/erd.md`, and `.hermes/plans/cito-petcare-mvp-execution.md`: product/architecture and execution-history snapshots retained from the split. Consult the backend repository for current server contracts and later architecture decisions.

The app still opens synthetic UI review without a login route gate. This migration does not activate production authentication, encrypted domain persistence, sync, or offline receipts. Do not expose real clinic data until their existing release gates pass.

## Prerequisites

Node.js 22 and npm 10.9.4 (the lockfile and CI use this npm version).

## Run the production mobile shell

The mobile workspace validates these optional public variables:

- `EXPO_PUBLIC_APP_ENV`: `development` (default), `preview`, `production`, or `test`.
- `EXPO_PUBLIC_API_URL`: absolute HTTP(S) API URL. It is required and must use HTTPS for production builds.

### Quick start with Expo Go

Expo Go is the fastest way to inspect the current JavaScript UI on a physical Android or iOS device. Install [Expo Go](https://expo.dev/go) on the phone, then install dependencies and start Metro from the repository root:

```bash
npm ci
npm run mobile:start
```

Keep the terminal running and scan the displayed QR code from Expo Go on Android or from the iOS Camera app. The computer and phone must be on the same local network, and the firewall must allow inbound TCP traffic to Metro (port `8081` by default).

If LAN discovery is blocked, or the phone is on a different network, use Expo's tunnel transport instead:

```bash
npm run mobile:start -- --go --tunnel
```

The tunnel is for development only. Keep the command running while testing, do not share its URL publicly, and press `Ctrl+C` when finished. If Metro has stale state, restart it with `npm run mobile:start -- --go --tunnel --clear`.

Expo prompts to install `@expo/ngrok` the first time tunnel mode is used. If that global install fails because the system npm directory is not writable, install it under the current user's home directory and start Expo with the same npm prefix:

```bash
npm install --global --prefix "$HOME/.local" @expo/ngrok@^4.1.0
PATH="$HOME/.local/bin:$PATH" NPM_CONFIG_PREFIX="$HOME/.local" \
  npm run mobile:start -- --go --tunnel
```

The app currently opens the synthetic review dashboard, not the login screen. Setting `EXPO_PUBLIC_API_URL` alone does not replace demo records with database data or enable login. Authentication foundations and an authenticated read-only inventory path exist, but route-guard reactivation and production integration remain unfinished. Once those gates are restored, configure a phone-reachable API URL before starting Metro:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:8080 npm run mobile:start -- --go
```

Replace `192.168.1.20` with the development computer's LAN address. Do not use `localhost` or `127.0.0.1`: on a physical phone those addresses point to the phone itself. The API currently binds to `127.0.0.1:8080` by default, so full device login also requires deliberately binding or proxying the API to an interface reachable by the phone. Never expose the development API directly to the public internet.

Expo Go does **not** include this project's SQLCipher-enabled native SQLite module. It is suitable for checking the synthetic review UI, but encrypted-database testing requires the custom development build described below.

### Local development commands

Run commands from the repository root unless noted otherwise:

```bash
# Install exactly the dependency versions in package-lock.json.
npm ci

# Start Metro for a device on the same network.
npm run mobile:start -- --go

# Start Metro through an Expo tunnel.
npm run mobile:start -- --go --tunnel

# Start the web target in a browser (not a native-runtime substitute).
npm run web --workspace @cito-petcare/mobile
```

Useful Metro shortcuts are printed in the running terminal. Press `r` to reload the app, `j` to open the debugger, and `Ctrl+C` to stop the server.

Run its quality gates:

```bash
npm run mobile:typecheck
npm run mobile:lint
npm run mobile:test
npm run mobile:export:android
```

Unauthenticated review screens contain synthetic records and in-memory edits; those edits do not survive a restart or synchronize across modules. With a valid online session, Inventory and Finance switch to authenticated server-backed views. Finance supports read-only summaries and reconciliation previews but not persisted mobile writes. The diagnostics screen exposes only safe app/environment metadata.

### Native encrypted-storage development

The mobile app is configured to compile Expo SQLite with SQLCipher. SQLCipher is not available in Expo Go, so encrypted-storage work requires a native development build.

Generate the ignored Android native project and verify the config plugin locally:

```bash
npm run mobile:prebuild:android
```

Build an installable Android development client through EAS after authenticating Expo CLI:

```bash
npm run mobile:build:development:android
```

Run EAS commands from `apps/mobile`. See [`docs/architecture-decisions/0001-encrypted-local-database.md`](docs/architecture-decisions/0001-encrypted-local-database.md) for the adapter decision and native validation gates. After installing the development APK, follow the [Android SQLCipher physical-device validation runbook](docs/runbooks/android-sqlcipher-validation.md); Expo Go and build logs are not runtime proof.


## Design reference

```bash
npm run prototype:dev
npm run prototype:build
```

Do not add credentials, real clinic data, or production business logic to this prototype.

## EAS continuity

The Expo app remains at `apps/mobile`. Its slug, owner, EAS project ID, Android package, iOS bundle identifier, URL scheme, and native plugins are unchanged. Run EAS commands from that directory. Generated native projects, dependency directories, build artifacts, and local secrets are not migrated or tracked; regenerate with `npm run mobile:prebuild:android` when needed.

## API ownership

The backend repository owns `api/openapi.yaml`, the PRD/ERD, server-side security, and migrations. This repository consumes that existing API through `EXPO_PUBLIC_API_URL`; it does not introduce another backend or copy backend credentials. Coordinate contract changes across both repositories, keeping old mobile builds compatible or versioning breaking contracts explicitly.

## CI

GitHub Actions performs clean installation, mobile typechecking/lint/tests, Android export, Expo dependency checks, prototype build, and a high-severity production dependency audit. Physical-device SQLCipher and release-build validation remain separate gates.
