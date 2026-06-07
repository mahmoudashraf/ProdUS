# ProdUS Owner Journey UI/UX Redefinition

Date: 2026-06-07

Source proposal reviewed:

- `/Users/mahmoudashraf/Downloads/PRODUS_OWNER_JOURNEY_UX.md`
- `/Users/mahmoudashraf/Downloads/produs_owner_front_door_intake.html`
- `/Users/mahmoudashraf/Downloads/produs_verdict_reveal.html`
- `/Users/mahmoudashraf/Downloads/produs_ai_opportunity_discovery.html`
- `/Users/mahmoudashraf/Downloads/produs_launch_ready_celebration.html`

Related ProdUS docs:

- `README.md`
- `docs/planning/OWNER_PRODUCTIZATION_WORKSPACE_MVP_REDESIGN.md`
- `docs/planning/AI-Integration-Services/AI_INTEGRATION_SERVICE_DESIGN.md`
- `docs/planning/AI-Integration-Services/AI_OPPORTUNITIES_IMPLEMENTATION_PLAN.md`

## Executive Decision

Claude's proposal suits the ProdUS goal and should become the new owner-journey spine.

The strongest product insight is that the redesigned workspace should not be the first emotional moment after diagnosis. The owner needs a focused verdict reveal first, then the workspace becomes the operating surface for fixing blockers, choosing services, reviewing proof, and creating the delivery workspace.

Adopt the proposal with these adjustments:

- Use the emotional journey and screen sequence.
- Keep the one-decision-per-screen principle.
- Keep LoomAI as preferred but optional.
- Keep proof next to every claim.
- Tighten launch-ready language so ProdUS does not over-certify beyond the evidence and human-review boundary.
- Map each new screen onto the existing `/products/new`, product workspace, services, AI opportunity, and launch-readiness report flows.
- Split large existing frontend files while implementing the journey.

## Product Positioning

ProdUS should feel less like:

```text
A scanner-backed platform dashboard.
```

And more like:

```text
A senior productization partner that gives a founder the launch verdict, proof, and next path.
```

The owner-facing promise is:

```text
Tell ProdUS what you built. ProdUS checks the product, explains what blocks launch, shows the proof, and turns the next step into productization work.
```

## Owner Journey Spine

The proposal's seven-beat journey is the right product spine:

1. Arrival: the owner should feel received, not audited.
2. Handover: the owner chooses exactly what to share.
3. The wait: real checks are visibly happening.
4. Verdict: the scary question is answered kindly.
5. Orientation: blockers become an ordered plan.
6. Help and progress: services, teams, LoomAI, and workspace work create momentum.
7. Proof and arrival: the owner gets a shareable readiness artifact when evidence supports it.

This maps well to ProdUS because the backend already has the important primitives: products, private documents, LoomAI analysis, scanner results, normalized findings, mapped readiness, services, carts, workspaces, and launch-readiness reports.

## Suitability Review

### Strong Fits

- The proposal matches the README direction: prototype to evidence-backed launch decision.
- It fixes the biggest UX gap: a dense workspace should not be the first verdict moment.
- It respects non-technical and technical owners by using plain language first and technical depth on demand.
- It supports the ProdUS/LoomAI relationship: ProdUS remains system of record, LoomAI is the AI assistant and preferred integration partner.
- It provides missing journey moments: safe intake, analyzing state, AI understanding review, verdict reveal, AI opportunity discovery, launch-ready celebration, and readiness report.
- It reinforces monetization naturally by tying blockers to services and teams.

### Required Adjustments

