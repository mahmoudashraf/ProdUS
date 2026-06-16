# Service-Owned Workspace Findings Change Plan

Date: 2026-06-16

## Purpose

This plan tightens the ProdUS workspace model so scanner findings do not float directly inside a workspace.

The new rule:

```text
Product scanners discover findings.
Findings belong to a service.
Services belong to a workspace.
Therefore workspace findings are visible only through workspace services.
```

This is a better startup/MVP owner journey because the owner does not need to understand a separate "finding assignment" system. They choose the work service, then the relevant scanner findings come with that service.

## Decision

Direct finding-to-workspace assignment should be deprecated.

The owner should never see a finding as "just assigned to workspace" without a service owner.

Valid paths:

- Add a service to the workspace, then include matching findings.
- Add a specific finding, but only by choosing or confirming the service that owns it.
- Change a finding's service, then include it under that service if the service is already in the workspace or after the owner explicitly adds that service.

Invalid path:

- Add finding directly to workspace with no service.

## Current Behavior To Replace

Current code has useful pieces, but they are not strict enough:

- `ScannerRiskThread.workspace` lets a risk/finding be assigned directly to a workspace.
- `ScannerRiskThread.recommendedModule` stores the service mapping, but workspace assignment does not currently require that service to be in the workspace.
- `POST /api/scanner/risks/{riskThreadId}/assign-workspace` assigns a risk directly.
- Workspace service add can move matching findings into the workspace, which is good, but it coexists with direct assignment, which creates confusion.

The change should keep the value while removing the ambiguity.

## Target Mental Model

### Product

Product owns:

- Scan sources.
- Scan runs.
- Normalized findings.
- Scanner risk threads.
- Service recommendation for each finding.
- Findings that still need service mapping.

Product Scanners answers:

> What risks were found, what service owns each one, and which workspace service should handle them?

### Workspace

Workspace owns:

- Selected services.
- Findings included through those services.
- People/team assignments.
- Proof and check-fix progress.
- Handoff once the service work is ready.

Workspace Fixes and Proof answers:

> Which service-owned findings are we fixing here, what proof/check is needed, and what changed after the latest check?

## Data Model Direction

### Preferred Model

Add an explicit service-scoped assignment record:

```text
workspace_service_findings
  id
  workspace_id
  service_module_id
  scanner_risk_thread_id
  status: INCLUDED | EXCLUDED
  reason
  added_by_id
  removed_by_id
  created_at
  updated_at
```

Meaning:

- `ScannerRiskThread` remains product-level scanner truth.
- `WorkspaceServiceFinding` says this product finding is included in this workspace under this service.
- `EXCLUDED` keeps intentional removals visible and prevents accidental re-add when a service is already in the workspace.

### Compatibility Bridge

For a transition period:

- Keep `ScannerRiskThread.workspace` as a backward-compatible denormalized field.
- When a `WorkspaceServiceFinding` is `INCLUDED`, set/update `ScannerRiskThread.workspace`.
- When the last included workspace-service finding is removed, clear `ScannerRiskThread.workspace`.
- New UI and APIs should treat `WorkspaceServiceFinding` as the source of truth.

This avoids breaking old queries while moving the product model to the right place.

## Product Rules

### Rule 1: A Finding Needs A Service Before Workspace Inclusion

If a finding has no `recommendedModule`:

```text
Show: Choose service first
Do not show: Add to workspace
```

The owner can choose a service from the catalog. If the service is not yet in the workspace, ProdUS can add the service and include that explicitly selected finding in one confirmed owner action. That action is treated as the service choice for an unmapped finding.

### Rule 2: A Service Must Be In The Workspace

If a finding has a recommended service but that service is not in the workspace:

```text
Show: Add [service name] to workspace
Then include this finding
```

Do not silently add the service.

### Rule 3: If The Service Is Already In The Workspace

If a finding has a recommended service and that service is already assigned to the workspace:

```text
Show: Add to workspace under [service name]
```

This creates or reactivates the `WorkspaceServiceFinding` record.

### Rule 4: Removing A Finding Does Not Remove The Service

If the owner removes a finding from a workspace:

- Mark the workspace-service-finding as `EXCLUDED`.
- Keep the service in the workspace.
- Keep the product scanner finding/risk thread.
- Show it under the service as "Removed from this workspace" or "Available to re-add."

