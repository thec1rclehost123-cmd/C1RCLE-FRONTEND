# Founder Tasks — Backend Phase 5 completion + unblock the frontend interns

**Who:** you + co-founder. Two tasks, one each. **Repo: `C1RCLE-BACKEND` @ `main`.**
(The 3 interns are on `C1RCLE-FRONTEND` — see `INTERN-TASKS-2026-08-27.md`. They
never touch the backend; you own it.)

**Why these two:** the frontend auth slice (Phases 3–8) has exactly one hard
backend dependency — onboarding document upload — and backend Phase 5 still has
six honest-501 routes + two boundary/debt items ("Track G"). Founder A clears the
frontend blocker then takes the scanner-side gaps; Founder B takes the
wallet/stats/payments side. The two task sets touch different domains, so you
don't collide.

**Priority:** Founder A **Task A1 first** — it is the only thing blocking an
intern (Track 3, onboarding wizard step 3). Everything else is Phase 5 cleanup
that does not block the frontend slice; do it in parallel, any order.

---

## Ground rules (both founders)

- **`C1RCLE-BACKEND` has NO git hooks.** Run the full suite by hand before every
  push:
  ```
  cd C1RCLE-BACKEND && NODE_OPTIONS=--dns-result-order=ipv4first pnpm check
  ```
  (typecheck + lint + test + contract-parity + boundaries). Green or don't push.
- Branch off `main`, small commits, `git pull --rebase origin main` before push,
  **never `--force`, never `--no-verify`**.
- **Do not change the shapes the interns are building against.** The live wire
  contract is frozen for this slice: **bare-DTO success**, **flat error envelope**
  `{ code, message, status, requestId, fieldErrors? }` with **lowercase**
  `ApiErrorCode`, `/api/v2/auth/*` as-is, `Session.expiresAt` / `AdminAuditRecord.occurredAt`
  in **epoch ms**, every other timestamp **ISO-8601**, money in **integer paise**.
  New endpoints/schemas are fine; editing an existing one the interns consume is
  not — coordinate first.
- **Modular monolith stays intact** (master prompt §5): thin route
  (validate → auth → policy → one service call → serialize), all logic in
  `packages/core/src/application/**`, all storage behind
  `packages/core/src/domain/ports/repositories.ts` interfaces, both a **memory**
  and a **firestore** adapter for every new port, contracts backend-owned in
  `packages/contracts/src/`.
- **New contract schema → run the exporter and tell the interns:**
  ```
  node scripts/export-contracts.mjs --frontend ../C1RCLE-FRONTEND
  ```
  Then they `git pull` on `staging` and `pnpm --filter @c1rcle/contracts build`.
- **Shared-file coordination:** `packages/contracts/src/contracts/*` (A adds
  `onboarding.ts` fields, B adds `phase5.ts` / a cover-wallet status) —
  different files, but rebase carefully. `packages/core/src/application/index.ts`
  and `.../domain/index.ts` barrels — append your exports, don't reorder.
  `apps/api-gateway/src/routes/v2/route-manifest.ts` — one line each, rebase.
- Register every new route in `route-manifest.ts` (the manifest test fails
  otherwise). A route that isn't ready ships as an **honest 501 with a specific
  message**, never a fake 200 — same standard as the existing stubs.

---

## FOUNDER A — Onboarding document upload, then scanner-side Phase 5 gaps

### Task A1 — Signed-URL issuing for onboarding KYC documents ⟵ do this first

**The gap:** `POST /api/v2/onboarding/applications/:requestId/documents` already
exists and takes `{ label, storagePath }` — but a browser has no way to _get_ a
`storagePath` or push bytes anywhere. Track 3's onboarding wizard step 3 is
stubbed purely because of this.

1. **Storage port** — `packages/core/src/domain/ports/object-storage.ts` (new; add
   to the `repositories.ts` barrel or its own port file, match the existing
   convention):
   ```ts
   export interface ObjectStoragePort {
     issueUploadUrl(input: {
       key: string; // e.g. kyc/{userId}/{applicationId}/{label}
       contentType: string; // must be image/jpeg | image/png | image/webp
       maxBytes: number; // enforce ≤ 5 * 1024 * 1024
     }): Promise<{
       uploadUrl: string; // the signed PUT URL
       method: 'PUT';
       headers: Record<string, string>; // content-type the client must echo
       storagePath: string; // what the client passes back to .../documents
       expiresAt: string; // ISO-8601, ~10 min out
     }>;
   }
   ```
2. **Adapters:**
   - `packages/core/src/infrastructure/memory/…` — returns a fake
     `uploadUrl` (a `data:`/loopback placeholder) and a deterministic
     `storagePath`; the memory driver never actually stores a blob. Enough for
     the interns' local dev and the E2E happy path.
   - `packages/core/src/infrastructure/firestore/…` (or a sibling GCS module) —
     real `@google-cloud/storage` v4 `getSignedUrl({ version: 'v4', action:
'write', expires, contentType })` against the KYC bucket. Reuse the
     Firebase creds wiring already in `getFirestoreClient` / the app config
     (`config.firebase*`). Bucket name from config, not hardcoded.
