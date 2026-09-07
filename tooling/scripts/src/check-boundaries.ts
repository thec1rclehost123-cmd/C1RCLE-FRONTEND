/* eslint-disable no-console -- this script's entire purpose is to report to a terminal. */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { argv, cwd, exit } from 'node:process';

/**
 * Architectural boundary checker.
 *
 * ESLint enforces these rules while you type. This script enforces them over
 * the whole repository at once, independently of the lint toolchain, so a
 * disabled rule, a skipped file or an unlinted directory cannot smuggle a
 * violation past CI.
 *
 * Run: `pnpm boundaries`
 */

/**
 * Resolves the repository root by walking up to `pnpm-workspace.yaml`, so the
 * checker behaves identically whether it is run from the root, from a package
 * directory, or by a git hook with an arbitrary working directory.
 */
function findRepoRoot(start: string): string {
  let dir = start;

  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }

    const parent = dirname(dir);

    if (parent === dir) {
      throw new Error('Could not locate the repository root (no pnpm-workspace.yaml found).');
    }

    dir = parent;
  }
}

const ROOT = findRepoRoot(cwd());
const WORKSPACE_SCOPE = '@c1rcle';
const APP_PREFIX = `${WORKSPACE_SCOPE}/app-`;

interface Violation {
  readonly rule: string;
  readonly file: string;
  readonly detail: string;
}

interface WorkspaceMember {
  readonly name: string;
  readonly dir: string;
  readonly kind: 'app' | 'package' | 'tooling';
  readonly dependencies: readonly string[];
}

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.next',
  '.turbo',
  '.git',
  'coverage',
  'out',
  'build',
  'playwright-report',
  'test-results',
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) {
      continue;
    }

    const full = join(dir, entry);

    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (/\.(?:ts|tsx)$/.test(entry) && !entry.endsWith('.d.ts')) {
      out.push(full);
    }
  }

  return out;
}

function readWorkspace(): WorkspaceMember[] {
  const members: WorkspaceMember[] = [];

  for (const group of ['apps', 'packages', 'tooling'] as const) {
    let entries: string[];

    try {
      entries = readdirSync(join(ROOT, group));
    } catch {
      continue;
    }

    for (const entry of entries) {
      const dir = join(ROOT, group, entry);
      let manifest: { name?: string; dependencies?: Record<string, string> };

      try {
        manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as typeof manifest;
      } catch {
        continue;
      }

      if (manifest.name === undefined) {
        continue;
      }

      members.push({
        name: manifest.name,
        dir,
        kind: group === 'apps' ? 'app' : group === 'packages' ? 'package' : 'tooling',
        dependencies: Object.keys(manifest.dependencies ?? {}).filter((d) =>
          d.startsWith(`${WORKSPACE_SCOPE}/`),
        ),
      });
    }
  }

  return members;
}

const IMPORT_PATTERN = /(?:from|import)\s+['"]([^'"]+)['"]/g;

function importsOf(file: string): string[] {
  const source = readFileSync(file, 'utf8');
  const specifiers: string[] = [];

  for (const match of source.matchAll(IMPORT_PATTERN)) {
    const specifier = match[1];
    if (specifier !== undefined) {
      specifiers.push(specifier);
    }
  }

  return specifiers;
}

/** Rule 1 — nothing may import an application. Applications are leaves. */
function checkNoAppImports(members: readonly WorkspaceMember[]): Violation[] {
  const violations: Violation[] = [];

  for (const member of members) {
    for (const file of walk(member.dir)) {
      for (const specifier of importsOf(file)) {
        if (specifier.startsWith(APP_PREFIX)) {
          violations.push({
            rule: 'no-app-imports',
            file: relative(ROOT, file),
            detail: `imports "${specifier}". Applications are leaves — move the shared code into packages/.`,
          });
        }
      }
    }
  }

  return violations;
}

/** Rule 2 — a package may never depend on an application. */
function checkPackagesDoNotDependOnApps(members: readonly WorkspaceMember[]): Violation[] {
  return members
    .filter((m) => m.kind === 'package')
    .flatMap((m) =>
      m.dependencies
        .filter((d) => d.startsWith(APP_PREFIX))
        .map((d) => ({
          rule: 'package-depends-on-app',
          file: relative(ROOT, join(m.dir, 'package.json')),
          detail: `package "${m.name}" declares a dependency on application "${d}".`,
        })),
    );
}

/** Rule 3 — a package's public API is its exports map. No deep imports. */
function checkNoDeepImports(members: readonly WorkspaceMember[]): Violation[] {
  const violations: Violation[] = [];
  const deep = new RegExp(`^${WORKSPACE_SCOPE}/[^/]+/(?:src|dist)/`);

  for (const member of members) {
    for (const file of walk(member.dir)) {
      for (const specifier of importsOf(file)) {
        if (deep.test(specifier)) {
          violations.push({
            rule: 'no-deep-imports',
            file: relative(ROOT, file),
            detail: `imports "${specifier}". Import the package root; its exports map is the public API.`,
          });
        }
      }
    }
  }

  return violations;
}

