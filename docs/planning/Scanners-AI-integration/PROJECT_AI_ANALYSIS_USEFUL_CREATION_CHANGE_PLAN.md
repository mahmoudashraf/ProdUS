# Project AI Analysis Useful Creation Change Plan

Date: 2026-05-30

Status: planned implementation

Scope: ProdUS project creation only. This plan covers the current product/project intake step where an owner describes a product, attaches documents, provides links, runs AI analysis, and then chooses whether to create the project with or without the AI-assisted creation path.

## 1. Problem

The current AI project analysis is useful for explanation, but it is not yet operationally strong enough to drive productization. It returns richer fields such as project description, business problem, target users, service recommendations, scanner focus areas, and document usage evidence, but those fields are mostly used as display data and folded into a text summary.

The missing piece is a stronger contract between AI analysis and project creation:

- AI should receive the actual ProdUS service catalog during analysis, not only general service language.
- AI should return structured service/module IDs, scanner setup guidance, readiness tasks, and source evidence in a stable JSON contract.
- Nothing from AI analysis should be persisted as project intelligence until the owner clicks Create Project.
- When the owner clicks Create Project with AI, the backend should persist a structured project intelligence record and convert approved analysis into concrete next-step records.
- Manual creation without AI should remain available, but should not silently pretend to be AI-assisted.

## 2. Product Decision

Project analysis is a preview and recommendation step. Project creation is the persistence boundary.

During AI analysis:

- Create or update only the short-lived `ProductCreationIntent`.
- Store enough intent state to support one-time action validation, consent, TTL, attachments, and idempotency.
- Do not create product profile records.
- Do not create service plan records.
- Do not create scanner runs.
- Do not create workspace tasks or milestones.
- Do not persist full AI project intelligence into durable product records.

When the owner clicks Create Project:

- Persist the product profile.
- Persist the full owner-approved AI analysis as structured project intelligence.
- Convert recommended catalog IDs into project-linked service recommendations.
- Convert scanner focus areas into scanner setup suggestions or pending scanner work items.
- Convert readiness goals and suggested next steps into workspace/project readiness tasks when a workspace is created or when project setup requires a task backlog.
- Link selected documents to the project and revoke temporary AI document access.

## 3. Current Behavior

Current implementation:

- Project analysis builds a LoomAI request with owner brief, URLs, risk hints, public link insights, selected document temporary URLs, and output contract.
- The prompt asks `recommendedServices` to use general ProdUS lifecycle language.
- The analysis result is displayed in the UI.
- The frontend sends the analysis fields in the create action payload.
- The backend stores basic product profile fields and folds many rich fields into `aiCreationSummary`.

Current limitations:

- The actual service catalog is not included in analysis context.
- `recommendedServices` are free-text labels, not catalog IDs.
- There is no durable structured analysis table connected to the product.
- Service recommendations are not converted into selected/planned service records.
- Scanner focus areas are not converted into scanner configuration or pending scanner tasks.
- Workspace readiness tasks are not seeded from readiness goals or next steps.
- Document usage evidence is visible, but not persisted as structured evidence linked to creation.

## 4. Target Outcomes

After this change:

- AI analysis recommends from the concrete ProdUS catalog snapshot.
- AI returns stable `moduleCode` values instead of only prose names.
- Owner can review, edit, include, exclude, or reorder recommended services before creation.
- Create Project with AI persists the owner-approved analysis as structured project intelligence.
- Create Project with AI creates product-linked service recommendations and scanner setup suggestions.
- Create Project without AI remains simple and deterministic.
- Manual creation can optionally accept a valid project intelligence JSON object, but only through an explicit advanced input/import path.
- The UI clearly distinguishes:
  - AI-generated analysis preview
  - owner-approved values
  - what will be persisted on create
  - what stays advisory until the owner acts

## 5. Non-Goals

This plan does not implement:

- AI package creation.
- AI workspace participant or access-list creation.
- AI team or expert selection mutation.
- AI invite or shortlist mutation.
- AI scanner execution before the owner creates the project.
- Bulk indexing of private project documents.
- Storing temporary AI document URLs.

These may happen in later governed flows, but they are outside this project creation step.

## 6. Backend Change Plan

### 6.1 Add Compact Service Catalog Snapshot

Add a backend method that builds a bounded, owner-safe catalog snapshot for project analysis.

Suggested method:

```text
LoomAIIntegrationService.buildProjectCreationServiceCatalogSnapshot()
```

Snapshot sources:

- `ServiceCategoryRepository`
- `ServiceModuleRepository`
- `ServiceDependencyRepository`
- `CatalogRuleRepository`
- `PackageTemplateRepository`
- `PackageTemplateModuleRepository`

Snapshot requirements:

- Include only active/public catalog records.
- Exclude admin-only draft metadata, pricing internals, long descriptions, detailed deliverable text, and implementation notes.
- Keep payload bounded so runtime context remains stable.
- Use `moduleCode` as the primary AI-facing service identifier. The backend can hydrate UUIDs, slugs, pricing, deliverables, dependencies, and full detail from the database after AI returns module codes.
- Keep the snapshot split into a compact `availableModules` allowlist and a smaller `candidateModules` ranked subset.
- `availableModules` may include all active owner-facing modules, but each item must be tiny.
- `candidateModules` should include only modules likely relevant to the owner brief, business stage, risks, public links, document evidence, catalog rules, and obvious lifecycle needs.
- Cap `candidateModules` at 12 by default.
- Cap `availableModules` at a configured maximum if the catalog grows too large; if capped, prioritize active high-signal modules and rely on LoomAI managed vectorization for broader catalog retrieval.

Recommended snapshot structure:

```json
{
  "version": "catalog-snapshot-v1",
  "generatedAt": "2026-05-30T00:00:00Z",
  "selectionPolicy": {
    "recommendOnlyFromCatalog": true,
    "returnServiceModuleCodes": true,
    "freeTextServicesAllowed": false
  },
  "availableModules": [
    {
      "moduleCode": "quality.release_acceptance_testing",
      "name": "Release acceptance testing",
      "categorySlug": "quality-testing",
      "outcome": "Owner has evidence-backed release confidence.",
      "signals": [
        "testing",
        "release",
        "acceptance"
      ]
    }
  ],
  "candidateModules": [
    {
      "moduleCode": "quality.release_acceptance_testing",
      "rank": 1,
      "matchedSignals": [
        "owner asked for production readiness",
        "release confidence"
      ],
      "ruleHints": [
        "goal-release-acceptance"
      ]
    }
  ],
  "dependencyHints": [
    {
      "sourceModuleCode": "launch.go_live_checklist",
      "recommendedModuleCode": "quality.release_acceptance_testing",
      "severity": "RECOMMENDED",
      "shortReason": "Go-live planning should include release acceptance evidence."
    }
  ]
}
```

Minimal AI-facing module fields:

| Field | Required | Why It Is Kept |
| --- | --- | --- |
| `moduleCode` | Yes | Stable catalog identifier for validation and create-time hydration. |
| `name` | Yes | Human-readable label for review UI and AI explanation. |
| `categorySlug` | Yes | Groups services into lifecycle areas without sending category descriptions. |
| `outcome` | Yes | Gives AI the business reason to choose the service. |
| `signals` | Yes | Provides compact matching hints such as `testing`, `security`, `database`, `launch`, `monitoring`. |

Fields intentionally omitted from analysis context:

- `id`: backend can map `moduleCode` to UUID after owner approval.
- `slug`: redundant when `moduleCode` is present.
- `description`: usually overlaps with `outcome`; full detail can be fetched later.
- `requiredInputs`: useful for service detail, not required to choose the service.
- `deliverables`: useful for package/service-plan generation, not required in initial analysis.
- `duration` and `budgetRange`: useful after selection, but can bias early analysis and inflate context.
- `roles`, `evidenceTypes`, and detailed dependency metadata: hydrate after create or when building the service plan.

### 6.2 Pass Catalog Snapshot Into AI Analysis Context

Add `serviceCatalogSnapshot` to the project analysis context.

Context additions:

```json
{
  "serviceCatalogSnapshot": {
    "version": "catalog-snapshot-v1",
    "selectionPolicy": {
      "recommendOnlyFromCatalog": true,
      "returnServiceModuleCodes": true
    },
    "availableModules": [],
    "candidateModules": [],
    "dependencyHints": []
  }
}
```

Prompt additions:

- Recommend only services present in `context.serviceCatalogSnapshot.availableModules`.
- Prioritize modules listed in `context.serviceCatalogSnapshot.candidateModules`, but do not treat candidates as mandatory.
- Return `recommendedServiceModules` with `moduleCode`, `moduleName`, `categorySlug`, `priority`, `sequence`, `reason`, `evidenceBasis`, `expectedOutcome`, and `confidence`.
- Do not invent services.
- If the catalog does not contain an exact fit, return an item in `missingCatalogCoverage`.
- Use `dependencyHints` only when they are relevant to the recommendation.
- Include testing pack modules when product risk, release, QA, reliability, or readiness evidence calls for them.

