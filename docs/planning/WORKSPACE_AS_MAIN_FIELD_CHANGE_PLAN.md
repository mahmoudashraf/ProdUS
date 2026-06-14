# Workspace As The Main Field Change Plan

Date: 2026-06-14

## Purpose

This plan changes the ProdUS owner journey from a scattered set of separate destinations into one simple startup/MVP flow:

```text
Home -> Product -> Workspace
```

The product keeps the big picture. The workspace becomes the live field where the owner plans, chooses services, adds people, fixes scan findings, tracks milestones, attaches proof, and prepares handoff.

The goal is not an enterprise change-control process. The goal is a flexible working room for prototype, MVP, and startup owners.

## Why This Change

The current system has useful parts, but the owner has to understand too many boundaries:

- Product Details
- Planning
- Services
- Action Plan
- Scanners
- Findings
- Proof
- Workspaces
- Team
- Handoff

This creates a scattered mental model. The owner asks:

- Where do I actually work?
- Where do scanner findings become work?
- Where do I add a service after a new blocker appears?
- Where do I add an expert or team?
- Is Planning before Workspace, or is Workspace the actual place I should be?

For a startup owner, the natural answer is:

> Open the product workspace and work from there.

## Target Mental Model

### Product

The product is the source of truth for:

- Product name and attributes.
- AI opportunities and LoomAI fit.
- Scan sources and latest scanner results.
- Current scan risk picture.
- Scan history and old evidence.
- Launch verdict.
- Public/shareable product summary.
- High-level service recommendations.
- Active workspaces.

The product answers:

> What is this product, can it launch, and where should I work next?

### Workspace

The workspace is the active working field for one product.

It owns:

- The current work plan.
- Selected services.
- Team, experts, and participants.
- Scanner findings selected for work.
- Service, milestone, and team assignment for selected scan risks.
- Milestones and deliverables.
- Proof files and scanner reruns.
- Fix verification after scanner reruns.
- Handoff/support readiness.

The workspace answers:

> What are we doing now, who is doing it, what proof is needed, and what should happen next?

## Product Journey

### 1. Home

Home remains the owner switchboard.

It should show:

- Products.
- Active/draft workspaces.
- One clear next action.
- Lightweight portfolio metrics.

Home should not teach all ProdUS concepts. It should help the owner choose where to continue.

### 2. Product Details

Product Details should become a calm overview, not the main work room.

It should show:

- Selected product fixed at the top.
- Launch verdict.
- Last scan status.
- Top risks.
- AI opportunities hook.
- Active workspace hook.
- Share/status hook.

Primary action:

```text
Open workspace
```

If the product has no workspace yet:

```text
Create workspace
```

If the product has one workspace:

```text
Open workspace
```

If the product has multiple workspaces:

```text
Choose workspace
```

### 3. Workspace

The workspace becomes the main internal product page.

Workspace internal views:

- Overview
- Plan work
- Services
- Team
- Fixes
- Milestones
- Proof
- Handoff

These should feel like internal pages with clear back paths, not tabs that swap a long lower section.

## Workspace Views

### Workspace Overview

Purpose:

Show the current state and the next owner/team move.

First viewport should answer:

- What is this workspace doing?
- Is it planning, fixing, reviewing proof, or handing off?
- What is the next action?
- What changed recently?

Example copy:

```text
Workspace is planning the first launch-fix sprint.
2 scan risks are selected for work. 3 services are in the plan. No team is assigned yet.
```

Primary actions:

- Continue plan
- Add service
- Add team
- Review fixes

### Plan Work

Purpose:

Replace the separate Planning mental model.

This view shows the workspace plan:

- Product goal.
- Selected services.
- Selected risks/findings.
- Suggested next services.
- Team/expert needs.
- Milestones that will be created or already exist.

Actions:

- Add service
- Remove service
- Add suggested service from scanner findings
- Add milestone
- Update plan

This should be lightweight. No heavy approval language unless money/legal workflow is later added.

### Services

Purpose:

Choose or adjust services inside the workspace.

Services should be shown as work that helps the product move forward, not as catalog shopping.

Actions:

- Add service to workspace
- Add suggested service from a finding
- View why this service is suggested
- Create milestone from service

When a service is added:

```text
This adds API Security Review to this workspace and creates a matching milestone.
```

Current implementation path:

- Read selected services from `GET /api/workspaces/{workspaceId}/services`.
- Add a service with `POST /api/workspaces/{workspaceId}/services`.
- Remove a service with `DELETE /api/workspaces/{workspaceId}/services/{packageModuleId}`.
- Store the selected service as the workspace package module for now, so product summary and workspace scope do not drift apart.
- Create a matching milestone when a new service is added, unless the caller explicitly opts out.

### Team

Purpose:

Add or adjust the people doing the work.

Actions:

- Add team
- Add expert
- Invite person
- Change role
- Remove participant

This should feel practical:

```text
Add someone who can handle this work.
```

Avoid enterprise labels like `resource allocation`, `change request`, or `governance`.

Current implementation path:

- Show the selected team inside Workspace > Team.
- Use workspace support/team requests as the current source of attached teams until a dedicated workspace-team assignment table is needed.
- Provide a direct link from each selected team to its team profile page.
- Keep participant editing in the same Team area, because owners should not need a separate admin page to adjust who is helping.

### Fixes

Purpose:

Show scanner findings selected for this workspace and what service/milestone owns them.

This is where the scattered scanner-to-service-to-work bridge becomes clear.

Each item should show:

- Plain-language risk.
- Source proof.
- Suggested or chosen service.
- Assigned milestone.
- Owner/team state.
- Proof needed.

Actions:

- Add finding to workspace
- Move finding to milestone
- Add recommended service
- Mark handled
- Accept risk
- Attach proof

### Milestones

Purpose:

Track delivery steps.

Milestones can be created by:

- Adding a service.
- Adding a scanner finding to work.
- Adding a manual milestone.

Each milestone should show:

- Goal.
- Linked services.
- Linked findings.
- Owner/team.
- Proof required.
- Status.

### Proof

Purpose:

Keep evidence close to the work.

Proof should include:

- Uploaded files.
- Scanner evidence.
- Clean reruns.
- Acceptance notes.
- Handoff files.

Proof should be attached to the relevant finding, service, or milestone whenever possible.

