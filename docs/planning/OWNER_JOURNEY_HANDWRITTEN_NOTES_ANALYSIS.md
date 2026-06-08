# Owner Journey Handwritten Notes Analysis

Date: 2026-06-08

Source images:

- `/Users/mahmoudashraf/Downloads/IMG_0294.jpeg`
- `/Users/mahmoudashraf/Downloads/IMG_0295.jpeg`
- `/Users/mahmoudashraf/Downloads/IMG_0296.jpeg`
- `/Users/mahmoudashraf/Downloads/IMG_0297.jpeg`

Related planning docs:

- `docs/planning/OWNER_JOURNEY_UI_UX_REDEFINITION.md`
- `docs/planning/OWNER_PRODUCTIZATION_COMPLETION_PASS.md`
- `docs/planning/OWNER_UI_UX_REDEFINITION_REFACTORING_PLAYBOOK.md`

## Executive Decision

The notes make sense and should influence the next UI/UX redefinition pass.

The strongest idea is that ProdUS should become product-context-first. The owner should not feel like they are moving through independent platform pages. They should feel like they selected a product, entered that product's workspace, and every meaningful action now belongs to that product: readiness, findings, services, teams, AI support, delivery plan, and sharing.

Adopt the notes with one important constraint: the public share page must be designed as a permissioned sharing system, not only as a UI page. Findings, evidence, service selections, and team participation must never become visible through a share link unless the owner explicitly chooses that scope and the viewer has the right access level.

## Implementation Status

Status: MVP implementation completed, redeployed, and live verified on 2026-06-08.

Final live commit: `343833b`.

Feature implementation commit: `2671e5c`.

Deployment reliability fix: `343833b` added backend scanner Maven dependency caching so the Coolify scanner image rebuild stays inside the staging host build window.

Coolify deployments:

- Backend application: `jk3n39yatabf8zc9sn5nknj9`
- Backend deployment: `u1m7k8ldj27qbsot3ig6pf15`
- Frontend application: `wfvdve1ezt7vixejye4bhrgl`
- Frontend deployment: `m129q7ixdtf2r8zpasb9zxct`

What shipped:

- Product home now exposes `New product`, `Start from service`, and `Project Start Plan` as clear owner paths.
- Service Catalog now has a discovery landing and focused internal catalog views with a visible back path instead of button-row content swapping.
- Service-first selection carries selected service context into `/products/new`, where the owner can review product fields before creation.
- Product creation supports focused internal views for setup, manual fields, AI review, and final owner review rather than one long dense screen.
- Product workspace now includes a `Share` spoke for controlled disclosure.
- Backend share-link API, persistence, revocation, public token lookup, viewer action fields, and section visibility rules are implemented.
- Public product share pages are live at `/share/product/{token}` and expose only safe summary sections by default.
- Selected service context is available in public shares when the owner explicitly enables `Selected services`.
- Findings, evidence, and team details remain safe summaries only on public links. The internal-only audience returns `404` on the public route.
- Service Catalog wording now uses `AI Integration Options`; the older `AI Contracts` label is gone.

Live verification screenshots:

- `tmp/live-verification/2026-06-08/209-product-creation-review-live-343833b.png`
- `tmp/live-verification/2026-06-08/210-service-catalog-ai-options-live-343833b.png`
- `tmp/live-verification/2026-06-08/211-share-link-config-live-343833b.png`
- `tmp/live-verification/2026-06-08/212-public-share-safe-summaries-live-343833b.png`
- `tmp/live-verification/2026-06-08/213-public-share-safe-summaries-mobile-live-343833b.png`
- `tmp/live-verification/2026-06-08/214-product-create-mobile-internal-view-live-343833b.png`

Live verification artifact:

- `tmp/live-verification/2026-06-08/owner-journey-final-343833b-result.json`

Live scanner sanity for the ProdUS repo/readme fixture `0a56637c-41b3-4b8b-9ecd-88eca3d7a237`:

- Latest scanner tools: `10/10`
- Completed scanner tools: `10/10`
- `zap-baseline`: `COMPLETED`
- Mapped findings preserved: `73` open findings, including `10` mapped ZAP findings

Live share-link sanity:

