# Auth & Account acceptance — local candidate; connected verification pending

Scope: original Pass1 attachment12090050 plus consolidated Guest signup/Google decision fd9fe0d3. Branch in both isolated repositories: `codex/product-completeness-20261104`. Baselines: frontend6c51dda; backend3539997. No push, PR, merge, deployment, provider emails or external credential/config changes.

## Workflow ledger

| Workflow                | Before                                                                                 | Correction / evidence                                                                                                                                                                                                                                | Remaining connected verification                                  |
| ----------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Guest signup            | Web UI unavailable; directed to mobile                                                 | Native signup UI, existing signup/session/OTP primitives; verification before trusted redirect; retry delivery without second signup; component tests passed                                                                                         | Real nonproduction email delivery; staged browser signup          |
| Verification/resend     | Backend account-bound OTP existed; Guest consumer missing                              | Guest send/verify and session-bound resume; unverified login continues verification; already-verified users redirected;31 domain/service tests and persisted native integration passed                                                               | Provider delivery and staged resume                               |
| Google signup/login     | No configured provider or Guest consumer                                               | Native Google provider and state/PKCE, Guest BFF initiation/callback, normal cookie/CSRF session, Google button; synthetic native integration and5 BFF tests passed                                                                                  | Configure approved client/secret/callback and real Google consent |
| Canonical identity      | Native linking available but unaccepted                                                | Synthetic signed-token/native Firestore integration: new/returning identity, verified password same-email linking, unverified-local rejection, unverified provider rejection/no user, inverse password duplicate rejection, different-email nonmerge | Provider-backed confirmation                                      |
| Forgot password         | No redirectTo; emitted callback unmounted; network errors called valid email malformed | Trusted frontend binding; bounded native reset callback HTTP bridge; ZodError-only validation classification in Guest/Partner; regressions reproduced then passed                                                                                    | Actual delivered link through hosted gateway/frontend             |
| Reset password          | Direct-token backend worked; browser link integration incomplete                       | Mounted native callback; Guest/Partner network errors offer retry; native invalid/expired/replayed token, old/new password and session revocation tests passed                                                                                       | Hosted reset journey                                              |
| Login/logout            | Existing primitives                                                                    | Guest/Partner focused tests; real local browser login, refresh, security settings, logout and protected profile rejection accepted using synthetic account                                                                                           | Hosted browser acceptance                                         |
| OTP                     | Existing account-bound atomic consumption, expiry, cooldown and attempt protections    | 31 domain/service tests; HTTP and persisted verification tests passed; limits preserved                                                                                                                                                              | Real delivery                                                     |
| Session/revocation/bans | Existing M1 implementation                                                             | Native revocation, persisted verification, ban/suspension tests passed. Google native callback session lookup/logout passed; expired/replayed state produced no session                                                                              | Hosted cross-origin session/cookie behavior                       |
| Account security        | Existing Guest change-password form and Partner forced rotation                        | Source traced, native password change/revocation and Partner form/guard tests passed                                                                                                                                                                 | Hosted change-password UX                                         |

## Google safety and configuration

`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` must be supplied together. Callback must be exact `/api/auth/google/callback` on a configured trusted frontend origin, HTTPS except loopback, no credentials/query/hash. Register that URI with Google separately. Missing configuration honestly fails; no fake login.

Native Better Auth1.7.13 handles provider verification, state, PKCE, account lookup/linking and normal sessions. New provider users default to Guest server-side. Google email must be verified. Local email verification remains required before implicit same-email linking; different-email linking disabled. Unverified existing-account owner signs in, completes verification, then retries Google. No heuristic merge and no resource-owner migration.

## Verification evidence

- Initial gateway auth/plugin/OTP:3 files41 tests passed.
- Core OTP domain/service:2 files31 tests passed.
- Shared auth/store:2 files29 tests passed.
- Partner selected auth surface:7 files62 tests passed; later recovery BFF/form20 tests and reset6 tests passed.
- Admin proxy:2 tests passed.
- Consolidated gateway before signup/Google extension:6 files46 tests passed.
- Consolidated Guest before extension:5 files53 tests passed.
- Latest Guest login/signup:2 files10 tests passed. Google BFF:5 passed.
- Native synthetic-provider identity/OAuth callback/state/replay/expiry/session test passed after latest extension.
- Google config:6 tests passed.
- Guest full typecheck, Partner typecheck and backend typecheck passed at their latest completed checkpoints. Targeted lint passed after fixes; final recheck required after formatting.
- Architecture boundaries passed across19 workspace members after building scripts package.
- Final affected sweep: gateway9 files54 tests passed; Guest8 files65 tests passed. Earlier focused counts overlap; do not sum them.

## Browser evidence

IAB against actual Guest BFF + actual Better Auth gateway + isolated loopback Emulator: synthetic unverified account login200, profile200, session200, refresh200; fresh tab showed authenticated profile/security settings. Logout204 led to login; reopening /profile redirected to login. No provider sends. Auth-only fixture lacked unrelated event-history endpoints; unavailable states were not audited as product defects.

Recovery malformed-email and unavailable-gateway messages visibly accepted; missing reset token visibly accepted. New /signup rendered with Google and email/password fields. Screenshot inspected at390×844: heading, button and form fit viewport; viewport reset. Native password mutations tested via Emulator, not entered into browser.

## Isolation / review

Fresh fetch staging unchanged at last check. Inspected committed M3/staging auth paths showed no overlap; refresh all changed/untracked path intersections before candidate report. M3-owned backend config/index.ts left untouched; Google config isolated in new module. M3 ticket/event/scanner/finance paths untouched.

Temporary local gateway and Guest servers stopped; .auth-acceptance.mts removed; generated AGENTS/next-env-only diffs restored. Shared Emulator untouched.

## Candidate readiness

Final sweeps passed: gateway54 and Guest65. Explicit native provider-failure test subsequently passed: failed code exchange created no account/session. Targeted lint, formatting, affected typechecks, architecture boundaries and diff checks passed. Reviewed changed/new auth paths and refreshed M3 overlap; no committed or working path overlap. Temporary harness/servers and generated-only diffs cleaned. Exact manifest: candidate-files-20261104.json. Local source candidate is ready for review; hosted/provider acceptance is pending.

Provider-connected Google/email evidence remains explicitly unverified, requiring approved nonproduction configuration. No new product decision is pending.

Proposed logical commits: backend recovery/native callbacks; Guest web signup/verification; Google provider/BFF/canonical identity acceptance; Guest/Partner recovery failure UX. One coordinated Auth/Account staging candidate; normal CI after coherent PR(s). No merge/deploy in this pass.