### Handoff

Purpose:

Prepare the product for owner/team/support continuity.

It should stay quiet until relevant.

Show:

- What is complete.
- What proof is still missing.
- Known issues.
- Access/runbook notes.
- Support scope.

## Scanner Result Lifecycle

Scanner results should not become a separate product area that competes with Workspace.

The rule is:

```text
Product owns scanner truth.
Workspace owns selected scanner work.
```

### Where Scan Results Live

Every scan creates immutable product evidence:

- Scan run.
- Tool runs.
- Raw artifact references.
- Normalized findings.
- Scanner evidence items.
- Scanner-to-service mapping.

These records stay attached to the product and, when relevant, can also be attached to a workspace.

The product answers:

```text
What did ProdUS check, what is the latest risk picture, and what changed since the last check?
```

The workspace answers:

```text
Which risks are we fixing, who owns them, what service/milestone covers them, and what proof shows they are fixed?
```

### Current Risk Picture

Do not calculate the owner-facing current risk count by simply counting all historical normalized findings.

That makes old scan rows look like current problems.

Instead, the product needs a stable current risk picture built from scanner risk threads.

A scanner risk thread represents the same issue over time:

```text
API endpoint missing auth
First seen: Scan #12
Last seen: Scan #18
Current state: Still open
Service: API Security Review
Workspace: Launch Fix Sprint
Milestone: Secure API access
```

The normalized finding remains the per-scan observation. The risk thread is the owner-facing lifecycle.

### Finding Lifecycle

Owner-facing states should be simple:

State | Meaning
--- | ---
New | Appeared for the first time in the latest scan.
Still open | Found again and not fixed yet.
Ready to check | Work/proof was added and a rerun should verify it.
Fixed by latest scan | It existed before and did not appear in the latest comparable scan.
Returned | It was previously fixed but appeared again.
Accepted risk | Owner intentionally accepts it for now.
False positive | Owner says it is not a real issue.
Needs proof | The scanner result is not enough to prove the fix or decision.

The technical scanner statuses can remain more granular internally, but the UI should translate them into these owner states.

### When The User Can Run Scanners

Use one scanner system, but name the action based on the user's intent.

Location | Button | Purpose
--- | --- | ---
Product Details / Scanners | Run scanners | Get the latest product launch risk picture.
Workspace / Fixes | Check fixes | Verify the work selected in this workspace.
Workspace / Proof | Check fixes | Confirm attached proof and scanner rerun result.
Scanner schedule area | Schedule checks | Keep product evidence fresh automatically.

Avoid duplicate labels such as `Run scan`, `Refresh scan`, `Rescan`, and `Run refresh scan` on the same journey.

### Targeted Check Fixes

`Check fixes` should not default to a full scanner suite.

It should build the smallest useful verification plan from the selected risks.

For scanner-origin findings, ProdUS already has useful source data:

- `NormalizedFinding.sourceTool`
- `NormalizedFinding.sourceRuleId`
- `NormalizedFinding.affectedComponent`
- `NormalizedFinding.toolRun`
- `ToolRun.toolKey`
- `ToolRun.toolName`
- `ScanRun.depth`
- `ScanRun.branchRef`
- `ScanRun.runtimeTargetUrl`
- `ScanRun.containerImageRef`
- `ScanRun.scanSource`
- `NormalizedFinding.recommendedModule`
- `NormalizedFinding.findingCategory`
- `NormalizedFinding.readinessArea`

Default rule:

```text
Check fixes = targeted rerun for selected workspace risks.
```

Tool selection examples:

Risk source | Targeted check
--- | ---
Secret leak from Gitleaks | Rerun Gitleaks on the same repo/source/branch.
Runtime API issue from ZAP | Rerun ZAP baseline against the same runtime URL.
Code security issue from Semgrep | Rerun Semgrep, ideally scoped by rule/path when supported.
IaC issue from Checkov | Rerun Checkov for the same IaC source/path when supported.
Dependency issue from OSV/Trivy/Grype | Rerun the matching dependency/container scanner against the same manifest/image.

Resolver rules:

1. If the risk came from a scanner finding, rerun the original scanner tool first.
2. Reuse the original scan source, branch, runtime URL, image reference, and scan depth.
3. If the tool supports narrowing, pass path, rule, package, image, URL, or component hints.
4. If the tool cannot safely narrow, run the smallest relevant tool group.
5. If the risk is AI/manual/user-input only and has no scanner source, do not pretend it can be scanner-verified. Ask for proof or offer the most relevant scan type.
6. Always allow `Run full scanner suite instead` as an explicit owner choice.

The UI should preview the check before running:

```text
Check fixes

ProdUS will rerun:
- Gitleaks for 1 secret risk
- ZAP for 1 runtime API risk

Baseline:
Scan from June 12

This verifies selected workspace fixes only.
```

Primary action:

```text
Check fixes
```

Secondary action:

```text
Run full scanner suite instead
```

Store the targeted verification plan in `ScanRun.scanPlan` as structured data:

- Selected risk thread IDs.
- Selected normalized finding IDs.
- Baseline scan run IDs.
- Selected tool keys.
- Target source/branch/runtime URL/image.
- Path/rule/package/component hints.
- Whether the run is targeted or full-suite.
- Coverage limitations.

### What Happens To Old Findings

Old findings are never silently deleted.

They move out of the current risk count when the latest comparable scan proves they are no longer present.

Rules:

- Keep every historical scan run and normalized finding as evidence/history.
- Group same-fingerprint findings into one current risk thread.
- If the same fingerprint appears again, update the existing thread.
- If a previously fixed fingerprint appears again, mark it `Returned`.
- If a fingerprint does not appear in the latest comparable successful scan, mark it `Fixed by latest scan`.
- If a scanner/tool fails, do not mark old findings fixed. Mark the comparison as incomplete.
- Accepted risk and false-positive decisions stay visible, but do not block launch unless they return or expire.

### How New Findings Are Assigned

When a new scan completes:

1. Match each finding by stable fingerprint.
2. If it matches an existing risk thread:
   - Keep the same workspace assignment.
   - Keep the selected service if still relevant.
   - Keep the milestone/team assignment.
   - Update latest evidence and state.
