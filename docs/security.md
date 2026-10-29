# Dependency security

`pnpm audit --audit-level=high` runs on every pull request (the `Dependency audit` job in
`.github/workflows/ci.yml`) and is part of the required `CI OK` check. A newly published
advisory can therefore turn the job red for every PR until the dependency is bumped. That
is deliberate: before this job existed the repo shipped Next.js 16.3.0 with five critical
advisories (remote code execution in the image optimisation API, `next/og` and `use cache`)
and nothing noticed.

## When the audit goes red

1. Run `pnpm audit` and read which package and which paths are affected.
2. A direct dependency: bump the exact pin (this repo saves exact versions).
3. A transitive dependency: add an override in the root `package.json` under
   `pnpm.overrides`, then run `pnpm install --no-frozen-lockfile` and commit the lockfile.
   Prefer a floor (`>=x.y.z`) so a newer patched release needs no edit; use an exact pin
   only when a floor would cross a major that breaks consumers (see `uuid` below).
4. Prefer a release at least two weeks old unless it is the only patched one.
5. Run `pnpm check`, with each app's `.env.example` copied to `.env.local` as CI does.

## Overrides and why they exist

| Override                                      | Why                                                                                                             |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `@grpc/grpc-js >=1.14.5`                      | getAuthContext can return unauthorized certificates (GHSA-m9gg-hp2v-232j); reached through firebase             |
| `brace-expansion@<2` 1.1.21, `@>=2 <6` 5.0.12 | Quadratic-time and recursion denial of service; reached through eslint and typescript-eslint                    |
| `js-yaml >=4.3.2`                             | CPU exhaustion via empty merge sources; reached through eslint                                                  |
| `nanoid@^3 3.3.18`                            | Infinite loop when the size is zero; reached through next and postcss                                           |
| `postcss-selector-parser@^6 >=6.1.5 <7`       | Quadratic selector parsing; reached through tailwindcss; kept below 7                                           |
| `re2js >=2.8.7`                               | Denial of service; reached through firebase firestore                                                           |
| `source-map-js >=1.2.2`                       | Event-loop denial of service via indexed source maps; reached through tailwind and postcss                      |
| `undici@^7 >=7.30.1 <8`                       | Several denial-of-service and TLS-validation advisories; reached through jsdom (tests)                          |
| `uuid@<11 11.1.1`                             | Missing buffer bounds check; reached through the Expo `xcode` tooling. Pinned exactly: uuid 12 dropped CommonJS |
| `vite@>=8.2.0 <8.3.0 8.2.4`                   | launch-editor command injection and file-serving bypasses in the dev server; reached through vitest             |
| `lucide-react 1.28.0`                         | Unrelated to security: pins one icon library version                                                            |

`zod`, `next` and `vitest` are direct dependencies and are pinned exactly in the packages
that use them (zod 4.6.7, next 16.4.2, vitest 4.1.12).

## Accepted exceptions

Both are in `pnpm.auditConfig.ignoreGhsas`. Both are reached only through
`expo > @expo/cli`, which is the scanner app's build tooling, not code that ships to a device
or a server, and neither has a fix available.

| Advisory            | Package            | Why it is accepted                                                                                                                                                                                                                                                                                   |
| ------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GHSA-86w9-cpqp-85rv | `node-forge` 1.4.0 | The advisory lists no patched version. Used by Expo's CLI for local dev certificates                                                                                                                                                                                                                 |
| GHSA-mrhx-c7xc-m3w5 | `zod` 3.25.76      | The patched releases are 4.6.6 and later; `@expo/cli` needs the 3.x API and cannot move to 4. Every `zod` 4 copy in the repo is 4.6.7. The ignore is by advisory id, so it would also hide this same advisory if a 4.x copy regressed below 4.6.6: re-check with `pnpm why zod` after any zod change |

Review both when Expo is next upgraded; remove an entry as soon as the audit passes
without it (`pnpm audit --audit-level=high` with the entry deleted).

## Known leftovers below the threshold

| Advisory                                          | Severity | Why it stays                                                                                                                                                                                 |
| ------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GHSA-vcc3-ghjq-m6fr, `decode-uri-component` 0.2.2 | moderate | Reached through `expo-router > query-string`. The fixed 0.5.0 is ESM-only while `query-string` 7 is CommonJS, so forcing it risks breaking the scanner app, which has no tests to catch that |
| GHSA-gcqx-w48m-w2h4, `deepmerge` 4.3.1            | low      | No patched version exists; reached through jest                                                                                                                                              |
