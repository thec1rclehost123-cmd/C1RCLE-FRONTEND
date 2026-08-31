# Walkthrough — Partner Dashboard auth/org rework

This walks through the change the way you'd actually trace it — starting from a new partner
hitting `/signup`, following them through login and organization selection, then dropping into
the plumbing (`DashboardAuthProvider`, the org/access data layer) that makes those screens work,
and finishing with the two screens that were deliberately _not_ migrated.

**The one-line version:** the mock Firebase auth layer (11 files) is gone; auth now runs through
the real `/api/v2` gateway via `@c1rcle/auth`; login and org-selection are rebuilt against a new
org/access data layer; and two legacy screens (`onboard`, `verify`) were patched just enough to
keep compiling, not rebuilt.

---

## Step 1 — A new partner signs up

Start at [`src/app/signup/page.tsx`](../../apps/partner-dashboard/src/app/signup/page.tsx)
(230 lines) and its [`layout.tsx`](../../apps/partner-dashboard/src/app/signup/layout.tsx) — both
new, untracked files. This screen calls `auth.signup()` from `@c1rcle/auth` directly: email +
password (minimum length 8) + display name, no `role` field on the form. A 422 response from the
gateway is walked field-by-field and surfaced under the matching input, rather than shown as one
generic error string.

There's nothing to migrate here — this screen was already built correctly against the real API
before this slice of work started.

## Step 2 — They log in

Open [`src/app/login/PageClient.tsx`](../../apps/partner-dashboard/src/app/login/PageClient.tsx)
— this is the single biggest diff in the change (930 lines touched) because it's a rebuild, not
a patch. What used to be here: a workspace-type picker (pick venue/host/promoter as a tile before
you could even see the login form), a multi-step `step` state machine, per-role theming, and a
link to `/forgot-password` — a route that doesn't exist. All of that is gone.

What's here now is a single-step email/password form:

1. Submit → `login({ email, password })` from `@c1rcle/auth`.
2. On success, call `getOrganizations()` (Step 3 below) to decide where to send the user:
   - 0 organizations → `/onboard`
   - exactly 1 → auto-select it via `setActiveOrg()` and route straight to its resolved
     partner-v3 path (no picker screen shown)
   - 2+ → falls through to the picker (Step 4)
3. A 422 on login now populates `fieldErrors` per-input, matching what signup already did —
   previously login only ever showed a single generic string, even on a 422.

