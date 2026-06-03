# AI Opportunities And LoomAI Integration Implementation Plan

Date: 2026-06-03
Status: implementation plan
Audience: ProdUS product, backend, frontend, catalog, network, and LoomAI integration owners

## 1. Source Documents

This plan builds from these documents:

- `docs/planning/AI-Integration-Services/PRODUS_AI_INTEGRATION_OPPORTUNITY.md`
- `docs/planning/AI-Integration-Services/AI_INTEGRATION_SERVICE_DESIGN.md`
- `docs/planning/Scanners-AI-integration/LOOMAI_PRODUCT_AI_INTEGRATION_PLAN.md`
- `docs/LOOMAI_STAGING_DEPLOYMENT_HANDOVER.md`

The key change from the earlier opportunity brief is the partner model:

- LoomAI is the only recommended AI integration platform in ProdUS.
- Delivery is not limited to LoomAI internal staff. Verified teams and solo experts can provide LoomAI integration services when marked as `LoomAI Partner`.
- Owner trust still requires clear disclosure: ProdUS recommends LoomAI as the AI runtime/integration platform; delivery provider choice is between LoomAI-capable partners.

## 2. Current Catalog Check

Current code check on 2026-06-03:

- `PlatformDemoSeedService.seedCatalogCategories()` does not include an `AI Integration` category.
- `PlatformDemoSeedService.seedCatalogModules()` does not include AI Integration modules.
- Existing service catalog categories include validation, code rewrite, scaling, cloud/devops, database, security, quality/testing, launch readiness, and operations/support.

Implementation must add an `AI Integration` category and service modules before the AI opportunity report can create useful package/cart/service recommendations.

## 3. Product Decision

AI opportunities analysis is a separate LoomAI chat request. It is accumulated into the project analysis result and project creation intent, but it must not be blocked by the normal project analysis request.

The owner can choose one of two analysis modes:

1. **Full Analysis**
   - Runs project analysis.
   - Runs standalone AI opportunities analysis.
   - Runs standalone LoomAI implementation overview after opportunities are available.
   - Merges all successful analysis blocks into the project creation intent.

2. **AI Integration Only**
   - Skips the full project-readiness analysis request.
   - Runs standalone AI opportunities analysis.
   - Runs standalone LoomAI implementation overview after opportunities are available.
   - Uses owner-provided fields as the project creation base and seeds AI Integration service options only.

Failure behavior:

| Project Analysis | AI Opportunities | LoomAI Overview | Project Creation Behavior |
|---|---|---|---|
| Success | Success | Success | Create with full project intelligence, service recommendations, AI opportunities, and LoomAI integration overview. |
| Success | Success | Fail | Create with project intelligence and AI opportunities; show LoomAI overview unavailable. |
| Success | Fail | Skipped | Create with project intelligence only. |
| Fail | Success | Success or fail | Allow creation if owner-provided required fields are present. Persist AI opportunities into project intelligence and seed AI Integration service options. |
| Fail | Fail | Skipped | Do not create by AI action unless deterministic fallback can produce required fields. Owner can still create manually. |

This matters because AI opportunities may be useful even if the project analysis response fails schema validation or times out.

## 4. User Journey

### 4.1 Owner Intake

The project creation page presents a mode selector:

- `Full analysis`
- `AI integration only`

Default: `Full analysis with AI opportunities`, unless LoomAI is unavailable.

Owner inputs remain the primary context for both modes:

- owner brief
- product name, if provided
- business stage
- product URL
- repository URL
- tech stack
- risk/constraints notes
- selected temporary documents
- selected repository/source context

### 4.2 Full Analysis Flow

```text
Owner submits intake
  -> ProdUS stores private attachments and temporary AI document access grants
  -> ProdUS runs project analysis request
  -> ProdUS runs AI opportunities request independently
  -> ProdUS runs LoomAI implementation overview request if opportunities exist
  -> ProdUS merges successful analysis blocks into ProductCreationIntent
  -> UI shows project attributes + AI opportunities + LoomAI support overview
  -> Owner reviews and creates project
  -> ProdUS creates product/profile/cart/workspace seeds from owner-approved payload
```

