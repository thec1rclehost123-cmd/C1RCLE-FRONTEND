# Implementation Plan — Frontend↔Gateway Auth Foundation

**Derives from:** `docs/superpowers/specs/2026-08-27-frontend-gateway-auth-foundation-design.md` (approved).
**Context:** `docs/superpowers/HANDOFF-2026-08-27-auth-foundation.md` — read §6 (knowledge base) and §5 (copy-ready patterns) before starting any phase.
**Repos:** `C1RCLE-BACKEND` @ `main` (Phase 1 only), `C1RCLE-FRONTEND` @ `staging` (Phases 2–8).
**Execution model:** one builder subagent per phase, **distinct files**, its own tests, its own commit. A phase's exit gate must pass before the next starts. Never two subagents editing one file.

---

## How to run this plan

For each phase:

1. Spawn one builder subagent. Give it: this file's phase section, the spec sections it names, and the handoff §5/§6 rows it needs.
2. The subagent implements exactly the phase's task list, framed as **copy the pattern at `<file:line>`**, not "migrate the old code".
3. The subagent runs the phase's verification checklist and reports the command output.
4. Orchestrator reviews the diff (`caveman:cavecrew-reviewer` or inline), confirms the gate, commits.
5. Only then: next phase.

Do not skip verification. Do not let a phase expand its file scope. If hidden work appears, stop and re-plan.

---

## Phase 0 — Allowed APIs and anti-patterns (reference, no code)

Consolidated from 8 investigation subagents (handoff §9). Every later phase cites this.

### Allowed — backend `/api/v2` (runtime truth = `C1RCLE-BACKEND/apps/api-gateway/src/routes/v2/route-manifest.ts` + route files)

| Endpoint                                        | Method | Request                                                                           | Response                                                                                           | Notes                                                                                               |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `/api/v2/auth/signup`                           | POST   | `signupRequestSchema {email, password 8-128, displayName}` `.strict()`            | 201 `authBridgeResponseSchema {user, accessToken, expiresAt}`                                      | `expiresAt` epoch ms. `SENSITIVE_COMMAND` rate class. **No `role` in body.**                        |
| `/api/v2/auth/login`                            | POST   | `loginRequestSchema {email, password}` `.strict()`                                | 200 `authBridgeResponseSchema`                                                                     | generic error message on 401                                                                        |
| `/api/v2/auth/refresh`                          | POST   | _(cookie only, no body)_                                                          | 200 `authBridgeResponseSchema`                                                                     | re-validates the httpOnly cookie                                                                    |
| `/api/v2/auth/logout`                           | POST   | —                                                                                 | 204 + Set-Cookie clear                                                                             | revokes server session                                                                              |
| `/api/v2/auth/session`                          | GET    | —                                                                                 | 200 `sessionSchema {user, expiresAt}` or 401                                                       | `AUTH_READ` rate class                                                                              |
| `/api/v2/onboarding/me`                         | GET    | —                                                                                 | `{ request: onboardingRequestDtoSchema \| null }`                                                  | session-scoped (not `X-Organization-Id`)                                                            |
| `/api/v2/onboarding/applications`               | POST   | `{ requestedType: venue\|host\|promoter, plan: basic\|silver\|diamond, profile }` | 201 `onboardingRequestDtoSchema`                                                                   | `Idempotency-Key` required                                                                          |
| `/api/v2/onboarding/applications/:id`           | PATCH  | `onboardingProfileSchema.partial().strict()`                                      | `onboardingRequestDtoSchema`                                                                       | autosave; **not** idempotency-keyed; unknown key → 422                                              |
| `/api/v2/onboarding/applications/:id/documents` | POST   | `{ label, storagePath }`                                                          | `onboardingRequestDtoSchema`                                                                       | labels `id_front`\|`id_back`\|`selfie`; `Idempotency-Key` required; **deferred this slice** (§10.3) |
| `/api/v2/onboarding/applications/:id/submit`    | POST   | —                                                                                 | `onboardingRequestDtoSchema`                                                                       | blocks without 3 docs; `Idempotency-Key` required                                                   |
| `/api/v2/onboarding/verify-document`            | POST   | `{ documentType, documentNumber, holderName? }`                                   | `verificationResultDtoSchema {passed, provider, reason, referenceId}`                              | provider `format-check`; ≤5/applicant; **never render "verified"**                                  |
| `/api/v2/organizations`                         | GET    | pagination query                                                                  | `paginatedSchema(organizationDtoSchema)` = `{items, pageInfo}`                                     | `AUTH_READ`                                                                                         |
| `/api/v2/organizations`                         | POST   | `{name, slug, settings?}` `.strict()`                                             | 201 `organizationDtoSchema`                                                                        | **no `requirePermission`**; `Idempotency-Key` required                                              |
| `/api/v2/organizations/:id`                     | GET    | —                                                                                 | `organizationDtoSchema`                                                                            | cached `ORGANIZATION`                                                                               |
| `/api/v2/organizations/:id/access`              | GET    | —                                                                                 | `partnerAccessDtoSchema {organizationId, userId, partnerType, role, permissions[], tabVisibility}` | the RBAC source; `tabVisibility` null = show all                                                    |

`onboardingProfileSchema` (`.strict()`, `role` stripped): required `legalName`, `contactPerson`, `phone` (6–20), `city`; optional `area`, `website`, `capacity` (number\|null), `instagram`, `bio`, `businessType` (≤120), `registrationNumber`, `entityType` (≤120).

### Allowed — `@c1rcle/contracts` schemas (backend `C1RCLE-BACKEND/packages/contracts/src/contracts/`)

`auth.ts`: `roleSchema` (`guest|partner|admin`), `userSchema` (`{id, email, displayName, role, avatarUrl: url\|null}`), `sessionSchema` (`{user, expiresAt: int>0}`), `authBridgeResponseSchema` (`{user, accessToken: min 1, expiresAt}`), `signupRequestSchema`, `loginRequestSchema`.
`onboarding.ts`: `onboardingRequestDtoSchema`, `onboardingProfileSchema`, `onboardingDocumentSchema`, `verificationResultDtoSchema`, `startOnboardingSchema`, `saveOnboardingProgressSchema`, `addOnboardingDocumentSchema`, `verifyDocumentSchema`, `onboardingStatusSchema` (`draft|submitted|changes_requested|approved|rejected`), `onboardingPlanSchema` (`basic|silver|diamond`).
`organization.ts`: `organizationDtoSchema`, `organizationRoleSchema` (`owner|admin|manager|member`), `organizationStatusSchema` (`active|suspended|archived`), `createOrganizationSchema`, `organizationMemberDtoSchema`, `invitationDtoSchema`.
`partner.ts`: `partnerAccessDtoSchema`, `partnerTypeSchema` (`venue|host|promoter`), `partnerPermissionSchema` (18-verb enum).
`shared.ts`: `pageInfoSchema`, `paginatedSchema()`, `opaqueIdSchema` (`^[A-Za-z0-9][A-Za-z0-9_-]*$` ≤64), `idempotencyKeySchema` (`^[A-Za-z0-9_-]+$` ≤128), `versionHeaderSchema` (`^[1-9][0-9]*$`), envelope utils `buildV2ErrorResponse` / `STATUS_CODE_TO_ERROR_CODE` / `zodToFieldErrors`.