The branding panel and ambient background animation (`AmbientBg`, the rotating rings) are still
there, just restyled to one fixed brand accent instead of switching per role. If you look closely
at the JSX you'll notice there's no `style={{...}}` anywhere in this file — those were converted
to Tailwind arbitrary-value classes (`w-[460px]`, `bg-[rgba(244,74,34,0.18)]`, etc.) because
inline styles are banned by a design-system lint rule; the three rotating rings were unrolled
from a computed loop into a literal `RING_SPECS` array so Tailwind's JIT compiler could see the
class names statically instead of at runtime. Two lint issues were deliberately left as
documented exceptions rather than fixed: the `lucide-react` icon imports (the codebase's
`package.json` names `@c1rcle/icons` as the intended replacement, but that package doesn't exist
in the monorepo yet, so migrating isn't possible — all four auth screens share this debt) and the
`PageClient.tsx` default export (the Next.js lint allowlist only covers `page.tsx` itself, and
this file split predates this change).

One small companion change: [`src/app/login/layout.tsx`](../../apps/partner-dashboard/src/app/login/layout.tsx)
no longer wraps the page in `<DashboardAuthProvider>` — it's just `<>{children}</>` now. The
login screen doesn't need org/session context before you're even signed in.

## Step 3 — The data layer both screens lean on

Before going further, it's worth reading these three new files in `src/lib/` — everything above
and below calls into them:

- [`lib/org/org-repository.ts`](../../apps/partner-dashboard/src/lib/org/org-repository.ts)
  (31 lines) — `getOrganizations()`. One function: `GET /api/v2/organizations` through the shared
  `apiClient`, parsed with `paginatedSchema(organizationDtoSchema)`.

- [`lib/org/active-org.ts`](../../apps/partner-dashboard/src/lib/org/active-org.ts) (79 lines,
  tested in the sibling `active-org.test.ts`) — owns the `c1rcle.active-org` cookie. This cookie
  is an _id hint_, not a credential — it's deliberately readable by both client and server
  (unlike the access token, which never leaves memory, or the session cookie, which is httpOnly).
  Three exports:
  - `getActiveOrgId()` — client-side read, parses `document.cookie`.
  - `getActiveOrgIdFromCookieHeader(cookieHeader)` — the same parser, but framework-agnostic (no
    `next/*` import), so a Server Component can call it with
    `getActiveOrgIdFromCookieHeader((await cookies()).toString())`. Nothing calls this yet — it
    exists for when a studio-layout Server Component needs it later.
  - `setActiveOrg(orgId)` — writes the cookie (adds `; Secure` when
    `NEXT_PUBLIC_ENVIRONMENT === 'production'`), then calls `@c1rcle/auth`'s `refresh()` so the
    next access token gets stamped with the new org context. If that refresh call fails, it's
    swallowed on purpose — the next gateway call just 401s and reauths normally, so there's
    nothing useful to do with the error here.

- [`lib/access/use-org-access.ts`](../../apps/partner-dashboard/src/lib/access/use-org-access.ts)
  (109 lines, tested in `use-org-access.test.ts`) — the `useOrgAccess(orgId)` hook. Fetches
  `GET /api/v2/organizations/:id/access` and maps the response to
  `{ partnerType, role, permissions, tabVisibility, hasPermission(), tabVisible() }`. A 403 from
  that endpoint is treated as `isSuspended: true`, not a generic error. Worth noting how it
  avoids a stale-data flash: instead of pushing "is this loading" into state from inside the
  effect, it stores `{ orgId, access, error }` per-fetch and derives staleness at render time by
  comparing the _last-fetched_ org id against the _current_ org id — if they don't match, it
  renders as still-loading rather than briefly showing the previous org's permissions.

## Step 4 — Choosing between multiple organizations

Open [`src/app/partner/select-organization/page.tsx`](../../apps/partner-dashboard/src/app/partner/select-organization/page.tsx)
(115 lines changed). This is the screen a user with 2+ orgs lands on after Step 2. It used to
read `useDashboardAuth().memberships`; now it calls `getOrganizations()` directly in a
`useEffect` and stays a client component on purpose — every `/api/v2` data read in this
architecture authenticates with a Bearer token that lives only in browser memory, so a Server
Component here would have no token to send.

Same branching logic as the login screen (0 → `/onboard`, 1 → auto-select, 2+ → render tiles),
because a user could also land here directly rather than via a fresh login. Each tile now reads
the real `OrganizationDto` shape (`org.id` / `org.name` / `org.role`) instead of the old
`membership.partnerId` / `partnerName`. Clicking a tile calls `setActiveOrg(org.id)`, then routes
to whatever route was last visited for that org (read from `localStorage`,
`partner:last-route:<orgId>`) or a role-resolved fallback if there isn't one. Two things that
didn't exist before: a loading state while the fetch is in flight, and an inline error message if
it fails.

## Step 5 — The context that ties it together

Open [`src/components/providers/DashboardAuthProvider.tsx`](../../apps/partner-dashboard/src/components/providers/DashboardAuthProvider.tsx)
(683 lines changed — the second-largest diff). This is what every screen in the app actually
calls through `useDashboardAuth()`, and the point of this rewrite was to keep that same context
_shape_ intact — same field names, same function signatures — so the ~34 existing call sites
across the app didn't need to change, while swapping what's underneath from Firebase to
`@c1rcle/auth` + the Step 3 data layer. The file also keeps its original name and path (there was
a case for renaming it to something like `session-context.tsx` now that Firebase is gone, but
that would mean touching all ~34 import sites for a cosmetic win) — the `useDashboardAuth` alias
stays as-is:

| Field on the context            | Now backed by                                  |
| ------------------------------- | ---------------------------------------------- |
| `user`                          | `useSessionStore().session.user`               |
| `isApproved`                    | `activeOrgId !== null \|\| user !== null`      |
| `signIn` / `signUp` / `signOut` | `@c1rcle/auth`'s `login` / `signup` / `logout` |
| `hasPermission` / `canDo`       | `useOrgAccess().hasPermission`                 |
| `switchPartner`                 | `setActiveOrg()` from Step 3                   |
| `getIdToken`                    | `getAccessToken()`                             |
| `signInWithGoogle`              | now rejects — "not supported on V2 API"        |

Fields with no V2 equivalent — `isBanned`, `kycStatus`, `entityType`, `subscriptionPlan`,
`actionPermissions`, `piiPolicy`, `mustChangePassword`, and the old 30-second polling loop —
are stubbed to inert defaults (`false`, `null`, `'basic'`, etc.) instead of being deleted, so any
downstream code still reading them degrades quietly instead of breaking.

Two bugs worth knowing about if you're reading this file: `orgAccess.partnerType` / `.role` used
to be narrowed with `as any`, bypassing validation; they now go through `toPartnerType()` /
`toStaffRole()` helpers that check the value against the real union and fall back to a safe
default (`'venue'` / `'owner'`) instead of blindly trusting a string. And `joinedAt` used to be
computed from `Date.now()` inside a `useMemo` (impure — a fresh timestamp every render); nothing
downstream actually reads that field, so it's now a fixed `0`.

## Step 6 — The two screens that were _not_ migrated

[`src/app/onboard/PageClient.tsx`](../../apps/partner-dashboard/src/app/onboard/PageClient.tsx)
(42 lines changed) and
[`src/app/verify/PageClient.tsx`](../../apps/partner-dashboard/src/app/verify/PageClient.tsx)
(21 lines changed) both still assume the old Firebase-shaped `user` object (`.uid`,
`.getIdToken()`), which no longer exists now that `DashboardAuthProvider`'s `user` comes from the
session store. Rebuilding either screen was out of scope for this slice, but they had to keep
_compiling_ once the real Firebase SDK and the mock `/api/auth/*` routes (Step 7) disappeared —
so:

- `getFirebaseAuth`, `signInWithEmailAndPassword`, `signInWithCustomToken` (onboard) and
  `getFirebaseStorage`, `ref`, `uploadBytesResumable`, `getDownloadURL` (verify) are now local
  stub functions that return empty tokens / no-op — no real Firebase call happens.
- Every `fetch('/api/auth/...')` and `fetch('/api/kyc/...')` call in both files was renamed to
  `legacyFetch(...)`, a thin `window.fetch` alias. This is cosmetic — the calls still point at
  the same (now-deleted) endpoints, so they'll 404 in practice until these two screens are
  actually rebuilt.

**If you're picking up Phase 7 work, these two files are exactly where to start** — the stubs
here are a placeholder, not a fix.

## Step 7 — What got removed

The entire mock Firebase auth layer is deleted, 11 files in total:

```
src/app/api/auth/check-availability/route.ts
src/app/api/auth/check-email/route.ts
src/app/api/auth/create-account/route.ts
src/app/api/auth/me/route.ts
src/app/api/auth/onboard-status/route.ts
src/app/api/auth/onboard/route.ts
src/app/api/auth/onboarding-progress/route.ts
src/app/api/auth/otp/send/route.ts
src/app/api/auth/otp/verify/route.ts
src/app/api/auth/partner-context/route.ts
src/app/api/auth/profile/route.ts
src/lib/auth/getCachedFirebaseIdToken.ts
src/lib/firebase/client.ts
```

These backed custom-token sign-in, OTP send/verify, and mock onboarding endpoints — none of it
needed anymore now that Steps 1–5 talk to the real gateway.

Two small config-only edits round things out:
[`src/app/globals.css`](../../apps/partner-dashboard/src/app/globals.css) picked up a comment
and a blank line around `@tailwind base;` (no functional change), and
[`tailwind.config.js`](../../apps/partner-dashboard/tailwind.config.js) had its `content` glob
list trimmed from 5 entries to 2 — `./app/**`, `./components/**`, `./lib/**` were redundant with
the existing `./src/**` glob and were removed.

---

## Net size

```
21 files changed, 441 insertions(+), 1706 deletions(-)
```

plus 7 new untracked files (~476 lines): `signup/page.tsx`, `signup/layout.tsx`,
`lib/org/org-repository.ts`, `lib/org/active-org.ts` + its test, and `lib/access/use-org-access.ts`
+ its test.

## Verifying it yourself

```
pnpm --filter @c1rcle/app-partner-dashboard typecheck   # clean
pnpm --filter @c1rcle/app-partner-dashboard lint         # 876 problems total, all pre-existing
                                                          # and outside the files above; 0 in
                                                          # every file this walkthrough covers
pnpm --filter @c1rcle/app-partner-dashboard test         # 241/241 passed
pnpm boundaries                                           # no architectural violations
```

(re-run 2026-08-31, same day as this doc)

## Where to go next

- Step 6's two files are the next real work: rebuild `onboard`/`verify` against the real `User`
  DTO (Phase 7).
- `firebase` is still in `package.json` — removal is planned for after Track 1+2 merge, not this
  slice.
- `getActiveOrgIdFromCookieHeader` (Step 3) has no caller yet — it exists to satisfy the
  server-side contract for when a studio-layout Server Component needs it.
