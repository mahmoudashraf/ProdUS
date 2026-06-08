# Owner Productization Completion Pass

Date: 2026-06-08

Baseline:

- Latest live-verified UI commit after the expert-network route split pass: `1da019a`.
- Latest live-verified Coolify frontend deployment after the expert-network route split pass: `car77thjruwalzfmfush3jif`.
- Verification fixture: ProdUS repo/readme product `0a56637c-41b3-4b8b-9ecd-88eca3d7a237`.
- Live verification script: `tmp/live-verification/2026-06-08/live-network-export-hub.js`.
- Current largest owner-facing active files after the completed splits:
  - `frontend/src/features/platform/OwnerProductizationWorkspace.tsx`: 632 lines.
  - `frontend/src/features/platform/WorkspaceCommandPage.tsx`: 362 lines.
  - `frontend/src/features/platform/ProductizationLaunchpad.tsx`: 332 lines.
  - `frontend/src/features/platform/OwnerWorkspaceTechnicalProofArea.tsx`: 296 lines.
  - `frontend/src/features/platform/ProjectStartPlanPage.tsx`: 280 lines.
  - `frontend/src/features/platform/OwnerOverviewDecisionPanel.tsx`: 278 lines.
  - `frontend/src/features/expert-network/NetworkPages.tsx`: 16 lines after extracting all network route pages into focused modules.

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
- Onboarding review now keeps the owner summary visible, moves validation and AI help behind progressive panels, and leaves the first detailed AI section collapsed by default.
- Workspace Command now has Team/Risk and Handoff substeps, with route orchestration split into focused hooks and panels.
- Technical Proof now opens as a four-step proof journey instead of one long scanner workspace.
- Start Plan mobile now opens with choose-service/team/expert actions and a compact service/team/status summary.
- Repo/README evidence now auto-refreshes into the owner workspace when the product has scanner context but no repo readout yet, so the stored proof surface does not headline missing documentation after an authorized source exists.
- Evidence summary language now shows `README or documentation evidence found` when documentation proof is present, instead of falling back to `No README evidence shown`.
- Coolify frontend Docker deploys now skip Next's duplicate build-time type validation while keeping `npm run type-check` as the explicit pre-deploy safety gate, avoiding the previous staging build timeout.
- Latest live verification at commit `b61fe6b` confirmed the full journey, README evidence display, mobile hub/spoke flow, and all 10 scanners completed, including `OWASP ZAP Baseline`; all nonzero scanner findings remain normalized and mapped in latest coverage.
- Expert Network dashboard and directory are now split out of the former 1,530-line `NetworkPages.tsx` route file and live-verified at commit `4ec6b4e`.
- Expert Network route pages are now split into focused modules with `NetworkPages.tsx` acting as a small export hub, with empty and cover fallback polish live-verified at commit `1da019a`.

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

### Completed: Technical Proof Completion

Problem:

- The upper proof runway is owner-friendly, but the lower technical area still becomes a dense operator workspace.
- Source setup, hosted scans, scheduled refreshes, CI upload, external import, templates, stored sources, schedules, imports, evidence, and finding status edits compete in one viewport.

Solution:

- Split scanner proof controls into smaller components.
- Present owner proof as a four-part journey: prepare proof, run proof, attach existing proof, review stored proof.
- Keep advanced forms available, but label them with owner outcomes before tool names.
- Keep all scanners in the running suite and latest result coverage visible.

Immediate implementation target:

- Split the technical proof page into the four owner proof substeps.
- Keep Run Proof, Review Result, Fix Path, and Stored Proof as separate views.
- Keep scanner run controls, latest coverage, mapped services, finding decisions, and stored artifacts available without one long all-in-one page.
- Keep existing API calls and scanner payload contracts unchanged.

Status:

- Complete and live-verified at UI commit `6ebf69a`, Coolify frontend trigger `coolify-force-2026-06-07T19-55Z`.
- `OwnerWorkspaceFindingsPane` now delegates the technical view to `OwnerTechnicalProofJourneyPanel`.
- Technical Proof opens on `Run Proof`, with `Review Result`, `Fix Path`, and `Stored Proof` as focused substeps.
- `OwnerScannerProofCompanionPanel` can render result, stored proof, or finding-decision sections independently while preserving its old full-panel behavior when no view is passed.
- Focused local verification passed with screenshots:
  - `tmp/live-verification/2026-06-07/75-technical-proof-run-local.png`
  - `tmp/live-verification/2026-06-07/76-technical-proof-result-local.png`
  - `tmp/live-verification/2026-06-07/77-technical-proof-fix-local.png`
  - `tmp/live-verification/2026-06-07/78-technical-proof-stored-local.png`
- Live verification refreshed the technical proof screenshots:
  - `tmp/live-verification/2026-06-07/36-technical-proof-live.png`
  - `tmp/live-verification/2026-06-07/36a-technical-proof-result-live.png`
  - `tmp/live-verification/2026-06-07/36b-technical-proof-fix-live.png`
  - `tmp/live-verification/2026-06-07/36c-technical-proof-stored-live.png`

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

### Completed: Onboarding Review Completion

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

Status:

- Complete. `/products/new` now shows the AI understanding review as a calm owner decision surface, with `Creation checks`, optional analysis help, and detailed product understanding behind deliberate expansion.

### Completed: Workspace Command Completion

Problem:

- Workspace delivery command is much better but still has a large page file and several dense proof/team/risk areas.
- The top journey has four clear spokes, but Team/Risk and Handoff still expose multiple work modes in one vertical stack.
- The Handoff spoke previously led with the AI helper before the owner handoff and health decision.

Solution:

- Continue splitting delivery command panels around decision surfaces.
- Keep delivery answer, proof readiness, metrics, navigation, side rail, and handoff as independent components.
- Verify that delivery pages support the same hub/spoke model as product workspace.

Immediate implementation target:

- Split Team/Risk into Participants, Support, and Risks substeps.
- Split Handoff into Owner Handoff, Signals, and optional Ask AI substeps.
- Keep the owner handoff review as the first Handoff surface, with AI available after the owner has the review context.
- Run local checks and batch this with the next Workspace Command refinement before triggering another Coolify deployment.

Status:

- Complete and live-verified at commit `449b646`, Coolify deployment `1085`. Team/Risk and Handoff now have focused substep navigation and smaller panel components, and selecting either top-level step scrolls the owner to the chosen substep area.
- Route orchestration was reduced by extracting workspace/milestone selection, derived readiness summaries, and evidence attachment controls. `WorkspaceCommandPage.tsx` is now 805 lines.
- Focused local verification against staging data passed with screenshots:
  - `tmp/live-verification/2026-06-07/68-workspaces-team-substeps-local.png`
  - `tmp/live-verification/2026-06-07/69-workspaces-team-participants-local.png`
  - `tmp/live-verification/2026-06-07/70-workspaces-team-support-local.png`
  - `tmp/live-verification/2026-06-07/71-workspaces-team-risks-local.png`
  - `tmp/live-verification/2026-06-07/72-workspaces-handoff-review-local.png`
  - `tmp/live-verification/2026-06-07/73-workspaces-handoff-signals-local.png`
  - `tmp/live-verification/2026-06-07/74-workspaces-handoff-ai-local.png`
- Live verification refreshed the workspace screenshots:
  - `tmp/live-verification/2026-06-07/44-workspaces-team-risks-live.png`
  - `tmp/live-verification/2026-06-07/45-workspaces-handoff-live.png`

### Current Pass: Copy, Mobile, And Documentation Close

Problem:

- Owner copy must stay plain, especially around scanners, ZAP, evidence, AI, and readiness.
- README and planning docs should reflect the startup-owner journey, not just platform capabilities.

Solution:

- Tighten visible copy from tool-first to outcome-first.
- Verify desktop and mobile screenshots.
- Reconsider README language after the UI completion pass, so the docs match the live product.

Immediate implementation target:

- Polish the mobile Project Start Plan so it reads as approving scope, not filling a cart.
- Replace remaining owner-facing `add services` / project-cart language with `choose services` / Project Start Plan language where the compatibility API names do not need to change.
- Keep the Start Plan mobile first viewport compact enough to show actions, readiness, selected product, and service/team/status summary.

