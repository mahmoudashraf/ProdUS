# Owner Productization Workspace MVP Redesign

Date: 2026-06-06

Reference screenshot:

- `tmp/live-verification/2026-06-06/05-produs-repo-readme-suite.png`

Companion journey document:

- `docs/planning/OWNER_JOURNEY_UI_UX_REDEFINITION.md`

Post-deploy review screenshots:

- `tmp/live-verification/2026-06-07/01-owner-workspace-overview-live.png`
- `tmp/live-verification/2026-06-07/02-owner-workspace-action-plan-live.png`
- `tmp/live-verification/2026-06-07/03-owner-workspace-findings-proof-live.png`
- `tmp/live-verification/2026-06-07/04-owner-workspace-timeline-dialog-live.png`
- `tmp/live-verification/2026-06-07/05-owner-workspace-mobile-overview-live.png`

## Summary

The current workspace is a strong technical prototype. It proves that ProdUS can ingest a real repository, retain the README attachment, run all hosted scanners, store normalized findings, map them to readiness evidence, and show the result in the product workspace.

It is not yet a strong startup-owner MVP screen. The page exposes too much internal platform and scanner detail at once. A founder or product owner should immediately understand:

1. Am I ready to launch?
2. What are the top risks?
3. What should I do next?
4. What proof did ProdUS use?
5. Where can a technical teammate inspect details?

The redesign should make the owner feel guided, not audited.

## Target User

Primary user:

- Startup founder, product owner, solo builder, or early-stage operator.
- May understand their product and business risk, but may not know scanner names, security terminology, or infrastructure details.
- Wants a practical launch-readiness answer and a prioritized action plan.

Secondary user:

- Technical cofounder, engineer, security reviewer, or delivery team member.
- Needs raw scanner coverage, detailed findings, evidence trails, and service/package recommendations.

The MVP should serve both, but the first viewport must prioritize the primary user.

## Current UI Assessment

What works:

- It proves a real end-to-end workflow.
- It shows product, repository, README evidence, scanner coverage, findings, readiness, and recommendations.
- It has useful sections for evidence, launch readiness, scanner coverage, service planning, and next actions.
- It already has enough data to support a much better owner-facing experience.

What does not work for an owner:

- The page is too long and visually dense.
- The first viewport does not clearly answer whether the product is launch-ready.
- The scanner details appear too early and too prominently.
- Many colored chips compete for attention.
- There is no single dominant next action.
- Technical tool names are shown before plain-language risk categories.
- The right sidebar adds useful context, but also increases visual load.
- Findings, service plans, project readiness, scanner coverage, and evidence are mixed together.
- The risk/readiness scores do not clearly explain what changed them or how to improve them.
- The user has to scroll and interpret instead of being guided.

## Post-Deploy Screenshot Review

The deployed redesign is a meaningful MVP improvement. It now has one canonical owner readiness score, four top-level tabs, owner-readable launch decision copy, inline proof on the main risks, scanner proof inside Findings, and a timeline dialog instead of another top-level area.

It is still not the best founder-grade journey. The live screenshots show that the page is no longer scanner-first, but it still feels partly like an internal operator console. The next pass should simplify the owner journey further and make the page feel like a guided launch decision.

### What The Current Redesign Fixed

- Removed the duplicate owner-level score circle.
- Replaced seven top-level destinations with four owner-facing tabs.
- Moved scanner and evidence detail out of the primary navigation.
- Put proof lines next to the risks and actions that depend on them.
- Exposed a clear launch verdict instead of `Unknown` for a scanned product.
- Preserved full scanner coverage and mapped findings for technical review.

### Remaining Problems And Proposed Solutions

