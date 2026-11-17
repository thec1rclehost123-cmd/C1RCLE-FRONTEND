# C1RCLE Guest Portal — Five-Milestone Fix & Launch-Readiness Plan

Status: **PLANNING ONLY — nothing implemented.** Revision of the milestone *structure* in
`GUEST_PORTAL_REMEDIATION_PLAN_2026-11-17.md` (6 uneven milestones → **5 equally scoped milestones**).
Everything else in that plan stays authoritative: finding classification (§B), **Decision log H2–H7**, deferred-acceptance register (§F), Codex contract (§G), risk register (§I). Where this document and the older milestone numbering (M1–M6) differ, **this document wins**.
Evidence base: `GUEST_PORTAL_LAUNCH_AUDIT_2026-11-16.md` @802d9a4 (frozen) — **62/100, launch ready NO, P0 0 · P1 4 (+1 conditional) · P2 19 · P3 26**.

---

## 1. Why five, and why they are equal

Each finding was sized (S = 1 unit, M = 2, L = 3–4; human-only work not counted). Findings were then grouped by **root cause and shared code path**, then balanced.

| Milestone | Theme | Units | Primary layers |
|---|---|---|---|
| **M1** | Sale & session integrity | ≈ 9 | backend core, gateway, BFF, `next.config` |
| **M2** | Guest identity & account (Google, phone, auth bootstrap, profile) | ≈ 10 | config, onboarding, auth client, profile |
| **M3** | Pricing & checkout truth | ≈ 9 | backend public mapper, checkout UI |
| **M4** | Event, directory & data truth | ≈ 10 | directory/event pages, tickets aggregate, data tooling |
| **M5** | Launch quality: observability, homepage weight, mobile, accessibility | ≈ 10 | frontend platform, a11y/mobile, telemetry |

Order is fixed and sequential (one in flight): **M1 → M2 → M3 → M4 → M5**. M1 gives every later milestone the `salesStatus` + error-code contract and the safe cookie layer; M5 goes last because it touches components the earlier milestones change (drawer, nav, forms).

---

## 2. Milestones

### M1 — Sale & session integrity *(security + "only buy valid events")*
**Outcome.** A finished event can never create a valid entitlement through any path; Saved Events works; the session/privacy baseline is launch-grade.
**Findings.** **040 (P1)**, **003 (P1)**, 007, 008-PII part. *(Read-side exclusion of ended events from the public feed, from 011.)*
**Work packets.**
1. *040 — sale rule (H4, final).* One domain function in the backend event-policy module: sellable iff `status ∈ {published, started}` and `now < eventEffectiveEndAt` (end instant closed; no `endAt` ⇒ start + 6h). Enforced in **quote, hold, payment-attempt, RSVP, waitlist, access-code redemption**; pre-cutoff hold/attempt may finish within its 10-min TTL; **no new attempt at/after cutoff**; leftovers → existing compensation path. Public DTOs gain server-computed `salesStatus` (`on_sale|sold_out|sales_paused|ended|cancelled|postponed`) + stable error code `event_not_on_sale`; default public events list excludes ended. UI renders from `salesStatus` (no CTA when not on sale; drawer/direct `/checkout/<slug>` guarded). *Correctness never depends on a cron.* **Check first:** door/inventory/pricing/analytics/Partner code for assumptions that sales stop at `started`.
2. *003 — Saved Events.* Route the SSR page through the one cookie-translation path the BFF uses; audit every SSR caller forwarding `cookies().toString()`; distinct states (login redirect / retry / empty / list).
3. *007 — session posture.* `Secure` cookie on HTTPS (env-aware), `no-store` on `/api/auth/*`, CSP **Report-Only → enforce after clean window**, decide `accessToken`-in-JS (keep only with enforced CSP).
4. *008-PII.* Guards get `{complete, phoneVerified, displayName}`; masked phone; raw phone/DOB only on onboarding/profile-edit.
**Non-goals.** Payment execution, fee policy, Partner dashboard changes, new cron, redesign.
**Tests.** Boundary matrix with injected clock (before / during `started` / at end / after, null `endAt`, each non-sellable status); each sale path rejects ended; hold-before-cutoff completes, expired hold rejected; gateway code + DTO; contract round-trip (backend **and** frontend copies); saved-events page (unauth/empty/list/transient); cookie-helper unit; cache-header test; onboarding payload minimisation.
**Hosted acceptance (Claude).** `halloween` (ended 2026-11-14, still `published` in storage): Ended state, no CTA; direct quote/RSVP via BFF rejected with the stable code; absent from public events; a future event still quotes (₹650 anchor); QA Guest `/profile/saved` empty → save → list → unsave; header probes (cookie `Secure`, auth JSON `no-store`, CSP present); `/api/onboarding` on `/tickets` has no raw phone/DOB.
**Done when.** Focused tests green → one full release gate → PR CI green on exact head → independent review → merged → staging → all hosted checks pass, Explore/Event/quote smoke clean.

