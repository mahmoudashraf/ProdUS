# Scanners And LoomAI Implementation Sequence

Date: 2026-05-17

Status: implemented - scanner execution, Studio UI, MCP allowlist, LoomAI bridge, scanner BRD gap closure, and readiness gates

## Purpose

This folder contains the full implementation sequence for ProdUS AI enablement around productization, project workspaces, scanner evidence, findings, package governance, milestone review, and handoff readiness.

The sequence assumes ProdUS remains the system of record. LoomAI is an optional AI runtime/provider and must be integrated through ProdUS-owned contracts, MCP allowlists, deterministic fallback paths, and auditable backend APIs.

## Source Documents And Design Authority

All implementation sequences in this folder must consider the source documents in `docs/planning/Scanners-AI-integration/`:

- `integration_brd.md` is the scanner/evidence/integration requirements baseline.
- `INTEGRATION_LAYER_UI_DESIGN.md` is the primary UI implementation guide for Studio scanner, evidence, package, milestone, workspace, handoff, and admin screens.
- `PRODOPS_NETWORK_CUSTOM_AI_DEPLOYMENT_PROPOSAL.md` defines the ProdUS-specific LoomAI fit, communication contract, data/indexing strategy, schemas, and missing implementation work.
- `EXTERNAL_CUSTOMER_AI_DEPLOYMENT_PROPOSAL.md` defines the broader LoomAI runtime, session, retrieval, action, MCP, and deployment communication model.
- `LOOMAI_DEPLOYMENT_CONFIGURATION_BRD.md` defines the LoomAI-side staging/production deployment configuration required from the integration team.
- `2026-05-12-mcp-server-ai-integration.md` defines the MCP tool/resource/prompt baseline and security requirements.
- `2026-05-11-pending-production-readiness.md` defines production-readiness gates that remain relevant to scanner and AI rollout.

UI implementation must also follow `docs/UI-Design-Prompot.md` for the Apple-like visual standard: light canvas, calm spacing, refined typography, soft borders/shadows, restrained pastel service identity, consistent controls, and polished responsive behavior.

If a sequence creates or changes UI, the implementation must reconcile both UI sources:

- Use `INTEGRATION_LAYER_UI_DESIGN.md` for screen structure, workflow, interaction patterns, mobile adaptations, and scanner/evidence-specific components.
- Use `docs/UI-Design-Prompot.md` for visual quality, Apple-like SaaS styling, spacing, component polish, and service-card/category identity.

## Scope Boundary

AI support is limited to this core value chain:

```text
Product -> diagnosis -> scan/evidence -> findings -> service plan/package -> project workspace -> milestone review -> handoff readiness
```

AI is not used for:

- Creating teams.
- Inviting solo experts to teams.
- Accepting or rejecting team join requests.
- Editing team or expert profiles.
- Managing account settings.
- Sending community messages.
- Broad admin, commercial, or payment execution.

Team data is allowed only for package/workspace matching explanations, shortlist rationale, comparison, and productization risk context.

## Sequence Map

1. [Provider Contract And LoomAI Mock](./01-provider-contract-and-loomai-mock.md)
   - Formalize a ProdUS-owned AI provider contract.
   - Wire package governance to provider/fallback.
   - Add a local LoomAI mock and backend contract tests.

2. [MCP Productization Allowlist And Smoke](./02-mcp-productization-allowlist-and-smoke.md)
   - Add a LoomAI-specific MCP/action allowlist.
   - Verify productization tools through MCP.
   - Prove excluded team/profile/community actions are unavailable to the AI layer.

3. [Assistant Mock UX For Productization](./03-assistant-mock-ux-for-productization.md)
   - Add an AI-assistant-style UI mock grounded in real ProdUS data.
   - Show action previews only for allowed product/project/scanner flows.
   - Keep every button attached to a real backend action or disabled with a reason.

3A. [Knowledge Retrieval And Case Patterns](./03a-knowledge-retrieval-and-case-patterns.md)
   - Define safe knowledge records for LoomAI/RAG.
   - Add data-sync/export contracts for catalog, templates, rules, and anonymized case patterns.
   - Keep customer-owned/sensitive data behind live API/MCP lookup.

4. [Scanner Evidence Foundation](./04-scanner-evidence-foundation.md)
   - Add scanner/evidence domain models.
   - Add CI evidence upload first.
   - Store safe evidence references, raw artifact metadata, redaction state, and audit records.

5. [Scanner Execution And Normalization](./05-scanner-execution-and-normalization.md)
   - Add scan orchestration, tool runs, worker execution contracts, and normalizers.
   - Start with safe static scan depth and scanner output parsing.
   - Map normalized findings into productization services and milestones.
   - Status: implemented for DB-backed hosted execution, L1/L2/L3 command packs, cancel/rescan, admin health, Studio scan controls, and test coverage.

