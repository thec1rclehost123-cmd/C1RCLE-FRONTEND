# Dependency updates (Renovate)

`renovate.json` configures Renovate for this repo. **It does nothing until the Renovate
GitHub App is installed on the repository** (https://github.com/apps/renovate, needs an
owner or organisation admin). Once installed, Renovate opens a "Configure Renovate" or
"Dependency Dashboard" issue within minutes; if neither appears, the app is not running.

## What it does

- Runs Mondays at 06:00 IST and targets `staging`.
- Pins exact versions (the repo saves exact), and waits 14 days after a release before
  proposing it.
- **Never auto-merges.** These apps deploy to Vercel and CI has a known flaky test, so a
  person merges every update. Revisit once CI is stable.
- Groups related packages into one PR: `next` (with its ESLint plugin), `zod`, `vitest`,
  `react`, `playwright`, the TypeScript/ESLint/Prettier toolchain, GitHub Actions, and
  separate groups for production and dev patch/minor updates.
- Major updates only appear after you tick them on the Dependency Dashboard.
- Never proposes a Node major (or `@types/node` major): that changes `.nvmrc`, engines
  and CI together and is a deliberate decision.
- **Does not touch `apps/scanner-app/package.json`** except `zod`. The scanner's native
  dependencies are pinned to the Expo SDK 55 tested set (CI runs `expo install --check`,
  and `react-native-screens` must stay `~4.23.0`); update them with
  `npx expo install <pkg>` from `apps/scanner-app`.

## Things to do by hand

- `next` PRs deploy the three public apps: check the Vercel preview deployments (guest,
  partner, admin) before merging.
- `zod` must be the same release in every package here **and** in the backend repo
  (the contract parity check builds both sides with one zod). Merge the matching backend
  PR in the same week.
- Overrides in the root `package.json` (`pnpm.overrides`) are security floors that
  Renovate does not manage; see `docs/security.md` on the security branch for why each exists.
- A new advisory fails the `Dependency audit` job whether or not Renovate is running.
  Renovate's pull requests help you fix it; they do not replace the audit.

## Testing a change to `renovate.json`

Plain `renovate-config-validator` only checks syntax. It does **not** resolve presets, so
it accepted a preset that does not exist (`:prType(chore)`). To test properly, dry-run
Renovate against the repo with the local platform:

1. The file must be tracked by git (`git add renovate.json`): Renovate lists files with
   git and silently ignores an untracked config.
2. Use Node 24 (current Renovate refuses newer): from the repo root run
   `RENOVATE_PLATFORM=local LOG_LEVEL=debug RENOVATE_FORCE='{"baseBranchPatterns":[]}' npx --yes --engine-strict=false -p node@24 -p renovate@latest -- renovate --platform=local --repository-cache=disabled`
   (the forced `baseBranchPatterns` is only needed locally, where no `staging` branch exists).
3. Look for `Repository has invalid config` or `"result": "config-validation"` (a broken
   config) and for `Dependency: <name>, is disabled` (a disabled package). Update-type
   rules such as the major-version ones are applied after the point where this local mode
   stops, so they cannot be confirmed this way.
