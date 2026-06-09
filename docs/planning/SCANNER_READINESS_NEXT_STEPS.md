# ProdUS Next Steps: Scanner-Backed Readiness Diagnosis

Date: 2026-06-04

Audience: product, engineering, AI integration, catalog, and delivery stakeholders

Purpose: define the next implementation sequence after proving the live journey:

```text
Create project with AI
  -> repo source is ready
  -> run scanner
  -> review findings/evidence
  -> convert service plan to workspace
  -> run/attach workspace-scoped scanner evidence
  -> use workspace/scanner context for readiness decisions
```

## 1. Product Direction

The next phase should make scanner evidence useful for the owner. The platform already proves that AI project creation, repository source setup, hosted scanning, service cart creation, workspace conversion, and workspace evidence attachment can work end to end.

The next product value is:

> ProdUS turns scanner findings into an owner-readable production-readiness diagnosis and a concrete catalog-backed service path.

This should become the primary owner experience after project creation.

## 2. Immediate Objective

Build a scanner-backed readiness diagnosis layer that answers:

- what blocks this product from production
- which findings matter most to business readiness
- which lifecycle services address the blockers
- what evidence is missing
- what owner decision should happen next
- which workspace milestone should hold the work and proof

The diagnosis should be grounded in deterministic backend rules first, then explained by LoomAI. AI should not invent catalog services or mutate workspace state without an approved action path.

## 3. Implementation Sequence

### Step 1: Deterministic Scanner Finding Classification

Create a backend classification layer that turns normalized scanner findings into stable readiness categories.

Suggested component:

```text
ScannerFindingClassifier
```

Inputs:

- `sourceTool`
- `sourceRuleId`
- `title`
- `description`
- `severity`
- `affectedComponent`
- `confidenceBasis`

Outputs:

- `findingCategory`
- `readinessArea`
- `businessRisk`
- `defaultOwnerDecision`
- `evidenceRequired`
- `classificationConfidence`
- `classificationSource = RULE_BASED`

Initial readiness areas:

- security
- secrets
- authentication
- dependency-risk
- api-risk
- infrastructure
- deployment
- monitoring
- testing
- performance
- compliance
- documentation
- launch-readiness

Acceptance criteria:

- every normalized finding gets a stable category or `UNMAPPED`
- high/critical findings always surface a business-risk explanation
- unmapped findings are visible for catalog/rule review

### Step 2: Catalog Service Mapping

Create deterministic mapping from scanner finding categories to active ProdUS service modules.

Suggested component:

```text
ScannerFindingServiceMapper
```

The mapper must use the catalog as source of truth:

- `ServiceModule.stableCode`
- `ServiceModule.slug`
- `ServiceModule.category.slug`
- `ServiceModule.aiAssistanceTags`
- `ServiceModule.requiredInputs`
- `ServiceModule.expectedDeliverables`
- `ServiceModule.acceptanceCriteria`
- service dependency rules

The mapper should not return free-text service names. It should resolve only real active `ServiceModule` records by stable code, slug, or alias.

Output per finding:

- `recommendedModuleId`
- `recommendedModuleCode`
- `recommendedModuleName`
- `mappingReason`
- `mappingConfidence`
- `mappingSource = RULE_BASED`
- `requiresHumanReview`

If no confident match exists:

- leave service fields empty
- set `mappingSource = UNMAPPED`
- show `Needs service mapping review`

Acceptance criteria:

- mapped findings point to a real active catalog module
- service recommendation can be added to cart/workspace without AI translation
- unmapped findings do not silently disappear

### Step 3: Initial Mapping Ground

Use the following first-pass mapping table.

| Scanner signal | Readiness area | Catalog service module target | Reason |
| --- | --- | --- | --- |
| Gitleaks secret, API key, access token, private key | secrets | `security.secrets_review` | Secret exposure blocks production readiness and requires credential rotation/proof. |
| Gitleaks JWT, session token, auth token | authentication | `security.auth_review` | Token leakage or weak session handling requires auth/session review. |
| OSV vulnerability, CVE, vulnerable package | dependency-risk | `security.dependency_remediation` | Known dependency vulnerabilities require remediation or accepted-risk evidence. |
| Semgrep auth, access control, injection, unsafe deserialization | api-risk | `security.api_security_review` | App-level security findings need secure API/code review. |
| Trivy FS Dockerfile, package, config vulnerability | deployment | `cloud.deployment_readiness` | Runtime/container file-system findings affect deployability and operations. |
| Checkov public exposure, permissive IAM, storage/network risk | infrastructure | `cloud.infrastructure_hardening` | IaC risk should map to cloud hardening and environment controls. |
| Lighthouse performance score, accessibility, SEO/runtime risk | performance | `scale.performance_audit` | Runtime performance and UX readiness need measurable optimization work. |
| Missing tests, flaky tests, coverage gaps from imported CI evidence | testing | `quality.coverage_boost` | Risky paths require targeted verification before launch decisions. |
| Monitoring/logging/alerting gaps from scanner/imported evidence | monitoring | `ops.monitoring_setup` | Production paths need alerting, ownership, and incident visibility. |
| Release pipeline/CI/CD failure evidence | deployment | `cloud.cicd_pipeline` | Repeatable release gates are required for production handoff. |
| Launch checklist, support, documentation, go/no-go gaps | launch-readiness | `launch.readiness_review` | Launch decisions need evidence and owner approval. |
| Product ambiguity, missing owner goals, unclear stage | validation | `validation.product_readiness` | The owner needs a readiness baseline before delivery scope. |

