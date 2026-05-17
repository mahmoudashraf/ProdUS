# Sequence 04 - Scanner Evidence Foundation

Date: 2026-05-17

Status: implemented - scanner evidence domain, uploads, findings, and review APIs

## Objective

Add the backend and UI foundation for scanner and CI evidence without yet running hosted scanner workers. This establishes the product data model needed for AI to explain real evidence safely.

CI evidence upload comes first because it lets teams and owners supply scanner output while source code remains in the customer environment.

## BRD Requirements Considered

This sequence implements the data and API foundation from `docs/planning/Scanners-AI-integration/integration_brd.md`.

Primary BRD sections:

- Section 8.2, Rescan and Evidence Review Cycle.
- Section 10, Unified Finding and Evidence Model.
- Section 12, requirements `FR-NORM-*`, `FR-EVID-*`, `FR-SEC-001`, and `FR-OP-001`.
- Section 14, business rules for secret display, critical finding resolution, and risk acceptance.
- Section 16, security, privacy, redaction, and retention requirements.
- Section 18.1, scanner/evidence API endpoint map.
- Section 19, milestone acceptance and evidence rules.
- Section 20, `scan_runs`, `tool_runs`, `findings`, and `evidence_items` data model.
- Section 24, acceptance criteria for normalization, evidence workflow, and security.

Design commitment:

- Evidence and findings are first-class productization records.
- Raw scanner artifacts stay restricted.
- AI receives redacted summaries and source references, not raw artifacts or secrets.

## In Scope

- Scan source model.
- Scan run model.
- Tool run model.
- Evidence item model.
- Scanner artifact metadata.
- SARIF and simple JSON upload endpoint.
- Redaction status.
- Finding normalization skeleton.
- MCP read tools for scan status and finding inspection after APIs exist.

Implemented:

- Scanner domain models exist for scan sources, scan runs, tool runs, normalized findings, scanner evidence items, scanner jobs, and import runs.
- Owner/team/admin APIs enforce product/workspace authorization for scanner summaries, scan sources, CI/manual evidence upload, finding updates, risk acceptance, false positive marking, and rescan/cancel operations.
- Uploaded and imported evidence is normalized into safe findings/evidence summaries instead of exposing raw artifact content to AI/UI surfaces.
- Findings can be mapped to recommended lifecycle services and reviewed with explicit statuses.
- MCP read/mutation tools now cover scan status, finding inspection, evidence listing, CI evidence upload, and milestone evidence review.

## Out Of Scope

- Hosted repository cloning.
- Scanner worker execution.
- Runtime URL scans.
- Active DAST.
- Real LoomAI interpretation.

## Backend Data Model

### ScanSource

Represents a source of evidence.

Fields:

- id
- owner/organization
- product profile
- workspace optional
- provider type: `CI_UPLOAD`, `GITHUB`, `GITLAB`, `RUNTIME_URL`, `EXTERNAL_TOOL`
- display name
- external reference
- authorization status
- scope note
- created by
- created at

### ScanRun

Represents one scan or evidence ingestion run.

Fields:

- id
- scan source
- product profile
- workspace optional
- trigger type: `MANUAL_UPLOAD`, `CI_UPLOAD`, `SCHEDULED`, `HOSTED_SCAN`, `EXTERNAL_IMPORT`
- status: `QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELED`
- depth: `CI_EVIDENCE`, `SAFE_STATIC`, `RUNTIME_BASELINE`, `DEEP_REVIEW`
- started at
- completed at
- requested by
- failure summary

### ToolRun

Represents one tool result within a scan run.

Fields:

- id
- scan run
- tool name
- tool version
- status
- started at
- completed at
- raw artifact ref
- normalized count
- error summary

### EvidenceItem

Represents safe evidence available to productization workflows.

Fields:

- id
- product profile
- workspace optional
- milestone optional
- criterion optional
- finding optional
- scan run optional
- tool run optional
- evidence type
- source
- title
- summary
- artifact ref
- redaction status
- confidence level
- created by

### NormalizedFinding

Either extend `ProductFinding` or add scanner-specific finding records that map into `ProductFinding`.

