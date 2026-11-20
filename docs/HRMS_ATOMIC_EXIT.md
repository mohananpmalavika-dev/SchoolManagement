# Atomic staff exit completion

Department reviews and settlement preparation feed one **Complete staff exit** action in **HR & Payroll → Exit & clearances**. Preparation records reviewed amounts and a snapshot of the approved exit date, employee/account links and all four signed clearances. A different manager completes the case on or after the approved exit date.

Every preparation has a new `preparationId` inside its stored snapshot. The completion form shows the employee, exit date and financial amounts and submits the identifier of that exact preparation. Re-preparation while a form is open makes that form stale, even when the amounts happen to be identical; completion is rejected until the current preparation is reviewed. Completion takes the school transaction lock, revalidates current evidence and commits all of these changes in one PostgreSQL transaction:

1. Lock the distinct **LIBRARY**, **ACCOUNTS**, **ASSETS_IT** and **PRINCIPAL** clearances, each independently reviewed with zero dues.
2. Finalize the prepared settlement and record its approver and settlement date.
3. Create one relieving letter linked uniquely to both the resignation and settlement.
4. Mark the HR employee resigned and school staff terminated with the approved exit date.
5. Disable the linked school login, increment its token version and delete its school push subscriptions.
6. Complete the resignation with reviewer, completion time and revoked-account/version metadata; write settlement, letter and exit audit records.

Every employee, staff, account, settlement and resignation update must affect exactly one expected row; all four clearance locks must succeed. A missing, reassigned or ambiguous identity, changed clearance, modified amount, duplicate reference, failed update or late audit failure aborts the complete operation. No letter, finalized settlement, locked clearance, employment change or revocation from that attempt is retained. Simultaneous requests produce one completion and one conflict. Repeated completion requests are rejected without incrementing the token version again.

The manager who prepared the amounts cannot approve them or complete their own exit. Current clearance reviewers must match their audit evidence. Completed cases are immutable through preparation and clearance endpoints. Any new clearance review invalidates a prepared settlement and requires preparation again. Pending leave and approved leave extending beyond exit must be resolved. A final-month draft payslip must be approved or discarded. If final-month salary already appears in payroll, settlement earned salary must be zero to prevent double inclusion. Notice recovery can make the reviewed net amount negative; the application records the reviewed settlement and does not initiate a payment or collection.

Revocation is committed alongside completion. Existing HTTP access tokens and refresh tokens fail against stored account activity and token version after commit. Reactivating a login does not restore its old access or refresh tokens. Push subscriptions are removed in the same transaction. External payment, email, document hosting and already dispatched provider requests are outside this database operation; completion makes no external provider call.

## API and older clients

The primary endpoint is:

```http
POST /hrms/exit/resignations/:id/complete
Content-Type: application/json

{
  "referenceNumber": "SCHOOL/EXIT/2026/001",
  "preparationId": "10000000-0000-4000-8000-000000000099"
}
```

Use the actual `settlement.preparedSnapshot.preparationId` from the reviewed case; the UUID above is an example. Completion returns the completed resignation ID, completion time, settlement ID, linked letter and `accountRevoked: true`. References are trimmed, validated and checked case-insensitively within the school. New workflow letters have database uniqueness guards for resignation, settlement and school reference. Historical letters and duplicate historical references are retained for explicit reconciliation.

Both older endpoints delegate to the same completion transaction:

- `POST /hrms/exit/resignations/:id/settlement/finalize` now requires a letter `referenceNumber` and reviewed `preparationId` and returns the complete outcome. An empty body is rejected; it cannot finalize settlement alone.
- `POST /hrms/exit/relieving-letter` accepts `resignationId`, `referenceNumber` and reviewed `preparationId` and returns the letter after atomic completion. It cannot issue an independent letter against a staged settlement.

## Existing staged cases and deployment

Apply additive migration **202611200006_hrms_atomic_exit** and regenerate/build the database client before deploying the API. It adds completion metadata, prepared settlement evidence, clearance locks and linked-letter constraints. It does not complete cases, deactivate users, fabricate historical signatures or rewrite earlier letters automatically.

An open legacy settlement without reviewed preparation evidence must be prepared again, including a staged `FINALIZED` settlement. The UI retains its amounts as form defaults; explicit preparation returns it to `CALCULATED` and records fresh evidence and a preparer. Legacy clearance reviews can be recorded again before re-preparation. The next independent manager completes the whole case. Existing unlinked relieving letters, missing or conflicting identity/clearance records, and completed historical cases require explicit reconciliation. They are not silently reassigned or duplicated.

No production migration, staff termination, account revocation, external payment or live deployment was performed during this local repair.

## Local verification

The real PostgreSQL harness passed **307 HTTP assertions across 22 workflow groups** using signed JWTs, actual validation/guards, tenant filtering and transactions. It verifies changed evidence, stale preparation identifiers, legacy re-preparation, independent approval, late-failure rollback, concurrent completion, letter uniqueness, access/refresh rejection after revocation and reactivation, push-subscription removal and both older endpoints. All **120 focused HR tests** passed, including zero-row update failures and preparation evidence. All **18 browser scenarios** passed, including legacy re-preparation, independent completion, retained inputs after a rejected save and mobile layouts. Migration deployment, database-client build and API/web TypeScript checks passed.

On this Windows environment the successful full database run used a disposable database URL ending in `_test` with `connection_limit=2&pool_timeout=20` and `node --max-old-space-size=768 scripts/test-hrms-workflows.cjs`. An earlier full run exited natively before reaching the new exit tests; no assertions were skipped or removed for the successful run. Local artifacts are retained under ignored `qa/hrms-repair`; this is not a hosted CI run.