- Public share token verified: `EyQD0dOU1sgtiDQwbtZEr-8zgX70o_ZG`
- Public sections verified: `PRODUCT_SUMMARY`, `LAUNCH_STATUS`, `SELECTED_SERVICES`, `FINDINGS_SUMMARY`, `EVIDENCE_SUMMARY`, `TEAM_STATUS`
- Viewer action verified: `Request owner access`
- Internal-only public route verified: `404`

## Interpreted Notes

Some handwriting is uncertain, so this document captures the product intent rather than treating every word as exact source text.

### Image 1: Dashboard, Home, And Product Workspace

Interpreted note:

- The dashboard or home page should show products, new product creation, templates, and the things an owner should look for.
- When the user clicks a product, they should enter that product workspace.
- Everything for that product should be done inside that workspace.
- The product-specific menu should include supporting functions for that product.
- The user can go back to the master or home page to switch products or create a new product.
- Service catalog or service navigation should respect the globally selected product context.
- The selected product should be visible near the top of the menu or current context area.
- The open question is: when should the user choose services?

Recommendation:

- Adopt this as the main navigation model.
- The home page should become a product portfolio and creation hub.
- A selected product should be visually persistent inside owner-facing product pages.
- Product workspace spokes should be the primary way to move between readiness, action plan, findings, services, teams, proof, and delivery.
- Global pages can still exist, but they should either ask for a product context or clearly operate as discovery pages.

Answer to "when should the user choose services?":

- Before product creation, when browsing templates or the service catalog.
- During product creation, when selecting the kind of productization help needed.
- After diagnosis, when ProdUS recommends services tied to blockers and proof.

These are three different moments. The UI should support all three without making service selection feel like a shopping cart.

### Image 2: Services Catalog As A Product Entry Path

Interpreted note:

- The services catalog page should allow the user to select templates or services.
- After selection, the user can click a new action to convert that selection into a product flow.
- The user should navigate to a new product page with the selected templates or services carried forward.
- The user then inserts product inputs or message/context for that selected scope.

Recommendation:

- Adopt this as a second front door.
- The service catalog should not only be a post-diagnosis page. It can also be a discovery path for owners who already know what kind of help they want.
- The action should create a draft intake, not silently create a finished product.
- Suggested CTA language:
  - `Start with this service`
  - `Use this template`
  - `Create product from selection`
  - `Continue to product setup`

Avoid:

- `Add to cart`
- `Buy service`
- `Convert to product` if it sounds too mechanical or final.

### Image 3: New Product Creation With Template, Services, And AI Help

Interpreted note:

- New product creation should include inputs plus service/template selection.
- The owner can choose a template in the first step.
- The owner can customize services on the same page or flow.
- The owner can create the product directly.
- The owner can ask AI to create or assist with the setup.
- AI can choose suggested services, and the owner can edit them.
- This creates the product workspace/start context.

Recommendation:

- Adopt this as the improved `/products/new` model.
- Product creation should become a guided intake that can start from:
  - Blank product.
  - Product template.
  - Service catalog selection.
  - AI-assisted product description.
  - Existing repository or live URL.
- AI service selection should be reviewable and editable before product creation.
- Product creation should end by opening the product workspace or the Project Start Plan, depending on whether the owner is ready to diagnose or approve work.

Important UX rule:

- AI may recommend services, but the owner approves the selected services. The product should not silently become a delivery plan just because AI inferred a service set.

### Image 4: Public Share Product Page

Interpreted note:

- A public share product page should support share links.
- The owner can create new share links.
- The owner can choose what each link shows, such as services, teams, findings, or other sections.
- Anonymous external users can access product general description and selected public sections.
- Registered or logged-in users may be allowed to see findings if the owner shared them.
- Registered users may be able to see service catalog options and request/join/add services, depending on permissions.

Recommendation:

- Adopt the concept, but phase it after the core owner workspace and product creation flows.
- Treat the share page as a controlled disclosure feature.
- Build section-level visibility and audience rules before exposing findings or evidence.
- The default public link should be low-risk:
  - Product name.
  - Product summary.
  - Launch stage or public status.
  - Selected public services, if owner enabled them.
  - Public contact or collaboration CTA, if owner enabled it.

