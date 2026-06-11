# Owner Productization Completion Pass

Date: 2026-06-08

Baseline:

- Latest live-verified UI commit after the AI catalog owner-action pass: `14e586e`.
- Latest live-verified Coolify frontend deployment after the AI catalog owner-action pass: `m81n519suooosc1iqrdwpvmo`.
- Verification fixture: ProdUS repo/readme product `0a56637c-41b3-4b8b-9ecd-88eca3d7a237`.
- Latest live verification script: `tmp/live-verification/2026-06-08/service-path-language-live-review.js`.
- Current largest owner-facing active files after the completed splits:
  - `frontend/src/features/platform/OwnerProductizationWorkspace.tsx`: 642 lines.
  - `frontend/src/features/platform/WorkspaceCommandPage.tsx`: 411 lines.
  - `frontend/src/features/platform/ownerWorkspaceDerivedState.ts`: 340 lines.
  - `frontend/src/features/platform/PublicTalentPanels.tsx`: 340 lines.
  - `frontend/src/features/platform/PublicTalentDirectoryPage.tsx`: 333 lines.
  - `frontend/src/features/platform/StudioAssistantCard.tsx`: 322 lines.
  - `frontend/src/features/platform/useWorkspaceCommandActions.ts`: 320 lines.
  - `frontend/src/features/platform/OwnerWorkspaceTechnicalProofArea.tsx`: 309 lines.
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
- The live Expert Network Messages backend caveat is fixed: backend deployment `nmg3fupz2hwmtxq3kx7hdo20` is running commit `35a0c1a128a3c98d31bc6a6dfdfb1f501ededee0`, and `/expert-network/conversations` now returns `200` for the specialist fixture.
- Product portfolio is split into route orchestration plus focused action, summary, metrics, and list panels. Mobile now shows the next owner action before the product list.
- Owner service-plan and team-match spokes now stay preview/decision-first: pre-plan products bridge to the Project Start Plan, team fallback rows are mobile-safe, and the workspace shell no longer overflows horizontally on phone viewports.
- The standalone Project Start Plan route is split into data, action, journey model, hero, and metric-strip modules while preserving the mobile owner-first hub and URL-backed Readiness / Services / Talent / Approve spokes.

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
  - AI Integration Options: where AI can help the product journey while actions stay human-confirmed.
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
- Backend follow-up complete: `/expert-network/conversations` previously returned `500` for the specialist fixture because the Postgres query used `select distinct` with an ordered expression. Backend commit `35a0c1a` removed the unnecessary `distinct`, added regression coverage for the visible-thread query, deployed through Coolify backend deployment `nmg3fupz2hwmtxq3kx7hdo20`, and live verification now returns `200` for Conversations.
- Design polish: Channels now shows explicit empty states when no channels/posts are seeded, and expert/team detail pages use a more compact fallback cover band when no real image exists.

### Current Pass: Command Center And Product Portfolio Completion

Problem:

- The command-center and product portfolio surfaces still exposed the compatibility `/owner/project-cart` route in several implementation paths.
- `/products` kept the next owner action behind the portfolio list on mobile, forcing a founder to scan records before creating a product or opening the Project Start Plan.
- `ProductProfilesPage.tsx` mixed query orchestration, scoring helpers, metrics, product rows, next-action copy, and summary UI in one route file.

Solution:

- Centralize the Project Start Plan compatibility URL behind `PROJECT_START_PLAN_HREF`, while keeping visible copy focused on `Project Start Plan`.
- Apply the same shared Start Plan navigation to service catalog, team match, public talent, and public profile conversion CTAs.
- Split product portfolio rendering into:
  - `ProductProfilesPanels.tsx`
  - `productProfilesModel.ts`
  - `projectStartPlanLinks.ts`
- Reorder `/products` so mobile shows `Next Product Action` and portfolio summary before the product list.
- Keep desktop balanced as metrics/list plus right-side action and summary panels, and prevent product rows from compressing into unreadable columns before the `xl` breakpoint.

Status:

- Implemented, committed, deployed, and live-verified at UI commit `126b2a0`, Coolify frontend deployment `mfit7nmzjqhh0bkqjf0x1vq0`.
- `ProductProfilesPage.tsx` is now 70 lines, down from 220 lines.
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `npm --prefix frontend run build`
  - `NEXT_SKIP_BUILD_TYPECHECK=true npm --prefix frontend run build`
- Focused local verification passed with screenshots:
  - `tmp/live-verification/2026-06-08/144-command-center-hub-local.png`
  - `tmp/live-verification/2026-06-08/145-command-center-products-spoke-local.png`
  - `tmp/live-verification/2026-06-08/146-product-portfolio-desktop-local.png`
  - `tmp/live-verification/2026-06-08/147-mobile-product-portfolio-actions-first-local.png`
- Live verification refreshed the command-center and product portfolio screenshots:
  - `tmp/live-verification/2026-06-08/144-command-center-hub-live-126b2a0.png`
  - `tmp/live-verification/2026-06-08/145-command-center-products-spoke-live-126b2a0.png`
  - `tmp/live-verification/2026-06-08/146-product-portfolio-desktop-live-126b2a0.png`
  - `tmp/live-verification/2026-06-08/147-mobile-product-portfolio-actions-first-live-126b2a0.png`
- Start Plan label/link cleanup also passed existing focused local and live verifiers:
  - `tmp/live-verification/2026-06-07/86-service-catalog-templates-local-startplan-copy.png`
  - `tmp/live-verification/2026-06-07/87-service-catalog-workstreams-local-startplan-copy.png`
  - `tmp/live-verification/2026-06-07/88-service-catalog-ai-contracts-local-startplan-copy.png`
  - `tmp/live-verification/2026-06-07/89-mobile-service-catalog-templates-local-startplan-copy.png`
  - `tmp/live-verification/2026-06-07/90-team-match-choose-local-startplan-copy.png`
  - `tmp/live-verification/2026-06-07/91-team-match-inspect-local-startplan-copy.png`
  - `tmp/live-verification/2026-06-07/92-team-match-shortlist-local-startplan-copy.png`
  - `tmp/live-verification/2026-06-07/93-mobile-team-match-local-startplan-copy.png`
  - `tmp/live-verification/2026-06-07/94-public-talent-teams-local-startplan-copy.png`
  - `tmp/live-verification/2026-06-07/95-public-talent-experts-local-startplan-copy.png`
  - `tmp/live-verification/2026-06-07/96-public-talent-services-local-startplan-copy.png`
  - `tmp/live-verification/2026-06-07/97-mobile-public-talent-teams-local-startplan-copy.png`
  - `tmp/live-verification/2026-06-07/98-solo-experts-default-local-startplan-copy.png`
  - `tmp/live-verification/2026-06-07/86-service-catalog-templates-live-126b2a0.png`
  - `tmp/live-verification/2026-06-07/87-service-catalog-workstreams-live-126b2a0.png`
  - `tmp/live-verification/2026-06-07/88-service-catalog-ai-contracts-live-126b2a0.png`
  - `tmp/live-verification/2026-06-07/89-mobile-service-catalog-templates-live-126b2a0.png`
  - `tmp/live-verification/2026-06-07/90-team-match-choose-live-126b2a0.png`
  - `tmp/live-verification/2026-06-07/91-team-match-inspect-live-126b2a0.png`
  - `tmp/live-verification/2026-06-07/92-team-match-shortlist-live-126b2a0.png`
  - `tmp/live-verification/2026-06-07/93-mobile-team-match-live-126b2a0.png`
  - `tmp/live-verification/2026-06-07/94-public-talent-teams-live-126b2a0.png`
  - `tmp/live-verification/2026-06-07/95-public-talent-experts-live-126b2a0.png`
  - `tmp/live-verification/2026-06-07/96-public-talent-services-live-126b2a0.png`
  - `tmp/live-verification/2026-06-07/97-mobile-public-talent-teams-live-126b2a0.png`
  - `tmp/live-verification/2026-06-07/98-solo-experts-default-live-126b2a0.png`

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

### Current Pass: Owner Overview Decision Card Split

Problem:

- `OwnerOverviewDecisionPanel.tsx` still mixed the launch verdict, top risks, recommended owner actions, evidence checks, and service recommendation in one component.
- The owner workspace mobile tab row could create a few pixels of horizontal overflow, and the product hero action buttons could collide on medium desktop widths.

Solution:

- Split the overview decision surface into focused files:
  - `OwnerOverviewLaunchDecisionCard.tsx`
  - `OwnerOverviewRiskActionCards.tsx`
  - `OwnerOverviewProofServiceCards.tsx`
  - `ownerOverviewDecisionTypes.ts`
- Keep `OwnerOverviewDecisionPanel.tsx` as a 63-line layout composer.
- Make the owner workspace top tabs equal-width on mobile so Overview / Action Plan / Findings / Services fit cleanly.
- Let the product hero action buttons wrap into stable rows instead of compressing.

Status:

- Implemented, committed, deployed, and live-verified at UI commit `bc765ac`, Coolify frontend deployment `y8ohsgy0ndb068fwjuru6tn3`.
- This deployment batch includes the overview split commit `8e14aa4` and the finding-review drawer split commit `bc765ac`.
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `NEXT_SKIP_BUILD_TYPECHECK=true npm --prefix frontend run build`
- Focused local verification passed with screenshots:
  - `tmp/live-verification/2026-06-08/148-owner-overview-card-split-local-overview-split.png`
  - `tmp/live-verification/2026-06-08/149-mobile-owner-overview-card-split-local-overview-split.png`