3. If it is a new fingerprint:
   - Map it to a service with scanner readiness mapping.
   - Show it under `New risks from latest scan`.
   - Let the owner choose:
     - Add to current workspace.
     - Create a new workspace.
     - Track later.
     - Accept risk.
     - Mark false positive.

This keeps work stable across scans. A rerun should not make the owner reassign everything manually.

### How Old And New Scans Are Compared

Every scan should compare against a clear baseline.

Product-level scan:

```text
Compare with the latest completed comparable scan for the same product, source, and scan depth.
```

Workspace fix check:

```text
Compare with the scan that created or last updated the workspace risks.
```

The comparison should produce owner-facing groups:

- Fixed since last scan.
- Still open.
- New risks.
- Returned risks.
- Needs proof.
- Scanner failed or incomplete.

This comparison is more useful than showing raw scanner rows first.

### Product Scanners UI

The product scanner page should answer:

- What was checked?
- When was it last checked?
- What changed?
- What still blocks launch?
- What can I send into the workspace?

First viewport:

```text
Scanner status
Latest check: 12 Jun, 10 tools completed

Launch risks
2 blockers still open
3 fixed since last scan
1 new risk

Primary action: Run scanners
Secondary action: View scan history
```

### Workspace Fixes UI

The workspace fixes page should answer:

- Which selected risks are being fixed here?
- Which service covers each risk?
- Who owns the work?
- What proof is needed?
- Has the latest scan verified the fix?

Example:

```text
Fixes in this workspace

Still open
- API auth missing -> API Security Review -> Milestone 1

Ready to check
- Dependency issue patched -> Check fixes

Fixed
- Secret removed -> Verified by Gitleaks
```

### Scanner UX Rule

The owner sentence should be:

```text
ProdUS scanned the product, found launch risks, mapped them to services, and put the selected fixes into your workspace. When work is done, run Check fixes to prove what changed.
```

## Navigation Changes

### Left Product Menu

Target product-specific menu:

- Product Details
- Workspace
- Scanners
- AI Opportunities
- Share

Potential simplification after workspace migration:

- Product Details
- Workspace
- Share

Scanners and AI Opportunities can remain product-level because they are product context sources, but workspace should consume their output.

Scanners should not be hidden inside Workspace because scan history and product launch risk belong to the product. Workspace should show the selected scanner risks that are being worked on.

### Rename / Reposition

Current visible label | Target direction
--- | ---
Planning | Plan work inside Workspace
Product Workspaces | Workspace, or Workspaces only when multiple exist
Open Work Plan | Continue plan
Open active workspaces | Open workspace
Fix Path | Suggested fixes / Services from scan findings
Team & support | Team
Delivery overview | Workspace overview

## Backend / Data Plan

### Current Useful Building Blocks

Already exists:

- `ProjectWorkspace`
- `PackageInstance`
- `PackageModule`
- `WorkspaceParticipant`
- `Milestone`
- `Deliverable`
- `NormalizedFinding.workspace`
- `NormalizedFinding.fingerprint`
- `NormalizedFinding.status`
- `NormalizedFinding.recommendedModule`
- `ScanRun.comparisonBaseRunId`
- `ProductFinding.normalizedFinding`
- Scanner readiness diagnosis.
- Workspace scanner readiness enrichment.

### Short-Term Backend Direction

Keep the current backend objects, but change how the UI presents them.

For MVP:

- Treat `ProjectWorkspace` as the live product field.
- Treat `PackageInstance` / `PackageModule` as the workspace plan backing data.
- Treat existing cart/Planning APIs as draft-plan backing APIs, but hide cart/planning language in the UI.
- Use `WorkspaceParticipant` for people.
- Use `Milestone` and `Deliverable` for work.
- Use `NormalizedFinding.workspace` and scanner acceptance criteria to attach scanner work to a workspace.
- Treat scan runs and normalized findings as immutable evidence/history.
- Build the owner-facing current risk picture from stable scanner risk threads, not from all historical normalized findings.

### Needed Backend Additions

Add lightweight endpoints or service methods:

```text
ScannerRiskThread
```

Add a durable current-risk record, or an equivalent projection, with:

- Product.
- Optional workspace.
- Fingerprint.
- Current state.
- First seen scan.
- Last seen scan.
- Last fixed scan.
- Current finding.
- Recommended service module.
- Assigned milestone/team when available.

This prevents old scan rows from polluting current launch risk counts while preserving full scan history.

```text
GET /scanner/products/{productId}/risks/current
```

Returns current owner-facing risk threads grouped by `New`, `Still open`, `Ready to check`, `Fixed by latest scan`, `Returned`, `Accepted risk`, `False positive`, and `Needs proof`.

```text
GET /scanner/runs/{runId}/comparison
```

Returns what changed compared with the baseline run:

- Fixed since last scan.
- Still open.
- New risks.
- Returned risks.
- Needs proof.
- Scanner failed or incomplete.

```text
POST /scanner/risks/{riskThreadId}/assign-workspace
```

Assigns a current risk thread to a workspace while keeping scan history at product level.

```text
POST /workspaces/{workspaceId}/scanner/check-fixes
```

Queues a targeted scanner verification for selected workspace risks.

Request shape:

```json
{
  "riskThreadIds": ["..."],
  "mode": "RELEVANT_TO_FIXES",
  "authorizationConfirmed": true
}
```

Backend behavior:

- Load the selected workspace risks.
- Build a check plan from original scanner source metadata.
- Reuse source, branch, runtime URL, image, scan depth, and comparison baseline where possible.
- Queue existing scanner runs with `comparisonBaseRunId`.
- Store selected risks, tool keys, target hints, and limitations in `ScanRun.scanPlan`.
- Return the queued scan run(s) and a human-readable preview of what will be checked.

```text
POST /workspaces/{workspaceId}/services
```

Adds a service to the workspace plan, creates/updates a package module, and optionally creates a milestone.

```text
POST /workspaces/{workspaceId}/findings/{findingId}
```

Adds a product finding or risk thread to the workspace and creates a proof/milestone task if needed.

```text
POST /workspaces/{workspaceId}/teams
POST /workspaces/{workspaceId}/experts
```

Adds teams/experts as workspace participants with owner-friendly roles.

```text
POST /workspaces/{workspaceId}/milestones/from-service/{serviceModuleId}
```