Status:

- Complete and live-verified at UI commit `8b90310`, Coolify frontend trigger `coolify-force-2026-06-07T20-31Z`.
- Top Start Plan actions now read `Choose services`, `Choose teams`, and `Find experts`.
- Mobile Start Plan hides the secondary product summary card, keeps a smaller readiness ring, and shows a compact service/team/status strip before the journey cards.
- README business language now describes Project Start Plans instead of project carts.
- Follow-up wording sweep changed remaining primary owner CTAs from add/cart language to choose/attach/approve language across overview, finding review, scanner proof, team match, public profiles, and service plan empty states.
- Focused local mobile verification passed with screenshots:
  - `tmp/live-verification/2026-06-07/79-mobile-start-plan-close-local.png`
  - `tmp/live-verification/2026-06-07/80-mobile-start-plan-services-close-local.png`
- Live verification refreshed the mobile Start Plan screenshot:
  - `tmp/live-verification/2026-06-07/40a-mobile-start-plan-live.png`

### Current Pass: Service Plan Builder Completion

Problem:

- `/packages` still read like a combined builder/admin page.
- It exposed plan selection, AI advice, service modules, milestone sequence, team matches, proposal creation, contracts, invoices, warnings, and create-plan controls in one long two-column surface.
- The route file was smaller than the main product workspace, but the visible journey still violated the owner rule of one decision per view.

Solution:

- Reframe Service Plans as a hub/spoke owner journey:
  - Summary: plan verdict, owner decision, warnings, and create-from-brief path.
  - Services: selected lifecycle services and milestone path.
  - Team Match: delivery-team fit and proof reasons.
  - Handoff: proposal, contract, invoice, and workspace transition.
- Keep the same API contracts and write behavior.
- Split the visual work into granular files instead of moving density into one new component.

Status:

- Locally implemented and verified against staging data using a Playwright API proxy because staging CORS blocks localhost browser calls.
- `PackagesPage.tsx` is now route/query/form/mutation orchestration, with visual panels split into focused service-plan components.
- Local screenshots:
  - `tmp/live-verification/2026-06-07/81-service-plans-summary-local.png`
  - `tmp/live-verification/2026-06-07/82-service-plans-services-local.png`
  - `tmp/live-verification/2026-06-07/83-service-plans-team-local.png`
  - `tmp/live-verification/2026-06-07/84-service-plans-commercial-local.png`
  - `tmp/live-verification/2026-06-07/85-mobile-service-plans-summary-local.png`
  - `tmp/live-verification/2026-06-07/local-service-plan-builder-redefinition.js`

Next:

- Batch this service-plan slice with the next owner-facing route if another small route is ready before deploying.
- Otherwise deploy and live-verify `/packages` plus the full owner journey.

### Current Pass: Service Catalog Completion

Problem:

- `/services` still behaved like a long catalog page.
- Package templates, service categories, AI contract metadata, and visual layout notes were stacked together.
- Service selection copy still leaned on `Add...` language, which made the owner journey feel like filling a basket instead of choosing a launch-hardening path.

Solution:

- Reframe Service Catalog as a focused discovery hub:
  - Launch Templates: bundled paths for quick owner starts.
  - Service Workstreams: individual services grouped by owner need.
  - AI Contracts: what the assistant can safely explain or recommend.
- Replace remaining visible service-selection copy with `Choose` / `Use` / `in plan` language.
- Remove visible layout-description text from the app.
- Split catalog visuals into granular template, workstream, and focus/AI panels.

Status:

- Implemented, committed, deployed, and live-verified at UI commit `4ff3ea9`, Coolify frontend deployment `vifgp76w7orpw9p9t5edvzag`.
- Local verification against staging data passed with Playwright API proxy screenshots:
  - `tmp/live-verification/2026-06-07/86-service-catalog-templates-local.png`
  - `tmp/live-verification/2026-06-07/87-service-catalog-workstreams-local.png`
  - `tmp/live-verification/2026-06-07/88-service-catalog-ai-contracts-local.png`
  - `tmp/live-verification/2026-06-07/89-mobile-service-catalog-templates-local.png`
  - `tmp/live-verification/2026-06-07/local-service-catalog-redefinition.js`
