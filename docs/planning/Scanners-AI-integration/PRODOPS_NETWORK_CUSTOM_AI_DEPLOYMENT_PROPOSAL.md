# ProdOps Network Proposal: AI Deployment And Integration Layer Readiness

Status: customer-specific proposal draft
Source reviewed: `/Users/mahmoudashraf/Downloads/integration_brd.pdf`
Audience: ProdOps product, engineering, and delivery stakeholders
Positioning: use LoomAI as the governed AI deployment layer around ProdOps, while identifying which Integration Layer capabilities require product-specific implementation.

---

## Executive Summary

The ProdOps Network BRD describes an evidence-driven productization platform. Its Integration Layer is not just a chat assistant. It is the system that connects to repositories, CI/CD, scanner tools, runtime URLs, external security platforms, cloud evidence sources, and milestone evidence workflows.

LoomAI can support a large part of the AI-facing experience immediately:

- assistant UI and runtime chat
- retrieval over approved productization knowledge
- governed actions through MCP or customer APIs
- evidence-aware answers and safe action confirmations
- deployment profiles for staging and production
- operational verification and managed service deployment

However, the full ProdOps Integration Layer is not only deployment configuration. The BRD requires product-specific backend services for repository connection, scanner orchestration, isolated worker execution, raw artifact storage, SARIF/JSON normalization, finding lifecycle, service/package mapping, milestone evidence review, and admin scanner health.

The right approach is:

1. **Deploy LoomAI as the AI and governance layer around ProdOps first.**
2. **Expose ProdOps capabilities through MCP or configured APIs.**
3. **Build the scanner/evidence domain services as a dedicated ProdOps product service where they do not already exist.**

If ProdOps already has repository, scan, finding, evidence, package, and milestone APIs, the first AI deployment is mostly configuration. If those APIs and services do not exist yet, LoomAI cannot create the complete Integration Layer by configuration alone.

---

## BRD Understanding

The BRD defines ProdOps Network as a productization governance platform for turning prototypes, MVPs, no-code products, AI-built apps, and early SaaS products into production-ready software.

The Integration Layer exists to create the factual evidence chain:

```text
Evidence -> Finding -> Service -> Package -> Dependency -> Milestone
-> Evidence Review -> Handoff -> Team Reputation
```

The BRD requires three execution modes:

1. **ProdOps-hosted scanner jobs**
   ProdOps clones the repository temporarily and runs scanner jobs in isolated workers.

2. **External tool import**
   ProdOps imports findings from GitHub, GitLab, Snyk, SonarQube, Semgrep, Socket.dev, and similar platforms.

3. **CI evidence mode**
   Customers run scanners in their own CI/CD environment and upload SARIF, JSON, logs, and evidence artifacts to ProdOps.

The BRD also requires AI, but AI is intentionally not the source of truth. Scanners and customer systems produce evidence. AI explains, groups, summarizes, and recommends. Humans approve critical decisions.

---

## Fit With LoomAI

### Already Supported By LoomAI Foundations

LoomAI already has reusable foundations that fit this product:

- managed staging and production deployments
- runtime chat API and assistant shell
- retrieval/data-sync support for approved knowledge
- external retrieval connector support through `POST /retrieval/search`
- governed action execution through `POST /actions/execute`
- MCP discovery and execution gateway for `tools/list` and `tools/call`
- Marketplace ACTION and DATA plugin model
- runtime action catalog and confirmation policy
- evidence attribution in AI answers
- Thinker/Resolver-style evidence capture and governed issue workflows
- Platform verification suites and production readiness scorecards
- managed product service provisioning through Platform deployment profiles

These are enough to build the AI assistant and action governance experience around ProdOps.

### Not Yet Present As A ProdOps Product Service

The current codebase does not appear to contain a dedicated ProdOps scanner/evidence product service with:

- GitHub App installation flow for repository access
- GitLab repository connector
- isolated scanner worker pool
- scanner job queue and cancellation
- safe scan-depth consent model
- Gitleaks/Semgrep/OSV/Trivy/Checkov/Lighthouse/ZAP execution pipeline
- SARIF/JSON/log import normalization into a ProdOps Finding schema
- raw artifact object storage lifecycle
- finding fingerprinting and status transitions
- CI evidence upload endpoint
- package builder tied to findings and dependency rules
- milestone evidence review workflow for ProdOps products
- admin scanner health dashboard

