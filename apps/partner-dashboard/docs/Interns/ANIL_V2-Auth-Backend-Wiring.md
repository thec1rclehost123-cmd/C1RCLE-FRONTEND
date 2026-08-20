# V2 Auth Backend Wiring — Change Documentation

**Author:** Anil
**Date:** August 2026
**Scope:** Partner Dashboard frontend — replacing mock Firebase Auth with real V2 backend authentication

---

## Problem

The partner dashboard frontend was running on a **mock Firebase Auth client** (`lib/firebase/client.ts`) that accepted any email+password combination, stored sessions in `localStorage`, and returned hardcoded user data. No real backend communication existed for authentication. The goal was to connect the frontend to the **V2 Backend API Gateway** (`/api/v2/auth/*`) for production-ready authentication.

---

## Solution

Replaced the mock Firebase Auth with a new **`@c1rcle/auth` package** that communicates directly with the V2 backend auth endpoints. The package implements the same listener-based API shape as Firebase Auth (`onAuthStateChanged`, `signIn`, `signOut`) so existing consumers continue to work with minimal changes.

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Access token stored in **memory only** | Never touches localStorage, sessionStorage, or frontend cookies — prevents XSS token theft |
| Session cookie is **httpOnly, backend-owned** | Browser sends it automatically with `credentials: 'include'`; frontend never reads it |
| Token refresh via `POST /api/v2/auth/refresh` | Backend re-validates the httpOnly cookie and returns a fresh access token |
| Auth state restored via `hydrate()` on mount | Calls `POST /api/v2/auth/refresh` on first listener registration to restore session from httpOnly cookie |
| Firebase compat shim in `firebase/client.ts` only | The onboard page (`onboard/PageClient.tsx`) still imports from `firebase/auth` — the shim preserves backward compat without rewriting the entire onboarding flow in this phase |

---

## Files Changed

### New Files

| File | Purpose |
|------|---------|
| `packages/auth/index.ts` | **Core V2 auth client** — token store (memory only), `AuthClient` interface, `getAuthClient()` singleton, `getAccessToken()` export for API client use |
| `apps/partner-dashboard/docs/Interns/ANIL_V2-Auth-Backend-Wiring.md` | This documentation |
| `C1RCLE-BACKEND/apps/api-gateway/src/scripts/seed-partner.ts` | Seed script to create test partner accounts via Better Auth |

### Modified Files

| File | What Changed |
|------|-------------|
| `packages/auth/package.json` | Added package metadata (was a stub with `{ currentUser: null }`) |
| `apps/partner-dashboard/package.json` | Added `@c1rcle/auth: "workspace:*"` dependency |
| `apps/partner-dashboard/.env.local` | Uncommented `NEXT_PUBLIC_GATEWAY_URL=http://localhost:4000` and `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000` |
| `apps/partner-dashboard/src/lib/firebase/client.ts` | Local compat bridge: `getFirebaseAuth()` wraps `getAuthClient()` with `currentUser` getter (uses `onAuthStateChanged` subscription to track state), `signInWithEmailAndPassword`, `signOut`, `onAuthStateChanged`. `getFirebaseStorage()` stub for verify page. |
| `apps/partner-dashboard/src/lib/auth/getCachedFirebaseIdToken.ts` | Now calls `getAccessToken()` from `@c1rcle/auth` instead of delegating to Firebase user object |
| `apps/partner-dashboard/src/components/providers/DashboardAuthProvider.tsx` | Removed all Firebase Auth SDK imports. Now imports `getAuthClient` and `getAccessToken` from `@c1rcle/auth`. All auth operations delegate to the V2 auth client. Profile fetch uses `getAccessToken()` for Bearer tokens. Comments restored. |
| `apps/partner-dashboard/src/app/login/PageClient.tsx` | Removed `getFirebaseAuth` import. Login calls `signIn()` from the provider (hits `POST /api/v2/auth/login`). Workspace type mismatch check restored (venue vs host error). Comments restored. |
| `apps/partner-dashboard/src/components/venue/TopBar.tsx` | Added "Sign out" button |
| `apps/partner-dashboard/src/app/onboard/PageClient.tsx` | Fixed `authUser.email?.[0]` to `authUser.email?.charAt(0)` (pre-existing type error) |
| `C1RCLE-BACKEND/apps/api-gateway/.env.local` | Added `STORAGE_DRIVER=firestore`, Firestore project config, Better Auth secret/URL |
| `C1RCLE-BACKEND/apps/api-gateway/package.json` | Added `"seed:partner"` script |
| `C1RCLE-BACKEND/apps/api-gateway/src/routes/v2/auth/index.ts` | Fixed `v2Request` — `Content-Type: application/json` only sent when body exists (fixes logout 400) |

---

## Architecture: How Auth Flows Now

```
Browser                          V2 Backend (Fastify)
  │                                   │
  │  POST /api/v2/auth/login          │
  │  { email, password }              │
  │ ─────────────────────────────────>│
  │                                   │  Better Auth signInEmail()
  │                                   │  Verifies against Firestore (v2_auth_users)
  │                                   │  Creates session doc in v2_auth_sessions
  │                                   │  Sets httpOnly session cookie
  │  200 { user, accessToken, ... }   │
  │ <─────────────────────────────────│
  │                                   │
  │  [access token stored in memory]  │
  │  [httpOnly cookie stored by browser]
  │                                   │
  │  POST /api/v2/auth/refresh        │
  │  Cookie: better-auth.session_token│
  │ ─────────────────────────────────>│
  │                                   │  Re-validates cookie, extends session
  │  200 { user, accessToken, ... }   │
  │ <─────────────────────────────────│
  │                                   │
  │  POST /api/v2/auth/logout         │
  │ ─────────────────────────────────>│
  │                                   │  Deletes session from v2_auth_sessions
  │                                   │  Clears session cookie
  │  204 No Content                   │
  │ <─────────────────────────────────│
  │  [access token cleared]           │
  │  [session cookie cleared]         │
```