### Allowed — `@c1rcle/api-client` (FE, current working tree)

`ApiClient` methods `get/post/put/patch/delete/request`. `ApiClientConfig = {baseUrl, timeoutMs?, maxRetries?, getToken?, onUnauthorized?, fetchImpl?}` — Phase 2 adds `reauth?: () => Promise<boolean>`. `RequestOptions = {method?, path, query?, body?, headers?, schema (required), signal?, timeoutMs?, retries?}`. `ApiClientError` — `.code`, `.status`, `.requestId`, `.fieldErrors`, getters `isRetryable`, `isAuthFailure`. `createApiClient(overrides)` → reads `getClientEnv().NEXT_PUBLIC_API_BASE_URL`. `statusToErrorCode`, `isApiClientError`.

### Allowed — Next.js 16.3.0

- **`proxy.ts` NOT `middleware.ts`** (`middleware.ts` is deprecated in Next 16). Root or `src/`. Default or named `proxy` export. Optional `export const config = { matcher: [...] }` — matcher values **must be static constants**. Node runtime only; `runtime` config option throws.
- CSP nonce pattern: `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md:34-133`. `proxy.ts` mints a nonce, sets it on the CSP request header + response header; Next auto-applies it to framework scripts. **Nonce forces dynamic rendering** (no static / ISR / PPR) — pages may need `await connection()`.
- Read nonce in a Server Component: `(await headers()).get('x-nonce')`.
- Route Handlers: `app/api/**/route.ts`, export `GET`/`POST`/etc. `NextRequest` / `NextResponse`.

### Anti-patterns — do NOT

- Do NOT create `middleware.ts` — use `proxy.ts`.
- Do NOT add `zustand` — it is not installed. Use the hand-rolled `useSyncExternalStore` pattern (`packages/auth/index.ts:1-94`).
- Do NOT build against `{ data, meta }` — the live envelope is a **bare DTO**; lists are `{ items, pageInfo }`.
- Do NOT send `role` in any auth or onboarding request body.
- Do NOT render a `verify-document` result as "verified" — it is a format check only.
- Do NOT put the access token in `localStorage` / `sessionStorage` / `IndexedDB` / a JS-readable cookie.
- Do NOT `console.log` request or response bodies in the BFF.
- Do NOT fall back to a fixture after an API error — render a typed empty / unavailable / retry state.
- Do NOT invent Better Auth methods — the routes are exactly the 5 in the table.
- Do NOT trust `thec1rcle/docs/V2-Partners_Frontend/{route-manifest.ts, API_V2_ROUTE_MANIFEST.md}` as the live surface — they claim 3 ACTIVE routes; ~80 are registered.
- Do NOT `git commit --no-verify`.
- Do NOT touch the untracked Phase 5 WIP in `C1RCLE-BACKEND` or the api-client rebuild in the FE working tree.

---

## Phase 1 — Backend foundation (`C1RCLE-BACKEND` @ `main`)

**Goal:** publishable contracts, a 401-not-500 fix, parity wired, conflicts recorded. Land as **one commit**, separate from the untracked Phase 5 door/ WIP.

**Spec refs:** §2 (conflicts), §5, §13.

### Tasks