### 6.3 Replace Free-Text Service Recommendations With Structured Modules

Keep `recommendedServices` for display compatibility, but add a structured field:

```json
{
  "recommendedServiceModules": [
    {
      "moduleCode": "quality.release_acceptance_testing",
      "moduleName": "Release acceptance testing",
      "categorySlug": "quality-testing",
      "priority": "HIGH",
      "sequence": 3,
      "reason": "Owner wants production readiness and release confidence.",
      "evidenceBasis": [
        "Owner brief mentions production-level readiness.",
        "Document README describes launch-facing product workflows."
      ],
      "expectedOutcome": "Release acceptance evidence and owner go/no-go decision.",
      "confidence": 0.82
    }
  ],
  "missingCatalogCoverage": []
}
```

Validation rules:

- Reject or downgrade recommended modules not present in the snapshot.
- Normalize duplicate recommendations by `moduleCode`.
- Keep a maximum of 8 recommended modules in the project creation analysis result.
- Require a reason for each recommendation.
- Require at least one evidence basis item when documents or public links were used.

### 6.4 Persist Full Analysis Only At Create-Time

Add a durable project intelligence model persisted only after the owner clicks Create Project.

Suggested table:

```text
product_project_intelligence
```

Suggested fields:

- `id`
- `product_profile_id`
- `creation_intent_id`
- `analysis_provider`
- `analysis_provider_request_id`
- `analysis_schema_version`
- `analysis_json`
- `owner_approved_at`
- `created_by_ai`
- `created_at`
- `updated_at`

Store the full normalized analysis JSON:

- project description
- business problem
- target users
- core capabilities
- business outcomes
- readiness goals
- recommended service modules
- scanner focus areas
- suggested next steps
- source insights
- document usage evidence
- assumptions
- missing evidence
- missing catalog coverage
- validation warnings

Do not persist:

- temporary access URLs
- raw private document text
- runtime private payloads
- secrets, tokens, credentials, auth headers

### 6.5 Convert AI Analysis Into Concrete Project Records At Create-Time

When the owner clicks Create Project with AI:

1. Validate creation intent and consent token.
2. Validate action idempotency key.
3. Validate each `recommendedServiceModules[].moduleCode` against the live catalog.
4. Persist `ProductProfile`.
5. Persist `ProductProjectIntelligence`.
6. Persist product-linked service recommendations.
7. Persist scanner setup suggestions.
8. Persist workspace readiness task seed records if the current data model supports project task/backlog records.
9. Link uploaded documents to the product.
10. Revoke temporary AI document access.

Suggested service recommendation table:

```text
product_service_recommendations
```

Fields:

- `id`
- `product_profile_id`
- `service_module_id`
- `module_code`
- `priority`
- `sequence`
- `reason`
- `evidence_basis_json`
- `expected_outcome`
- `confidence`
- `status` with values `RECOMMENDED`, `ACCEPTED`, `DECLINED`, `ADDED_TO_PLAN`
- `created_by_ai`

Suggested scanner setup table:

```text
product_scanner_recommendations
```

Fields:

- `id`
- `product_profile_id`
- `scanner_focus_area`
- `source`
- `reason`
- `recommended_checks_json`
- `status` with values `SUGGESTED`, `CONFIGURED`, `SKIPPED`

Suggested readiness task seed table:

```text
product_readiness_tasks
```

Fields:

- `id`
- `product_profile_id`
- `title`
- `description`
- `source`
- `source_analysis_field`
- `priority`
- `status`
- `created_by_ai`

If existing workspace/task entities already cover this, reuse them instead of creating a new table.

### 6.6 Create Project With AI API Contract

Current endpoint:

```text
POST /api/products/ai-assisted/intents/{intentId}/create
```

Enhance request shape:

```json
{
  "creationIntentId": "uuid",
  "consentToken": "one-time-token",
  "idempotencyKey": "project-create:uuid",
  "analysisProviderRequestId": "rag-...",
  "productName": "ProdUS AI-Assisted Productization Project",
  "summary": "Owner outcome summary",
  "projectDescription": "2-4 sentence project description",
  "businessProblem": "The problem this product solves",
  "targetUsers": "Primary users and buyers",
  "businessStage": "PROTOTYPE",
  "techStack": "Java Spring Boot, PostgreSQL, Next.js",
  "productUrl": "https://example.com",
  "repositoryUrl": "https://github.com/org/repo",
  "riskProfile": "Known risks",
  "aiCreationSummary": "Owner-reviewed AI summary",
  "coreCapabilities": [],
  "businessOutcomes": [],
  "readinessGoals": [],
  "recommendedServiceModules": [],
  "scannerFocusAreas": [],
  "suggestedNextSteps": [],
  "sourceInsights": [],
  "documentUsage": [],
  "assumptions": [],
  "missingEvidence": [],
  "missingCatalogCoverage": [],
  "sourceAttachmentIds": [],
  "aiAccessibleAttachmentIds": []
}
```

Response additions:

```json
{
  "product": {},
  "projectIntelligenceId": "uuid",
  "createdServiceRecommendations": 5,
  "createdScannerRecommendations": 4,
  "createdReadinessTasks": 6,
  "attachmentsLinked": 2,
  "aiAccessRevoked": true
}
```

### 6.7 Manual Create Without AI

Manual creation remains a separate path:

- Owner fills fields.
- Backend creates product profile.
- No AI project intelligence is created unless the owner explicitly imports a valid project intelligence JSON object.
- No AI-created service recommendations are created.
- The owner can still add services manually after creation.

Optional advanced path:

- Add `analysisJson` to manual creation only behind an explicit UI section such as "Import structured project analysis".
- Backend validates it against the same schema.
- If valid, backend can persist it as owner-provided structured project intelligence with `createdByAi=false` or `source=OWNER_IMPORTED_JSON`.
- If invalid, backend ignores it for automation and creates the product from normal fields.
- Do not call LoomAI implicitly in manual creation.

Decision:

- Do not run hidden AI analysis for "without AI" creation.
- Keep "without AI" deterministic and owner-authored.
- If the user wants AI help, route them through the AI-assisted analysis and create flow.

## 7. Frontend Change Plan

### 7.1 AI Analysis Review Panel

Update the AI project attributes panel to show:

- Product identity fields.
- Project description.
- Business problem.
- Target users.
- Core capabilities.
- Business outcomes.
- Readiness goals.
- Recommended catalog services.
- Scanner focus areas.
- Suggested next steps.
- Source insights.
- Document usage evidence.
- Missing evidence.
- Missing catalog coverage.

### 7.2 Recommended Services Review

Add a service recommendation section before the Create Project button:

- Each recommendation shows catalog module name, category, priority, sequence, reason, expected outcome, and evidence basis.
- Owner can include/exclude each service.
- Owner can reorder recommended services.
- Owner can view dependency notes.
- Owner can open service detail from the catalog.
- Testing services must appear as normal catalog recommendations, not special prose.

UI behavior:

- AI recommended service selected by default if priority is `HIGH` or `CRITICAL`.
- Recommended but optional services are visible but not forced.
- Missing catalog coverage is shown as a warning, not persisted as a service.

### 7.3 Scanner Focus Review

Add a scanner setup preview:

- Display scanner focus areas as "suggested checks after project creation".
- Show what evidence the scanner will look for.
- Let owner include/exclude scanner suggestions before create.
- Do not run scanners until the project exists and the owner starts scanner setup.

### 7.4 Create Button States

Create with AI:

- Button label: `Create Project With Reviewed AI Plan`.
- Summary before click:
  - product profile will be created
  - selected service recommendations will be saved
  - scanner suggestions will be saved
  - readiness tasks will be seeded
  - attachments will be linked privately
  - temporary AI document access will be revoked

Create without AI:

- Button label: `Create Project Manually`.
- No AI recommendation claims.
- No service recommendations unless user manually selected services.

### 7.5 Analysis Chat Context

Keep the current project-analysis chat box explain-only.

Enhance chat context with:

- selected service recommendation IDs
- included/excluded services
- scanner suggestions
- readiness task preview
- document usage evidence

The chat may explain and compare, but it must not mutate.

## 8. LoomAI Contract Update

Update the project analysis output contract in the LoomAI handover and runtime prompt docs.

Add required fields:

```json
{
  "recommendedServiceModules": [
    {
      "moduleCode": "string",
      "moduleName": "string",
      "categorySlug": "string",
      "priority": "LOW|MEDIUM|HIGH|CRITICAL",
      "sequence": 1,
      "reason": "string",
      "evidenceBasis": ["string"],
      "expectedOutcome": "string",
      "confidence": 0.0
    }
  ],
  "missingCatalogCoverage": [
    {
      "need": "string",
      "reason": "string",
      "suggestedCatalogAction": "string"
    }
  ]
}
```