Creates a milestone from a selected service.

These endpoints should be simple and reversible. They should not use enterprise change-request language.

### Workspace Creation

Current flow creates workspace after Planning conversion.

Target flow:

- Creating a product can create a draft workspace, or
- Opening workspace for a product with no workspace prompts `Create workspace`.

The workspace can start in a planning state:

```text
PLANNING
```

If adding a new enum is too much for the first pass, reuse the existing draft/awaiting status internally and translate it in UI as:

```text
Planning work
```

## UI Implementation Plan

### Phase 1: Make The Mental Model Clear Without Backend Rewrite

Goal:

Use current APIs, but make the journey feel coherent.

Tasks:

- Rename product menu item `Workspaces` to `Workspace` when only one workspace exists.
- Make Product Details primary CTA `Open workspace`.
- Move visible Planning language under workspace copy.
- In workspace overview, show `Plan work`, `Services`, `Team`, `Fixes`, `Milestones`, `Proof`, `Handoff`.
- Keep old Planning route available, but stop making it a main journey destination.
- Make the current workspace detail page state-aware and less delivery-system-heavy.

### Phase 2: Add Services And People Inside Workspace

Goal:

Let startup owners adjust the workspace without leaving the workspace.

Tasks:

- Add `Add service` inside workspace.
- Add `Add team` / `Add expert` inside workspace.
- Create matching milestone when adding a service.
- Show simple confirmation copy before saving.
- Keep the product plan updated behind the scenes.

### Phase 3: Connect Findings To Workspace Work

Goal:

Make scanner findings visibly become work.

Tasks:

- Add `Add to workspace` on current risk cards.
- Add `Add recommended service` from finding cards.
- Show selected findings in workspace `Fixes`.
- Link selected findings to service/milestone/proof.
- Show `Proof needed` per finding.
- Show clean scanner rerun / evidence state.
- Rename workspace scanner action to `Check fixes`.
- Keep product scanner action as `Run scanners`.
- Preview targeted tools before `Check fixes` runs.
- Offer `Run full scanner suite instead` as secondary action.

### Phase 4: Add Scan Comparison And Current Risk State

Goal:

Make reruns useful instead of adding another pile of scanner rows.

Tasks:

- Add current scanner risk thread/projection.
- Compare each completed scan with the correct baseline.
- Preserve old scan findings as history.
- Move fixed findings out of current blocker counts.
- Keep workspace/service/milestone assignments when the same risk appears again.
- Use source tool, rule, affected component, branch, runtime URL, and image metadata to build targeted fix checks.
- Show `Fixed since last scan`, `Still open`, `New risks`, `Returned risks`, and `Needs proof`.
- Do not mark risks fixed when a scanner tool failed or skipped relevant coverage.

### Phase 5: Collapse Duplicate Destinations

Goal:

Reduce confusion.

Tasks:

- Remove or de-emphasize standalone Planning from product nav.
- Make Services inside Workspace the active service planning surface.
- Keep product-level Services only if it answers a distinct product-level question.
- Review Action Plan overlap with Fixes and Workspace Plan.
- Remove duplicate routes/buttons that do the same job.

### Phase 6: Live Verification And Cleanup

Goal:

Verify the new journey as a first-time owner.

Test cases:

- Product with no workspace.
- Product with one draft/planning workspace.
- Product with one active workspace.
- Product with multiple workspaces.
- Product with scanner findings but no services.
- Product with mapped scanner findings and suggested services.
- Product with a second scan where some findings are fixed.
- Product with a second scan where a blocker returns.
- Product with a failed scanner tool where old findings should not be marked fixed.
- Workspace with selected fixes ready for `Check fixes`.
- Workspace targeted `Check fixes` for one scanner-origin finding.
- Workspace targeted `Check fixes` for mixed tools, such as Gitleaks plus ZAP.
- Workspace manual/AI-only risk that cannot be scanner-verified and needs proof instead.
- Product with selected services but no team.
- Product with team but missing proof.
- Mobile first viewport for each.

## Detailed Implementation Sequence

The document has a clear product direction. The implementation path should now be treated as a sequence of small, shippable slices.

Important rule:

```text
Do not rewrite the whole product/workspace/scanner system at once.
```

Build the owner journey in layers:

1. Clarify the UI using current APIs.
2. Add durable scanner risk lifecycle state.
3. Add targeted `Check fixes`.
4. Connect selected risks to workspace services/milestones/team.
5. Remove duplicate destinations after the new path is real.

### Sequence 0: Baseline And Safety Pass

Purpose:

Create a reliable starting point before changing behavior.

Tasks:

- Confirm current product, workspace, scanner, diagnosis, services, and share routes.
- Capture current API responses for:
  - Product scanner summary.
  - Latest product diagnosis.
  - Workspace scanner readiness.
  - Workspace governance/milestones.
  - Product service recommendations.
- Identify current UI components that render:
  - Product Details.
  - Product Workspaces.
  - Scanners/Findings.
  - Technical Proof.
  - Services/Plan.
  - Workspace detail.
- Add a short implementation note to the PR/change log when a route is intentionally kept as compatibility-only.

Guardrails:

- Do not change scanner counts yet.
- Do not delete old scan/finding records.
- Do not remove old routes until new routes are verified.
- Do not silently rename backend concepts if the database still uses old names.

Verification:

- Type-check frontend.
- Run backend scanner/productization tests that already exist.
- Take local screenshots only for changed owner flows.

### Sequence 1: Product And Workspace Navigation Cleanup

Purpose:

Make the owner understand where they are before adding new backend behavior.

Frontend tasks:

- Product menu:
  - Use `Product Details` for the selected product overview.
  - Use `Workspace` when there is one workspace.
  - Use `Workspaces` only when there are multiple.
  - Keep `Scanners`, `AI Opportunities`, and `Share` product-level.
- Home:
  - Clearing selected product should return to generic Home navigation.
  - Selecting a product should restore product-specific navigation.
- Product Details:
  - Primary CTA is `Open workspace`, `Create workspace`, or `Choose workspace`.
  - Scanner card links to `Scanners`.
  - AI card links to `AI Opportunities`.
  - Workspace card links to the selected workspace.
- Breadcrumb/back path:
  - Product internal pages should have a visible, useful way back to Product Details.
  - Workspace internal pages should have a visible way back to Product Details or Workspace Overview.

