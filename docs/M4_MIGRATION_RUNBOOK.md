# M4 Data and Index Migration Runbook

Status: **planning only**. No production project was accessed or changed. This document records the required gates and sequence; it is not authorization to run a migration.

## Scope and observed storage

M4 adds nullable invitation, response, acceptance, revocation, schedule, tier-eligibility, and suspension fields to promoter assignments in `v2_event_catalog_promoter_assignments`. The Firestore adapter maps absent legacy fields to `null`. Existing `active` and `ended` assignments remain readable. Missing acceptance actor or timestamp must remain missing: a migration must never fabricate consent or convert a legacy assignment into an accepted M4 assignment.

Referral links are stored in `v2_promoter_links`; associated tracking, promoter-code, and vanity-alias records use `v2_promoter_tracking_codes`, `v2_promoter_codes`, and `v2_promoter_vanity_aliases`. M4 adds composite indexes for event plus promoter attribution reads and assignment status plus expiry sweeps in `firestore.indexes.json`. The backend journal transition already has preview, resumable backfill, comparison, guarded cutover, and rollback-to-legacy-read operations, but no supported operator CLI or Admin route for invoking those operations was found in this audit.

## Preconditions

Before any production operation, the release owner must separately authorize it and provide:

1. Approved Promoter agreement wording and immutable version/hash. Until then, do not accept terms or activate a real M4 campaign.
2. A reviewed release artifact and a tested deployment/rollback plan for the exact backend and frontend revisions.
3. A verified Firestore backup/export and restore procedure, retention window, and named operator.
4. An approved production change window, monitoring owner, and stop/rollback authority.
5. A tested, least-privilege operator tool for journal transition operations. Do not invoke private in-process services by ad hoc production scripts.
6. A privacy-reviewed inventory report containing aggregate counts and opaque IDs only; do not export Guest contact data into migration artifacts.

Run the complete dry run in an isolated project first. The current authorized `c1rcle-v2` setup is non-production and is permitted only for the previously scoped test/acceptance work; it does not authorize production changes.

For any connected acceptance API process, set `BACKGROUND_WORKERS_ENABLED=false` and `PAYOUTS_ENABLED=false` at process launch, and leave provider email delivery unconfigured. The worker opt-out suppresses global outbox recovery, assignment expiry, reservation/session cleanup, and analytics refresh while preserving API routes; `InProcessEventBus` dispatches only the event just appended, leaving unrelated outbox backlog untouched. This is a scoped test-process setting, not a production rollout recommendation. Verify the setting in the running process before using the API. Use emulator-backed tests for any scenario that requires global workers or scheduled expiry.

## Preflight and dry run

1. Record project ID, deployed revisions, Firestore index state, journal transition state, and current read model. Independently verify the project is the intended non-production target during rehearsal and the explicitly approved target during any later production change.
2. Back up the target dataset using the approved procedure; verify the export can be read and that restore ownership and timing are known.
3. Inventory assignment documents by status and field-presence pattern. Report counts for legacy records missing M4 fields, invited/accepted/rejected/revoked/expired/suspended records, and legacy active/ended records. Do not infer historical acceptance from active status.
4. Inventory link and code records for duplicate IDs/codes, missing parent assignments, cross-event references, and orphaned aliases. Produce an exception list of opaque document IDs; quarantine decisions require an owner and must not be auto-corrected.
5. Validate Firestore query indexes with the repository checker, then run both the event plus promoter attribution query and the status plus expiry query against the Firestore Emulator. Deploy required indexes before application code only after separate release approval; wait for index readiness and query health.
6. For any journal backfill, run preview batches and retain aggregate counts/totals, projected deterministic journal IDs, existing-journal repairs, and exceptions. Do not write during preview. Require finance review of the calculated legacy payable totals and treatment of paid-out rows, payout reservations/completions, reversals, and already represented journals.
7. Establish a baseline for legacy balances and M4 query/API error rates. The rehearsal must demonstrate repeatable preview, interrupted/resumed backfill, discrepancy reporting, and guarded cutover using disposable data.

## Controlled sequence

1. Freeze unrelated schema changes and stop any campaign or finance operation that would make the preflight comparison ambiguous.
2. Deploy the approved Firestore index definitions and wait for readiness. Confirm the old application still works against the expanded index set.
3. Deploy the backward-compatible backend. Verify legacy assignment reads map absent optional fields to `null`; verify no record was changed solely to populate synthetic history.
4. Keep campaign acceptance/activation gated until the approved agreement is installed and its version/hash is verified. Do not enable real Promoter acceptance with a fixture agreement.
5. If journal backfill is separately approved, invoke the reviewed operator tool in bounded organization batches. Persist and verify the checkpoint after each batch. Repeating a completed batch must not create duplicate journals. Keep the read model on `legacy_ledger_v1` throughout backfill.
6. Run the full comparison. Cut over only when every organization reconciles, discrepancy count is zero, required finance sign-off is recorded, and the observation window criteria are met. Cutover is a separate explicit action.
7. Deploy frontend surfaces only after backend contracts, authorization, and indexes are healthy. Monitor assignment transitions, attribution queries, checkout, journal balance comparisons, and outbox delivery.

## Stop and recovery criteria

Stop the operation on any unknown project identity, backup/restore failure, unexpected legacy assignment interpretation, duplicate or orphaned link/code, non-zero finance discrepancy, incomplete backfill, authorization error, elevated query failures, or unexpected payment/payout activity.

For journal-read issues, use the supported guarded rollback to `legacy_ledger_v1` after recording the incident and reconciling any writes made since cutover. Read-model rollback does not delete append-only journals or reverse financial activity. Never delete journals or reconstruct balances manually as a rollback shortcut. Any financial correction requires the existing approved dual-control adjustment workflow and independent reconciliation.

For an assignment/link data issue, stop new assignment or link mutations, preserve the backup and exception report, and use a separately reviewed repair plan with compare-and-set/version checks. Do not blanket-rewrite legacy assignments or fabricate acceptance evidence.

## Completion evidence

The change record must include the approved target and release IDs, backup verification, index readiness, aggregate before/after inventory, dry-run and resumed-batch results, journal comparison and finance sign-off (if applicable), smoke checks, monitoring window, exceptions, and rollback decision. Until those artifacts exist and the authorized operation is actually completed, M4 migration status remains **planned/unexecuted**.
