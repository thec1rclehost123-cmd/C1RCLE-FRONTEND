# Pass 4 — Guest profiles and privacy

Status: **Pass 4 locally accepted.** Founder decisions are confirmed: other-Guest profiles remain unavailable in V1; attendance/interests remain own-only; social visibility, Guest discovery, profile-linked guestlist policy, handles, blocking and reporting are deferred to Pass6. Existing unavailable-profile and owner-scoped APIs already enforce this approved scope; no public Guest DTO or social endpoint is introduced.

## Candidate and boundaries

- Frontend implementation: `1e4ba60`, starting from `3f2a2e4`.
- Backend implementation: `c12baea`, starting from `abe85ab`.
- Both remain on `codex/product-completeness-20261104`; Passes 1–3 preserved. No push, PR, merge, deploy or Pass 5 work.
- Initial map: `pass4-boundaries-20261104.json`. Final refresh: `pass4-boundaries-final-20261104.json`.
- Pass 4 overlap with M3 committed/working paths: **zero**. Pass 4 overlap with M4 committed/working paths: **zero**.
- M3 heads at final refresh: FE `283299f9b90d3d07753ced28855eae4162a4bb50`, BE `f01c3eb042436c539ab91982f066fffcdac65055`, clean working trees.
- M4 is active: FE same head with22 working paths; BE advanced to `9383480512a9f521ec90c8fa71d7b3a4bf60922f` with46 working paths. None edited here. Inherited Pass1 Guest-login2 and explicitly authorized Pass3 test-only10 overlaps remain documented integration dependencies; not broadened.

## Architecture and actual product state

Own `/profile` server page → canonical native auth session → caller-scoped `GET /api/v2/profile/me` → existing GuestProfileService → `v2_guest_profiles`. Editing uses CSRF/same-origin BFF `PUT /api/profile/me` and the existing full-replace gateway write. The authenticated session owns identity; body/path/query/header user IDs cannot select another profile. Pass2 onboarding and profile editing share the same record. Existing update logic preserves server-verified phone; no second profile model/store was created.

The own page also reads its caller's orders and entitlements for private upcoming/attended history. No attendance, custody, door, payment or finance source behavior was changed. User account email/avatar come from the canonical session; display name/DOB/interests/verified phone come from the existing profile. The profile display name remains authoritative for the own profile rather than duplicating writes into auth identity.

Other-Guest `/profile/[userId]` and metadata explicitly return notFound. No connected backend public Guest profile DTO/API exists. Historical frontend PublicProfileIdentity/PublicProfileView/fixtures are disconnected; their city/interests/attendance fields are **not** an approved social/public contract. No private record is passed to a public view. A safe social DTO must be introduced only if/when visibility policy is approved; no unused public model or fake projection was added.

No connected Guest handles, bio editing, Guest search, privacy toggles, blocking or Guest reporting were found in this traced surface. Social-links UI explicitly says it cannot save. `/privacy` contains only title/intro content, not actual operational settings. No Guest-facing account deletion/deactivation/anonymization flow was found in the traced UI or gateway; no deletion/compliance infrastructure or ticket/audit deletion was added.

Avatar support is read-only canonical session imagery, with initials fallback. No upload/replace endpoint or media pipeline exists. UI truthfully reports upload unavailable; attempts to mass-assign an avatar through profile PUT are rejected. Native-session image persistence/serialization and frontend rendering are covered, not a nonexistent upload pipeline.

## Own profile fixes

Reproduced before fixes: legacy profile edit rejected an otherwise complete Pass2 Guest (one interest, empty city/intents), even for a name change. API returned422; browser form sent no write. The contract/UI now accept one or more existing interests and optional empty city/joining reasons. Name is trimmed and2–200 characters; city bounded100; taste/intent values bounded60; DOB still uses the existing real calendar/18+ domain guard. Empty interests and unknown/forged fields remain invalid.

Form now provides useful DOB/validation errors rather than calling all400/422 responses a connection failure. Birthday/contact privacy is explicit. Normal settings entry opens the working personal editor instead of the unsupported social panel. Own Account & Security shows the authoritative verified phone instead of incorrectly saying Not provided, and uses C1RCLE account instead of assuming every identity is Email-only.