Acceptance checks:

- A first-time owner can explain the current screen in one sentence.
- No page has both tabs and navigation buttons doing the same thing.
- Product switch is done from Home, not inside Product Details.

### Sequence 2: Workspace Home Without Backend Rewrite

Purpose:

Make Workspace feel like the real working field using current data first.

Frontend tasks:

- Redefine workspace detail into `Workspace Overview`.
- First viewport shows:
  - workspace name
  - product name
  - state: planning, fixing, proof review, handoff
  - next action
  - selected services count
  - selected scanner risks count
  - team/participant count
  - proof/check status
- Add internal navigation cards:
  - Plan work
  - Services
  - Team
  - Fixes
  - Milestones
  - Proof
  - Handoff
- Keep current information reachable, but avoid long all-in-one pages.

Backend use:

- Use existing workspace, package instance, package modules, milestones, participants, scanner readiness, and diagnosis APIs.
- Translate backend labels into owner language in the UI.

Acceptance checks:

- Workspace can be useful even before new scanner risk thread backend exists.
- Owner sees where services, team, fixes, and proof belong.
- No `Open full workspace` language that makes workspace feel separate from product.

### Sequence 3: Scanner Risk Thread Backend

Purpose:

Stop using all historical normalized findings as the current risk picture.

Backend tasks:

- Add a durable `ScannerRiskThread` table/entity.
- Recommended fields:
  - `id`
  - `product_profile_id`
  - `workspace_id`
  - `fingerprint`
  - `title`
  - `description`
  - `severity`
  - `current_state`
  - `first_seen_scan_run_id`
  - `last_seen_scan_run_id`
  - `last_fixed_scan_run_id`
  - `current_finding_id`
  - `recommended_module_id`
  - `source_tool`
  - `source_rule_id`
  - `affected_component`
  - `readiness_area`
  - `business_risk`
  - `evidence_required`
  - `accepted_reason`
  - `review_due_on`
  - timestamps
- Suggested owner-facing enum:
  - `NEW`
  - `STILL_OPEN`
  - `READY_TO_CHECK`
  - `FIXED_BY_LATEST_SCAN`
  - `RETURNED`
  - `ACCEPTED_RISK`
  - `FALSE_POSITIVE`
  - `NEEDS_PROOF`
  - `INCOMPLETE_CHECK`
- Add repository/service:
  - `ScannerRiskThreadRepository`
  - `ScannerRiskLifecycleService`
- Add backfill:
  - Create one thread per latest fingerprint for each product.
  - Link `current_finding_id` to the newest finding for the fingerprint.
  - Preserve current finding status where possible.
  - Do not mark old findings fixed during backfill.

Backend integration:

- After a scan completes successfully, update risk threads from the run findings.
- Keep `NormalizedFinding` immutable as scan observation data.
- Keep `ProductFinding`/diagnosis generation compatible, but gradually base owner current-risk UI on risk threads.

Acceptance checks:

- Running a second scan with the same fingerprint updates the same risk thread.
- Historical normalized findings remain queryable.
- Product current risk count comes from risk threads, not all findings.

### Sequence 4: Scan Comparison Service

Purpose:

Turn reruns into a clear old/new story.

Backend tasks:

- Add comparison service:
  - input: scan run id
  - baseline: explicit `comparisonBaseRunId` or latest comparable completed run
  - output groups:
    - fixed since last scan
    - still open
    - new risks
    - returned risks
    - needs proof
    - scanner failed or incomplete
- Comparable run rules:
  - same product
  - same scan source where possible
  - same scan depth where possible
  - same runtime URL/image/branch where relevant
  - completed successfully
- Do not mark a risk fixed if:
  - relevant tool failed
  - relevant tool was skipped
  - source/target changed too much
  - scan coverage is not comparable
- Add endpoint:

```text
GET /api/scanner/runs/{runId}/comparison
```

Response should include:

- baseline scan id
- compared scan id
- comparison completeness
- incomplete reason when relevant
- grouped risk thread summaries
- tool coverage summary

Acceptance checks:

- Same finding in both scans: `Still open`.
- Missing finding after successful comparable scan: `Fixed by latest scan`.
- Previously fixed finding appears again: `Returned`.
- Failed scanner tool: old risk remains open or incomplete, not fixed.

### Sequence 5: Targeted Check Fixes Backend

Purpose:

Verify selected workspace fixes without wasting resources on wide scans by default.

Backend tasks:

- Add request/response DTOs for:

```text
POST /api/workspaces/{workspaceId}/scanner/check-fixes
```

Request:

```json
{
  "riskThreadIds": ["..."],
  "mode": "RELEVANT_TO_FIXES",
  "authorizationConfirmed": true
}
```

Modes:

- `RELEVANT_TO_FIXES`
- `FULL_SUITE`

- Add `CheckFixPlanBuilder` or equivalent service.
- For each selected risk:
  - read source tool
  - read source rule
  - read affected component
  - read original scan source
  - read branch/runtime URL/image/depth
  - choose tool keys
  - choose baseline run
  - record scope hints and limitations
- Queue existing scanner runs through `ScannerService`.
- Set `comparisonBaseRunId`.
- Store structured plan in `ScanRun.scanPlan`.

Check plan JSON should include:

```json
{
  "intent": "CHECK_FIXES",
  "mode": "RELEVANT_TO_FIXES",
  "workspaceId": "...",
  "riskThreadIds": ["..."],
  "findingIds": ["..."],
  "baselineRunIds": ["..."],
  "toolKeys": ["gitleaks", "zap"],
  "targets": {
    "branchRef": "main",
    "runtimeTargetUrl": "https://...",
    "containerImageRef": "..."
  },
  "hints": [
    {
      "riskThreadId": "...",
      "sourceTool": "Gitleaks",
      "sourceRuleId": "...",
      "affectedComponent": "backend/.env"
    }
  ],
  "limitations": []
}
```

Tool selection rules:

- Gitleaks risk -> Gitleaks.
- ZAP risk -> ZAP/runtime baseline.
- Semgrep risk -> Semgrep.
- Checkov risk -> Checkov.
- OSV/Trivy/Grype risk -> matching dependency/container scanner.
- Unknown scanner-origin risk -> original tool if available.
- Manual/AI-only risk -> proof required or offer relevant scan type; do not pretend it is scanner-verified.