### M2 — Guest identity & account *(sign-in, onboarding, auth bootstrap, profile)*
**Outcome.** Google works on `guest.thec1rcle.com`; Indian phone entry works; auth bootstrap is fast; Profile is fast; accounts can request deletion.
**Findings.** **002 (P1)**, 005 (guest-domain part), 045, 032, 053, 008-waterfall, 012, 006/023 (deletion entry).
**Work packets.**
1. *002/005/045 — configuration (human-led).* Render: Google client id/secret/redirect (`https://guest.thec1rcle.com/api/auth/google/callback`) + guest origin in trusted + CORS lists; Google console redirect/JS origin; staging-only `NEXT_PUBLIC_FIREBASE_TEST_PHONE`. **Code:** guard + test so the test-phone bypass is ignored/fails in production builds.
2. *032 + 053 — onboarding UX.* Phone control with India default, searchable country list, E.164 normalisation (`9876543210` ⇒ `+919876543210`); failed login moves focus to the error and sets `aria-invalid`/`aria-describedby`.
3. *008-waterfall + 012 — bootstrap & Profile.* Resolve session once per request; refresh only near expiry; onboarding fetched only where needed (payload already minimal from M1); find the actual `/profile` LCP element **before** changing anything; make non-prefetched Profile view switches not wait on a full render.
4. *006/023 (H6).* "Account deletion request" in Account & security → creates a help-desk request (category Account) with timeline copy. **No** automated erasure; **no** Wallet/Orders/Notifications routes.
**Non-goals.** Real SMS, reCAPTCHA replacement, account-linking changes, new settings pages, root-domain cutover.
**Tests.** Phone normalisation table (India default, `+91`, spaces, leading 0, foreign, invalid); production-bypass guard; login error focus/ARIA; bootstrap call-count assertions (≤ N auth calls/page); onboarding fetch gated by route; deletion-request payload; Google config validation extended.
**Hosted acceptance.** Origin probe returns a Google URL (not 403/404). **Human gate — `READY FOR GOOGLE LOGIN`:** callback → session → existing user not re-onboarded → return intent, no loop/duplicate. Phone step with the staging Firebase test number; `/profile` LCP **target ≤ 2.5s**, per-page auth calls reduced (before/after table); Profile "View all" **≤ 1s**; deletion request visible in `/help`.
**Done when.** As M1, plus one recorded human Google login on staging.

