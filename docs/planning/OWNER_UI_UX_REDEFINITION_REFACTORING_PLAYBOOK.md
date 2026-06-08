# Owner UI/UX Redefinition And Refactoring Playbook

Date: 2026-06-08

Purpose:

This document describes the method used during the ProdUS owner-productization UI/UX redefinition pass so the next LLM session can continue the same way. It is not a feature spec. It is a working playbook for choosing the next target, improving the user journey, splitting code safely, verifying locally, deploying in batches, and documenting live proof.

## North Star

ProdUS should feel like a productization partner for MVP, prototype, and startup owners. It should not feel like a scanner dashboard, admin console, shopping cart, or generic service marketplace.

Every owner-facing view should answer one practical question:

- Can I launch, beta, demo, or should I stop?
- What must be fixed before users see this?
- What proof supports that claim?
- Which ProdUS service moves this forward?
- Who can deliver the work?
- What has already moved into delivery?

Raw scanner names, evidence artifacts, AI internals, and operator controls must remain available, but they should not lead the owner journey.

## How To Pick The Next Target

Start each continuation by reading the current request and the latest work state:

1. Run `git status --short`.
2. Do not touch unrelated dirty or untracked files.
3. Find large active files with `find frontend/src/features/platform -name '*.tsx' -maxdepth 1 -print0 | xargs -0 wc -l | sort -nr | head`.
4. Prefer owner-facing journey files before admin/internal-only files.
5. Prefer the route or panel the user has open if it is still relevant.
6. Pick a slice that improves the journey and splits code at the same time.

Good targets usually have one of these symptoms:

- A long page contains multiple jobs that should be separate spokes.
- A route owns queries, mutations, derived model state, and JSX all together.
- The first viewport does not answer the owner decision.
- Mobile shows dense grids, clipped chips, or long scroll before the primary action.
- Tool names or raw findings appear before plain-language business risk.
- A service/catalog/team page feels like browsing inventory instead of choosing the next launch-hardening step.
- Copy says `Add`, `cart`, or `start project` where the owner action is really `Choose`, `Approve`, `Start Plan`, or `Workspace`.

Avoid picking targets only because they are large. The split should make the next owner decision easier to see.

## UX Redefinition Rules

Use these rules consistently:

- One canonical readiness or launch number. Subscores must be visibly subordinate.
- Lead with blockers versus improvements. `Not ready - 2 blockers first` is better than `7 areas to review`.
- Plain language before scanner/tool names. Example: `Web security baseline` can support a claim, but it should not be the headline.
- Put proof near the claim. Each risk or recommendation should show its source line close by.
- Tie the top action to the top service. The recommended service should feel like the way to resolve the blocker, not a separate sales card.
- Use hub/spoke navigation instead of long all-in-one pages.
- Make the first mobile viewport useful. A founder should see the decision or next action without scrolling through dense setup.
- Keep advanced technical proof available, but behind focused steps such as `Run Proof`, `Review Result`, `Fix Path`, and `Stored Proof`.
- Prefer `Project Start Plan`, `Choose services`, `Choose teams`, `Approve Plan`, and `Start Workspace` language over cart or shopping language.
- Use semantic color only for status: blocker, attention, clear, neutral. Do not use color as decoration.
- Reduce chip soup. Chips are for short statuses and counts; long proof/context text should wrap as normal text.
- Avoid cards inside cards. Use cards for individual repeated items or framed tools, not every page section.

## Code Splitting Pattern

When touching a journey slice, split code along stable responsibilities.

Recommended structure:

- Route page: data wiring and high-level composition only.
- Data hook: queries and sorted/filtered API data.
- Action hook: mutations, invalidations, success notices, and handler helpers.
- Model file: pure derived state, scoring, labels, journey item builders.
- Board/shell component: lays out the current journey region.
- Panel/card components: one focused owner decision per component.
- Utility file: formatting or presentation helpers shared by the slice.

Recent examples:

- `ProjectStartPlanPage.tsx` delegates to `useProjectStartPlanData`, `useProjectStartPlanActions`, and `projectStartPlanModel`.
- `ProjectStartPlanOverview.tsx` composes `ProjectStartPlanHeroCard` and `ProjectStartPlanMetricStrip`.
- `OwnerServicePlanDetailPanel.tsx` composes `OwnerServicePlanSummaryCard`, `OwnerServicePlanSequencePreview`, and `OwnerServicePlanEmptyBridge`.
- `OwnerTeamMatchPanel.tsx` composes `OwnerTeamRecommendationCard` and `OwnerTeamFallbackPicker`.
- `ScannerProofFindingDecisionList.tsx` composes `ScannerProofFindingCard` and only expands the active finding.

Keep route files boring. A good route file reads like a wiring diagram, not a page implementation.

## Refactoring Constraints

Preserve behavior unless the UX change explicitly requires a behavior change.