- Live verification refreshed:
  - `tmp/live-verification/2026-06-07/86-service-catalog-templates-live.png`
  - `tmp/live-verification/2026-06-07/87-service-catalog-workstreams-live.png`
  - `tmp/live-verification/2026-06-07/88-service-catalog-ai-contracts-live.png`
  - `tmp/live-verification/2026-06-07/89-mobile-service-catalog-templates-live.png`
- Full owner journey verification passed for commit `4ff3ea9`; scanner coverage remained stored and mapped with all 10 scanners complete.

### Current Pass: Team And Talent Completion

Problem:

- `/teams` still mixed owner team matching, team profile proof, shortlist controls, admin capability forms, roster editing, reputation capture, and matching explanation in one long surface.
- Public talent discovery still stacked teams, solo experts, lifecycle services, and conversion copy into one long browse page.
- `TeamsPage.tsx` and `PublicTalentDirectoryPage.tsx` were both large enough that the next UX pass would keep piling density into route files.

Solution:

- Reframe authenticated `/teams` as a focused Team Match route:
  - Choose Match: select the start plan and choose the top delivery team.
  - Inspect Team: review proof, capability evidence, members, and reputation.
  - Shortlist: keep the owner handoff list separate from proof detail.
- Reframe public talent discovery as a front-door choice:
  - Verified teams.
  - Solo experts.
  - Service workstreams.
- Split team/talent visuals into smaller files instead of replacing one large component with another.

Status:

- Implemented, committed, deployed, and live-verified at UI commit `338bd67`, Coolify frontend deployment `u313b8wrq3cdh4nzpjleng30`.
- `TeamsPage.tsx` is now 483 lines, with owner team match views split into:
  - `OwnerTeamMatchDecisionPanels.tsx`
  - `OwnerTeamRecommendationsPanel.tsx`
  - `OwnerTeamProfileInspectorPanel.tsx`
  - `OwnerTeamShortlistPanel.tsx`
  - `ownerTeamMatchConfig.ts`
- `PublicTalentDirectoryPage.tsx` is now 192 lines, with public cards and panels split into:
  - `PublicTalentCards.tsx`
  - `PublicTalentPanels.tsx`
- Focused local verification passed with screenshots:
  - `tmp/live-verification/2026-06-07/90-team-match-choose-local.png`
  - `tmp/live-verification/2026-06-07/91-team-match-inspect-local.png`
  - `tmp/live-verification/2026-06-07/92-team-match-shortlist-local.png`
  - `tmp/live-verification/2026-06-07/93-mobile-team-match-local.png`
  - `tmp/live-verification/2026-06-07/94-public-talent-teams-local.png`
  - `tmp/live-verification/2026-06-07/95-public-talent-experts-local.png`
  - `tmp/live-verification/2026-06-07/96-public-talent-services-local.png`
  - `tmp/live-verification/2026-06-07/97-mobile-public-talent-teams-local.png`
  - `tmp/live-verification/2026-06-07/98-solo-experts-default-local.png`
- Live verification refreshed:
  - `tmp/live-verification/2026-06-07/90-team-match-choose-live.png`
  - `tmp/live-verification/2026-06-07/91-team-match-inspect-live.png`
  - `tmp/live-verification/2026-06-07/92-team-match-shortlist-live.png`
  - `tmp/live-verification/2026-06-07/93-mobile-team-match-live.png`
  - `tmp/live-verification/2026-06-07/94-public-talent-teams-live.png`
  - `tmp/live-verification/2026-06-07/95-public-talent-experts-live.png`
  - `tmp/live-verification/2026-06-07/96-public-talent-services-live.png`
  - `tmp/live-verification/2026-06-07/97-mobile-public-talent-teams-live.png`
  - `tmp/live-verification/2026-06-07/98-solo-experts-default-live.png`
- Full owner journey verification passed for commit `338bd67`.

### Completed: Active Workspaces Legacy Cleanup

Problem:

- `frontend/src/features/platform/WorkspacesPage.tsx` remained a 1075-line legacy all-in-one delivery surface.
- The live `/workspaces` route no longer used it; the route imports `WorkspaceCommandPage`, which was already redefined earlier in this completion pass.
- Keeping the unused file in the platform folder made the remaining large-file inventory look worse than the actual live journey and increased maintenance risk.

Solution:

- Verified there were no imports of `WorkspacesPage`.
- Removed the unused legacy file instead of continuing to redesign a dead route.
- Re-ran type-check and production build to confirm the live `/workspaces` route remains intact.

Status:

- Complete locally. No extra deployment was required because this removed unused source, not live route behavior.

### Completed: Expert Network Route Split Completion

Problem:

- After the dashboard and directory split, `NetworkPages.tsx` still owned Formation Board, Messages, Channels, Join Requests, Trials, profile editing, settings, and detail pages.
- The network journey was visually redefined, but the route file still encouraged future density by keeping several independent jobs in one file.

Solution:

- Extract route-level jobs into focused modules while preserving the existing route exports and API contracts:
  - `NetworkFormationPage.tsx`
  - `NetworkMessagesPage.tsx`
  - `NetworkChannelsPage.tsx`
  - `NetworkJoinRequestsPage.tsx`
  - `NetworkTrialsPage.tsx`
- Leave `NetworkPages.tsx` as the search, notifications, profile/settings/detail owner plus re-export index for split pages.

Status:

- Implemented, committed, pushed, deployed, and live-verified in two batches:
  - Route split commit `598b295`, Coolify frontend deployment `sipo5xcp0a5d333zssqk0api`.
  - Export-hub completion commit `403584e`, Coolify frontend deployment `wd5wl305qu8rwnttvadlqnzi`.
  - Empty-state and compact-cover polish commit `1da019a`, Coolify frontend deployment `car77thjruwalzfmfush3jif`.
- `NetworkPages.tsx` is now 16 lines, down from 933 lines at the start of this pass and 1,530 lines before the earlier dashboard/directory split.
- Local checks passed:
  - `npm --prefix frontend run type-check`
  - `git diff --check`
  - `NEXT_SKIP_BUILD_TYPECHECK=true npm --prefix frontend run build`
- Live verification passed for Formation, Messages, Channels, Join Requests, and Trials:
  - `tmp/live-verification/2026-06-08/130-network-formation-live.png`
  - `tmp/live-verification/2026-06-08/131-network-messages-live.png`
  - `tmp/live-verification/2026-06-08/132-network-channels-live.png`
  - `tmp/live-verification/2026-06-08/133-network-join-requests-live.png`
  - `tmp/live-verification/2026-06-08/134-network-trials-live.png`
  - `tmp/live-verification/2026-06-08/135-mobile-network-trials-live.png`
- Export-hub live verification passed for Search, Notifications, Expert Profile, Settings, Team Profile Studio, Expert Detail, and Team Detail:
  - `tmp/live-verification/2026-06-08/136-network-search-live.png`
  - `tmp/live-verification/2026-06-08/137-network-notifications-live.png`
  - `tmp/live-verification/2026-06-08/138-network-profile-live.png`
  - `tmp/live-verification/2026-06-08/139-network-settings-live.png`
  - `tmp/live-verification/2026-06-08/140-network-team-profile-live.png`
  - `tmp/live-verification/2026-06-08/141-network-expert-detail-live.png`
  - `tmp/live-verification/2026-06-08/142-network-team-detail-live.png`
  - `tmp/live-verification/2026-06-08/143-mobile-settings-live.png`
  - `tmp/live-verification/2026-06-08/143-mobile-teamDetail-live.png`
- Live API caveat: `/expert-network/conversations` returns `500` for the specialist fixture. The Messages route still renders its shell and empty/error state; other extracted route endpoints returned `200`.
- Design polish: Channels now shows explicit empty states when no channels/posts are seeded, and expert/team detail pages use a more compact fallback cover band when no real image exists.

### Current Pass: Team Profile Studio Completion

Problem:

