# Pass 3 — Partner onboarding and KYC acceptance

Status: **Pass 3 locally accepted**, including the explicitly authorized legacy test-fixture migration and final affected verification. This is local acceptance evidence, not production readiness. No PR, push, merge or deployment.

## Scope and lineage

Host/Venue/Promoter application, private KYC, resume, submission, review, approval and correct workspace access. No operational event/ticket/finance implementation changes. Existing canonical auth/session and onboarding lifecycle reused. Pass 1/2 remain intact.

- Backend implementation: `265a4a8` on `codex/product-completeness-20261104`, starting from `0e34970`.
- Backend fixture follow-up: `abe85ab` (18 test files and one test-only helper).
- Frontend implementation: `f5100bc` on the same branch, starting from `6752561`.
- Initial boundaries: `pass3-boundaries-20261104.json`; refreshed boundaries: `pass3-boundaries-final-20261104.json`.
- Staging remote reverified unchanged: BE `353999712a63fa74c61d4b60c67e3a2450585ca2`; FE `6c51ddaee3bc9a401a64994f6f010f3b9058ab68`.
- M3 advanced during acceptance to FE `283299f9b90d3d07753ced28855eae4162a4bb50`, BE `f01c3eb042436c539ab91982f066fffcdac65055`; both working trees clean at refresh. Pass 3 production source overlap: **zero**. The later authorized fixture migration creates 10 documented M3-owned test-file overlaps; see `pass3-fixture-migration-20261104.md`. Beyond those test-only overlaps, the candidate overlaps M3 in two inherited Pass 1 Guest login files (`login-page-client.tsx`, `page.test.tsx`). M3 changed fresh-document login navigation; candidate contains Google/trusted Guest continuation. Reconcile at eventual integration; neither lineage was modified to combine them here.

## Product decision

Human explicitly chose private persistence of existing required KYC fields for applicant/Admin review and resume. Implemented optional private `profile.kyc` identity/business/signatory sections in the existing application; strict validated fields, section-preserving updates and no client authority/verified flags. Submit and approve require the existing required fields as well as verified uploaded documents. Existing records without the newly retained required fields must complete them before submission/approval. Fields are not copied to operational organizations or venues.

No additional KYC requirements or lifecycle were invented. Optional Host category/history/association UI has no defined canonical persistence; no new optional-field semantics were added. Future policy for those fields is outside this required-KYC acceptance.

## Defects reproduced and fixed

- Open-only application lookup hid terminal approved/rejected states from returning applicants and polling. It now prefers an open request, otherwise the latest owned request.
- Submitted/terminal applications could obtain fresh upload grants. Upload/attachment changes are now limited to draft/changes_requested.
- `POST /organizations` allowed an applicant to provision operational capabilities without approval. It now denies direct provisioning with useful onboarding guidance. Legitimate approved organizations and invitation membership continue through existing access rules.
- A failure saving the approved application could previously leave an accessible organization. The decision is persisted first, with deterministic organization/venue IDs and authorized retry repair; existing organizations are returned unchanged, including suspension state.
- Wizard did not restore persona, review reason, existing documents or private KYC. Requested-change Fix Profile started another application instead of patching the existing one. Resume and same-request correction now work, with rejected document slots requiring replacement.
- Duplicate submit controls were not bound to request state. They now stay disabled while saving/submitting.
- Application-load failure restarted role selection. It now presents a bounded retry.
- Authorization loading rendered the operational shell prematurely. It now displays only a loading state. The existing server-authorized M3 event-route exception is preserved.
- Admin request-changes returned 500 after persisting status: request metadata was discarded and Firestore audit included undefined fields. Forwarded metadata and omitted undefined top-level audit properties; route and real Emulator regressions pass. Historical failed HTTP result remains explicitly marked in the native evidence file.
- Application/review/BFF successful responses lacked private no-store cache policy. Added scoped `private, no-store`.
- Warm login/approval navigation left the root auth provider on an old cookie-backed organization, producing a real Promoter onboarding/overview loop. Reused the existing picker convention: set organization, then navigate a fresh document, validating the target with the existing trusted-path helper. Login resolves the first backend-authorized tab.
- Saved business signatory declaration was not restored. A failing regression proved it; resume now restores the persisted declaration.

## Browser acceptance

Actual native BetterAuth, Firestore driver on loopback Emulator `demo-c1rcle-pass3`, and disk-backed signed loopback storage with real synthetic PNG bytes. Email capture only, no real provider sends or real business/KYC data. Synthetic verified users and draft profiles were seeded through the fixture; browser evidence does **not** claim new-account signup/provider verification acceptance.

| Persona  | Browser lifecycle and outcome                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host     | Native login → resumed draft → 3 real uploads → full reload retained uploaded slots → submit/pending → direct operational route returned to onboarding → requested-change reason → same application profile correction + selfie replacement → resubmit/pending → Admin browser document verification/approval → returning login reached Host Studio. Direct Venue URL before legitimate invitation showed belongs-to-Host denial. |
| Venue    | Separate native login → resumed draft/identity → 3 real uploads → submit/pending → authenticated Admin API verified 3 documents and approved → polling observed approved → correct Venue Studio.                                                                                                                                                                                                                                  |
| Promoter | Separate native login → resumed draft/identity → 3 real uploads → submit/pending → authenticated Admin API verified 3 documents and approved → correct Promoter Studio after warm-navigation defect fixed. Returning to onboarding went back to the studio without repeating onboarding.                                                                                                                                          |

