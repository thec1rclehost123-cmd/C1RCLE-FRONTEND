# Intern 3 — KYC File Zones + Org Selection (Frontend Re-wire)

> **Status (2026-09-08):** on `codex/partner-v3-rebuild`. Two tasks in the Intern 3
> scope shipped this pass: **Task 1 — KYC File Zones** and **Task 2 — Org Selection**.
> The `phone_verify` UI slice was out of scope for this pass (blocked then on Dev 1
> backend `firebase-phone-verifier` + Dev 2 `phone-verification` BFF route); it
> shipped later as the wizard's phone step (see `Onboardingflow.md` §2.1).

## Context

The frontend re-wire (`docs/superpowers/INTERN-TASKS-2026-08-27.md`, Track 3) hands
Intern 3 the onboarding wizard's KYC file zones and the org-selection screen. The
assignment doc describes the "3-step client-presigned" flow:
`documents/upload-url` → **PUT the file straight to storage** → `documents` confirm.
This collided with the repo's own hard infrastructure (built by Tracks 1–2):

- `src/proxy.ts` CSP `connect-src 'self' <API base>` — the browser is _forbidden_ by
  the app's own CSP from PUTting to a storage origin (`storage.googleapis.com`).
- `tooling/scripts` boundary check — raw `fetch` is only sanctioned under
  `src/lib/bff/` (`BFF_NETWORK_EXCEPTION`).
- `putToStorage` in `auth-proxy.ts` is the sanctioned server-side PUT (no-op for
  the backend memory driver's `memory://` URLs; "browser never sees the storage
  origin → CSP-clean").

**Decision (with the lead, 2026-09-08):** implement the **repo-coherent server-side
PUT** — the browser only talks same-origin to the BFF; the file bytes move
BFF-side via `putToStorage`. This keeps `pnpm boundaries` and CSP intact and
matches the documented reference transport
(`docs/Interns/Onboardingflow.md` §3).

## Task 1 — KYC File Zones (server-side presigned upload, repo-coherent)

**Objective:** the onboarding wizard's document step (id_front / id_back / selfie)
uploads through the real V2 gateway — no mocks, no fixtures, no Firebase.

**Findings:** the transport was already the reference surface —
`PageClient.handleFileChange` → `POST /api/bff/.../documents/upload?label=` (raw
bytes) → BFF absorbs the body → gateway `upload-url` → `putToStorage` → `documents`
confirm with the caller's `Idempotency-Key`. The BFF route also validates label /
content-type (415) / size (413). **No BFF route changes were required.**

**Change made** — `apps/partner-dashboard/src/app/onboard/PageClient.tsx`:

- Added `KYC_MAX_BYTES` (5 MB) and `KYC_ALLOWED_CONTENT_TYPES`
  (`image/jpeg | image/png | image/webp`) mirroring the gateway's
  `documentUploadUrlRequestSchema` rules.
- `handleFileChange` now rejects an invalid content type or an oversized file
  **before** it leaves the browser (instant, typed error; no network round-trip).
- Upload status flow unchanged: `uploading → idle | error`, done-label tracking,
  confirm returns the updated `OnboardingRequestDto`.

**Leaning in on the existing guarantees:** 415/413 are also enforced at the BFF
(content-type + `content-length` + buffered bytes), and the gateway owns authz + the
signed URL. The `verify-document` affordance still renders only "Format check
passed — pending manual review", never "Verified".

## Task 2 — Org Selection (real setActiveOrg + org graph)

**Objective:** `apps/partner-dashboard/src/app/partner/select-organization/page.tsx`
must list the user's **real** organizations and switch the live active-org, not the
legacy stub surface.

**Problem found:** the page read `auth.profile?.activeMembership`, `auth.memberships`
and `auth.switchPartner(...)`. In `session-context.tsx` `memberships` is derived from
the active org only, so the picker could **never** list more than the already-active
workspace — functionally broken.

**Change made** — full rewrite of the page on the real org layer, later refined to the current
behaviour:

- List orgs from `getOrganizations()` (`GET /api/v2/organizations`,
  `paginatedSchema(organizationDtoSchema)`) — real data, no fixtures. Error → typed
  unavailable state. Zero orgs → `router.replace('/onboard')`; exactly one → `setActiveOrg(org.id)`
  + `resolveOrgOverviewPath(org.id)` then replace — the picker only renders for 2+ orgs.
- The list load is gated on `useSessionStore().hydrated` (same token-hydration rule as
  `useOrgAccess`: firing `getOrganizations` before the session `refresh()` resolves a token 401s).
- Active org from `getActiveOrgId()` (`c1rcle.active-org` cookie); tiles are labelled from
  `org.role` via `normalizePartnerRole` (staff-role vocabulary — the header comment stresses
  `org.role` is **never** the partner type, which is why routing goes through
  `resolveOrgOverviewPath`).
- Selecting an org calls **`setActiveOrg(org.id)`** (sets the cookie and triggers token rotation),
  then routes to `partner:last-route:<orgId>` from localStorage (fallback
  `resolveOrgOverviewPath(org.id)` → `/partner/{venue|host|promoter}/overview`). Routing is
  **`window.location.assign`** (full page load), not `router.push`: the auth provider seeds its
  active-org state once from the cookie in a lazy init, so a client-side push would leave it stale
  and every studio guard bounces straight back to this picker.
- The earlier per-tile `useOrgAccess(org.id)` / suspended-tile-disable detail was dropped in the
  refinement; `auth.switchPartner` and the stub memberships are no longer used here.

## Files touched

- `apps/partner-dashboard/src/app/onboard/PageClient.tsx` — client-side KYC
  validation guard (Task 1).
- `apps/partner-dashboard/src/app/partner/select-organization/page.tsx` — real org
  layer rewrite (Task 2).

## Verification

- `pnpm --filter @c1rcle/app-partner-dashboard typecheck` — green.
- `pnpm --filter @c1rcle/app-partner-dashboard test` — **271 tests / 76 files pass**
  at the time (current tree: **305 tests / 81 files**).
- `pnpm exec eslint` on both touched files — clean (the 4 `onboard/PageClient.tsx`
  lint errors reported by the full app lint then — lines 3/321/372/374 — have since
  been fixed; the file is lint-clean in the current tree).
- `prettier --write` applied to both files; format `--check` clean for them.
- `pnpm boundaries` then reported 2 **pre-existing** violations
  (`src/app/login/PageClient.tsx` raw `fetch` — resolved since, the login page is fully
  migrated (see `Majid-Onboarding-and-teardown.md`); `src/lib/bff/auth-proxy.ts` flagged
  because `tooling/scripts/dist` is a stale build that lacks the `bff` exception — still
  stands). Neither file was touched here.

## Remaining (out of scope this pass)

- **`phone_verify` UI** — blocked then on Dev 1 (backend `firebase-phone-verifier`)
  and Dev 2 (`phone-verification` BFF route). Shipped later as the wizard's phone
  step (Firebase `phone-auth.ts` + `/api/bff/onboarding/verify-document`, see
  `Onboardingflow.md` §2.1).
- **Full `pnpm check` repair** is repo-wide debt predating this pass (current full-app
  lint: **480 problems / 478 errors / 2 warnings**, stale `tooling/scripts/dist`; the
  login-page raw `fetch` noted then is gone with the login migration); flag for the
  lead, not part of Intern 3.