Findings and evidence should require explicit owner opt-in and should usually require authenticated access.

## Recommended Product Journey Model

ProdUS should support three entry paths that converge into the product workspace.

### Path A: Product First

```text
Dashboard / Home
-> Choose product or create product
-> Product Workspace
-> Overview / Action Plan / Findings / Services / Teams / Proof / Delivery
```

This is the main path for returning owners.

### Path B: Service First

```text
Services Catalog
-> Choose service or template
-> Product Creation with selection prefilled
-> AI review and owner edits
-> Product Workspace or Project Start Plan
```

This is the path for owners who start with a need: launch hardening, AI integration, productization sprint, readiness proof, or team help.

### Path C: Shared Product

```text
Owner Product Workspace
-> Create share link
-> Choose audience and visible sections
-> External viewer opens product share page
-> Anonymous sees public sections
-> Registered viewer sees allowed private sections
```

This is the path for investors, advisors, customers, collaborators, or service providers.

## What Should Change In The Product

### Product Context

The selected product should become a first-class context in owner navigation.

Implementation direction:

- Show the selected product name in the workspace shell and product-context navigation.
- Preserve product context when moving between services, findings, proof, teams, and Project Start Plan.
- When the user enters a global page from a product, show a product-context banner or scoped mode.
- When no product is selected, keep global pages in discovery mode.

### Dashboard / Home

The owner home should answer:

- Which product needs attention now?
- Which product can move forward?
- What is the next owner action?
- Where do I create a new product?
- Where do I start from a template or service?

Implementation direction:

- Keep product list scannable.
- Put the highest-priority next action near each product.
- Add a clear `New Product` path and a `Start From Service` path.
- Avoid turning home into another long dashboard.

### Services Catalog

The catalog should support two modes:

- Discovery mode: browse services/templates before selecting a product.
- Product mode: select or refine services for the active product.

Implementation direction:

- In discovery mode, service selection opens product creation with prefilled service/template state.
- In product mode, service selection updates the product's Project Start Plan or service recommendation flow.
- Service copy should stay outcome-first: launch blocker, readiness gap, AI integration opportunity, or delivery goal before service family labels.

### Product Creation

The new product flow should gather:

- Product name and description.
- Stage, audience, and launch intent.
- Repo/live URL/document evidence where available.
- Optional template.
- Optional selected services.
- Optional AI-generated product understanding.
- Optional AI-recommended services.

Implementation direction:

- Use progressive steps instead of one dense form.
- Let AI suggest and explain selected services.
- Let the owner edit the AI recommendation before creating the product.
- Show what will be created before the final action.

### Product Workspace

The workspace should remain the product operating surface.

Implementation direction:

- Keep hub/spoke navigation.
- Continue avoiding long all-in-one pages.
- Make the current product and next action clear in every spoke.
- Keep services, proof, findings, teams, and delivery tied to the selected product.

### Public Share Page

The share page should be a separate viewer experience from the owner workspace.

Implementation direction:

- Create share links from the product workspace.
- Each link should have:
  - Audience: anonymous, registered, invited, or internal.
  - Visible sections.
  - Optional expiry.
  - Optional revocation.
  - Optional contact/collaboration action.
- Findings should default to hidden.
- Evidence should default to hidden.
- Service/team visibility should be explicit.
- Registered viewer actions should be permission-gated.

## Phased Implementation Plan

### Phase 1: Product Context And Home Path

Goal:

- Make product selection and product context feel intentional.

Scope:

- Product home/portfolio polish.
- Selected product context in owner workspace shell.
- Context-preserving navigation between product spokes.
- Clear return path to all products.

Acceptance criteria:

- The owner always knows which product they are working on.
- The owner can return to the product list without losing orientation.
- Product workspace spokes preserve the active product ID.
- Mobile first viewport shows product name, launch status, and next action.

### Phase 2: Service-First Entry

Goal:

- Let an owner start from a service or template before creating a product.

Scope:

- Services catalog discovery mode.
- Service/template selection draft state.
- Handoff to product creation with selected services/templates prefilled.

Acceptance criteria:

- A user can choose a service/template and continue to product setup.
- Product setup shows the chosen service/template clearly.
- The user can remove or change the selection before product creation.
- No cart language appears in the journey.

### Phase 3: Guided Product Creation

Goal:

- Make `/products/new` support product-first, service-first, template-first, and AI-assisted creation.

Scope:

- Progressive intake.
- AI understanding review.
- AI service recommendation review.
- Final creation summary.

Acceptance criteria:

- The owner can create a product from blank inputs.
- The owner can create a product from a service/template selection.
- AI can recommend services, but the owner can edit before creating.
- The final action opens the product workspace or Project Start Plan with context intact.

### Phase 4: Permissioned Share Page

Goal:

- Let owners share product status safely with external people.

Scope:

- Share-link management.
- Public viewer page.
- Audience and section permissions.
- Authenticated private sections.
- Revocation and expiry.

Acceptance criteria:

- Anonymous links never reveal findings or evidence by default.
- Owners can explicitly choose visible sections per link.
- Findings require explicit share scope and authenticated access unless a future product decision says otherwise.
- Links can be revoked.
- The public page is not visually identical to the owner workspace.

## Technical Design Notes

### Product Context State

Use URL-backed product context where possible. A product-specific route is easier to trust than hidden global state.

Recommended pattern:

```text
/owner/products
/products/:productId/workspace
/products/:productId/workspace/services
/products/:productId/workspace/findings
/products/:productId/project-start-plan
```

Global pages can accept optional product context:

```text
/services
/services?productId=:productId
/products/new?serviceId=:serviceId
/products/new?templateId=:templateId
```

### Service Selection Draft

Service-first creation needs a draft model.

Draft data should include:

- Selected template IDs.
- Selected service IDs.
- Source route.
- Owner-entered message or context.
- AI recommendation metadata when available.

The draft should be editable before product creation.

### Share Link Model

A share link should store:

- Product ID.
- Token or slug.
- Audience.
- Visible sections.
- Created by.
- Created at.
- Expires at.
- Revoked at.
- Optional invited users.
- Optional viewer action permissions.

Possible visible sections:

- Product summary.
- Launch verdict.
- Services selected.
- Team or delivery status.
- Findings summary.
- Evidence summary.
- Detailed findings.
- Detailed evidence.

Default:

- Product summary only.

### Permission Rules

Recommended defaults:

- Anonymous viewers can see only explicitly public summary sections.
- Registered viewers can see expanded private sections only when allowed by the link.
- Detailed findings require explicit opt-in.
- Detailed evidence requires explicit opt-in.
- Service-provider actions require role or invitation checks.
- Every share link should be revocable.

## UX Rules For Implementation

- One owner decision per screen.
- Selected product context must stay visible.
- Service selection should feel like choosing a productization path, not shopping.
- AI recommendations must be explainable and editable.
- Product creation should show a final review before create.
- Public share pages should use calmer, narrower information than the owner workspace.
- Findings and evidence should never be casually public.
- Meaningful choices should navigate into focused internal views with a visible back path, not merely switch content below a button row.
- Mobile must be designed first, especially home, product creation, service selection, and share pages.
- Proof should stay near claims, not only in a separate evidence area.

## Risks And Considerations

- Making every global page product-scoped could confuse users who are browsing generally. Keep a clear distinction between discovery mode and product mode.
- Public sharing can create privacy risk if permissions are vague. Implement explicit defaults and revocation before sharing sensitive sections.
- AI choosing services can feel magical in a bad way if not explained. Always show why the service was suggested.
- Service-first creation can become another long page if product inputs, templates, services, AI, and permissions appear together. Use progressive steps.
- The workspace should remain focused. Do not move every feature into one product workspace page; keep hub/spoke navigation.

## Recommendation Summary

Implement the notes, but in this order:

1. Strengthen product-context navigation and product home.
2. Add service-first entry into product creation.
3. Redefine product creation around inputs, templates, services, and editable AI suggestions.
4. Design and implement public sharing only after permission rules are explicit.

This direction fits the current ProdUS redefinition. It makes the journey more natural for startup and MVP owners because they can begin from either a product or a service need, then land in a focused product workspace rather than a long platform dashboard.
