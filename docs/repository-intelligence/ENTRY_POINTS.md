# Entry Points

## Frontend

- Workspace manifests: `package.json`, `pnpm-workspace.yaml`, `turbo.json`
- Applications: `apps/guest-portal`, `apps/partner-dashboard`, `apps/admin-console`, `apps/scanner-app`.
- BFF/API callers under `apps/*/src/app/api` and `apps/*/src/lib/bff`.
- Tests are colocated beside application, route, service, domain, repository, and contract code.

See [ROUTE_INVENTORY](ROUTE_INVENTORY.md) and [API_INVENTORY](API_INVENTORY.md).