- Focused live verification passed with screenshots:
  - `tmp/live-verification/2026-06-08/148-owner-overview-card-split-live-bc765ac-scroll.png`
  - `tmp/live-verification/2026-06-08/149-mobile-owner-overview-card-split-live-bc765ac-scroll.png`

### Current Pass: Finding Review Drawer Split

Problem:

- `OwnerFindingReviewDrawer.tsx` still mixed the scanner finding summary, proof facts, recommended service, owner decision controls, AI review helper, and linked evidence in one drawer component.
- The drawer is a high-trust moment for startup owners because it explains one blocker, its proof, and the decision path. Keeping the internals dense made it harder to refine without reintroducing scanner-dashboard behavior.
- Long raw scanner context strings could appear as chip-like content and risk clipping on phone screenshots.

Solution:

- Keep the drawer as the route-level shell and split the actual decision content into:
  - `OwnerFindingReviewSummaryPanels.tsx`
  - `OwnerFindingReviewDecisionPanels.tsx`
- Preserve the owner sequence inside the drawer:
  - Plain-language finding summary.
  - Affected area, source rule, linked proof, proof needed, and mapping reason.
  - Recommended service tied to the blocker.
  - Owner decision controls.
  - Optional AI review.
  - Linked evidence.
- Render only compact values as chips and move long scanner context into wrapped proof text.
- Tighten the local verifier so it opens the exact row-level `Review` action and waits for the drawer transition to settle before screenshots.

Status:

- Implemented, committed, deployed, and live-verified at UI commit `bc765ac`, Coolify frontend deployment `y8ohsgy0ndb068fwjuru6tn3`.
- `OwnerFindingReviewDrawer.tsx` is now 141 lines, with summary and decision/evidence sections split into focused files.
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `NEXT_SKIP_BUILD_TYPECHECK=true npm --prefix frontend run build`
- Focused local verification passed with screenshots:
  - `tmp/live-verification/2026-06-08/150-finding-review-drawer-local.png`
  - `tmp/live-verification/2026-06-08/151-mobile-finding-review-drawer-local.png`
- Focused live verification passed with screenshots:
  - `tmp/live-verification/2026-06-08/150-finding-review-drawer-live-bc765ac.png`
  - `tmp/live-verification/2026-06-08/151-mobile-finding-review-drawer-live-bc765ac.png`
- Live scanner coverage sanity check still reports 10/10 tools completed, including `OWASP ZAP Baseline`, with latest mapped counts preserved in the summary.

### Current Pass: Owner Project Start Side-Rail Split

Problem:

- `OwnerProjectStartPanel.tsx` still stacked the Start Plan summary, every selected service, every blocking gap, talent, workspace naming, approval controls, and follow-up link in one side-rail component.
- On the ProdUS repo/readme fixture, the side rail had 28 selected services, which pushed the approval controls too far down and made the mobile path feel like a long inventory page again.
- Some side-rail copy still used older `Add` / `Start Project Workspace` wording instead of the approval-plan language used by the main Start Plan route.

Solution:

- Split the side rail into focused sections:
  - `OwnerProjectStartSummaryCard.tsx`
  - `OwnerProjectStartServicesPanel.tsx`
  - `OwnerProjectStartTalentPanel.tsx`
  - `OwnerProjectStartApprovalControls.tsx`
- Keep the side rail as a preview and decision surface by showing the first four services, the total service count, and an `Open full Start Plan` handoff for the complete scope.
- Change the primary CTA to `Approve Plan And Start Workspace` and keep service-gap actions on `Choose` language.

Status:

- Implemented, committed, deployed, and live-verified at UI commit `aad694c`, Coolify frontend deployment `kt3od6kl5qdbyldxb381pkmt`.
- This deployment batch includes the Start Plan side-rail split commit `60fcd79` and scanner finding decision-list split commit `aad694c`.
- `OwnerProjectStartPanel.tsx` is now 122 lines, down from 256 lines.
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `NEXT_SKIP_BUILD_TYPECHECK=true npm --prefix frontend run build`
- Focused local verification passed with screenshots:
  - `tmp/live-verification/2026-06-08/152-owner-project-start-panel-local.png`
  - `tmp/live-verification/2026-06-08/153-mobile-owner-project-start-panel-local.png`
- Focused live verification passed with screenshots:
  - `tmp/live-verification/2026-06-08/152-owner-project-start-panel-live-aad694c-v2.png`
  - `tmp/live-verification/2026-06-08/153-mobile-owner-project-start-panel-live-aad694c-v2.png`

### Current Pass: Scanner Finding Decision List Split

Problem:

- `ScannerProofFindingDecisionList.tsx` showed full decision-note, risk-review, service recommendation, and resolution controls on every visible finding card.
- This made the Fix Path step feel like another long scanner/operator page even though the owner journey only needs one finding decision at a time.
- The old implementation also kept a lingering owner-facing fallback sentence that said `Add this service...` instead of `Choose this service...`.

Solution:

- Split each finding into `ScannerProofFindingCard.tsx`, leaving `ScannerProofFindingDecisionList.tsx` as a compact list composer.
- Expand only the active finding with decision controls and service action; keep the rest as scannable review cards.
- Show a short summary when additional normalized findings remain beyond the visible set.
- Keep wording aligned with Project Start Plan language by using `Choose this service for tracked remediation...`.

Status:

- Implemented, committed, deployed, and live-verified at UI commit `aad694c`, Coolify frontend deployment `kt3od6kl5qdbyldxb381pkmt`.
- `ScannerProofFindingDecisionList.tsx` is now 81 lines, down from 227 lines.
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `NEXT_SKIP_BUILD_TYPECHECK=true npm --prefix frontend run build`
- Focused local verification passed with screenshots:
  - `tmp/live-verification/2026-06-08/154-scanner-finding-decision-list-local.png`
  - `tmp/live-verification/2026-06-08/155-mobile-scanner-finding-decision-list-local.png`
- Focused live verification passed with screenshots:
  - `tmp/live-verification/2026-06-08/154-scanner-finding-decision-list-live-aad694c.png`
  - `tmp/live-verification/2026-06-08/155-mobile-scanner-finding-decision-list-live-aad694c.png`
- Live scanner coverage sanity check still reports 10/10 tools completed, including `OWASP ZAP Baseline`, with latest mapped counts preserved in the summary.

### Current Pass: Owner Service Plan And Team Match Spokes

Problem:

- The Service Plan spoke still behaved like a dead end when the current product had selected Start Plan services but no generated package instance.
- The generated package detail view could expose the whole delivery sequence inline, recreating the long-page pattern.
- The Team Match spoke had too many equal-weight controls per team row when recommendations exist, while the no-match fallback picker could overflow on mobile.
- The product workspace mobile shell could still inherit horizontal overflow from shrink-unsafe grid/card children.

Solution:

- Split service-plan detail into focused pieces:
  - `OwnerServicePlanSummaryCard.tsx`
  - `OwnerServicePlanSequencePreview.tsx`
  - `OwnerServicePlanEmptyBridge.tsx`
- Keep generated package depth as a four-service delivery preview with a full Start Plan handoff.
- Replace the old generic no-plan empty state with an owner next step: approve the Project Start Plan first, then generate or attach a detailed package when delivery needs team handoff.
- Split team matching into:
  - `OwnerTeamRecommendationCard.tsx`
  - `OwnerTeamFallbackPicker.tsx`
- Keep recommendation cards decision-first: primary attach/approve action, secondary shortlist/compare actions.
- Make fallback team/expert rows shrink-safe on mobile and add accessible icon labels.
- Add shrink-safe sizing to the owner workspace grid and shared `Surface` card component.

Status:

- Implemented, committed, deployed, and live-verified at UI commit `a38bcb0`, Coolify frontend deployment `ca0muuqwavd7js1e9axwoql7`.
- `OwnerServicePlanDetailPanel.tsx` is now 74 lines, with service-plan summary, sequence preview, and empty bridge split into focused files.
- `OwnerTeamMatchPanel.tsx` is now 129 lines, with recommendation cards and fallback picker split out.
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `NEXT_SKIP_BUILD_TYPECHECK=true npm --prefix frontend run build`
- Focused local verification passed with screenshots:
  - `tmp/live-verification/2026-06-08/156-service-plan-preview-local.png`
  - `tmp/live-verification/2026-06-08/157-mobile-service-plan-preview-local.png`
  - `tmp/live-verification/2026-06-08/158-team-match-decision-local.png`
  - `tmp/live-verification/2026-06-08/159-mobile-team-match-decision-local.png`
- Focused live verification passed with screenshots:
  - `tmp/live-verification/2026-06-08/156-service-plan-preview-live-a38bcb0.png`
  - `tmp/live-verification/2026-06-08/157-mobile-service-plan-preview-live-a38bcb0.png`
  - `tmp/live-verification/2026-06-08/158-team-match-decision-live-a38bcb0.png`
  - `tmp/live-verification/2026-06-08/159-mobile-team-match-decision-live-a38bcb0.png`
- Live scanner coverage sanity check reports 10/10 latest tools, 10/10 completed tools, `zap-baseline` completed, and 73 mapped scanner findings preserved in latest coverage.

