# C1RCLE Venue Dashboard — Final Connected Acceptance Report

**Date:** 2026-10-30
**Recommendation:** **READY AFTER LISTED BLOCKERS**. The scoped Venue fixes are implemented, but final closure requires retrieval of the namespaced slot’s backend ID and isolation of the Slot Requests latency contributor. This is not a platform-wide M1–M5 completion claim.

## Scope and evidence

The authenticated Venue owner session used the local Partner Dashboard connected to non-production Firebase project `c1rcle-v2`. API Gateway health and readiness returned HTTP 200. The browser showed an active Venue owner membership. The direct session-record endpoint rejected a cross-site request, so stored platform-role and email-verification fields were not independently confirmed.

The Venue Overview, event/analytics, calendar, Slot Requests, partners/staff, finance, notifications, Presence redirect, Door Operations, Marketing, settings, and support screens were visited. The route-by-route evidence and explicit incomplete product surfaces are in [VENUE_DASHBOARD_CONNECTED_ACCEPTANCE.md](VENUE_DASHBOARD_CONNECTED_ACCEPTANCE.md). No Host, Guest, Promoter, Scanner, or Admin workflow is claimed.

## Defects and fixes

- Venue calendar now displays published availability rather than an empty-day state, preserves the slot note, and formats times in the stored timezone.
- Venue Overview now displays partner names. The backend partnership/connection DTOs already included public-safe names; the frontend loader discarded them. The names were mapped through and confirmed in a signed-in browser retest.
- Presence remains an incomplete product surface that redirects to separate Door Operations. No navigation redesign or Presence implementation was done. Dedicated Presence and Marketing surfaces remain deferred for Venue, Host, and Promoter.

## Slot Requests latency

With Chrome Network set to **No throttling**, the cold Slot Requests RSC route request took 18.25s. Two identical initial BFF reads took 18.85s and 26.42s. After data loaded, an isolated manual refresh made one BFF read in 8.23s and retained the displayed data.

Source tracing shows the incoming BFF read serially obtains Venue records and slot-request lists, then performs per-request detail reads in a concurrency pool of up to eight. The browser only shows aggregate BFF timing, not individual Gateway call durations, so the specific slow internal stage is unproven. A cold Next.js development route/HMR and duplicate development effect request can affect the first route observation, but do not explain the later 8.23s single BFF read. No speculative latency fix was made.

**Bounded follow-up:** add request-scoped, non-sensitive duration breakdowns for Venue-list, slot-request-list, and detail reads; reproduce once with this Venue context; optimize only the proven slow Venue-scoped read. This is the listed latency blocker.

## Namespaced slot and responsive queue

The only connected mutation was one open availability slot for **2026-11-16, 19:00–23:00 Asia/Kolkata**, tagged `M15-VENUE-E2E-20261030 — reserved for Host acceptance`. It persisted across reload and rendered with the expected time and note. The backend ID could not be retrieved through the supported creation response or organization-scoped API during this closure (**redacted ID: unavailable**). Do not edit Firestore directly. The supported API retrieval is the second listed blocker. The slot remains available for later Host request acceptance; no unrelated existing record was changed.

**Phone-width Venue inspection is explicitly queued for final responsive acceptance. Mobile is not passed.**

## Verification and Git

- Focused Venue Vitest: 4 files, 52 tests passed. The runner emitted four Node warnings that `--localstorage-file` was provided without a valid path.
- Partner Dashboard `pnpm typecheck`: passed.
- Targeted ESLint on the nine changed Venue source/test files: passed.
- Prettier check: passed on all nine changed source/test files and both Venue reports.
- `git diff --check`: passed.

The checkout is `/Users/aayushdivase/Documents/Codex/2026-10-28/c1rcle-m5-preserved/frontend-lineage-reconcile`, branch `codex/m4-m5-lineage-reconcile-20261029`, baseline HEAD `f16348234a436936a81ca090f7be37e34e52f9e8`. The full diff is being screened so only verified Venue-specific source, tests, and reports enter the Venue commit. Pre-existing Host, Promoter, Guest, Admin, auth, Door, environment, log, screenshot, and build-output changes remain excluded.

No PR, merge, deployment, payout, refund, or real-payment action occurred. Stop point is Venue closure; Host acceptance has not started.
