# Owner Productization Completion Pass

Date: 2026-06-07

Baseline:

- Latest live-verified commit before the onboarding review pass: `d01b397`.
- Latest live-verified Coolify deployment before the onboarding review pass: `1083`.
- Verification fixture: ProdUS repo/readme product `0a56637c-41b3-4b8b-9ecd-88eca3d7a237`.
- Live verification script: `tmp/live-verification/2026-06-07/live-owner-hub-spoke-navigation.js`.
- Current largest owner-facing active files after the completed splits:
  - `frontend/src/features/platform/OwnerProductizationWorkspace.tsx`: 2129 lines.
  - `frontend/src/features/platform/WorkspaceCommandPage.tsx`: 907 lines.
  - `frontend/src/features/platform/ProductizationLaunchpad.tsx`: 332 lines.
  - `frontend/src/features/platform/ProjectStartPlanPage.tsx`: 280 lines.
  - `frontend/src/features/platform/OwnerOverviewDecisionPanel.tsx`: 278 lines.

## Goal

Finish the redefinition pass so ProdUS feels like an MVP/startup-owner productization partner, not a scanner dashboard or admin console.

The completed experience should answer one owner question per view:

- Can I launch, beta, demo, or should I stop?
- What must be fixed first?
- What proof supports that claim?
- Which ProdUS service moves this forward?
- What work is already in delivery?

Scanner names, raw artifacts, AI internals, and operator controls must remain available, but they should not lead the journey.

## Definition Of Done

- The owner workspace uses the hub/spoke navigation without long all-in-one pages.
- Each major view has one dominant decision or action.
- The canonical launch/readiness verdict remains the primary score; sub-scores are clearly subordinate.
- Technical proof reads as:
  - Run proof.
  - Review result.
  - Fix path.
  - Stored artifacts.
- Scanner results remain live, stored, mapped, and visible in latest coverage.
- Services are tied to the top blockers and next owner decision, not shown as unrelated catalog cards.
- Cart/start-project reads as approving a launch-hardening plan, not shopping.
- Mobile screenshots remain usable, with no cramped three-column decision grids.
- Large components are split when a journey slice is touched.
- `npm run type-check`, `npm run build`, `git diff --check`, Coolify deploy, and live screenshot verification pass for each shipped slice.

## Shipped Progress

- Product workspace now opens on a hub instead of a long detail page, with URL-backed spokes for Overview, Findings, Services, and workspace delivery.
- Findings are split into owner risks, stored proof, and technical proof. Raw scanner proof is still reachable, but it no longer leads the owner journey.
- Product onboarding, workspace command, start-plan board, and the owner side rail have been split into smaller route/panel components.
- The old visible cart language has been replaced with `Project Start Plan` / `Start Plan`. The `/owner/project-cart` URL remains only as a compatibility route.
- Services now lead with a proof-linked `Priority Services` list before expandable service-family catalog depth.
- Shopping/cart visual metaphors were removed from the owner platform TSX surfaces and replaced with checklist/action/start-plan icons.
- Latest live verification at commit `d01b397` confirmed the full journey and all 10 scanners completed/mapped, including `zap-baseline`.

## Completion Sequence

### Completed: Product Workspace Shell Completion

Problem:

- `OwnerProductizationWorkspace.tsx` remains the largest active owner route.
- It mixes route/query state, hub/spoke URL state, owner verdict shaping, scanner proof state, service actions, and right-rail composition.
- This makes the next product workspace UX refinements slower and raises regression risk.

Solution:

- Keep the route as the data and mutation owner for now.
- Extract stable route-shell responsibilities first:
  - URL-backed tab/view state.
  - Hub/detail open state.
  - Typed open helpers for Overview, Actions, Findings, and Services.
- Preserve the existing live journey and screenshot expectations.
- After this pass, continue with visible pane extractions:
  - Overview journey pane.
  - Findings journey pane.
  - Services journey pane.
  - Right-rail decision panel.

Immediate implementation target:

- Add `useOwnerWorkspaceNavigationState`.
- Remove router/search-param orchestration from `OwnerProductizationWorkspace.tsx`.
- Run local checks, deploy, and live-verify the same product workspace screenshots.

Status:

- Complete. The route still owns data and mutations, while stable visual panes, side-rail panels, onboarding panels, workspace command panels, and start-plan navigation are split into focused components.

### Pass 1: Technical Proof Completion

Problem:

- The upper proof runway is owner-friendly, but the lower technical area still becomes a dense operator workspace.
- Source setup, hosted scans, scheduled refreshes, CI upload, external import, templates, stored sources, schedules, imports, evidence, and finding status edits compete in one viewport.

Solution:

- Split scanner proof controls into smaller components.
- Present owner proof as a four-part journey: prepare proof, run proof, attach existing proof, review stored proof.
- Keep advanced forms available, but label them with owner outcomes before tool names.
- Keep all scanners in the running suite and latest result coverage visible.

Immediate implementation target:

- Extract the scanner proof operations from `OwnerProductizationWorkspace.tsx`.
- Add owner-first section labels and progressive operation groups.
- Keep existing API calls and scanner payload contracts unchanged.

### Completed: Cart And Start-Project Completion

Problem:

- The current cart journey can still feel like adding services to a basket.
- For a founder, the product moment is approving the launch-hardening plan that resolves blockers.

Solution:

- Reframe the start-plan page around `Approve plan`, `Review blockers covered`, `Confirm service scope`, and `Start delivery`.
- Tie the top selected service to the highest launch blocker.
- Keep service details in a spoke view instead of one long page.
- Split `ProjectStartPlanPage.tsx` if touched.

Status:

- Mostly complete. `ProjectStartPlanPage.tsx` now opens as a route-backed Start Plan hub with Readiness, Services, Talent, and Approve spokes. Remaining polish is to keep service and talent editing calm on mobile and avoid any shopping/cart visual metaphor.

### Completed: Services Recommendation Completion

Problem:

- Services are improved, but they still need to consistently reinforce the top owner action.
- The services recommendation spoke can still feel like browsing a catalog after the owner sees the recommended work path.

Solution:

- Keep the recommended service beside the top action.
- Show why the service exists using blocker language first and scanner/tool evidence second.
- Show a short `Priority Services` list before catalog depth.
- Put the full service-family catalog behind deliberate expansion.
- Replace shopping/cart visual metaphors with start-plan and checklist metaphors.
- Keep team matching as a separate decision step.

Immediate implementation target:

- Split the services recommendation surface into a small composer plus priority-service and catalog-family components.
- Keep `Recommended Work Path` and `AI Service Selector` live-verifier expectations unchanged.
- Run local checks, deploy, and live-verify the product, services, start-plan, workspace, and mobile screenshots.

Status:

- Complete. `OwnerServicesRecommendationPanel` now composes `OwnerServicePriorityList` and `OwnerServiceCatalogFamiliesPanel`. The owner sees proof-linked services first and only expands the catalog when they need more detail.

### Current Pass: Onboarding Review Completion

Problem:

- The onboarding wizard has been split, but the review step can still carry too much analysis detail.
- The AI analysis action rail still shows all validation detail and chat controls at once.
- The first AI detail section opens by default even though the summary already gives the owner decision context.

Solution:

- Preserve the front-door intake and AI understanding review.
- Push secondary AI detail into expandable sections.
- Keep document-use proof visible, but not louder than the owner decision.

Immediate implementation target:

- Keep the generated owner summary visible.
- Collapse secondary AI detail sections by default.
- Extract the creation validation checklist and AI chat helper into compact progressive panels.
- Verify `/products/new` plus an analyzed onboarding review state with focused screenshots.

### Pass 5: Workspace Command Completion

Problem:

- Workspace delivery command is much better but still has a large page file and several dense proof/team/risk areas.

Solution:

- Continue splitting delivery command panels around decision surfaces.
- Keep delivery answer, proof readiness, metrics, navigation, side rail, and handoff as independent components.
- Verify that delivery pages support the same hub/spoke model as product workspace.

### Pass 6: Copy, Mobile, And Documentation Close

Problem:

- Owner copy must stay plain, especially around scanners, ZAP, evidence, AI, and readiness.
- README and planning docs should reflect the startup-owner journey, not just platform capabilities.

Solution:

- Tighten visible copy from tool-first to outcome-first.
- Verify desktop and mobile screenshots.
- Reconsider README language after the UI completion pass, so the docs match the live product.

## Implementation Loop

For each slice:

1. Pick the next owner journey gap.
2. Split the touched large component if the boundary is stable.
3. Implement the owner-facing UX change.
4. Run local checks:
   - `git diff --check`
   - `npm run type-check`
   - `npm run build`
5. Commit the focused change.
6. Push to `main`.
7. Trigger Coolify staging deploy with the private handoff credentials.
8. Live-verify against the ProdUS repo/readme product.
9. Save and review screenshots before moving to the next slice.

## Stop Conditions

This pass is complete when the remaining rough surfaces no longer expose the founder to long, tool-first pages:

- Technical proof is a guided workflow.
- Cart/start-project is an approval journey.
- Services reinforce the top blocker.
- Onboarding review is progressive and calm.
- Workspace command follows the same navigation density rules.
- Live desktop and mobile screenshots verify the full journey.