Notes:

- Exact module codes must be verified against the seeded catalog. If a target code does not exist, add a migration/seed update or map to the closest existing active module.
- Mapping should support aliases because historic code may use `stableCode`, `slug`, or generated module names.
- AI can suggest mapping improvements, but backend rules remain authoritative.

### Step 4: Service Recommendation From Findings

After mapping findings to service modules, add product-level service recommendations automatically.

Rules:

- create one recommendation per unique service module
- aggregate linked findings under the recommendation
- priority derives from highest linked severity
- sequence derives from readiness order:
  1. critical secrets/auth/security
  2. dependency/API/infrastructure
  3. deployment/monitoring/testing
  4. performance/documentation/launch
- avoid duplicating services already in the cart/workspace plan

Output should include:

- service module
- linked finding count
- highest severity
- owner-facing reason
- expected outcome
- required evidence
- suggested milestone

Acceptance criteria:

- scanner findings become actionable services
- owner can add the recommended service to the current cart
- workspace can link the service recommendation to a milestone

### Step 5: Readiness Diagnosis Model

Introduce a `ReadinessDiagnosis` model or extend the existing diagnosis model to store scanner-backed diagnosis snapshots.

Suggested fields:

- product id
- workspace id, optional
- readiness score
- status: `BLOCKED`, `NEEDS_REVIEW`, `READY_WITH_RISKS`, `READY`
- summary
- top blocker count
- evidence count
- unmapped finding count
- generated from scan run ids
- generated from AI analysis id, optional
- generated at
- generated by

Diagnosis item fields:

- title
- description
- severity
- readiness area
- linked finding ids
- linked evidence ids
- recommended service module id
- missing evidence
- owner decision
- status

Acceptance criteria:

- diagnosis can be regenerated after new scans
- diagnosis points back to scanner evidence
- diagnosis can exist at product and workspace scope

### Step 6: Owner Readiness Board UI

Create a dedicated owner-facing board in the product/workspace UI.

Recommended sections:

- readiness score and status
- top blockers
- scanner evidence summary
- mapped lifecycle services
- missing evidence
- unmapped findings needing review
- owner next decision

Owner actions:

- add mapped service to cart
- link finding to milestone
- mark finding accepted risk with reason
- mark finding resolved with evidence
- re-run scanner
- ask LoomAI about this diagnosis

UX principles:

- business-friendly first, technical details expandable
- no raw logs by default
- each blocker shows evidence and service path
- empty states explain what action creates value next

Acceptance criteria:

- owner can identify the top three production blockers in under one minute
- every high/critical finding has a visible status and next action
- services are shown as concrete catalog items, not generic labels

### Step 7: Workspace Enrichment

When a workspace exists, scanner-backed diagnosis should enrich it.

Workspace enrichments:

- add scanner evidence to the relevant milestone
- add missing evidence tasks
- link mapped services to package modules
- show readiness risk on milestone cards
- show service/finding coverage

Rules:

- do not auto-add participants or teams
- do not auto-approve milestones
- do not hide unresolved high-risk findings
- owner must explicitly confirm team/expert additions

Acceptance criteria:

- workspace shows scanner evidence without manual copy/paste
- milestones expose readiness blockers and missing proof
- owner can see whether service work is reducing scanner risk

### Step 8: LoomAI Integration

Use LoomAI to explain, summarize, and help navigate the readiness state.

LoomAI should receive compact safe context:

- product summary
- AI project analysis summary
- service cart/package modules
- scanner summary counts
- top findings with mapped services
- evidence summaries
- workspace milestones
- unmapped findings

Allowed AI behaviors:

- explain blockers
- explain why a service is recommended
- summarize evidence
- identify missing proof
- suggest owner questions
- compare service paths
- explain next safe decision

Disallowed AI behaviors for this phase:

- invent catalog services
- mark findings resolved
- accept risk without owner confirmation
- add/remove participants
- approve milestones
- run mutation tools without explicit confirmed-action flow

Acceptance criteria:

- LoomAI can answer “what blocks production?” from page context
- LoomAI references mapped service modules when relevant
- LoomAI clearly separates evidence-backed facts from assumptions

## 4. Data Contracts

### Finding Classification Response