### Rule 5: Removing A Service Requires A Finding Impact Review

If the owner removes a service from a workspace:

Show:

- Findings currently included through that service.
- Findings that will leave this workspace.
- Milestones/proof connected to that service if any.

Default action:

```text
Remove service and remove its included findings from this workspace.
```

Optional future action:

```text
Move findings to another service.
```

### Rule 6: Service Change Must Respect Workspace Scope

If the owner changes a finding service:

- If the new service is in the workspace, move the finding under the new service.
- If the new service is not in the workspace, ask to add that service first.
- If the owner declines, update product-level mapping only and remove/hide the finding from the workspace service scope.

### Rule 7: New Scan Results Should Not Silently Change Workspace Scope

After a new scan:

- Product scanner truth updates.
- Findings map to recommended services.
- If a service is already in a workspace, show "New findings available for this service."
- Let the owner accept all/some new findings into the workspace.

This avoids surprise scope expansion while keeping the path fast.

## Required Backend Changes

### 1. Add WorkspaceServiceFinding Entity

Create:

```text
WorkspaceServiceFinding
WorkspaceServiceFindingRepository
WorkspaceServiceFindingStatus
```

Unique constraint:

```text
workspace_id + service_module_id + scanner_risk_thread_id
```

Important queries:

- Active findings for workspace.
- Active findings for workspace service.
- Excluded findings for workspace service.
- Product findings eligible for a workspace service.

### 2. Service-Scoped Finding APIs

Add:

```text
GET /api/workspaces/{workspaceId}/services/finding-impact
```

Extend response to include:

- findings already included.
- findings that can be added.
- findings intentionally excluded.
- findings needing service mapping.

Add:

```text
POST /api/workspaces/{workspaceId}/services/{serviceModuleId}/findings
```

Body:

```json
{
  "riskThreadIds": ["..."],
  "includeExcluded": false,
  "note": "Owner selected these findings for this service."
}
```

Behavior:

- Require service exists in the workspace.
- Require each risk belongs to the same product.
- Require each risk is already mapped to the selected service.
- If the risk is not mapped, return a clear "choose service first" error.
- If the risk is mapped to a different service, return a clear "change service first" error.
- Create or reactivate `WorkspaceServiceFinding`.
- Update denormalized `ScannerRiskThread.workspace` for compatibility.

Add:

```text
POST /api/workspaces/{workspaceId}/services/{serviceModuleId}/findings/{riskThreadId}/exclude
```

Body:

```json
{
  "reason": "Not part of this workspace scope."
}
```

Behavior:

- Mark as `EXCLUDED`.
- Clear denormalized `ScannerRiskThread.workspace` if no other included scope remains.

### 3. Deprecate Direct Risk Assignment

Current:

```text
POST /api/scanner/risks/{riskThreadId}/assign-workspace
```

New behavior:

- Do not allow service-less assignment.
- Return a clear error if no service can be resolved.
- If kept for compatibility, resolve the service from `serviceModuleId` or the finding's current recommended service.
- If `serviceModuleId` is supplied for an unmapped finding, treat that as the explicit service choice before inclusion.
- If the finding is already mapped to a different service, require the service-change flow first.
- Validate that the resolved service is assigned to the workspace.
- Prefer routing frontend to the new service-scoped endpoint.

Suggested error codes:

```text
SERVICE_MAPPING_REQUIRED
SERVICE_NOT_IN_WORKSPACE
FINDING_ALREADY_INCLUDED
FINDING_EXCLUDED_CONFIRM_READD
```

### 4. Service Add Should Include Selected Findings

Current service add supports `addMatchingFindings`.

Update it to support:

```json
{
  "serviceModuleId": "...",
  "addMatchingFindings": true,
  "selectedRiskThreadIds": ["..."],
  "includeExcluded": false
}
```

Behavior:

- If `selectedRiskThreadIds` is present, include only those findings.
- If `addMatchingFindings` is true and no selected list is provided, include matching eligible findings.
- If a selected finding has no service mapping, treat the selected service as the owner-confirmed service choice, map the finding, then include it.
- If a selected finding is mapped to a different service, do not silently remap it; require the Change service flow first.
- Do not re-add excluded findings unless `includeExcluded` is true.
- Return owner notice with exact counts.