### 4.3 Project Creation

Project creation uses owner-approved data only. LoomAI analysis does not directly mutate database state.

When the owner clicks `Create Project with AI Action`, the creation payload includes:

- required product fields from owner input and project analysis
- accepted catalog service recommendations
- AI opportunity report summary and use cases
- recommended AI Integration service modules
- LoomAI implementation overview
- provider request IDs for audit
- document usage evidence

If project analysis fails but AI opportunities succeed, project creation may still proceed using:

- owner-provided product name or deterministic generated title
- owner brief as summary
- owner-provided stage
- owner-provided product/repository URLs
- AI opportunities as project intelligence
- AI Integration consultation/service recommendations

## 5. Catalog Implementation

### 5.1 New Category

Add category:

```text
slug: ai-integration
name: AI Integration
description: Identify, design, implement, and operate LoomAI-powered product capabilities with governed evidence and owner control.
sortOrder: after Scanner/Evidence or after Operations/Support
```

### 5.2 New Service Modules

Use stable module codes, not free-text names.

| Stable Code | Slug | Name | Purpose | Type |
|---|---|---|---|---|
| `ai.opportunity_analysis` | `ai-opportunity-analysis` | AI opportunity analysis | Identify product-specific AI use cases and score fit. | Automated/free analysis |
| `ai.integration_consultation` | `ai-integration-consultation` | LoomAI integration consultation | Produce architecture, scope, cost, timeline, and readiness plan for LoomAI integration. | Paid consultation |
| `ai.assistant_implementation` | `ai-assistant-implementation` | LoomAI assistant implementation | Add Companion/Thinker/Resolver assistant surfaces to the owner's product. | Implementation |
| `ai.knowledge_pipeline` | `ai-knowledge-pipeline` | LoomAI knowledge pipeline | Configure managed vectorization, RAG, retrieval testing, and knowledge freshness. | Implementation |
| `ai.mcp_tool_integration` | `ai-mcp-tool-integration` | LoomAI MCP tool integration | Build read/action tools that connect LoomAI to the owner's product APIs with authorization. | Implementation |
| `ai.operations_optimization` | `ai-operations-optimization` | LoomAI operations and optimization | Monitor usage, quality, retrieval performance, costs, prompts, and runtime health. | Recurring support |

### 5.3 Dependencies

Recommended dependencies:

- `ai.assistant_implementation` requires `ai.integration_consultation`.
- `ai.knowledge_pipeline` requires `ai.integration_consultation`.
- `ai.mcp_tool_integration` requires `ai.integration_consultation`.
- `ai.operations_optimization` requires at least one implementation module.
- `ai.knowledge_pipeline` may require `security.auth_access_control_review` when personalized/private user content is involved.
- `ai.mcp_tool_integration` may require `security.api_security_review` when actions or private data access are involved.

### 5.4 Package/Cart Behavior

If AI opportunity score is:

- `80-100`: recommend `ai.integration_consultation` as `MUST`.
- `50-79`: recommend `ai.integration_consultation` as `SHOULD`.
- `20-49`: show opportunities, do not auto-add to cart.
- `0-19`: record no-fit analysis, do not recommend service.

Owner must explicitly add AI Integration services to the cart, except when creating a project with full analysis and the UI asks the owner to accept the recommended AI Integration consultation.

## 6. LoomAI Partner Model

### 6.1 Provider Model

LoomAI is the recommended AI integration platform. Teams and solo experts are delivery providers for LoomAI-based work.

Labels:

- `LoomAI Recommended Platform`: shown on AI opportunity/detail screens.
- `LoomAI Partner`: shown on team/solo expert profiles that can deliver LoomAI integration.
- `LoomAI Certified Partner`: optional higher trust tier once certification exists.

### 6.2 Team/Solo Expert Data

Add separate profile identifiers, not just service tags:

```text
loomaiPartnerStatus: NONE | PARTNER | CERTIFIED_PARTNER | INTERNAL
loomaiPartnerType: TEAM | SOLO_EXPERT
loomaiCapabilities: COMPANION, THINKER, RESOLVER, RAG, MCP, MANAGED_VECTORIZATION, WIDGET_INTEGRATION, PROMPT_DESIGN, AI_OPERATIONS
loomaiDeliveryEvidenceCount: number
loomaiCertificationLevel: NONE | PRACTITIONER | SPECIALIST | EXPERT
loomaiPartnerVerifiedAt: timestamp
```

This should live on team profile and solo expert profile, not on the normal user role. A user may be a team member without the team being a LoomAI Partner.

### 6.3 Matching

When owner adds an AI Integration service:

- default recommended runtime/platform: LoomAI
- matched providers: teams/solo experts with `loomaiPartnerStatus != NONE`
- ranking signals:
  - relevant LoomAI capabilities
  - matching service module capability
  - delivery evidence
  - availability
  - reputation
  - industry/domain fit

## 7. Backend Data Model

Use `product_profiles`, not generic `products`.

### 7.1 AI Opportunity Report

```sql
CREATE TABLE ai_opportunity_reports (
    id UUID PRIMARY KEY,
    product_profile_id UUID REFERENCES product_profiles(id),
    creation_intent_id UUID REFERENCES product_creation_intents(id),
    status VARCHAR(40) NOT NULL,
    overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
    confidence VARCHAR(20),
    summary TEXT,
    methodology_summary TEXT,
    readiness_factors JSONB,
    loomai_provider_request_id VARCHAR(255),
    analysis_version VARCHAR(40),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

`product_profile_id` is nullable until project creation completes. During intake, the report is attached to `creation_intent_id`.

### 7.2 AI Opportunity Use Cases

```sql
CREATE TABLE ai_opportunity_use_cases (
    id UUID PRIMARY KEY,
    report_id UUID REFERENCES ai_opportunity_reports(id),
    external_key VARCHAR(120),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    target_workflow TEXT,
    user_value TEXT,
    business_value TEXT,
    loomai_services TEXT,
    fit_score INTEGER CHECK (fit_score BETWEEN 0 AND 100),
    confidence VARCHAR(20),
    integration_complexity VARCHAR(30),
    estimated_impact JSONB,
    prerequisites TEXT,
    risks TEXT,
    evidence TEXT,
    caveats TEXT,
    recommended_service_modules JSONB,
    dismissed BOOLEAN NOT NULL DEFAULT FALSE,
    accepted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

### 7.3 LoomAI Implementation Overview

```sql
CREATE TABLE ai_loomai_integration_overviews (
    id UUID PRIMARY KEY,
    report_id UUID REFERENCES ai_opportunity_reports(id),
    provider_request_id VARCHAR(255),
    summary TEXT,
    recommended_starting_point TEXT,
    loomai_capability_map JSONB,
    implementation_steps JSONB,
    owner_decisions JSONB,
    risks JSONB,
    estimated_timeline TEXT,
    estimated_effort TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

## 8. Backend API

### 8.1 Analyze Product Intake

Existing endpoint should accept an analysis mode:

```http
POST /api/products/ai-assisted/analyze
Content-Type: multipart/form-data
```

New field:

```text
analysisMode=FULL_WITH_AI_OPPORTUNITIES | AI_OPPORTUNITIES
```

Response additions:

```json
{
  "analysisMode": "FULL_WITH_AI_OPPORTUNITIES",
  "analysisBlocks": {
    "projectAnalysis": {
      "status": "SUCCESS",
      "providerRequestId": "rag-project-..."
    },
    "aiOpportunities": {
      "status": "SUCCESS",
      "providerRequestId": "rag-ai-opportunities-...",
      "report": {}
    },
    "loomaiIntegrationOverview": {
      "status": "SUCCESS",
      "providerRequestId": "rag-loomai-overview-...",
      "overview": {}
    }
  }
}
```

### 8.2 AI Opportunities Standalone

For product/workspace pages:

```http
POST /api/products/{productId}/ai-opportunities/analyze
GET /api/products/{productId}/ai-opportunities
PATCH /api/products/{productId}/ai-opportunities/use-cases/{useCaseId}
POST /api/products/{productId}/ai-opportunities/use-cases/{useCaseId}/add-to-cart
POST /api/products/{productId}/ai-opportunities/loomai-overview
```

### 8.3 Security

- Browser calls ProdUS backend only.
- ProdUS backend calls LoomAI direct private runtime.
- Use `mode=thinker` for opportunity and overview requests.
- Use `/query-once` for non-conversational analysis.
- Use `/query` only for owner chat panels that should retain conversation state.
- No LoomAI runtime secrets in browser.
- Do not bulk-index private product/workspace state.

## 9. LoomAI Request 1: AI Opportunities Analysis

### 9.1 Context

The AI opportunities request is standalone and must receive owner input directly. It can also receive project analysis if it succeeded, but it must not depend on it.

Context should include:

```json
{
  "purpose": "ai_opportunity_analysis",
  "ownerInput": {
    "ownerBrief": "...",
    "productName": "...",
    "businessStage": "PROTOTYPE",
    "productUrl": "...",
    "repositoryUrl": "...",
    "techStack": "...",
    "riskNotes": "..."
  },
  "projectAnalysis": {
    "available": true,
    "summary": "...",
    "recommendedServiceModules": [],
    "scannerFocusAreas": [],
    "documentUsage": []
  },
  "catalogSnapshot": {
    "aiIntegrationModules": [
      {
        "moduleCode": "ai.integration_consultation",
        "name": "LoomAI integration consultation",
        "outcome": "Owner receives a scoped LoomAI deployment plan.",
        "tags": ["loomai", "consultation", "architecture"]
      }
    ]
  },
  "loomaiCapabilities": [
    "COMPANION",
    "THINKER",
    "RESOLVER",
    "RAG",
    "MCP",
    "MANAGED_VECTORIZATION",
    "MAX_MODE_WIDGET",
    "FIXED_CHAT_BOX"
  ],
  "constraints": {
    "recommendedPlatform": "LoomAI",
    "doNotRecommendOtherAiVendors": true,
    "analysisMustBeEvidenceBased": true
  }
}
```

### 9.2 Prompt

Use a high-quality, evidence-oriented prompt:

```text
You are analyzing whether this specific product has valuable LoomAI integration opportunities.

Use the owner input as primary context. If project analysis is available, use it as supporting context. If selected documents or repository facts are available, use them as evidence. Do not produce generic "add a chatbot" advice.

Task:
1. Identify concrete AI use cases that would improve this specific product.
2. Explain the user or business value of each use case.
3. Name where it would attach in the product workflow.
4. Map each use case to LoomAI capabilities only: Companion, Thinker, Resolver, RAG, MCP, managed vectorization, Max Mode widget, fixed chat box.
5. Recommend only ProdUS catalog module codes from the provided AI Integration catalog snapshot.
6. Include prerequisites, risks, effort, complexity, and confidence.
7. Include honest "not recommended" areas when AI would not add enough value.
8. Return evidence for each recommendation. Evidence can come from owner input, project analysis, repository/document facts, scanner facts, or product URL facts.

Do not recommend non-LoomAI AI platforms. LoomAI is the recommended AI integration platform for ProdUS.
Do not claim evidence you do not have.
Do not include private secrets, raw logs, tokens, or private URLs.

Return strict JSON only using this schema:
{
  "overallScore": 0,
  "confidence": "low|medium|high",
  "summary": "",
  "methodologySummary": "",
  "useCases": [
    {
      "key": "",
      "title": "",
      "description": "",
      "targetWorkflow": "",
      "userValue": "",
      "businessValue": "",
      "loomaiCapabilities": [],
      "fitScore": 0,
      "confidence": "low|medium|high",
      "integrationComplexity": "low|moderate|high",
      "estimatedImpact": {
        "metric": "",
        "estimate": "",
        "basis": ""
      },
      "prerequisites": [],
      "risks": [],
      "evidence": [],
      "caveats": [],
      "recommendedServiceModules": [
        {
          "moduleCode": "ai.integration_consultation",
          "priority": "MUST|SHOULD|COULD",
          "reason": ""
        }
      ]
    }
  ],
  "notRecommended": [
    {
      "area": "",
      "reason": "",
      "evidence": []
    }
  ],
  "readinessFactors": {
    "userInteractionSurface": 0,
    "dataAndContentRichness": 0,
    "technicalIntegrationReadiness": 0,
    "businessDomainFit": 0,
    "privacyAndGovernanceReadiness": 0
  },
  "ownerQuestions": [],
  "nextSteps": []
}
```

## 10. LoomAI Request 2: LoomAI Implementation Overview

This is a second standalone chat request. It runs only when AI opportunities exist.

Purpose: help the owner understand how LoomAI can support easy integration and implementation for the selected or top opportunities.

### 10.1 Context

```json
{
  "purpose": "loomai_integration_overview",
  "ownerInput": {},
  "aiOpportunityReport": {},
  "loomaiCapabilities": {
    "Companion": "Conversational assistant for product users or operators.",
    "Thinker": "Reasoning and structured analysis.",
    "Resolver": "Governed action execution.",
    "RAG": "Retrieval over product knowledge.",
    "MCP": "Tool access to product APIs.",
    "ManagedVectorization": "LoomAI-managed ingestion, indexing, retrieval checks.",
    "MaxModeWidget": "Hosted embeddable AI overlay.",
    "FixedChatBox": "Persistent in-page assistant panel."
  },
  "deliveryModel": {
    "recommendedPlatform": "LoomAI",
    "providers": "LoomAI Partners: verified teams or solo experts"
  }
}
```

### 10.2 Prompt

```text
You are explaining how LoomAI can support implementation of the AI opportunities identified for this product.

Use the AI opportunity report as source context. Be practical, owner-facing, and implementation-oriented.

Explain:
1. Which LoomAI capabilities would be used and why.
2. The simplest first integration path.
3. What ProdUS would prepare: catalog service plan, workspace milestones, evidence, partner matching.
4. What the LoomAI Partner would implement.
5. What the owner must decide.
6. Risks and prerequisites.
7. A recommended delivery sequence.

Do not claim the integration is automatic. Do not imply LoomAI replaces implementation work. Do not recommend other AI vendors.

Return strict JSON:
{
  "summary": "",
  "recommendedStartingPoint": "",
  "capabilityMap": [
    {
      "opportunityKey": "",
      "loomaiCapabilities": [],
      "why": "",
      "ownerValue": ""
    }
  ],
  "implementationSteps": [
    {
      "sequence": 1,
      "title": "",
      "description": "",
      "produsRole": "",
      "loomaiPartnerRole": "",
      "evidenceProduced": []
    }
  ],
  "ownerDecisions": [],
  "risks": [],
  "estimatedTimeline": "",
  "estimatedEffort": "",
  "recommendedServiceModules": []
}
```

## 11. Accumulation Into Project Creation

`ProductCreationIntent` should store analysis blocks separately:

```json
{
  "projectAnalysis": {},
  "aiOpportunities": {},
  "loomaiIntegrationOverview": {}
}
```

Do not merge them into one untyped blob. The create action should receive a normalized owner-approved payload:

```json
{
  "creationIntentId": "...",
  "consentToken": "...",
  "idempotencyKey": "...",
  "productName": "...",
  "summary": "...",
  "recommendedServiceModules": [],
  "aiOpportunityReport": {
    "overallScore": 82,
    "summary": "...",
    "acceptedUseCases": []
  },
  "loomaiIntegrationOverview": {
    "summary": "...",
    "recommendedStartingPoint": "..."
  }
}
```

On project creation:

- Persist product profile.
- Persist project intelligence.
- Persist AI opportunity report and use cases.
- Persist LoomAI implementation overview.
- Seed product service recommendations.
- Add accepted AI Integration service modules to the cart.
- Keep owner able to remove or change services before workspace conversion.

## 12. Frontend UX

### 12.1 Project Creation

Add an analysis mode segmented control:

- `Full analysis`
- `AI integration only`

When full analysis is selected, show project readiness plus AI integration progress states. When AI integration only is selected, show AI opportunity and LoomAI implementation progress without the broader readiness-analysis step:

- Product analysis
- AI opportunities
- LoomAI integration overview

Each state can succeed/fail independently.

### 12.2 AI Opportunities Panel

Show after analysis:

- overall score
- confidence
- top opportunities
- no-fit areas
- evidence
- caveats
- recommended services
- `Add LoomAI Integration Consultation`

Use direct, transparent wording:

```text
Recommended AI platform: LoomAI
Delivery can be provided by verified LoomAI Partner teams or solo experts.
```

### 12.3 LoomAI Overview Panel

Show:

- how LoomAI supports the selected opportunity
- simplest starting path
- implementation sequence
- owner decisions
- recommended LoomAI Partner next step

### 12.4 Product Workspace

After project creation, expose:

- AI Opportunities tab or card in diagnosis/workspace
- selected opportunities
- LoomAI service plan
- LoomAI Partner matching shortcut
- AI chat box can discuss the opportunity report as page context

## 13. MCP And LoomAI Action Contract

No new mutation action is required for Phase 1.

Read-only actions that help LoomAI answer service questions:

- `produs.catalog.search`
- `produs.catalog.export`
- product/package/workspace/finding/evidence read actions already imported

Future mutation actions should be separate confirmed actions:

- `produs.ai_opportunity.add_to_cart`
- `produs.ai_opportunity.dismiss`
- `produs.loomai_partner.shortlist`

Do not import future mutation tools into LoomAI runtime until confirmation UX and audit enforcement exist.

## 14. Safe Knowledge And Vectorization

Add new safe records to LoomAI managed vectorization:

- AI Integration service category
- AI Integration service modules
- LoomAI capability contracts
- LoomAI Partner explanation
- milestone templates for AI Integration Consultation
- evidence templates for LoomAI deployment plan, RAG quality test, MCP tool schema review, prompt review, runtime health check

These are safe shared platform records. Do not index private owner opportunity reports. Private reports are supplied to chat as authorized page context or via ProdUS read tools.

## 15. Testing

Backend tests:

- full analysis runs three blocks and persists all successful blocks
- project analysis failure plus AI opportunities success still allows creation with owner fields
- AI opportunities failure does not block deterministic owner-field creation when required fields are present
- AI opportunity report schema validates score ranges and module codes
- adding AI Integration consultation to cart uses catalog module ID, not free text
- LoomAI Partner filtering only returns tagged teams/solo experts

Frontend tests:

- analysis mode selector changes request payload
- full analysis shows independent progress states
- failed AI opportunities panel does not hide successful project analysis
- successful opportunities panel allows add-to-cart
- LoomAI overview panel renders owner decisions and delivery sequence

Live verification:

- run full analysis for `mahmoudashraf/ProdUS` with README attachment
- verify project analysis succeeds
- verify AI opportunities produces at least one evidence-backed use case
- verify LoomAI overview references the use case and LoomAI capabilities
- create project from full analysis
- verify product page contains AI opportunity report
- verify cart contains accepted AI Integration service modules
- verify chat can answer questions about the AI opportunity report from page context

## 16. Implementation Sequence

1. Add AI Integration catalog category and modules.
2. Add LoomAI Partner fields to team and solo expert profiles.
3. Add AI opportunity report/use-case/overview persistence.
4. Extend project analysis request with `analysisMode`.
5. Add standalone AI opportunities LoomAI `thinker` request.
6. Add standalone LoomAI implementation overview request.
7. Accumulate analysis blocks into `ProductCreationIntent`.
8. Extend AI creation payload to persist AI opportunities and seed AI Integration services.
9. Add project creation UI mode selector and panels.
10. Add workspace/diagnosis AI Opportunities card.
11. Add cart integration for AI Integration Consultation.
12. Add LoomAI Partner filtering and matching.
13. Add safe knowledge export records for AI Integration catalog/capability content.
14. Run backend, frontend, and live staging verification.

## 17. Readiness Assessment

Ready to implement:

- LoomAI backend-mediated runtime path.
- `thinker` mode for standalone analysis.
- `/query-once` for non-persistent helpers.
- Managed vectorization for safe catalog knowledge.
- Existing service recommendation persistence into project creation.
- Existing cart/service module architecture.

Needs implementation:

- AI Integration catalog category/modules.
- AI opportunities data model and API.
- LoomAI Partner profile fields.
- Full analysis orchestration.
- LoomAI overview request.
- UI panels and cart actions.

Needs LoomAI coordination:

- No new secrets expected.
- Confirm `thinker` remains the mode for both AI Opportunities and LoomAI Overview.
- Confirm no new runtime action is required for Phase 1.
- After catalog/vectorization changes, ask LoomAI to rerun managed vectorization so the new AI Integration service records are retrievable.

## 18. Implementation Status - 2026-06-03

Status: project creation slice implemented and locally verified.

Implemented in this slice:

- Added project creation `analysisMode` with `FULL_WITH_AI_OPPORTUNITIES` and `AI_OPPORTUNITIES`.
- Added standalone AI opportunities analysis request from ProdUS backend to LoomAI `/query-once` using `thinker` mode, with deterministic fallback when LoomAI is disabled or unavailable.
- Added standalone LoomAI implementation overview request, also backend-mediated and `thinker` mode.
- Added AI Integration catalog category and LoomAI-focused service modules:
  - `ai.loomai_opportunity_assessment`
  - `ai.loomai_integration_implementation`
  - `ai.scanner_finding_assistant`
  - `ai.service_plan_assistant`
- Merged full-analysis results into the owner-approved project creation action payload.
- Persisted the full AI opportunity report and LoomAI overview inside project intelligence when the owner creates the project.
- Seeded accepted AI Integration service modules into service recommendations/cart items through the existing service module persistence path.
- Replaced project-only behavior with AI Integration-only behavior so owners can evaluate LoomAI opportunities without running full project-readiness analysis.
- Added owner UI mode selector, AI opportunity panel, LoomAI implementation path panel, and validation rail updates.
- Added analysis chat page context for AI opportunities and LoomAI overview so the fixed chat/max-mode assistant can reason about the current project analysis page.

Intentionally not implemented in this slice:

- Dedicated `ai_opportunity_reports` and `ai_opportunity_use_cases` tables. Current persistence uses the existing `product_project_intelligence.analysis_json` and service recommendation records, which is enough for project creation and workspace handoff.
- LoomAI Partner profile fields on teams/solo experts. The catalog now supports LoomAI Integration services, but provider certification/badge filtering remains a network/profile follow-up.
- New LoomAI mutation action. Project creation still uses the existing owner-approved ProdUS creation action path.

Verification completed:

- `mvn -q test` from `backend` passed.
- `mvn -q clean -Dtest=AiAssistedProductCreationServiceTest test` passed.
- `npm run type-check` from `frontend` passed.
- `npm run build` from `frontend` passed.
- Local backend smoke with H2/mock auth passed for `FULL_WITH_AI_OPPORTUNITIES`.
- Local backend smoke with H2/mock auth passed for `AI_OPPORTUNITIES`.
- Local create-action smoke created a product with:
  - repository URL persisted;
  - scan source created;
  - 8 service recommendations;
  - 7 scanner recommendations;
  - 9 readiness tasks;
  - 8 cart service items;
  - project intelligence record.
- Local frontend production server rendered `/products/new`.
- Authenticated Playwright screenshot assertions passed for `Full analysis` and `AI integration only` UI selectors.

Current LoomAI follow-up:

- No new runtime action or secret is required for this project-creation slice.
- Ask LoomAI to rerun managed vectorization after this code is deployed so the new AI Integration catalog records are retrievable in LoomAI RAG/service answers.
- If LoomAI documents examples for the confirmed project creation action, include optional fields `analysisMode`, `aiOpportunityReport`, and `loomaiIntegrationOverview` in the example payload. ProdUS already accepts these fields through the backend payload path.