### M3 — Pricing & checkout truth
**Outcome.** Every price agrees with what the backend charges; errors say what happened; Guests see fee and refund terms.
**Findings.** **004 (P1, code half)**, 030, 014, 025, 031, 009, 048, 020.
**Work packets.**
1. *030 — price truth.* "From price" is a server read of the **currently effective** (phase-aware) tier price, not a stale stored value; verify where `startingPricePaise` is written before choosing how.
2. *014.* One shared money formatter (Indian grouping; 2 decimals when not whole).
3. *025/031/009 — checkout contract.* Map every server code to its own state (`event_not_on_sale`, max-per-order using the server message, sold-out, promo invalid/expired/exhausted, validation, unauthorized → login, server/network → honest retry). **Only promo-attributable codes may blame the promo; totals stay visible on promo failure.** Quantity clamp from tier `maxPerOrder` (server stays authority). Honest wallet/offline copy.
4. *004 — fee policy (H2).* Disclosure copy driven by the backend `feePolicy` fields (no hard-coded "test" text); gateway **fails closed** if environment = production and the policy is non-production. **Codex must not invent rates.**
5. *048, 020.* "← Back to event" closes the drawer; `/api/payments/recovery` returns a none-state instead of 404.
**Non-goals.** Pay/hold/expiry behaviour, promo engine, new steps, URL-addressable checkout, tier pre-selection, redesign.
**Tests.** Phase-boundary "from" price (before/at/after, free, multi-tier); formatter table; error-map table (code × promo/no-promo); quantity clamp; drawer Back; recovery contract; production-guard test; contract check frontend codes ⊆ backend codes.
**Hosted acceptance.** `C1RCLE STAGING ACCEPTANCE 001`: card, CTA, drawer, tiers API, quote all ₹650; **`STAGE001` anchor unchanged: −₹65, fees/tax ₹51.78, total ₹636.78**; qty 5 ⇒ states the 4-per-order limit; invalid promo ⇒ "not found" wording with totals visible; injected 400/409/500/network ⇒ distinct honest messages; money with two decimals; **Pay is never pressed**.
**Done when.** As M1. **GUEST-004 is reported FIXED only after the owner-approved production policy is deployed (H2); otherwise STILL EXTERNALLY BLOCKED.**

### M4 — Event, directory & data truth
**Outcome.** Public pages never mislabel a timeout as "missing"; invalid URLs are real 404s; sold-out is stated; event pages state refund terms; the feed holds only presentable data; Tickets is reliable.
**Findings.** 038, 043, 039, 010, 011, 001r, 022.
**Work packets.**
1. *038/043.* Distinguish **absent** (real HTTP 404 via `notFound()`) from **transient** (retry state, 5xx, request-id shown) from **empty**; bounded server retry; no more "off the circuit" for entities that exist.
2. *039.* Sold-out/full states from `salesStatus` (M1); tiers stay visible with availability 0.
3. *010.* Host refund policy (`no_refunds | until_cutoff | organizer_reviewed`) rendered on event page and checkout review in plain language (cutoff in IST); remove the duplicated description. (End time already fixed on staging.)
4. *011/001r (H5 — prepare only).* Candidate **list** (per record: id, slug, status, dates, reason, proposed unpublish/null-poster, reversibility, empty `OWNER_APPROVED` column) + **dry-run-default migration** that accepts only an owner-approved ID file. **Nothing executes without the owner's record-level approval.** Extend write validation to reject preview hosts (`*.vercel.app`) for posters.
5. *022.* Tickets enrichment moved server-side/aggregated (no browser N+1); partial failures visible instead of swallowed; existing wallet endpoints kept for other consumers.
**Non-goals.** Directory redesign, new search, pagination redesign, deleting data, inventing content-quality rules.
**Tests.** 404 vs timeout vs ok (mocked fetch) incl. HTTP status; sold-out rendering; refund-policy renderer (3 kinds + null); poster-host validation; aggregate partial-failure; migration dry-run refuses unlisted IDs.
**Hosted acceptance.** 3 loads × (venue, host, event) after idle ⇒ **no false "missing"**; nonexistent slug ⇒ real 404; injected slow backend ⇒ Retry; sold-out event says so; refund policy visible per kind (staging data only with approval); `/tickets` partial-failure injection shows a message; feed clean **only after** the owner approves and runs a named list.
**Done when.** As M1; cleanup performed only on approved records and itemised in the PR.