- The authenticated team-manager/specialist `/teams` profile studio still behaved like a long internal profile console.
- Team identity, edit form, members, invitations, join requests, solo expert profile, incoming invitations, and join/create actions were stacked in one page.
- `TeamProfilesPage.tsx` was still large enough that the next UX pass would keep adding density to the route file.

Solution:

- Reframe the profile studio as four focused, URL-backed jobs:
  - Profile: maintain the public team identity.
  - People: manage members, invitations, and join requests.
  - Expert: maintain solo expert proof and availability.
  - Access: respond to invitations or request to join teams.
- Keep the same team, expert profile, invitation, and join-request API contracts.
- Split the page into granular panels so the route orchestrates state instead of owning all JSX.
- Remove ambiguous step-card transitions so only the active studio step reads as selected.

Status:

- Implemented, committed, deployed, and live-verified at UI commit `552c72f`, Coolify frontend deployment `e10vx9t4bni4cw8oqhfjet14`.
- `TeamProfilesPage.tsx` is now 360 lines, with profile studio views split into:
  - `TeamProfileStudioNavigation.tsx`
  - `TeamProfileIdentityPanel.tsx`
  - `TeamProfilePeoplePanel.tsx`
  - `ExpertProfileStudioPanel.tsx`
  - `TeamAccessPanel.tsx`
  - `ProfileHeroPanel.tsx`
  - `teamProfileStudioTypes.ts`
- Focused local verification passed with screenshots:
  - `tmp/live-verification/2026-06-07/104-team-profile-studio-profile-local.png`
  - `tmp/live-verification/2026-06-07/105-team-profile-studio-people-local.png`
  - `tmp/live-verification/2026-06-07/106-team-profile-studio-expert-local.png`
  - `tmp/live-verification/2026-06-07/107-team-profile-studio-access-local.png`
  - `tmp/live-verification/2026-06-07/108-mobile-team-profile-studio-local.png`
- Live verification refreshed:
  - `tmp/live-verification/2026-06-07/104-team-profile-studio-profile-live.png`
  - `tmp/live-verification/2026-06-07/105-team-profile-studio-people-live.png`
  - `tmp/live-verification/2026-06-07/106-team-profile-studio-expert-live.png`
  - `tmp/live-verification/2026-06-07/107-team-profile-studio-access-live.png`
  - `tmp/live-verification/2026-06-07/108-mobile-team-profile-studio-live.png`
- Full owner journey verification passed for commit `552c72f`; scanner coverage remained stored and mapped with all 10 scanners complete.

### Current Pass: Public Profile Detail Completion

Problem:

- Public `/teams/[id]` and `/solo-experts/[id]` detail pages still stacked profile overview, proof, readiness/signals, links, and conversion copy in one vertical detail page.
- The route file mixed data loading, profile hero UI, team proof UI, expert proof UI, conversion copy, and scoring helpers in one component.
- Profiles with no cover image used too much blank first-viewport space, especially on mobile.

Solution:

- Reframe public profiles around the owner evaluation decision:
  - Overview: what this team or expert is best for.
  - Proof: capabilities, skills, or services.
  - Signals: availability, score, and links.
- Keep the profile hero and start-plan action visible before the focused detail spokes.
- Split public profile UI into hero, focus navigation, team detail, expert detail, conversion, and utility files.
- Use a compact default cover band when no real cover image exists.

Status:

- Implemented at UI commit `06bfb0a` and live-verified in batched Coolify frontend deployment `e9gy8cnxqhthi1tvsx5ivi0w` at deployed UI commit `56a0ac2`.
- `PublicProfilePage.tsx` is now 109 lines, with detail UI split into:
  - `PublicProfileFocusNav.tsx`
  - `PublicProfileHeroPanel.tsx`
  - `PublicTeamProfilePanel.tsx`
  - `PublicExpertProfilePanel.tsx`
  - `PublicProfileConversionPanel.tsx`
  - `publicProfileUtils.ts`