### Current Pass: Project Start Plan Route Split

Problem:

- `ProjectStartPlanPage.tsx` still owned data queries, mutations, readiness scoring, journey item construction, product selection, catalog recommendation actions, and board wiring in one route file.
- `ProjectStartPlanOverview.tsx` still combined the mobile-first Start Plan hero/product selector with the metric strip in one component.
- A few approval-path strings still used `Add` language where the owner action should be choosing blocker coverage for an approved plan.

Solution:

- Split the route orchestration into:
  - `useProjectStartPlanData.ts`
  - `useProjectStartPlanActions.ts`
  - `projectStartPlanModel.tsx`
- Split the overview into:
  - `ProjectStartPlanHeroCard.tsx`
  - `ProjectStartPlanMetricStrip.tsx`
- Keep `ProjectStartPlanPage.tsx` as a board coordinator and `ProjectStartPlanOverview.tsx` as a small layout composer.
- Replace remaining approval-path `Add` wording with `Choose` language.

Status:

- Implemented, committed, deployed, and live-verified at UI commit `cc038ad`, Coolify frontend deployment `tukad2yfk3n7gq56cyam42cj`.
- `ProjectStartPlanPage.tsx` is now 185 lines, down from 280 lines.
- `ProjectStartPlanOverview.tsx` is now 60 lines, down from 196 lines.
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `NEXT_SKIP_BUILD_TYPECHECK=true npm --prefix frontend run build`
- Focused local verification passed with screenshots:
  - `tmp/live-verification/2026-06-08/160-project-start-plan-hub-local.png`
  - `tmp/live-verification/2026-06-08/161-project-start-plan-services-local.png`
  - `tmp/live-verification/2026-06-08/162-project-start-plan-approval-local.png`
  - `tmp/live-verification/2026-06-08/163-mobile-project-start-plan-hub-local.png`
- Focused live verification passed with screenshots:
  - `tmp/live-verification/2026-06-08/160-project-start-plan-hub-live-cc038ad.png`
  - `tmp/live-verification/2026-06-08/161-project-start-plan-services-live-cc038ad.png`
  - `tmp/live-verification/2026-06-08/162-project-start-plan-approval-live-cc038ad.png`
  - `tmp/live-verification/2026-06-08/163-mobile-project-start-plan-hub-live-cc038ad.png`
- Live scanner coverage sanity check reports 10/10 latest tools, 10/10 completed tools, `zap-baseline` completed, and 73 mapped scanner findings preserved in latest coverage.

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

### Completed: Handwritten Owner Journey Implementation And Final Live Verification

Problem:

- The handwritten journey notes asked for Product Home, Services, Product Creation, and Public Share to feel like one product-context journey.
- Services still needed to work as a product entry path, not only a global catalog or post-diagnosis page.
- Product creation needed focused internal views with a way back, not a long page that swapped sections under buttons.
- External product sharing needed safe public summaries and owner-controlled section visibility before any private proof could be exposed.
- The first deployed implementation still allowed product creation directly from the manual form and did not yet expose viewer-action fields or safe findings/evidence/team summaries on public links.
- The first forced Coolify rebuild for the final share-link schema overloaded the staging host and timed out, so the deployment needed to be repeated with a build-cache fix.

Solution:

- Added service-first and product-first entry points on Product Home.
- Reworked the Service Catalog into a discovery landing plus focused internal catalog views with explicit back navigation.
- Carried selected service/template context into `/products/new` and preserved it through setup and manual product creation.
- Added focused product-creation internal views for setup, manual fields, AI review, and final owner review before creating the workspace.
- Added Product Workspace `Share` navigation and a share-link management surface.
- Implemented backend share-link persistence, revocation, public token lookup, viewer actions, public section visibility, and private-by-default locked sections.
- Added public product share pages at `/share/product/{token}` with safe summaries and selected services when explicitly shared.
- Renamed the confusing `AI Contracts` catalog language to `AI Integration Options`.
- Added backend scanner Maven dependency caching in `backend/Dockerfile.scanner` so Coolify can rebuild the scanner image within the staging build window.

Status:

- Final implementation deployed and live-verified at commit `343833b`.
- Feature implementation commit: `2671e5c`.
- Coolify backend deployment: `u1m7k8ldj27qbsot3ig6pf15`.
- Coolify frontend deployment: `m129q7ixdtf2r8zpasb9zxct`.
- Failed forced deployment attempts `egwrrbform0c6odtrk5le7z5` and `n9dr37thje29fedr1bfk1fic` timed out during rebuild and rolled back; the successful redeploy used the scanner Maven cache fix.
- Local checks passed:
  - `npm --prefix frontend run type-check`
  - `mvn test`
  - `npm --prefix frontend run build`
- Live backend health returned `UP`.
- Final focused live verification artifact:
  - `tmp/live-verification/2026-06-08/owner-journey-final-343833b-result.json`
- Final live verification passed with screenshots:
  - `tmp/live-verification/2026-06-08/209-product-creation-review-live-343833b.png`
  - `tmp/live-verification/2026-06-08/210-service-catalog-ai-options-live-343833b.png`
  - `tmp/live-verification/2026-06-08/211-share-link-config-live-343833b.png`
  - `tmp/live-verification/2026-06-08/212-public-share-safe-summaries-live-343833b.png`
  - `tmp/live-verification/2026-06-08/213-public-share-safe-summaries-mobile-live-343833b.png`
  - `tmp/live-verification/2026-06-08/214-product-create-mobile-internal-view-live-343833b.png`
- Live scanner sanity for product `0a56637c-41b3-4b8b-9ecd-88eca3d7a237` confirmed:
  - Latest tools: `10/10`
  - Completed tools: `10/10`
  - `zap-baseline`: `COMPLETED`
  - Mapped findings preserved: `73` open findings with `10` mapped ZAP findings.
- Live share-link sanity confirmed:
  - Public link exposes only selected safe sections plus viewer action.
  - Public safe sections include findings, evidence, and team summaries, not private detailed artifacts.
  - Internal-only share links return `404` through `/share/product/{token}`.

### Current Pass: Owner Navigation Deduplication

Problem:

- Owner global navigation exposed `Productization`, `Products`, and `Start Plan` as separate top-level destinations even though they overlap in the owner's mental model.
- Product workspaces allowed switching products from the workspace header, which made the selected product feel editable in-place.
- The owner needed a clearer split between Home as the portfolio/project switchboard and product workspaces as selected-product action surfaces.

Solution:

- Renamed the owner global `Productization` entry to `Home`.
- Removed `Products` and `Start Plan` from the product-owner global sidebar; those flows remain reachable from Home and direct URLs for compatibility.
- Reframed the owner Home header around portfolio metrics, selected projects, draft start plan state, and active workspaces.
- Replaced the workspace product dropdown with a fixed selected-product context bar and a `Switch product on Home` route.
- Moved desktop product-area navigation to the left sidebar by hiding the duplicate top tab strip on desktop while keeping it on mobile.
- Removed repeated Project Start Plan buttons from the product portfolio page so product selection does not compete with start-plan review.

Status:

- Implemented, deployed, and live-verified at UI commit `c5362bd`, Coolify frontend deployment `ixusf8wx8sbfpnfe372yv65l`.
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `NEXT_SKIP_BUILD_TYPECHECK=true npm --prefix frontend run build`
- Focused local verification passed:
  - `tmp/live-verification/2026-06-08/local-owner-navigation-dedup.js`
- Local screenshots:
  - `tmp/live-verification/2026-06-08/215-owner-home-navigation-dedup-local.png`
  - `tmp/live-verification/2026-06-08/216-selected-product-context-fixed-local.png`
  - `tmp/live-verification/2026-06-08/217-selected-product-context-mobile-local.png`
- Live verification passed against `https://produs-staging.46.224.145.148.sslip.io`.
- Live screenshots:
  - `tmp/live-verification/2026-06-08/215-owner-home-navigation-dedup-live.png`
  - `tmp/live-verification/2026-06-08/216-selected-product-context-fixed-live.png`
  - `tmp/live-verification/2026-06-08/217-selected-product-context-mobile-live.png`

### Completed: Product Workspace Internal Routing

Problem:

- Deep selected-product routes such as `/products/{id}?tab=services&view=plan` still looked like the product home plus more UI underneath.
- The left sidebar could keep `Product Home`/old overview state active while the URL was on a selected-product spoke such as Services.
- Mobile still used a tab-style product-area switcher, which made the owner feel like content was swapping below the same screen instead of navigating into an internal product page.
- Internal spokes needed an obvious return path to the selected product home.

Solution:

- Treat `Action Plan`, `Findings`, `Services`, and `Share` query routes as focused internal product pages.
- Keep the fixed selected-product context bar at the top, then replace the product hero/readiness reveal with an internal page header for the active spoke.
- Add a `Product home` return action that clears `tab` and `view` and returns to `/products/{id}`.
- Make `/products/{id}?tab=services` and similar area routes resolve to their first focused internal view when no `view` is present.
- Replace the mobile product-area tabs with navigation buttons and a back-style `Product Home` choice.
- Fix selected-product sidebar active matching so the active item follows `tab`, while ignoring deeper `view` changes inside the same product area.

Status:

- Implemented, committed, deployed, and live-verified at UI commit `44ba524`, Coolify frontend deployment `empuwv9zys464wsf1nyjcw41`.
- `OwnerWorkspaceInternalPageHeader.tsx` now owns the focused internal-page heading and return action.
- `OwnerWorkspaceNavigationPanel.tsx` no longer uses MUI Tabs for product areas; mobile product navigation is button-based.
- `Overview` product-area language is now `Product Home` in the selected-product model and sidebar.
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `NEXT_SKIP_BUILD_TYPECHECK=true npm --prefix frontend run build`
- Focused local and live verification passed with `tmp/live-verification/2026-06-08/product-internal-routing.js`.
- Live screenshots:
  - `tmp/live-verification/2026-06-08/219-product-home-route-live.png`
  - `tmp/live-verification/2026-06-08/220-service-plan-internal-route-live.png`
  - `tmp/live-verification/2026-06-08/221-returned-product-home-live.png`
  - `tmp/live-verification/2026-06-08/222-mobile-service-plan-internal-route-live.png`

### Completed: Owner Navigation Density And Context Follow-Up

Problem:

- The sidebar could switch into selected-product actions while the owner was still on Home, which made Home feel less like the portfolio switchboard.
- Product-specific service selection links still pointed through the legacy `/services` alias instead of the canonical catalog route, and some links lost the active product context.
- Product Briefs, Team Match, and public solo-expert discovery could become long list/grid surfaces as records grow.
- Project Start Plan could show a high/perfect readiness score while still showing blockers, which weakens owner trust in the verdict.

Solution:

- Keep Home on the general owner menu. Show the selected-product sidebar only on product-context routes such as Product Home, Project Start Plan, and product-scoped catalog views.
- Add `Project Start Plan` to the selected-product sidebar so product-specific actions are coherent from the left rail.
- Route visible service links to `/catalog`, while preserving `/services` as compatibility.
- Pass active `productId` into Start Plan service/readiness panels so `Choose service` opens `/catalog?productId=...`.
- Add search and visible-list caps to Product Briefs queue, Team Match plan picker, and public solo-expert/team discovery.
- Clamp Team Match plan summaries on mobile so plan selection remains a quick choice.
- Cap Project Start Plan readiness score when blockers exist and show `Blocked` consistently in score, status metrics, and internal context panels.

Status:

- Implemented, committed, deployed, and live-verified at UI commit `f0ad6d9`, Coolify frontend deployment `rdq6512o00l34ell65ggulx8`.
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `npm --prefix frontend run build`
- Focused local and live verification passed with `tmp/live-verification/2026-06-09/navigation-density-context-review.js`.
- Local screenshots:
  - `tmp/live-verification/2026-06-09/404-home-general-menu-local-nav-density.png`
  - `tmp/live-verification/2026-06-09/405-product-home-context-menu-local-nav-density.png`
  - `tmp/live-verification/2026-06-09/406-start-plan-product-scoped-services-local-nav-density.png`
  - `tmp/live-verification/2026-06-09/407-product-briefs-capped-queue-local-nav-density.png`
  - `tmp/live-verification/2026-06-09/408-team-match-capped-plan-picker-local-nav-density.png`
  - `tmp/live-verification/2026-06-09/409-talent-experts-capped-directory-local-nav-density.png`
  - `tmp/live-verification/2026-06-09/410-home-general-menu-local-nav-density.png`
  - `tmp/live-verification/2026-06-09/411-product-home-context-menu-local-nav-density.png`
  - `tmp/live-verification/2026-06-09/412-start-plan-product-scoped-services-local-nav-density.png`
  - `tmp/live-verification/2026-06-09/413-product-briefs-capped-queue-local-nav-density.png`
  - `tmp/live-verification/2026-06-09/414-team-match-capped-plan-picker-local-nav-density.png`
  - `tmp/live-verification/2026-06-09/415-talent-experts-capped-directory-local-nav-density.png`
- Live screenshots:
  - `tmp/live-verification/2026-06-09/404-home-general-menu-live-f0ad6d9.png`
  - `tmp/live-verification/2026-06-09/405-product-home-context-menu-live-f0ad6d9.png`
  - `tmp/live-verification/2026-06-09/406-start-plan-product-scoped-services-live-f0ad6d9.png`
  - `tmp/live-verification/2026-06-09/407-product-briefs-capped-queue-live-f0ad6d9.png`
  - `tmp/live-verification/2026-06-09/408-team-match-capped-plan-picker-live-f0ad6d9.png`
  - `tmp/live-verification/2026-06-09/409-talent-experts-capped-directory-live-f0ad6d9.png`
  - `tmp/live-verification/2026-06-09/410-home-general-menu-live-f0ad6d9.png`
  - `tmp/live-verification/2026-06-09/411-product-home-context-menu-live-f0ad6d9.png`
  - `tmp/live-verification/2026-06-09/412-start-plan-product-scoped-services-live-f0ad6d9.png`
  - `tmp/live-verification/2026-06-09/413-product-briefs-capped-queue-live-f0ad6d9.png`
  - `tmp/live-verification/2026-06-09/414-team-match-capped-plan-picker-live-f0ad6d9.png`
  - `tmp/live-verification/2026-06-09/415-talent-experts-capped-directory-live-f0ad6d9.png`
- Live scanner sanity for product `0a56637c-41b3-4b8b-9ecd-88eca3d7a237` confirmed:
  - Tool coverage: `10/10`
  - Completed tool coverage: `10/10`
  - `zap-baseline`: `COMPLETED`
  - Mapped findings preserved: `73` open findings with `10` mapped ZAP findings.

### Completed: Duplicate Product Navigation Cleanup

Problem:

- Product Home desktop had two navigation systems competing for the same selected-product actions: the left selected-product sidebar and an in-page `Product navigation` block.
- Mobile still needed the in-page product navigation because the persistent selected-product sidebar is not visible at that viewport.

Solution:

- Hide `ProductAreaNavigation` on desktop and keep it visible on mobile only.
- Preserve the left selected-product sidebar as the canonical desktop route surface.

Status:

- Implemented, committed, deployed, and live-verified at UI commit `a2604ea`, Coolify frontend deployment `x12yxhxons9aesvgo4k4xxua`.
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `npm --prefix frontend run build`
- Focused local and live verification passed with `tmp/live-verification/2026-06-09/navigation-density-context-review.js`.
- Live screenshots:
  - `tmp/live-verification/2026-06-09/405-product-home-context-menu-live-a2604ea.png`
  - `tmp/live-verification/2026-06-09/411-product-home-context-menu-live-a2604ea.png`

### Completed: Focused Product Action Routing

Problem:

- Selected-product sidebar and mobile product-navigation actions still opened area hubs first, so owner clicks could feel like another switchboard before reaching the useful internal view.
- The user expectation is that `Action Plan`, `Findings`, `Services`, and `Share` move into a focused internal product page, with an explicit way back to the product home or area hub.

Solution:

- Centralize default selected-product routes:
  - `Action Plan` -> `?tab=actions&view=plan`
  - `Findings` -> `?tab=findings&view=risks`
  - `Services` -> `?tab=services&view=recommend`
  - `Share` -> `?tab=share&view=create`
- Keep area hubs available only as a breadcrumb/back target.
- Preserve Product Home as the product-switch return surface.

Status:

- Implemented, committed, deployed, and live-verified at UI commit `bf8490b`, Coolify frontend deployment `txzjfiiy25sxihkce00lwr21`.
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `npm --prefix frontend run build`
- Focused local and live verification passed with:
  - `tmp/live-verification/2026-06-09/navigation-density-context-review.js`
  - `tmp/live-verification/2026-06-09/product-internal-pages-review.js`
- Live screenshots:
  - `tmp/live-verification/2026-06-09/416-product-action-plan-live-bf8490b.png`
  - `tmp/live-verification/2026-06-09/420-product-services-recommend-live-bf8490b.png`
  - `tmp/live-verification/2026-06-09/422-product-share-create-live-bf8490b.png`
  - `tmp/live-verification/2026-06-09/424-product-action-plan-live-bf8490b.png`

### Completed: Service Recommendation Catalog Depth Cap

Problem:

- The focused `Recommended service` page still rendered all catalog families as an optional appendix, recreating the long-page feeling inside a focused internal view.
- Mobile service-family rows could overflow horizontally when a long family description, family count chip, and expand affordance competed in one row.

Solution:

- Show the top four service families first and move the remaining families behind an explicit `Show more service families` action.
- Sort service families so selected or evidence-linked families appear before less relevant optional catalog depth.
- Rework the family accordion summary into a responsive grid so mobile rows stay inside the viewport.

Status:

- Implemented, committed, deployed, and live-verified at UI commit `bea3aa5`, Coolify frontend deployment `bzergef4zga10wrdiajvbxe3`.
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `npm --prefix frontend run build`
- Focused local and live verification passed with `tmp/live-verification/2026-06-09/product-internal-pages-review.js`.
- Live screenshots:
  - `tmp/live-verification/2026-06-09/420-product-services-recommend-live-bea3aa5.png`
  - `tmp/live-verification/2026-06-09/428-product-services-recommend-live-bea3aa5.png`
- Live scanner sanity for product `0a56637c-41b3-4b8b-9ecd-88eca3d7a237` confirmed after deploy:
  - Tool coverage: `10/10`
  - Completed tool coverage: `10/10`
  - `zap-baseline`: `COMPLETED`
  - Mapped ZAP findings: `10`
  - Open normalized findings remain available: `73`

