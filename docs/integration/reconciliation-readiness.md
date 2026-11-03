# Reconciliation branch integration boundary

The matching frontend and backend reconciliation branches must be reviewed as a pair. Update the backend contracts and API before deploying the corresponding frontend editor and event-media readers. Exact commit pairs and CI evidence belong in the external integration manifest for each verification run.

## Disabled and deferred behavior

- The studio-wide Door prototype uses fixtures and stays disabled through `partnerPreviewFeatures.studioDoor`. Event-specific Door routes continue to use the connected scanner.
- External Venue approval stays disabled through `partnerPreviewFeatures.externalVenueApproval` until an authorized, persisted admin-review workflow exists. Its draft infrastructure is retained for later development.
- Public guest names and photos require a consent contract; the editor keeps this unavailable. Tables remain coming soon.
- Missing Privacy and Terms bodies require approved legal content. Do not invent policy.
- Guest RSVP, payment, ticket delivery, scanning and reconciliation still require the remaining connected acceptance. Unit tests and builds do not prove those workflows.

## Runtime prerequisites

The backend index configuration includes the promoter-assignment expiry query and social notification queries. Missing deployed indexes must be deployed under separate authorization before claiming connected workers or notifications are verified. Emulator execution verifies query behavior, not production composite-index enforcement.

Historical Venue latency experiments were not accompanied by an authoritative six-file manifest. Current calendar and booking changes are integrated on their functional test evidence; this is not a latency-performance acceptance claim. Original changes remain preserved in the external pre-integration snapshot.