- Focused local verification passed with screenshots:
  - `tmp/live-verification/2026-06-07/109-public-team-profile-overview-local.png`
  - `tmp/live-verification/2026-06-07/110-public-team-profile-proof-local.png`
  - `tmp/live-verification/2026-06-07/111-public-team-profile-signals-local.png`
  - `tmp/live-verification/2026-06-07/112-public-expert-profile-overview-local.png`
  - `tmp/live-verification/2026-06-07/113-public-expert-profile-proof-local.png`
  - `tmp/live-verification/2026-06-07/114-mobile-public-team-profile-local.png`
- Live verification refreshed:
  - `tmp/live-verification/2026-06-07/109-public-team-profile-overview-live.png`
  - `tmp/live-verification/2026-06-07/110-public-team-profile-proof-live.png`
  - `tmp/live-verification/2026-06-07/111-public-team-profile-signals-live.png`
  - `tmp/live-verification/2026-06-07/112-public-expert-profile-overview-live.png`
  - `tmp/live-verification/2026-06-07/113-public-expert-profile-proof-live.png`
  - `tmp/live-verification/2026-06-07/114-mobile-public-team-profile-live.png`

### Current Pass: Team Delivery Workspace Completion

Problem:

- Team-role `/dashboard` still stacked proposals, active deliveries, AI evidence coaching, delivery evidence, support requests, roster management, profile completeness, and reputation in one long page.
- The route file owned query/mutation orchestration and all visual sections.
- On mobile, metrics could delay the actual team workflow choice.

Solution:

- Reframe Team Delivery as four focused jobs:
  - Opportunities: proposal queue and owner requests.
  - Delivery Proof: active workspaces, AI evidence coach, attachments, and milestones.
  - Support: owner support and SLA risk actions.
  - Team: roster, capability proof, and reputation.
- Keep the team selector and team hero above the focused job navigation.
- Hide the metric strip on mobile so the workflow choice appears in the first scroll.
- Split route rendering into hero, focus navigation, opportunity, proof, support, team, and utility files.

Status:

- Implemented, committed, deployed, and live-verified at UI commit `56a0ac2`, Coolify frontend deployment `e9gy8cnxqhthi1tvsx5ivi0w`.
- `TeamDeliveryWorkspace.tsx` is now 243 lines, with delivery UI split into:
  - `TeamDeliveryFocusNav.tsx`
  - `TeamDeliveryHeroPanel.tsx`
  - `TeamDeliveryOpportunitiesPanel.tsx`
  - `TeamDeliveryProofPanel.tsx`
  - `TeamDeliverySupportPanel.tsx`
  - `TeamDeliveryTeamPanel.tsx`
  - `teamDeliveryUtils.ts`
- Focused local verification passed with screenshots:
  - `tmp/live-verification/2026-06-07/115-team-delivery-opportunities-local.png`
  - `tmp/live-verification/2026-06-07/116-team-delivery-proof-local.png`
  - `tmp/live-verification/2026-06-07/117-team-delivery-support-local.png`
  - `tmp/live-verification/2026-06-07/118-team-delivery-team-local.png`
  - `tmp/live-verification/2026-06-07/119-mobile-team-delivery-local.png`
- Live verification refreshed:
  - `tmp/live-verification/2026-06-07/115-team-delivery-opportunities-live.png`
  - `tmp/live-verification/2026-06-07/116-team-delivery-proof-live.png`
  - `tmp/live-verification/2026-06-07/117-team-delivery-support-live.png`
  - `tmp/live-verification/2026-06-07/118-team-delivery-team-live.png`
  - `tmp/live-verification/2026-06-07/119-mobile-team-delivery-live.png`
- Full owner journey verification passed for commit `56a0ac2`; scanner coverage remained stored and mapped with all 10 scanners complete.

### Completed: Repo Evidence And Deploy Reliability Close

Problem:

- The live owner evidence card could still show missing README/documentation proof even after the repository source was authorized.
- A Coolify frontend rebuild for `1e38fcf` failed after the Next compile because the duplicate build-time type validation pushed the Docker build beyond the staging host window.
- The Technical Proof journey was functionally correct, but one status chip truncated `10/10 checks` in the live screenshot.

Solution:

- Auto-refresh product repo signals once per selected product when the owner workspace sees `NOT_REFRESHED` repo signals and the product has scanner/repo context.
- Prefer the live documentation evidence label in the evidence summary; if the backend returns generic documentation proof, show `README or documentation evidence found`.
- Keep type safety as an explicit `npm run type-check` gate, but set `NEXT_SKIP_BUILD_TYPECHECK=true` inside the frontend Docker build to skip Next's duplicate type pass on Coolify.
- Prevent owner journey pastel chips from shrinking into ellipsized text.

Status:

- Implemented and pushed through:
  - `1e38fcf` - auto-refresh owner repo readout.
  - `b9b1c8d` - clarify owner documentation evidence.
  - `b635260` - keep frontend Docker deploy within build window.
  - `b61fe6b` - prevent owner journey chip truncation.
- Local verification passed:
  - `mvn -q -Dtest=RepoSignalServiceTest test`
  - `npm --prefix frontend run type-check`
  - `NEXT_SKIP_BUILD_TYPECHECK=true npm --prefix frontend run build`
  - `git diff --check`
- Coolify deployment `qokzywg27xgxg5vfxikkncb0` live-verified commit `b635260`.
- Coolify deployment `y16yg8dqnx5p16tyzxkt1l0q` live-verified commit `b61fe6b`.
- Live owner verifier refreshed the full screenshot set, including:
  - `tmp/live-verification/2026-06-07/33a-findings-evidence-live.png`
  - `tmp/live-verification/2026-06-07/36-technical-proof-live.png`
  - `tmp/live-verification/2026-06-07/40-mobile-hub-spoke-live.png`
  - `tmp/live-verification/2026-06-07/40a-mobile-start-plan-live.png`
- Live API verification for the ProdUS repo/readme product confirmed:
  - Repo signals: `AUTHORIZED_SOURCE`, 38 signals, documentation evidence present.
  - Scanner coverage: 10/10 tools `COMPLETED`.
  - Latest mapped counts: 73 open findings, 14 high, 28 medium, 1 low, 30 info.
  - Stored evidence: 20 evidence items across 4 authorized sources.

### Completed: Expert Network Dashboard And Directory Split

Problem:

- `frontend/src/features/expert-network/NetworkPages.tsx` was the largest live UI file at 1,530 lines after the owner/productization pass.
- It mixed shared tag/avatar/notice/activity UI, reusable expert/team cards, message action routing, the Network dashboard, the Expert Directory, and the remaining Network pages in one component file.
- This made future Network UX redefinition work risky because dashboard and directory changes would keep touching the same large route file.

Solution:

- Extracted shared Network presentation helpers:
  - `networkPresentation.ts`
  - `useNetworkMessageAction.ts`
- Extracted reusable Network UI:
  - `NetworkSharedPanels.tsx`
  - `NetworkProfileCards.tsx`
- Extracted route-level surfaces:
  - `NetworkDashboardPage.tsx`
  - `NetworkDirectoryPage.tsx`
- Preserved the existing route imports by re-exporting those pages from `NetworkPages.tsx`.

Status:

- Implemented, committed, deployed, and live-verified at UI commit `4ec6b4e`, Coolify frontend deployment `qog9aajlhgano9197y3qm7rj`.
- `NetworkPages.tsx` is now 933 lines, down from 1,530.
- Local verification passed:
  - `npm --prefix frontend run type-check`
  - `NEXT_SKIP_BUILD_TYPECHECK=true npm --prefix frontend run build`
  - `git diff --check`
- Focused live verification passed with screenshots:
  - `tmp/live-verification/2026-06-07/120-network-dashboard-live.png`
  - `tmp/live-verification/2026-06-07/121-network-directory-live.png`
  - `tmp/live-verification/2026-06-07/122-network-directory-filters-live.png`
  - `tmp/live-verification/2026-06-07/123-mobile-network-directory-live.png`
- Live API notes:
  - `/expert-profiles` returned 2 experts.
  - `/teams` returned 1 team.
  - `/expert-network/home` currently returns 500 for the available mock fixtures, but the dashboard route still renders its shell and Browse Network action. This appears to be a backend fixture/data issue, not a regression from the frontend split.

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