Those parts require product-specific implementation unless ProdOps already provides them externally.

---

## Configuration Versus Implementation Verdict

### Mostly Configuration

The following can be delivered mostly through deployment configuration if ProdOps exposes APIs or MCP tools:

- AI assistant in the ProdOps dashboard
- productization knowledge retrieval
- diagnosis Q&A over findings and evidence
- tool/action catalog configuration
- governed actions such as starting a scan or requesting package recommendations
- confirmation gates for sensitive actions
- safe response mapping for not-found, unauthorized, scan-failed, and insufficient-evidence outcomes
- deployment of staging and production runtime profiles
- operator release gates around the AI runtime

### Requires New ProdOps-Specific Implementation

The following cannot be delivered by configuration alone:

- scanner execution workers
- temporary repository clone isolation
- scan plan generation and depth enforcement
- scanner output parsing and normalization
- finding/fingerprint data model
- external scanner import adapters
- CI evidence upload processing
- artifact retention/redaction pipeline
- package/milestone/review domain model if not already present
- team reputation records derived from accepted milestones

### Practical Conclusion

LoomAI can be used immediately as the **AI deployment and governance layer** for ProdOps.

The full BRD still needs a **ProdOps Integration Product Service** unless an existing ProdOps backend already implements the scan/evidence/finding/package domain.

---

## Recommended Target Architecture

```text
ProdOps Web App
  |
  | embeds LoomAI assistant or calls runtime API
  v
LoomAI Runtime Deployment
  |
  | retrieval over approved productization docs/templates
  | action selection and confirmation
  v
LoomAI Capability Gateway
  |
  | MCP tools/call or configured action connector
  v
ProdOps Integration Service
  |
  | repo connectors
  | scan orchestration
  | finding normalization
  | evidence management
  | package and milestone services
  v
Scanner Workers / External Tools / CI Uploads
  |
  v
Raw Artifacts + Normalized Findings + Evidence Store
```

The customer-facing assistant should never execute scanners directly from the prompt. The assistant calls governed ProdOps capabilities. ProdOps services own repository access, scanner safety, artifact retention, and human approval workflows.

---

## ProdOps Capability Model

The initial AI capability catalog should be explicit and policy-controlled.

### Read Capabilities

| Capability | Purpose | Source |
| --- | --- | --- |
| `get_product_health_summary` | Show current readiness, risk, and next milestone | ProdOps API or MCP |
| `list_product_findings` | Retrieve normalized findings by product/severity/category/status | ProdOps API or MCP |
| `get_finding_detail` | Explain one finding with evidence and remediation context | ProdOps API or MCP |
| `get_scan_run_status` | Show scan progress, tool status, and errors | ProdOps API or MCP |
| `list_evidence_items` | Retrieve evidence attached to milestone/finding/product | ProdOps API or MCP |
| `recommend_productization_package` | Generate package recommendation from findings and rules | ProdOps API or MCP |
| `get_milestone_review_state` | Show acceptance criteria, evidence state, and review decision | ProdOps API or MCP |

### Write / Governed Capabilities

| Capability | Purpose | Policy |
| --- | --- | --- |
| `connect_repository` | Start GitHub/GitLab connection flow | owner/admin only |
| `start_scan_run` | Start a scan at approved depth | confirmation required for L2+ |
| `cancel_scan_run` | Cancel queued/running scan | confirmation required |
| `upload_ci_evidence` | Attach customer-owned scanner output | backend or team-authenticated |
| `attach_milestone_evidence` | Attach PR/log/screenshot/runbook to milestone | authenticated team/owner |
| `mark_finding_false_positive` | Mark a finding as false positive | reviewer approval |
| `accept_finding_risk` | Accept unresolved risk with reason/expiry | high-friction approval |
| `review_milestone` | Approve/request changes/accept insufficient evidence | owner/reviewer only |

Sensitive writes must use confirmation and audit. High-risk decisions, such as accepting critical security risk, should require role-based approval and an expiry date.

---

## Communication Contract

ProdOps can integrate with LoomAI using the same deployment contract used for other external customer applications.

### User-Facing Assistant

```http
POST /api/public/chat/session
POST /api/chat/me/query
POST /api/chat/me/suggestions
```

Example chat request:

```json
{
  "query": "What should we fix before launching this product?",
  "conversationId": "chat_prodops_01",
  "position": "diagnosis_report",
  "mode": "thinker_deep",
  "attachments": [
    {
      "id": "product_context",
      "vectorSpace": "page_context",
      "source": "page",
      "contentText": "The user is viewing product prod_456 diagnosis report.",
      "metadata": {
        "productId": "prod_456",
        "pageType": "diagnosis_report"
      }
    }
  ]
}
```

### ProdOps Retrieval Connector

If ProdOps keeps findings/evidence in its own system, LoomAI can call a retrieval connector:

```http
POST /retrieval/search
Authorization: Bearer <connector-token>
Content-Type: application/json
```

Example request:

```json
{
  "query": "critical launch blockers for prod_456",
  "vectorSpace": "prodops_findings",
  "topK": 10,
  "filters": {
    "productId": "prod_456",
    "status": "open",
    "severity": ["critical", "high"]
  },
  "trace": {
    "requestId": "req_01",
    "conversationId": "chat_prodops_01",
    "authContext": {
      "subjectId": "owner_123",
      "subjectType": "PRODUCT_OWNER",
      "authMode": "VERIFIED_SESSION",
      "deploymentId": "dep_prodops_staging",
      "customerId": "prodops",
      "tenantId": "org_789",
      "grantedScopes": ["retrieval:search"]
    }
  }
}
```

Example response:

```json
{
  "success": true,
  "documents": [
    {
      "id": "finding_123",
      "content": "Gitleaks detected a high-confidence exposed secret in config/prod.env.",
      "score": 0.93,
      "source": "prodops_findings",
      "url": "https://prodops.example/products/prod_456/findings/finding_123",
      "vectorSpace": "prodops_findings",
      "metadata": {
        "severity": "critical",
        "status": "open",
        "sourceTool": "gitleaks",
        "category": "secret"
      }
    }
  ],
  "count": 1,
  "totalCount": 1,
  "cursor": null
}
```

### ProdOps Action Connector

For non-MCP action execution:

```http
POST /actions/execute
Authorization: Bearer <connector-token>
Content-Type: application/json
```

Example request:

```json
{
  "actionId": "start_scan_run",
  "params": {
    "productId": "prod_456",
    "repositoryId": "repo_123",
    "branch": "main",
    "scanDepth": "L1",
    "tools": ["gitleaks", "semgrep", "osv", "trivy"]
  },
  "idempotencyKey": "prod_456_main_l1_20260517",
  "trace": {
    "requestId": "req_02",
    "conversationId": "chat_prodops_01",
    "authContext": {
      "subjectId": "owner_123",
      "subjectType": "PRODUCT_OWNER",
      "authMode": "VERIFIED_SESSION",
      "deploymentId": "dep_prodops_staging",
      "customerId": "prodops",
      "tenantId": "org_789",
      "grantedScopes": ["actions:execute"]
    }
  }
}
```

Example response:

```json
{
  "success": true,
  "message": "L1 scan queued for main.",
  "data": {
    "scanRunId": "scan_789",
    "status": "queued",
    "depth": "L1",
    "tools": ["gitleaks", "semgrep", "osv", "trivy"]
  },
  "pinnedTargets": [
    {
      "id": "scan_789",
      "vectorSpace": "prodops_scan_runs",
      "contentText": "L1 scan queued for product prod_456 on branch main.",
      "metadata": {
        "productId": "prod_456",
        "status": "queued"
      }
    }
  ]
}
```

### MCP Alternative

If ProdOps exposes MCP, LoomAI can discover and govern tools through:

```http
POST /mcp
Accept: application/json, text/event-stream
MCP-Protocol-Version: <agreed-version>
```

Recommended initial tools:

```text
get_product_health_summary
list_product_findings
get_finding_detail
get_scan_run_status
recommend_productization_package
start_scan_run
attach_milestone_evidence
review_milestone
```

MCP is useful when ProdOps wants capability discovery and tool import to be configuration-driven. It does not remove the need for ProdOps domain services behind those tools.

---

## Data And Indexing Strategy

### Index In LoomAI

Safe shared knowledge:

- productization service catalog
- package templates
- dependency rules
- scanner tool descriptions
- acceptance criteria templates
- public help docs
- runbook templates
- non-sensitive anonymized examples

### Keep In ProdOps And Fetch Live

Sensitive or tenant-owned data:

- repository source code
- raw scanner outputs
- secrets scan artifacts
- customer-specific findings
- private evidence attachments
- PRs, logs, screenshots, deployment records
- team delivery records and reputation

LoomAI should not bulk-index raw repository contents or sensitive scan artifacts. Those should stay in ProdOps storage and be returned as safe summaries or redacted evidence when policy allows.

---

## ProdOps Domain Schemas

The BRD's domain model can be implemented behind MCP/API. These are the minimum schemas LoomAI expects to interact with.

### Normalized Finding

```json
{
  "id": "finding_123",
  "productId": "prod_456",
  "scanRunId": "scan_789",
  "sourceMode": "hosted_scan",
  "sourceTool": "gitleaks",
  "category": "secret",
  "type": "exposed_secret",
  "severity": "critical",
  "confidence": "high",
  "fingerprint": "sha256:...",
  "status": "open",
  "title": "Potential exposed secret in repository",
  "safeSummary": "A high-confidence secret-like value was detected in a configuration file.",
  "evidenceRefs": ["evidence_001"],
  "serviceMappings": ["security_hardening", "secrets_rotation"],
  "createdAt": "2026-05-17T10:00:00Z",
  "updatedAt": "2026-05-17T10:00:00Z"
}
```

### Evidence Item

```json
{
  "id": "evidence_001",
  "productId": "prod_456",
  "milestoneId": "milestone_security_01",
  "findingId": "finding_123",
  "type": "scanner_output",
  "source": "gitleaks",
  "artifactRef": "s3://prodops-evidence/redacted/scan_789/gitleaks.json",
  "redactionState": "redacted",
  "safeSummary": "Gitleaks reported one high-confidence secret finding.",
  "operatorSummary": "Raw artifact is redacted and available to authorized reviewers.",
  "capturedAt": "2026-05-17T10:00:00Z"
}
```

### Scan Run

```json
{
  "id": "scan_789",
  "productId": "prod_456",
  "repositoryId": "repo_123",
  "branch": "main",
  "mode": "hosted_scan",
  "depth": "L1",
  "status": "running",
  "requestedBy": "owner_123",
  "tools": [
    {
      "tool": "gitleaks",
      "status": "completed",
      "rawOutputRef": "s3://prodops-evidence/raw/scan_789/gitleaks.json"
    },
    {
      "tool": "semgrep",
      "status": "running"
    }
  ],
  "startedAt": "2026-05-17T10:00:00Z",
  "completedAt": null
}
```

### Package Recommendation

```json
{
  "productId": "prod_456",
  "recommendedPackage": {
    "id": "package_security_launch_readiness",
    "name": "Security and Launch Readiness",
    "rationale": "Critical secret and dependency findings block launch readiness.",
    "services": [
      "secrets_rotation",
      "dependency_patch_review",
      "ci_cd_hardening",
      "staging_verification"
    ],
    "dependencies": [
      {
        "sourceService": "secrets_rotation",
        "targetService": "deployment_handoff",
        "type": "blocks",
        "severity": "critical"
      }
    ],
    "milestones": [
      {
        "name": "Security hardening evidence accepted",
        "acceptanceCriteria": [
          "No high-confidence exposed secrets remain",
          "Critical dependencies are patched or risk-accepted",
          "Runtime baseline scan has no critical findings"
        ]
      }
    ]
  },
  "confidence": "medium",
  "sourceFindingIds": ["finding_123", "finding_456"]
}
```

---

## Missing Implementation Work

### P0 For Real ProdOps MVP

1. **ProdOps Integration Service**
   Product-specific service owning integrations, scans, findings, evidence, package mapping, and milestone review APIs.

2. **GitHub Connector**
   GitHub App install, repo/branch selection, temporary clone token handling, webhook intake, and disconnect flow.

3. **Scanner Worker Pool**
   Queue-backed isolated workers for L1 scanner jobs, starting with Gitleaks, Semgrep, OSV-Scanner, and Trivy.

4. **Result Normalizer**
   SARIF/JSON/log parser that produces normalized findings with severity, confidence, category, fingerprint, and source references.

5. **Evidence Store**
   Object storage for raw/redacted outputs, normalized evidence records, retention policy, export/delete controls, and audit trails.

6. **Finding Lifecycle**
   New/open/resolved/regressed/accepted-risk/false-positive workflow with rescan matching.

7. **ProdOps UI**
   Diagnosis report, scan run detail, findings, evidence center, package builder, milestone review, and admin scanner health.

