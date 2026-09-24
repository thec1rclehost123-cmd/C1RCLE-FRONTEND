# ADMIN-CONSOLE GAP-CLOSURE — Handoff Plan (2026-09-11)

Authors: session agent + any successor agent.
Scope authority: `docs/admin-console/ADMIN-CONSOLE-PLAN-2026-09-11.md` (the plan this closes out).
Companion doc: `C1RCLE-BACKEND/docs/roadmap/phase-07-admin-console.md` (roadmap; note: its "status" line is stale — Phase 2/6 work has landed, mark Phase 3 items DONE as you ship them).

> **Status (updated 2026-09-11 night):** ALL backend and frontend gaps are closed and
> verified. Backend `pnpm check` fully green on `admin-payout-controls` (format/lint/
> typecheck/boundaries/contract-parity 63/test 348 passed/build). Frontend on
> `sync-contracts-admin-payouts` green: `@c1rcle/api-client` grew a `fetchText` raw-text
> GET (auth/retry/timeout same as JSON calls) for the CSV export; admin-console
> lint/typecheck/test/build all pass with the new Payouts/Venues/Events/Users/Hosts desks,
> suspend + freeze/release/batch-run + audit CSV button wired. Two merge branches remain:
> `admin-payout-controls` → `staging` and `sync-contracts-admin-payouts` → `staging`
> (report to the user; do not merge without explicit request). Deferred list unchanged.

> **Start here.** This doc is the single source of truth for closing the V2 Admin
> Console gaps. It records verified facts (what exists, what does not), the exact
> per-file implementation plan, patterns to mirror, and the verification gates.
> Read it top-to-bottom before touching code; re-read the "Open questions" and
> "Decisions" sections before each step.

---

## 1. Current state (verified 2026-09-11)

### Repos & branches

