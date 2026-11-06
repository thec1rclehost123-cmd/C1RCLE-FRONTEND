import test from 'node:test';
import assert from 'node:assert/strict';

import { readBackendPair, resolveBackendRef } from './resolve-backend-ref.mjs';

const repository = 'thec1rclehost123-cmd/C1RCLE-BACKEND';
const bodyWithPair = `Paired candidate.\n<!-- backend-contract-pair: ${repository}#163 -->`;
const fetchOpen = async () => ({
  state: 'open',
  merged: false,
  head: { sha: 'a'.repeat(40) },
  base: { ref: 'staging', repo: { full_name: repository } },
});

test('reads a single explicit backend pair', () => {
  assert.deepEqual(readBackendPair(bodyWithPair), { repository, number: 163 });
  assert.equal(readBackendPair('No paired PR'), null);
});

test('uses the exact open paired PR head SHA', async () => {
  const resolved = await resolveBackendRef({
    eventName: 'pull_request',
    repositoryVariable: '',
    defaultRepository: repository,
    baseRef: 'staging',
    pullRequestBody: bodyWithPair,
    fetchPullRequest: fetchOpen,
  });
  assert.deepEqual(resolved, {
    repository,
    ref: 'a'.repeat(40),
    source: 'paired-pr-163-head',
  });
});

test('uses the target branch after the paired backend PR merges', async () => {
  const resolved = await resolveBackendRef({
    eventName: 'pull_request',
    repositoryVariable: '',
    defaultRepository: repository,
    baseRef: 'staging',
    pullRequestBody: bodyWithPair,
    fetchPullRequest: async () => ({
      state: 'closed',
      merged: true,
      base: { ref: 'staging', repo: { full_name: repository } },
    }),
  });
  assert.deepEqual(resolved, { repository, ref: 'staging', source: 'merged-pr-163-target' });
});

test('falls back to the frontend target branch when no pair is declared', async () => {
  const resolved = await resolveBackendRef({
    eventName: 'pull_request',
    repositoryVariable: '',
    defaultRepository: repository,
    baseRef: 'staging',
    pullRequestBody: 'No pair',
    fetchPullRequest: async () => assert.fail('must not request GitHub without a pair'),
  });
  assert.deepEqual(resolved, { repository, ref: 'staging', source: 'target-base-fallback' });
});

test('fails closed for malformed, duplicate, wrong-base, wrong-repository, and closed-unmerged pairs', async () => {
  assert.throws(() => readBackendPair('backend-contract-pair: 163'), /malformed/);
  assert.throws(() => readBackendPair(`${bodyWithPair}\n${bodyWithPair}`), /multiple/);

  const resolve = (fetchPullRequest) =>
    resolveBackendRef({
      eventName: 'pull_request',
      repositoryVariable: '',
      defaultRepository: repository,
      baseRef: 'staging',
      pullRequestBody: bodyWithPair,
      fetchPullRequest,
    });

  await assert.rejects(
    resolve(async () => ({
      ...(await fetchOpen()),
      base: { ref: 'main', repo: { full_name: repository } },
    })),
    /targets main, expected staging/,
  );
  await assert.rejects(
    resolve(async () => ({
      ...(await fetchOpen()),
      base: { ref: 'staging', repo: { full_name: 'someone/else' } },
    })),
    /different repository/,
  );
  await assert.rejects(
    resolve(async () => ({
      state: 'closed',
      merged: false,
      base: { ref: 'staging', repo: { full_name: repository } },
    })),
    /closed without being merged/,
  );
  await assert.rejects(
    resolve(async () => ({
      state: 'open',
      merged: false,
      head: { sha: 'short' },
      base: { ref: 'staging', repo: { full_name: repository } },
    })),
    /no valid head SHA/,
  );
});

test('workflow dispatch uses its explicitly requested backend ref', async () => {
  const resolved = await resolveBackendRef({
    eventName: 'workflow_dispatch',
    dispatchRef: 'staging',
    repositoryVariable: '',
    defaultRepository: repository,
    fetchPullRequest: async () => assert.fail('dispatch must not request a PR'),
  });
  assert.deepEqual(resolved, { repository, ref: 'staging', source: 'workflow-dispatch' });
});
