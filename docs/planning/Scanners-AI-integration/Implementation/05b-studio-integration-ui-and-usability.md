# Sequence 05B - Studio Integration UI And Usability

Date: 2026-05-17

Status: implemented - Studio scanner workflow, workspace evidence upload, and admin operations UI

## Objective

Implement the ProdUS Studio integration-layer UI from the scanner, evidence, package, milestone, workspace, and handoff design documents as a coherent product workflow.

This sequence makes the scanner/evidence capability usable. It must not become a generic security dashboard. The UI should keep the owner focused on productization decisions, service plans, evidence, milestones, and production readiness.

## Implementation Update - 2026-05-17

Implemented full-stack Studio usability coverage for the scanner/evidence path:

- Added backend admin operations data to `/api/scanner/admin/health`:
  - recent scanner jobs
  - linked scan run details
  - recent external import runs
  - admin-only access enforcement
- Added backend integration test coverage for admin health authorization and recent import visibility.
- Reworked the owner Studio scanner section into a productization workflow:
  - visible `Connect -> Scan -> Findings -> Services -> Workspace -> Evidence -> Handoff` chain
  - source connector cards with authorization status and real disconnect actions
  - evidence center with filters for all evidence, finding-linked evidence, milestone-linked evidence, and redacted evidence
  - artifact open action wired to stored artifact URLs when present
  - storage-key copy action for audit support when present
  - finding detail panel with affected area, source rule, linked evidence, and evidence open actions
  - finding-to-service actions wired to the draft project cart
  - stable disabled states when evidence, artifact links, or required risk-review data are missing
- Added team/workspace scanner evidence upload:
  - real `/api/scanner/runs/ci-upload` mutation
  - selected workspace and milestone mapping
  - scanner evidence history loaded from `/api/scanner/evidence?workspaceId=...`
  - upload state tied back into workspace governance refresh
- Expanded the admin scanner operations UI:
  - scanner tool health remains visible
  - recent scanner jobs show status, attempts, linked runs, failure summaries
  - retry action creates a real rescan from failed/canceled runs
  - cancel action calls the real scan cancel endpoint for queued/running runs
  - recent imports show provider, method, requester, imported count, failures, and replay guidance for customer-owned failed payloads
- Kept AI surfaces out of disallowed community/profile/team-creation paths. The UI remains scanner/product/project scoped.

Verification performed:

- `mvn -q -Dtest=ScannerEvidenceIntegrationTest#externalGithubCodeScanningImportCreatesImportRunAndNormalizedFinding test`
- `npm run type-check`

## BRD Requirements Considered

This sequence implements the scanner-related UI and workflow requirements from `docs/planning/Scanners-AI-integration/integration_brd.md`.

Primary BRD sections:

- Section 8, scan lifecycle and evidence review cycle.
- Section 10, unified finding and evidence model as displayed in UI.
- Section 11, finding-to-service mapping as the owner-facing decision layer.
- Section 12, requirements for repo selection, permission visibility, scan status, package builder, evidence review, and admin operations.
- Section 14, business rules for critical finding status, risk acceptance, hard dependencies, and AI boundaries.
- Section 18.2, user-facing screens impacted by the integration layer.
- Section 19, milestone acceptance and evidence rules.
- Section 21, reporting and metrics surfaced to operators.
- Section 24, acceptance criteria for repo integration, scanner execution visibility, service mapping, evidence workflow, runtime scan authorization, and admin operations.

Design commitment:

- UI never presents scanners as the product. Scanners feed diagnosis, package, milestone, workspace, and handoff decisions.
- Enabled controls must call real backend APIs.
- Disabled controls must explain the missing authorization, missing evidence, missing backend support, or policy restriction.

## Source Design Coverage

This sequence explicitly uses `docs/planning/Scanners-AI-integration/INTEGRATION_LAYER_UI_DESIGN.md` as the Studio UI implementation guide and `docs/UI-Design-Prompot.md` as the Apple-like visual quality guide.

The integration UI design guide is the source of truth for these screens and shared patterns:

- Products Overview.
- Connect Product wizard.
- Diagnosis Dashboard.
- Finding Detail.
- Package Builder.
- Milestone Review.
- Evidence Center.
- Workspace Overview.
- Handoff Readiness.
- Admin Integration Health.
- CI Evidence Upload for team view.
- Shared Scan Report modal.
- Rescan Comparison view.
- Mobile Diagnosis view.
- Mobile Milestone Review view.
- Studio sidebar navigation.
- Severity chips.
- Finding status transitions.
- Scan progress animation.
- Health score gauge.
- Before/after comparison.
- Empty states for no products, clean scans, and no evidence.

## Apple-Like Studio Design Standard

The Studio scanner/evidence UI must look and behave like a premium Apple-inspired SaaS product, not an internal scanner console.