3. **Service** — `OnboardingService.issueDocumentUploadUrl(input, actor)` in
   `packages/core/src/application/onboarding/…`:
   - load the application, `requireOrgAccess` is N/A (onboarding is
     session-scoped) → check the application belongs to `actor.userId`.
   - `label` ∈ `id_front | id_back | selfie`; reject others.
   - build `key = kyc/${actor.userId}/${application.id}/${label}` and delegate to
     the port. ≤ 5 per applicant per label (mirror the `verify-document` ≤5 cap
     style).
4. **Contract schemas** — `packages/contracts/src/contracts/onboarding.ts`:
   ```ts
   export const documentUploadUrlRequestSchema = z
     .object({
       label: onboardingDocumentLabelSchema, // reuse the existing label enum
       contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
     })
     .strict();

   export const documentUploadUrlDtoSchema = z
     .object({
       uploadUrl: z.string().url(),
       method: z.literal('PUT'),
       headers: z.record(z.string()),
       storagePath: z.string().min(1),
       expiresAt: z.string().datetime(),
     })
     .strict();
   ```
5. **Route** — `apps/api-gateway/src/routes/v2/onboarding.ts`:
   `POST /onboarding/applications/:requestId/documents/upload-url` —
   `validateV2({ params, body: documentUploadUrlRequestSchema })`, `AUTH` rate
   class, `Idempotency-Key` **not** required (it's a URL mint, not a mutation),
   one `services.onboarding.issueDocumentUploadUrl(...)` call, serialize via
   `documentUploadUrlDtoSchema`. Register in `route-manifest.ts`.
6. **Tests** — `apps/api-gateway/src/routes/v2/onboarding.test.ts`: happy path
   returns a URL + `storagePath`; wrong `label` → 422; another user's
   application → 403/404; then `POST .../documents` with the returned
   `storagePath` succeeds and `POST .../submit` clears "missing documents".
7. **Export + notify:** `node scripts/export-contracts.mjs --frontend
../C1RCLE-FRONTEND`, ping the interns, add one line to
   `docs/superpowers/plans/2026-08-27-auth-foundation-plan.md` "Deferred /
   follow-up" marking the backend item done.

**Gate:** `pnpm check` green; a fresh onboarding application can go
type → profile → upload-url → PUT (memory: skip) → documents → submit → approved
entirely through `/api/v2`.

### Task A2 — `POST /door/override` + `GET /door/offline-manifest` (Track G)

Both are honest 501s in `apps/api-gateway/src/routes/v2/door/scanner-routes.ts`
(~line 372 and ~line 399) because they need a domain decision, not route wiring.

- **`/door/override`** — decide what an override _persists_. Recommended: a new
  `overridden` terminal state on `ScanLedgerStatus`
  (`packages/core/src/domain/models/scan-ledger.ts`) with a `denied → overridden`
  FSM transition that records `overriddenBy` (actor) + `reason` + a link to the
  denied scan — **not** a fake `denied → consumed`. Add
  `ScannerService.overrideScan(input, actor)` (requires `ticket.override`, org
  check via the scanner session), wire the route, serialize, test the FSM guard
  (can't override an already-consumed scan).
- **`/door/offline-manifest`** — only ship this if you also ship the _verifying_
  side. An HMAC-SHA256 manifest signed with `config.magicTicketSecret` (or a new
  `config.offlineManifestSecret`), and `syncOfflineScans` /
  `POST /door/offline-sync` **rejects** a manifest whose signature doesn't verify.
  If you can't close both sides this pass, leave the 501 and tighten its message
  — a one-sided signature is security theater.

**Gate:** the two `scanner-routes.test.ts` cases that currently assert `501`
(~line 244, ~line 256) are rewritten to assert the real behavior; `pnpm check`
green; `door` suite green.

---

## FOUNDER B — Cover-wallet freeze/unfreeze, door stats, payment boundary, lint debt

### Task B1 — Cover-wallet `freeze` / `unfreeze` (Track G)

Honest 501s in
`apps/api-gateway/src/routes/v2/door/cover-wallet-routes.ts` (~line 301 and
~line 323) — no service method exists.

1. `CoverWalletStatus` (`packages/core/src/domain/models/cover-wallet*.ts`) gains
   `frozen`. Allowed transitions: `active → frozen`, `frozen → active`. `frozen`
   is **not** terminal (unlike `terminated` / `closed`).
2. `CoverWalletService.freezeWallet(input, actor)` /
   `unfreezeWallet(input, actor)` in
   `packages/core/src/application/cover-wallet/cover-wallet-service.ts`:
   - `requireOrgAccess(actor, wallet.organizationId)` (the IDOR fix in
     `runReconciliation` at `22c073e` is the pattern — match it).
   - `freezeWallet`: only from `active`; reversible; **no balance change**.
   - `unfreezeWallet`: only from `frozen`.
   - `charge` / `topUp` / `runReconciliation` reject with a domain error while
     `frozen` (add the guard).
3. Wire both routes (`STANDARD_COMMAND` rate class, `walletIdParam` already
   there), serialize the wallet DTO.
4. Contract: add `frozen` to the cover-wallet status schema in
   `packages/contracts/src/contracts/` (this one the interns don't consume yet,
   but export it anyway for parity).
5. Tests in `cover-wallet-routes.test.ts` — the case at ~line 190 that asserts
   "freeze/unfreeze stay honest 501s" is rewritten; add: freeze then charge →
   rejected; freeze then unfreeze → charge works; double-freeze → conflict.

### Task B2 — `GET /door/stats` (+ `/door/stats/ws`) (Track G)

Both honest 501s in `apps/api-gateway/src/routes/v2/phase5-routes.ts`.

- **`GET /door/stats`** — a read model aggregating, for an event (org-scoped):
  scans (total / consumed / denied) from the scan ledger, door-sale count +
  gross from door-sale records, cover-wallet balance/txn totals. New
  `ScannerService` (or a small `DoorStatsService`) read method + a
  `doorStatsDtoSchema`. `AUTH_READ` rate class, org check.
- **`GET /door/stats/ws`** — needs `@fastify/websocket` registered on the app
  (it isn't). Either register it + push `door/stats` deltas on an interval, or
  keep this one a **documented 501** and ship only the polling `GET /door/stats`.
  Recommended: ship the polling endpoint now, leave `/ws` as a tighter 501.

**Gate:** `phase5-routes.ts` no longer returns a bare `{ error: '...' }` for
`/door/stats` (that shape isn't even the flat error envelope — fix it);
`pnpm check` green.

### Task B3 — Fix the `razorpay-adapter.ts` boundary violation

`packages/core` currently has one `pnpm boundaries` violation: a raw `fetch()` in
the Razorpay adapter. `packages/core` must not do I/O directly.

- Introduce an `HttpClientPort` in `domain/ports/` (`request(input): Promise<…>`),
  inject it through `ServiceDeps`, and have the adapter call the port. The real
  `fetch`-backed impl lives in `apps/api-gateway/src/infrastructure/`; the memory
  driver gets a stub. **Or** move the whole Razorpay adapter out of
  `packages/core` into `apps/api-gateway/src/infrastructure/payments/` if nothing
  in core's domain layer needs it.
- **Gate:** `pnpm boundaries` in `C1RCLE-BACKEND` goes fully green (0 violations).

### Task B4 — Stop the `@c1rcle/core` `any` bleed

`@c1rcle/core` has ~909 pre-existing `no-explicit-any` lint errors. Don't try to
clear them this sprint — **ratchet**:

- Turn `@typescript-eslint/no-explicit-any` to `error` (not `warn`) for
  `packages/core/src/**` and add the current offenders to an
  eslint override / `eslint-disable` inventory file, so **new** code can't add
  `any` while the existing debt is tracked. (Or wire a count-based ratchet in
  `tooling/scripts/`.)
- Then clear the top ~50 in the domain layer (`packages/core/src/domain/**`
  first — that's the part the contracts are inferred near).
- **Gate:** a new `any` in a fresh core file fails `pnpm lint`; the tracked count
  only goes down.

---

## Merge / sequencing

```
A: Task A1 (upload-url) ──► export-contracts ──► ping interns   [PRIORITY]
A: Task A2 (override + manifest)          ─┐
B: Task B1 (freeze/unfreeze)              ─┤  parallel, independent,
B: Task B2 (door stats)                   ─┤  any order, each its own
B: Task B3 (razorpay boundary)            ─┤  small PR rebased on main
B: Task B4 (any ratchet)                  ─┘
```

Nothing here blocks the interns except A1. After A1 lands, the frontend slice
(Phases 3–8) and backend Phase 5 completion proceed fully in parallel and meet
at the frontend's Phase 8 E2E — which will then exercise the real
upload-url → PUT → documents → submit path end to end.

## Local dev

```
cd C1RCLE-BACKEND/apps/api-gateway
# .env.local: STORAGE_DRIVER=firestore + thec1rcle-india Firebase creds
#   (creds: thec1rcle/apps/api-gateway/.env.development — disposable dev sandbox)
NODE_OPTIONS=--dns-result-order=ipv4first pnpm dev      # :8080
```

Memory driver (`STORAGE_DRIVER=memory`) is fine for unit work and fabricates a
dev actor; the signed-URL and auth paths need `firestore`.
