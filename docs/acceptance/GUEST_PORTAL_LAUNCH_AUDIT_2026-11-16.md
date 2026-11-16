# C1RCLE Guest Portal — Launch-Readiness Audit (partial, evidence-based)

**VERDICT: GUEST PORTAL LAUNCH READY — NO**   **FINAL STATE (see ADDENDUM 3): Score 62/100 — GUEST PORTAL LAUNCH READY: NO — HUMAN-ASSISTED ACCEPTANCE: NOT READY**

Audited 2026-11-16. Hosted: https://guest.thec1rcle.com (Vercel, behind SSO; audited with a bypass token, rotate it now).
API: https://circle-v2-backend.onrender.com. No code changed, nothing deployed, no PR, no payment, no account mutation.

| Component | Source SHA (audit branch) | Deployed SHA | Env |
|---|---|---|---|
| Guest Portal | 6d609542 (PR #119) | NOT VERIFIABLE (no build id exposed) | guest.thec1rcle.com (Vercel) |
| API gateway | 3dc72938 (PR #191) | NOT VERIFIABLE (no /version endpoint) | Render |

## Coverage honesty (see ADDENDUM at bottom for second-pass results)
Tested live: logged-out public routes (desktop + 320/375/390/430), login (wrong + right password), authenticated Tickets/Profile/Saved/Help,
event detail (3 events, API-compared), checkout up to the Pay button (quote, eligibility, invalid promo), Web Vitals, headers, source review.
NOT tested: Google OAuth completion, signup/OTP/Firebase phone, RSVP execution, transfers, refund submission, payment, hold expiry,
Safari/iOS, deep keyboard/screen-reader a11y, DB/Firestore index inspection, offline/timeout injection, multi-tab logout, search+filter matrix.
Those phases are "not verified", not "passed".

## Route matrix (source + browser)
Public: / /explore /search /event/[id] /hosts (/host = 5-line alias) /host/[id] /venue/[id] /about /privacy /terms /login /signup /forgot-password /reset-password /verify-email /app /[promoter]/[slug] /ticket-transfer/[id] /event-cover-confirm/[id]
Private (proxy redirect to /login?next=): /profile /profile/saved /profile/events/[id]/guestlist /tickets /help /checkout/[id] /confirmation/[id] /onboarding
**Do not exist (404 confirmed):** /wallet /orders /settings /notifications. APIs exist for wallet + notifications but there is no UI surface for notifications or settings.

## Findings ledger
### P1 — launch blockers
**GUEST-001 Localhost poster URLs served to Guests.** 10/54 public events (6 of the 15 in the discovery feed the UI uses) have `imageUrl=http://localhost:3001/partner-v3/venue/neon-nights-poster.jpg`. Every visit to /, /explore, /search, /hosts, event pages fires failed mixed-content requests (ERR_CONNECTION_REFUSED) and shows "EVENT ARTWORK UNAVAILABLE". Layer: database + missing read-side normalization (the guard in backend 967b6f3 / PR #119 validates on write only; #191 normalizes slot requests only). Confirmed. Fix: migrate/null the 10 rows, normalize on read in the public DTO mapper, filter in guest mappers.
**GUEST-002 Google sign-in is broken.** Click → `POST /api/auth/google` = 502 "authentication service is unavailable" (requestId 1383dadc-…). Source shows Google auth is optional and fails closed unless CLIENT_ID/SECRET/REDIRECT_URI are all set on the gateway. Likely staging env config; exact cause unproven (cannot see Render env). Layer: configuration/auth.
**GUEST-003 /profile/saved always shows "could not be loaded".** SSR page forwards the browser cookie as-is (`better-auth.session_token`); the gateway only accepts `__Secure-better-auth.session_token` (verified: raw name → 401, prefixed or Bearer → 200 `{"items":[]}`). The BFF route rewrites the name (works, 200); the page does not. Error is swallowed with a generic message. Confirmed. Fix: use the BFF/withGatewayCookieName in the page.
**GUEST-004 Checkout quote uses "Non-production test fees — not approved production commercial rates"** (feePolicy m4-nonproduction-test-v1: 5% platform + 2.5% payment + 18% tax on fees). Math is correct and backend-authoritative (₹5,000 → ₹5,442.50) but production fees are unapproved. Confirmed in API payload. Layer: configuration/business.
**GUEST-005 (conditional) Vercel SSO protection is on guest.thec1rcle.com.** Anonymous visitors are redirected to vercel.com. Fine for staging; launch-blocking if this is the launch URL. Note the proxy also canonicalizes only thec1rcle.com, and the gateway CORS does NOT allow https://thec1rcle.com (allows guest.thec1rcle.com + a vercel.app preview) — verify before prod cutover.

### P2 — should fix before launch
**GUEST-006 Missing Guest surfaces.** No Wallet, Orders, Settings or Notifications pages (404). No notification list UI although /api/notifications/me exists; no account settings/privacy/communication prefs/deletion entry (profile gear target not verified). Tickets page is titled "My Orders" under nav "Tickets".
**GUEST-007 Session/security hardening.** Session cookie `better-auth.session_token` has Secure=false on HTTPS (HttpOnly, SameSite=Lax, 7d). No Content-Security-Policy on any HTML (docs reference one in proxy.ts; not present). `/api/auth/session` sent with `Cache-Control: public, max-age=0`. `/api/auth/refresh` returns an `accessToken` in JSON kept in JS memory (works as Bearer) — XSS would be able to exfiltrate it; acceptable only with a CSP. Good: HSTS, nosniff, X-Frame-Options DENY, Permissions-Policy, generic wrong-password message, `?next=` sanitized via safeNextPath.
**GUEST-008 Auth waterfall + PII over-fetch.** Every page: GET /api/auth/session → POST /api/auth/refresh → GET /api/onboarding, serial (~0.3–1s each). /api/onboarding returns full phone number and date of birth on every page (even /tickets). All HTML is no-store/SSR: TTFB ≈1.0–2.0s on every route. Login end-to-end 4.2s (API 2.1s).
**GUEST-009 Checkout promo/eligibility UX.** Invalid promo (API: "Promo code X not found") shows a generic "could not be applied… Clear the code…" and blanks Subtotal/Fees/Total entirely. Totals also show "—" until the eligibility checkbox is ticked. Each change costs a ~1s quote round-trip.
**GUEST-010 Event detail omits key facts.** No refund policy (API has refundPolicy; null on one event), no end time, no timezone (tickets page says IST, event page doesn't), tier audience/age restrictions only appear inside checkout. Description rendered twice (summary + description identical). Refund-request dialog doesn't show the policy it asks Hosts to review.
**GUEST-011 Test/QA data in the public product.** Feed includes QA/m3-/anil-/"hsfshf"/"qa-test-event-delete-me"/"…-cancelled" (status still `published`), duplicate "ANIL EVENT 1", a ₹1 ticket event, raw-slug titles, "halloweeen" copy. `/api/v2/public/events` returns 54 events incl. 39 whose start is already past (UI uses the filtered /discovery, 15). Stale/orphan hygiene needed before real users.
**GUEST-012 /profile LCP 4.3–5.1s** on every viewport (all other routes 1.0–2.6s). CLS 0 everywhere.
**GUEST-013 Observability gap.** No frontend error capture (Sentry DSN optional/unset, no web-vitals). requestId exists in error bodies but `x-request-id` response header is empty; the paid-but-no-ticket journey could only be traced via /api/payments/recovery + backend logs (not verified).

### P3 — polish
**GUEST-014 Currency formatting:** `₹442.5` / `₹5,442.5` (1 decimal) in checkout; 8 separate Intl.NumberFormat instances with differing fraction digits.
**GUEST-015 Dead control:** "Apple Wallet pass unavailable" icon on every ticket card; ticket detail dialog shows no price/order reference; close "×" is tiny.
**GUEST-016 CTA inert until hydration** (~5s on event page): "Get tickets" tapped at 1.5s does nothing; no pending affordance. (hypothesis: hydration cost)
**GUEST-017 Checkout defaults:** priciest tier (VIP ₹2,500) pre-selected with "1 selected".
**GUEST-018 Mobile event page:** private-ticket-code box sits above the title/CTA; ~200px dead space above footer; footer links ≈15px tall (7–10 targets <36px per page).
**GUEST-019 Copy:** home hero speaks to hosts ("run guestlists, track promoters"); /help logged-out dumps to login (no support path for locked-out users).
**GUEST-020 /api/payments/recovery returns 404 on every event load** (expected state as error → noise in logs/consoles).
**GUEST-021 One-off /terms TTFB 5.9s** (single sample; likely cold start; retest).
**GUEST-022 Tickets enrichment:** browser fans out N+1 direct gateway calls (event + venue per ticket) and swallows failures (`.catch(() => null)`); 3 overlapping wallet endpoints (tickets, booking-tickets, orders). Works today; fragile and chatty.

### Retracted
**CORS block on /tickets** was caused by my test harness injecting the Vercel bypass header on cross-origin calls. Not a product defect.

## Reconciliation highlights
- Prices match across card, CTA, drawer, tiers API, quote: Halloween 2 ₹5,000 (avail 49); multi-tier VIP ₹2,500/5, GA ₹1,000/10; RSVP free/75.
- Quote math: 5,000 + 250 + 125 + 67.50 (18% of fees) = ₹5,442.50 ✔. No hold is created before Pay; Pay stayed disabled and untouched.
- Ticket QR correctly locked until 24h before event; icon buttons have accessible names and 44×44 targets.

## Performance (hosted, from this sandbox)
TTFB ~1.0–2.0s all routes; LCP: / 1.5–2.4s, /explore 1.1–2.6s, event 1.6–2.4s, tickets ~1.0s, **profile 4.3–5.1s**. CLS 0. Home ≈490–570 KB transfer, 172 `<img>` (lazy). Public API: events 0.6–1.4s, tiers 1.1–1.8s, discovery 0.6s, quote ~1.1s, login 2.1s, saved-events 0.8–1.2s. No horizontal overflow at 320/375/390/430/1440 on any tested route.

## Scorecard (evidence-limited)
Functional 55 · Auth 60 · Discovery 62 · Event detail 60 · Checkout readiness 55 (quote ok; pay untested) · Tickets/Wallet 55 · Mobile 72 · Performance 55 · Reliability 55 · Security/privacy 55 · Visual polish 70 · Backend/API 62 · Data integrity 35 · Observability 40
**Overall 58/100**

## Remediation order (proposed, nothing started)
M1 (blockers): GUEST-003, 001, 002, 004 (+ confirm 005). M2: 007, 008, 006, 010, 011, 009. M3: 012, 013, 014–022. Then run the untested phases (Google, signup/OTP, RSVP, transfer, refund, payment in Razorpay test mode).

## Human actions needed
Rotate the Vercel bypass secret; provide Render env visibility or confirm Google OAuth vars (GUEST-002); decide fee policy (004); confirm launch domain/SSO/CORS origin (005); OTP, Google account pick and any payment authorization remain yours.


---
# ADDENDUM — second pass (remaining phases)

## Additional findings
**GUEST-001 (extended):** besides localhost posters, 2 events (e.g. `neon-nights`) point posters at a `*.vercel.app` partner-dashboard preview that returns **403**; other posters are on Google Storage with `Cache-Control: public, max-age=60` (1-minute cache; no CORS header needed for <img>). `vercel.live` feedback script also loads on the staging domain (preview-toolbar artifact; confirm absent on production).
**GUEST-023 (P2) Settings is thin and partly unfinished.** `/profile?view=settings` has only Personal profile, Privacy(`section=social`), Account & security. No notification/communication preferences, **no account-deletion entry point** (compliance/app-store risk), copy admits unfinished features ("Profile photo uploads are not available yet", "Email and phone changes are not available for this account yet"). Unknown `section=` values silently fall back to Personal. Settings is not a separate route, which refines GUEST-006 (no /settings page; a settings *view* exists).
**GUEST-024 (P2) iOS input auto-zoom:** Search, Settings and promo inputs are 14px (<16px) → Safari zooms on focus. Measured; Safari behaviour inferred, not tested. Also 24 `100vh`/`min-h-screen` vs 8 dynamic-viewport units, 59 `backdrop-blur`, 210 uses of 8–10px text (tiny labels pervasive).
**GUEST-025 (P2) Hung API gives no feedback for ~30s** ("LOADING PASSES" until timeout); offline navigation shows the raw browser error page (no offline UX); quote 500 message says "Check you are signed in" (misleading for a server fault).
**GUEST-026 (P2) Homepage weight:** live HTML ≈427 KB with ≈1,700 image references (decorative `HomeGetApp` marquee), 172 `<img>`, ≈490–570 KB transfer. Everything is `no-store` SSR.
**GUEST-027 (P3) Dead/stale code:** `HomeFeaturedDropsClient.tsx` (hard-coded fake drops, unused), `homeFixture` named FIXTURE_ONLY but supplies live hero copy, `features/tickets/fixtures`, `/host` duplicate alias of `/hosts`, 8 duplicated Intl.NumberFormat instances, two API client paths (direct gateway `apiClient` vs same-origin `bffClient`). 0 TODO/FIXME found.
**GUEST-028 (P3) Unnecessary confirmation:** Sign out requires a confirm dialog ("End this session?").
**GUEST-029 (P3, hypothesis) No explicit Guest "refund approved/processed" email trigger** found among transactional email events (ticket.issued, order.fulfilled, transfer lifecycle, event.cancelled/postponed/material_change, payment.support_required, waitlist.offered are present). Guest in-app notifications are not generated at all (consumer emits only venue/promoter types) while the API/UI promise a list → email is the only Guest channel.

## Verified GOOD (second pass)
- **Logout is real:** after sign-out the old cookie returns 401 on profile/wallet/session; a second tab is redirected to /login on next navigation.
- **Authorization:** all private BFF endpoints return 401 anonymously; fabricated ticket/order IDs return non-enumerating 404; cross-origin POST → 403 "Cross-origin request rejected"; POST without CSRF → 403. `safeNextPath` correctly blocks schemes, `//`, backslashes, control chars.
- **Failure handling:** wallet 500 → calm message + Try Again; quote 500 → Pay stays disabled; session removal mid-page → login with `next` preserved.
- **Discovery:** filters/sort/search are client-side with 0 network calls; counts consistent (Pune 14 + Mumbai 1 = 15; Weekend = Sat+Sun events by IST); `<script>` search input inert; price sort correct. Caveat: whole catalog loaded at once, no pagination (will not scale), Friday-night events are excluded from "Weekend" (product decision).
- **Accessibility baseline:** `lang`, skip link, single `main`, all controls named, all inputs labelled, no images without `alt`, logical tab order. Gaps: tickets page had no `h1` in one sample, search/login inputs rely on border-color change (no outline), tiny text.
- **Backend:** checkout holds 10-min TTL, capacity judged in transaction in strict hold order, promo-claim race handling, payment-vs-hold-expiry compensation, per-user caps (`maxPerUser`); Redis-backed rate limiting with memory fallback; pino with redaction; request IDs; 88 composite Firestore indexes; bounded search scan. Public tier/event reads are the slow spots (0.6–1.8s).
- Signup form: correct autocomplete, 8-char minimum, confirm-password; relies on native browser validation messages (no inline strength/validation UX).

## Revised scorecard
Functional 58 · Auth 68 (Google broken) · Discovery 70 · Event detail 60 · Checkout readiness 60 · Tickets/Wallet 58 · Mobile 72 · Performance 55 · Reliability 62 · Security/privacy 66 · Visual polish 70 · Backend/API 72 · Data integrity 35 · Observability 40
**Overall 61/100 — still NOT launch ready** (P1: 001 data/media, 002 Google, 003 saved-events cookie bug, 004 test fee policy, 005 conditional SSO/CORS).

## Still NOT verified (needs you / authorization)
Google OAuth completion, real phone OTP, signup with a new account, RSVP/guestlist execution, ticket transfer, refund submission, payment (Razorpay test mode), hold-expiry timing in the UI, real Safari/iOS, screen-reader testing, production domain behaviour, Firestore data inspection (no DB access from this sandbox), load/concurrency testing.


---
# ADDENDUM 2 — human-assisted acceptance pass (in progress; stopped at human gates)

## Status of every previously NOT-VERIFIED item
| Item | Status | Evidence |
|---|---|---|
| Existing-account login → redirect → refresh → 2nd tab → logout → old-session invalidation | **PASS** | Earlier pass: `/auth/continue?next=` redirect, `better-auth.session_token` HttpOnly 7d, `/api/auth/session` 200 after reload, logout 204 then old cookie 401 on profile/wallet/session, 2nd tab → /login. Login API 2.1s, ~4.2s end-to-end. |
| Google login | **FAIL (config) — no human step possible** | Two independent faults (below, GUEST-002). Initiation fails before Google is reached. |
| New account signup / email verification / onboarding / OTP | **NOT VERIFIED — waiting on human gate** | Form + code path reviewed (see GUEST-032). Needs a mailbox + phone you control. |
| Real phone OTP | **NOT VERIFIED — waiting on human gate**; **FAIL on UX** (no country picker) | Source + deployed bundle: Firebase configured (authDomain c1rcle-v2.firebaseapp.com), test-number bypass limited to one configured number. |
| RSVP / Guestlist | **Source/tests PASS; execution awaiting your approval** | Below. |
| Ticket transfer | **Readiness PASS (source/UI); execution awaiting approval + recipient email** | Below. |
| Refund request | **Source PASS; execution BLOCKED UNTIL PAYMENT ACCEPTANCE** (no fabricated paid state) | Below. |
| Checkout pre-Pay | **PASS with defects** (hold/expiry BLOCKED UNTIL PAYMENT ACCEPTANCE) | Below. |
| Profile persistence | **PASS** | UI → PUT 200 → API → refresh → brand-new session; restored. |
| Settings persistence | **PASS (what exists)**; notification prefs & account deletion **MISSING (product findings)** | `PUT /api/social/privacy` persisted + restored. Password change not exercised (not authorized). |
| Failure experience | **Measured** | Below. |
| Mobile 320/375/390/430 | **PASS for layout; FAIL for input sizing/targets** (iOS Safari NOT tested) | Below. |

## Updated / new findings
**GUEST-002 (P1) — root cause now confirmed, two independent staging config faults.** (a) `POST /api/v2/auth/google` with `Origin: https://guest.thec1rcle.com` → **403 "Authentication request unavailable."** because the origin is not in `BETTER_AUTH_TRUSTED_ORIGINS` (CORS list includes it; trusted list does not). (b) With a trusted origin (`https://c1rcle-v2-guest-portal.vercel.app`) the gateway returns **404 PROVIDER_NOT_FOUND** → `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` are unset on staging. Callback code path (BFF `/api/auth/google/callback` → `/api/v2/auth/callback/google`, same-origin target check, `guestContinuePath`, errors → `/login?reason=google`) is well built but unreachable. The checkout sign-in sheet lists "Continue with Google" first, so Guests hitting checkout meet the broken option first. Fix needs: add guest origin to trusted origins, set Google vars, register `https://guest.thec1rcle.com/api/auth/google/callback` in Google console (**human/provider-console action**).
**GUEST-004 (P1) — now Guest-visible:** the checkout review screen renders "Test pricing policy: Non-production test fees — not approved production commercial rates … production rates are not approved." plus "Policy version: m4-nonproduction-test-v1".
**GUEST-030 (P2) Discovery card price disagrees with purchase price.** `C1RCLE STAGING ACCEPTANCE 001`: Explore card/`startingPricePaise` = **₹800 (base)**, event CTA, drawer, tiers API and quote = **₹650 (Early Bird)**. Stale denormalized starting price. Confirmed (API 80000 vs 65000; UI "From ₹800" vs "Get tickets · From ₹650").
**GUEST-031 (P2) Max-per-order not enforced in UI; error masked.** API `maxPerOrder: 4`, available 79; drawer says "UP TO 10 AVAILABLE" and allowed **6 tickets (₹3,900)**; server correctly returns 400 "General Entry has a maximum of 4 per order" but UI shows generic text (next).
**GUEST-025 (P2, expanded) Quote error messaging.** UI has exactly two messages. Without promo, **every** non-401 failure (400 max-per-order, 409 sold-out, 500, network abort — all reproduced) shows "We could not price your order. Check you are signed in…". With promo applied, **every** failure blames the promo. Only 401 redirects to login correctly. Repro: select 5+ tickets of General Entry → Review order. **Wallet hang corrected:** the four wallet calls start only at ~+4.8s (auth waterfall), then hit a 15s timeout → error at **~19.8s** (earlier ~30s figure was coarse sampling). Slow quote (8s) correctly shows "Calculating your total…" with Pay disabled. Cancelled navigation mid-load: clean, no page errors. Offline: raw browser error page (no offline UX).
**GUEST-032 (P2) Phone step has no country picker.** Free-text `type=tel`, placeholder "+91 98765 43210", **no country picker, no India default, no search, no libphonenumber normalization**; only `\s` stripped; regex `^\+[1-9]\d{7,14}$`. A typical Indian entry `9876543210` is rejected ("Enter your phone number with its country code."). Good: 60s resend cooldown, `one-time-code` autofill, 6-digit pattern, mapped Firebase errors, test-number bypass scoped to one configured number. Phone is mandatory at onboarding step 3 of 4 (name → DOB → phone → interests).
**GUEST-010 (P2, expanded):** Host refund policy (`no_refunds` / `until_cutoff` / `organizer_reviewed`) is **never rendered to the Guest**; checkout disclosure only describes C1RCLE fee refund rules; Guest learns of a `no_refunds` policy only when the refund request is denied.
**GUEST-033 (P3) Checkout state is not URL-addressable:** refresh closes the drawer; browser Back from review leaves the event for the previous page. Logged-out flow is good: inline sheet "Your ticket selection will be saved…", email login returns to `/checkout/<slug>` with selection restored (5 navigations).
**GUEST-034 (P3) 320px:** drawer "Review order" CTA at y=670 on a 568px viewport (below fold; needs scroll). Explore filter `<select>`s render at **10px**; search/promo/settings inputs 14px (iOS Safari auto-zoom risk — source/measurement only, **iOS NOT tested**); 7–13 targets <32px per page. No horizontal overflow at any width on any tested route (re-verified including drawer + review + promo).
**GUEST-035 (P3, design question) QR while transfer pending:** the sender remains holder, so QR stays presentable until acceptance; recipient gets 404 (holder-only). Acceptance bumps `credentialVersion` (+1), invalidating the old QR (source). If the intended rule is "QR unavailable while invitation pending", it is not enforced.
**GUEST-029 RETRACTED:** refund-completed (on settled) and refund-declined (on rejected) transactional emails are **CONFIRMED PRESENT**, with idempotency keys; refund-review-requested also present. Only a distinct interim "approved/in progress" email is absent (cosmetic).

## Workflow verdicts from source/tests
- **RSVP:** requires verified account + verified phone (`requireVerifiedGuestPhone`), published event, active public tier, zero-price tier, per-person/couple excluded; one deterministic order per user+event (second RSVP → 409); cancel supported (`cancelRsvp` → `rsvp.cancelled`). Firestore integration tests cover "simultaneous different accounts commit exactly one order/ticket" and "cancellation vs acquisition serializes without overselling/double release" (**tests read, not executed**). BFF mints a fresh `Idempotency-Key` per call; its comment claims retry-safety, actual safety comes from the deterministic id (doc/code mismatch, P3).
- **Transfer:** recipient-acceptance model (pending → accepted/declined/cancelled/expired/frozen); 24h expiry capped at event start −5min; resend; free RSVPs non-transferable; blocked for cancelled events/cover-reserved; email hash stored; accept rotates QR credential.
- **Refund:** purchaser-only, per ticket, unused only, free RSVP → cancel instead; **cancelled / postponed / material-change always refundable regardless of Host policy**; organizer review via support ticket; guest refund covers admission value only under test fee policy; no explicit post-event/no-show time bar under `organizer_reviewed`.
- **Checkout (current staging, `C1RCLE STAGING ACCEPTANCE 001`):** base ₹800, Early Bird ₹650 (active), no promo: ₹650 + ₹57.53 fees/tax = **₹707.53**; `STAGE001`: −₹65, fees/tax **₹51.78**, total **₹636.78** → **matches the earlier observation exactly**. Double-tap Apply → single request. Quote has **no expiry/ID** (stale-quote safety relies on server re-pricing at hold creation). **Hold creation occurs only inside Pay (`createHold → createAttempt → Razorpay`) → hold TTL (10 min, source) and expiry UI are BLOCKED UNTIL PAYMENT ACCEPTANCE.** No visible hold countdown in UI.

## Human gates remaining (nothing executed past these)
1. **NEW GUEST SIGNUP + EMAIL CODE + REAL OTP** (needs a mailbox you control and a phone for SMS; codes can be relayed to me in chat).
2. **RSVP execution** (creates one RSVP order on shared staging event `qa-host-slot-03-rsvp-only`, cancellable) — needs your approval.
3. **Transfer execution** (mutates an existing test ticket; sends a real invitation email) — needs your approval + a recipient mailbox you control.
4. **Google login** — cannot be attempted until GUEST-002 config is fixed (provider-console + Render env: your action).


---
# ADDENDUM 3 — FINAL human-assisted acceptance state (supersedes earlier counts/score where they differ)

Credentials/OTPs used in this pass were synthetic QA values and are deliberately NOT recorded in this document.
Deployment drift: the deployed build changed during the audit (e.g. GUEST-001 localhost posters disappeared, end time now shown). Deployed SHA is still not exposed, so every "current-build" statement below was re-verified live on the date of this pass (2026-11-16).

## Human-assisted acceptance
| Workflow | Result | Evidence | Remaining blocker |
|---|---|---|---|
| Existing login | **PASS** | earlier pass (login 200, redirect, session, 2nd tab, logout → old cookie 401); re-verified repeatedly this pass | — |
| Google login | **FAIL (CONFIGURATION)** | 403 from gateway for Guest origin (not in Better Auth trusted origins); 404 PROVIDER_NOT_FOUND with a trusted origin (provider vars unset). Re-verified today. | Remediation + Google console |
| New signup | **PASS** | `POST /api/auth/signup` 201 in ~1.9s, `emailVerified:false`, one account only, verify screen auto-sends code | — |
| Email verification | **PASS** | human-relayed 6-digit code; `POST /api/auth/otp/verify` 200 "Verified." ~1.4s → `/onboarding?next=…`; login afterwards shows `emailVerified:true` | — |
| Onboarding persistence | **PASS** | name + DOB saved (`PUT /api/onboarding` 204); refresh mid-onboarding resumes at step 3; new-session login resumes onboarding; `/profile` and RSVP checkout redirect incomplete Guests to `/onboarding?next=<original>` (return intent preserved) | — |
| FIREBASE TEST OTP FLOW | **HUMAN BLOCKED (reCAPTCHA)** | Firebase config is live (recaptchaConfig/Params 200); deployed build does NOT bypass reCAPTCHA for the test number; an interactive 400×580 image challenge appears for an automated browser (`navigator.webdriver=true`); **0 `sendVerificationCode` requests**; UI sits on disabled "Send code" with no message. I did not attempt to defeat the captcha. | A human must solve the captcha in a real browser, OR set the staging build's test-phone bypass (provider/Vercel env, build-time). |
| REAL SMS DELIVERY | **NOT VERIFIED** (not in scope) | — | Needs real number/carrier |
| Phone-field behaviour | **PASS (partial)** | natural typing of the `+91 9999…` form is accepted (spaces stripped) → E.164; 60s resend cooldown, `one-time-code` autofill, mapped errors. **FAIL UX:** no country picker/India default/search/normalization (GUEST-032). Wrong-code and correct-code behaviour not exercised (captcha). | captcha |
| RSVP / Guestlist | **PASS** | exactly ONE RSVP on `qa-host-slot-03-rsvp-only`: `POST /api/rsvp` 201 (2.8s, "RESERVING…" feedback) → `/confirmation/RSVP-…` "YOU'RE ON THE LIST", status paid ₹0; capacity 75→74; refresh persists; listed first in Tickets; dialog: "Free RSVPs cannot be transferred", "Cancel RSVP". Unverified-phone Guest is diverted to onboarding with return intent and makes NO RSVP request. | — |
| RSVP duplicate protection | **PASS (behaviour differs from docs)** | second attempt → 201 returning the **same** order (idempotent replay), capacity stays 74, no second order. Source comment says 409 (GUEST-046). | — |
| RSVP cancellation | **PASS** | inline confirm ("Your entry code will stop working"), `POST …/cancel` 200 in 1.5s, "Cancelling…"; ticket "Cancelled – no longer valid"; `GET /api/orders/<id>` status `cancelled`; Tickets→History "CANCELLED"; confirmation "BOOKING CANCELLED"; **capacity restored 75**. | — |
| Final-seat race | **SOURCE + TESTS ONLY** | Firestore integration tests (simultaneous accounts → exactly one order/ticket; cancel-vs-acquire serialization). Tests read, not executed. | execute suite in remediation |
| Transfer execution | **BLOCKED UNTIL CONTROLLED TEST TICKET** | source/UI readiness preserved (recipient-acceptance model, 24h expiry, free RSVPs non-transferable, acceptance bumps QR credential, sender can still show QR while pending) | controlled ticket |
| Refund execution | **BLOCKED UNTIL PAYMENT ACCEPTANCE** | source preserved: purchaser-only, per-ticket, unused only; cancelled/postponed/material-change always refundable; refund-completed, refund-declined and refund-review-requested emails CONFIRMED PRESENT | payment |
| Checkout pre-Pay | **PASS with defects** | ₹800 base / ₹650 Early Bird / STAGE001 −₹65 / fees+tax ₹51.78 / **₹636.78** reconfirmed on current staging; no-promo ₹707.53; Pay never pressed | hold creation, hold expiry, ticket issuance, payment recovery → BLOCKED UNTIL PAYMENT |
| Profile persistence | **PASS** | UI→PUT 200→API→refresh→new login; restored | — |
| Settings persistence | **PASS (existing controls)** | privacy toggle PUT /api/social/privacy persisted + restored. Missing by design: notification prefs, account deletion (product findings) | — |
| Mobile 320/375/390/430 | **PASS layout / FAIL input sizing** | no overflow anywhere; inputs 10/14px; targets <32px; **iOS Safari NOT tested** | REQUIRES EXTERNAL DEVICE |

## Ledger changes in this pass
- **GUEST-001 DOWNGRADED P1 → P3 (largely resolved on current staging):** localhost poster URLs 10 → **0** (all 54 events; discovery 0/15; homepage 0 refs). Residual: 2 events use `vercel.app` partner-dashboard posters that return **403**; 47/54 events have no poster (fallback "EVENT ARTWORK UNAVAILABLE").
- **GUEST-002 (P1) unchanged, re-verified today.**  **GUEST-003 (P1) unchanged, re-verified today** (`/profile/saved` still "could not be loaded").  **GUEST-004 (P1) unchanged.**  GUEST-030 (₹800 card vs ₹650) unchanged. CSP absent and session cookie `Secure=false` unchanged (GUEST-007).
- **GUEST-010:** end time now displayed (fixed); description still rendered twice; Host refund policy still never shown.
- **GUEST-040 (P1, strongly supported) Finished events remain purchasable.** `halloween` ended 2026-11-14 10:31Z but is still `status: published`; its event page shows "Get tickets · From ₹600" and checkout **quotes it normally (₹653.10)**. `assertOnSale` only tests `status === 'published'` although its own comment says finished events are not on sale; nothing auto-advances status to `ended`. Hold/Pay NOT exercised (no payment) — confirm server rejection during Payment Acceptance. Repro: open /event/halloween → Get tickets → Review order.
- **GUEST-038 (P2) Dead directory links, all HTTP 200 soft-404s:** on `/hosts`, 2 of 4 listed venues (Keshvi Agarwal `/venue/keshvi-agarwal-cabe12`, Test Venue `/venue/test-venue-7f8349`) open "THIS ROOM IS OFF THE CIRCUIT"; the event page's Host link for halloween-2 goes to `/host/aayush-host-92501a` → "THIS HOST IS OFF THE CIRCUIT" (that slug works under `/venue/`, wrong route).
- **GUEST-039 (P2) Sold-out / capacity-full events go silent:** sold-out and free-cap-1 events show **no CTA and no "sold out" message** (tiers list is empty).
- **GUEST-041 (P3)** event page keeps showing "RSVP for free" to a Guest who is already on the list. **GUEST-042 (P3)** cancelled RSVP ticket still says "Your QR becomes available 24 hours before the event starts". **GUEST-043 (P3)** invalid venue/host/etc. return HTTP 200 (soft 404). **GUEST-044 (P3)** RSVP confirmation labels ₹0 as "TOTAL PAID". **GUEST-045 (P3)** staging build lacks the Firebase test-phone bypass, so QA of OTP requires solving reCAPTCHA. **GUEST-046 (P3)** RSVP duplicate = 201 idempotent replay while source comment promises 409; BFF mints a fresh Idempotency-Key per call.
- Positive: sales-paused event shows "TICKET SALES PAUSED"; carousel has labelled controls and autoplays; filters survive Back/Forward and deep links (`/explore?category=House&city=pune&date=weekend&sort=price-low` restores all four selects); link crawl of 47 internal links found no hard failures.

## Workflow efficiency (hosted, taps/navigations)
event→ticket→review: CTA(1)+Review(2)+Pay(3), +1 eligibility checkbox when the tier requires it; each change costs a ~1.2–2s quote. event→RSVP: CTA(1)+Review(2)+Confirm(3) (~2.8s). logged-out checkout→login→return: 5 navigations, selection restored. Signup: form(1) + email code + 4 onboarding steps (name, DOB, phone+OTP, interests) before any destination. ticket→QR: 1 tap but locked until 24h before. Profile→setting: gear(1)+section(1). Sign-out: 2 taps (needless confirmation).

## Phase 0–33 completeness reconciliation
| Phase | Status | Evidence / remaining blocker |
|---|---|---|
| 0 Surface map | FULLY EXECUTED | source routes + browser + 47-link crawl + dynamic-route probes; transfer/cover-confirm happy paths need real IDs |
| 1 Logged-out Explore | FULLY EXECUTED | filters/sort/search/Weekend/zero-result/Back-Forward/deep links/carousel; no pagination exists |
| 2 Event detail | FULLY EXECUTED | paid, free, RSVP, multi-tier, sold-out, paused, past, no-poster, acceptance event vs API; share/copy-link action not clicked |
| 3 Authentication | HUMAN BLOCKED | email login/signup/verify PASS; Google FAIL(config); phone OTP captcha-blocked |
| 4 Authenticated map | FULLY EXECUTED | |
| 5 Profile | FULLY EXECUTED | |
| 6 Settings | FULLY EXECUTED | change-password submit not exercised (not authorized); missing features recorded |
| 7 Tickets | FULLY EXECUTED | existing states incl. RSVP/cancelled; refunded/transferred/postponed/invalid BLOCKED UNTIL PAYMENT |
| 8 Wallet | FULLY EXECUTED | no separate Wallet route; wallet APIs + Tickets view |
| 9 Guestlist/RSVP | FULLY EXECUTED | see table; race = SOURCE + TESTS ONLY |
| 10 Checkout w/o payment | BLOCKED UNTIL PAYMENT | everything pre-Pay executed; hold/hold-expiry/stale-hold need Pay |
| 11 Orders/history | BLOCKED UNTIL PAYMENT | available orders via /tickets + API; failed/refunded orders need payment |
| 12 Transfers | SOURCE + TESTS ONLY | execution blocked until controlled ticket |
| 13 Refund surfaces | SOURCE + TESTS ONLY | execution blocked until payment; refund dialog form reached |
| 14 Notifications | SOURCE + TESTS ONLY | API empty, no Guest UI, no Guest in-app notifications emitted; email consumer read |
| 15 Navigation audit | NOT DONE | links + key controls only; exhaustive every-control sweep NOT performed |
| 16 Mobile | REQUIRES EXTERNAL DEVICE | Chromium emulation complete at 4 widths; keyboard/safe-area need a device |
| 17 Visual/product design | NOT DONE | deliberately deferred to the Guest Experience Quality Pass; only incidental observations recorded |
| 18 Workflow efficiency | FULLY EXECUTED | measured table above |
| 19 Network | FULLY EXECUTED | |
| 20 Performance | FULLY EXECUTED | lab metrics from one region; INP/field data not available |
| 21 Backend/API | SOURCE + TESTS ONLY | key endpoints measured; no exhaustive endpoint matrix |
| 22 Database integrity | ENVIRONMENT BLOCKED | no Firestore access; public-API-level checks only |
| 23 Storage/media | FULLY EXECUTED | Guest-facing media; upload paths N/A (avatar upload "not available yet") |
| 24 Security/privacy | FULLY EXECUTED | |
| 25 Error/failure | BLOCKED UNTIL PAYMENT | all injection cases executed; hold-expiry/stale-hold need payment |
| 26 Loading/empty/skeleton | FULLY EXECUTED | |
| 27 Accessibility | NOT DONE | structure + keyboard order done; contrast measurement, all-dialog focus traps, screen reader NOT done |
| 28 Browser robustness | REQUIRES EXTERNAL DEVICE | Safari/iOS never tested; source risks only |
| 29 Duplication/stale code | SOURCE + TESTS ONLY | |
| 30 Observability | BLOCKED UNTIL PAYMENT | paid-but-no-ticket trace needs a payment |
| 31 Data consistency | ENVIRONMENT BLOCKED | UI↔public API↔quote done; authoritative DB layer not reachable |
| 32 Architecture opportunities | FULLY EXECUTED | |
| 33 Final visual sweep | NOT DONE | deferred to the Quality Pass |

## FINAL COUNTS AND SCORE
P0: 0 · **P1: 4** (GUEST-002, 003, 004, 040; plus GUEST-005 conditional) · **P2: 17** (006–013, 023–026, 030, 031, 032 + 038, 039) · **P3: 21**.
Scorecard: Functional 60 · Auth 68 · Discovery 68 · Event detail 58 · Checkout readiness 58 · Tickets/Wallet 62 · Mobile 72 · Performance 55 · Reliability 62 · Security/privacy 66 · Visual polish 70 · Backend/API 72 · Data integrity 45 (localhost posters fixed; test data + dead links remain) · Observability 40.
**GUEST PORTAL LAUNCH READINESS: 62/100 — GUEST PORTAL HUMAN-ASSISTED ACCEPTANCE: NOT READY — GUEST PORTAL LAUNCH READY: NO.**

## Remaining execution (later phases)
Phone OTP success path (captcha solved by a human or staging test-phone bypass) · real carrier SMS · Google login after config fix · Payment Acceptance (Pay, hold + expiry, ticket issuance, payment recovery, finished-event purchase rejection) · transfer execution · refund execution · iOS Safari/real-device pass · accessibility contrast/screen-reader · exhaustive control sweep · DB-layer integrity review · Guest Experience Quality Pass (phases 17/33).

## HANDOFF FOR A FUTURE SESSION (resume remediation without re-auditing)
- Repos/branches: frontend `thec1rclehost123-cmd/C1RCLE-FRONTEND` (audited source 6d609542), backend `…/C1RCLE-BACKEND` (3dc72938), both on branch `claude/c1rcle-guest-portal-audit-w30tvh`. Nothing was committed/pushed by the audit.
- Hosted: `https://guest.thec1rcle.com` is behind Vercel SSO (needs a bypass token per session — rotate it), API `https://circle-v2-backend.onrender.com`. Sandbox allowlist needed: guest.thec1rcle.com, circle-v2-backend.onrender.com, www.google.com, www.gstatic.com.
- Suggested remediation order: M1 GUEST-003 (use BFF/`withGatewayCookieName` in `/profile/saved` SSR), 040 (reject ended events in `assertOnSale`/hold + auto-advance status), 002 (trusted origins + Google env + console redirect URI), 004 (approved production fee policy); M2 025/031 (quote error mapping + max-per-order UI), 030 (price denormalization), 038/039, 007/008 (cookie Secure, CSP, auth waterfall, PII over-fetch), 010/011/023/032; M3 perf (profile LCP, homepage weight), mobile input sizes, polish P3s; then Payment Acceptance; then Quality Pass.
- Test-state left on staging: account created for QA (email-verified, onboarding stuck at phone step); existing test Guest gained a cancelled RSVP order (`RSVP-…acfd98…`, event capacity back to 75) and its city/privacy edits were restored. The test Guest also holds a ticket for C1RCLE STAGING ACCEPTANCE 001 that this audit did not create.
- Harness lessons: never inject the Vercel bypass header on cross-origin requests (false CORS errors); clearing cookies mid-script makes private routes bounce to login (invalid data); loose "unavailable" text matching causes false soft-404s.