### P1 After MVP

- CI evidence upload template and endpoint
- GitHub code scanning/Dependabot/secret scanning import
- GitLab connector/import
- Snyk/SonarQube/Semgrep platform imports
- Checkov and Lighthouse as standard additions
- OWASP ZAP baseline behind explicit domain authorization
- team delivery records and reputation signals

### P2 Mature

- cloud posture imports
- SBOM generation and SBOM risk integrations
- Kubernetes/mobile scanning
- marketplace team matching
- advanced AI quality monitoring and evaluation datasets

---

## Deployment Configuration Needed

For the AI layer:

- `PRODOPS_RUNTIME_BASE_URL`
- `PRODOPS_CONNECTOR_BASE_URL` or `PRODOPS_MCP_SERVER_URL`
- connector API key or OAuth client material
- allowed origins for ProdOps dashboard
- staging and production deployment profiles
- action catalog for ProdOps read/write capabilities
- retrieval vector spaces:
  - `prodops_docs`
  - `prodops_service_catalog`
  - `prodops_package_templates`
  - `prodops_findings` if sanitized findings are indexed
- prompt profile for evidence-grounded productization guidance
- confirmation policy for scan start, risk acceptance, milestone review, and evidence-changing actions

For the ProdOps Integration Service:

- GitHub App credentials
- GitLab OAuth/app credentials when enabled
- object storage bucket and signing config
- queue/worker backend
- scanner container image references
- retention settings
- redaction rules
- scan depth policy
- domain authorization policy for runtime URL scans
- admin/operator roles

---

## Recommended Delivery Plan

### Phase 0: Product Fit And API Inventory

Validate whether ProdOps already has working APIs for products, integrations, scans, findings, evidence, packages, and milestones.

Output:

- API inventory
- data model gap list
- AI capability catalog
- staging deployment plan

### Phase 1: Config-Driven AI Layer

Deploy LoomAI runtime against existing or stubbed ProdOps APIs.

Scope:

- assistant in ProdOps dashboard
- retrieval over service/package/milestone docs
- read actions for product health, findings, scan status
- package recommendation action
- safe evidence-based summaries

This phase is mostly deployment configuration if ProdOps APIs exist.

### Phase 2: Hosted Scan MVP

Build missing ProdOps Integration Service capabilities.

Scope:

- GitHub App connector
- L1 scan orchestration
- isolated scanner workers
- Gitleaks/Semgrep/OSV/Trivy
- result normalizer
- evidence store
- diagnosis dashboard

This phase requires coding and infrastructure.

### Phase 3: Evidence And Milestone Workflow

Add:

- evidence attachment
- rescan after fix
- finding status comparison
- milestone acceptance criteria
- owner/reviewer decisions
- BYOT team invitation

### Phase 4: External Imports And CI Evidence

Add:

- SARIF/JSON upload
- GitHub code scanning imports
- Snyk/SonarQube/Semgrep imports
- GitLab evidence imports
- CI templates

---

## Risks And Guardrails

- Do not position ProdOps as a security certification product.
- Do not let AI claim that a product is secure, compliant, or production-ready with guarantee language.
- Do not run arbitrary install/build/test scripts in L1 scans.
- Do not scan production URLs without explicit authorization and rate limits.
- Do not retain repository clones after scan completion.
- Do not expose raw secrets or raw scanner artifacts to the assistant.
- Do not allow the LLM to invent fixes or packages without evidence and deterministic rules.
- Keep human approval for critical risk acceptance and milestone decisions.

---

## Final Assessment

ProdOps is a strong fit for LoomAI's deployment and governance platform, but it is not "just another chatbot deployment."

**If ProdOps already has scan/finding/evidence/package APIs:**
The first AI-enabled deployment can be mostly configuration: runtime, retrieval, action catalog, MCP/API connector, prompts, confirmation policy, and staging/production deployment profile.

**If ProdOps does not have those APIs yet:**
The AI layer is ready, but the ProdOps Integration Layer needs a dedicated product-service implementation for scanner orchestration, normalization, evidence, findings, packages, and milestone review.

The highest-value first slice is:

```text
ProdOps dashboard assistant
-> productization docs retrieval
-> list findings / explain finding / recommend package
-> start L1 scan through governed action
-> normalized evidence answer and audit trail
```

That slice proves the product thesis while keeping the scanner platform scoped and safe.
