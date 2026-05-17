# Sequence 05A - External Imports And CI Templates

Date: 2026-05-17

Status: implemented - external import foundation and customer-owned CI templates

Implementation update on 2026-05-17:

- Added `scanner_import_runs` as the import ledger for provider, method, source, scan run, artifact, counts, failure state, and audit traceability.
- Added external import APIs for customer-owned scanner/provider payloads.
- Added provider-aware normalization for GitHub Code Scanning, GitHub Dependabot, GitHub Secret Scanning, GitLab Security, Snyk, SonarQube/SonarCloud, Semgrep Platform, SARIF, and generic JSON.
- Added source disconnect API so owners can revoke scanner/import sources without deleting evidence history.
- Added product-scoped CI template generation for GitHub Actions, GitLab CI, and generic curl upload flows.
- Extended Studio scanner UI with external import form, import-run visibility, source disconnect action, and template generation/copy flow.
- Extended product scanner summary to include recent import runs.
- Verified with integration tests for GitHub Code Scanning import, import-run listing, summary counts, CI template generation, and source disconnect.

## Objective

Add customer-owned evidence paths and external tool imports so ProdUS can ingest scan/security/quality results without always running hosted scanners.

This reduces privacy concerns, controls compute cost, supports enterprise customers, and keeps ProdUS focused on productization decisions rather than becoming only a scanner runner.

## BRD Requirements Considered

This sequence covers the external import and customer-owned CI evidence paths from `docs/planning/Scanners-AI-integration/integration_brd.md`.

Primary BRD sections:

- Section 6, Integration Execution Modes for external imports and CI evidence.
- Section 9.3, freemium, paid, and customer-owned integrations.
- Section 10, unified finding and evidence model.
- Section 12, requirements `FR-CONN-002`, `FR-TOOL-008`, `FR-TOOL-009`, `FR-EVID-*`, `FR-SEC-*`, and `FR-OP-*`.
- Section 14, business rules for external tool source tagging and evidence basis.
- Section 17, external tool connector requirements for GitHub, GitLab, Snyk, SonarQube/SonarCloud, Semgrep, and later cloud providers.
- Section 18.1, API endpoint map for integrations, findings, evidence, and CI upload.
- Section 22.4, external imports and CI evidence delivery path.
- Section 23, risks around privacy concerns, licensing, compute cost, and scanner noise.
- Section 24, acceptance criteria for evidence workflow, normalization, and security.

Design commitment:

- Customer-owned scanners remain customer-owned.
- ProdUS imports normalized evidence and does not become a cost sink for every third-party scanner.
- Every imported result records source, timestamp, import method, and confidence basis.

## In Scope

- GitHub code scanning, Dependabot, secret scanning imports where available.
- GitLab security result imports.
- Snyk import.
- SonarQube/SonarCloud import.
- Semgrep platform import.
- GitHub Actions CI evidence template.
- GitLab CI evidence template.
- SARIF/JSON upload compatibility.
- External finding normalization into the same finding lifecycle.

## Out Of Scope

- Customer-owned cloud credentials for direct cloud posture in this slice.
- Mobile scanning.
- Broad production DAST.
- Paid third-party API billing abstraction.
- AI approval of imported findings.

## Import Principles

- External tools are evidence sources, not final business logic.
- Customer-owned accounts are preferred for paid tools.
- Every imported finding must map to source, timestamp, provider, rule/reference, and original artifact reference.
- Imported results must normalize into the same severity, confidence, fingerprint, status, evidence, and service-mapping model as hosted scans.
- Imports must be idempotent.

## GitHub Imports

Sources:

- code scanning alerts
- Dependabot alerts
- secret scanning alerts where permissioned
- workflow run status
- SARIF upload references

Requirements:

- GitHub App installation.
- Repository selection.
- Branch/default branch tracking.
- Webhooks for installation, push, pull request, and workflow run events.
- Disconnect/revoke flow.
- Least-privilege permissions.

## GitLab Imports

Sources:

- GitLab SAST results
- security dashboard results
- CI job artifacts
- project pipeline status

Requirements:

- OAuth/app integration or project token model.
- GitLab CI upload template.
- Project-level permissions.
- Disconnect/revoke flow.

## Snyk Imports

Sources:

- Open Source findings
- Code findings
- Container findings
- IaC findings
- license findings where relevant

Rules:

- Customer connects their own Snyk account.
- Map Snyk issues to dependency review, security hardening, patch management, and licensing review service modules.
- Do not store customer Snyk tokens in logs or AI context.

## SonarQube/SonarCloud Imports

Sources:

- quality gate status
- bugs
- vulnerabilities
- security hotspots
- code smells
- maintainability signals
- test coverage

Rules:

- Map quality and maintainability findings to code cleanup, AI-built app cleanup, test coverage, and refactor services.
- Use quality gates as milestone evidence where appropriate.

## Semgrep Platform Imports

Sources:

- Semgrep project findings
- rule metadata
- severity/confidence
- custom productization rules

Rules:

- Semgrep CLI remains part of hosted scanner execution.
- Platform import is for customers already using Semgrep workflows.

## CI Templates

Provide templates for:

- GitHub Actions
- GitLab CI

Template goals:

- Run customer-owned scanner commands.
- Upload SARIF/JSON/log artifacts to ProdUS.
- Include product/workspace/milestone identifiers.
- Include tool metadata.
- Avoid source upload.
- Fail safely if ProdUS upload token is missing.

Suggested endpoint:

```text
POST /api/scanner/runs/ci-upload
```

Authentication options:

- short-lived CI upload token
- workspace-scoped upload token
- signed upload URL
- user-generated token with explicit scope

## Backend Implementation

Add connector/import adapters:

```text
GitHubImportAdapter
GitLabImportAdapter
SnykImportAdapter
SonarImportAdapter
SemgrepImportAdapter
```

Each adapter should:

- fetch/import provider records
- normalize source IDs
- create/update tool runs
- create/update normalized findings
- attach evidence items
- record sync status
- record errors safely

Implemented APIs:

- `POST /api/scanner/imports/external`
- `GET /api/scanner/imports`
- `GET /api/scanner/ci-templates/{type}`
- `POST /api/scanner/sources/{sourceId}/disconnect`

Implemented storage:

- `scanner_import_runs` records external import execution, provider, method, counts, artifact refs, source timestamp, and error state.
- External imports create normal `scan_runs`, `tool_runs`, `scanner_evidence_items`, and `normalized_findings` records.

Implemented provider payload paths:

- GitHub Code Scanning JSON.
- GitHub Dependabot JSON.
- GitHub Secret Scanning JSON.
- GitLab security JSON.
- Snyk JSON.
- SonarQube/SonarCloud issues JSON.
- Semgrep Platform JSON.
- SARIF.
- Generic scanner JSON.

Direct vendor API credential polling remains behind the same import-run/source contract and must use customer-owned credentials, minimal scopes, token encryption, and signature verification before production use.

Add import run model if needed:

- id
- provider
- integration connection
- product/workspace
- status
- started/completed
- imported count
- skipped count
- error summary

## Frontend Implementation

Add connection/import management:

- external source cards
- connection status
- last import time
- import health
- manual sync button for authorized users
- provider-specific setup guidance
- CI template copy/download area

Implementation guidance:

- Use Sequence 05B as the Studio UI guide for import, CI evidence upload, evidence center, and admin health surfaces.
- Follow `docs/planning/Scanners-AI-integration/INTEGRATION_LAYER_UI_DESIGN.md` for CI Evidence Upload, Evidence Center, Admin Integration Health, and empty/error states.
- Follow `docs/UI-Design-Prompot.md` for Apple-like light styling, readable forms, consistent button sizing, and calm status treatment.
- Every enabled connect, disconnect, import, retry, upload, map, or view-artifact action must call a real backend API.
- Paid/customer-owned connectors must show clear ownership and permission states so users understand whether ProdUS is importing evidence or running scanners itself.

UI should keep imports subordinate to productization actions:

- show what service/milestone each imported finding affects
- show package impact
- show evidence status

## MCP/AI Support

Read-only first:

- list connected evidence sources
- get import status
- inspect imported finding

Mutating later:

- request external import sync with confirmation

AI can:

- explain imported findings
- map imported findings to services
- summarize CI evidence

AI cannot:

- connect external accounts
- store provider credentials
- certify imported tool results as complete security proof

## Security Requirements

- Encrypt external provider tokens.
- Never expose provider tokens to scanner logs or AI context.
- Provider-specific permissions must be minimal.
- Webhooks must verify signatures where available.
- Import jobs must be tenant/product scoped.
- External links should be shown only to authorized users.
- Imported secrets must be redacted.

## Tests

Backend:

- fixture imports for GitHub SARIF/code scanning.
- fixture imports for GitLab security JSON.
- fixture imports for Snyk JSON.
- fixture imports for Sonar quality gate.
- idempotent re-import.
- deleted/closed external finding updates status.
- token redaction in logs/output.

Frontend:

- connected/disconnected states.
- import error state.
- CI template display.
- manual sync disabled without permission.

## Exit Criteria

- CI templates can upload scanner evidence. Implemented.
- At least one GitHub import path works with fixtures. Implemented for GitHub Code Scanning.
- External imports normalize into same finding/evidence lifecycle. Implemented.
- Imported findings map to service modules. Implemented through the shared scanner recommendation mapper.
- AI/mock assistant can explain imported evidence without seeing provider secrets. Supported by source/finding/evidence summaries; AI action wiring remains governed by later sequences.

## Production Considerations

- Review external API rate limits.
- Add per-provider retry/backoff.
- Add provider status dashboard.
- Track sync latency and import failures.
- Prefer customer-owned paid tool accounts to avoid ProdUS absorbing third-party scanning costs.