Acceptance checks:

- One Gitleaks risk queues only Gitleaks when possible.
- One ZAP risk queues only runtime baseline when URL exists.
- Mixed risks queue the smallest needed tool set.
- Full suite is available but explicit.

### Sequence 6: Risk Assignment To Workspace Work

Purpose:

Make the bridge from product scanner risk to workspace action real.

Backend tasks:

- Add assign endpoint:

```text
POST /api/scanner/risks/{riskThreadId}/assign-workspace
```

- For MVP, one risk thread should have one active workspace assignment.
- Assignment updates:
  - `ScannerRiskThread.workspace`
  - current state to `READY_TO_CHECK` only after work/proof exists, otherwise keep `NEW` or `STILL_OPEN`
  - recommended service stays attached
- Add service action:
  - from a risk thread, add its recommended module to workspace plan/package modules
  - create or suggest a milestone
- Add milestone action:
  - link risk thread to milestone, or store linkage through a small join table if needed

Recommended extra table if direct fields become too limiting:

```text
WorkspaceRiskWorkItem
```

Fields:

- workspace
- risk thread
- service module
- milestone
- owner/participant
- state
- proof needed
- latest check run

MVP can start with direct `ScannerRiskThread.workspace` and add the work-item table only if many-to-many assignment becomes necessary.

Acceptance checks:

- Owner can add a product risk to the current workspace.
- Recommended service follows the risk.
- Workspace Fixes shows the assigned risk.
- Removing a risk from workspace does not delete scan history.

### Sequence 7: Product Scanners UI

Purpose:

Make Scanners a product-level truth page, not a technical proof maze.

Frontend tasks:

- Replace raw-first scanner page with current-risk-first layout:
  - latest scanner status
  - current blockers
  - fixed since last scan
  - new risks
  - returned risks
  - scanner coverage/incomplete checks
- Primary action: `Run scanners`.
- Secondary actions:
  - view scan history
  - view raw proof
  - schedule checks
- Risk cards should show:
  - plain-language risk
  - severity
  - source tool
  - affected area
  - suggested service
  - workspace assignment
  - action: `Add to workspace`

Acceptance checks:

- Owner can understand latest scanner result without opening raw proof.
- Technical proof remains reachable.
- Current counts match risk threads.

### Sequence 8: Workspace Fixes UI

Purpose:

Make selected scanner risks actionable inside Workspace.

Frontend tasks:

- Add `Fixes` internal workspace view.
- Group by:
  - still open
  - ready to check
  - fixed
  - returned
  - needs proof
- Each fix card shows:
  - plain-language risk
  - source proof
  - selected/recommended service
  - milestone
  - team/person if assigned
  - proof needed
  - latest check result
- Primary action:

```text
Check fixes
```

- Before running, show targeted check preview:
  - tools to rerun
  - baseline scan
  - target/source
  - limitations
- Secondary action:

```text
Run full scanner suite instead
```

Acceptance checks:

- Workspace user can see exactly what is being fixed.
- `Check fixes` feels connected to selected workspace work.
- The user is not pushed into a generic scanners page to verify a workspace fix.

### Sequence 9: Services, Team, And Plan Inside Workspace

Purpose:

Move practical planning into Workspace without making it enterprise-heavy.

Frontend/backend tasks:

- Add `Add service` inside workspace.
- Add `Add expert` / `Invite team` inside workspace.
- Create or suggest milestone from added service.
- Show one sentence explaining the effect:

```text
This adds API Security Review to this workspace and creates a matching milestone.
```

- Keep existing planning/cart APIs as backing data until cleaner workspace service APIs exist.
- Hide `cart`, `approval`, and heavy planning language from owner-facing copy.

Acceptance checks:

- Owner can adjust services from Workspace.
- Owner can add people from Workspace.
- Added services show in workspace plan and product summary.

### Sequence 10: Collapse Duplicate Pages

Purpose:

Remove confusion after the new path works.

Tasks:

- Make standalone Planning compatibility-only or move it under Workspace.
- Merge Action Plan concepts into Workspace Fixes / Plan work.
- Keep product-level Services only if it answers:

```text
What services are recommended for this product overall?
```

- Workspace Services answers:

```text
What services are active in this workspace?
```

- Update menu labels and empty states.
- Remove duplicate CTA groups.

Acceptance checks:

- No two primary buttons do the same thing.
- Product page gives overview; Workspace page is where work happens.
- Old links still resolve safely.

### Sequence 11: Test, Deploy, And Live Verify

Local verification:

- Frontend type-check.
- Backend tests for scanner risk lifecycle and comparison.
- Scanner integration tests for:
  - first scan creates risk thread
  - second scan keeps same thread
  - fixed finding leaves current blockers
  - returned finding becomes returned
  - failed tool does not mark fixed
  - targeted `Check fixes` chooses expected tools
- Local Playwright screenshots:
  - Product Details
  - Scanners current risk page
  - Workspace Overview
  - Workspace Fixes
  - targeted check preview
  - mobile versions

Live verification:

- Deploy after multiple related changes are ready.
- Verify with one product that has scanner findings.
- Run product `Run scanners`.
- Assign at least one risk to workspace.
- Run workspace `Check fixes` targeted mode.
- Confirm comparison result appears correctly.
- Keep only latest screenshots in `tmp/live-verification`.

Rollback safety:

- Old scan runs and findings remain unchanged.
- If risk thread computation fails, fallback can show current existing scanner summary with a clear warning.
- Do not remove old scanner proof/detail pages until new Scanners and Workspace Fixes are verified.

## Engineering Execution Checklist

This section turns the plan into an implementation sequence a future LLM/session can follow without guessing.

### Slice A: Navigation And Workspace Shape

Goal:

Make the current product/workspace journey understandable before changing scanner persistence.

Frontend code areas:

- `frontend/src/features/platform/OwnerProductizationWorkspace.tsx`
- `frontend/src/features/platform/useOwnerWorkspaceNavigationState.ts`
- `frontend/src/features/platform/OwnerWorkspaceSideRailHost.tsx`
- `frontend/src/features/platform/OwnerProductWorkspacesArea.tsx`
- `frontend/src/features/platform/OwnerWorkspaceOverviewArea.tsx`
- `frontend/src/features/platform/OwnerWorkspaceOverviewPane.tsx`
- `frontend/src/features/platform/OwnerWorkspaceInternalPageHeader.tsx`
- `frontend/src/features/platform/OwnerWorkspaceJourneyNav.tsx`

Implementation steps:

1. Make Product Details the product overview route.
2. Make Workspace the main product work route.
3. Keep Scanners and AI Opportunities as product-level source pages.
4. Make workspace cards open the workspace internal route, not an external-feeling full workspace page.
5. Add a clear back path from workspace internal pages to Product Details and Workspace Overview.
6. Remove duplicate local tab/button controls when a real internal route exists.
7. Rename visible copy:
   - `Workspace` in product nav means the active product work area.
   - `Workspaces` only when multiple workspace choices exist.
   - `Planning` becomes `Plan work` inside Workspace.

Acceptance:

- First viewport tells the owner where they are.
- Home clears selected product and shows generic nav.
- Selected product pages show product-specific nav.
- Product switching remains on Home.

### Slice B: Workspace Home Uses Existing Data

Goal:

Create a useful workspace home before adding new backend records.

Data to reuse:

- `ProjectWorkspace`
- `PackageInstance`
- `PackageModule`
- `WorkspaceParticipant`
- `Milestone`
- `Deliverable`
- product diagnosis/readiness summary
- scanner summary/readiness response

Workspace Overview should show:

- product name
- workspace name
- current stage
- next best action
- services in this workspace
- selected risks/fixes count
- team/participant count
- proof/check status

Internal workspace cards:

- Plan work
- Services
- Team
- Fixes
- Milestones
- Proof
- Handoff

Implementation note:

If a backend value still uses `Package`, `Planning`, or `Project`, translate it in UI copy only. Do not rename database concepts in this slice.

### Slice C: Scanner Risk Thread Backend

Goal:

Create a durable owner-facing risk lifecycle while preserving scanner evidence history.

Backend code areas:

- `backend/src/main/java/com/produs/scanner/ScannerRiskThread.java`
- `backend/src/main/java/com/produs/scanner/ScannerRiskThreadRepository.java`
- `backend/src/main/java/com/produs/scanner/ScannerRiskLifecycleService.java`
- `backend/src/main/java/com/produs/scanner/ScannerService.java`
- `backend/src/main/java/com/produs/scanner/ScannerController.java`
- `backend/src/main/java/com/produs/workspace/WorkspaceController.java`
- `backend/src/main/resources/db/changelog/`

Migration steps:

1. Add `scanner_risk_threads`.
2. Add unique key on `(product_profile_id, fingerprint)`.
3. Add indexes for `(product_profile_id, current_state)` and `(workspace_id, current_state)`.
4. Link optional current finding, first seen scan, last seen scan, last fixed scan, recommended service module, and workspace.
5. Do not mutate or delete historical normalized findings.

Lifecycle rules:

1. On scan completion, group run findings by stable fingerprint.
2. New fingerprint creates a new thread.
3. Existing fingerprint updates the same thread.
4. Previously fixed fingerprint that appears again becomes `RETURNED`.
5. Missing fingerprint in a successful comparable run becomes `FIXED_BY_LATEST_SCAN`.
6. Missing fingerprint in a failed or incomplete run does not become fixed.
7. Manual owner states such as accepted risk and false positive remain visible and do not vanish on rerun.

Backfill rule:

When a product has normalized findings but no risk threads, create threads from the latest finding per fingerprint. Backfill should not claim anything was fixed.

### Slice D: Current Risk And Comparison APIs

Goal:

Give the UI a clean current-risk contract and a scan old/new comparison contract.

Endpoints:

```text
GET /api/scanner/products/{productId}/risks/current
GET /api/workspaces/{workspaceId}/scanner/risks/current
GET /api/scanner/runs/{runId}/comparison
```

Current risk response shape:

```json
{
  "total": 3,
  "groups": [
    {
      "state": "STILL_OPEN",
      "count": 2,
      "risks": []
    }
  ]
}
```

Risk summary fields the UI needs:

- id
- product id
- workspace id
- title
- description
- severity
- current state
- source tool
- source rule id
- affected component
- readiness area
- business risk
- evidence required
- recommended module
- current finding id
- first/last scan ids

Comparison response groups:

- fixed
- still open
- newly seen
- returned
- incomplete/needs proof

Acceptance:

- Product Scanners page no longer counts historical findings as current risks.
- Workspace Fixes page shows only selected workspace risks.
- Raw proof remains available as history.

### Slice E: Assign Risk To Workspace

Goal:

Let product scanner risks become workspace work.

Endpoint:

```text
POST /api/scanner/risks/{riskThreadId}/assign-workspace
```

Request:

```json
{
  "workspaceId": "..."
}
```

Backend behavior:

1. Validate the actor can write to the product/workspace.
2. Validate the workspace belongs to the same product.
3. Set risk thread workspace.
4. Keep recommended service module.
5. Do not mark `READY_TO_CHECK` until work/proof exists.
6. Do not delete or move historical normalized findings.

UI behavior:

- Product Scanners risk card shows `Add to workspace`.
- If one active workspace exists, use it as the default target.
- If multiple exist, ask the owner to choose.
- Workspace Fixes immediately shows the assigned risk.

### Slice F: Targeted Check Fixes

Goal:

Let the owner verify selected workspace fixes without rerunning everything by default.

Endpoint:

```text
POST /api/workspaces/{workspaceId}/scanner/check-fixes
```

Request:

```json
{
  "riskThreadIds": ["..."],
  "mode": "RELEVANT_TO_FIXES",
  "authorizationConfirmed": true
}
```

Tool choice algorithm:

1. Start from each selected `ScannerRiskThread`.
2. Prefer `currentFinding.toolRun.toolKey`.
3. Fallback to `currentFinding.sourceTool`.
4. Fallback to `ScannerRiskThread.sourceTool`.
5. Reuse the original scan source, branch, runtime target, image ref, and scan depth.
6. Include hints from source rule, affected component, package/path/image/url when available.
7. If a risk has no scanner source, return it as `needs proof` instead of silently faking scanner verification.
8. If selected risks need several tools, group runs by compatible target.
9. Full-suite mode must be an explicit secondary choice.

