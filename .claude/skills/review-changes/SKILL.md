---
name: review-changes
description: Perform a structured code review using change detection and impact
---

## Review Changes

Use the graph steps below only if an approved Code Review Graph installation is available. Otherwise review the diff and trace affected callers and tests with targeted repository search. Use Change Impact for acceptance scope. Use only the applicable steps.

### Steps

1. Run `detect_changes_tool` to get risk-scored change analysis.
2. Run `get_affected_flows_tool` to find impacted execution paths.
3. For each high-risk function, run `query_graph_tool` with pattern="tests_for" to check test coverage.
4. Run `get_impact_radius_tool` to understand the blast radius.
5. For any untested changes, suggest specific test cases.

### Output Format

Provide findings grouped by risk level (high/medium/low) with:

- What changed and why it matters
- Test coverage status
- Suggested improvements
- Overall merge recommendation

## Token Efficiency Rules

- Start with `get_minimal_context_tool(task="<your task>")` before other graph tools.
- Use `detail_level="minimal"` on all calls. Only escalate to "standard" when minimal is insufficient.
- Target: complete any review/debug/refactor task in ≤5 tool calls and ≤800 total output tokens.
- Read the implementation and its tests before changing code. The graph narrows scope; it does not replace the source.
