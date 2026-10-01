#!/usr/bin/env node
/**
 * ─── Wait for Vercel to finish deploying THIS commit ──────────────────────────
 * Vercel's own Git integration deploys on push, out of band from GitHub
 * Actions — the same relationship the backend has with Render (see
 * `C1RCLE-BACKEND/scripts/ci/wait-for-deploy.mjs`, which this mirrors).
 * Smoke-testing immediately after a push would hit the PREVIOUS build and
 * pass, which is worse than not testing at all.
 *
 * Polls the Vercel API for the project's most recent `production` deployment
 * until one whose `meta.githubCommitSha` matches the SHA under test reaches
 * `READY` (or a terminal error state, which fails fast rather than waiting
 * out the full timeout).
 *
 *   VERCEL_TOKEN=... node scripts/ci/wait-for-vercel-deploy.mjs \
 *     --project prj_xxx --sha $GITHUB_SHA \
 *     [--team team_xxx] [--timeout 900] [--interval 15]
 *
 * Exit codes: 0 deployed and ready · 1 timed out or the deploy errored.
 */

const args = process.argv;
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const token = process.env.VERCEL_TOKEN;
const projectId = arg('project', '');
const teamId = arg('team', '');
const targetSha = arg('sha', '');
const timeoutSec = Number(arg('timeout', '900'));
const intervalSec = Number(arg('interval', '15'));

if (!token) {
  console.error('::error::wait-for-vercel-deploy needs VERCEL_TOKEN in the environment.');
  process.exit(1);
}
if (!projectId || !targetSha) {
  console.error('::error::wait-for-vercel-deploy needs --project and --sha.');
  process.exit(1);
}

const short = (sha) => sha.slice(0, 7);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function listDeployments() {
  const url = new URL('https://api.vercel.com/v6/deployments');
  url.searchParams.set('projectId', projectId);
  url.searchParams.set('target', 'production');
  url.searchParams.set('limit', '10');
  if (teamId) url.searchParams.set('teamId', teamId);

  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Vercel API returned ${response.status}: ${await response.text()}`);
  }
  const body = await response.json();
  return body.deployments ?? [];
}

// Vercel's deployment-list response has used both `readyState` and `state`
// (and `uid` vs `id`) across API versions — read either so this script
// doesn't silently stop matching after an undocumented field rename.
const stateOf = (d) => d.readyState ?? d.state;
const idOf = (d) => d.uid ?? d.id;

console.log(`Waiting for commit ${short(targetSha)} to deploy on Vercel (timeout ${timeoutSec}s)`);

const startedAt = Date.now();
let attempt = 0;

while ((Date.now() - startedAt) / 1000 < timeoutSec) {
  attempt += 1;
  const elapsed = Math.round((Date.now() - startedAt) / 1000);

  let deployments;
  try {
    deployments = await listDeployments();
  } catch (error) {
    console.log(`[${elapsed}s] ${error.message} — retrying`);
    await sleep(intervalSec * 1000);
    continue;
  }

  const match = deployments.find(
    (d) => d.meta?.githubCommitSha && d.meta.githubCommitSha.startsWith(targetSha.slice(0, 7)),
  );

  if (!match) {
    console.log(`[${elapsed}s] no deployment for ${short(targetSha)} yet — waiting`);
  } else if (stateOf(match) === 'READY') {
    console.log(`Deployed: ${idOf(match)} (${match.url}) ready after ${elapsed}s`);
    console.log(`::notice::deployment_id=${idOf(match)}`);
    if (process.env.GITHUB_OUTPUT) {
      const { appendFileSync } = await import('node:fs');
      appendFileSync(process.env.GITHUB_OUTPUT, `deployment_id=${idOf(match)}\n`);
      appendFileSync(process.env.GITHUB_OUTPUT, `deployment_url=https://${match.url}\n`);
    }
    process.exit(0);
  } else if (stateOf(match) === 'ERROR' || stateOf(match) === 'CANCELED') {
    console.error(
      `::error::Vercel deployment for ${short(targetSha)} ended in state ${stateOf(match)} — the build itself failed, nothing to smoke test.`,
    );
    process.exit(1);
  } else {
    console.log(`[${elapsed}s] deployment ${idOf(match)} is ${stateOf(match)} — waiting`);
  }

  await sleep(intervalSec * 1000);
}

console.error(
  `::error::Timed out after ${timeoutSec}s waiting for commit ${short(targetSha)} to deploy on Vercel (${attempt} polls). Check the Vercel dashboard for a stuck or failed build.`,
);
process.exit(1);
