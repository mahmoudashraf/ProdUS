# Sequence 05 - Scanner Execution And Normalization

Date: 2026-05-17

Status: implemented - scanner execution foundation

Implementation update on 2026-05-17:

- Added DB-backed scanner jobs for hosted scan orchestration.
- Added hosted scan, cancel, rescan, run status, tool-run status, and admin scanner health APIs.
- Added configurable real scanner command execution. ProdUS does not synthesize scanner findings when binaries are missing; the run records a real failed or skipped tool state.
- Added clone cleanup, command timeouts, output size limits, log redaction, artifact storage, normalized findings, rescan fingerprint comparison, and audit events.
- Added Studio owner UI controls for source authorization, L1/L2/L3 scan depth, scanner tool selection, start/cancel/rescan, progress polling, and failure visibility.
- Added admin Scanner Operations UI for worker/scheduler status, queued/running jobs, and executable availability.
- Verified hosted scan behavior with integration tests using a local git repository and a configured scanner command fixture.

## Objective

Implement controlled scanner execution and robust normalization so ProdUS can generate evidence-backed findings from authorized repositories and runtime URLs.

ProdUS must remain a productization governance engine that uses scanners as evidence sources, not a generic scanner dashboard.

## BRD Requirements Considered

This sequence is the execution implementation for `docs/planning/Scanners-AI-integration/integration_brd.md`.

Primary BRD sections:

- Section 8.1, Standard Hosted Repo Scan.
- Section 8.2, Rescan and Evidence Review Cycle.
- Section 8.3, Scanner Depth Levels.
- Section 9, Tool Integration Catalog.
- Section 10, Unified Finding and Evidence Model.
- Section 11, Finding-to-Service Mapping.
- Section 12, requirements `FR-CONN-*`, `FR-SCAN-*`, `FR-TOOL-*`, `FR-NORM-*`, `FR-PKG-001`, `FR-SEC-*`, and `FR-OP-*`.
- Section 13, scanner reliability, scalability, privacy, auditability, and extensibility requirements.
- Section 14, business rules for scan safety, runtime authorization, critical finding resolution, and risk acceptance.
- Section 16, repo access, worker isolation, secret redaction, runtime scan authorization, and data retention.
- Section 21, scan completion, scan duration, false positive rate, and rescan improvement metrics.
- Section 23, risks around false positives, false negatives, privacy, runtime scan abuse, licensing, compute cost, and scanner-dashboard drift.
- Section 24, scanner execution, service mapping, runtime scan, and admin operations acceptance criteria.

Design commitment:

- L1 scans never execute arbitrary project scripts.
- Runtime URL scans require explicit target authorization.
- Scanner output is normalized evidence, not the final product decision.
- Findings must map into services, packages, milestones, and evidence review.

## In Scope

- Hosted safe static scan orchestration.
- Scan job queue contract.
- Worker execution contract.
- Tool run lifecycle.
- Safe static scanner pack.
- Runtime URL baseline scan behind explicit authorization.
- Finding normalization.
- Rescan comparison.
- Admin scanner health.

## Out Of Scope

- Deep builds/tests that execute arbitrary application scripts by default.
- Active production DAST by default.
- Cloud provider credential scans.
- Mobile scanner integration.
- AI certification of security/compliance.

## Scanner Levels

### Level 1 - Safe Static Scan

Allowed:

- inspect files
- inspect manifests
- inspect lockfiles
- inspect config files
- run scanner CLIs that do not execute project scripts

Initial tools:

- Gitleaks
- OSV-Scanner
- Semgrep
- Trivy filesystem/config
- Checkov when IaC files are present

### Level 2 - Dependency And Container Evidence

Allowed after Level 1 is stable:

- SBOM generation/import
- container image scan if image ref is provided
- Syft SBOM generation
- Grype vulnerability scanning
- Trivy image scanning

### Level 3 - Runtime Baseline

Allowed only after explicit URL/domain authorization:

- Lighthouse
- OWASP ZAP baseline

No active/aggressive production scanning by default.

## Backend Implementation

### 1. Scan Orchestrator

Responsibilities:

- Validate authorization and scope.
- Create scan plan.
- Choose tools based on product metadata and repo files.
- Enqueue jobs.
- Track status transitions.
- Enforce timeout/retry policies.
- Prevent duplicate high-cost scans.

Implemented API:

- `POST /api/scanner/runs/hosted`
- `POST /api/scanner/runs/{runId}/cancel`
- `POST /api/scanner/runs/{runId}/rescan`
- `GET /api/scanner/admin/health`

Implemented queue:

- `scanner_jobs` stores queued/running/completed/failed/canceled hosted scan jobs.
- `scan_runs` stores depth, scan plan, branch, runtime URL, image reference, comparison run, and cancel request.
- `tool_runs` stores tool key, exit code, duration, log excerpt, artifact reference, and normalized count.

### 2. Worker Contract

Worker input:

- scan run ID
- tool list
- repository reference or artifact source
- scan depth
- timeouts
- network policy
- safe output location

Worker output:

- tool run statuses
- raw artifact refs
- logs with redaction
- normalized result payloads
- failure summaries

### 3. Repository Access

GitHub first:

- App/OAuth installation or equivalent least-privilege access.
- Repository metadata.
- Branch selection.
- Temporary clone token.
- Clone cleanup after scan.
- Disconnect/revoke flow.

GitLab later:

- Project-level token or app-based integration.
- CI evidence upload support.

### 4. Normalizers

Normalizers must produce one shared finding shape:

- source tool
- source rule
- severity
- title
- description
- affected path/component
- remediation text
- evidence reference
- fingerprint
- confidence
- recommended service module

Supported output formats:

- SARIF
- JSON
- plain text fallback

### 5. Finding Lifecycle

Statuses:

- open
- service selected
- in progress
- resolved
- accepted risk
- dismissed
- false positive

Rules:

- Critical findings cannot be marked resolved without rescan evidence or explicit risk acceptance.
- Risk acceptance requires approver, reason, review date, and affected package/milestone.
- Dismissal requires note.

## Frontend Implementation

Add or complete:

- Connect source screen.
- Scan scope confirmation.
- Scan progress timeline.
- Tool run detail.
- Findings dashboard.
- Finding detail drawer/page.
- Service mapping view.
- Rescan comparison.
- Admin scanner health view.

Implementation guidance:

- Use Sequence 05B as the detailed Studio UI plan for these screens.
- Follow `docs/planning/Scanners-AI-integration/INTEGRATION_LAYER_UI_DESIGN.md` for products overview, connect product wizard, diagnosis dashboard, finding detail, rescan comparison, admin integration health, and mobile diagnosis/milestone patterns.
- Follow `docs/UI-Design-Prompot.md` for Apple-like light visual style, clear hierarchy, consistent controls, and polished responsive behavior.
- Every enabled scan, cancel, rescan, finding status, accept-risk, service-map, or admin retry action must call a real backend API.
- Unsafe or unavailable scan levels must be disabled with the exact missing authorization, consent, or backend capability.

Design rules:

- Findings are grouped by productization impact, not just scanner tool.
- Show confidence and evidence source.
- Use clear disabled states for unavailable scan levels.
- Keep scanner noise subordinate to recommended productization actions.

## MCP/AI Support

Add tools after backend APIs exist:

- `produs.scan.start`
- `produs.scan.status`
- `produs.scan.cancel`
- `produs.finding.inspect`
- `produs.finding.accept_risk`

AI can:

- explain findings
- explain missing evidence
- map findings to services
- draft package rationale
- suggest milestone evidence requirements

AI cannot:

- run scans without explicit user confirmation
- scan unauthorized URLs
- accept critical risk without backend policy and human confirmation
- certify compliance/security

## Security Requirements

- Least-privilege repository permissions.
- Temporary tokens only.
- Clone cleanup.
- Isolated workers.
- Resource limits.
- Network restrictions by scan level.
- Secret redaction in logs and findings.
- Signed object storage access for artifacts.
- Audit repo access, scan start, scan completion, failures, and finding state changes.

## Tests

Backend:

- Scan request authorization.
- Scan depth consent.
- Tool selection from repo metadata.
- Normalizer fixtures for each tool.
- Secret redaction.
- Fingerprint stability across rescans.
- Resolved/accepted-risk policy checks.
- Admin scan health summary.

Worker:

- Timeout behavior.
- Failed tool behavior.
- Cleanup behavior.
- Artifact upload behavior.

Frontend:

- Scan progress states.
- Finding filters.
- Empty/no-access states.
- Mobile scan result view.

## Exit Criteria

- Owner can authorize a safe static scan. Implemented.
- System runs scanner jobs asynchronously through a DB-backed scheduler/worker. Implemented.
- Tool runs produce normalized findings. Implemented for configured scanner outputs.
- Findings map to service modules and package decisions. Implemented through existing catalog mapping heuristics.
- Rescan can show fixed/still-open/new findings. Implemented for new/open/regressed fingerprint status.
- Admin can see scanner health. Implemented.

## Production Considerations

- Run workers separately from API process.
- Use queue-backed execution.
- Keep worker permissions minimal.
- Control scanner image versions.
- Track scan cost and duration.
- Add abuse detection and rate limits.