The Host Admin browser reviewed actual private identity details and manually verified each document, then confirmed approval. Venue/Promoter decisions used the same native authenticated Admin routes. The pre-fix request-changes HTTP call returned 500 after the state persisted; the resulting applicant reason/correction/resubmission was exercised. Post-fix request metadata forwarding and actual Firestore audit serialization are regression-tested; a fresh post-fix browser request-changes response was not re-exercised.

Approved workspace shells rendered; overview/analytics data was unavailable in the intentionally narrow fixture. This pass does not claim deeper operational functionality. Screenshots under `screenshots/pass3-*` show pending states, Host Admin approval, each approved studio, and multi-workspace selection. No final runtime console errors were captured on the last membership-switch screen. Broad phone-width/visual acceptance was not performed.

## Lifecycle, access and privacy

Existing statuses preserved: draft → submitted → approved/rejected/changes_requested; changes_requested permits correction/resubmission, rejected remains terminal. Focused core tests cover terminal state per persona, persona/entity combinations, required KYC, document checks and approval failure/retry.

Native evidence (`pass3-native-evidence-20261104.json`):

- Pending Host memberships empty; forged workspace 403; direct provisioning 403; cross-applicant PATCH 404; applicant Admin detail 401; anonymous progress 401.
- Ordinary Guest own progress 200/null; other applicant PATCH 404; Admin review 401.
- Authorized Admin signed document read 200 with exact uploaded bytes and no-store; unsigned storage read 403. Core ownership tests continue to enforce applicant/application/label paths and reject reuse.
- Approved Host/Venue/Promoter native access returns the matching partner type. Organization DTOs contain no private KYC.
- Native Venue-owner invitation → Host acceptance produced two real memberships. Host access: Host OWNER and Venue MANAGER; forged access 403. Browser picker listed only those two memberships, and selected Venue rendered Venue Studio. No new multi-org semantics.

## Verification

Final affected sweep:

- Backend **169 passing**, 10 files: onboarding domain/service, Firebase object storage, Firestore private KYC/audit, private contract validation, onboarding/Admin/organization/invitation routes, Firebase phone verifier. Emulator tests ran against `127.0.0.1:8089`, not skipped.
- Partner **177 passing**, 13 files: wizard/login, onboarding BFF/repository/validation, phone route, organization/trusted redirects, access/provider hydration and frame guard. Subsequent signatory-resume regression added one test; affected wizard/login rerun **29 passing**. Unique Partner coverage now **178**.
- Admin **7 passing**, 2 files: onboarding queue and private detail. Detail rerun after lint correction: **1 passing**.
- Typechecks passed: backend core/contracts/gateway; frontend Partner/Admin; both contracts builds.
- Targeted changed-file ESLint and Prettier passed; backend commit hook also passed ESLint/Prettier.
- Architecture checks passed in both repositories (frontend 19 workspaces); contract parity **247 checks**; exporter **0 writes, 28 unchanged, 0 removals**.
- Diff checks passed. Frontend Node emitted the existing `--localstorage-file` warning; tests still passed.

The legacy idempotency failure (`expected 201, received 403`) was reproduced before migration. After explicit human authorization, 18 affected legacy test files were migrated to proper approved-workspace setup; **311 tests passed**, followed by a fresh **169-test** backend Pass 3 sweep. The previous fixture integration blocker is resolved. This remains affected-scope verification, not an all-green full-repository claim.

Commands used: backend root `FIRESTORE_EMULATOR_HOST=127.0.0.1:8089 pnpm exec vitest run` with the ten paths above and `--maxWorkers=2`; Partner `pnpm exec vitest run` with the thirteen paths above and `--maxWorkers=2`; Admin queue/detail with `--maxWorkers=1`; app-local `pnpm exec tsc -p tsconfig.json --noEmit`; backend filtered core/contracts/gateway `typecheck`; both `boundaries`; backend `node scripts/contract-parity.mjs --frontend <candidate-FE>` and exporter dry-run. No Scanner or full-product sweep.

## Fixture integration decision — resolved

The human explicitly authorized affected legacy test fixtures only. The migration is completed and verified, preserving the direct-provisioning denial and operational implementation/assertions. Exact 10 M3-owned test paths, the 8 other affected test paths, preserved assertion intent and commands are documented in `pass3-fixture-migration-20261104.md`. The shared helper lives only under gateway test-utils. No pending product decision blocks local Pass 3 acceptance. Hosted/provider evidence and deliberate integration of documented overlap remain separate.

## Remaining connected evidence and cleanup

Hosted Firebase/BetterAuth session/origin configuration, actual object-storage IAM/CORS/signed URL behavior, real email/SMS delivery, and any configured external KYC provider still need hosted/provider acceptance. Local format checks remain advisory; Admin review is the approval authority. No production readiness claim.

Task Partner/Admin/gateway servers stopped. Temporary backend `.pass3-acceptance.mts` removed. Only known generated Next AGENTS heading/next-env changes restored. Shared Emulator left running; isolated synthetic demo records/storage remain local. No real data touched, no tracked credentials, no provider sends. Do not start Pass 4.
