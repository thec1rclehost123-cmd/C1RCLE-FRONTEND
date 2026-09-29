<!-- code-review-graph MCP tools -->

## MCP Tools: code-review-graph

**This project has a knowledge graph. Start with the code-review-graph
MCP tools to narrow scope, then read the source.** The graph is cheaper than scanning files and
gives you structural context (callers, dependents, test coverage) that file search cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

### Verify in the source

- Narrow scope with the graph, then read the source. Do not change code from graph output alone.
- For any non-trivial change, read the implementation and the relevant tests before concluding.
- Verify the exact source when touching behavior, database logic, migrations, retries, fallbacks,
  recovery, or compatibility code.
- When the graph and the source disagree, the source wins. The graph may be stale or may not
  model that relationship.
- An empty graph result can mean "not indexed" or "not statically visible", not "does not exist".

### Key Tools

| Tool                             | Use when                                               |
| -------------------------------- | ------------------------------------------------------ |
| `detect_changes_tool`            | Reviewing code changes — gives risk-scored analysis    |
| `get_review_context_tool`        | Need source snippets for review — token-efficient      |
| `get_impact_radius_tool`         | Understanding blast radius of a change                 |
| `get_affected_flows_tool`        | Finding which execution paths are impacted             |
| `query_graph_tool`               | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool`     | Finding functions/classes by name or keyword           |
| `get_architecture_overview_tool` | Understanding high-level codebase structure            |
| `refactor_tool`                  | Planning renames, finding dead code                    |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.

<!-- /code-review-graph MCP tools -->

## Dependency & local-env rules (learned the hard way)

### Expo native deps are pinned by the SDK — don't drift them

- **`apps/scanner-app` is the only Expo app.** Its native deps must stay inside
  the Expo SDK 55 tested set. CI enforces this with
  `npx expo install --check` (gate step `Expo deps` in `.github/workflows/ci.yml`).
- **`react-native-screens` must stay `~4.23.0`.** Escalating it to a newer 4.x
  breaks the RN 0.83 codegen on CI: `SearchBarNativeComponent.ts: The first
argument of method blur must be of type React.ElementRef<>`. Do not bump it.
- **Fix ANY native dep drift with `npx expo install <pkg>`** (picks the
  SDK-matched version), never a manual version bump in `package.json`. Check
  drift reporting with `npx expo install --check` from `apps/scanner-app`.

### Windows-local `expo export` codegen failure is environmental

- On Windows + pnpm, `expo export` can fail with
  `Unknown prop type for "type": "undefined"` in `react-native-screens`'s
  `src/fabric/*NativeComponent.ts` files. Cause: RN's codegen babel plugin
  can't resolve `CodegenTypes` prop types through the `.pnpm` store's
  backslash paths. This is NOT a screens bug and NOT a reason to bump the
  dependency — **the same build passes on Ubuntu CI** (verify there before
  touching the version).

### Lockfile drift

- CI installs with `pnpm install --frozen-lockfile` (`.github/actions/setup`),
  so any `package.json`/`pnpm-lock.yaml` mismatch fails the PR. After ANY
  `pnpm install`/`pnpm add`/expo install, re-add the lockfile explicitly:
  `git add pnpm-lock.yaml` (it's easy to miss after merge conflicts).
- `pnpm-lock.yaml` merge conflicts: resolve with `git checkout --theirs`,
  then `pnpm install` to reconcile, then re-add + verify no version drift
  slipped in (e.g. `react-native-svg` resolved to an unexpected patch).