/** Rule 4 — no cycles in the workspace dependency graph. */
function checkNoCycles(members: readonly WorkspaceMember[]): Violation[] {
  const graph = new Map(members.map((m) => [m.name, m.dependencies]));
  const violations: Violation[] = [];
  const state = new Map<string, 'visiting' | 'done'>();

  function visit(name: string, path: readonly string[]): void {
    if (state.get(name) === 'done') {
      return;
    }

    if (state.get(name) === 'visiting') {
      violations.push({
        rule: 'no-cycles',
        file: 'workspace dependency graph',
        detail: `cycle: ${[...path, name].join(' → ')}`,
      });
      return;
    }

    state.set(name, 'visiting');

    for (const dependency of graph.get(name) ?? []) {
      if (graph.has(dependency)) {
        visit(dependency, [...path, name]);
      }
    }

    state.set(name, 'done');
  }

  for (const member of members) {
    visit(member.name, []);
  }

  return violations;
}

/** Rule 5 — the network and the environment have exactly one owner each. */
function checkSingleOwners(members: readonly WorkspaceMember[]): Violation[] {
  const violations: Violation[] = [];
  const NETWORK_OWNER = `${WORKSPACE_SCOPE}/api-client`;
  const ENV_OWNER = `${WORKSPACE_SCOPE}/config`;

  const rawFetch = /(?<![.\w])fetch\s*\(/;

  /*
   * The auth BFF proxy is the one sanctioned exception to the network-owner
   * rule (frontend architecture README: `app/api` routes are allowed as
   * approved BFFs). It must read the raw `Set-Cookie` header off the gateway
   * response to re-scope the session cookie to the frontend origin — which
   * `@c1rcle/api-client` (parsed JSON only) cannot do. Confined to this one
   * module; the `single-env-owner` rule still applies to it.
   */
  const BFF_NETWORK_EXCEPTION = /(?:^|[/\\])src[/\\]lib[/\\]bff[/\\]/;

  /*
   * The lint config package contains the *text* of these rules — the strings
   * "fetch(" and "process.env" appear inside the messages that forbid them.
   * Scanning it would flag the enforcement mechanism itself.
   */
  const RULE_AUTHORING_PACKAGES = new Set([`${WORKSPACE_SCOPE}/eslint-config`]);

  for (const member of members) {
    if (member.kind === 'tooling' || RULE_AUTHORING_PACKAGES.has(member.name)) {
      continue;
    }

    for (const file of walk(member.dir)) {
      const rel = relative(ROOT, file);

      /* Test files and build tooling run in Node, outside the shipped bundle. */
      if (/\.test\.tsx?$/.test(rel) || /(?:^|\/)(?:e2e|.*\.config)\b/.test(rel)) {
        continue;
      }

      const source = readFileSync(file, 'utf8');

      if (
        member.name !== NETWORK_OWNER &&
        rawFetch.test(source) &&
        !BFF_NETWORK_EXCEPTION.test(rel)
      ) {
        violations.push({
          rule: 'single-network-owner',
          file: rel,
          detail: `calls fetch() directly. All backend calls go through ${NETWORK_OWNER}.`,
        });
      }

      if (member.name !== ENV_OWNER && source.includes('process.env')) {
        violations.push({
          rule: 'single-env-owner',
          file: rel,
          detail: `reads process.env directly. Import the validated environment from ${ENV_OWNER}.`,
        });
      }
    }
  }

  return violations;
}

/** Rule 6 — this repository is frontend-only. */
function checkNoBackendDependencies(members: readonly WorkspaceMember[]): Violation[] {
  const FORBIDDEN = [
    'firebase',
    'firebase-admin',
    'pg',
    'mysql',
    'mysql2',
    'mongodb',
    'mongoose',
    '@prisma/client',
    'drizzle-orm',
    'express',
    'fastify',
    'nestjs',
    '@nestjs/core',
    'aws-sdk',
    '@aws-sdk/client-s3',
  ];

  return members.flatMap((member) => {
    const manifest = JSON.parse(readFileSync(join(member.dir, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
    };

    return Object.keys(manifest.dependencies ?? {})
      .filter((d) => FORBIDDEN.includes(d))
      .map((d) => ({
        rule: 'frontend-only',
        file: relative(ROOT, join(member.dir, 'package.json')),
        detail: `depends on "${d}". This repository ships to browsers — backend SDKs and database clients belong in the backend repository.`,
      }));
  });
}

function main(): void {
  const members = readWorkspace();
  const verbose = argv.includes('--verbose');

  if (verbose) {
    console.log(`Checking ${String(members.length)} workspace members…\n`);
  }

  const violations = [
    ...checkNoAppImports(members),
    ...checkPackagesDoNotDependOnApps(members),
    ...checkNoDeepImports(members),
    ...checkNoCycles(members),
    ...checkSingleOwners(members),
    ...checkNoBackendDependencies(members),
  ];

  if (violations.length === 0) {
    console.log(
      `✓ No architectural violations across ${String(members.length)} workspace members.`,
    );
    return;
  }

  console.error(`\n✖ ${String(violations.length)} architectural violation(s):\n`);

  const byRule = new Map<string, Violation[]>();
  for (const violation of violations) {
    byRule.set(violation.rule, [...(byRule.get(violation.rule) ?? []), violation]);
  }

  for (const [rule, group] of byRule) {
    console.error(`  ${rule}`);
    for (const violation of group) {
      console.error(`    ${violation.file}\n      ${violation.detail}`);
    }
    console.error('');
  }

  exit(1);
}

main();
