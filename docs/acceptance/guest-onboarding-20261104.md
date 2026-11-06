# Pass 2 — Guest onboarding and auth UX acceptance

Local candidate, 2026-11-04. Branch `codex/product-completeness-20261104` in the isolated PRODUCT-COMPLETENESS frontend/backend worktrees. No PR, push, deployment, live credentials, or external email/SMS sends.

## Product boundary

Public discovery remains open to anonymous and incomplete authenticated Guests: homepage, Explore, search/filtering, event details, Hosts/Venues and sharing. Verification/onboarding applies at existing protected boundaries (`/checkout`, `/tickets`, `/profile`, `/confirmation`, `/help`), not globally. M3 event/ticket implementations are untouched. Read-only trace confirmed ticket selection links into `/checkout`; Free RSVP runs there too.

## Pass 1 checkpoint

Backend `daa8bb7`; frontend `933a861`, `823332a`, `45274a4`. Existing acceptance ledger/manifest preserved. Checkpoint verified before Pass 2; no M3 overlap. Canonical Better Auth identity/session, email OTP, Google state/PKCE/linking, recovery and trusted-return mechanisms retained.

## Implementation

- Rendered Login/Signup inspected before editing. Shared email-first entry shows the same explicit Sign in/Create account choices without account lookup. Existing credential forms receive the email in memory. Google button uses Google's published G asset and accessible full-width treatment; branding source: https://developers.google.com/identity/branding-guidelines.
- Four focused onboarding steps share AuthShell: editable name (session/Google prefill), private calendar DOB, verified phone, curated interests. Existing GuestProfile document and `tastes` field reused; no duplicate store, fake city/intents, public profile or social feature.
- Server derives completion from persisted required fields. Each step saves before advancing; fresh repository instances and browser refresh resume missing progress. Completed Guests bypass. Public continuation bypasses onboarding; protected continuation checks email and server state, failing closed if unavailable.
- Existing Firebase phone verifier validates the SDK proof and exact phone. Format-only providers cannot mark phone verified. Dedicated browser SDK wrapper performs phone proof only, signs out its temporary Firebase user, uses reCAPTCHA and no testing bypass. C1RCLE session is unchanged. Client handles wrong/expired code, send failure and resend cooldown; server applies rate limits. Narrow Guest SDK exception extends the existing Partner architecture allowance.
- Return intent preserves trusted pathname and query (including checkout tier/ref). Private hash is tab-local, never copied into auth query/server logs. Restoration requires authenticated canonical Guest and exact destination; previously identified intent is user-scoped and consumed once. Anonymous tab intent is claimed after authentication. Pass 1 safeNextPath protections remain.
- DOB calendar normalization bug reproduced by focused failing tests, fixed with real calendar validation and injected clock. New onboarding endpoints reject absent actor rather than fabricating a memory-mode caller (regression reproduced first).

## Privacy and security evidence

New session-scoped `/profile/onboarding` endpoints expose progress only to their caller; GET is `private, no-store`. BFF requires native session and enforces origin/CSRF for writes. Strict contracts reject forged identity/completion/phone verification flags. Tests prove caller isolation and no anonymous access. Public gateway routes have no GuestProfile/DOB/phone reads; existing own-profile DTO explicitly maps fields and does not add phone. No Partner/public response widened. DOB never participates in ticket-gender authorization.

## Verification

| Evidence                                                                                                                                      | Result                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Guest affected auth/onboarding sweep (login, signup, verify, recovery, Google BFF, continuation, auth entry, onboarding, safe returns, proxy) | 14 files / 116 tests passed                                                            |
| Added Finish/return and anonymous fragment regressions after sweep                                                                            | 2 files / 11 tests passed                                                              |
| Gateway auth/profile/onboarding sweep with loopback Firestore emulator                                                                        | 9 files / 43 tests passed                                                              |
| Core onboarding domain/service/Firestore persistence                                                                                          | 3 files / 15 tests passed                                                              |
| Existing Firebase phone-proof verifier                                                                                                        | 6 tests passed                                                                         |
| Guest full typecheck, frontend contracts, backend gateway/core typechecks                                                                     | Passed                                                                                 |
| Changed Guest/backend sources and boundary-tool lint                                                                                          | Passed; generated frontend contracts intentionally lint-ignored, backend source linted |
| Architecture checks                                                                                                                           | Both passed; Guest phone SDK allowance documented alongside Partner                    |
| Contract export parity                                                                                                                        | 28 unchanged, zero writes/removals in explicit candidate dry-run                       |

Focused routing coverage proves all six public-browsing requirements: anonymous public access, anonymous private denial, incomplete authenticated public access, protected onboarding, original trusted checkout return after completion, and completed bypass. Protected controls remain withheld until server completion is confirmed. Tests also cover external destinations, unavailable state, editable name prefill, wrong/expired OTP, cooldown, valid proof, send failure, persistence and canonical email/Google onboarding convergence.

Browser used actual local native-auth/BFF/Guest service + isolated Firestore fixture. Email-first choices and prefilled sign-in worked. Name edited/saved, full refresh resumed DOB; DOB saved, then phone; synthetic server phone proof (no SMS) persisted, refresh resumed interests, House/Comedy completion returned to Explore. Revisiting onboarding visibly bypassed to Explore. Explore event data unavailable in auth-only fixture (expected, no M3 fix attempted). Phone viewport 390×844 inspected. Temporary harness removed and task-owned servers stopped; synthetic local Firestore records may remain. Shared emulator untouched.

## Remaining connected evidence

Real Google consent/callback, real email delivery, Firebase reCAPTCHA/SMS delivery and hosted acceptance remain pending. Native Google identity uses synthetic provider fixture; phone tests use synthetic proofs or SDK mocks. No production-readiness claim.

## Candidate and review

See `pass2-candidate-files-20261104.json` for full path manifest, staging/M3 heads and separate committed/working overlap. Both overlap sets empty at final review. Pass 2 implementation commits: backend `0e34970`; frontend `d4fc686`. Evidence commit recorded in final report. No M3/M4, ticket, event, Wallet, transfer, refund, payment or Scanner implementation edited.

Operational correction: unsupported exporter `--help` created a new sibling folder. Creation timestamps and byte comparison proved all28 files were created by that call; only that newly-created folder was removed. Explicit candidate dry-run then confirmed exact parity. No pre-existing worktree touched by that invocation.