```json
{
  "findingId": "uuid",
  "findingCategory": "SECRET_EXPOSURE",
  "readinessArea": "secrets",
  "businessRisk": "Production credentials may be exposed or reused.",
  "defaultOwnerDecision": "Rotate/revoke credential and attach proof before launch.",
  "evidenceRequired": ["rotation proof", "secret removal commit", "scanner rerun"],
  "classificationConfidence": 0.92,
  "classificationSource": "RULE_BASED"
}
```

### Finding-Service Mapping Response

```json
{
  "findingId": "uuid",
  "recommendedModuleId": "uuid",
  "recommendedModuleCode": "security.secrets_review",
  "recommendedModuleName": "Secrets review",
  "mappingReason": "Gitleaks reported token/API-key exposure; this service validates secret removal, rotation, and prevention controls.",
  "mappingConfidence": 0.9,
  "mappingSource": "RULE_BASED",
  "requiresHumanReview": false
}
```

### Readiness Diagnosis Response

```json
{
  "productId": "uuid",
  "workspaceId": "uuid",
  "readinessScore": 42,
  "status": "BLOCKED",
  "summary": "Production readiness is blocked by unresolved secret exposure and missing security evidence.",
  "generatedFromScanRunIds": ["uuid"],
  "topBlockers": [
    {
      "title": "Secrets exposure",
      "severity": "HIGH",
      "readinessArea": "secrets",
      "findingIds": ["uuid"],
      "evidenceIds": ["uuid"],
      "recommendedModuleCode": "security.secrets_review",
      "missingEvidence": ["rotation proof", "clean scanner rerun"],
      "ownerDecision": "Add Secrets Review service or record accepted risk with approval."
    }
  ]
}
```

## 5. Backend Implementation Checklist

- Add scanner finding classifier.
- Add scanner finding to service mapper.
- Add mapping config/seed for first-pass scanner signals.
- Add catalog alias lookup for stable code, slug, and source aliases.
- Persist mapping output on `NormalizedFinding` or related mapping table.
- Add service recommendation generation from mapped findings.
- Add readiness diagnosis generation endpoint.
- Add product-level and workspace-level diagnosis endpoints.
- Add tests for Gitleaks, OSV, Semgrep, Trivy, Checkov, Lighthouse mapping.
- Add tests for unmapped findings.
- Add tests for cart service recommendation deduplication.
- Add tests for workspace-scoped evidence enrichment.

## 6. Frontend Implementation Checklist

- Add Readiness Board to product/workspace UI.
- Add blocker cards grouped by readiness area.
- Show mapped lifecycle service for each blocker.
- Add “Add service to cart” action.
- Add “Link to milestone” action where workspace exists.
- Add scanner run status and evidence count.
- Add unmapped finding review state.
- Add LoomAI readiness explainer panel with page context.
- Add empty states for no scans, no findings, no mapped service, and no workspace.

## 7. Verification Plan

Use the proved staging path:

1. Create project with AI using ProdUS repo.
2. Confirm repository source exists.
3. Run hosted Gitleaks scan.
4. Confirm findings and evidence normalize.
5. Generate readiness diagnosis.
6. Confirm high findings map to security/secrets/auth services.
7. Add recommended service to cart.
8. Convert cart to workspace.
9. Run workspace-scoped scanner.
10. Confirm workspace evidence appears on readiness board.
11. Ask LoomAI:
    - what blocks production?
    - which service should be done first?
    - what evidence is missing?
    - what should the owner decide next?

Pass criteria:

- diagnosis includes scanner-backed blockers
- service mappings resolve to real catalog modules
- workspace evidence is visible
- LoomAI answers from diagnosis/page context
- no browser secrets or raw scanner logs are exposed

## 8. Current Known Gaps To Resolve

- Gitleaks findings currently normalize but do not always receive `recommendedModuleName`.
- Document usage proof can still return `NOT_USED` on some AI analysis runs.
- ZAP runtime tool is configured but not available on staging PATH.
- Cart conversion dependency errors need owner-friendly UI copy and AI explanation.
- Readiness score currently drops based on scanner counts but does not yet explain production blockers in a complete diagnosis model.

## 9. Priority Order

1. Implement deterministic mapping for Gitleaks secrets/tokens.
2. Add readiness diagnosis generation from scanner summary.
3. Add Readiness Board UI.
4. Add service recommendation actions from mapped findings.
5. Add workspace evidence linkage and milestone enrichment.
6. Add LoomAI readiness chat/context.
7. Expand mappings to OSV, Semgrep, Trivy, Checkov, Lighthouse.
8. Add admin mapping review for unmapped findings.

## 10. Product Principle

The scanner is not the product. The diagnosis is the product.

Scanner output should become owner decisions, catalog services, evidence requirements, and workspace work. If a finding does not help the owner decide what blocks production or what service is needed, it is not yet useful enough.
