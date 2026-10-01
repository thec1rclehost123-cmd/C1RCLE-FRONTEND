#!/usr/bin/env node
/**
 * ─── Roll production back to the last known-good deploy ──────────────────────
 * Runs only when post-deploy smoke tests fail against the live Vercel
 * production URL. Finds the most recent READY production deployment that is
 * NOT the one under test and asks Vercel to promote it back.
 * Mirrors `C1RCLE-BACKEND/scripts/ci/render-rollback.mjs`'s shape for the
 * equivalent Render flow.
 *
 *   VERCEL_TOKEN=... node scripts/ci/vercel-rollback.mjs \
 *     --project prj_xxx [--team team_xxx] [--sha <commit>] [--dry-run]
 *
 * --sha defaults to $GITHUB_SHA and is excluded from the rollback candidates.
 *
 * Exit codes: 0 rollback triggered (or dry run) · 1 could not roll back.
 */

const API = 'https://api.vercel.com';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const has = (name) => process.argv.includes(`--${name}`);

const token = process.env.VERCEL_TOKEN;
const projectId = arg('project', '');
const teamId = arg('team', '');
const badSha = arg('sha', process.env.GITHUB_SHA ?? '');
const dryRun = has('dry-run');

if (!token) {
  console.error('::error::VERCEL_TOKEN is required to roll back.');
  process.exit(1);
}
if (!projectId) {
  console.error('::error::vercel-rollback needs --project.');
  process.exit(1);
}

async function vercel(path, init = {}) {
  const url = new URL(`${API}${path}`);
  if (teamId) url.searchParams.set('teamId', teamId);
  const response = await fetch(url, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: response.ok, status: response.status, body };
}

const listUrl = `/v6/deployments?projectId=${projectId}&target=production&limit=20`;
const deployments = await vercel(listUrl);
if (!deployments.ok) {
  console.error(
    `::error::Vercel API returned ${deployments.status} listing deployments: ${JSON.stringify(deployments.body)}`,
  );
  process.exit(1);
}

// Vercel's deployment-list response has used both `readyState` and `state`
// (and `uid` vs `id`) across API versions — read either so this script
// doesn't silently stop matching after an undocumented field rename.
const stateOf = (d) => d.readyState ?? d.state;
const idOf = (d) => d.uid ?? d.id;

const entries = deployments.body?.deployments ?? [];
const ready = entries.filter((d) => stateOf(d) === 'READY');

console.log('Recent ready production deployments:');
for (const d of ready.slice(0, 6)) {
  const sha = (d.meta?.githubCommitSha ?? '').slice(0, 7);
  console.log(
    `  ${idOf(d)}  ${sha}  rollbackCandidate=${d.isRollbackCandidate ?? 'unknown'}  ${d.url}`,
  );
}

// Prefer a deployment Vercel itself considers a valid rollback target
// (`isRollbackCandidate`); if that field is absent on this API version, fall
// back to "most recent ready deployment that isn't the bad commit".
const notBadSha = (d) => !(d.meta?.githubCommitSha ?? '').startsWith(badSha.slice(0, 7));
const target =
  ready.find((d) => d.isRollbackCandidate === true && notBadSha(d)) ?? ready.find(notBadSha);
if (!target) {
  console.error(
    '::error::No previous ready production deployment found to roll back to. Roll back manually ' +
      'from the Vercel dashboard (Deployments tab -> the last good one -> ... -> Promote to Production).',
  );
  process.exit(1);
}

console.log(
  `Rolling back to deployment ${idOf(target)} (commit ${(target.meta?.githubCommitSha ?? '?').slice(0, 7)})`,
);

if (dryRun) {
  console.log('Dry run — no rollback triggered.');
  process.exit(0);
}

// https://vercel.com/docs/rest-api/reference/endpoints/deployments/create-a-new-rollback
const rollback = await vercel(`/v9/projects/${projectId}/rollback/${idOf(target)}`, {
  method: 'POST',
});

if (!rollback.ok) {
  console.error(
    `::error::Rollback request failed with ${rollback.status}: ${JSON.stringify(rollback.body)}`,
  );
  process.exit(1);
}

console.log(`::notice::Rollback to ${idOf(target)} triggered. Watch the Vercel dashboard for it.`);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import('node:fs');
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `### Rollback triggered\n\nRestored deployment \`${idOf(target)}\` ` +
      `(commit \`${(target.meta?.githubCommitSha ?? '?').slice(0, 7)}\`).\n\n`,
  );
}