| Proposal element | Keep | Adjust for ProdUS |
| --- | --- | --- |
| `Not ready to launch - yet` verdict | Yes | Good owner tone. Use when blockers exist and evidence is complete enough. |
| `Readiness 58% - starting line` | Yes | Score must come from ProdUS canonical readiness, not mock values. If blockers force `0%`, lead with `Blocked by 2 launch issues` and explain the score. |
| `You're ready to launch` celebration | Yes | Add evidence scope: `Ready for the selected launch decision` or `Ready for pilot launch` when appropriate. Avoid implying legal/compliance certification. |
| Front door intake | Yes | Build inside `/products/new`, replacing the current dense AI creation first view with progressive intake. |
| AI opportunity discovery | Yes | Must remain product-specific, evidence-grounded, and optional. Do not blur opportunity discovery with a forced LoomAI upsell. |
| Apple-clean language | Directionally yes | Translate into the existing MUI/ProdUS design system: restrained, flat, semantic color, few chips, no generic landing-page gloss. |
| One decision per screen | Yes | Apply especially to front door, verdict reveal, launch-ready state, and mobile. Workspace can remain multi-section because it is the operating surface. |

## Revised Product UI/UX Model

### 1. Owner Front Door

Route: `/products/new`

Purpose:

- Let the owner start in plain language.
- Reduce exposure anxiety.
- Let the owner control what is shared with AI.

Design:

- Centered intake surface, not a dashboard.
- Natural-language product description first.
- Optional repository URL.
- Optional live or staging URL.
- Private document upload with per-file `Share with AI` controls.
- Optional LoomAI analysis toggle.
- Privacy reassurance using exact product behavior: private by default, selected short-lived access, revoked after analysis.
- Primary CTA: `Analyze my product`.
- Secondary CTA: `Set up manually`.

Current gap:

- `ProductOnboardingWizard.tsx` already supports AI analysis, documents, temporary AI access, document usage proof, service recommendations, and creation intent.
- It is too dense for the first screen and exposes validation rails too early.

Implementation direction:

- Split the current wizard into a progressive owner journey.
- Keep the existing backend contracts.
- Move validation details below the first step or into the AI understanding review.

### 2. Analyzing State

Trigger:

- After the owner chooses AI analysis or starts scanner/readiness checks.

Purpose:

- Replace blank waiting with visible, trustworthy work.

Design:

- Show a short checklist of checks in progress.
- Use owner-readable labels:
  - Product context
  - Private document access
  - Repository check
  - Runtime check
  - Dependencies
  - Security baseline
  - Service fit
  - AI opportunity review
- Show calm per-check failures, not a red wall.

Implementation direction:

- Frontend can initially show deterministic client-side phases while waiting for existing API responses.
- Later, bind to scanner job/status events.

### 3. AI Understanding Review

Trigger:

- After LoomAI analysis returns, before product creation.

Purpose:

- Let the owner confirm "ProdUS understood me" before a governed create action.

Design:

- Product name, summary, stage, tech stack, target users, risks, assumptions, missing evidence.
- Editable fields.
- `Documents used` section with explicit `Used`, `Not used`, or `Opened by AI` states.
- Primary CTA: `Looks right - continue`.
- Secondary: `Edit details`.

Current gap:

- The data exists in `ProductOnboardingWizard.tsx`, but it appears inside a dense multi-panel admin-like review.

Implementation direction:

- Extract AI review sections into a dedicated `ProductAnalysisReview` component.
- Keep evidence gaps visible, but avoid making the owner read action guard internals unless needed.

### 4. Verdict Reveal

Trigger:

- After diagnosis/scanner readiness has enough evidence to produce a launch status.
- First time a newly scanned product gets a readiness verdict.
- Also available as `View verdict` from the workspace.

Purpose:

- Answer "Can I launch?" before opening the dense workspace.

Design:

```text
Your readiness check is complete

Not ready to launch - yet
2 things must be fixed before sharing this with customers. Everything else can wait.

Readiness: 0% or 58%
This is your starting line, not a grade.

What is blocking launch
1. Plain-language blocker title
   Impact in one sentence
   Evidence line
2. Plain-language blocker title
   Impact in one sentence
   Evidence line

None of this is unusual for a prototype. Here is the path to fixing it.

[See your plan]
10 of 10 checks complete - repo and live app
```

