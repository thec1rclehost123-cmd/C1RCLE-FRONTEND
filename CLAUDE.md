# C1RCLE Frontend Claude Code guide

## Find the common guide

Use the root `CLAUDE.md` in [C1RCLE-BACKEND](https://github.com/thec1rclehost123-cmd/C1RCLE-BACKEND) for the common audit workflow. Its `docs/ai/` owns the single Agent Harness. Retrieve the relevant records on demand.

- Prefer the exact backend checkout, worktree or ref specified by the task. For paired implementation, remediation, contract work or acceptance, use the exact approved backend baseline or head. Verify deployment separately. Confirm the local clone by its Git remote and inspect its linked worktrees if needed. If no approved checkout is available locally, use authenticated GitHub access at the approved ref.
- When revision-specific evidence matters and no baseline is named, establish it from active worktrees or PR context. Report unresolved provenance and withhold revision-specific acceptance claims. Use current backend `staging` only when the task explicitly sets it as baseline or when reading stable guidance independent of revisions. Continue unaffected work if a needed record cannot be resolved.
- For hosted work, start with scope, deployed target, Acceptance State, relevant findings and fixture records, and the browser. Use targeted re-acceptance after bounded fixes and reuse applicable PASS evidence. Approved and available Code Review Graph is optional for targeted source navigation. Otherwise use targeted search when source inspection is necessary.

## Local implementation guidance

Use the app's nested instructions for Next.js. For Scanner dependency work, keep Expo native dependencies within the installed SDK's tested set. Scanner currently uses Expo SDK 55 with `react-native-screens` pinned to `~4.23.0` to avoid the RN 0.83 codegen regression. Use `npx expo install <pkg>` from `apps/scanner-app` for approved native dependency changes and `npx expo install --check` to check compatibility. For Windows/pnpm Expo export codegen failures, check the equivalent Ubuntu CI result before changing dependencies.

CI uses `pnpm install --frozen-lockfile`. When approved dependency changes affect the lockfile, reconcile it with both sides' intended manifest changes, check for unintended resolution drift and include the reviewed lockfile in the same diff.