The private profile DTO explicitly includes only owner profile fields and verified phone; no phone verification timestamp/token/provider internals. Gateway profile/onboarding responses and BFF profile responses (including errors) are `private, no-store`. The BFF GET catches gateway outage/malformed-response failure and returns the established502 envelope. Regression-first tests demonstrated absent cache headers before the fix.

Unavailable profile copy no longer implies an existing public-profile or guestlist-removal lifecycle.

## Data classification

| Data                                                                  | Current permitted recipient / behavior                                                            |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Display name, city, interests, legacy joining reasons                 | Own authenticated profile only; social projection not enabled                                     |
| DOB, exact birthday                                                   | Own private editor; never another Guest or public profile; no derived age output                  |
| Verified phone                                                        | Own read-only account display; only existing server proof flow writes it                          |
| Email                                                                 | Own canonical session/account view; no Guest lookup by email/phone introduced                     |
| Avatar                                                                | Existing own session image only; no upload/replace or public Guest profile capability             |
| User ID, created/updated timestamps                                   | Own private DTO only; no Guest discovery/identity index                                           |
| Phone verification internals, credentials/tokens, roles/security data | Absent from profile DTO; cannot be assigned through profile write                                 |
| Orders/attendance/payment/KYC/support                                 | No new public/profile projection; existing separately authorized operational interfaces untouched |

## Security evidence

`apps/api-gateway/src/routes/v2/profile-privacy.integration.test.ts` uses **actual native BetterAuth and real Firestore**, an isolated randomly named `demo-c1rcle-profile-*` project, loopback Emulator only, and three distinct synthetic users (Guest A, Guest B, Partner). It is not fabricated authorization through x-user-id. Setup marks only synthetic account email verified and seeds synthetic phone proof; this is not real provider verification acceptance. Outbound provider configuration is removed for the fixture, senders are capture/no-send, workers disabled; environment overrides are restored after tests.

Verified:

- Guest A GET with query `userId=B` and forged x-user-id B still returns A.
- Exact owner DTO whitelist; verified phone survives a permitted profile edit and completion stays true.
- Forged body userId, phone, verification timestamp, role, avatar, privacy and nested profile rejected422.
- A and Partner GET/PUT arbitrary B profile routes return404; no private profile route exists for arbitrary IDs.
- Partner own-profile request with B query/header cannot obtain B and returns404 (no own Guest profile).
- Guest B subsequently receives B's own private DTO and B's Firestore record remains byte-for-byte unchanged.
- Anonymous GET/PUT, including forged x-user-id, return401. Native logout revokes A; replay read returns401.
- Separate owner reads and write responses are no-store. No cross-user cache reuse was introduced.
- Existing full-replace profile service retains the server-owned verified phone/timestamp through editing; timestamps are not emitted in the profile DTO.

## Browser acceptance

Actual local native-auth/Firestore fixture on gateway4301 and Guest3100. Controlled synthetic data only; no real business/provider mutations. Profile setup was seeded, not claimed as a new signup/provider journey (Pass1/2 audits were not restarted).

- Guest A signed in using the existing email-first/password flow and trusted return to personal settings.
- Edited name with only House interest and city/reason empty → save → full reload → updated name and fields persisted.
- Desktop form inspected; phone390×844 inspected, scroll controls accessible, edited interests to House/Comedy → Profile updated.
- Own Account & Security displayed the expected private verified phone; no claim that it is public.
- A opened B's actual synthetic profile URL → unavailable view without B identity/details/edit controls. Unauthorized mutations were additionally exercised through the real native-auth API integration test.
- Sign out confirmed → direct private settings visit redirected to login with the trusted original destination.
- Logged-out Explore returned the public filter/empty-results surface, not a login wall. Fixture intentionally contains no events.
- No final browser console errors captured. Temporary viewport reset. Screenshots: `screenshots/pass4-profile-desktop.jpg`, `pass4-profile-phone.jpg`, `pass4-profile-phone-controls.jpg`, `pass4-anonymous-explore.jpg`.

## Guestlist / social dependencies (Pass6)

The existing M3-owned GuestlistPreviewClient links guest IDs to `/profile/:id`; current connected event mapping sets guests[] and preview renders only when nonempty. No Guest attendance/profile projection was enabled here. Future guestlist population must decide consent/visibility and use a strict backend social DTO, not the own-profile DTO or auth email. Social hiding must not remove authorized admission/holder data. Assignment must continue using existing authoritative identity/email internally without exposing email socially.

