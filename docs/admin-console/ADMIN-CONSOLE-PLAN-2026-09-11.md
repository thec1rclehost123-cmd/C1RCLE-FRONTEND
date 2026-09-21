# Admin Console — V2 Design & Decision Record (Phase 7)

**Status:** proposed · **Date:** 2026-09-11 · **Owner:** platform ops + frontend

Sources consulted:

- `thec1rcle/ADMIN_PANEL_RUNDOWN.md` — the "admin panel idea" rundown (Claude-made)
- `thec1rcle/apps/guest-portal/ADMIN_SYSTEM_SPEC.md` — v1 backend spec (Badge / authority)
- `thec1rcle/apps/guest-portal/SECURITY_MATRIX.md`, `OPERATIONS_PLAYBOOK.md` — v1 security doctrine
- `thec1rcle/apps/admin-console/` — the actual v1 implementation (24 pages, `lib/server/adminMiddleware.js`, `lib/server/adminStore.js` 72KB, per-domain stores)
- `C1RCLE-BACKEND/packages/core/src/domain/models/admin-authority.ts` + `application/admin/admin-authority-service.ts` — the already-ported authority model
- `C1RCLE-BACKEND/apps/api-gateway/src/routes/v2/admin/*` — the already-wired admin API surface
- `C1RCLE-BACKEND/docs/roadmap/phase-07-admin-console.md` — Phase 7 roadmap (backend-first)

---

## 1. What the Claude idea proposed

- **Hard separation** — own domain, own login rules, "Default Deny" security; no "Remember Me"; 30-min idle timeout; least privilege by role.
- **13-section sidebar** — Home, Approvals (dual sign-off queue), Users, Venues, Hosts, Events, Payments, Support, Safety, Admins, Settings, Audit Log, System Health.
- **Governance pipeline** — high-risk actions never happen instantly: **Proposed** → reviewer inspects before/after state + evidence → **Execute / Reject**; every approval links to the original proposal.
- **Audit registry** — who / what / when / why, plus device context (IP + browser signature) and before/after snapshots.
- **System health** — webhook monitor (Razorpay/Firebase), manual re-dispatch retry engine, node status (Firebase Core, Vision AI Node, CDN Edge).
- **Audited CSV exports**; visual language — black/slate, indigo for trust actions, rose strictly for halts and capital outflows, glassmorphism.

## 2. What V1 actually built (reality vs. rundown)

The rundown is aspirational marketing; the code is both _more_ and _less_ than the idea:

- **Hardened middleware (real, good)** — `adminMiddleware.js`: Bearer-only tokens (no cookies → no CSRF), `verifyIdToken(checkRevoked)` in prod, no silent claim downgrade, **generic 404 for all denials** (no endpoint discovery), role hierarchy `{super:100, admin:100, ops:80, finance:60, content:40, support:20, readonly:10}`, **stale-session rejection at 30 min**, per-IP + `requestId` rate limiting on admin endpoints, Redis admin-suspension check, IP/UA/client-fingerprint + `requestId` capture on every request.
- **Tiered authority + dual control (real, ported)** — `adminStore.js` TIER1/2/3 with propose→resolve. The V2 roadmap calls it _"genuinely good, port verbatim"_, and it is **already ported** into `admin-authority.ts`, which improves the idea (see §6).
- **Huge but uncontained surface** — ~24 pages (admins, approvals, content/curation, events, health, hosts, kyc-review, logs, payments, promoters, promotions, proposals, refunds, safety, security, settings, support, tickets, users, venues) backed by **fat server stores in the Next app hitting Firestore directly**, bypassing the gateway — the exact V2 anti-pattern. Admin logic also duplicated on the V1 gateway (`apps/api-gateway/src/routes/v1/admin.ts`) = **split-brain authority**.
- **Divergences from the idea** — dev mode skips all claim checks; sessions persist 30 min (idea claimed _fresh login every entry_, unrealized); "Vision AI Node / CDN Edge" status nodes are fantasy for the current stack; 17MB `background-video.mp4` + hero PNGs shipped in the bundle.

## 3. Pros & cons — the idea (rundown)

### Keep

1. **Hard separation + Default Deny** — smallest blast radius; proven pattern in V1 lessons (hard separation, maker-checker).
2. **Dual sign-off governance pipeline** — the single most valuable control, already engineered in V2.
3. **Least-privilege roles** — right direction; "by consequence/tier" (V2) is strictly better than "by job title".
4. **Audited exports + before/after audit with device context** — proven in V1 code; already in V2's `AdminAuditRecord`.
5. **Idle-timeout / no-remember posture** — right intent; enforce server-side token freshness, not client vanity.

### Drop / rework