Runtime behavior requested from LoomAI:

- Use `context.serviceCatalogSnapshot`.
- Do not invent service names.
- Return catalog `moduleCode` values as the stable service identifiers.
- Treat `recommendedServices` as legacy display only.
- Continue temporary file URL usage requirements.
- Continue fail-closed document usage evidence.
- Do not call mutation tools during analysis.

## 9. Data Model Summary

Required or reused entities:

| Entity | Purpose | Created During Analysis | Created During Project Create |
| --- | --- | --- | --- |
| `ProductCreationIntent` | Short-lived analysis/action consent boundary | Yes | Updated to `CREATED` |
| `ProductProfile` | Durable owner product/project | No | Yes |
| `ProductProjectAttachment` | Private uploaded files | Yes, linked to intent | Relinked to product |
| `ProductProjectIntelligence` | Full structured owner-approved analysis | No | Yes |
| `ProductServiceRecommendation` | Catalog-backed recommended services | No | Yes |
| `ProductScannerRecommendation` | Scanner setup suggestions | No | Yes |
| `ProductReadinessTask` or existing task entity | Readiness/workspace setup tasks | No | Yes or deferred until workspace exists |

## 10. Validation Rules

Analysis response validation:

- `recommendedServiceModules[].moduleCode` must exist in the snapshot.
- `sequence` must be positive and unique after normalization.
- `priority` must use allowed enum values.
- `confidence` must be between 0 and 1.
- `documentUsage.status=USED` requires at least one evidence item.
- `sourceInsights` must include facts from used documents/public links.

Create-time validation:

- Creation intent must be `READY_FOR_ACTION`.
- Consent token must match.
- Intent must not be expired.
- Idempotency key must match or be safely replayed.
- Selected recommended modules must still exist in live catalog.
- Attachments must belong to the creation intent and owner.
- Temporary URLs must never be stored in durable intelligence JSON.

## 11. Testing Plan

Backend tests:

- Project analysis context includes service catalog snapshot.
- Snapshot excludes inactive catalog items.
- Prompt contract requires catalog `moduleCode` values.
- AI response parser handles `recommendedServiceModules`.
- Parser rejects invented modules or marks them as missing catalog coverage.
- Create with AI persists product profile plus structured intelligence.
- Create with AI creates service recommendations from selected modules.
- Create with AI creates scanner suggestions and readiness tasks.
- Create without AI does not create AI intelligence or AI recommendations.
- Temporary document URLs are absent from persisted JSON.
- Duplicate create action is idempotent.

Frontend tests:

- AI analysis displays structured services.
- Include/exclude service toggles affect create payload.
- Reordering affects service sequence.
- Scanner suggestions are visible before creation.
- Manual create path remains simple.
- Analysis chat remains explain-only.
- Mobile layout keeps the recommendation review usable.

Live staging verification:

- Run AI project analysis with owner brief, repo URL, public product URL, and one selected document.
- Confirm analysis returns catalog-backed `recommendedServiceModules`.
- Confirm recommendations reference real catalog module codes.
- Create project with selected recommendations.
- Confirm product exists.
- Confirm structured intelligence exists.
- Confirm service recommendations exist and point to catalog modules.
- Confirm scanner suggestions exist.
- Confirm temporary AI document access is revoked.

## 12. Implementation Sequence

### Sequence 1: Contract And Snapshot

- Add backend catalog snapshot builder.
- Add snapshot to project analysis context.
- Update LoomAI prompt/output contract.
- Add parser records for `recommendedServiceModules` and `missingCatalogCoverage`.
- Add unit tests for snapshot and parsing.

### Sequence 2: UI Review Surface

- Add recommended services review UI.
- Add scanner focus review UI.
- Add readiness goals/next steps preview.
- Add include/exclude/reorder behavior.
- Keep chat explain-only.

### Sequence 3: Create-Time Persistence

- Add structured project intelligence entity.
- Add product service recommendation entity or reuse existing package/cart/service-plan records if suitable.
- Add scanner recommendation entity or reuse existing scanner setup model.
- Add readiness task seeding using existing task/workspace model if available.
- Persist only when owner clicks Create Project.

### Sequence 4: Manual Creation Hardening

- Keep manual creation deterministic.
- Add optional advanced JSON import only if product owner explicitly chooses it.
- Validate JSON before using it.
- Do not silently run AI in manual creation.

### Sequence 5: Live Verification