Store in `ScanRun.scanPlan`:

- intent
- mode
- workspace id
- risk thread ids
- finding ids
- baseline run ids
- tool keys
- target source/branch/runtime/image
- scope hints
- limitations

UI behavior:

- Workspace Fixes primary button: `Check fixes`.
- Preview before run:
  - tools to rerun
  - what risk each tool checks
  - baseline scan
  - any limitations
- After run:
  - show queued runs
  - show latest comparison when available

### Slice G: Services, Team, Milestones From Workspace

Goal:

Make workspace the place where startup owners adjust the work after scanner results.

Backend direction:

- Reuse cart/package APIs first where possible.
- Add workspace-specific service/team endpoints only where current APIs force confusing UI.
- A service added inside workspace should attach to the workspace plan.
- Adding a service can create or suggest a milestone.
- Adding a person should create/update `WorkspaceParticipant`.

Owner-visible actions:

- Add service
- Add expert
- Invite team
- Add milestone
- Attach proof

Avoid:

- change request
- resource allocation
- governance approval
- procurement language

### Slice H: Product Scanners UI Redefinition

Goal:

Make Scanners the product evidence and current launch-risk page.

First viewport:

- latest check time
- tools completed/failed
- current blockers
- fixed since last scan
- new/returned risks
- primary action: `Run scanners`

Secondary areas:

- current risks
- scan history
- proof library
- technical proof
- schedules

Important:

Proof and technical details should remain reachable, but current risk and what changed should lead.

### Slice I: Workspace Fixes UI Redefinition

Goal:

Make selected scanner risks feel like work inside the workspace.

Groups:

- Still open
- Ready to check
- Fixed
- Returned
- Needs proof

Each card:

- owner-language risk
- source proof
- recommended/selected service
- milestone
- person/team
- proof needed
- latest verification state

Primary action:

```text
Check fixes
```

Secondary action:

```text
Run full scanner suite instead
```

### Slice J: Cleanup And Compatibility

Goal:

Remove duplication only after the new path works.

Rules:

- Keep old URLs resolving.
- Hide/de-emphasize old Planning as a main nav item.
- Merge Action Plan ideas into Workspace Plan/Fixes where sensible.
- Keep product-level services only if they summarize product recommendations.
- Workspace services manage active work.
- Do not remove raw scanner proof pages until Scanners and Workspace Fixes are live verified.

### Slice K: Verification Order

Run local checks before deployment:

```text
mvn -q -DskipTests compile
mvn -q -Dtest=ScannerEvidenceIntegrationTest test
npm --prefix frontend run type-check
```

Targeted backend tests:

- first scan creates risk thread
- repeated fingerprint updates same thread
- fixed fingerprint leaves current blockers
- returned fingerprint becomes returned
- failed tool does not mark old risk fixed
- assign risk to workspace
- targeted check chooses the original scanner tool
- manual/AI-only risk asks for proof instead of pretending scanner verification

Targeted UI checks:

- Product Details
- Product Scanners
- Workspace Overview
- Workspace Fixes
- workspace targeted check preview
- mobile first viewport for each

Deployment batch rule:

Deploy after a coherent batch is ready, not after every small UI tweak. This keeps Coolify deployment time under control.

Screenshot rule:

Keep only the latest useful screenshots for review. Delete old screenshots that are no longer part of the current verification set.

## UX Rules For This Change

- Do not use enterprise language like `change request`, `scope governance`, or `resource allocation`.
- Use simple verbs: `Add service`, `Add expert`, `Invite team`, `Add milestone`, `Attach proof`.
- Every workspace view should answer what the owner can do next.
- Adding something inside workspace should explain the effect in one sentence.
- Scanner findings should not float in a separate scanner world. They should become fixes in the workspace.
- Scanner history should remain product-level and trustworthy.
- Scanner reruns should explain what changed, not just add more rows.
- Product scanner action should be `Run scanners`.
- Workspace verification action should be `Check fixes`.
- `Check fixes` should be targeted by default and full-suite only by explicit choice.
- If ProdUS cannot scanner-verify a selected risk, say that clearly and ask for proof or a relevant scan source.
- Services should feel like work to move the product forward, not shopping.
- Teams should feel like people helping this product, not marketplace inventory.
- Keep advanced proof and raw scanner details available, but not as the main path.

## Desired Owner Story

An owner should be able to say:

```text
I created a product.
ProdUS scanned it and found launch risks.
I opened the workspace.
I picked the services and people needed to fix the risks.
The workspace turned that into milestones.
The team attached proof.
I reviewed the result and prepared handoff.
```

That is the journey we should optimize for.

## First Implementation Slice

Recommended first slice:

Redefine the product workspace detail page into a true workspace home.

Scope:

- Keep APIs unchanged.
- Rename visible workspace labels.
- Make workspace overview state-aware.
- Show selected scanner risks as workspace fixes, not as raw scanner output.
- Add internal cards for:
  - Plan work
  - Services
  - Team
  - Fixes
  - Milestones
  - Proof
  - Handoff
- Replace generic `Next delivery action` with a specific next action.
- Remove or reduce side-rail launch noise on workspace pages.
- Keep current information reachable.
- Record the backend gap for scanner risk threads/current risk comparison before changing scan count behavior.

Why first:

It improves the mental model immediately before deeper backend changes.

## Open Product Decisions

- Should a product always have one default workspace?
- Should multiple workspaces be advanced-only, or visible when they exist?
- Should product-level Services remain separate after workspace services are added?
- Should Action Plan merge into Workspace Fixes?
- Should scanner risk threads be stored as a table or computed as a projection from normalized findings?
- Should `Check fixes` rerun the full suite or only tools relevant to selected workspace risks?
- Should existing Planning URL remain as a compatibility route only?

Default recommendation:

- Yes, one default workspace per product for most startup users.
- Multiple workspaces should be supported, but not emphasized.
- Product Details should summarize services; Workspace should manage services.
- Action Plan should gradually merge into Workspace Fixes.
- Store scanner risk threads durably; do not compute everything from raw findings on every page load.
- `Check fixes` should default to relevant tools, with an option to run the full scanner suite.
- Keep old routes for compatibility while changing the visible journey.