Important adjustment:

- The verdict text leads.
- The score supports.
- Check completion and launch readiness are separated.
- If the canonical score is `0%` because blockers exist, explain why instead of letting `0% ready` become the emotional headline.

Implementation direction:

- Add an `OwnerReadinessVerdictReveal` component.
- Feed it from the same owner workspace model that derives launch status, blocker count, top risks, proof line, and scanner coverage.
- Show as a route-level step or first-run modal before `/products/[id]` workspace.

### 5. Productization Workspace

Route: `/products/[id]`

Purpose:

- Operating surface after the verdict.
- Help the owner fix blockers, choose services, review proof, and start the delivery workspace.

Keep:

- Four top-level tabs: Overview, Action Plan, Findings, Services.
- Evidence proof inside Findings.
- Timeline as dialog/drawer.
- Owner-facing risk grouping.
- Service recommendation tied to top action.

Refine:

- The Overview still has too many competing surfaces.
- Collapse the right rail into an owner control panel.
- Move service-plan edit/remove controls into drawers.
- Keep AI Owner Brief below deterministic readiness.
- Make the launch decision band visually dominant.
- Make mobile first: verdict, first blocker, primary CTA, proof summary, then details.

### 6. AI Opportunity Discovery

Trigger:

- After product intake analysis.
- After readiness diagnosis when product context is richer.
- From workspace when the owner asks where AI could improve the product.

Purpose:

- Show credible product-specific AI upside without forcing LoomAI.

Design:

- Header: `Where AI could make this product better`.
- 2 to 3 opportunities maximum by default.
- Each opportunity includes:
  - Plain title
  - User/business value
  - Where it attaches
  - Effort
  - Confidence
  - Evidence line
- Delivery area:
  - `LoomAI is our preferred integration partner`
  - `You can choose another verified provider`
  - CTAs: `Explore with LoomAI`, `See other providers`

Required adjustment:

- Avoid generic ideas such as "add a chatbot" unless product evidence supports it.
- Keep provider recommendation separate from opportunity diagnosis.

Implementation direction:

- Align with `AI_OPPORTUNITIES_IMPLEMENTATION_PLAN.md`.
- Extract current opportunity report UI into a focused `AiOpportunityDiscoveryPanel`.

### 7. Progress And Momentum

Trigger:

- Returning after fixes, reruns, service completion, milestone evidence, or report regeneration.

Purpose:

- Make progress visible so the owner feels movement.

Design:

- Delta since last scan:
  - readiness moved from X to Y
  - blockers cleared
  - improvements resolved
  - proof gaps closed
- Avoid showing static scores without history.
- Treat low initial score as starting line, not failure.

Implementation direction:

- Reuse ship confidence history, but make it supporting context.
- Do not show a second circular owner score.
- Show progress as text/metric deltas beneath the canonical verdict.

### 8. Launch-Ready Celebration

Trigger:

- No blockers remain and the selected launch decision has enough evidence.
- Report generation is available.

Purpose:

- Give the journey an earned arrival.

Design:

```text
Ready for pilot launch

Every launch blocker is cleared and the required evidence is in place.
You moved from 33% to 100% readiness.
2 blockers cleared. 28 improvements resolved.
Backed by 10 of 10 checks across security, dependencies, and runtime.

[Generate readiness report]
[Share with your team]
```

Required adjustment:

- Use launch-scope language:
  - `Ready for pilot launch`
  - `Ready for customer demo`
  - `Ready for beta review`
  - `Ready for the selected launch decision`
- Avoid absolute certification language unless a human-reviewed compliance flow exists.

Implementation direction:

- Add `OwnerLaunchReadyCelebration` component.
- Connect to launch-readiness report generation.
- Keep celebration calm, evidence-backed, and non-cheesy.

### 9. Readiness Report

Purpose:

- Give the owner proof they can share with investors, customers, teammates, or delivery teams.