### Completed: Workspace Command Focused Routing

Problem:

- Workspace Command still behaved like a broad hub after an owner chose a top-level action.
- Clicking `Team` or `Handoff` opened another switchboard first, which conflicted with the newer product-navigation rule: show the most important surface first, then let the owner go deeper with an explicit back route.
- The workspace page needed to keep the selected workspace context fixed while making the chosen internal view feel like a real page, not a same-screen tab swap.

Solution:

- Route top-level Workspace Command actions into focused internal views:
  - `Team` -> `?view=team&teamView=support` when support requests exist.
  - `Team` -> `?view=team&teamView=risks` when risk/dispute items exist.
  - `Team` -> `?view=team&teamView=participants` when the workspace has no support/risk items yet.
  - `Handoff` -> `?view=handoff&handoffView=review`.
- Preserve `Team hub`, `Handoff hub`, and `Workspace home` as explicit back destinations.
- Keep the selected workspace summary above the focused content so the owner always knows which workspace is active before acting.

Status:

- Implemented, committed, deployed, and live-verified at UI commit `b76e8be`, Coolify frontend deployment `sb39g5z5iovsfsbn9fq8yjaq`.
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `npm --prefix frontend run build`
- Focused local and live verification passed with `tmp/live-verification/2026-06-08/workspace-command-subview-navigation-review.js`.
- Live screenshots:
  - `tmp/live-verification/2026-06-08/318-workspace-team-focused-internal-route-live-b76e8be.png`
  - `tmp/live-verification/2026-06-08/319-workspace-team-return-hub-live-b76e8be.png`
  - `tmp/live-verification/2026-06-08/320-workspace-handoff-review-internal-route-live-b76e8be.png`
  - `tmp/live-verification/2026-06-08/321-workspace-handoff-return-hub-live-b76e8be.png`
  - `tmp/live-verification/2026-06-08/324-workspace-team-focused-internal-route-live-b76e8be.png`
  - `tmp/live-verification/2026-06-08/325-workspace-team-return-hub-live-b76e8be.png`
  - `tmp/live-verification/2026-06-08/326-workspace-handoff-review-internal-route-live-b76e8be.png`
  - `tmp/live-verification/2026-06-08/327-workspace-handoff-return-hub-live-b76e8be.png`

### Completed: AI Catalog Owner-Action Path

Problem:

- The service catalog AI page had already removed the confusing `AI Contracts` wording, but it still behaved like an explanatory capability list instead of an owner decision page.
- The AI catalog route did not have a strong next action for owners who want to start from an AI integration need.
- When the AI catalog CTA opened product setup, the setup page only said it started from the service catalog, losing the AI-specific journey context.

Solution:

- Split the AI catalog content into `ServiceCatalogAiOptionsPanel.tsx`.
- Replace passive AI capability chips with owner-readable option cards that show:
  - what the AI support does,
  - approved-context usage,
  - human-review guardrails,
  - stable non-truncating readiness badges.
- Add a clear CTA:
  - discovery mode -> `/products/new?step=setup&from=service-catalog&ai=1`
  - product-scoped mode -> `/owner/project-cart?step=readiness`
- Carry the AI route flag into Product Setup so the landing context says `AI integration path selected` and keeps the AI option chip visible next to existing selected services.

Status:

- Implemented and live-verified in batched UI commit `14e586e`, Coolify frontend deployment `m81n519suooosc1iqrdwpvmo`.
- The batch includes:
  - `b191123` (`Clarify AI catalog service path`)
  - `14e586e` (`Carry AI catalog context into product setup`)
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `npm --prefix frontend run build`
- Local and live verification passed with `tmp/live-verification/2026-06-08/service-path-language-live-review.js`.
- Live screenshots:
  - `tmp/live-verification/2026-06-08/374-landing-service-path-language-live-14e586e.png`
  - `tmp/live-verification/2026-06-08/375-choose-services-hub-language-live-14e586e.png`
  - `tmp/live-verification/2026-06-08/376-choose-services-ai-language-live-14e586e.png`
  - `tmp/live-verification/2026-06-08/377-ai-catalog-product-setup-continuity-live-14e586e.png`
  - `tmp/live-verification/2026-06-08/379-choose-services-ai-product-context-live-14e586e.png`
  - `tmp/live-verification/2026-06-08/380-mobile-choose-services-ai-language-live-14e586e.png`

### Completed: LoomAI-Owned Companion Dock

Problem:

- The product workspace had drifted back to a ProdUS-built fixed chat dock, so the LoomAI companion surface from the handover was no longer the primary chat UI.
- The user expected two LoomAI-owned surfaces:
  - full-width bottom companion dock,
  - Max Mode opened from that dock.

Solution:

- Updated `OwnerWorkspaceAiChatDock.tsx` so the product workspace renders `LoomAIMaxModeAssistant` with `companionDock`, `renderCard={false}`, and `showLauncher={false}`.
- Removed the custom fixed chat dock from the active render path for this workspace while keeping all browser calls backend-mediated through existing ProdUS assistant routes.
- Verified that the LoomAI widget shadow-root renders:
  - fixed full-width bottom dock,
  - `Ask me anything...` input,
  - `MAX` control,
  - expanded Max Mode surface with `Close MAX Mode` and AI suggestions.

Status:

- Implemented in code commit `d31014d` (`Enable LoomAI companion dock`).
- Deployed to Coolify frontend staging with deployment `aw0vf6khjmmvl3utb3vw6hna`.
- Deployed commit confirmed by Coolify: `d31014d02f2dd1f23302b4e7e6822b0d8a5b797b`.
- Local checks passed:
  - `npm --prefix frontend run build`
  - `npm --prefix frontend run type-check`
- Focused local and live verification passed with `tmp/live-verification/2026-06-11/910-loomai-companion-dock-local-review.js`.
- Live screenshots:
  - `tmp/live-verification/2026-06-11/910-local-loomai-companion-dock-live-d31014d.png`
  - `tmp/live-verification/2026-06-11/911-local-loomai-companion-dock-max-mode-live-d31014d.png`
  - `tmp/live-verification/2026-06-11/912-local-mobile-loomai-companion-dock-live-d31014d.png`
- Scanner sanity for product `0a56637c-41b3-4b8b-9ecd-88eca3d7a237` remained healthy:
  - 10 tool coverage rows completed.
  - 73 total findings, 73 open, 14 high, 28 medium, 1 low, 30 info.
  - Gitleaks, OSV, Semgrep, Trivy FS, Checkov, Syft, Grype, Trivy Image, Lighthouse, and ZAP Baseline all reported `COMPLETED`.
  - All normalized findings were mapped for tools with nonzero findings.

### Completed: Product Home Mobile Navigation Order

Problem:

- Product Home mobile showed product-area navigation before the owner reached the product decision surface.
- After adding the AI Opportunities hero hook, the first mobile viewport still risked feeling like a menu before a decision.
- Moving navigation too far down made it less discoverable because Product Home also contains lower utility shortcuts and evidence cards.

Solution:

- Kept internal product pages navigation-first, so focused spokes still have a clear way to switch/back.
- Moved Product Home navigation into the product hero after the core owner decision block:
  - product context,
  - AI Opportunities hook,
  - launch decision/status reason,
  - top risks,
  - then `More product areas`.
- Added an inline navigation variant so Product Home does not render a floating card inside the hero.

Status:

- Implemented in code commit `32d627e` (`Refine mobile product home navigation`).
- Deployed to Coolify frontend staging with deployment `spu850m3o09ixbqkobw4qwm5`.
- Deployed commit confirmed by Coolify: `32d627e05d862872e040f906a0560d5971eb3034`.
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run build`
  - `npm --prefix frontend run type-check`
- Focused local and live verification passed with `tmp/live-verification/2026-06-11/930-product-home-navigation-order-review.js`.
- Live screenshots:
  - `tmp/live-verification/2026-06-11/930-product-home-hero-before-navigation-live-32d627e.png`
  - `tmp/live-verification/2026-06-11/932-mobile-product-home-hero-before-navigation-live-32d627e.png`
  - `tmp/live-verification/2026-06-11/933-mobile-product-internal-navigation-before-header-live-32d627e.png`
- Ordering proof:
  - Product Home mobile hero starts before navigation: hero `y=983`, navigation `y=1708`.
  - Internal AI Opportunities mobile keeps navigation before internal header: navigation `y=385`, header `y=633`.
- Scanner sanity for product `0a56637c-41b3-4b8b-9ecd-88eca3d7a237` remained healthy:
  - 10/10 tool coverage rows completed.
  - 73 total findings, 73 open, 14 high, 28 medium, 1 low, 30 info.
  - ZAP Baseline reported `COMPLETED` with 10 normalized and 10 mapped findings.

### Local-Verified: Product Home Scanner Proof Hook

Problem:

- Product Home looked calmer after the redesign, but scan/scanner context was too hard to find.
- `Status reason` and `Top risks` already came from scanner/readiness evidence, yet the page did not clearly show how to reach scan details.
- Adding a full scanner dashboard back to Product Home would reintroduce the old density problem.

Solution:

- Kept `Status reason` as the owner-facing launch explanation.
- Kept `Top risks` as plain-language risk summary with source proof lines.
- Changed the secondary verdict action from `View findings` to `Go to scanners`.
- Routed that action to the temporary Findings hub route (`?tab=findings`) rather than a deeper technical proof subpage.
- Added a compact `Latest scan proof` strip below the decision/risk cards:
  - last scan time,
  - scanner coverage,
  - open findings,
  - mapped findings.
- Avoided a duplicate CTA in the proof strip; Product Home now has one clear scanner action.

Status:

- Implemented locally in:
  - `frontend/src/features/platform/OwnerWorkspaceScannerProofAction.tsx`
  - `frontend/src/features/platform/OwnerWorkspaceProductHero.tsx`
  - `frontend/src/features/platform/OwnerProductizationWorkspace.tsx`
  - `frontend/src/features/platform/OwnerProductizationWorkspaceHeader.tsx`
  - `frontend/src/features/platform/ownerWorkspaceViewModel.ts`
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `npm --prefix frontend run build`
- Focused local verification passed with `tmp/live-verification/2026-06-11/940-product-home-scanner-proof-review.js`.
- Local screenshots:
  - `tmp/live-verification/2026-06-11/940-product-home-scanner-proof-local-scanner-proof-v3.png`
  - `tmp/live-verification/2026-06-11/941-product-home-go-to-scanners-route-local-scanner-proof-v3.png`
  - `tmp/live-verification/2026-06-11/942-mobile-product-home-scanner-proof-local-scanner-proof-v3.png`

Deferred live verification:

- Verify after the next combined deploy.
- Confirm Product Home shows one `Go to scanners` action.
- Confirm `Go to scanners` lands on `?tab=findings` without `view=technical` or `proof=`.
- Confirm the proof strip uses live staging scanner data for the selected product.

### Local-Verified: Product Workspace Navigation Language Cleanup

Problem:

- The selected product page repeated a switch-product action even though product switching belongs on Home.
- The left menu label `Home / switch product` was too long and made the global switcher feel like a product-specific action.
- The selected product landing item still said `Product Home`, while the intended model is product-specific `Workspace`.

Solution:

- Removed the `Switch product on Home` button from the selected product bar inside the product workspace.
- Renamed the left menu global switcher item to `Home`.
- Renamed the selected product landing item to `Workspace`.
- Renamed the overview product-area navigation and breadcrumb label to `Workspace`.
- Made the selected-product menu available from the main nav whenever a product is globally selected, not only from product-context routes.
- Updated remaining owner-facing navigation copy from `Product Home` to `Workspace` where it guided owners between product-specific pages.
- Kept the routes unchanged; this is a language/navigation clarity cleanup only.

Status:

- Implemented locally in:
  - `frontend/src/features/platform/OwnerWorkspaceSelectedProductBar.tsx`
  - `frontend/src/layout/MainLayout/MenuList/index.tsx`
  - `frontend/src/features/platform/ownerWorkspaceModel.ts`
  - `frontend/src/features/platform/OwnerWorkspaceNavigationPanel.tsx`
  - supporting owner-facing copy files for product portfolio and planning routes.
- Local checks passed:
  - `rg "Home / switch product|Switch product on Home|Product Home" frontend/src/features/platform frontend/src/layout/MainLayout -S` returned no matches.
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `npm --prefix frontend run build`
- No screenshots were created for this copy-only cleanup.

Deferred live verification:

- Verify after the next combined deploy.
- Confirm side menu shows `Home` and `Workspace`.
- Confirm the selected-product `Workspace` item remains visible from Dashboard/Home when a product is globally selected.
- Confirm product workspace selected-product bar shows context only, with no switch-product button.

### Local-Verified: Scanners Journey Redefinition

Problem:

- The previous `Findings` page mixed owner risks, stored proof, and technical proof without a clear founder journey.
- Product Home now says `Go to scanners`, but the destination still felt like a generic findings area.
- Scanner-related information was scattered across `Owner risks`, `Stored proof`, and `Technical proof`.

Solution:

- Renamed the selected product area from `Findings` to `Scanners`.
- Changed `?tab=findings` to land on a Scanners hub instead of opening a subpage immediately.
- Added a `Latest scan result` overview that answers:
  - scan readiness,
  - scanner coverage,
  - open risks,
  - linked proof.
- Preserved existing information by mapping it into clearer journeys:
  - existing owner risk groups -> `Risks to fix`,
  - existing evidence/sources/repo readout -> `Proof library`,
  - existing technical proof/run/result/fix/stored controls -> `Run scanners` / `Scanner tools`.
- Renamed the nested technical proof choices:
  - `Run Proof` -> `Run scanners`,
  - `Review Result` -> `Scan result`,
  - `Stored Proof` -> `Saved proof`.
- Cleaned up the internal scanner/proof tools so Proof Library, Run scanners, source connection, CI upload, scan scheduling, recent runs, and repo readout use startup-owner language first:
  - `Evidence and Stored Proof` -> `Proof library`,
  - `Proof Operations` -> `Scanner setup and runs`,
  - `Run governed scan` -> `Run scanner check`,
  - `Evidence source` -> `Source to check`,
  - `Artifact payload` -> `Proof file content`,
  - `Repo Readout` -> `Product source readout`.
- Added a small presentation layer so backend scanner labels stay precise in data but display as owner language:
  - `Unmapped scanner signal` -> `Needs service review`,
  - generic scanner classification copy -> a short owner-review explanation,
  - `AI Fix Path Summary` -> `Fix path assistant`.
- Kept the underlying route key as `findings` for compatibility; this is a UI language and journey restructure, not a backend contract change.

Status:

- Implemented locally in:
  - `frontend/src/features/platform/OwnerWorkspaceScannersOverview.tsx`
  - `frontend/src/features/platform/OwnerWorkspaceFindingsArea.tsx`
  - `frontend/src/features/platform/OwnerTechnicalProofJourneyPanel.tsx`
  - `frontend/src/features/platform/OwnerFindingsEvidencePanel.tsx`
  - `frontend/src/features/platform/OwnerScannerEvidenceCenterPanel.tsx`
  - `frontend/src/features/platform/OwnerScannerProofOperationsPanel.tsx`
  - `frontend/src/features/platform/RepoReadoutPanel.tsx`
  - `frontend/src/features/platform/ScannerProofRunway.tsx`
  - `frontend/src/features/platform/ScannerProofRunPanel.tsx`
  - `frontend/src/features/platform/ScannerProofAttachPanel.tsx`
  - `frontend/src/features/platform/ScannerProofAutomationPanel.tsx`
  - `frontend/src/features/platform/ScannerCoverageGrid.tsx`
  - `frontend/src/features/platform/ScannerFixPathPanel.tsx`
  - `frontend/src/features/platform/ScannerProofFindingCard.tsx`
  - `frontend/src/features/platform/ownerFindingPresentation.ts`
  - `frontend/src/features/platform/ownerWorkspaceJourneyConfig.tsx`
  - `frontend/src/features/platform/ownerWorkspaceModel.ts`
  - `frontend/src/layout/MainLayout/MenuList/index.tsx`
  - supporting owner-facing copy files.
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `npm --prefix frontend run build`
- Focused local screenshot verification passed with `tmp/live-verification/2026-06-11/950-scanners-page-redefinition-review.js`.
- Latest screenshots kept:
  - `tmp/live-verification/2026-06-11/950-scanners-overview-local-scanners-language-v6.png`
  - `tmp/live-verification/2026-06-11/951-scanners-risks-to-fix-local-scanners-language-v6.png`
  - `tmp/live-verification/2026-06-11/952-scanners-run-tools-local-scanners-language-v6.png`
  - `tmp/live-verification/2026-06-11/953-scanners-scan-result-local-scanners-language-v6.png`
  - `tmp/live-verification/2026-06-11/954-scanners-fix-path-local-scanners-language-v6.png`
  - `tmp/live-verification/2026-06-11/955-scanners-proof-library-local-scanners-language-v6.png`
  - `tmp/live-verification/2026-06-11/956-mobile-scanners-overview-local-scanners-language-v6.png`
- Follow-up adjustment:
  - Removed the generic journey cards from the Scanners hub after screenshot review showed duplicate `Risks to fix`, `Proof library`, and `Run scanners` choices.
  - Kept the lower Scanners overview cards as the single hub decision surface.
  - Shortened the Run scanners completion badge from `10/10 checks` to `10/10` after screenshot review showed truncation.
  - Expanded the screenshot verifier to include nested `Scan result` and `Fix Path` pages.
  - Added bottom safe-area padding to the product workspace so lower content can scroll clear of the fixed LoomAI companion dock.
  - Remaining visual note: the LoomAI-owned fixed dock still appears over the middle of Playwright full-page screenshots because fixed elements are captured at the viewport position. Review dock behavior separately if it feels too dominant in real use.

Deferred live verification:

- Verify after the next combined deploy.
- Confirm Product Home `Go to scanners` lands on the Scanners hub.
- Confirm main nav shows `Scanners` for the selected product.
- Confirm `Risks to fix`, `Proof library`, and `Run scanners` all preserve the previous risk/evidence/technical proof content.

### Local-Verified: Workspace Proof Language Redefinition

Problem:

- The workspace `Fixes And Proof` view still mixed owner language with internal wording such as `Ship Confidence`, `AI Fix Path Explainer`, `CI scanner evidence`, `Normalize Workspace Evidence`, `milestones`, `deliverables`, and `evidence`.
- The route was functionally useful, but the page could still feel like a scanner/admin workspace instead of a founder decision flow.

Solution:

- Kept the same routes, data, and backend contracts, but changed visible language to match the owner journey:
  - `Ship Confidence` -> `Launch confidence`,
  - `Workspace Launch Report` -> `Workspace launch snapshot`,
  - `AI Fix Path Explainer` -> `Workspace fix path assistant`,
  - `Scanner Fix Path` -> `Workspace fix path`,
  - `mapped` -> `linked to services`,
  - `unmapped` -> `need review`,
  - `Workspace Evidence` -> `Workspace proof`,
  - `CI scanner evidence` -> `Upload scan proof`,
  - `Normalize Workspace Evidence` -> `Save scan proof`,
  - `Milestones` -> `Workspace steps`,
  - `Deliverables` -> `Outputs`,
  - `Acceptance And Evidence Review` -> `Acceptance checklist`.
- Updated workspace navigation labels so the internal route reads as a workspace room:
  - `Delivery Answer` -> `Workspace answer`,
  - `Fixes And Proof` -> `Fixes and proof`,
  - `Team And Risks` -> `Team and risks`,
  - back action -> `Back to workspace`.
- Adjusted the LoomAI prompt copy for the workspace fix-path assistant to ask for launch risks, missing proof, service recommendations, and the safe next owner decision without mutating state.

Status:

- Implemented locally in:
  - `frontend/src/features/platform/WorkspaceProofReadinessPanel.tsx`
  - `frontend/src/features/platform/WorkspaceScannerFixPathPanel.tsx`
  - `frontend/src/features/platform/WorkspaceProofEvidencePanel.tsx`
  - `frontend/src/features/platform/WorkspaceProofMilestonesPanel.tsx`
  - `frontend/src/features/platform/WorkspaceAcceptanceReviewPanel.tsx`
  - `frontend/src/features/platform/WorkspaceEvidenceAttachmentPanel.tsx`
  - `frontend/src/features/platform/WorkspaceOverviewDeliveryAnswerPanel.tsx`
  - `frontend/src/features/platform/WorkspaceCommandJourneyNav.tsx`
  - `frontend/src/features/platform/WorkspaceCommandSelectedWorkspacePane.tsx`
  - shared panels `ShipConfidencePanel.tsx` and `LaunchReadinessReportPanel.tsx`.
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `npm --prefix frontend run build`

Deferred screenshot/live verification:

- Capture local screenshots for `/workspaces` overview and selected workspace `Fixes and proof` view in the next combined screenshot batch.
- Confirm the shared `Launch confidence` and `Launch snapshot` wording still works on the product overview progress view.
- Confirm no workspace proof information was hidden: launch confidence, snapshot, fix path, workspace steps, outputs, saved proof files, scan proof upload, and acceptance checklist should remain reachable.

### Local-Verified: Service Plan Language Polish

Problem:

- The service-plan surfaces were already split into internal pages, but some labels still exposed internal package/library language:
  - `Generated plan library`,
  - `Open a Generated Plan`,
  - `Package Templates`,
  - `AI Package Recommendation`,
  - `Plan Summary`, `Milestones`, `Team Match`,
  - `Owner Decision`,
  - `evidence gates`.

Solution:

- Kept API/type names unchanged, and tuned only visible owner copy:
  - `Generated plan library` -> `Service plans`,
  - `Open a Generated Plan` -> `Open a service plan`,
  - `Package Templates` -> `Plan templates`,
  - `AI Package Recommendation` -> `AI service plan review`,
  - `Plan Summary` -> `Plan summary`,
  - `Milestones` -> `Steps`,
  - `Team Match` -> `Team fit`,
  - `Owner Decision` -> `Plan decision`,
  - `Create From Brief` -> `Create from product brief`,
  - `Needs Attention` -> `Needs attention`,
  - `evidence gates` -> `proof gates`.
- Also aligned the service plan detail empty states and page labels:
  - `Selected Services` -> `Selected services`,
  - `Milestone Path` -> `Plan steps`,
  - `Matched Teams` -> `Team fit`,
  - `No service modules...` -> `No services...`.

Status:

- Implemented locally in:
  - `frontend/src/features/platform/ServicePlanLibraryPanel.tsx`
  - `frontend/src/features/platform/ServicePlanBuilderPanels.tsx`
  - `frontend/src/features/platform/ServicePlanBuilderServicesPanel.tsx`
  - `frontend/src/features/platform/ServicePlanBuilderSummaryPanel.tsx`
  - `frontend/src/features/platform/OwnerServicePlanDetailPanel.tsx`
  - `frontend/src/features/platform/ProjectStartPackageTemplatesPanel.tsx`
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `npm --prefix frontend run build`

Deferred screenshot/live verification:

- Capture `/packages` and selected service-plan screenshots in the next combined screenshot batch.
- Confirm `Planning` still routes to the Product Plan page and service-plan language stays distinct from Product Plan language.

### Local-Verified: Product Onboarding Language Cleanup

Problem:

- First-run onboarding still had a few visible `Project` references even though the product language direction is now `Product`, `Planning`, and `Workspace`.

Solution:

- Updated owner-visible onboarding copy:
  - `Project understanding` -> `Product understanding`,
  - `Project documents` -> `Product documents`,
  - repository placeholder `github.com/you/project` -> `github.com/you/product`,
  - document-access warning now says `creating this product` instead of `creating this project`.
- Left internal identifiers and API fields unchanged where they are compatibility names, not visible UX copy.

Status:

- Implemented locally in:
  - `frontend/src/features/platform/ProductOnboardingAiReviewContent.tsx`
  - `frontend/src/features/platform/ProductIntakeFrontDoor.tsx`
  - `frontend/src/features/platform/ProductOnboardingAnalysisActionPanel.tsx`
  - `frontend/src/features/platform/ProductOnboardingAnalysisContextEditor.tsx`
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `npm --prefix frontend run build`

Deferred screenshot/live verification:

- Capture product onboarding/front-door screenshots in the next combined screenshot batch.

### Local-Verified: Risk Review And Proof Wording

Problem:

- Risk review and product overview surfaces still mixed the newer `Proof` language with older `Evidence` and `Finding` wording.
- This made the Scanners journey feel less coherent after the page was renamed from Findings to Scanners.

Solution:

- Updated visible owner copy:
  - `Finding review` -> `Risk review`,
  - `Linked Evidence` -> `Linked proof`,
  - `Open Evidence` -> `Open proof`,
  - `Evidence-backed` -> `Proof-backed`,
  - `Evidence checks` -> `Proof checks`,
  - `Evidence:` labels -> `Proof:`,
  - `AI Finding Review` -> `AI risk review`,
  - `Ask AI About This Diagnosis` -> `Diagnosis assistant`,
  - `Owner Control Panel` -> `Owner controls`,
  - `AI Milestone Evidence` -> `AI milestone proof`.
- Updated the risk-review LoomAI prompt to talk about scan risks, required proof, linked proof count, and workspace steps instead of scanner findings and evidence.
- Changed the launch verdict CTA from `View technical proof` to `Go to scanners`.

Status:

- Implemented locally in:
  - `frontend/src/features/platform/OwnerFindingReviewDrawer.tsx`
  - `frontend/src/features/platform/OwnerFindingReviewDecisionPanels.tsx`
  - `frontend/src/features/platform/OwnerFindingReviewSummaryPanels.tsx`
  - `frontend/src/features/platform/OwnerFindingReviewDrawerHost.tsx`
  - `frontend/src/features/platform/OwnerProductDiagnosisSummaryView.tsx`
  - `frontend/src/features/platform/OwnerOverviewLaunchDecisionCard.tsx`
  - `frontend/src/features/platform/OwnerOverviewRiskActionCards.tsx`
  - `frontend/src/features/platform/OwnerOverviewProofServiceCards.tsx`
  - `frontend/src/features/platform/OwnerActionPlanPanel.tsx`
  - `frontend/src/features/platform/OwnerAiBriefPanel.tsx`
  - `frontend/src/features/platform/OwnerJourneyCards.tsx`
  - `frontend/src/features/platform/OwnerWorkspaceProductHero.tsx`
  - `frontend/src/features/platform/OwnerDeliveryWorkspacePanel.tsx`
  - `frontend/src/features/platform/WorkspaceHandoffAssistantPanel.tsx`
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `npm --prefix frontend run build`

Deferred screenshot/live verification:

- Capture Product Workspace overview, Action Plan, Scanners risk drawer, and diagnosis summary screenshots in the next combined screenshot batch.

### Local-Verified: AI Opportunities Language Polish

Problem:

- The AI Opportunities home was improved structurally, but some labels still felt scanner/admin-oriented:
  - `scanner focus`,
  - `technical checks`,
  - `implementation path`,
  - `implementation steps`.

Solution:

- Kept stored field names unchanged and updated only owner-visible copy:
  - `scanner focus` -> `checks to watch`,
  - `technical checks` -> `launch checks`,
  - `implementation path` -> `starting path`,
  - `implementation steps` -> `starting steps`,
  - `AI integration ideas` -> `AI product ideas`.
- Updated the AI Opportunities home/detail metrics and accepted-result success message to use `checks` / `checks to watch`.

Status:

- Implemented locally in:
  - `frontend/src/features/platform/OwnerProductAiOpportunityHome.tsx`
  - `frontend/src/features/platform/OwnerProductAiOpportunityDetailsView.tsx`
  - `frontend/src/features/platform/OwnerProductAiOpportunityLoomAiFit.tsx`
  - `frontend/src/features/platform/OwnerProductAiOpportunitySelectionSections.tsx`
  - `frontend/src/features/platform/OwnerProductAiOpportunityRefreshView.tsx`
  - `frontend/src/features/platform/OwnerProductAiOpportunityResult.tsx`
  - `frontend/src/features/platform/ProductAiOpportunitiesReviewSection.tsx`
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `npm --prefix frontend run build`

Deferred screenshot/live verification:

- Capture AI Opportunities home, details, refresh setup, and review-result screens in the next combined screenshot batch.

### Local-Verified: Onboarding And AI Result Owner Language

Problem:

- Product creation and AI review screens still had leftover internal wording:
  - `catalog-backed service modules`,
  - `implementation path`,
  - `implementation steps`,
  - `scanner focus`,
  - `document evidence`,
  - `Product Plan`,
  - `AI integration path`.
- That language made creation/review feel like an admin configuration flow instead of a startup owner confirming a product and choosing what to save.

Solution:

- Updated visible owner copy while leaving field names/data contracts unchanged:
  - `catalog-backed service modules` -> `matching services`,
  - `implementation path` -> `starting path`,
  - `implementation steps` -> `starting steps`,
  - `scanner focus` -> `launch checks to watch`,
  - `document evidence` -> `file/document proof`,
  - `Product Plan` entry points in the creation flow -> `Planning`,
  - `AI integration path` -> `AI opportunities path` / `LoomAI starting path`.
- Changed product creation review labels to calmer owner language:
  - `Product Context` -> `Product profile`,
  - `Known Risks` -> `Known rough edges`,
  - `Selected Service Path` -> `Selected services`.
- Clarified service suggestion proof by adding a plain label: `Why this service was suggested`.

Status:

- Implemented locally in:
  - `frontend/src/features/platform/ProductOnboardingServiceReviewPanels.tsx`
  - `frontend/src/features/platform/ProductProofNextStepsReviewSection.tsx`
  - `frontend/src/features/platform/ProductOnboardingDocumentUsageList.tsx`
  - `frontend/src/features/platform/ProductOnboardingAnalysisActionPanel.tsx`
  - `frontend/src/features/platform/ProductUnderstandingReviewSection.tsx`
  - `frontend/src/features/platform/ProductOnboardingJourneyShell.tsx`
  - `frontend/src/features/platform/ProductCreationReviewPanel.tsx`
  - `frontend/src/features/platform/AiOpportunityDiscoveryPanel.tsx`
  - `frontend/src/features/platform/OwnerProductAiOpportunityHome.tsx`
  - `frontend/src/features/platform/OwnerProductAiOpportunityResult.tsx`
  - `frontend/src/features/platform/OwnerProductAiOpportunityResultSummary.tsx`
  - `frontend/src/features/platform/OwnerProductAiOpportunitySelectionSections.tsx`
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `npm --prefix frontend run build`

Deferred screenshot/live verification:

- Capture product creation setup/review, AI understanding review, and AI Opportunities result screens in the next combined screenshot batch.

### Local-Verified: Planning Naming Alignment

Problem:

- The main navigation now uses `Planning`, but several owner-facing surfaces still said `Product Plan`.
- This made the same concept appear under multiple names across Home, Planning, service-plan start, and workspace/service bridges.

Solution:

- Updated visible owner copy so the shared concept is consistently `Planning`.
- Kept internal routes, component names, and compatibility title normalization unchanged.
- Updated related owner language:
  - `Approve Product Plan` -> `Approve Planning`,
  - `Review Product Plan` -> `Review Planning`,
  - `Use Product Plan` -> `Use Planning`,
  - `Open full Product Plan` -> `Open Planning`,
  - `Current product plan` -> `Current planning`,
  - `product plan` references in Home/Planning/support copy -> `Planning`,
  - `service plan modules and milestones` -> `service plan steps`.

Status:

- Implemented locally in:
  - `frontend/src/features/platform/ProjectStartPlanPage.tsx`
  - `frontend/src/features/platform/ProjectStartPlanHeroCard.tsx`
  - `frontend/src/features/platform/ProjectStartPlanMetricStrip.tsx`
  - `frontend/src/features/platform/ProjectStartPlanContextPanel.tsx`
  - `frontend/src/features/platform/ProjectStartJourneyNavigation.tsx`
  - `frontend/src/features/platform/ProjectStartLifecycleServicesPanel.tsx`
  - `frontend/src/features/platform/ProjectStartReadinessPanel.tsx`
  - `frontend/src/features/platform/ProjectStartApprovalPanel.tsx`
  - `frontend/src/features/platform/projectStartPlanModel.tsx`
  - `frontend/src/features/platform/OwnerProjectStartPanel.tsx`
  - `frontend/src/features/platform/OwnerProjectStartSummaryCard.tsx`
  - `frontend/src/features/platform/OwnerProjectStartApprovalControls.tsx`
  - `frontend/src/features/platform/OwnerProjectStartServicesPanel.tsx`
  - `frontend/src/features/platform/OwnerServicePlanEmptyBridge.tsx`
  - `frontend/src/features/platform/OwnerServicePlanSequencePreview.tsx`
  - `frontend/src/features/platform/ServicePlanStartPage.tsx`
  - `frontend/src/features/platform/ProductizationLaunchpad.tsx`
  - `frontend/src/features/platform/ProductizationLaunchpadSummaryPanels.tsx`
  - `frontend/src/features/platform/ProductizationLaunchpadFocusPanels.tsx`
  - `frontend/src/features/platform/ProductizationLaunchpadDetailPanels.tsx`
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run build`
  - `npm --prefix frontend run type-check`