5A. [External Imports And CI Templates](./05a-external-imports-and-ci-templates.md)
   - Add GitHub/GitLab/Snyk/SonarQube/Semgrep import adapters.
   - Add GitHub Actions and GitLab CI templates for customer-owned scanning.
   - Normalize imported evidence into the same finding/evidence lifecycle.
   - Status: implemented for external provider payload imports, import-run ledger, CI template generation, source disconnect, Studio import UI, and tests.

5B. [Studio Integration UI And Usability](./05b-studio-integration-ui-and-usability.md)
   - Implement the Studio scanner/evidence/package/milestone/workspace UI from the design docs.
   - Wire every enabled button to a backend action or a clear disabled state.
   - Verify desktop and mobile usability for owner, team, and admin scanner flows.
   - Status: implemented for owner scanner workflow, evidence center, finding detail/service actions, workspace CI evidence upload, admin recent jobs/imports, retry/cancel operations, and tests.

6. [Real LoomAI Staging Integration](./06-real-loomai-staging-integration.md)
   - Replace mock-only behavior with a staging LoomAI integration.
   - Register approved MCP/actions/retrieval.
   - Validate auth, privacy, telemetry, and fallback behavior.

7. [Production Readiness And Operations](./07-production-readiness-and-operations.md)
   - Harden observability, dashboards, rate limits, data retention, and incident controls.
   - Verify production-like Postgres/Supabase/MCP/LoomAI paths.
   - Define release gates and rollback.

8. [BRD Gap Closure, Runtime Connectors, And Schedules](./08-brd-gap-closure-runtime-connectors-and-schedules.md)
   - Align the scanner BRD to the current implementation.
   - Add connector permission visibility, disconnect artifact deletion, persistent scan schedules, runtime authorization test coverage, and Studio schedule controls.
   - Keep external GitHub/GitLab app credentials and LoomAI deployment dependencies visible instead of treating them as implemented.

## Dependency Order

```text
01 Provider Contract
  -> 02 MCP Allowlist
    -> 03 Assistant Mock UX
      -> 03A Knowledge Retrieval And Case Patterns
        -> 04 Scanner Evidence Foundation
          -> 05 Scanner Execution And Normalization
            -> 05A External Imports And CI Templates
              -> 05B Studio Integration UI And Usability
                -> 06 Real LoomAI Staging Integration
                  -> 07 Production Readiness And Operations
                    -> 08 BRD Gap Closure, Runtime Connectors, And Schedules
```

Sequence 03A can run in parallel with Sequence 03 if the provider boundary and allowlist are stable. Sequence 04 can begin before Sequence 03 is visually complete if the backend team is available. Sequence 05B can run in parallel with backend scanner work, but each enabled UI action must wait for its backend API. Sequence 06 must not start until the provider contract, allowlist, retrieval boundaries, scanner/evidence data boundaries, and approved UI assistant placements are stable.

## Current Verified Baseline

Verified from code and tests:

- MCP gateway exists and is implemented in `mcp-server/`.
- MCP gateway exposes `/mcp` and `/health`.
- MCP forwards bearer token and request IDs to the backend.
- MCP has resources, prompts, and tools.
- MCP mutation tools require `confirm: true` and `reason`.
- Backend persists MCP invocation audit records.
- Backend has deterministic diagnosis, findings, criteria, evidence requirements, automated checks, reviews, handoff, health reviews, generic integration connections, and generic integration signals.
- Evidence attachments exist.
- `LoomAIProvider` is wired into package building through `PackageGovernanceProvider` and keeps deterministic fallback active.
- AI recommendations store provider name, provider request ID, fallback flag, fallback reason, confidence, rationale, and output JSON.
- MCP supports `PRODUS_MCP_TOOL_PROFILE=loomai-productization` and scanner/evidence tools for scan, finding, evidence, and milestone review workflows.
- Backend assistant broker endpoints provide session/query/suggestions with safe product/package/workspace/milestone/finding context.
- Admin LoomAI endpoints expose status, safe knowledge preview, and safe knowledge sync.
- Admin production-readiness endpoint reports database, auth, scanner, MCP, LoomAI, storage, webhook, CORS, and rate-limit gates without exposing secrets.
- Service catalog, package templates, dependency rules, and AI capability contracts are the first safe knowledge sources for retrieval/data sync.
- Scanner connector permissions, disconnect artifact deletion, and persistent scan schedules are implemented.
- Runtime URL scans require explicit authorization and are covered by backend integration tests.
- Product scanner summary includes sources, runs, findings, evidence, imports, schedules, counts, and readiness.
- Studio scanner UI includes permission explanation, authorized scan controls, CI upload, external imports, evidence center, schedule creation/pause/resume, and disconnect/delete controls.

Latest verification:

```bash
cd mcp-server && npm test && npm run type-check
cd backend && mvn -q clean -Dtest=LoomAIIntegrationControllerTest test
cd frontend && npm run type-check
cd backend && mvn -Dtest=ScannerEvidenceIntegrationTest test
cd frontend && npm run build
```