The M3-owned EventDetailView contains a Save button without a persistence handler; no saved/favorite profile collection/API was found in the traced profile surface. Record this dependency for its owning pass. Do not implement it here. Any persistent Save action must retain the protected action/onboarding boundary and must not publish saved events by default.

## Founder decisions — resolved

### Profile visibility

**Confirmed by founder:** “Keep other-Guest profiles unavailable for V1; defer social visibility to Pass 6.”

The existing `/profile/[userId]` page and metadata return notFound for all IDs. There is no public Guest profile API. This matches the approved V1 behavior; it is an intentional privacy boundary, not a placeholder to enable implicitly. No strict public/social DTO is needed while no identity projection is authorized. Pass6 must define that explicit backend projection before enabling visibility; the own-profile DTO must never be reused publicly.

### Social scope and privacy semantics

**Confirmed by founder:** “Yes—keep these private/deferred for Pass 6.”

Attendance and interests remain own-only. Guest search/discovery, attendance sharing, profile-linked social guestlist policy, handles, blocking and Guest-reporting semantics remain deferred. Existing authorized admission/Scanner and ticket-assignment behavior is unchanged. No open product decision blocks local Pass4 acceptance.

A focused rerun of the three existing unavailable-profile/metadata tests passed after confirmation. No behavior change was necessary; the 72-test affected sweep and browser evidence above remain applicable. No broad suite or previous-pass audit was restarted.

## Final affected verification

- Backend: **26 tests passed**,6 files: profile route, native profile-privacy integration, guest-onboarding route, profile service, onboarding domain, Firestore onboarding persistence. Actual loopback Emulator tests ran, not skipped.
- Frontend: **46 tests passed**,8 files: own profile/editor/event collection, unavailable other-profile route, profile BFF, onboarding BFF/guard and trusted auth continuation. No unrelated Scanner/payment/finance suites.
- Guest full typecheck, gateway/contracts typechecks and contracts builds passed. Core typecheck also passed.
- Targeted ESLint/Prettier passed, both architecture checks passed (FE19 workspaces), contract parity **247 checks**, generated mirror **0 writes /28 unchanged /0 removed**, diff checks passed.
- Final review checked changes against intended profile/privacy paths and refreshed both milestones. Cumulative Pass1–3 work was preserved rather than re-audited or rewritten.

Reproduce backend from its root: `FIRESTORE_EMULATOR_HOST=127.0.0.1:8089 pnpm exec vitest run apps/api-gateway/src/routes/v2/profile.test.ts apps/api-gateway/src/routes/v2/profile-privacy.integration.test.ts apps/api-gateway/src/routes/v2/guest-onboarding.test.ts packages/core/src/application/guest-profile/guest-profile-service.test.ts packages/core/src/domain/guest-onboarding.test.ts packages/core/src/infrastructure/firestore/firestore-guest-onboarding.integration.test.ts --maxWorkers=2`.

Frontend sweep was app-local vitest with `src/app/profile/page.test.tsx`, `src/app/profile/[userId]/page.test.tsx`, `src/features/profile/components/PersonalProfileFormClient.test.tsx`, `src/features/profile/components/ProfileEventCollection.test.tsx`, `src/app/api/profile/me/route.test.ts`, `src/lib/bff/guest-onboarding.test.ts`, `src/features/onboarding/OnboardingGuard.test.tsx`, `src/app/auth/continue/page.test.tsx`, `--maxWorkers=2`.

## Remaining evidence and cleanup

Hosted auth/session/origin configuration, cache behavior through actual hosting/CDN and Firestore deployment permissions remain hosted acceptance. No new provider integration was added. Existing image-provider behavior is inherited; there is no avatar upload pipeline to claim tested. Live phone/email verification remains prior-pass/provider evidence, not part of this synthetic profile acceptance.

Task Guest/gateway servers stopped; temporary acceptance harness and generated synthetic credential metadata removed. Known generated Guest AGENTS heading/next-env changes restored. Seeded browser-fixture users/profiles/sessions/accounts cleaned by fixture close; shared Emulator remains running. No real data touched. No PR/push/merge/deploy; do not begin Pass5.