### 5. Check Fixes Should Use Service-Scoped Findings

`Check fixes` should run only against findings included in the workspace through a service.

For full suite:

- It can still run product/workspace scanner targets.
- The workspace progress UI should mark which included service-owned findings are being checked.

For targeted check:

- Resolve tool/source/baseline from included workspace-service findings.
- Do not allow checking findings that are product-only or excluded from the workspace.

## Required Frontend Changes

### Product Scanners

Replace direct "Assign to workspace" behavior with service-aware actions.

For each finding:

```text
Recommended service: API security review
Workspace: Service not added yet
Primary action: Add service and include finding
```

If service is already in workspace:

```text
Primary action: Add to workspace under API security review
```

If no service mapping:

```text
Primary action: Choose service first
```

### Workspace Services

Each service card should show:

- Included findings.
- New matching findings available.
- Removed/excluded findings that can be re-added.
- Button: Manage findings for this service.

The "Browse services" flow should preview:

- What the service adds.
- Which findings come with it.
- Which findings were previously excluded.

### Workspace Fixes And Proof

Group findings by service.

Example:

```text
API security review
  3 findings included
  1 ready to check
  1 new matching finding available
```

Each finding card should show:

- Service owner.
- Scanner source.
- Current state.
- Latest check/proof.
- Action: Check fixes, Change service, Remove from this service.

There should be no standalone "workspace finding" section that ignores service ownership.

### Re-Add After Removal

When a finding was removed:

Show it in the relevant service view:

```text
Removed from this workspace
Reason: Not in current MVP scope
Action: Re-add to this service
```

Also show from Product Scanners:

```text
This finding is mapped to API security review.
It was removed from Workspace A.
Action: Re-add through API security review
```

### Unmapped Findings

Use a clear owner flow:

```text
This finding needs a service before it can become workspace work.
Choose service
```

After choosing:

```text
Add [service] to workspace and include this finding?
```

## Required AI/Scanner Mapping Behavior

The AI/scanner mapping should keep improving service recommendations, but it should not silently create workspace scope.

AI/scanner may:

- Suggest service mappings.
- Explain why a finding belongs to a service.
- Suggest that an existing workspace service should include a new finding.

AI/scanner must not:

- Add services to workspace without owner confirmation.
- Include findings in workspace without owner confirmation, except when the owner explicitly chose "add matching findings" during service add.

## Case Matrix

| Case | Expected Behavior |
| --- | --- |
| Add service first | Show matching findings, let owner include all/some, create service scope records. |
| Add finding first with mapped service in workspace | Include finding under that service. |
| Add finding first with mapped service not in workspace | Ask to add service first, then include finding. |
| Add finding with no mapped service | Require service selection first. |
| Re-add removed finding | Reactivate excluded workspace-service-finding record. |
| Remove finding | Exclude from that service/workspace, keep product scanner truth. |
| Remove service | Show included findings impact, then detach/exclude those findings from workspace. |
| Change finding service | Move under new workspace service or ask to add new service first. |
| New scan finds matching risks | Show available findings under existing workspace services; owner accepts all/some. |
| Check fixes | Runs only for findings included through workspace services. |
| Full scanner suite | Runs scanner suite, then maps results back to product services and workspace service suggestions. |
| Legacy direct assignments | Migrate into service-owned records or show as "Needs service mapping" until fixed. |

## Current Implementation Status

Status as of 2026-06-16:

- `WorkspaceServiceFinding` is implemented as the explicit workspace-service-finding scope record.
- A Liquibase migration creates the service-owned findings table and backfills existing direct workspace findings when their mapped service already exists in the workspace.
- Workspace service add can include selected findings, include matching findings, and avoid re-adding excluded findings unless explicitly requested.
- Workspace service removal excludes included findings for that service before removing the service from the workspace.
- Product Scanners and Workspace findings now use service-aware actions:
  - unmapped finding: choose service first;
  - mapped service not in workspace: add that service first;
  - mapped service in workspace: include under that service.