- Keep API contracts unchanged unless the task demands backend work.
- Keep URL compatibility routes such as `/owner/project-cart` even when visible copy says `Project Start Plan`.
- Keep existing query keys unless changing them is required.
- Keep mutation side effects and invalidations intact.
- Do not rename backend fields to satisfy UI language; adapt copy at the UI boundary.
- Do not move unrelated code while splitting a slice.
- Do not revert unrelated dirty files.
- Use `apply_patch` for edits.
- Use exact optional prop types carefully. If a prop is passed explicitly as `undefined`, type it as `value: T | undefined` instead of `value?: T`.

## Verification Workflow

Run local checks before deployment:

```bash
git diff --check
npm --prefix frontend run type-check
NEXT_SKIP_BUILD_TYPECHECK=true npm --prefix frontend run build
```

Use focused Playwright scripts for the touched slice:

- Put scripts under `tmp/live-verification/YYYY-MM-DD/`.
- Name screenshots with the next sequence number and the slice name.
- Use `PRODUS_FRONTEND_URL` so the same script works locally and live.
- Use `PRODUS_SCREENSHOT_SUFFIX` for local/live commit suffixes.
- Assert important copy and absence of old copy.
- Assert no horizontal overflow on desktop and mobile.
- Capture desktop and mobile whenever the slice is owner-facing.

Important local note:

After running a production build, the Next dev server can enter a stale client-manifest state. If Playwright starts seeing 500s or missing headings after a successful build, restart the local dev server and rerun verification.

## Live Verification Workflow

Batch useful work before deploying because Coolify deployment consumes time.

Deployment discipline:

1. Commit and push UI changes.
2. Trigger the Coolify frontend app deployment.
3. Poll until the deployment finishes.
4. Confirm the deployed commit matches the pushed UI commit.
5. Run the focused verifier against `https://produs-staging.46.224.145.148.sslip.io`.
6. Inspect key screenshots visually, especially mobile.
7. Run scanner coverage sanity after owner-workspace related changes.
8. Update the completion document with commit, deployment id, screenshots, and scanner sanity.
9. Commit and push documentation separately. Do not redeploy just for docs.

Do not put private tokens in repository docs. Use the existing private handoff material locally when triggering Coolify, and never print secrets in terminal output or markdown.

Scanner sanity endpoint:

```text
GET /scanner/products/{productId}/summary
```

For the ProdUS repo/readme fixture, verify:

- Latest tools: `10/10`
- Completed tools: `10/10`
- `zap-baseline` latest status: `COMPLETED`
- Mapped findings remain nonzero and preserved

Current primary fixture:

```text
0a56637c-41b3-4b8b-9ecd-88eca3d7a237
```

## Screenshot Review Checklist

Before calling a slice done, inspect screenshots for:

- Is the owner decision visible in the first viewport?
- Is the primary action obvious?
- Is mobile readable without side-scrolling?
- Are headings sized for their container?
- Are long IDs, URLs, scanner rule IDs, or proof lines wrapping safely?
- Are buttons using verbs that match the journey?
- Did any old `Add` / `cart` / `Unknown` / scanner-first language come back?
- Is the right rail helpful, or is it pushing the main decision into a long page?
- Are secondary controls visually subordinate?

## Common Pitfalls

- Fuzzy Playwright role names can match both `Choose service` and `Choose services`. Use `exact: true` when needed.
- Grid children often need `minWidth: 0` and sometimes `gridTemplateColumns: minmax(0, 1fr)` to prevent mobile overflow.
- Shared card surfaces should be `boxSizing: border-box`, `minWidth: 0`, and `maxWidth: 100%`.
- Long chip labels cause clipping. Convert long context to wrapped text.
- If a fixture has no generated package, the Service Plan spoke should still show an owner bridge to the Project Start Plan.
- If a route is already visually redefined, the next valuable split may be data/action/model extraction rather than another visible redesign.
- Local browser calls to staging APIs may need the Playwright API proxy pattern because of CORS.

## Documentation Pattern

After live verification, update `docs/planning/OWNER_PRODUCTIZATION_COMPLETION_PASS.md` with:

- Problem
- Solution
- Status
- UI commit
- Coolify deployment id
- Local checks
- Local screenshot paths
- Live screenshot paths
- Scanner sanity result when relevant

Keep that document as the audit log. Keep this playbook as the method guide.

## Next Session Starter Checklist

Use this quick loop:

1. Read the newest user instruction.
2. Check `git status --short`.
3. Read this playbook and the latest bottom section of `OWNER_PRODUCTIZATION_COMPLETION_PASS.md`.
4. List large owner-facing files.
5. Pick one journey slice.
6. State the slice in a short update.
7. Split behavior by route/data/action/model/panel boundaries.
8. Fix visible owner copy while touching the slice.
9. Run type-check, build, diff check.
10. Run focused local screenshots.
11. Batch another small related slice if it reduces deployment churn.
12. Commit, push, deploy, live-verify, scanner sanity, document.

The goal is not to make files small in isolation. The goal is to make each owner step feel obvious, credible, and ready for a startup owner to act on.
