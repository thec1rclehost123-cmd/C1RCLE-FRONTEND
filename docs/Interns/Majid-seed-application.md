# Majid — Seed Application Detail View (Admin Dashboard)

## Task

On the Admin Dashboard **Onboarding** page and **KYC Review** page, clicking a seed
applicant / application name now displays **all** the information of that application
in a detail panel on the same screen.

Previously both pages rendered the applicant name as plain text with no click target and
no detail view. The full application detail endpoint already existed on the backend
(`GET /api/v2/admin/onboarding/applications/:requestId`, backed by
`onboardingService.getForReview` in the C1RCLE backend), so this task was frontend-only.

## Data flow (unchanged from other features)

The browser → `@c1rcle/api-client` → API gateway → backend pipeline is preserved; no
backend or BFF change was needed:

- Browser (React Query) → `getOnboardingApplication(id)` in the Admin Console's typed
  repository (`admin-api.ts`)
- → `getAdminApiClient().get({ path: '/api/v2/admin/onboarding/applications/:requestId', schema: onboardingRequestDtoSchema })`
  via `@c1rcle/api-client` (the only network module), with the admin's bearer token
- → Fastify API gateway `v2/admin/onboarding-review.ts` route (rate-limited, schema-validated)
- → `OnboardingService.getForReview` (admin authority check + request fetch) in the backend

## Files changed

| # | File | Change |
|---|------|--------|
| 1 | `apps/admin-console/src/lib/admin/admin-api.ts` | Added `getOnboardingApplication(applicationId)` next to `listOnboardingApplications` — GETs `/api/v2/admin/onboarding/applications/:requestId` validated against `onboardingRequestDtoSchema` (read-only, no idempotency key, matches existing admin AUTH_READ calls). |
| 2 | `apps/admin-console/src/components/admin/onboarding-application-detail.tsx` | **New shared component.** Renders every field of `OnboardingRequestDto`: status, requested type, plan, audit metadata (submitted/reviewed by/at, review note, provisioned org, missing documents, version, created/updated), the full applicant profile, and each document with its KYC state, timestamps, rejection reason, and an "Open" button that mints a signed read URL via the existing `getOnboardingDocumentReadUrl`. Includes Close + loading/error handling via `StatusBadge`, `formatDateTime`, `shortId`. |
| 3 | `apps/admin-console/src/app/onboarding/page.tsx` | Made the applicant `<p>` an underlined link-style `<button>` that selects the row; added `selectedId` state + lazy detail query (`['admin','onboarding','application',selectedId]`, `enabled: selectedId !== null`); highlights the selected row and renders the detail panel below the table. |
| 4 | `apps/admin-console/src/app/kyc-review/page.tsx` | Added a "View all details" button to each application card; added `selectedId` state + lazy detail query and renders the same detail panel below the grid. |

## Behavior notes

- Clicking a name/button fetches the full application once (`enabled` when selected) and
  shows it in a bordered panel; Close clears selection.
- The existing list queries, Approve / Request changes / Reject actions, and document
  Verify / Reject / Open flows are untouched — detail is a read-only addition sharing the
  same `['admin','onboarding']` invalidation prefix, so nothing else breaks.
- The BFF (`app/api/*` route handlers) is intentionally **not** used, matching every other
  admin data call in the app: the gateway admin API is bearer-token authenticated and
  `@c1rcle/api-client` is the sole network owner.

## Verification

- `tsc --noEmit` and ESLint on the four changed files are clean (the only remaining
  tsc/ESLint errors in the repo are pre-existing `fetchText` / `NEXT_PUBLIC_APP_ID`
  issues in untouched files `admin-api.ts` audit CSV export and `auth-proxy.ts`).
- No contracts change: `onboardingRequestDtoSchema` is the frozen generated wire shape.