Most recent scanner verification on 2026-05-18:

- `cd backend && mvn -Dtest=ScannerEvidenceIntegrationTest test` passed with 7 tests, 0 failures.
- `cd frontend && npm run type-check` passed.
- `cd frontend && npm run build` passed.

## Scanner BRD Traceability

Scanner-related implementation must treat `docs/planning/Scanners-AI-integration/integration_brd.md` as a source requirement document, not only background reading.

The scanner sequences cover the BRD as follows:

| BRD Area | Implementation Sequence |
|---|---|
| Section 8, Scan Lifecycle | Sequence 04 and Sequence 05 |
| Section 9, Tool Integration Catalog | Sequence 05 and Sequence 05A |
| Section 10, Unified Finding and Evidence Model | Sequence 04 and Sequence 05 |
| Section 11, Finding-to-Service Mapping | Sequence 01, Sequence 04, Sequence 05, and Sequence 05B |
| Section 12, Functional Requirements | Sequence 04, Sequence 05, Sequence 05A, Sequence 05B, and Sequence 07 |
| Section 13, Non-Functional Requirements | Sequence 05 and Sequence 07 |
| Section 14, Business Rules | Sequence 04, Sequence 05, Sequence 05B, and Sequence 07 |
| Section 15, AI Usage Across The Integration Layer | Sequence 01, Sequence 03, Sequence 03A, Sequence 06, and Sequence 07 |
| Section 16, Security, Privacy, and Trust Requirements | Sequence 04, Sequence 05, Sequence 05A, and Sequence 07 |
| Section 17, External Tool Connector Requirements | Sequence 05A |
| Section 18, API and UI Requirements | Sequence 04, Sequence 05, Sequence 05A, and Sequence 05B |
| Section 18, implemented scanner endpoint map and UI alignment | Sequence 08 |
| Section 19, Milestone Acceptance and Evidence Rules | Sequence 04, Sequence 05B, and Sequence 07 |
| Section 20, Data Model | Sequence 04, Sequence 05, Sequence 05A, Sequence 07, and Sequence 08 |
| Section 21, Reporting and Metrics | Sequence 05B and Sequence 07 |
| Section 23, Risks and Mitigations | Sequence 05, Sequence 05A, and Sequence 07 |
| Section 24, BRD Acceptance Criteria | Sequence 04 through Sequence 08 |

Scanner work is considered incomplete until the BRD acceptance areas are traceable in code and tests:

- repo connection and disconnect
- safe static scan execution
- normalized findings
- AI summaries with evidence basis
- finding-to-service mapping
- evidence workflow and rescan status update
- secret redaction, repo clone cleanup, and audit logs
- authorized runtime scanning
- admin scanner and connector operations
- connector permission visibility
- disconnect artifact deletion
- scheduled scanner evidence refresh

## UI Quality Guardrails

All Studio UI generated from these sequences must be attractive, intuitive, and functional:

- Apple-like light UI: white canvas, restrained depth, soft hairline borders, calm spacing, clear hierarchy, system font stack, 8px card radius unless an existing component requires otherwise.
- Productization-first layout: owners should see product health, next action, evidence, package, milestone, and handoff context without getting lost in scanner-tool details.
- Functional controls only: every enabled button must call a real backend action, navigate to a real route, open a real modal, or mutate persisted state. Otherwise it must be disabled with a concise reason.
- Consistent controls: same-size buttons for same-priority actions, icon buttons where appropriate, no uneven form/button rows, no dead action chips.
- Responsive behavior: desktop, tablet, and mobile layouts must be verified; no horizontal table overflow on core owner/team flows.
- Empty states: each empty state must provide one concrete next step and must not look like broken admin scaffolding.
- Accessibility: keyboard focus, labels, dialog semantics, readable contrast, and touch target sizes must be honored.
- AI clarity: assistant panels must show source basis and confidence and must not imply real scanner/LoomAI execution unless recorded.

## Non-Negotiable Guardrails

- ProdUS backend remains the authorization and workflow enforcement boundary.
- LoomAI never receives raw secrets, bearer tokens, webhook secrets, private file URLs, customer credentials, or raw repository dumps.
- AI actions are allowlisted, not imported wholesale from MCP.
- Mutations require confirmation and audit.
- AI never approves high-risk milestones, releases payments, certifies security, or certifies compliance.
- Deterministic workflows must remain usable when LoomAI is disabled or unavailable.
- Scanner results are evidence sources, not final business decisions.
- Safe shared knowledge may be indexed; customer-owned product data should be fetched live through authorized APIs/MCP unless explicitly approved and sanitized.

## Implementation Tracking

Each sequence document has:

- Objective.
- In scope and out of scope.
- Prerequisites.
- Backend work.
- Frontend work.
- MCP/AI work.
- Data/security work.
- Test plan.
- Exit criteria.
- Production considerations.

Update the status line in each sequence document as work starts and completes.