| Problem seen in screenshots | Why it hurts the journey | Proposed solution |
| --- | --- | --- |
| The first viewport still has too many decision centers: product header, launch status, top risks, project plan, AI brief, next decision, and several CTAs. | A startup owner has to decide where to look before they can decide what to do. | Make the first viewport a single launch-decision composition: verdict, 2 to 3 blockers, one primary action, one secondary proof action. Move AI brief, next decision, and project plan details lower or behind drawers. |
| The right rail is still too operational, with service-plan management and repeated `Remove` links. | It reads like an admin/editing panel instead of an owner guidance panel. | Replace the right rail with a compact owner control panel: current launch state, next owner action, assigned owner/team, last scan time, export/share. Move remove/edit actions into a service-plan edit drawer. |
| The launch decision card is clearer but not visually dominant enough. | The owner answer should feel like the page's main result, not one card among many. | Give the launch decision a dominant full-width band below the product header. Use stronger hierarchy for the verdict and keep supporting counts nested beneath it. |
| `0% ready` can feel harsh or confusing when the same page says `10/10 checks completed`. | Owners can confuse check completion with launch readiness, or feel the score is punitive without enough context. | Lead with the verdict text: `Blocked by 2 launch issues`. Show the numeric readiness score as secondary evidence with a short explanation: `Checks completed means coverage is complete; readiness reflects unresolved blockers.` |
| Findings are still too dense for a non-technical owner. | The owner may drop into scanner language and long lists before understanding the next business action. | Split Findings into an owner default and technical mode. Owner default shows blockers, impact, action, and proof. Technical mode exposes raw scanner language, artifact links, and filters. |
| Mobile works technically, but it becomes a long stack of nearly everything. | A founder checking status on a phone needs a short answer and one action, not the whole console compressed vertically. | Use a mobile-first sequence: verdict card, first blocker, primary CTA, proof summary, then expandable detail. Add a sticky bottom primary action when a blocker path exists. |
| There are still many cards, borders, labels, chips, and small status badges. | Everything competes visually, and the page still feels busy even after the tab cleanup. | Remove most decorative borders and chips. Use whitespace, section headings, and semantic status color. Keep one primary accent color for the main action. |
| Services are improved but still feel like a separate module beside the launch decision. | ProdUS monetization should feel like the natural way to resolve the top blocker, not another catalog surface. | Tie the number-one action directly to the number-one service: `Fix the launch blockers` maps to `Launch Hardening Sprint` or the relevant service path. |
| The AI Owner Brief is useful but visually competes with deterministic readiness. | The product's credibility should come from the readiness verdict and evidence first. | Move AI suggestions below the deterministic owner summary, or make AI a secondary assistant action inside the action plan. |
| The page still exposes internal productization objects too early. | Early-stage owners care about launch state and next step before service-plan internals. | Delay project plan, package, and service management until after the owner has chosen a next path. |

### Founder-Grade Journey Target

The stronger journey should be:

1. Verdict first: `Not ready to launch. Fix 2 blockers first.`
2. Why: show the 2 blockers with impact and evidence.
3. Do this: show one recommended action tied to the top recommended service.
4. Prove it: make scanner coverage, mapped findings, and artifacts available as expandable proof.
5. Continue: let the owner create a service plan, assign a reviewer, or export a report.

### First Viewport V2 Proposal

Recommended structure:

```text
Product: ProdUS Repo README Live

[Launch verdict band]
Not ready to launch
Fix 2 blockers before sharing with customers.

Checks completed: 10/10
Evidence confidence: High
Readiness: 0% because unresolved blockers remain

[Blocker 1]
Strict-Transport-Security header not set
Impact: Browser protection is weaker for public users.
Evidence: Web security baseline - latest run completed
Action: Add security header and rerun public app check.

[Blocker 2]
Content Security Policy header not set
Impact: Customer-facing pages may be easier to abuse if injected content appears.
Evidence: Web security baseline - latest run completed
Action: Add CSP header and rerun public app check.

[Primary CTA]
Fix launch blockers

[Secondary CTA]
View technical proof
```

Move the project start plan, AI brief, full action plan, scanner groups, and history below this first decision area.

## Product Design Goal

Turn the page from:

> "Here is everything ProdUS knows."

Into:

> "Here is your launch status, the few things that matter most, and the exact next steps."

## Redesign Principles

1. Owner summary first, technical evidence second.
2. One primary decision per viewport.
3. Plain-language categories before scanner names.
4. Prioritized actions before raw findings.
5. Progressive disclosure for technical detail.
6. Scanner coverage should build trust, not dominate the page.
7. Every risk should connect to impact and next action.
8. Every recommendation should explain why ProdUS suggests it.
9. Empty or zero-result states should be framed positively.
10. The page should feel calm, credible, and operational.
11. There should be one canonical launch-readiness score. Sub-scores can support it, but they must visually nest beneath the main answer.
12. The UI should distinguish blockers from improvements everywhere. Blockers decide launch status; improvements shape the follow-up plan.
13. Proof belongs next to each claim, not only in a separate audit area.
14. The mobile layout is a first-class MVP target, not a secondary screenshot.

## New Information Architecture

Use a top-level page with four owner-facing tabs:

1. Overview
2. Action Plan
3. Findings
4. Services

Technical details should be behind grouped sections, drawers, or collapsible panels.

Recommended tabs:

- Overview
- Action Plan
- Findings
- Services

The default tab should be `Overview`.

