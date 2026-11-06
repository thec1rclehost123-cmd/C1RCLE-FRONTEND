import { appendFile, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const PAIR_MARKER =
  /<!--\s*backend-contract-pair:\s*([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)#(\d+)\s*-->/gi;

export function readBackendPair(body) {
  const matches = [...String(body ?? '').matchAll(PAIR_MARKER)];
  if (matches.length > 1) throw new Error('Frontend PR declares multiple backend contract pairs.');
  if (matches.length === 0) {
    if (/backend-contract-pair/i.test(String(body ?? ''))) {
      throw new Error('Frontend PR backend contract pair marker is malformed.');
    }
    return null;
  }

  return { repository: matches[0][1], number: Number(matches[0][2]) };
}

export async function resolveBackendRef({
  eventName,
  dispatchRef,
  repositoryVariable,
  defaultRepository,
  baseRef,
  pullRequestBody,
  fetchPullRequest,
}) {
  const repository = repositoryVariable || defaultRepository;
  if (eventName === 'workflow_dispatch') {
    const ref = dispatchRef || repositoryVariable;
    if (!ref) throw new Error('workflow_dispatch requires a backend ref.');
    return { repository, ref, source: 'workflow-dispatch' };
  }

  if (eventName !== 'pull_request') {
    throw new Error(`Unsupported contract parity event: ${eventName}`);
  }

  const pair = readBackendPair(pullRequestBody);
  if (!pair) return { repository, ref: baseRef, source: 'target-base-fallback' };
  if (pair.repository.toLowerCase() !== repository.toLowerCase()) {
    throw new Error(`Declared backend pair must target ${repository}.`);
  }

  const pairedPr = await fetchPullRequest(repository, pair.number);
  if (pairedPr.base?.repo?.full_name?.toLowerCase() !== repository.toLowerCase()) {
    throw new Error('Declared backend contract PR belongs to a different repository.');
  }
  if (pairedPr.base?.ref !== baseRef) {
    throw new Error(
      `Backend PR #${pair.number} targets ${pairedPr.base?.ref}, expected ${baseRef}.`,
    );
  }

  if (pairedPr.state === 'open' && pairedPr.merged !== true) {
    if (!/^[a-f0-9]{40}$/i.test(pairedPr.head?.sha ?? '')) {
      throw new Error(`Backend PR #${pair.number} has no valid head SHA.`);
    }
    return {
      repository,
      ref: pairedPr.head.sha,
      source: `paired-pr-${pair.number}-head`,
    };
  }

  if (pairedPr.state === 'closed' && pairedPr.merged === true) {
    return { repository, ref: baseRef, source: `merged-pr-${pair.number}-target` };
  }

  throw new Error(`Backend PR #${pair.number} is closed without being merged.`);
}

async function main() {
  const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const repositoryVariable = process.env.BACKEND_REPO || '';
  const defaultRepository = 'thec1rclehost123-cmd/C1RCLE-BACKEND';
  const apiToken = process.env.BACKEND_REPO_TOKEN;
  const result = await resolveBackendRef({
    eventName: process.env.GITHUB_EVENT_NAME,
    dispatchRef: process.env.BACKEND_REF_INPUT,
    repositoryVariable,
    defaultRepository,
    baseRef: event.pull_request?.base?.ref ?? '',
    pullRequestBody: event.pull_request?.body ?? '',
    fetchPullRequest: async (repository, number) => {
      if (!apiToken)
        throw new Error('BACKEND_REPO_TOKEN is required to resolve a paired private backend PR.');
      const response = await fetch(`https://api.github.com/repos/${repository}/pulls/${number}`, {
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${apiToken}`,
          'x-github-api-version': '2022-11-28',
        },
      });
      if (!response.ok)
        throw new Error(`Could not read paired backend PR #${number} (HTTP ${response.status}).`);
      return response.json();
    },
  });

  if (!result.ref) throw new Error('Could not resolve a backend contract ref.');
  await appendFile(
    process.env.GITHUB_OUTPUT,
    `backend_ref=${result.ref}\nsource=${result.source}\n`,
  );
  console.log(`Backend contract source: ${result.source}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(
      error instanceof Error ? error.message : 'Backend contract ref resolution failed.',
    );
    process.exitCode = 1;
  });
}