| Repo     | Path               | Branch                         | HEAD      | Meaning                                                                      |
| -------- | ------------------ | ------------------------------ | --------- | ---------------------------------------------------------------------------- |
| Backend  | `C1RCLE-BACKEND/`  | `admin-payout-controls`        | `8f5f429` | Contains refunds merge (PR #32 `526ca98`) + payouts freeze/release/batch-run |
| Frontend | `C1RCLE-FRONTEND/` | `sync-contracts-admin-payouts` | `3bdb6ce` | Last commit = "chore(contracts): sync generated contracts from backend"      |

Merges still REQUIRED for production: `admin-payout-controls` → `staging`, and
`sync-contracts-admin-payouts` → `staging`. Payout backend routes work locally on
the current checkout already.

### Tools / constraints that apply

- Backend tooling is **pnpm** (Node >= 22 required; machine default may be lower —
  check `node -v` first, use a Node 22+ runtime/shell for backend commands).
- Frontend tooling is **npm** workspaces + Turbo.
- **Wire contract is FROZEN**: bare DTOs, `{ items, pageInfo }` list envelope,
  flat error envelope, `X-Organization-Id` header, `Idempotency-Key` header,
  money in **paise**, AdminAudit timestamps in **epoch ms**.
- **Contracts package is backend-owned.** Frontend consumes a GENERATED mirror
  (`<frontend>/packages/contracts/src/**`). Never hand-edit the mirror — change it
  in `C1RCLE-BACKEND/packages/contracts/src` and re-run the sync script.
- Layering rules (enforced by `packages/core` boundary check):
  - `packages/core` must NEVER import `fastify`, `process.env`, or `firebase-admin`.
  - Routes are thin: validate → auth → policy → **ONE** service call → serialize.
  - Routes never call `.collection()`; they use services (which use repositories).
- `code-review-graph` is NOT built (no `.code-review-graph/graph.db`) — do NOT rely
  on MCP graph tools; use grep/glob/read (see AGENTS.md caveat about stale graphs).

### Existing admin backend surface (all in `apps/api-gateway/src/routes/v2/admin/`)

| File                   | Registers (Route manifest: `apps/api-gateway/src/routes/v2/route-manifest.ts`)                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onboarding-review.ts` | proposals raise/approve/reject/cancel + `:id/provision-admin`, admins list/revoke, audit list (+`targetId`), onboarding queue/detail/approve/reject/request-changes — **read was truncated ~line 45; finish reading before editing** |
| `refunds.ts`           | refund requests list/approve/reject/detail                                                                                                                                                                                           |
| `payouts.ts`           | `:proposalId/freeze-payout`, `:proposalId/release-payout`, batch-run, list (`?status=`), detail                                                                                                                                      |

All are walled by `AdminAuthorityService.authorize`/`requireAdmin` inside the
service layer (routes carry no `requirePermission`). Dual control runs through
`ProposedAction` proposals + `adminActionSchema`.

### Backend service layer (verified)

- `packages/core/src/application/admin/admin-authority-service.ts` — public methods:
  `requireAdmin`, `authorize`, `record(admin, AuditInput)` (writes ANY action string —
  usable for a non-proposal audit entry like `ADMIN_EXPORT`), `listAudit`,
  `listAuditForTarget`, `propose`, `approve`, `reject`, `cancel`, `listProposals`,
  `getProposal`, `listAdmins`, `provisionAdminFromProposal`, `revokeAdmin`,
  `needsDualControl`.
- `packages/core/src/application/finance/admin-payout-service.ts` — resolver pattern
  to MIRROR for venue suspend: `freezePayoutFromProposal(adminUserId, proposalId)`,
  `releasePayoutFromProposal(...)`, `runBatch(...)`, `listByStatus(...)`, `getPayout(...)`.
  Inspect this file first — it shows how a proposal is validated + executed + audited.
- `packages/core/src/application/finance/refund-service.ts` — `RefundService(deps, adminAuthority)`.
- `packages/core/src/application/admin/` currently has ONLY `admin-authority-service.ts`.

### Repository ports (verified line numbers in `packages/core/src/domain/ports/repositories.ts`)

- `Page<TItem>` (line 89: `{ items, total, nextCursor }`), `PaginationQuery` (line 96: `{ cursor?, limit }`).
- `OrganizationRepository` (105): has `getById`, `getBySlug`, `listForMember`, `listMembers`,
  `getMember`, `save`, `delete` — **NO global `listAll`**. (`organization.ts` model: `status` = `active | suspended | archived`, has `name`, `slug`, `kind`/capabilities nearby.)
- `VenueRepository` (177): `getById`, `getBySlug`, `getBySlugGlobal`, `listByOrganization`,
  `save` — **NO global `listAll`**. (`venue.ts` model: `status` = `active | suspended` — already supports suspend.)
- `EventRepository` (200): `getById`, `findById`, `getBySlug`, `listByOrganization`,
  `listByVenue`, `listPublic`, `save`, `delete` — `listPublic` is global but public-filtered;
  add a global `listAll` for the admin view (include unpublished).
- `PlatformAdminRepository` (324), `ProposedActionRepository` (331), `PayoutRepository` (687,
  has `listByStatus` — cross-org), `AdminRefundRequestRepository` (720, has `listByStatus`).
- **NO user/account repository port exists.** Users live in **Better Auth** → Firestore
  `user` collection (config in `apps/api-gateway/src/plugins/auth.ts`; verify collection
  name + fields — Better Auth default user fields: `id, name, email, emailVerified,
image, createdAt, updatedAt`).
- `AdminAuditRecord`/`AdminAuditRepository` in `packages/core/src/domain/ports/audit.ts` (36/60).

### Adapters (each new port method MUST ship BOTH implementations + registration)

- Memory: `packages/core/src/infrastructure/memory/memory-*.ts`, index `.../memory/index.ts`.
  There is already `memory-venue-repository.ts`? — NO; venue repo lives in `memory-repositories.ts`
  (big file). Same for organizations/events. Follow existing per-repo files where they exist.
- Firestore: `packages/core/src/infrastructure/firestore/firestore-venue-repository.ts`,
  `firestore-organization-repository.ts`, `firestore-event-repository.ts`, `firestore-*.ts`.
  Pagination helper: `packages/core/src/infrastructure/firestore/pagination.ts`.
- **Registration factory**: `packages/core/src/infrastructure/utils.ts` → `buildRepositories(gw)`
  (line 106) switches `STORAGE_DRIVER` between `new Memory*Repository()` and
  `new Firestore*Repository(firestoreClient(gw))`. Every new repo bound here too.
- Wiring entrypoint: `apps/api-gateway/src/lib/v2-services.ts` → `createV2Services()`,
  `PartnerV2Services` interface, memoized singletons. Add new services to the returned bundle.

---

## 2. Gap inventory — backend routes MISSING (build all in this order)

| #   | Endpoint                                          | Cost | Depends on                                                                                   | Notes                                                                                                   |
| --- | ------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | `GET /admin/venues` (platform list)               | Med  | VenueRepository.listAll                                                                      | New port method → 2 adapters                                                                            |
| 2   | `POST /admin/proposals/:proposalId/suspend-venue` | Med  | `VENUE_SUSPEND` action (ALREADY in `adminActionSchema`, contracts `onboarding.ts` ~line 253) | Mirror `admin-payout-service` resolver; venue.status → `suspended`; audit + dual control                |
| 3   | `GET /admin/events` (platform list)               | Low  | EventRepository.listAll (or listPublic)                                                      | Include drafts/unpublished for admin                                                                    |
| 4   | `GET /admin/hosts` (platform org list)            | Med  | OrganizationRepository.listAll                                                               | New port method → 2 adapters                                                                            |
| 5   | `GET /admin/users` (platform user list)           | High | NEW `UserAccountRepository` port + model + 2 adapters                                        | Read-only; fields id/email/name/createdAt/image                                                         |
| 6   | `GET /admin/audit/export.csv` (audited CSV)       | Low  | reuse `AdminAuthorityService.listAudit` + `.record(admin, { action: 'ADMIN_EXPORT', ... })`  | Respond `text/csv`; validate admin via `requireAdmin`; record an audit row; no JSON response validation |

**Explicitly deferred** (roadmap final phase — new collections; plan says future):
`EVENT_FORCE_PAUSE` action (needs contract enum change + full regen), Support/Safety
tickets (`v2_support_tickets`, `v2_safety_reports`), Settings, System Health, Vision
admin. Do NOT start these this milestone.

---

## 3. Frontend gaps (unblocked — all now DONE, see §5)

| Piece                                 | Where                                                                          | Status                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Payouts desk                          | `apps/admin-console/src/app/payouts/page.tsx` + `lib/admin/admin-api.ts`       | DONE — list + status filter + Run (TIER2) + Freeze/Release raise proposals         |
| Raise-a-proposal UI (dual control)    | proposals desk + `raiseProposal`                                               | DONE — payouts desk raises; proposals desk executes approved freeze/release        |
| Audit CSV download button             | audit desk                                                                     | DONE — `exportAuditCsv()` via api-client `fetchText` → blob download               |
| Venues / Events / Users / Hosts desks | `app/venues`, `app/events`, `app/users`, `app/hosts`                           | DONE — venues has direct TIER2 Suspend; others read-only lists                     |
| Nav + labels                          | `apps/admin-console/src/lib/app-meta.ts`; `format.tsx` tone maps               | DONE — 11 nav items; status labels/tones + `AUDIT_ACTION_LABELS`/`auditActionTone` |
| Contracts types                       | `apps/admin-console/src/lib/admin/contract-types.ts` (local `z.infer` aliases) | DONE — payout/venue/event/host/user status types                                   |

Frontend admin API client: `apps/admin-console/src/lib/admin/admin-api.ts` (repo fns
returning `{ data, error }`; uses `api.ts` fetch wrapper). Desks to copy as templates:
`app/refunds/page.tsx` (list + actions, newest), `app/onboarding/page.tsx`
(already has 3 typed mutations + `IN_REVIEWABLE`), `app/audit/page.tsx`.

---

## 4. Implementation plan — backend first (pnpm), in strict order

### Step 0 — Preflight (verify before editing)

- `node -v` ≥ 22; `pnpm -v`.
- Read fully: `onboarding-review.ts` (all of it), `payouts.ts`, `refunds.ts` +
  `refunds.test.ts` (test scaffolding pattern), `admin-payout-service.ts` (resolver pattern),
  `firestore/pagination.ts`, `memory-repositories.ts` (venue/event/org impls).
- Confirm Better Auth Firestore driver collection name + user doc fields
  (`apps/api-gateway/src/plugins/auth.ts`).

### Step 1 — Core domain additions (`packages/core/src`)

1. **`domain/models/platform-user.ts` (NEW)**: minimal `PlatformUser` model —
   `id`, `email`, `name`, `image?`, `emailVerified`, `createdAt`, `updatedAt` (match
   Better Auth user doc; timestamps as epoch ms to stay on-contract).
2. **`domain/ports/repositories.ts`**:
   - `OrganizationRepository` += `listAll(query): Promise<Page<Organization>>`
   - `VenueRepository` += `listAll(query): Promise<Page<Venue>>`
   - `EventRepository` += `listAll(query): Promise<Page<Event>>`
   - NEW `UserAccountRepository` interface: `listAll(query): Promise<Page<PlatformUser>>`.
3. **Memory**: add `listAll` to memory org/venue/event repos (in `memory-repositories.ts`
   or per-file repos) + NEW `memory-user-account-repository.ts` (in-process array seed).
4. **Firestore**: add `listAll` to `firestore-organization/venue/event-repository.ts`
   using `firestore/pagination.ts` helpers + NEW `firestore-user-account-repository.ts`
   reading the Better Auth `user` collection (READ-ONLY; map `lastSignedInAt`/timestamps
   to epoch ms).
5. **Exports**: `domain/index.ts`, `domain/ports/index.ts` (if barrel files exist) so
   `@c1rcle/core/domain` exposes `PlatformUser`, `UserAccountRepository`.
6. **`infrastructure/utils.ts` `buildRepositories`**: wire both branches for new repo
   - `ServiceDeps['repositories']` type (wherever defined) gains `users` (or `userAccounts`).

### Step 2 — Application service (`packages/core/src/application/`)

NEW `admin/admin-ops-service.ts` — `AdminOperationsService(deps, adminAuthority)`:

- `listVenues(userId, query)` — `authorize` (any admin) → `venues.listAll(query)`
- `listEvents(userId, query)` — → `events.listAll(query)`
- `listHosts(userId, query)` — → `organizations.listAll(query)`
- `listUsers(userId, query)` — → `users.listAll(query)`
- `listAuditExport(userId, limit)` — `requireAdmin` → adminAuthority.listAudit; then
  `adminAuthority.record(admin, { action: 'ADMIN_EXPORT', targetType: 'audit_log',
targetId: admin.id, reason: 'csv export of admin audit log', before: null, after: { limit } })`
- `suspendVenue(userId, venueId)` — `authorize(userId, 'VENUE_SUSPEND')` → load venue →
  domain `suspendVenue(venue, now)` (TIER2 direct — the domain model grants `VENUE_SUSPEND`
  to a single ops/finance/admin/super admin; only TIER3 actions require dual control;
  `proposeAction` refuses lower tiers with 400). Short-circuits when already suspended
  (no CAS version bump). Audits before/after. Export service + types from `application/index.ts`.

### Step 3 — Wire services (`apps/api-gateway/src/lib/v2-services.ts`)

Add `adminOps: AdminOperationsService` to `PartnerV2Services`, construct
`new AdminOperationsService(deps, adminAuthority)`, return it in the bundle.

### Step 4 — Route files (`apps/api-gateway/src/routes/v2/admin/`)

- **`directory.ts` (NEW)**: `GET /admin/venues`, `GET /admin/events`,
  `GET /admin/hosts`, `GET /admin/users` — mirror `payouts.ts` style:
  `paginationQuerySchema.extend({ ... })`, `services.adminOps.*`, serialize to DTO ->
  `validateV2Response(...)` -> `{ ok: true, data }` via `{ items, pageInfo }` (follow the
  existing list route's envelope exactly — look at how `refunds.ts`/`payouts.ts` build
  `pageInfo`). PLUS `GET /admin/audit/export.csv`: `requireUserId`, `services.adminOps
.listAuditExport(...)`, `reply.type('text/csv')`, manual CSV serialization
  (escaping: quote fields containing `"`, `,`, newline), then send. Skip JSON validation.
- **`venue-actions.ts` (NEW)**: `POST /admin/venues/:venueId/suspend`
  — direct TIER2 command (mirrors `payouts.ts` `batch-run` command shape):
  rateLimit SENSITIVE_COMMAND, validateV2 params `{ venueId: opaqueIdSchema }` + idempotency
  headers, `runIdempotent`, → `services.adminOps.suspendVenue(userId, venueId)`.
  Returns 200 with the admin venue DTO (same shape as list items).
- **Register** both in `route-manifest.ts`.

### Step 5 — Contracts (`packages/contracts/src/`)

- Add to `contracts/` (best: `phase6.ts` or a new `admin.ts` file followed by the others):
  `adminVenueDtoSchema`, `adminEventDtoSchema`, `adminHostDtoSchema`, `adminUserDtoSchema`
  (+ `paginatedSchema(...)` wrappers — confirm the exported helper name in `contracts/`).
  Keep DTO fields minimal + epoch-ms timestamps + paise money.
- Export from the package `index.ts` (types + schemas) — the pattern used by
  `payoutResponseSchema` etc. (see `packages/contracts/src/index.ts` ~lines 280–310).
- Run `node scripts/export-contracts.mjs` (backend root, pnpm env) — syncs the
  GENERATED mirror into `C1RCLE-FRONTEND/packages/contracts/src`.

### Step 6 — Backend tests (Vitest, mirror `refunds.test.ts` scaffolding)

- `apps/api-gateway/src/routes/v2/admin/directory.test.ts`: build `buildPartnerTestServer`,
  register admin routes, `seedAdmin`, hit `x-user-id`-keyed requests; assert 401 without
  admin, 200 + envelope for each list, CSV content type + header row + recorded audit row.
  Also covers the suspend command: happy path + audit row, role below TIER2 → 403,
  repeat suspend idempotent → 200, unknown venue → 404. **Seed guard**: the audit repo is
  exposed as `services.adminAudits()` (NOT inside `services.repos()`); clear it via
  `(services.adminAudits() as unknown as { records: unknown[] }).records = []`.
- The suspend-command scenarios live inside `directory.test.ts` (single test server
  file per route group, matching repo convention).
- Any core-level service tests in `packages/core/src/application/admin/` for
  `suspendVenue` invariants if coverage demands.

### Step 7 — Backend verification (pnpm, backend root)

`pnpm check` (= format:check + lint + typecheck + boundaries + test + build). Fix to green.

---

## 5. Implementation plan — frontend (npm), after backend Step 5/7 DONE

1. DONE `pnpm --filter @c1rcle/contracts build` (mirror compiled; verified via turbo).
2. DONE `apps/admin-console/src/lib/admin/contract-types.ts`: `AdminPayoutStatus`, `EventStatus`,
   `HostStatus`, `VenueStatus` derived from synced schemas (`adminPayoutStatusSchema`,
   `eventStatusSchema`, `organizationStatusSchema`, `adminVenueDtoSchema['status']`).
3. DONE `apps/admin-console/src/lib/admin/admin-api.ts`: `listVenues/listEvents/listHosts/
listUsers`, `suspendVenue` (direct TIER2 POST /admin/venues/:venueId/suspend),
   `listPayouts`, `freezePayoutFromProposal/releasePayoutFromProposal` +
   `isPayoutProposalAction`/`executePayoutProposal`, `runPayoutBatch`, `exportAuditCsv`
   (`fetchText` on `/api/v2/admin/audit/export.csv` → blob download).
4. DONE `apps/admin-console/src/lib/app-meta.ts`: NAV = Overview/Proposals/Onboarding/Refunds/
   **Payouts/Venues/Events/Users/Hosts**/Admins/Audit (11 items; shell renders automatically).
5. DONE Desks (patterns from `refunds/page.tsx`):
   - `app/payouts/page.tsx` — status filter, Run (TIER2 batch-run, single payout), Freeze/
     Release raise a proposal (inline reason, required); freeze is proposed for runnable
     payouts, release for frozen; note links to Proposals for the second approval.
   - `app/venues/page.tsx` — table; **Suspend is a direct TIER2 command** (inline two-step
     confirm, no proposal — correct per §8 decision). Idempotent; repeat suspend is a no-op.
   - `app/events/page.tsx`, `app/users/page.tsx`, `app/hosts/page.tsx` — read-only tables.
   - Proposals desk: added "Freeze payout"/"Release payout" execute buttons on approved
     `PAYOUT_FREEZE`/`PAYOUT_RELEASE` proposals (via `executePayoutProposal`).
   - Audit desk: "Export CSV" button → `exportAuditCsv()` → blob download; action labels
     via `AUDIT_ACTION_LABELS` (handles backend-internal `ADMIN_EXPORT`) + `auditActionTone`.
6. DONE `format.tsx` — `PAYOUT_STATUS_LABELS/VENUE_STATUS_LABELS/EVENT_STATUS_LABELS/
HOST_STATUS_LABELS` + tone fns + `AUDIT_ACTION_LABELS`/`auditActionTone`.
7. DONE Verify — `npx turbo run lint typecheck test build --filter=@c1rcle/api-client
--filter=@c1rcle/app-admin-console` all green (19 tasks); `prettier --write` applied to
   all touched files.

---

## 6. Verification checklist (both repos)

- [ ] Backend `pnpm check` green (includes boundaries + contract-parity + build)
- [ ] `node scripts/export-contracts.mjs` run; frontend mirror shows GENERATED headers; no hand-edits
- [ ] Frontend `@c1rcle/contracts` build succeeds
- [ ] Frontend admin-console lint/type-check/test/build green; repo turbo green
- [ ] Route tests: lists 200 + envelope, CSV content-type + audit row, suspend flips status,
      403 on non-admin, dual control enforced
- [ ] No `process.env`/`fastify`/`firebase-admin` imports leaked into `packages/core`

## 7. Open questions (resolve BEFORE implementing the flagged item)

- [ ] Better Auth Firestore driver: exact `user` collection name + field names in THIS repo
      (`plugins/auth.ts`). Adjust `PlatformUser` model + firestore adapter mapping accordingly.
- [ ] Does `adminActionSchema` expose `VENUE_SUSPEND` payload as `{ venueId }`? confirm the
      proposal payload schema + the `resolve(...)` mechanism in `admin-payout-service.ts`.
- [ ] `GET /admin/hosts` semantics: list ALL orgs, or only `kind`/capability `host`? Default =
      all orgs (the desk can filter); decide with product if a capability filter is wanted.
- [ ] User list privacy: confirm only email/name/image/createdAt (no raw device data) — keep
      the DTO minimal and never expose `emailVerified` tokens or session data.

## 8. Decisions (recorded this session)

- OBEY the frozen wire contract; do NOT change existing DTO shapes.
- Money stays in **paise**; timestamps **epoch ms**.
- **Venue suspend is NOT dual-control.** `VENUE_SUSPEND` is TIER2: the domain model
  (`admin-authority.ts`) grants it to one ops/finance/admin/super admin and
  `requiresDualControl` is TIER3-only — `proposeAction` refuses lower tiers with 400.
  The plan's original "raise proposal → second admin approve → suspend" route was
  inconsistent with the model and corrected to a direct command.
- `EVENT_FORCE_PAUSE`, Support/Safety/Settings/System Health: deferred (roadmap final phase).
- `GET /admin/users` is READ-ONLY (no writes to Better Auth users from admin routes).
- CSV export is audited (writes an `ADMIN_EXPORT` audit record) — never silent.
- Frontend never hand-edits the contracts mirror; ALWAYS via export-contracts.mjs.
- Routes stay thin (ONE service call); policies live in the service; `requireAdmin` first
  in every admin service method (never infer authority from org role).

## 9. Handoff pointers (short version for a successor agent)

1. Backend #1–6 are DONE and green (see status note). Skip backend work.
2. Frontend is DONE and green (see status note + §5 markers). api-client `fetchText` added
   for the CSV export; contracts mirror is in sync (no contract edits since the last sync).
3. Report the two merge branches to the user when asked: `admin-payout-controls` (backend)
   and `sync-contracts-admin-payouts` (frontend), both → `staging`. Do NOT merge unprompted.
4. Ask the user before starting the deferred list (Support/Safety/Settings/Health,
   `EVENT_FORCE_PAUSE`).
5. Any new contract change → run `node scripts/export-contracts.mjs` from `C1RCLE-BACKEND`
   and re-verify `contract-parity` + the frontend turbo gates for touched packages.

## 10. Commander's intent

User explicitly approved: **"Everything incl. users & hosts."** Close every backend gap in
section 2 and every frontend gap in section 3 this milestone. Ship verified (gates green in
both repos), leave merges to the user's explicit request. Prefer correctness and the proven
existing patterns over novelty; when two existing files disagree, the source and the newest
desk (`refunds/page.tsx`, `payouts.ts`) win.
