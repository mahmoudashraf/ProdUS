# Product AI Refresh And Language Plan

Date: 2026-06-09
Updated: 2026-06-10

## Goal

Make ProdUS feel clear to startup, MVP, prototype, and nontechnical product owners.

Owner-facing screens should use light product language. The product owner should understand:

- what product is selected
- what the current launch decision is
- what AI opportunities already exist
- what can be refreshed with AI
- what plan needs owner approval
- what action should happen next

Rule: say what the owner is deciding, not what the internal system is doing.

## Product Language Decisions

Use **Product** in owner-facing language unless we truly mean a delivery workspace after approval.

Preferred labels:

- **Product Home**: selected product state, launch decision, next best action, and routes to deeper product views.
- **AI Opportunities**: accepted AI opportunities, LoomAI fit, and a route to refresh analysis.
- **Planning**: left-menu area for approving the product plan.
- **Product Plan**: page headline/artifact inside Planning. This is the selected services, team, scope, and approval path for the product.
- **Action Plan**: what must be fixed or handled next before launch, beta, pilot, or customer sharing.
- **Findings**: evidence, scanner output, and technical proof.
- **Services**: available or recommended service options.
- **Share**: controlled external sharing.

Avoid these owner-facing terms:

- **Project Start Plan**
- **Project cart**
- **Command Center**
- **Hub**
- **Plan Library**
- **Productization Workspaces**

Compatibility note: old route names, component names, and database concepts may stay for now, but visible copy should move to the preferred labels.

## Plain Definitions

### Product Home

The product's main decision surface.

It should show:

- selected product fixed at the top
- current launch verdict
- next best action
- active blockers or ready-for-review state
- visible entry to AI Opportunities
- visible entry to Planning / Product Plan
- routes to Action Plan, Findings, Services, and Share

### AI Opportunities

The product's AI home.

It should show what already exists, not just a form to request a scan.

It should show:

- accepted AI opportunities for this product
- LoomAI fit and integration direction
- services shaped by AI
- scanner focus areas shaped by AI
- next owner steps
- clear route to **Refresh analysis**
- clear route to **LoomAI integration**

### Refresh Analysis

An internal AI Opportunities view.

The owner can:

- rerun AI opportunity analysis
- include a short note about what changed
- attach files
- choose which attached files AI can use
- review the new result
- accept all, some, or none of the suggested updates

AI must not directly mutate the product. Owner approval saves the selected result.

### LoomAI Integration

An internal AI Opportunities view.

It should feel like a home for LoomAI fit, not another scan form.

It should show:

- recommended starting point
- capabilities to consider
- implementation path
- owner decisions
- AI opportunities that depend on LoomAI
- route back to AI Opportunities home
- route to Refresh analysis when new context is needed

### Planning / Product Plan

The pre-work approval page for a product.

It is not the product itself. It is the product's draft plan:

- selected services
- readiness gaps
- team or expert choices
- scope owner should approve
- whether delivery can start

Use:

- left menu: **Planning**
- page headline: **Product Plan**
- helper copy: "Approve the services, team, and scope for this product before starting delivery."

### Action Plan

The fix-next page.

It should answer:

- what is blocking launch
- what should be fixed now
- what can wait
- which findings map to which service
- what evidence proves the fix

Action Plan is about readiness problems. Planning is about approving service/team/scope.

## AI Reality Audit

### Real AI Or Provider-Backed When Configured

- Product onboarding analysis through `/api/products/ai-assisted/analyze`.
- Existing-product refresh analysis through `/api/products/{id}/ai-assisted/analyze`.
- LoomAI AI-opportunity analysis when configured.
- LoomAI integration overview when configured.
- Assistant suggestions and assistant answers when the response indicates a live provider mode or request id.

### Deterministic Or Stored Logic, Not AI

- Launch readiness score and verdict from scanner evidence and diagnosis data.
- Scanner normalization, owner risk grouping, scanner-to-service mapping, and coverage summaries.
- Latest launch readiness report generation state.
- Service catalog fallback recommendations.
- Repository signal extraction fallback.
- Public share safe snapshots.

### Honesty Rules

- If LoomAI is unavailable and fallback logic is used, say **Fallback analysis**.
- Do not market deterministic summaries as live AI.
- Keep seed/demo/test data separate from owner-facing claims.
- Prefer labels such as **Live AI**, **Fallback analysis**, **Stored logic**, and **Scanner evidence**.

## Implemented Product AI Refresh Behavior

### Product Brief Refresh

Owner journey:

1. Product Home remains the decision surface.
2. Owner opens internal view **Refresh brief**.
3. Owner reruns analysis using the current product profile plus an optional note.
4. AI returns suggested product fields.
5. Owner chooses which fields to apply.
6. ProdUS updates the product through the normal product update endpoint.

Fields owner can approve:

- product name
- summary
- stage
- tech stack
- product URL
- repository URL
- risk notes

Backend requirements:

- Include current product name, summary, stage, stack, URLs, and risk notes in the analysis context.
- Keep the response compatible with `AiAssistedProductAnalysisResponse`.
- Treat `draftName` as a suggested owner-visible product name.
- Preserve the current name unless it is blank, generic, misleading, or the owner asks for a better name.

### AI Opportunities And LoomAI Refresh

Owner journey:

1. Product Home shows an attractive AI Opportunities entry.
2. Left product menu includes **AI Opportunities**.
3. Owner opens the product-internal AI Opportunities home.
4. Home shows accepted AI opportunities and LoomAI context already saved for the product.
5. Owner opens **Refresh analysis** when new context arrives.
6. Owner can add a note and file attachments.
7. Owner chooses which files AI may use.
8. AI returns new opportunities, services, scanner focus, LoomAI fit, and next steps.
9. Owner can accept all, some, or none.
10. Accepted items update the product's saved AI opportunity context.

UI requirements:

- AI Opportunities home must not be just a scan form.
- Refresh analysis must be a dedicated internal view with a way back.
- LoomAI integration must be a dedicated internal view with a way back.
- Product Home must have a visible and useful AI Opportunities component.
- Product-specific navigation must include AI Opportunities.
- Long pages should be avoided by moving deeper work into internal views.

Backend requirements:

- Existing endpoint `/api/products/{id}/ai-assisted/analyze` supports AI opportunity refresh.
- Accept endpoint saves only owner-approved AI opportunity items.
- Accepted context is available to the UI for the AI Opportunities home.
- Attachment access must remain temporary and owner-controlled.

## Language Cleanup Status

Implemented on 2026-06-10 for owner-facing UI copy, backend fallback copy, AI prompt copy, seed/demo copy, and menu labels.

Completed high-value replacements:

- **Project Start Plan** -> **Planning** in navigation and **Product Plan** as page headline.
- **Project name** -> **Product workspace name** or **Delivery workspace name** only after delivery starts.
- **Plan Library** -> **Service Plans**.
- **Command Center** -> **Product Home** or **Workspace Home**.
- **Productization Workspaces** -> **Product Workspaces** or **Delivery Workspaces**.

Implementation internals intentionally remain in a few places for compatibility: route paths, component names, entity names, query keys, and compatibility normalizers for old saved draft titles.

## Verification Standard

For each UI/language batch:

- Type-check frontend.
- Build frontend.
- Run relevant backend tests if backend changes.
- Verify local route behavior.
- Deploy only after a useful batch is ready.
- Live verify with screenshots for desktop and mobile.
- Check that text does not overflow on mobile.
- Check that Product Home, AI Opportunities, Refresh analysis, LoomAI integration, Planning, and Action Plan are not duplicating each other's purpose.