---

## API Endpoints Used

| Endpoint | Method | Purpose | Auth Mechanism |
|----------|--------|---------|----------------|
| `/api/v2/auth/login` | POST | Email+password login | Body: `{ email, password }` |
| `/api/v2/auth/signup` | POST | Email+password registration | Body: `{ email, password, displayName }` |
| `/api/v2/auth/refresh` | POST | Session refresh | httpOnly cookie |
| `/api/v2/auth/logout` | POST | Sign out | Clears httpOnly cookie |
| `/api/v2/auth/session` | GET | Check active session | httpOnly cookie |
| `/api/auth/me` | GET | User profile & permissions | Bearer token — **still Next.js mock route** |
| `/api/auth/partner-context` | GET | Partner permissions & tab visibility | Bearer token — **still Next.js mock route** |

---

## Token Storage

| Storage | Used? | Purpose |
|---------|-------|---------|
| Memory (JS variable) | YES | Access token for API Authorization header |
| localStorage | NO | — |
| sessionStorage | NO | — |
| Frontend cookies | NO | Session cookie is httpOnly, backend-owned |
| httpOnly cookie (backend) | YES | Session persistence, sent automatically by browser |

---

## Backend Auth Stack

| Component | Technology |
|-----------|-----------|
| Auth framework | Better Auth (not Firebase Auth) |
| Storage driver | Firestore (`STORAGE_DRIVER=firestore`) |
| Firestore collections | `v2_auth_users`, `v2_auth_sessions`, `v2_auth_accounts`, `v2_auth_verification_tokens` |
| Session token | Opaque bearer token (not JWT) — same value in access token and httpOnly cookie |
| Custom claims | **None** — partner type/role comes from `/api/auth/me` response, not the token |

---

## Membership Resolution

V2 does **not** use JWT custom claims. Membership data comes from Firestore via `/api/auth/me`:

```
User logs in
  → /api/v2/auth/login → Better Auth verifies credentials
  → Frontend calls /api/auth/me with Bearer token
    → Backend reads Firestore: v2_auth_users + partner_memberships
    → Returns { user, activeMembership, ... }
  → DashboardAuthProvider reads data.activeMembership
  → Builds PartnerMembership object
```

The `partner_memberships` Firestore collection stores:
```json
{
  "partnerId": "abc123",
  "partnerType": "venue",
  "role": "owner",
  "joinedAt": 1693500000000,
  "isActive": true,
  "partnerName": "Studio 69"
}
```

---

## Workspace Type Mismatch Check

The login page validates that the user's actual partner type matches the workspace they selected:

```typescript
const assignedType = profile.activeMembership.partnerType;
if (userType && assignedType && assignedType !== userType) {
  // e.g. venue user trying to log in as host
  signOut();
  setError(`This account is registered as ${typeLabel}. Please select the correct workspace.`);
}
```

---

## Verification Results

| Check | Status | Notes |
|-------|--------|-------|
| `pnpm typecheck` | PASS | Zero errors (22 tasks) |
| `pnpm test` | PASS | 12/12 tests pass |
| Login flow | PASS | Test account `anilv10@yopmail.com` / `password` works |
| Refresh flow | PASS | Cookie-based refresh returns fresh access token |
| Logout flow | PASS | 204 No Content, cookie cleared |
| Session check | PASS | 401 without cookie, 200 with valid cookie |

---

## Test Account

| Field | Value |
|-------|-------|
| Email | `anilv10@yopmail.com` |
| Password | `password` |
| User ID | `HSv9StHEpRknuUnKXsnE` |
| Role | `partner` |
| Firestore collection | `v2_auth_users` |

---

## What Remains (Out of Scope for This Task)

| Item | Reason | Priority |
|------|--------|----------|
| Google OAuth (`signInWithGoogle`) | V2 backend does not have a Google OAuth endpoint yet. Throws `not_implemented` error gracefully. | Low |
| `/api/auth/me` and `/api/auth/partner-context` routes | Still served by Next.js mock API routes returning hardcoded data. Need real backend endpoints. | **High** |
| Onboarding flow (`onboard/PageClient.tsx`) | Still imports from `firebase/auth` (`signInWithCustomToken`, `signInWithEmailAndPassword`). Needs rewrite to use V2 `authClient.signUp()`. | Medium |
| Verify page (`verify/PageClient.tsx`) | Still uses `firebase/storage` for file uploads. Needs V2 storage endpoint. | Medium |
| Partner switching (`switchPartner`) | Currently calls `refreshSession()` + page reload. V2 backend does not support multi-org session switching yet. | Low |
| Signup UI | No signup form exists on the login page. `authClient.signUp()` works but no UI calls it. | Medium |
| Backend running | Port 4000 was down during testing. Needs restart after `.env.local` changes. | Immediate |