Scanners and evidence should not be top-level tabs in the MVP. They should live inside `Findings` as trust/audit sections and filters. Timeline should open from Overview as a drawer or compact modal, because it is useful context but not a primary owner decision.

## First Viewport Redesign

The first viewport should contain only the information needed to make sense of the product state.

Recommended layout:

```text
Product name                            Launch status
Short product summary                   Readiness score

[Primary decision card]
Status: Not ready
Reason: 2 blockers must be fixed before launch. 5 improvements can be scheduled this week.

[Top 3 risks]
1. Public workflow permissions need tightening
2. Runtime security headers are incomplete
3. Repository contains detected secret-like strings

[Primary action]
Review launch blockers

[Secondary actions]
View scanner proof
Assign to technical reviewer
Export report
```

The first viewport should not show every scanner, every service card, or every raw finding.

## Owner Overview Section

### Launch Status Card

Purpose:

- Give a single plain-language answer.
- Own the only canonical score shown at owner level.

States:

- Ready to launch
- Needs attention
- Not ready
- Evidence needed

Recommended fields:

- Status
- Confidence
- Readiness score
- Blocker count
- Improvement count
- Last scan time
- Evidence sources used
- One-sentence explanation

`Unknown` should only appear when there is genuinely no product or no scan/evidence context. A scanned product should resolve to a real verdict, even when that verdict is "Evidence needed" or "Not ready".

Example copy:

```text
Not ready
ProdUS found 2 launch blockers that must be fixed before this product is shared with customers.
It also found 5 improvements that can be scheduled after the blockers are assigned.
```

### Top Risks Card

Purpose:

- Reduce many scanner findings into owner-readable priorities.

Show only 3 to 5 items by default.

Each item should include:

- Plain title
- Business impact
- Severity
- Source count or source line
- Recommended owner action
- Recommended service when one maps directly

Example:

```text
Runtime security headers are incomplete
Impact: Users may have weaker browser-level protection.
Evidence: Web security baseline found 10 related runtime findings.
Action: Ask engineering to add missing security headers.
Service: Launch Hardening Sprint
```

### Action Plan Card

Purpose:

- Turn findings into a sequence.

Recommended groups:

- Do now
- Schedule this week
- Monitor

Each action should have:

- Owner-readable title
- Why it matters
- Suggested owner or team
- Evidence link
- Status

## Scanner Coverage Redesign

The scanner coverage section should be a trust proof, not the main story.

Current scanner names should remain available, but grouped:

| Owner Category | Tools |
| --- | --- |
| Secrets | Gitleaks |
| Dependencies | OSV Scanner, Grype, Trivy |
| Code Quality and Static Risk | Semgrep |
| Infrastructure and Workflow Risk | Checkov, Trivy FS |
| Runtime Web Baseline | ZAP Baseline, Lighthouse |
| Inventory | Syft |

Recommended default display:

```text
Evidence checks completed
10 of 10 checks completed successfully
64 findings normalized
64 findings mapped to launch readiness
```

Then show grouped rows:

```text
Secrets                         Completed   9 findings
Dependencies                    Completed   10 findings
Code and static risk             Completed   15 findings
Infrastructure and workflows     Completed   29 findings
Runtime baseline                 Completed   10 findings
Inventory                        Completed   No findings
```

Raw tool names should be visible after expanding a group or opening technical proof inside Findings.
Raw tool names should be visible after expanding a group, filtering Findings by scanner, or opening the technical proof section inside Findings.

## Findings Redesign

Findings should not be shown as a long mixed list by default.

Recommended grouping:

- Launch blockers
- High-priority technical risks
- Medium-priority improvements
- Informational findings
- Resolved or accepted findings

Each finding card should include:

- Plain-language title
- Severity
- Affected area
- Why it matters
- Recommended fix
- Evidence source
- Technical details drawer

Avoid showing raw scanner language as the primary title when possible.

Example:

```text
GitHub Actions workflow allows risky manual input
Severity: Medium
Area: Deployment workflow
Why it matters: Build behavior can be influenced by manual inputs.
Recommended fix: Limit workflow_dispatch inputs or require stricter review.
Evidence: Checkov CKV_GHA_7
```

## Services And Recommendations Redesign

The service recommendation section currently appears useful but too deep on the same page.

Recommended change:

- Show only the top 3 recommended services in Overview.
- Move the full service catalog into the Services tab.
- Explain each recommendation in terms of the owner goal.

Example:

```text
Recommended next service: Launch Hardening Sprint
Why: The scan found runtime and workflow issues that should be addressed before public launch.
Outcome: A cleaner launch readiness score and fewer security warnings.
```

