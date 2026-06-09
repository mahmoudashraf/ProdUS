# Product AI Refresh And Language Plan

Date: 2026-06-09

## Plain Definitions

**Project Start Plan** currently means the first owner-approved service/delivery plan for a product. For MVP/startup owners, this should read as **Service Plan** or **Launch Plan** depending on context:

- Use **Service Plan** when the page is about selected services, scope, teams, and commercial next steps.
- Use **Launch Plan** when the page is about blockers, evidence, and what must happen before pilot/beta/launch.
- Avoid using **Project Start Plan** as a headline unless it is transitional compatibility text.

## Language Direction

Current terms that feel too internal or enterprise-heavy:

- **Command Center** -> **Product Home** or **Workspace Home**
- **Hub** -> **Home** or omit when the navigation already implies it
- **Project Start Plan** -> **Service Plan** or **Launch Plan**
- **Plan Library** -> **Service Plans**
- **Productization Workspaces** -> **Product Workspaces** or **Delivery Workspaces**

Rule: owner-facing screens should say what the owner is deciding, not what the internal system is doing.

## AI Reality Audit

### Real AI Or Provider-Backed When Configured

- Product onboarding analysis through `/api/products/ai-assisted/analyze`.
- LoomAI project creation analysis when the provider is configured and returns parseable structured fields.
- LoomAI AI-opportunity analysis and LoomAI integration overview when configured.
- Assistant suggestions and assistant answers where the response indicates a live provider mode/request id.

### Deterministic Or Stored Logic, Not AI

- Launch readiness score/verdict from scanner evidence and diagnosis data.
- Scanner normalization, owner risk grouping, scanner-to-service mapping, and coverage summaries.
- Latest launch readiness report generation state; it is stored and only changes when generated.
- Service catalog fallback recommendation top-ups used to keep the start/service plan useful.
- Repository signal extraction fallback and public link safe snapshots.

### Fallback/Hardcoded AI-Labeled Areas To Keep Honest

- Any UI badge that says fallback should remain visible when LoomAI is disabled or unavailable.
- Deterministic fallback summaries should not be marketed as live AI.
- Seed/demo capabilities, mock auth data, and tests/stubs should stay clearly separate from owner-facing claims.

## Implementation Slice

Build **Refresh Product Brief** for an existing selected product.

Owner journey:

1. Product Home remains the decision surface.
2. Owner opens an internal view: **Refresh Product Brief**.
3. Owner can rerun AI analysis using the current product profile plus an optional note.
4. AI returns suggested product fields.
5. Owner chooses which fields to apply.
6. ProdUS updates the product through the normal product update endpoint. The AI does not mutate records directly.

Backend:

- Add an existing-product AI analysis endpoint that reuses the current analysis service in analysis-only mode.
- Include current product name, summary, stage, stack, URLs, and risk notes in the owner brief/context.
- Keep the response shape compatible with existing `AiAssistedProductAnalysisResponse`.
- Tune the prompt to make `draftName` a suggested owner-visible product name, especially when the current name is blank/generic.

Frontend:

- Add an Overview internal view: **Refresh brief**.
- Show current product values beside AI suggestions.
- Use owner-selected checkboxes for fields: name, summary, stage, stack, product URL, repository URL, risk notes.
- Apply selected fields through `PUT /api/products/{id}`.
- Refresh `products`, selected product data, repo signals when URL/stack fields change, and readiness context.

Verification:

- Backend test for existing-product analysis endpoint and owner access.
- Frontend type-check/build.
- Local UI route verification.
- Deploy and live verify with screenshots once the batch is stable.