1. **`packages/contracts` build.** Confirm `packages/contracts/tsconfig.build.json` + `build` script emit `dist/**` (JS + `.d.ts`). Copy the shape of `packages/core/tsconfig.build.json` if missing. Add `"main"`/`"types"`/`"files": ["dist"]` and a `dist`-pointing `exports` alt so an external consumer can resolve built output (keep the `src` `exports` for in-repo use).
2. **`scripts/export-contracts.mjs`** (new). Node ESM script:
   - Reads `packages/contracts/src/**/*.ts`.
   - Writes each into `../C1RCLE-FRONTEND/packages/contracts/src/**` (path configurable via `--frontend <path>` / `C1RCLE_FRONTEND_PATH`, same convention as `contract-parity.mjs:40-48`).
   - Prepends `// GENERATED by C1RCLE-BACKEND/scripts/export-contracts.mjs — do not edit. Source: packages/contracts/src/<same path>` to every file.
   - Does NOT write the FE package scaffolding (that is Phase 2's job — this script only syncs `src/`).
   - Idempotent; prints a summary of files written.
3. **`buildActorContext` fix** — `packages/core/src/infrastructure/utils.ts:164-168`. Read `packages/core/src/domain/errors.ts` first to confirm `UnauthorizedError` exists and its constructor signature. Then:
   ```ts
   import { UnauthorizedError } from '../domain/errors.js';
   // ...
   export function buildActorContext(request: { actor?: ActorContext }): ActorContext {
     if (!request.actor) {
       throw new UnauthorizedError('No authenticated actor on request.');
     }
     return request.actor;
   }
   ```
   Verify `apps/api-gateway/src/plugins/error-handler.ts` maps `UnauthorizedError` → 401 (agent B confirmed it does). Verify no gateway code catches the old generic message string.
4. **Expand + wire `scripts/contract-parity.mjs`.**
   - Add fixtures + `agree(...)` calls for: `authBridgeResponseSchema` (valid, missing `accessToken`, ISO-string `expiresAt` rejected), `signupRequestSchema` / `loginRequestSchema` (valid, `password` too short, extra `role` key rejected), `onboardingProfileSchema` (valid minimum, unknown key rejected, `role` key rejected), `onboardingRequestDtoSchema` (valid, bad `status`), `organizationDtoSchema` (valid, bad `status`), `partnerAccessDtoSchema` (valid, `tabVisibility: null` accepted).
   - Point `FRONTEND_SCHEMAS` at the new FE `@c1rcle/contracts/dist` **when it exists**; keep the `api-client/dist` path as a fallback with a clear "not built" message. (The FE package does not exist until Phase 2 — the script must exit 2 gracefully, not crash.)
   - Add `contract-parity` to `pnpm check` in `C1RCLE-BACKEND/package.json` if not already there; add a matching script to `C1RCLE-FRONTEND` in Phase 2.
5. **Verify `forwardAuthErrorResponse`** — `apps/api-gateway/src/routes/v2/auth/index.ts:193-214`. Read it. The current code forwards Better Auth's message. If Better Auth returns a message that distinguishes "user not found" from "invalid password", replace it with a single constant `'Authentication failed'` for any 4xx on `login`. Add a test in `apps/api-gateway/src/routes/v2/auth/*.test.ts` (or the nearest auth test file) asserting the login-failure body is identical for an unknown email and a wrong password.
6. **Confirm Better Auth cookie flags** — `apps/api-gateway/src/plugins/auth.ts:35-65`. Better Auth defaults: `httpOnly: true`, `sameSite: 'lax'`, session 7d / updateAge 1d. `useSecureCookies` is already prod-gated. `trustedOrigins` already lists 3000/3001/3002. No change needed unless a test surfaces one — document the confirmed defaults in a code comment.
7. **Record D-024** in `docs/architecture/decisions.md` — append an entry titled "D-024 · Frontend↔gateway auth: live `/api/v2/auth/*` supersedes the frozen `session.*` manifest; bare-DTO envelope; CSRF is a Next BFF concern" with the §2 table's resolutions and their rationale. Append-only — do not edit earlier entries.

### Verification

```
cd C1RCLE-BACKEND
NODE_OPTIONS=--dns-result-order=ipv4first pnpm check                 # green
node scripts/export-contracts.mjs --frontend ../C1RCLE-FRONTEND      # prints file list, exits 0
node scripts/contract-parity.mjs --frontend ../C1RCLE-FRONTEND       # exits 2 "FE contracts not built yet" (expected pre-Phase-2), NOT a crash
grep -n "UnauthorizedError" packages/core/src/infrastructure/utils.ts # present
```

- New unit test: unauthenticated request to `/api/v2/onboarding/me` on the firestore driver → **401** not 500. (If a firestore-driver test harness is impractical, assert `buildActorContext({})` throws `UnauthorizedError` in a `packages/core` unit test.)
- Login-failure oracle test green.
- `git diff --stat` touches only `packages/contracts/**`, `packages/core/src/infrastructure/utils.ts`, `scripts/*.mjs`, `package.json`, `docs/architecture/decisions.md`, and the two test files. **Not** `apps/api-gateway/src/routes/v2/door/**` or anything else in the Phase 5 WIP.

### Anti-patterns

- Do NOT bundle this with the Phase 5 door changes — `git add` only the files above.
- Do NOT hand-edit the FE `packages/contracts/src` — it is generated.
- Do NOT weaken `.strict()` on any contract schema.

---

## Phase 2 — FE `@c1rcle/contracts` package + `@c1rcle/api-client` changes (`C1RCLE-FRONTEND`)

**Goal:** one wire-contract source in the frontend; `api-client` gains `reauth` + `Retry-After`.

**Spec refs:** §3.2, §5, §7. **Handoff §5** rows: "Compiled zod-library archetype", "`createApiClient` / `ApiClientConfig`", "401 handling to modify", "`fetchImpl` test-injection", "eslint restriction rules", root `tsconfig.json` references gap.

### Tasks

1. **Scaffold `packages/contracts`** — copy `packages/config` exactly:
   - `packages/contracts/package.json` — name `@c1rcle/contracts`, `"exports": { ".": "./dist/index.js", "./client": "./dist/client.js" }` (match backend's two entry points), `"types"`, `"files": ["dist"]`, scripts `build`/`dev`/`typecheck`/`lint`/`clean`/`test`, dep `zod` (pin to the FE's exact version — check `packages/api-client/package.json`, currently `4.4.3`), devDeps mirroring `packages/config`.
   - `packages/contracts/tsconfig.build.json`, `packages/contracts/tsconfig.json`, `packages/contracts/eslint.config.ts` (`libraryConfig`), `packages/contracts/vitest.config.ts` (node env) — byte-copy `packages/config`'s, adjust paths only.
2. **Generate `src/`** — run `../C1RCLE-BACKEND/scripts/export-contracts.mjs --frontend .` from `C1RCLE-FRONTEND/` (or `pnpm --dir ../C1RCLE-BACKEND exec node scripts/export-contracts.mjs --frontend $(pwd)`). Commit the generated `packages/contracts/src/**` with its `GENERATED` headers.
3. **Root `tsconfig.json`** — add `{ "path": "packages/contracts" }`, and also `{ "path": "packages/api-client" }` and `{ "path": "packages/auth" }` (pre-existing omissions) to the `references` array.
4. **`pnpm install`** — picks up the new package via the `packages/*` glob.
5. **`@c1rcle/api-client/src/schemas.ts`** — replace the local zod definitions with re-exports:
   ```ts
   export {
     pageInfoSchema,
     paginatedSchema,
     roleSchema,
     userSchema,
     sessionSchema,
     noContentSchema,
   } from '@c1rcle/contracts/client';
   ```
   Add `"@c1rcle/contracts": "workspace:*"` to `packages/api-client/package.json` deps + a `references` entry in `packages/api-client/tsconfig.build.json`.
6. **`@c1rcle/types`** — for the overlapping types (`ApiError`, `ApiErrorCode`, `Role`, `Session`, `User`, `PageInfo`, `Paginated`), change `packages/types/src/{api,identity}.ts` to `export type` re-exports of the inferred `@c1rcle/contracts` types where a 1:1 equivalent exists (`Role`, `Session`, `User`, `PageInfo`, `Paginated`). Keep `ApiError`/`ApiErrorCode`/`RequestId` as-is if the contracts package does not export an identical shape — but verify against `packages/contracts/src/index.ts` first; the backend `ApiErrorCode` union must match `packages/types/src/api.ts:17-32` exactly (agent findings say they already do). Add `"@c1rcle/contracts": "workspace:*"` to `packages/types/package.json`.
7. **`ApiClientConfig`** — `packages/api-client/src/types.ts:11-21`, add:
   ```ts
   /** Called on 401. Return true to replay the request once; false to surface `unauthorized`. */
   readonly reauth?: () => Promise<boolean>;
   ```
8. **`reauth` in `ApiClient`** — `packages/api-client/src/client.ts`. In `#attempt` (or the `request` loop), on a `!response.ok` with status 401:
   - if `this.#config.reauth` is set AND `options.__isReauthRetry !== true` (add a private flag to `RequestOptions` or track it in the loop): `const ok = await this.#config.reauth();` — if `ok`, replay `this.#attempt({ ...options, __isReauthRetry: true })` exactly once; if not `ok` (or already retried), proceed to `#toHttpError` (which still calls `onUnauthorized`).
   - Preserve the existing `onUnauthorized` call in `#toHttpError:214-219` for the terminal case.
   - Guard: a 401 on the reauth-retry must not recurse.
9. **`Retry-After`** — in the retry-backoff path (`client.ts:108-130`), when the `ApiClientError` is `rate_limited` (or `server` with status 503) and the `Response` carried a `Retry-After` header (seconds or HTTP-date), wait `min(parsed, 30_000)` ms instead of `RETRY_BASE_DELAY_MS * 2 ** attempt`. You will need to thread the header value out of `#attempt` into the error (add `retryAfterMs?: number` to `ApiClientError` or return it alongside). Jitter still applies when the header is absent.
10. **`@c1rcle/contracts` smoke test** — `packages/contracts/src/index.test.ts`: parse a canonical fixture through `authBridgeResponseSchema`, `onboardingProfileSchema`, `partnerAccessDtoSchema`; assert `.strict()` rejects an unknown key; assert `expiresAt` epoch-ms accepted, ISO-string rejected.

### Verification

```
cd C1RCLE-FRONTEND
pnpm install
pnpm --filter @c1rcle/contracts build
pnpm --filter @c1rcle/contracts test
pnpm --filter @c1rcle/api-client test          # includes new reauth + Retry-After tests
pnpm --filter @c1rcle/api-client typecheck
node ../C1RCLE-BACKEND/scripts/contract-parity.mjs --frontend .   # now exits 0
```

- New `api-client` tests: (a) 401 → `reauth` returns true → one replay → 200; (b) 401 → `reauth` returns false → `ApiClientError{code:'unauthorized'}` + `onUnauthorized` called once; (c) 401 on the replay → no second replay, `unauthorized` surfaced; (d) 429 with `Retry-After: 2` → waits ~2s (fake timers), not the exponential default.
- `pnpm boundaries` green (the generated `packages/contracts/src` may need a `check-boundaries` allowance for its `GENERATED` header comment — verify).
- `git grep -n "from './schemas'" packages/api-client/src` — `schemas.ts` still the local module, but its body is re-exports.

### Anti-patterns

- Do NOT hand-write schemas in `packages/contracts/src` — regenerate.
- Do NOT change any schema's constraints to "make parity pass" — fix the drift at the source (backend), regenerate.
- Do NOT break the existing `@c1rcle/api-client` public exports (`packages/api-client/src/index.ts`) — `guest-portal` and the untracked partner transport import them.

---

## Phase 3 — FE `@c1rcle/auth` rebuild (`C1RCLE-FRONTEND`)

**Goal:** a real session package: in-memory store + network actions + server bootstrap.

**Spec refs:** §6. **Handoff §5** rows: "Hand-rolled store pattern", "Compiled react-library archetype", "App-level `vi.mock('@c1rcle/auth')`".

### Tasks

1. **Scaffold `packages/auth` as a compiled react-library** — copy `packages/hooks`:
   - `packages/auth/package.json` — `"exports": { ".": "./dist/index.js", "./server-session": "./dist/server-session.js" }`, `"types"`, `"files": ["dist"]`, scripts `build`/`typecheck`/`lint`/`test` (`vitest run`), deps `react` + `@c1rcle/api-client` + `@c1rcle/config` + `@c1rcle/contracts` (all `workspace:*`), devDeps from `packages/hooks` (`@testing-library/{dom,jest-dom,react}`, `@vitejs/plugin-react`, `jsdom`, `@vitest/coverage-v8`, `@c1rcle/eslint-config`, `@c1rcle/tsconfig`, `typescript`, `vitest`).
   - `packages/auth/tsconfig.json`, `tsconfig.build.json` (extends `@c1rcle/tsconfig/react-library.json`), `eslint.config.ts`, `vitest.config.ts` (jsdom, `plugins: [react()]`, `setupFiles: ['./vitest.setup.ts']`), `vitest.setup.ts` (`import '@testing-library/jest-dom/vitest'; afterEach(cleanup)`).
   - Move `packages/auth/index.ts` → `packages/auth/src/session-store.ts` and rework (below). Delete the stale `packages/auth/dist/**` and `tsconfig.build.tsbuildinfo` (they regenerate).
   - `packages/auth/src/index.ts` — barrel re-exporting the public API.
2. **`src/session-store.ts`** — copy the `useSyncExternalStore` pattern from the old `packages/auth/index.ts:1-94`. Shape per spec §6.1:
   - state: `{ session: { user: User } | null, accessToken: string | null, expiresAt: number | null, status: 'unknown' | 'authenticated' | 'anonymous' }`
   - `useSessionStore` (`Object.assign(hook, { getState, setState, subscribe })`), `useSession()` → `{ isAuthenticated, isLoading, user }`
   - `getAccessToken(): string | null` — plain function, not a hook
   - `setSession(session, accessToken, expiresAt)`, `clearSession()`, `markAnonymous()`
   - **No `zustand`. No `localStorage`/`sessionStorage`.** If a test needs to spy on those, add a file-level `/* eslint-disable no-restricted-* */` in the test file only.
   - **Delete** `export const auth = { currentUser: null }`.
3. **`src/auth-client.ts`** — network actions per spec §6.2, each calling `createApiClient()` against the **BFF** paths (`/api/auth/*` — relative, same-origin), `credentials: 'include'` where the httpOnly cookie is involved:
   - `signup({email, password, displayName})` — validate against `signupRequestSchema` first → `POST /api/auth/signup` → parse `authBridgeResponseSchema` → `setSession`.
   - `login({email, password})` — validate `loginRequestSchema` → `POST /api/auth/login` → `setSession`. On `ApiClientError` with status 401/400: rethrow with a fixed generic message.
   - `refresh(): Promise<boolean>` — `POST /api/auth/refresh` → `setSession` + return `true`; on any error → `clearSession()` + return `false`. **Refresh-stampede guard** (§6.4): module-level `let inFlight: Promise<boolean> | null`; concurrent callers await it; cleared in `finally`.
   - `logout()` — `POST /api/auth/logout` → `clearSession()`; `clearSession()` even on error.
   - `fetchSession()` — `GET /api/auth/session` → parse `sessionSchema` → `setSession(user, getAccessToken(), expiresAt)`; on 401 → `markAnonymous()`.
   - The `createApiClient` instance here uses `getToken: getAccessToken` but **no `reauth`** (these ARE the reauth primitives — avoid recursion).
4. **`src/server-session.ts`** — `'server-only'` module (import `'server-only'` at the top). `getServerSession(): Promise<{ user: User } | null>`:
   - `const cookie = (await import('next/headers')).cookies().toString()` — forward the whole cookie header.
   - `fetch(\`${getClientEnv().NEXT_PUBLIC_API_BASE_URL}/api/v2/auth/session\`, { headers: { cookie }, cache: 'no-store' })` — note this calls the **gateway directly** server-side (no browser, no CSRF concern), NOT the BFF.
   - 200 → parse `sessionSchema`, return `{ user }`. 401 or parse failure → `null`. Never throw.
   - This is the one place `fetch` is allowed outside `@c1rcle/api-client` — it is a server module; add a file-level eslint-disable for `no-restricted-syntax` with a comment, matching how `@c1rcle/config` does it. (Alternative: use `@c1rcle/api-client` with a per-call `headers: { cookie }` and no token — cleaner; prefer this if it works from a server context.)
5. **`src/index.ts`** barrel: `session-store` exports + `auth-client` exports. `server-session` is a separate entry (`@c1rcle/auth/server-session`) so it never reaches a client bundle.
6. **Update the 3 existing consumers** — `guest-portal` (`useSession`, `clearSession` in `SignOutControl`), `admin-console`, `packages/providers` currently import from `@c1rcle/auth`. Their imports still resolve (barrel keeps `useSession`/`clearSession`/`getAccessToken`), but the package now builds to `dist/` — verify `guest-portal` + `admin-console` still typecheck. Add `"@c1rcle/auth"` `references` where a consumer's `tsconfig.build.json` needs it.
7. **Unit tests** — `packages/auth/src/*.test.ts` (jsdom):
   - store: `setSession` → `status: 'authenticated'`, `useSession` reflects it; `clearSession` → `'anonymous'`; `getAccessToken` returns the raw token, is not a hook.
   - `refresh` stampede: mock `fetchImpl`, fire 5 concurrent `refresh()`, assert `fetchImpl` called once.
   - no storage writes: `vi.spyOn(Storage.prototype, 'setItem')` — assert 0 calls after a full login→logout cycle.
   - `login` failure → the thrown error's message is the fixed generic string, regardless of the backend's 401 body.

### Verification

```
pnpm --filter @c1rcle/auth build
pnpm --filter @c1rcle/auth test
pnpm --filter @c1rcle/auth typecheck
pnpm --filter guest-portal typecheck        # consumer still compiles
pnpm --filter admin-console typecheck
git grep -n "currentUser" packages/auth/src   # empty — shim gone
```

### Anti-patterns

- Do NOT add `zustand`.
- Do NOT persist anything to storage.
- Do NOT let `server-session.ts` be importable from a `'use client'` file — the `'server-only'` guard enforces it; verify.
- Do NOT wire `reauth` into `auth-client.ts`'s own client.

---

## Phase 4 — FE auth BFF (`C1RCLE-FRONTEND` / `apps/partner-dashboard`)

**Goal:** 5 Next Route Handlers that own the cookie/CSRF surface and re-scope the session cookie to the FE origin.

**Spec refs:** §8, §11.2, §11.6, §11.8.

### Tasks

1. **`apps/partner-dashboard/src/lib/bff/auth-proxy.ts`** (shared helper, new file):
   - `assertSameOrigin(req: NextRequest)` — throw a 403 `NextResponse` if `Origin` header present and ≠ the app origin (`req.nextUrl.origin`), or `Sec-Fetch-Site` is `cross-site`.
   - `assertCsrf(req: NextRequest)` — compare the `c1rcle.csrf` cookie value to the `x-csrf-token` header; mismatch/absent → 403. Constant-time compare.
   - `stripProtoKeys(obj)` — recursively delete `__proto__` / `constructor` / `prototype` own-keys.
   - `mintCsrfToken()` — 32 random bytes → base64url (`crypto.getRandomValues` / `crypto.randomUUID` ×2).
   - `forwardToGateway(path, { method, body?, cookie? })` — `fetch(\`${GATEWAY}${path}\`, ...)`where`GATEWAY = getClientEnv().NEXT_PUBLIC_API_BASE_URL`; returns the raw `Response`. **No body logging.** (File-level eslint-disable for `no-restricted-syntax` fetch, with comment — this is a server module and the approved BFF.)
   - `rescopeSessionCookie(gatewayResponse, nextResponse)` — read every `Set-Cookie` from the gateway response; for the Better Auth session cookie, re-emit via `nextResponse.cookies.set(name, value, { httpOnly: true, sameSite: 'lax', secure: isProd, path: '/', maxAge })`. Drop any `Domain` attribute.
2. **`src/app/api/auth/signup/route.ts`** — `POST`. `assertSameOrigin` → parse + `stripProtoKeys` body → `forwardToGateway('/api/v2/auth/signup', { method: 'POST', body })` → on 2xx: `rescopeSessionCookie`, set a fresh `c1rcle.csrf` cookie (non-httpOnly, `SameSite=Strict`, `Secure` in prod), return the gateway JSON (`{user, accessToken, expiresAt}`) with status 201; on 4xx: return `{ code, message: 'Authentication failed', status, requestId }` (generic).
3. **`src/app/api/auth/login/route.ts`** — same as signup but `POST /api/v2/auth/login`, status 200.
4. **`src/app/api/auth/refresh/route.ts`** — `POST`. `assertSameOrigin` → `assertCsrf` → forward with the incoming `cookie` header → `rescopeSessionCookie` → return `{user, accessToken, expiresAt}`.
5. **`src/app/api/auth/logout/route.ts`** — `POST`. `assertSameOrigin` → `assertCsrf` → forward with cookie → clear `c1rcle.csrf` + the session cookie on the response → return `204`.
6. **`src/app/api/auth/session/route.ts`** — `GET`. `assertSameOrigin` → forward with cookie → pass through `{ user, expiresAt }` or `401`.
7. **Tests** — `src/app/api/auth/*.test.ts` (node env, mock `forwardToGateway`):
   - cross-site `Origin` → 403 on every route.
   - `refresh`/`logout` without `x-csrf-token` → 403; with a mismatched token → 403; with the matching cookie+header → forwarded.
   - `stripProtoKeys` removes a `__proto__` key from a nested body.
   - the session cookie on the response has `HttpOnly`, `SameSite=Lax`, no `Domain`.
   - a `console.log`/`console.error` spy records **zero** calls containing the request body.

### Verification

```
pnpm --filter partner-dashboard test -- src/app/api/auth
pnpm --filter partner-dashboard typecheck
```

### Anti-patterns

- Do NOT log bodies, tokens, or cookies.
- Do NOT forward the `x-csrf-token` header or the `c1rcle.csrf` cookie to the gateway (they are FE-origin only).
- Do NOT set the session cookie with a `Domain` attribute (host-only is the point).
- Do NOT add these routes anywhere but `apps/partner-dashboard/src/app/api/auth/` (guest-portal / admin-console get their own later).

---

## Phase 5 — FE app integration (`C1RCLE-FRONTEND` / `apps/partner-dashboard`)

**Goal:** `proxy.ts`, a thin `SessionProvider`, `createApiClient` wiring, idle timer, org selection, `useOrgAccess`. `DashboardAuthProvider` is NOT deleted yet (Phase 6 does that after `/login` is rebuilt) — but the new pieces exist alongside.

**Spec refs:** §3.1, §4, §9. **Handoff §5** rows: "Next 16 `proxy.ts` + CSP nonce", "`@c1rcle/config` — add a `NEXT_PUBLIC_*` key", "eslint rule locations", "partner-dashboard app structure".

### Tasks

1. **`@c1rcle/config`** — add `NEXT_PUBLIC_ENVIRONMENT` is already there. If any new key is needed (none identified yet — `NEXT_PUBLIC_API_BASE_URL` covers it), do the 4-edit process (handoff §5). **Delete** the raw `process.env['NEXT_PUBLIC_PARTNER_USE_REAL_API']` and `['NEXT_PUBLIC_PARTNER_DEV_ORG_ID']` reads in `apps/partner-dashboard/src/lib/partner/repositories.ts` / `gateway-partner-transport.ts` — replace `USE_REAL_API` with an unconditional `true` (real API is the only path now) and remove the dev-org fallback (org comes from the `c1rcle.active-org` cookie — task 5).
2. **`apps/partner-dashboard/src/proxy.ts`** (NOT `middleware.ts`):
   - `export const config = { matcher: ['/venue/:path*', '/host/:path*', '/promoter/:path*', '/onboard/:path*', '/partner/:path*', '/partner-network/:path*', '/((?!api|_next/static|_next/image|favicon.ico).*)'] }` — the last entry is for the CSP nonce; the specific ones drive the auth redirect. (Verify matcher static-const constraint.)
   - Mint a per-request nonce; set CSP request + response headers per the doc pattern (`content-security-policy.md:34-133`) with the spec §11.3 directives (`connect-src 'self' <NEXT_PUBLIC_API_BASE_URL>` — read the env value at module load).
   - For the auth-gated paths: if the Better Auth session cookie name is **absent** from `req.cookies`, `NextResponse.redirect(new URL('/login?next=' + encodeURIComponent(path), req.url))`. Do NOT try to validate the cookie. File header comment: "UX redirect only — real auth is per-request at the gateway."
   - Add `'src/proxy.ts'` to the default-export allowlist in `packages/eslint-config/src/next.ts` (near line 49 where `src/middleware.ts` is listed).
3. **`src/components/providers/session-provider.tsx`** — `'use client'`, thin:
   - Props: `initialUser: { user: User } | null` (from `getServerSession()` in the layout).
   - On mount: if `initialUser`, `setSession(initialUser, ??, ??)` — the server bootstrap has no `accessToken` (it is httpOnly-cookie-only server-side). So: set `status: 'authenticated'` + `session` from `initialUser`, `accessToken: null`, then immediately call `auth.refresh()` once to obtain an in-memory token. If `refresh` fails → `markAnonymous()` + let `proxy.ts` handle the redirect on the next nav.
   - If no `initialUser`: `markAnonymous()`.
   - **Idle timer** (§9.5): 30-min `setTimeout`, reset on `pointerdown`/`keydown`/`visibilitychange`; on fire → `auth.logout()` + `router.replace('/login')`.
   - **Focus refresh**: on `visibilitychange` → visible, if `expiresAt - Date.now() < 5 * 60_000` → `auth.refresh()`.
   - Expose nothing new — components use `useSession()` from `@c1rcle/auth` directly.
4. **`src/lib/api/client.ts`** (new, the composition root for the browser client):
   ```ts
   import { createApiClient } from '@c1rcle/api-client';
   import { getAccessToken, refresh, clearSession } from '@c1rcle/auth';
   let redirecting = false;
   export const apiClient = createApiClient({
     getToken: getAccessToken,
     reauth: () => refresh(),
     onUnauthorized: () => {
       if (!redirecting) {
         redirecting = true;
         clearSession();
         window.location.assign('/login');
       }
     },
   });
   ```
5. **Org selection** — `src/lib/org/active-org.ts`:
   - `getActiveOrgId()` (client: read `document.cookie` `c1rcle.active-org`; server: `cookies().get(...)`).
   - `setActiveOrg(id)` — set the cookie (`SameSite=Lax`, `Secure` in prod, `Path=/`, no `HttpOnly`), then `await refresh()` (token rotation on privilege change), then `router.refresh()` / `revalidateTag('org')`, navigate.
   - Rewrite `src/app/partner/select-organization/page.tsx` — server component: `const orgs = await <repo>.listOrganizations()` (a new `src/lib/org/org-repository.ts` calling `GET /api/v2/organizations` via `apiClient`, parsing `paginatedSchema(organizationDtoSchema)`). Zero orgs → `redirect('/onboard')`. One → `setActiveOrg` + `redirect` to its studio. Many → render the picker.
   - The transport that sends `X-Organization-Id` (currently `gateway-partner-transport.ts`) reads `getActiveOrgId()` instead of the deleted env var, and asserts the id also appears in the request path for org-scoped routes.
6. **`src/lib/access/use-org-access.ts`** — `useOrgAccess(organizationId: string)`:
   - a client hook (TanStack Query is available via `@c1rcle/providers` but partner-dashboard does not mount it — either mount `QueryProvider` in the studio layouts now, or use a plain `useEffect` + `useState` fetch for this one call). **Recommendation:** plain `useEffect` fetch for this slice; a Query migration is spec C.
   - `GET /api/v2/organizations/:id/access` via `apiClient`, parse `partnerAccessDtoSchema`.
   - returns `{ partnerType, role, permissions, tabVisibility, isLoading, error }`. `error` 403 → `{ suspended: true }` state.
   - `hasPermission(p: PartnerPermission)` = `permissions.includes(p)`. `tabVisible(tab)` = `tabVisibility === null || tabVisibility[tab] !== false`.
7. **Wire `getServerSession` into the studio + onboard layouts** — `src/app/{venue,host,promoter,partner,partner-network,onboard}/layout.tsx` currently mount `DashboardAuthProvider`. Add `const initial = await getServerSession();` (these become async server components wrapping a client `SessionProvider`). Keep `DashboardAuthProvider` for now (Phase 6 removes it) — but the new `SessionProvider` wraps it, so both session sources exist during the transition. Actually simpler: **do not touch the studio layouts in Phase 5** — only `select-organization` and `/login` (Phase 6) need the new provider. Add `SessionProvider` + `getServerSession` to the **root** `src/app/layout.tsx` so it is always available, and leave `DashboardAuthProvider` in the route-group layouts untouched until Phase 6.

### Verification

```
pnpm --filter partner-dashboard build          # proxy.ts compiles, nonce wiring OK
pnpm --filter partner-dashboard test
pnpm --filter partner-dashboard typecheck
pnpm --filter @c1rcle/eslint-config build       # proxy.ts allowlist change
pnpm boundaries                                  # no new fetch/env violations
```

- Manual/E2E: start the gateway (`STORAGE_DRIVER=firestore`) + `next dev`; hit `/venue` with no cookie → redirected to `/login?next=/venue`. Response headers include a `Content-Security-Policy` with a `nonce-`. `select-organization` renders the org list from the real gateway.
- Tests: `use-org-access` maps a `partnerAccessDtoSchema` fixture to `{partnerType, permissions, tabVisibility}`; `tabVisibility: null` → `tabVisible('anything') === true`; a 403 → `suspended`.

### Anti-patterns

- Do NOT name the file `middleware.ts`.
- Do NOT compute permissions client-side from `role` — call `/access`.
- Do NOT read the org id from `process.env`.
- Do NOT delete `DashboardAuthProvider` yet.

---

## Phase 6 — FE `/login` + `/signup` rebuild + mock-auth teardown (`C1RCLE-FRONTEND` / `apps/partner-dashboard`)

**Goal:** real login/signup against `@c1rcle/auth`; the mock Firebase client and 12 mock auth routes gone.

**Spec refs:** §9.1, §10.1 step 1, §12.

### Tasks

1. **`src/app/login/page.tsx` + a new `LoginForm` client component** — replace `login/PageClient.tsx`'s mock-Firebase flow:
   - form: email + password. Submit → `await auth.login({ email, password })`. On success → read `?next` or `GET /api/v2/organizations` → route (zero → `/onboard`; one → set active org + studio; many → `/partner/select-organization`). On `ApiClientError` → show the generic message (`error.message` is already generic from Phase 3); `422` → field errors from `error.fieldErrors`.
   - Google / `signInWithPopup` / `signInWithCustomToken` / workspace-type picker → **removed** (social login is a later slice).
2. **`src/app/signup/page.tsx` + `SignupForm`** (new route — currently signup is folded into `/onboard`):
   - form: `displayName`, `email`, `password` (+ confirm). Submit → `await auth.signup({ displayName, email, password })` → on success → `/onboard`.
   - Client-side: `password` min 8 (matches `signupRequestSchema`), no `role` field.
3. **`login/layout.tsx`** — replace `DashboardAuthProvider` with the new `SessionProvider` (or nothing — `/login` needs no session). Same for a new `signup/layout.tsx`.
4. **Delete** (spec §12):
   - `src/lib/firebase/client.ts`
   - `src/lib/auth/getCachedFirebaseIdToken.ts`
   - `src/app/api/auth/{me,partner-context,profile,check-email,check-availability,create-account,onboard,onboard-status,onboarding-progress}/route.ts`
   - `src/app/api/auth/otp/{send,verify}/route.ts` (and the `otp/` dir)
5. **`DashboardAuthProvider.tsx`** — this is consumed by ~40 components via `useDashboardAuth()`. Full removal is Phase 7's tail / a follow-up. For Phase 6: strip the Firebase imports and the `/api/auth/*` fetches; re-implement its context on top of `@c1rcle/auth` + `useOrgAccess` so the ~40 consumers keep compiling:
   - `user` → `useSession().user`
   - `isApproved` → derived: `getActiveOrgId() != null` (a provisioned org exists)
   - `signIn`/`signUp`/`signOut` → `auth.login`/`auth.signup`/`auth.logout`
   - `hasPermission`/`canDo` → `useOrgAccess(activeOrgId).hasPermission` (and `canDo` becomes an alias — the 18-verb list is the only vocab)
   - `tabVisibility` → `useOrgAccess(...).tabVisibility`
   - `getIdToken` → `getAccessToken`
   - `switchPartner` → `setActiveOrg`
   - drop: `isBanned`, `kycStatus`, `entityType`, `subscriptionPlan`, `actionPermissions`, `piiPolicy`, `mustChangePassword`, the 30s polling. Any component reading a dropped field: replace with the nearest real signal or remove the branch (grep each; small, mechanical).
     Rename the file to `session-context.tsx` and keep a `useDashboardAuth` export alias to minimise churn, OR do a codemod of the import across the ~40 files. **Builder's call — pick the lower-risk path and say which.**
6. **`.env.example`** — `apps/partner-dashboard/.env.example`: ensure `NEXT_PUBLIC_API_BASE_URL` is present; remove `NEXT_PUBLIC_PARTNER_USE_REAL_API` / `NEXT_PUBLIC_PARTNER_DEV_ORG_ID` if listed.

### Verification

```
pnpm --filter partner-dashboard test
pnpm --filter partner-dashboard typecheck
pnpm --filter partner-dashboard build
git grep -n "firebase/auth\|firebase/storage\|@/lib/firebase" apps/partner-dashboard/src   # empty
git grep -n "/api/auth/me\|/api/auth/partner-context\|/api/auth/otp" apps/partner-dashboard/src  # empty
pnpm boundaries
```

- E2E: `signup` → lands on `/onboard`; `login` with the seeded user → lands in a studio or `/onboard`; `login` with a wrong password → the generic message, no field distinction.
- Network tab (or a Playwright request interceptor): zero requests to any deleted `/api/auth/*` route.

### Anti-patterns

- Do NOT keep a Firebase fallback "just in case".
- Do NOT reintroduce `check-email`/`check-availability` as real routes — signup's 4xx handles the duplicate generically.
- Do NOT expand `DashboardAuthProvider`'s surface — only re-home what the ~40 consumers already use.

---

## Phase 7 — FE `/onboard` rebuild + KYC teardown + `firebase` dep removal (`C1RCLE-FRONTEND` / `apps/partner-dashboard`)

**Goal:** the V2-reduced onboarding wizard; `/verify` and KYC mocks gone; `firebase` out of `package.json`.

**Spec refs:** §10 (all), §12.

### Tasks

1. **`src/app/onboard/page.tsx` + a rebuilt wizard** (replace the 2791-line `onboard/PageClient.tsx`):
   - Steps (client state only — V2 does not persist `onboardingStep`):
     1. **Type + plan** — `requestedType` (venue/host/promoter), `plan` (basic/silver/diamond — **no gold**).
     2. **Profile** — required `legalName`, `contactPerson`, `phone`, `city`; optional `area`, `website`, `capacity`, `instagram`, `bio`, `businessType`, `registrationNumber`, `entityType`. On leaving a field or step: `PATCH /api/v2/onboarding/applications/:id` with `onboardingProfileSchema.partial()` (autosave — no idempotency key).
     3. **Documents** — renders the honest **"Document upload will be enabled shortly"** state (§10.3). No file inputs wired. Submit disabled with the reason shown.
     4. **Review + submit** — `POST /api/v2/onboarding/applications/:id/submit` (idempotency key). It will 4xx with "missing documents" until signed-URL issuing lands — surface that as a clear message, not an error toast.
   - Resume: on mount, `GET /api/v2/onboarding/me` → if a `draft`/`submitted` request exists, prefill from `request.profile` and jump to the right step.
   - Status: after submit, poll `GET /api/v2/onboarding/me` every ~10s; `approved` → `GET /api/v2/organizations` → `setActiveOrg` + studio; `changes_requested`/`rejected` → show `reviewNote`.
   - The account step (`/auth/signup`) is **not** in this wizard — a logged-in user reaches `/onboard`; an anonymous one is redirected to `/signup` by `proxy.ts`.
   - `verify-document` (optional, §10.1 step 5): a "check my ID number format" affordance → `POST /api/v2/onboarding/verify-document` → render `"Format check passed — pending manual review"` on `passed: true`, **never "Verified"**, no green tick.
2. **Delete:**
   - `src/app/verify/**` (the whole route — bank/KYC hub, no V2 backend)
   - `src/app/api/kyc/{route.ts, upload/route.ts, verify-aadhaar/route.ts}` (and the `kyc/` dir)
   - the `/auth/change-password` and `/forgot-password` route references / links
3. **`apps/partner-dashboard/package.json`** — remove `"firebase": "^11.3.0"` from `dependencies`. `pnpm install`.
4. **eslint + boundary rules** (so a regression is caught):
   - `packages/eslint-config/src/base.ts` `no-restricted-imports` — add `firebase`, `firebase/*` to the backend-SDK-ish restricted patterns (with a clear message). Mirror into `react.ts` / `next.ts:82-122` if those redefine the rule (they do — check).
   - `tooling/scripts/src/check-boundaries.ts` `checkNoBackendDependencies` `FORBIDDEN` list — add `firebase`.
   - `no-restricted-properties` (or a `no-restricted-syntax` selector) banning `localStorage`/`sessionStorage` inside `packages/auth/**` — add to `base.ts` AND `react.ts`.
5. **`onboard/layout.tsx`** — `DashboardAuthProvider` → `SessionProvider` (with `getServerSession`). An anonymous visitor is already redirected by `proxy.ts`.

### Verification

```
pnpm --filter partner-dashboard test
pnpm --filter partner-dashboard typecheck
pnpm --filter partner-dashboard build
pnpm --filter @c1rcle/eslint-config build
pnpm --filter @c1rcle/tooling-scripts build      # or the actual tooling package name
git grep -n "firebase" apps/partner-dashboard/package.json          # empty
git grep -rn "firebase" apps/partner-dashboard/src                   # empty
test ! -d apps/partner-dashboard/src/app/verify                      # gone
test ! -d apps/partner-dashboard/src/app/api/kyc                     # gone
pnpm boundaries
```

- E2E: `/onboard` collects type+plan+profile, autosaves (assert `PATCH .../applications/:id` fired), the documents step shows the deferred message, submit is blocked with the "documents required" message. `GET /onboarding/me` reflects the saved profile on reload.
- Lint: a test fixture importing `firebase/auth` fails `pnpm lint`.

### Anti-patterns

- Do NOT wire a client-side Firebase Storage upload — signed-URL issuing is a backend gap.
- Do NOT show "Verified" for a format check.
- Do NOT collect `password`, `gold`, host-category `role`, OTP steps, business/signatory KYC, or bank fields.
- Do NOT keep `/verify` "just disabled" — delete it.

---

## Phase 8 — CSP finalisation, full journey E2E, cross-repo verification (FINAL)

**Goal:** prove the whole slice, both repos green.

**Spec refs:** §11.3, §14, §16.

### Tasks

1. **`apps/partner-dashboard/next.config.ts` `headers()`** — the CSP nonce lives in `proxy.ts` (Phase 5). Here add the **static** headers that do not need a nonce: `Strict-Transport-Security: max-age=31536000; includeSubDomains`, and keep the existing 4. If the team prefers CSP entirely in `next.config` (no nonce, `script-src 'self' 'unsafe-inline'`) that is a fallback — but the nonce path (Phase 5) is the chosen design; `next.config` only carries HSTS + the existing set. Confirm no duplicate CSP header (proxy vs config).
2. **E2E journey** — `apps/partner-dashboard/e2e/auth-journey.spec.ts` (new; there are no existing fixtures — build a small helper):
   - `e2e/helpers/gateway.ts` — starts the gateway on `STORAGE_DRIVER=firestore` (or assumes it is running via a `webServer` entry / `globalSetup`), and a `seedApprovedApplication(email)` helper: sign up, start an application, then approve it via `POST /api/v2/admin/onboarding/applications/:id/approve` using a platform-admin session seeded by `C1RCLE-BACKEND/apps/api-gateway/src/scripts/seed-platform-admin.ts` (resolve open question #1 here — pick the admin-API path; document the exact commands in the helper).
   - The spec:
     1. signup → redirected to `/onboard`
     2. fill type+plan+profile → autosave observed
     3. documents step shows the deferred state; submit blocked
     4. `seedApprovedApplication` out-of-band → poll `/onboarding/me` → `approved`
     5. `GET /organizations` → land in `/venue/overview` (or the type's studio) with a real session
   - Assertions: no request to a deleted `/api/auth/*` / `/api/kyc/*` route (request interceptor); every `/api/v2` request has `Authorization: Bearer`; org-scoped requests have `X-Organization-Id` == path segment; a forced 401 (expire the token) → exactly one `/api/auth/refresh` + one retry; `localStorage`/`sessionStorage` contain no token at any step; CSP response header present with a `nonce-`; wrong-password login shows the generic message.
3. **Cross-repo `pnpm check`:**
   ```
   cd C1RCLE-BACKEND && NODE_OPTIONS=--dns-result-order=ipv4first pnpm check
   cd C1RCLE-FRONTEND && pnpm check
   node C1RCLE-BACKEND/scripts/contract-parity.mjs --frontend C1RCLE-FRONTEND
   ```
4. **Grep gates** (add as a CI-ish shell script `C1RCLE-FRONTEND/tooling/scripts/src/check-auth-slice.ts` or just document):
   - `git grep -rn "firebase" apps/partner-dashboard/src` → empty
   - `git grep -rn "localStorage\|sessionStorage" packages/auth/src` → empty (or only in test files with the disable comment)
   - `git grep -rn "middleware" apps/partner-dashboard/src --include=*.ts -l` → no `middleware.ts`
   - `git grep -rn "data.*meta\|{ data:" ` in the new repositories → no `{data,meta}` unwrapping
   - `git grep -rn "'verified'\|\"Verified\"" apps/partner-dashboard/src/app/onboard` → no "verified" label on `verify-document` output
5. **Update docs:**
   - `C1RCLE-BACKEND/docs/roadmap/ROADMAP.md` — note the auth-foundation slice landed (frontend) + D-024.
   - `C1RCLE-FRONTEND/docs/architecture/README.md` — add `@c1rcle/auth` and `@c1rcle/contracts` to the single-owner table.
   - Close spec §16 open questions 1 (seed path chosen), 2 (`displayName` vs `legalName` — distinct, confirmed), 4 (`c1rcle.active-org` cookie). Leave #3 (password reset) as a tracked follow-up.
   - Update the memory files (`circle1_v2_rebuild_plan.md`).

### Verification

Everything in tasks 2–4 passes. The E2E journey is green against a real Firestore-backed gateway.

### Anti-patterns

- Do NOT declare done on a passing typecheck — the E2E journey against the real gateway is the gate (handoff Obs 3: typecheck ≠ runtime for auth-shaped code).
- Do NOT ship two `Content-Security-Policy` headers.
- Do NOT leave a `/verify` or KYC-hub stub anywhere.

---

## Deferred / follow-up (NOT this plan)

- **Backend:** signed-URL issuing for onboarding documents (`POST /onboarding/applications/:id/documents/upload-url`) — unblocks the real document-upload step.
- **Password reset** — `/forgot-password` + Better Auth reset endpoints.
- **TanStack Query migration** for partner-dashboard server-state — spec C.
- **Studio screen de-mock** (venue/host/promoter dashboards) — spec C.
- **guest-portal** de-mock (its own BFF + `@c1rcle/auth` consumer) — spec D.
- **admin-console** — spec E.
- **Backend Phase 5 completion** (the 6 × 501, the door/ WIP) — track G.
- **Social login** (Google) — later.

---

## Progress log

_(Builders append one line per phase: date, phase, commit, gate result.)_

- 2026-08-27 — Plan authored. Phases 0–8 defined. Awaiting execution.