Minimum fields:

- id
- product profile
- diagnosis optional
- scan run
- tool run
- fingerprint
- source tool
- source rule/id
- title
- description
- severity
- status
- affected component/path
- evidence item
- recommended service module
- confidence basis

## API Implementation

Suggested endpoints:

```text
POST /api/scanner/sources
GET /api/scanner/sources?productId=
POST /api/scanner/runs/ci-upload
GET /api/scanner/runs/{runId}
GET /api/scanner/runs/{runId}/tools
GET /api/scanner/runs/{runId}/findings
GET /api/scanner/findings/{findingId}
PUT /api/scanner/findings/{findingId}/status
GET /api/evidence-items?productId=&workspaceId=&milestoneId=&findingId=
```

CI upload request:

- product ID required
- workspace ID optional
- tool name required
- format: `SARIF`, `JSON`, `LOG`, `TEXT`
- artifact file
- metadata JSON optional

## Normalization

Initial normalizers:

- SARIF parser.
- Generic JSON parser for simple arrays/objects.
- Log/text summary record for non-parseable artifacts.

Normalization rules:

- Generate stable fingerprint from tool, rule ID, path/component, and normalized title.
- Normalize severity into ProdUS severity.
- Redact secrets and token-like values before storing display text.
- Preserve raw artifact as restricted object storage reference, not public UI text.
- Map findings to service modules using existing catalog stable codes/rules.

## Frontend Implementation

Add UI surfaces:

- Product evidence center.
- Scan run detail.
- CI evidence upload.
- Finding list.
- Finding detail.
- Evidence item detail.

Implementation guidance:

- Use Sequence 05B as the owner/team/admin Studio UI guide for these surfaces.
- Follow `docs/planning/Scanners-AI-integration/INTEGRATION_LAYER_UI_DESIGN.md` for evidence center, finding detail, milestone review, scan report modal, and mobile evidence patterns.
- Follow `docs/UI-Design-Prompot.md` for Apple-like light visual treatment, spacing, typography, cards, status chips, and button polish.
- Every enabled upload, attach, inspect, filter, or status action must call a real backend API from this sequence.
- Missing scanner/backend support must render as a disabled state with a concise reason, not as a dead button.

UI requirements:

- Clear source, timestamp, tool, severity, confidence, and recommended service.
- No raw secret display.
- Findings grouped by service impact, not only scanner tool.
- Actions connect findings to service plan/package decisions.

## MCP/AI Support

After APIs exist, add read-only MCP tools first:

- `produs.scan.status`
- `produs.finding.inspect`
- `produs.evidence.list`

Mutating MCP additions later:

- `produs.evidence.upload_ci_result`
- `produs.finding.accept_risk`

AI can explain:

- what a finding means
- what evidence supports it
- what service module addresses it
- what is missing before a milestone can pass

AI cannot:

- mark high-risk finding resolved without evidence
- accept risk without human confirmation and backend policy
- certify security/compliance

## Security Requirements

- CI upload must require authenticated owner/team/admin context.
- Artifact download must use existing signed URL pattern with authorization.
- Raw artifacts must not be bulk-indexed into LoomAI.
- Redacted summaries only for AI context.
- Audit all uploads, status changes, and risk acceptance.
- Retain source references for traceability.

## Tests

Backend:

- CI upload creates scan run, tool run, evidence item, and normalized findings.
- SARIF parser handles valid SARIF.
- Invalid SARIF records failed tool run with safe error.
- Secret-like values are redacted in display fields.
- Owner/team/admin authorization boundaries hold.
- Finding fingerprint is stable.

Frontend:

- Upload states.
- Scan run detail empty/error/loading states.
- Finding list filters.
- Mobile evidence view.

## Exit Criteria

- Product can receive CI evidence upload.
- Evidence is attached to product/workspace context.
- Normalized findings are queryable.
- Findings can map to service modules.
- Assistant mock can explain uploaded evidence without real LoomAI.

## Production Considerations

- Define retention policy before storing large raw artifacts.
- Use object storage lifecycle rules.
- Add per-file size limits.
- Add allowed content types.
- Add malware scanning later if file uploads broaden.
