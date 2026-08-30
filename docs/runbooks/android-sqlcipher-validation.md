# Android SQLCipher physical-device validation

Use this runbook only with the Cito Petcare EAS **development** build. Expo Go does not contain the SQLCipher-enabled native SQLite module.

## Safety rules

- Use a new temporary test key containing 12–256 printable characters.
- Do not use or share a production password, API token, database key, or clinic credential.
- Do not paste the temporary key into logs, screenshots, issues, or chat.
- The proof database contains synthetic rows only and is separate from the future clinic database.
- Do not mark the storage gate complete from build logs, APK inspection, Expo Go, or JavaScript tests alone.

## Prerequisites

1. Install the EAS development APK on a physical Android device.
2. Start Metro from the Expo app directory:

   ```bash
   cd apps/mobile
   npm run start -- --dev-client --tunnel
   ```

3. Open the installed Cito Petcare development client and connect it to the Metro session.
4. From any tab, open the settings icon in the header.
5. Select **Open native encrypted-storage verification**.

## Required sequence

Perform these steps in order with the same temporary key:

1. Enter the temporary key and select **Reset and initialize encrypted database**.
2. Require the status **Initialization and rollback checks passed**.
   - Confirm the result shows a nonempty SQLCipher version.
   - Record the synthetic restart marker without recording the key.
3. Force-stop Cito Petcare from Android app settings. Do not merely navigate away.
4. Relaunch the development client, reconnect to Metro, return to the encrypted-storage verification screen, and re-enter the same temporary key.
5. Select **Verify reopen after app restart**.
6. Require the status **Correct-key reopen check passed**.
   - Confirm the recovered marker exactly matches the marker from step 2.
7. Select **Verify wrong-key rejection**.
8. Require the status **Wrong-key rejection passed**.

The initialization action also runs an intentionally failed exclusive transaction and verifies that neither its synthetic domain row nor outbox row remains.

## Acceptance checklist

- [ ] Android development build installed and launched on a physical device.
- [ ] `PRAGMA cipher_version` returned a nonempty SQLCipher version.
- [ ] Fresh encrypted migration completed.
- [ ] Failed domain/outbox transaction left no rows.
- [ ] Correct key reopened the database after a real force-stop/relaunch.
- [ ] Recovered marker matched the initialized marker.
- [ ] Derived wrong key could not query the database.
- [ ] No raw native error, key, SQL, or clinic data appeared in the UI or logs.

If any step fails, leave ADR 0001 and the execution-plan gate open. Report only the failed step, safe status title, app/build version, Android version, and device model; never include the key or raw database error.