- Deploy backend and frontend.
- Run analysis against staging.
- Verify catalog-backed recommendations.
- Create project.
- Verify persisted structured records.
- Verify UI reflects created plan.

## 13. Acceptance Criteria

This change is complete when:

- Project analysis receives a bounded live catalog snapshot.
- AI recommendations use real service module codes.
- The UI lets owners review selected service recommendations before create.
- No durable project intelligence is persisted during analysis.
- Create with AI persists structured intelligence and concrete project-linked recommendations.
- Create without AI remains owner-authored and does not create AI records.
- Document usage evidence is persisted as structured evidence without private URL or raw content leakage.
- Staging verification proves the created project uses AI analysis for real productization setup, not just text display.

## 14. Open Decisions

1. Should service recommendations be saved as standalone `ProductServiceRecommendation` records first, or immediately create draft service plan/cart records?

   Recommended: start with product-linked recommendations, then let owner add accepted services to a plan/cart.

2. Should readiness tasks be created immediately at project creation or deferred until workspace creation?

   Recommended: create product-level readiness task seeds immediately, then copy or promote them into workspace tasks when workspace is created.

3. Should manual creation support advanced JSON import?

   Recommended: support it only behind an explicit advanced control after the AI-assisted path is stable.

4. Should AI analysis automatically select testing pack modules?

   Recommended: AI can recommend testing catalog modules with evidence, but owner must approve inclusion before creation.

## 15. LoomAI Confirmed-Action Manifest Update Request

This section is the shareable contract note for LoomAI. It is not a blocker for the current ProdUS UI path because ProdUS sends the create payload to its own backend and the current MCP schema accepts additional properties. It should still be reflected in LoomAI's confirmed-action manifest examples before LoomAI tightens schema validation or relies on generated operator documentation.

### Requested LoomAI Update

Please update the confirmed-action manifest/examples for `produs_productization_project_create` / `produs.productization_project.create` to document these optional owner-approved fields:

- `recommendedServiceModules`
- `missingCatalogCoverage`

ProdUS now uses these fields to turn AI project analysis into concrete productization setup after the owner clicks Create Project.

### Payload Additions

```json
{
  "recommendedServiceModules": [
    {
      "moduleCode": "launch.readiness_review",
      "moduleName": "Launch readiness",
      "categorySlug": "launch-readiness",
      "priority": "MUST",
      "sequence": 1,
      "reason": "Owner needs evidence-backed production readiness before launch.",
      "evidenceBasis": "Owner brief, repository URL, selected documents, public product URL, or explicit assumption.",
      "expectedOutcome": "Owner has a concrete readiness decision path with required proof.",
      "confidence": 0.9,
      "accepted": true
    }
  ],
  "missingCatalogCoverage": [
    {
      "need": "Capability requested by the owner that does not map to a current ProdUS service module.",
      "reason": "Why the current catalog does not have an exact fit.",
      "suggestedCatalogAction": "Catalog module or template to consider adding later."
    }
  ]
}
```

### Field Rules

- `recommendedServiceModules[].moduleCode` must be one of the module codes returned by ProdUS in `context.serviceCatalogSnapshot.candidateModules`.
- LoomAI should not invent service names or module codes.
- If the owner needs something outside the supplied catalog snapshot, put it in `missingCatalogCoverage` instead of `recommendedServiceModules`.
- `priority` must be one of `MUST`, `SHOULD`, `COULD`, or `LATER`.
- `sequence` starts at `1` and represents the owner-reviewed service plan order.
- `confidence` must be a number from `0` to `1`.
- `accepted` is controlled by ProdUS owner review UI; omitted values should be treated as owner-review required, not automatically accepted.

### ProdUS Backend Behavior

When the owner approves project creation, ProdUS:

- validates each accepted `recommendedServiceModules[].moduleCode` against the live service catalog;
- rejects invalid accepted module codes fail-closed;
- persists the complete owner-approved analysis as `ProductProjectIntelligence`;
- persists accepted modules as `ProductServiceRecommendation` records linked to the created product;
- persists scanner focus areas as `ProductScannerRecommendation` records;
- persists readiness goals, suggested next steps, and missing evidence as `ProductReadinessTask` records;
- does not persist temporary document URLs or raw private document content.

### Current Compatibility

Current status:

- ProdUS backend accepts these fields through the existing action payload path.
- ProdUS MCP schema currently allows additional properties, so this is not blocking.
- Manifest/example alignment is recommended so future strict schema validation does not drop or reject these fields.