### M5 — Launch quality: observability, homepage weight, mobile & accessibility
**Outcome.** Operators can trace a Guest failure; the homepage is lean; mobile inputs/targets and the confirmed accessibility defects are fixed — **without redesign**.
**Findings.** 013, 026, 024, 034, 049, 050, 051, 052, 021 (retest).
**Work packets.**
1. *013.* `x-request-id` on gateway/BFF responses and shown in user-visible errors; frontend error capture with PII scrubbing (**tool/DSN = H9, owner decision**); structured logs carry hold/payment ids; "paid-but-no-ticket" runbook (execution proof deferred to Payment Acceptance).
2. *026.* Homepage: render each decorative image once (no ~1,700 refs), proper sizes; target **HTML ≤ ~150 KB, image refs ≤ ~60** (confirm with Codex's findings); visuals materially unchanged.
3. *024/034.* All Guest inputs/selects ≥ 16px on mobile (search, promo, settings, Explore filters at 10px); 320px drawer CTA reachable without scroll.
4. *049/050/052/051.* Sign-out dialog gets a real focus trap + focus restore (reuse the pattern already passing in the tickets/menu/drawer dialogs); remove nested `<main>` on `/hosts`; targets ≥ 24px (dots 6–10px, footer links 15px, checkboxes 18px, "View all events") via hit-area, not visual change; contrast to AA only for the failing items (inactive nav 2.87:1, CTA 3.65:1, "Unlock" 3.98:1, 9–10px date pills). No palette overhaul.
5. *021.* Re-measure `/terms` (median of 5).
**Non-goals.** Animations, skeletons, visual hierarchy, flagship polish, screen-reader acceptance, real-iOS claims.
**Tests.** Request-id header on success/error; image-count budget test; input font-size classes; dialog trap/restore; single `main`; contrast checks for changed tokens; target-size assertions; optional 320/390 e2e for the drawer CTA.
**Hosted acceptance.** Re-run the audit's contrast script, keyboard/dialog script, 390px target script, overflow checks at 320/375/390/430 (no regression), HTML size and request count on `/`, induced error shows a request-id, synthetic error reaches the capture tool.
**Done when.** As M1; no new a11y failures vs the Phase 27 baseline.

---

## 3. Coverage check (all 50 active findings accounted for)

| Where | Findings |
|---|---|
| **M1** | 040, 003, 007, 008 (PII) |
| **M2** | 002, 005 (guest-domain part), 045, 032, 053, 008 (waterfall), 012, 006, 023 |
| **M3** | 004, 030, 014, 025, 031, 009, 048, 020 |
| **M4** | 038, 043, 039, 010, 011, 001r, 022 |
| **M5** | 013, 026, 024, 034, 049, 050, 051, 052, 021 (retest) |
| **Parked → Experience Quality Pass (Class C)** | 015, 016, 017, 018, 019, 027, 028, 033, 041, 042, 044, 046, 054 |
| **Deferred acceptance (cannot close by remediation)** | 035 (Transfer Acceptance); 005 root-domain cutover; hold/Pay parts of 040/025/010; 013 trace proof |

Count: 4 + 9 + 8 + 7 + 9 = 37 scheduled IDs (008 appears in M1 and M2) + 13 parked = 50, with 035 and the 005 cutover tracked in the register. **Nothing is silently dropped; nothing parked is "fixed".**

---

## 4. Path to launch (what happens after M5)

```
M1 ─► M2 ─► M3 ─► M4 ─► M5
                         │
          L1  CLAUDE INDEPENDENT RE-ACCEPTANCE (full matrix; FIXED / PARTIAL / REGRESSED / NEW)
                         │   gate: "GUEST PORTAL FUNCTIONALLY CLEAN"
          L2  PAYMENT ACCEPTANCE (Razorpay TEST mode, owner-authorised)
                         │   Pay · hold creation · hold TTL · finished-event rejection at hold/Pay ·
                         │   in-flight rule (L3) · ticket issuance · payment recovery · paid-no-ticket trace
          L3  POST-PAYMENT FLOWS   transfer execution (+ decide GUEST-035) · refund execution
          L4  HUMAN / DEVICE GATES Google login · real SMS delivery · real iOS/Safari · screen reader ·
                                   DB-layer integrity · load/concurrency
          L5  PRODUCTION CUTOVER   root domain decision · production fee policy deployed (H2) ·
                                   Vercel protection · CORS/trusted/Google/Razorpay/Firebase on prod domain ·
                                   production keys · Firebase test-bypass confirmed absent
          L6  LAUNCH GO / NO-GO    scorecard + checklist below
          ──────────────────────────────────────────────────────────────
          L7  GUEST EXPERIENCE QUALITY PASS (Phases 17/33 + parked Class C) — planned only after L1
```

### Launch go/no-go checklist (all must be true)
1. **P0 = 0, P1 = 0** (002, 003, 004, 040 FIXED; 005 verified on the production domain).
2. Every Class A/B finding **FIXED** in Claude's re-acceptance; D items done or owner-accepted in writing; no open NEW DEFECT ≥ P2.
3. **Payment Acceptance passed:** successful test payment → ticket issued; failed/abandoned payment recovers; hold expiry behaves; a finished event is rejected at hold **and** Pay; paid-but-no-ticket traceable via request/hold/payment ids.
4. Transfer and refund executed once each on controlled data; refund emails received.
5. **Google login and real SMS delivery** completed by a human on the launch configuration.
6. Real **iOS Safari** pass (zoom, viewport, blur, keyboard) and **screen-reader** pass recorded.
7. Production configuration verified by probes: fee policy approved/active with no test language, bypass flags absent, CSP enforced, cookies `Secure`, CORS/trusted origins exact, no `localhost`/preview media.
8. Performance targets met (or accepted exceptions): Profile LCP, homepage budget, TTFB trend; no CLS regression.
9. Observability: a synthetic failure is visible in the capture tool with a request-id; on-call knows the paid-but-no-ticket runbook.
10. Re-acceptance report committed; **score recomputed from evidence only**; owner signs the go/no-go.

### Score trajectory (targets, not promises)
After M5 + L1 ≈ **80–85** (functional clean) → after L2–L4 ≈ **88–92** → launch ≥ **90** with every deferred gate closed. Scores follow evidence; no inflation.

---

## 5. Owner timeline (what you must supply, and by when)

| By start of | You provide |
|---|---|
| now | **Rotate the Vercel bypass token** (H8) |
| M1 | nothing (H4 decided) |
| M2 | Google console + Render env values (H1/H1b); apply staging `NEXT_PUBLIC_FIREBASE_TEST_PHONE` (H7); one human Google login |
| **M3** | **Approved production fee policy (H2)** — needed to close GUEST-004; supply early, it has the longest lead time |
| M4 | Review/approve the cleanup candidate list **per record** (H5); observability tool/DSN is needed by M5 (H9) |
| M5 | H9 decision |
| L2 | Written authorisation for Razorpay **test-mode** payments |
| L4 | A real phone for SMS, an iOS device, screen-reader session |
| L5 | Root-domain / protection / production keys decisions (H3 later) |

---

## 6. Rules carried over (non-negotiable)
One milestone in flight; boundaries frozen (a new sub-milestone needs a recorded architectural blocker). Backend stays authoritative. No guessing secrets, env values or fee rates. Focused tests while iterating; **one** full CI-equivalent gate per milestone; GitHub CI on the exact PR head is the authority; independent review before merge; Codex never self-certifies — Claude re-accepts. Staging data is never changed without owner approval. Nothing here begins payment acceptance or the Experience Quality Pass.

---

## 7. Out-of-scope observation (not a Guest Portal finding)
A Partner **staff-invitation email** received on staging says "Ask your manager for the invite link to accept" with no accept button and a raw ISO expiry timestamp. Cause (source-verified, backend): the email only includes the accept link when the gateway env `PARTNER_DASHBOARD_URL` is set (`organization-service.ts` ~L345-356; `resend-email-sender.ts` ~L91-106); otherwise it falls back to that sentence. Likely a staging configuration gap plus misleading fallback wording for a Manager invite. Belongs to the Partner track, not M1-M5.