Required visual qualities:

- light-mode white canvas
- calm page hierarchy
- generous but not wasteful spacing
- system font stack or existing app font stack
- 8px card radius unless the existing component library defines otherwise
- soft shadows and hairline borders
- restrained pastel accents for service, severity, health, and status categories
- clear iconography from the existing frontend icon/component system
- consistent action sizing and placement
- no dense spreadsheet-like layouts for owner workflows
- no decorative clutter, gradient blobs, or fake marketing text inside product screens

Required usability qualities:

- every primary screen shows the current product/workspace context
- every enabled button performs a real backend action, route transition, modal open, or persisted state change
- incomplete backend capabilities render as disabled controls with a concise reason
- scanner details are secondary to productization decisions
- owner views focus on product health, service/package decisions, milestone evidence, and handoff readiness
- team views focus on evidence submission, milestone status, comments, and delivery proof
- admin views focus on scan queues, connector failures, tool health, provider status, and audit signals
- mobile layouts avoid horizontal data tables for core workflows
- empty states provide one concrete next action

## In Scope

- Owner-facing Studio workflow from product connection to handoff readiness.
- Team-facing CI evidence upload and milestone evidence submission.
- Admin-facing integration health and scanner operations view.
- Mobile layouts for diagnosis and milestone review.
- Functional buttons wired to backend APIs.
- Empty, loading, error, unauthorized, and disabled states.
- Assistant mock placement only where it supports product/project/scanner decisions.

## Out Of Scope

- AI support for community, profile, team creation, invitations, or account settings.
- Marketing landing pages.
- Cosmetic-only mock screens with dead buttons.
- Security/compliance certification by AI.
- Deep scanner worker behavior already covered by Sequence 05.

## Navigation Model

Primary Studio routes should keep the product lifecycle unified:

```text
Studio
  Products
    Product Overview
    Connect Product
    Diagnosis
    Findings
    Package
    Workspace
    Evidence
    Milestones
    Handoff
  Admin
    Integration Health
```

Avoid scattering owner decisions across unrelated pages. Product context should remain visible through breadcrumbs, product selector, or sticky context header.

## Screen Requirements

### Products Overview

Purpose:

- Show products, health, scan status, active package/workspace, and recommended next action.

Required backend actions:

- create product
- open product
- connect source
- view diagnosis
- create/update package
- open workspace

### Connect Product Wizard

Purpose:

- Let an owner connect a repository, CI upload, runtime URL, or external scanner source.

Required backend actions:

- create scan source
- validate authorization scope
- submit CI evidence upload
- request safe static scan after explicit confirmation
- disconnect source

UX rules:

- Explain permissions plainly.
- Disable scan options that require missing authorization.
- Never expose tokens or raw secrets in UI text.

### Diagnosis Dashboard

Purpose:

- Convert scan and product evidence into understandable productization risk.

Required backend actions:

- list diagnosis
- list findings
- list evidence
- start rescan if allowed
- create service plan/package from findings

UI rules:

- Group findings by business/productization impact.
- Show evidence quality and confidence.
- Keep scanner tool names secondary.

### Finding Detail

Purpose:

- Explain a single finding, evidence basis, affected area, recommended service, and resolution path.

Required backend actions:

- inspect finding
- update finding status
- attach evidence
- accept risk only with policy-confirmed reason
- map finding to service module
- open related package/milestone

Disabled states:

- Critical risk acceptance disabled without approver/reason/review date.
- Resolved disabled without evidence or rescan support.

### Package Builder

Purpose:

- Build or adjust the productization package from selected services, findings, dependencies, and milestones.

Required backend actions:

- add/remove service module
- validate package dependencies
- update budget/timeline
- generate milestone plan through deterministic/provider contract
- create project workspace

UX rules:

- Service dependency conflicts must be visible before workspace creation.
- Button labels must describe the outcome, such as `Create Workspace`, `Add Service`, `Review Package`, or `Update Plan`.

### Milestone Review

Purpose:

- Let owners and teams evaluate acceptance criteria against evidence.

Required backend actions:

- list milestone criteria
- upload/attach evidence
- run automated check where available
- request changes
- approve milestone only through backend policy
- record decision and comment

AI boundary:

- AI may summarize readiness and missing evidence.
- AI cannot approve a milestone.

### Evidence Center

Purpose:

- Give a traceable place to inspect all product/workspace/milestone evidence.

Required backend actions:

- filter evidence by product/workspace/milestone/finding/source
- upload CI evidence
- open redacted evidence detail
- request signed artifact access through authorized backend path

UI rules:

- Redacted summary shown by default.
- Raw artifact access is explicit and permissioned.

### Workspace Overview

Purpose:

- Show active delivery progress, blockers, milestones, evidence, participants, and support handoff state.

Required backend actions:

- update deliverable status
- attach evidence
- open milestone review
- create support request
- log decision/comment