- Note: one parallel `type-check` attempt failed while `next build` was rewriting `.next/types`; rerunning type-check alone passed.

Deferred screenshot/live verification:

- Capture Home, Planning hub, Planning readiness/services/approve internal pages, and Service Plan start bridge in the next combined screenshot batch.

### Local-Verified: Planning Naming Across Service And Talent Entry Points

Problem:

- After the owner navigation moved to `Planning`, public/service/team entry points still used `Product Plan` or `product plan`.
- Some labels also said `in plan`, `attach to plan`, or `catalog-backed service module`, which felt less clear for a startup/product owner.

Solution:

- Updated public and service entry points to consistently route the owner toward `Planning`.
- Reworded rough mechanical phrases after the naming pass:
  - `In Product Plan` -> `In Planning`,
  - `Attach team/expert to plan` -> `Attach team/expert to Planning`,
  - `Template in plan` -> `Template in Planning`,
  - `selected Planning` -> `current planning scope`,
  - `the Planning` / `a Planning` -> `Planning` or `planning scope`,
  - `catalog-backed service module` -> `matching service`.
- Kept compatibility title normalization in `projectStartPlanModel.tsx` so old saved titles containing `product plan` still display as `Planning`.

Status:

- Implemented locally across service, catalog, team, public profile, package, onboarding, and workspace helper surfaces, including:
  - `frontend/src/features/platform/CatalogPage.tsx`
  - `frontend/src/features/platform/ServiceCatalogPanels.tsx`
  - `frontend/src/features/platform/ServiceCatalogTemplatePanel.tsx`
  - `frontend/src/features/platform/ServiceCatalogWorkstreamsPanel.tsx`
  - `frontend/src/features/platform/ServiceCatalogAiOptionsPanel.tsx`
  - `frontend/src/features/platform/PublicTeamProfilePanel.tsx`
  - `frontend/src/features/platform/PublicExpertProfilePanel.tsx`
  - `frontend/src/features/platform/PublicTalentCards.tsx`
  - `frontend/src/features/platform/PublicTalentPanels.tsx`
  - `frontend/src/features/platform/PublicTalentDirectoryPage.tsx`
  - `frontend/src/features/platform/PublicProfileConversionPanel.tsx`
  - `frontend/src/features/platform/OwnerTeamMatchPanel.tsx`
  - `frontend/src/features/platform/OwnerTeamMatchDecisionPanels.tsx`
  - `frontend/src/features/platform/OwnerTeamRecommendationsPanel.tsx`
  - `frontend/src/features/platform/OwnerServiceDecisionBridgePanel.tsx`
  - `frontend/src/features/platform/OwnerServiceBriefIntakePanel.tsx`
  - `frontend/src/features/platform/OwnerServicePlanSummaryCard.tsx`
  - `frontend/src/features/platform/PackagesPage.tsx`
  - `frontend/src/features/platform/TeamMatchPlanPickerPanel.tsx`
  - `frontend/src/features/platform/ProductServicePathReviewSection.tsx`
  - `frontend/src/features/platform/productOnboardingAnalysisResultModel.ts`
  - `frontend/src/features/platform/useProjectStartPlanActions.ts`
  - `frontend/src/features/platform/useOwnerWorkspaceProductActions.ts`
  - `frontend/src/features/platform/ownerWorkspaceAssistantActions.ts`
- Local checks passed:
  - `git diff --check`
  - `npm --prefix frontend run type-check`
  - `npm --prefix frontend run build`

Deferred screenshot/live verification:

- Capture Services catalog template/workstream/AI paths, public team/expert cards, team profile, expert profile, Team Match, Service Plans, and Packages after the next grouped local screenshot pass.

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