Design:

- Deterministic snapshot.
- Verdict.
- Date.
- Product, repo, runtime, documents inspected.
- Scanner coverage.
- Blockers cleared.
- Remaining improvements.
- Human-review caveats.
- Export/share actions.

Implementation direction:

- Build out the current launch-readiness report shell.
- Regenerate only when owner asks, so the artifact is stable.

## Target Information Architecture

```text
Dashboard / Productization Launchpad
  -> Start productization
      -> Front door intake
      -> Analyzing state
      -> AI understanding review
      -> Create product
      -> Run readiness checks
      -> Verdict reveal
      -> Productization workspace
          -> Overview
          -> Action Plan
          -> Findings
          -> Services
          -> Timeline dialog
          -> AI opportunity discovery
          -> Launch readiness report
      -> Delivery workspace
      -> Launch-ready celebration
```

## Component Decomposition

The journey should be implemented while reducing large files.

Current large areas:

- `frontend/src/features/platform/ProductOnboardingWizard.tsx`
- `frontend/src/features/platform/OwnerProductizationWorkspace.tsx`

Recommended components:

- `ownerJourneyModel.ts`
- `ProductIntakeFrontDoor.tsx`
- `ProductAnalysisProgress.tsx`
- `ProductAnalysisReview.tsx`
- `ProductDocumentSharingPanel.tsx`
- `AiOpportunityDiscoveryPanel.tsx`
- `OwnerReadinessVerdictReveal.tsx`
- `OwnerLaunchDecisionBand.tsx`
- `OwnerLaunchReadyCelebration.tsx`
- `ReadinessReportPanel.tsx`
- `OwnerControlPanel.tsx`

Recommended model helpers:

- `deriveOwnerVerdict`
- `deriveCanonicalReadinessScore`
- `deriveBlockersAndImprovements`
- `deriveEvidenceCoverage`
- `deriveTopOwnerRisks`
- `deriveOwnerActionPlan`
- `deriveAiOpportunityCards`
- `deriveLaunchReadyState`

## UX Copy Rules

- Verdict first, scanner names later.
- Use `blockers`, `improvements`, and `proof` before `critical`, `high`, `normalized`, or scanner names.
- Never headline `Unknown` for a scanned product.
- Never show more than one owner-level readiness score.
- Check completion means coverage; readiness means launch state.
- Problems should create agency, not shame.
- AI is optional help, not authority.
- LoomAI is preferred and labeled, never forced.
- Readiness celebration must be earned and proof-backed.
- Do not claim legal, compliance, security, or production certification without the appropriate human review and explicit evidence.

## Implementation Priorities

1. Build the verdict reveal.
2. Refine the workspace overview around a single launch decision band.
3. Redesign `/products/new` into the front door intake and AI understanding review.
4. Add analyzing/progress states.
5. Extract AI opportunity discovery into a focused owner-facing panel.
6. Build launch-ready celebration and readiness report.
7. Fold service/team matching into the blocker-resolution path.

## Acceptance Criteria

The redefined owner UX is successful when:

1. A startup owner can state the launch verdict and top next action in under 10 seconds.
2. The first post-scan moment is a focused verdict, not the full workspace.
3. The owner controls exactly what documents are shared with AI.
4. Document use evidence is visible before AI-assisted project creation.
5. The workspace has one canonical owner readiness score.
6. The mobile journey shows verdict, first blocker, and primary action before secondary panels.
7. Services are explained by owner outcome, not internal module name.
8. AI opportunities are specific to the product and evidence-grounded.
9. LoomAI is presented as preferred but optional.
10. Launch-ready celebration includes proof and scope, not unsupported certification.

## Product Verdict

Adopt this proposal as the next ProdUS product UI/UX direction.

It is better than continuing to polish the current workspace alone because it defines the missing emotional path around the workspace: safe start, visible checking, kind verdict, focused plan, supported progress, AI upside, and proof-backed arrival.