UX rules:

- No wide, sparse forms.
- Primary next action should be visible.
- Project context remains at the top of the screen.

### Handoff Readiness

Purpose:

- Verify operational readiness before product handoff.

Required backend actions:

- list handoff criteria
- attach required evidence
- mark handoff item ready
- request changes
- finalize handoff only after backend checks pass

AI boundary:

- AI may identify missing proof.
- AI cannot certify production readiness.

### Admin Integration Health

Purpose:

- Monitor scanner, import, MCP, and AI-provider health.

Required backend actions:

- list scanner jobs
- list failed imports
- inspect provider status
- retry failed import/job
- cancel stuck job
- view audit events

UX rules:

- This is admin-only.
- Show operational state, queue depth, failures, latency, and last successful run.

### CI Evidence Upload Team View

Purpose:

- Let teams upload evidence against workspace milestones without needing hosted repo access.

Required backend actions:

- upload CI evidence
- map evidence to milestone/criterion/finding
- list upload history
- surface parsing/redaction result

## Shared Components

Build or standardize:

- product context header
- health score gauge
- evidence quality badge
- severity chip
- finding status chip
- scan progress timeline
- source connector card
- service impact card
- action confirmation sheet
- scan report modal
- rescan comparison panel
- empty state panel
- mobile bottom action bar for primary product action

All buttons must have stable sizing, clear iconography, and either a real backend effect or a disabled state with a concise reason.

## Frontend Implementation

- Use existing frontend component library before adding new primitives.
- Keep route-level pages thin; put reusable Studio components in the local component library.
- Use typed API clients.
- Keep optimistic updates only where backend side effects are reversible.
- Use server data refresh after mutations that affect package, milestone, evidence, or scan state.
- Preserve keyboard and screen-reader behavior for dialogs and status controls.

## Backend/API Dependencies

This UI depends on APIs from Sequences 04, 05, and 05A:

- scan sources
- scan runs
- tool runs
- normalized findings
- evidence items
- external imports
- CI uploads
- package validation
- workspace milestones
- handoff checks
- admin health/status endpoints

Any missing API must be implemented in the backend before enabling the corresponding UI action.

## MCP/AI Placement

Assistant placement is allowed on:

- Diagnosis Dashboard.
- Finding Detail.
- Package Builder.
- Workspace Overview.
- Milestone Review.
- Handoff Readiness.

Assistant placement is not allowed on:

- account settings
- profile editing
- team creation
- invite flows
- community messaging
- admin commercial operations

Assistant UI must show source basis and must not imply real scanner or LoomAI execution unless recorded.

## Mobile Requirements

- Product diagnosis must collapse into summary, findings, evidence, and actions tabs.
- Milestone review must keep criteria readable without horizontal scrolling.
- Tables convert to stacked rows or cards.
- Primary actions stay reachable but do not cover evidence text.
- Touch targets remain consistent.

## Empty And Error States

Required states:

- no products
- no connected source
- no scan yet
- scan running
- scan failed
- clean scan/no findings
- no evidence
- unauthorized source
- missing backend action
- LoomAI unavailable
- scanner worker unavailable

Empty states should offer one concrete next action. They should not include generic explanatory filler.

## Tests

Frontend:

- route rendering for every Studio screen
- button/action wiring for every enabled action
- disabled states for missing authorization or missing backend support
- mobile viewport checks for diagnosis and milestone review
- empty/error/loading state snapshots
- package builder dependency conflict flow
- evidence upload flow
- finding status policy flow
- rescan comparison flow
- admin retry/cancel controls

Backend integration:

- UI flows use real APIs from Sequences 04/05/05A.
- Mutations create audit records where required.
- Unauthorized users cannot view or mutate another owner's product/scanner/evidence records.

Manual verification:

```bash
cd frontend
npm run lint
npm run build
```

Then run the app and verify:

- desktop owner diagnosis-to-package flow
- desktop workspace milestone review flow
- desktop evidence center upload flow
- desktop admin integration health flow
- mobile diagnosis flow
- mobile milestone review flow

## Exit Criteria

- Every screen from the integration UI design is implemented or intentionally disabled behind an unavailable-backend state.
- Every visible enabled button has a backend effect.
- Owner flow can move from connected product to diagnosis, package, workspace, milestone review, evidence, and handoff.
- Team flow can submit milestone/CI evidence.
- Admin can inspect scanner/import/MCP/provider health.
- Mobile flows are usable.
- Assistant mock appears only inside approved product/project/scanner contexts.

## Production Considerations

- Add analytics for productization funnel steps, not raw scanner vanity metrics.
- Track error rate per UI action.
- Keep artifact links short-lived and authorized.
- Add accessibility checks before production rollout.
- Keep this UI feature-flagged until scanner backend workflows are stable.