1. **Features list, not an architecture** — silent on where logic lives; left as-is it yields another self-contained Firestore app (V1's mistake). The layering rule is the fix.
2. **"Vision AI Node / CDN Edge / Firebase Core" health nodes** — aspirational infra that doesn't exist in V2 (Render, Vercel, Firestore, Redis). Wait for real dependencies before building telemetry.
3. **"Fresh login every entry"** — unrealizable UX; V1 itself settled on a 30-min window. The idea overreaches its own system.
4. **Content moderation + boost/discovery economics** — partly aspirational in V1; port only when the Phase 5/6 economy or moderation domains land.
5. **Glassmorphism marketing styling** — wrong for a dense ops console; admin consoles should be density-first.

## 4. Pros & cons — the V1 implementation

### Port the doctrine

- Middleware semantics: Bearer-only, revocation check, 404-obscurity, suspension check, rate limits, request-context capture.
- TIER / dual-control store logic (already ported verbatim).

### Do not repeat

- **Direct Firestore from the app** — console route handlers reaching collections themselves (gateway bypass).
- **Duplicated authority** — console stores _and_ gateway route both deciding admin policy.
- **Claims-based RBAC in JWTs** — role changes and suspensions lag token expiry; the token becomes a coherence problem instead of the DB.
- **Dev-mode security bypass** — "any authenticated user is admin in dev" is a footgun that ships to staging/prod behavior confusion.
- **Fat stores mixed with UI** — 72KB store plus dozen per-domain stores living beside components.
- **Heavy media** — multi-MB hero/video assets in an internal tool.

## 5. The recommendation: the best admin panel for V2

### Shape — thin console, thick gateway

Admin Console stays a Next.js UI-only app (today's scaffold is already just shell + nav) that calls `@c1rcle/api-client` → `/api/v2/admin/*`. **Why:** this is the one architectural non-negotiable — V1's whole problem was logic living in the console; the frozen _"frontend asks. backend decides."_ contract is the only durable fix. No Firestore, no admin SDK in the console runtime.

### Security — gateway enforced, not app middleware

The v1 middleware semantics (Bearer-only, 404 obscurity, suspension check, rate limit, context capture) move behind `/api/v2/admin/*` as a Fastify plugin. **Why:** the console stops being the trust boundary; a deactivated admin is refused server-side on every request (no JWT-claim lag), which fixes both the claims-latency and dev-bypass problems.

### Authority — reuse what is already ported

`AdminAuthorityService`: TIER1/2/3; propose→resolve; **self-resolution banned** (`resolveAction` refuses `resolvedBy === proposedBy`); proposer can cancel; provisioning reads the new admin's details from the _approved proposal payload_, so the executing admin can't swap what was signed off; revocation stays single-person (removing power should be easy, granting hard). Extend `AdminAction` as domains land: `VENUE_SUSPEND`, `EVENT_FORCE_PAUSE`, `PAYOUT_BATCH_RUN`, `PAYOUT_FREEZE`, `COMMISSION_ADJUST`. **Why:** it is already reviewed, unit-tested, and matches the maker-checker doctrine — never re-architect authority.

### IA — the rundown's 13 sections, server-filtered

Keep the map; render only what a role may see (opaque navigation). **Why:** proven information architecture + enforcement where it matters; per-role navigation is a UI reflection of backend policy, never the policy itself.

### Flagship UX — the dual-control desk

Approvals/Proposals queue rendering **before/after diff + evidence + reason**, Execute / Reject, cancelled-by-proposer, "requested by ≠ acting admin" badge. **Why:** this is the one idea feature that meaningfully reduces operator risk and is already fully API-supported.

### Lists & exports

`{items, pageInfo}` paginated lists + audited CSV exports (v1's exports route, re-homed to the gateway). **Why:** reuses a V1 win without re-litigating pagination or the wire shape.

### Defer content / health dashboards

Webhook/outbox monitoring is an enablement layer to consider later; "Vision AI Node" never. **Why:** building dashboards for imaginary infrastructure is the idea's biggest cost trap.

## 6. Build order (maps to roadmap Phases 2 + 6 + 7)

1. **Console login** — Better Auth admin session + `/me`, server-session bootstrap (reuse the partner-dashboard session pattern).
2. **Overview + Proposals desk** — backend routes already live (`/admin/proposals` list/raise/approve/reject/cancel, `/admin/admins`, `/admin/audit`).
3. **Users / Venues / Hosts / Events management** — add a few gateway routes (venue suspend = TIER2); console stays pure client.
4. **Payments / Refunds desk** — `/admin/refunds*` already exists.
5. **Support / Safety** (`v2_support_tickets`, `v2_safety_reports`) and **Settings / System Health** — final phase.

## 7. Out of scope now

- Content boosts and marketing placements.
- Onboarding KYC re-review duplication (stays in partner/kyc flows unless Phase 2 consolidation says otherwise).

## 8. Open questions / risks

- Claims-free admin session: whether console uses Better Auth session cookie (SameSite=Strict + CSRF token if cookies) or short-lived Bearer like v1.
- Whether onboarding KYC review stays in partner flows or moves to console in Phase 2.
- Payout-batch and commission-adjust execution depend on Phase 6 financial actions landing.

---

**Bottom line:** the best admin panel = the Claude idea's _governance soul_ (dual sign-off, hard separation, audited everything) + V1's _hardened middleware doctrine_ + V2's _already-ported tiered authority_, all wrapped in a thin client that only ever talks to `/api/v2/admin/*`.
