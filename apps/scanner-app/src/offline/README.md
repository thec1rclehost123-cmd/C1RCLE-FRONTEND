# Offline scanning engine

Lets a scanner admit tickets with no signal. **This module is not wired into the scan screen yet**; today `app/(tabs)/scan.tsx` still refuses entry when offline. Nothing here changes app behaviour until it is.

The protocol, threat model and limits are specified server-side in `C1RCLE-BACKEND/docs/operations/offline-scanning.md`. `crypto.test.ts` holds known-answer vectors produced by the backend: if they fail, this device and the server disagree about which tickets are genuine.

| File          | Job                                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `crypto.ts`   | Rotating-QR check and Ed25519 manifest verification (`@noble/*`, pure JS, no native module). Holds no server secret.                   |
| `manifest.ts` | Validates a fetched manifest: schema, event, signature, pinned key id, expiry. Returns an indexed `VerifiedManifest`.                  |
| `decision.ts` | The pure admit/deny decision. Bare ids are refused offline (nothing to verify).                                                        |
| `scanLog.ts`  | Persistent log of offline admissions behind a `KeyValueStore`. Keeps counting settled seats until a new manifest replaces the old one. |
| `scanner.ts`  | `OfflineScanner`: serialises scans so two reads cannot both take the last seat.                                                        |
| `sync.ts`     | Pushes pending scans in batches of 500 with a stable idempotency key; failures keep everything pending.                                |

## To wire it in (follow-up work)

1. **Persistent storage.** `KeyValueStore` needs a real implementation. `expo-secure-store` is too small for a manifest (platform value limits), so use a file or SQLite store and keep any at-rest encryption key in SecureStore. The manifest holds per-ticket keys: treat it like a session token.
2. **Fetch** `GET /door/offline-manifest` while online, run it through `loadManifest` with the event id and the key id pinned for that event, then call `log.settleForNewManifest()`.
3. **Scan screen.** When `Network.getNetworkStateAsync()` says offline (the branch at `scan.tsx` "Scanner offline") and a verified manifest exists, call `OfflineScanner.scan` and show the result as an _offline_ admission. Gate this behind a setting that defaults off: allowing offline entry is a venue risk decision.
4. **Sync** on reconnect with `syncOfflineScans`, send `POST /door/offline-sync` with the `Idempotency-Key` header, and show `log.openConflicts()` to the operator.

## Limits (by design)

Offline devices cannot see refunds or voids until they sync; two offline gates can both admit the same ticket, and the server reports the second as a conflict at sync; a couple ticket admits one seat per scan offline (no confirmation step).