- Product Scanners now provides a service chooser for unmapped findings, so the owner can choose the service and include the finding without leaving the screen.
- Workspace Services shows selected services, included findings, available service findings, and excluded findings that can be re-added.
- Workspace Fixes limits service changes to services already in the workspace.
- Legacy direct assignment is guarded:
  - it no longer creates service-less workspace findings;
  - it can use `serviceModuleId` as the service choice only for an unmapped finding;
  - it rejects service choices that are not assigned to the workspace.
- `Check fixes` continues to run from workspace-selected findings, and product-only or excluded findings are kept out of workspace fix scope.

Remaining hardening:

- Broaden live verification for mixed scanner tools, failed-tool behavior, and second-scan comparisons.
- Keep old direct assignment APIs only as compatibility while UI moves fully to service-scoped flows.
- Add a later cleanup to remove `ScannerRiskThread.workspace` once all reads and migrations no longer need the compatibility bridge.

## Migration Plan

### Step 1: Backfill Existing Workspace Findings

For every `ScannerRiskThread` with `workspace_id`:

- If `recommended_module_id` exists and that service exists in the workspace package, create `WorkspaceServiceFinding(INCLUDED)`.
- If `recommended_module_id` exists but service is not in workspace, create a migration task or show "Add service to keep this finding in workspace."
- If no `recommended_module_id`, show "Needs service mapping" and do not treat it as valid workspace scope after migration.

No existing scanner finding should disappear from UI during migration. It should either appear under a service or under a temporary "Needs service mapping" migration bucket.

### Step 2: Switch Reads

Update workspace findings queries to read active `WorkspaceServiceFinding` records.

Keep old `ScannerRiskThread.workspace` only as a fallback during the migration window.

### Step 3: Switch Writes

Update all frontend writes to use service-scoped endpoints.

Remove direct UI calls to:

```text
POST /api/scanner/risks/{riskThreadId}/assign-workspace
```

### Step 4: Enforce Backend Guardrails

After UI migration:

- Direct assignment endpoint returns service-required errors.
- Check-fixes rejects product-only or excluded findings.
- Service removal updates related finding scope.

## Implementation Sequence

1. Add `WorkspaceServiceFinding` entity, repository, status enum, and migration.
2. Add service-scoped include/exclude APIs.
3. Extend service add API with selected findings and excluded-finding handling.
4. Update workspace service impact response to include included, addable, excluded, and unmapped groups.
5. Update Product Scanners actions to service-aware flows.
6. Update Workspace Services cards and manage-findings view.
7. Update Workspace Fixes and Proof to group findings by service.
8. Update Check fixes to resolve included service-owned findings only.
9. Keep legacy assignment fallback visible but not primary.
10. Add tests and live verification.

## Verification Requirements

### Backend Tests

- Cannot include a finding in workspace without service mapping.
- Cannot include a finding under a service not assigned to the workspace.
- Can add service and include selected findings.
- Can re-add an excluded finding.
- Removing a finding does not remove service.
- Removing service excludes/detaches included findings.
- Changing service enforces workspace service membership.
- Check fixes rejects product-only findings.
- Legacy direct assignment migration creates service-owned records when possible.

### Frontend Tests

- Product Scanners shows "Choose service first" for unmapped findings.
- Product Scanners shows "Add service and include finding" when service is not in workspace.
- Product Scanners shows "Add to workspace under service" when service exists.
- Workspace Services shows included, available, and removed findings.
- Workspace Fixes groups findings by service.
- Removed finding can be re-added.
- Mobile layout stays readable.

### Live Verification

Use one product with:

- One mapped finding and service already in workspace.
- One mapped finding where service is not in workspace.
- One unmapped finding.
- One excluded finding.
- One service removal flow.
- One targeted Check fixes flow.

Screenshots to keep:

- Product Scanners service-aware action states.
- Workspace Services manage-findings view.
- Workspace Fixes grouped by service.
- Re-add excluded finding flow.
- Check progress after targeted check.

## Success Criteria

The change is done when:

- A finding cannot appear in a workspace without a service owner.
- The owner can still add/re-add findings easily.
- Adding a service is the primary path to bring findings into workspace work.
- Direct finding assignment no longer creates confusing workspace-only work.
- Workspace Fixes and Proof reads as service-owned work, not a separate scanner bucket.
- Existing scanner/proof/history information remains visible after migration.