## Evidence Redesign

Evidence should reassure the owner that ProdUS used real inputs.

The strongest evidence pattern is inline proof on every major claim:

```text
Runtime security headers are incomplete
Evidence: Web security baseline - 10 findings - latest run completed
```

Use a separate evidence/proof area only for deeper audit needs.

Show:

- Repository scanned
- README attached
- Runtime URL scanned
- Container image scanned
- Scan completion time
- Number of tools completed

Example:

```text
Evidence used
- Repository: mahmoudashraf/ProdUS
- Document: ProdUS-README.md
- Runtime: produs-staging.46.224.145.148.sslip.io
- Container image: alpine:3.20
- Scanner suite: 10 of 10 completed
```

The Findings tab should contain full raw details, stored proof, source status, and export controls.

## Right Sidebar Redesign

The right sidebar should become a compact "Owner Control Panel".

Recommended contents:

1. Launch status
2. Primary next action
3. Assigned owner
4. Last scan timestamp
5. Export/share actions

Remove or collapse:

- Long lists of raw readiness items.
- Repeated status chips.
- Secondary metrics that already appear in the main content.

## Visual Design Issues To Fix

1. Too many bordered cards stacked vertically.
2. Too many small status chips.
3. Several sections have similar visual weight.
4. Important actions do not stand out enough.
5. Text density is too high.
6. Scanner labels and technical nouns dominate the page.
7. Color is overused for status tags, reducing scanability.
8. The page height is extreme and needs tabbed/detail navigation.
9. Empty states and zero findings should be clearer.
10. Score circles need explanatory labels and improvement hints.
11. Two score circles on one page weaken trust. Keep one owner-level score and move supporting scores into text, metrics, or technical detail.
12. Color should be semantic only: blocker, attention, clear, and neutral/info.
13. Remove most decorative borders and chips. Use whitespace, typography, and section rhythm for grouping.
14. The primary CTA should use the single strongest accent color on the page.

## MVP Screen Structure

### Overview Tab

Sections:

1. Launch Decision
2. Top 3 Risks
3. Recommended Next Actions
4. Evidence Summary
5. Scanner Completion Summary
6. Top Service Recommendation
7. Timeline drawer trigger

### Action Plan Tab

Sections:

1. Launch blockers
2. Suggested technical tasks
3. Owner decisions needed
4. Accepted risks

### Findings Tab

Sections:

1. Filters by severity, category, scanner, mapped readiness area
2. Grouped finding cards
3. Technical drawer for raw scanner evidence
4. Scanner coverage table
5. Latest run status
6. Normalized and mapped counts
7. Stored proof and raw artifact links if allowed

### Services Tab

Sections:

1. Recommended services
2. Why each service was recommended
3. Expected outcomes
4. Package/action CTA

### Timeline Drawer

Sections:

1. Product created
2. Repository authorized
3. README attached
4. Scanner suite started
5. Findings normalized
6. Readiness updated
7. Actions created or completed

## Recommended MVP Copy

Use owner-facing labels:

| Current/Technical | Owner-Facing |
| --- | --- |
| Scanner Suite Coverage | Evidence Checks |
| Normalized Findings | Findings ProdUS can understand |
| Mapped Findings | Findings linked to launch readiness |
| Runtime Baseline | Public app check |
| Dependency Container | Container and dependency check |
| SAFE_STATIC | Repository check |
| Tool Coverage | Check coverage |
| ZAP Baseline | Web security baseline |
| Checkov | Infrastructure and workflow policy check |

## Data Mapping Requirements

The redesign can use existing data from scanner summaries:

- `toolCoverage`
- latest scanner status
- normalized count
- mapped finding count
- evidence source status
- product profile
- repository URL
- product attachments
- readiness score
- recommended services
- scanner facts

Needed derived fields:

- launch status label
- canonical launch readiness score
- blocker count
- improvement count
- top risk ranking
- owner-readable category
- action priority
- evidence confidence
- inline proof line
- recommended next action
- recommended service bridge

## Prioritization Logic

Top risks should be ranked by:

1. Severity
2. Whether mapped to launch readiness
3. Whether runtime-facing
4. Whether secret/security related
5. Whether repeated across tools
6. Whether owner action is available

Display only the top 3 in Overview.

## MVP Acceptance Criteria

The redesigned MVP is acceptable when:

1. A startup owner can identify launch status within 10 seconds.
2. The first viewport shows no more than 3 primary risks.
3. The first viewport has one clear primary CTA.
4. Scanner tool names are not the dominant first-screen content.
5. All 10 scanner tools remain visible inside Findings technical proof.
6. Findings are grouped by owner-readable category.
7. Every top risk has an impact and next action.
8. Evidence summary shows repo, README, runtime URL, and scanner completion.
9. UI still supports normalized and mapped finding counts.
10. The page is usable without scrolling through the full technical evidence list.
11. There is exactly one owner-level readiness number on the workspace page.
12. A scanned product never headlines as `Unknown`.
13. The top action and top recommended service reinforce the same blocker-resolution path.
14. The mobile first viewport shows the launch decision, blocker count, primary CTA, and at least the first risk without horizontal scrolling.
15. Overview uses semantic color only and avoids chip-heavy layouts.

## Founder-Grade Acceptance Criteria

The next iteration should raise the bar beyond acceptable MVP. It is founder-grade when:

1. The first viewport has one dominant answer, not several competing panels.
2. The owner can say the launch state, blocker count, and next action after reading one card.
3. The numeric score never competes with the plain-language verdict.
4. Check completion and launch readiness are visually distinct concepts.
5. The right rail does not expose service-plan editing controls unless the owner is editing the plan.
6. The top recommended service is presented as the direct path to resolving the top launch blocker.
7. AI suggestions never compete visually with deterministic evidence and readiness.
8. Mobile shows the verdict, first blocker, and primary action before any project-plan or scanner-management detail.
9. The default Findings view is owner-readable; raw scanner evidence is one deliberate expansion away.
10. At least half of the current card borders and chips are removed or replaced with whitespace, section rhythm, and typography.

## Implementation Plan

### Phase 1: Information Architecture

- Use four top-level tabs in the product workspace.
- Make Overview the default tab.
- Move scanner table and raw details out of the first viewport and into Findings.
- Add owner summary cards.
- Put Timeline behind a drawer/modal from Overview.

### Phase 2: Owner Summary Model

- Derive launch status from readiness score and mapped findings.
- Derive one canonical readiness score for the owner surface.
- Derive blocker and improvement counts.
- Derive top risks from normalized findings.
- Group scanner tools into owner-readable categories.
- Add owner-facing labels for technical scanner names.
- Generate inline proof text for each top risk.

### Phase 3: Findings Experience

- Group findings by category and severity.
- Add expandable technical details.
- Add action buttons for each top risk.
- Add filters for technical users.
- Fold scanner coverage, stored evidence, and raw proof into this tab.

### Phase 4: Services And Actions

- Show top service recommendation in Overview.
- Move full recommendations to Services tab.
- Link top risks to recommended services and tasks.
- Tie the number-one action to the number-one service recommendation.

### Phase 4.5: Code Structure

- Extract owner-facing model helpers from `OwnerProductizationWorkspace.tsx`.
- Keep tab definitions, scanner evidence categories, severity/category mapping, launch-status derivation, and proof-line helpers in a small owner workspace model module.
- Move large presentational sections into focused components once the MVP behavior is stable.
- Keep scanner forms and technical proof sections separate from the owner summary logic.

### Phase 5: Verification

- Capture desktop screenshot.
- Capture mobile screenshot.
- Verify first viewport does not overflow or hide primary CTA.
- Verify all scanner details remain accessible.
- Run frontend type-check and production build.

### Phase 6: Founder-Grade Journey Pass

- Rebuild the first viewport around a single launch verdict band.
- Replace `0% ready` as the lead message with `Blocked by 2 launch issues`, keeping the score as supporting context.
- Collapse the right rail into an owner control panel and move edit/remove controls into drawers.
- Split Findings into owner default mode and technical proof mode.
- Add a mobile sticky primary action for the current top blocker path.
- Reduce borders, chips, repeated labels, and status badges across Overview.
- Tie the primary action button directly to the top recommended service or service-plan step.
- Move AI brief actions below deterministic readiness and evidence.

## Open Questions

1. Should "launch status" be strict, based on any high severity finding, or weighted by readiness score once blockers are zero?
2. Who owns action assignment in MVP: product owner, expert team, or technical reviewer?
3. Should scanner findings automatically create tasks, or should the owner approve task creation?
4. Should zero-finding scanners appear as "Completed, no findings" or be hidden from Overview?
5. Should service recommendations be purchasable immediately from this page?

## Recommended Next Document

The next implementation document should be:

`docs/planning/OWNER_PRODUCTIZATION_WORKSPACE_UI_IMPLEMENTATION_PLAN.md`

It should translate this redesign into concrete frontend changes in:

- `frontend/src/features/platform/OwnerProductizationWorkspace.tsx`
- related platform types and API response helpers
- scanner summary display components
