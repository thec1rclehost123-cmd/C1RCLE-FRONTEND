# PR16 — Intern Contract Review

**Review of the intern contracts delivered through PR #16 (`feat/partner-auth-org-flow`) and hardened in PR #18 (`merge/partner-auth-org-flow`).**

|                      |                                                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**           | ✅ Delivered + hardened; follow-ups closed 2026-09-26                                                                                                 |
| **Contract source**  | [`docs/superpowers/INTERN-TASKS-2026-08-27.md`](./INTERN-TASKS-2026-08-27.md) (Tracks 1–3)                                                            |
| **Feature branch**   | `feat/partner-auth-org-flow` → merged to `staging` at `b78098b`                                                                                       |
| **Hardening branch** | `merge/partner-auth-org-flow` → merged to `staging` at `27c6821` (PR #18)                                                                             |
| **Scope**            | `apps/partner-dashboard`, `packages/auth`, `packages/api-client`, `packages/contracts`, `packages/icons`, `apps/guest-portal` (promoter vanity links) |
| **Last reviewed**    | 2026-09-26 (see [Follow-up resolution](#follow-up-resolution))                                                                                        |

This is a living document — update it when the tracked gaps in [Remaining gaps](#remaining-gaps) move.

---

## 1. Purpose

PR #16 was the delivery vehicle for the intern contracts defined in
`INTERN-TASKS-2026-08-27.md`: three parallel tracks, one intern per track, one
branch per track, all funneled into `feat/partner-auth-org-flow` and merged to
`staging`. This doc records what the contract promised, what actually landed,
what the landing review found and fixed, and what is still open.

## 2. The contracted scope (per `INTERN-TASKS-2026-08-27.md`)

| Track                                       | Owner(s)            | Delivered Surface                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Track 1 — Auth package + BFF**            | Auth intern(s)      | `packages/auth/**` rebuilt into a compiled react-library (`session-store`, `auth-client`, `server-session`); BFF handlers `apps/partner-dashboard/src/app/api/auth/{signup,login,refresh,logout,session}`; `lib/bff/auth-proxy.ts` helpers. Gate: auth + BFF tests green.                                                                                     |
| **Track 2 — App shell + integration (CSP)** | App-shell intern(s) | `src/proxy.ts` (per-request CSP nonce + auth redirect), `next.config.ts` (HSTS), `SessionProvider`, `lib/api/client.ts` composition root, `lib/org/*` (active-org cookie + org repository), `lib/access/use-org-access.ts`, `select-organization` page. Gate: partner-dashboard build/test/typecheck + boundaries green.                                      |
| **Track 3 — Screens + mock teardown**       | Screen intern(s)    | Rebuilt `login`, new `signup`, onboarding wizard per [`ONBOARDING-FLOW-SPEC-2026-09-01.md`](./ONBOARDING-FLOW-SPEC-2026-09-01.md) (6-step, Better Auth email+password, phone = typed unverified field, 3 documents, review + submit); teardown of the 11 mock Firebase `/api/auth/*` routes. Gate: partner-dashboard build/test/typecheck + boundaries green. |

**File ownership was strict** — interns only touched their listed files; anything
outside required lead sign-off.

## 3. What the interns documented

Each intern wrote a walkthrough in `docs/Interns/` describing their slice and how
to verify it:

- [`KESHVI-PARTNER-V3-AUTH-ORG.md`](../Interns/KESHVI-PARTNER-V3-AUTH-ORG.md) — the auth/org rework: real-gateway login, org selection, `use-org-access`, removed mock Firebase layer (11 routes + `getCachedFirebaseIdToken.ts` + `lib/firebase/client.ts`). Net: 21 files changed, +441/−1706, plus 7 new files (~476 lines). Self-verified: typecheck clean, 241/241 tests, 0 lint problems in covered files, boundaries clean.
- [`Majid-Onboarding-and-teardown.md`](../Interns/Majid-Onboarding-and-teardown.md) + [`Onboardingflow.md`](../Interns/Onboardingflow.md) + [`LOGIN_SIGNUP_ONBOARDING_FLOW.md`](../Interns/LOGIN_SIGNUP_ONBOARDING_FLOW.md) — onboarding wizard and mock teardown.
- [`Majid-Presence-Tab.md`](../Interns/Majid-Presence-Tab.md) — venue/host Presence tab (`dc879d1`). Note: it documents `Upload as UploadIcon` in the `@c1rcle/icons` facade; the shipped tab uses an inline SVG, so the facade export was never referenced (removed post-merge, see [§5](#5-landing-review-findings-and-fixes)).
- [`ANIL_SECURITY-APP-SHELL.md`](../Interns/ANIL_SECURITY-APP-SHELL.md) — app-shell / security hardening (proxy, CSP, session provider).
- [`ANIL-CALENDAR-BLOCK-UNBLOCK-WIRING.md`](../Interns/ANIL-CALENDAR-BLOCK-UNBLOCK-WIRING.md) — calendar block/unblock wired to the real gateway (`b0b560d`, `9349662`).
- [`Intern3-KYC-File-Zones-and-Org-Selection.md`](../Interns/Intern3-KYC-File-Zones-and-Org-Selection.md) — KYC file zones + org selection.

## 4. Delivered vs contract

Everything on the contract landed in PR #16 (feature-branch commits, see
`git log 91f1f6a --not d945b8b`):

- **Auth**: `@c1rcle/auth` compiled library (`signup`/`login`/`refresh`/`logout`/`fetchSession`/`getServerSession`), BFF `/api/auth/*` with origin check + CSRF + cookie rescoping, refresh-stampede guard, token rotation on org switch.
- **Org**: `select-organization` (0 → `/onboard`, 1 → auto-set, many → picker), `c1rcle.active-org` cookie, `use-org-access` (403 → suspended), subdomain-safe headers (`x-organization-id`).
- **Screens**: login rebuild (no workspace picker, single-step email/password, per-field 422 errors), new `signup`, onboarding wizard per spec, calendar + host availability screens, event editor v3, presence tab, notifications drawer, promoter custom landing page + click tracking.
- **Contracts**: partnership / promoter-connection DTOs + Zod wire schemas in `packages/contracts`; `@c1rcle/api-client` `reauth` + `Retry-After`.
- **Teardown**: 11 mock Firebase auth routes + mock auth layer deleted.

**Wire-contract discipline held**: `packages/contracts` remains generated from the
backend (no hand-edits); the frontend proxies through the gateway and never calls
Firebase Admin in runtime.

## 5. Landing review findings and fixes

The landing review (PR #18, `27c6821`) applied hardening on top of the delivered
feature work:

1. **Format normalization** — whole-repo `prettier --write` (~88 files) to satisfy the shared config (`endOfLine: 'lf'`); only real diffs remained after the CRLF-worktree normalization.
2. **Boundary fixes** — `gateway-proxy.ts` relocated `lib/help/` → `lib/bff/` (R099); deleted `apps/partner-dashboard/src/lib/onboarding/uploadToSignedUrl.ts` (no remaining references — only doc mentions).
3. **Coverage additions** — real tests added where thresholds are enforced and coverage dipped: `@c1rcle/api-client` (errors/factory/client), `@c1rcle/config` (env/schema), `@c1rcle/hooks` (use-mounted, use-media-query), `@c1rcle/ui` (card, states, button). Full gate: `pnpm test:coverage` 21/21 tasks, 0 cached.
4. **CI parity checks** — lint / typecheck / test / build all green with the CI env seeding (`apps/*/.env.example` → `.env.local`); PR `mergeable: MERGEABLE` / `CLEAN`.

## 6. Follow-up resolution

Closed on this branch (`chore/pr18-followups`, 2026-09-26):

| Follow-up                                                   | Resolution                                                                                                                                                                                                              |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intern contract review doc                                  | ✅ This document.                                                                                                                                                                                                       |
| `apps/partner-dashboard/src/lib/api/partner-connections.ts` | ✅ **Dropped** — grep confirmed zero references anywhere in the repo; deleted as dead code.                                                                                                                             |
| `@c1rcle/icons` `UploadIcon` export removal                 | ✅ Verified: no code imports `UploadIcon` (only historical intern docs mention it). Removed the unused `Upload as UploadIcon` facade export (`packages/icons/src/index.ts`). No stale references.                       |
| Guest-portal promoter components coverage                   | ✅ Added vitest tests: `PromoterClickTracker.test.tsx` (sessionStorage + click POST + swallow-failure) and `[promoterHandle]/[vanitySlug]/page.test.tsx` (resolution → redirect w/ URL-encoding; failure → `notFound`). |

## 7. Remaining gaps (tracked, not blocking)

Documented in [`KESHVI-PARTNER-V3-AUTH-ORG.md`](../Interns/KESHVI-PARTNER-V3-AUTH-ORG.md):

- `apps/partner-dashboard/src/app/onboard` and `src/app/verify` are **compile-only stubs** — they still call `legacyFetch('/api/auth/...')` against deleted endpoints (404 in practice). Rebuilding them against the real `User` DTO is the next real slice (Phase 7); the stubs are a placeholder, not a fix.
- `firebase` is still in partner-dashboard `package.json` — removal planned after auth/BFF stabilization.
- `getActiveOrgIdFromCookieHeader` has no caller yet (exists for the server-side contract when a studio layout Server Component needs it).

## 8. Sign-off

- [x] Contract scope (Tracks 1–3) delivered in PR #16 and merged (`b78098b`) ✅
- [x] Landing review findings applied in PR #18 and merged (`27c6821`) ✅
- [x] CI gates green at merge time (lint → typecheck → test → build) ✅
- [x] Dead code dropped (`partner-connections.ts`), unused icon export removed, promoter components tested — verified on `chore/pr18-followups` ✅
- [x] Review doc written; linked from sprint docs for discoverability ✅
