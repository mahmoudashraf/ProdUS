# Workspace Operating Room Redesign Proposal

Date: 2026-06-16

Reference screenshot:

- `/Users/mahmoudashraf/Downloads/Snip20260616_1.png`

Related documents:

- `docs/planning/WORKSPACE_AS_MAIN_FIELD_CHANGE_PLAN.md`
- `docs/planning/SERVICE_OWNED_WORKSPACE_FINDINGS_CHANGE_PLAN.md`
- `docs/planning/OWNER_PRODUCTIZATION_WORKSPACE_MVP_REDESIGN.md`

## Purpose

The current workspace screen has useful product work hidden behind too many equal-weight cards:

- Overview
- Plan work
- Services
- Findings and proof
- People and help
- Workspace chat
- Steps
- Handoff

This creates a loop: the owner can enter the same work through different doors, but the screen does not first answer what actually matters.

This proposal redesigns Workspace as the startup/MVP operating room:

```text
Workspace is where selected product risks become owned service work and verified fixes.
```

The owner should not need to understand internal concepts like proof files, acceptance checks, fix path, milestones, scanner evidence, package modules, or handoff signals before knowing what to do next.

## Current Problem

The current workspace first screen behaves like a route launcher.

It asks the owner to choose between several destinations before answering:

- What is blocking the product?
- What work is in scope?
- Who owns the work?
- What has been verified?
- What should happen next?

The screenshot shows three specific issues:

1. The top hero says `0% done`, but the page immediately offers many destinations, so the owner does not know which one changes the score.
2. `Plan work`, `Services`, `Findings and proof`, and `Steps` overlap. They all talk about scope, service work, findings, and proof from different angles.
3. `Proof files`, `acceptance checks`, `fix path`, `steps`, and `handoff` are internal delivery concepts. They should support the owner journey, not compete as primary navigation.

## Product Decision

The workspace should not expose every internal object as a top-level page.

The owner-facing workspace should be organized around real questions:

1. What is happening now?
2. What work belongs in this workspace?
3. What risks are being fixed and how do we verify them?
4. Who is helping?
5. What decisions were made?
6. Is this ready to hand off?

Everything else should be nested under these answers.

## What To Keep

### Keep Services

Keep services because they are the workspace scope.

But services should not feel like catalog shopping. In Workspace, a service means:

```text
This is a type of productionization work we decided belongs here.
```

Each service should show:

- why it is in the workspace;
- which findings it owns;
- who is responsible;
- what work/checks remain;
- whether it is ready, blocked, or needs proof.

### Keep Findings

Keep findings because they are the evidence-backed risks the owner is trying to fix.

But findings should not float directly in the workspace.

The new rule from `SERVICE_OWNED_WORKSPACE_FINDINGS_CHANGE_PLAN.md` should guide the UI:

```text
Product scanners discover findings.
Findings belong to a service.
Services belong to a workspace.
```

Workspace findings should therefore be grouped under service work.

### Keep Proof

Keep proof, but stop treating proof as a separate place the owner has to visit.

Proof should be shown next to the claim it supports:

- finding proof;
- service proof;
- step/check proof;
- handoff proof.

The owner question is not:

```text
How many proof files exist?
```

The real question is:

```text
Which fixes are verified, and which still need proof?
```

### Keep Workspace Discussion / Decisions

Keep chat as a workspace-attached discussion and decision log.

It should answer:

```text
Who said what, when, and which finding/service was it about?
```

It should not feel like the AI assistant, and it should not become a global product chat or a people-management chat.

The discussion belongs to the current workspace. Messages can mention or link to:

- workspace services;
- workspace findings;
- proof/check states;
- handoff decisions;
- people responsible for the work.

The owner-facing label should be:

```text
Workspace discussion / decisions
```

### Keep Handoff

Keep handoff, but make it conditional and late-stage.

Handoff should become important only when:

- major findings are fixed or accepted;
- required service work has proof;
- people/team ownership is clear;
- the owner is preparing to share or transfer the product state.

Do not give Handoff equal visual weight when the workspace is still at `0%`.

## What To Remove Or Collapse

### Remove `Plan work` As A Top-Level Page

`Plan work` overlaps with Services, Findings, People, and Steps.

Planning should become the state of the workspace, not a separate destination.

Recommended replacement:

```text
Work scope
```

### Remove `Steps` As A Top-Level Page

Steps are useful, but they are not a primary owner destination.

Steps should live under:

- a service;
- a finding;
- a verification/check;
- a handoff task.

Recommended replacement:

```text
Service checklist
```

or

```text
Work checklist
```

### Remove `Proof files` As A Headline Metric

Proof-file count is an internal storage metric.

Replace it with owner-facing proof states:

- `0 fixes verified`
- `2 fixes need proof`
- `1 service ready to check`
- `3 findings still open`

### Remove `Acceptance checks` From Primary Language

Acceptance checks sound like enterprise process.

For startup/MVP owners, use:

- `Ready checks`
- `Fix checks`
- `Handoff checks`
- `Verified`
- `Needs proof`

Keep acceptance data internally, but do not lead with acceptance terminology.

### Remove `Fix path` As A Separate Concept

The fix path should be visible as a simple chain:

```text
Finding -> Service -> Owner/team -> Proof/check
```

Do not make `Fix path` another page, card, or abstraction.

## New Workspace Navigation

Recommended top-level workspace navigation:

1. Overview
2. Work scope
3. Fix and verify
4. People
5. Discussion / decisions
6. Handoff

Optional lean version:

1. Overview
2. Work scope
3. Fix and verify
4. Discussion / decisions
5. Handoff

Do not show eight cards on the overview. Show a guided answer and the next action.

## New First Screen

The workspace first screen should answer before it routes.

Recommended first viewport:

```text
Workspace: Studio AI Inventory Ops

This workspace is planning the first productionization pass.

4 findings need service-owned fixes.
8 services are selected.
1 person is involved.
0 fixes are verified.

Next best action:
Review the 4 findings and choose which service owns each one.

[Review findings]
[Adjust work scope]
```

Below that, show `Needs attention`:

```text
Needs attention

- 4 findings are not verified yet.
- 3 services do not have an owner.
- No fix has proof attached.
- Handoff is not ready.
```

Then show a compact work summary, not a grid of all routes.

## New Workspace Areas

### 1. Overview

Purpose:

Answer the current workspace state and next action.

It should show:

- current phase: planning, fixing, verifying, or handoff;
- top blockers;
- selected services;
- assigned people;
- verified vs unverified fixes;
- the next best action.

Primary CTA examples:

- `Review findings`
- `Choose service owners`
- `Check fixes`
- `Add proof`
- `Prepare handoff`

Avoid generic CTA:

```text
Next delivery action
```

Use the actual next action instead.

### 2. Work Scope

Purpose:

Replace `Plan work`, `Services`, and most of `Steps`.

This is where the owner sees and adjusts what work belongs in the workspace.

Show services as work lanes:

```text
API security review
  Why here: 4 scanner findings map to this service.
  Owner: Not assigned
  Findings: 4 included, 1 available
  State: Needs owner and proof
  Action: Assign owner / Manage findings / Create checklist
```

Actions:

- Add service.
- Remove service.
- See finding impact before adding service.
- Include or exclude findings under a service.
- Assign person/team.
- Add checklist item.

Rules:

- Service add should preview which findings it will bring.
- Service removal should preview which findings leave the workspace.
- Findings should be included through services, not directly assigned to workspace.

### 3. Fix And Verify

Purpose:

Replace `Findings and proof` as a clearer owner journey.

Group findings by service:

```text
API security review
  4 findings included
  0 verified
  2 ready to check
```

Each finding should show:

- owner-readable title;
- severity or launch impact;
- scanner/source proof;
- service owner;
- status: new, still open, ready to check, fixed, returned, accepted risk, false positive, needs proof;
- latest check result;
- next action.

Actions:

- Check fixes.
- Attach proof.
- Mark accepted risk.
- Change service.
- Remove from this service.
- Re-add previously removed finding.

Important:

`Check fixes` should default to targeted verification, not a full scanner suite.

### 4. People

Purpose:

Show who is involved and who owns the work.

Show:

- people involved;
- who owns each service/finding;
- missing owners;
- support/team requests.

Actions:

- Add person.
- Ask team/expert for help.
- Assign owner to service/finding.

### 5. Workspace Discussion / Decisions

Purpose:

Keep a workspace-attached discussion log for decisions, coordination, and finding/service mentions.

This is not a global chat and not an AI assistant surface. It belongs to the current workspace.

Show:

- messages;
- sender;
- timestamp;
- mentioned findings;
- mentioned services;
- decision notes;
- links back to the related service/finding/check.

Actions:

- Send message.
- Mention finding/service.

### 6. Handoff

Purpose:

Prepare the product for continuity once the workspace is close to ready.

Show:

- what is complete;
- what still needs proof;
- unresolved accepted risks;
- runbook/access notes;
- support scope;
- share/export readiness.

Actions:

- Prepare handoff.
- Generate readiness summary.
- Export/share status.
- Mark handoff reviewed.

Handoff should remain quiet until the workspace has meaningful verified progress.

## Proof Model

Proof should be contextual, not a standalone pile.

Proof can attach to:

- finding;
- service;
- checklist item;
- handoff section.

Owner-facing proof states:

| State          | Meaning                                                                        |
| -------------- | ------------------------------------------------------------------------------ |
| Needs proof    | Owner/team claims work happened, but no supporting evidence exists.            |
| Ready to check | Work/proof exists and scanner verification can run.                            |
| Checking       | Scanner or human review is in progress.                                        |
| Verified       | Latest comparable check confirms the issue is fixed or the requirement is met. |
| Failed check   | Verification ran but issue remains or tool failed.                             |
| Accepted risk  | Owner intentionally accepts this risk for now.                                 |

Avoid making the owner manage proof files as a separate destination.

## Checklist / Steps Model

Steps should be lightweight and attached to work.

Do not show a standalone `Steps` page by default.

Use checklist rows inside a service:

```text
API security review
  [ ] Add security headers
  [ ] Rerun public app check
  [ ] Attach deploy proof
  [ ] Confirm no high risk remains
```

Checklist items can link to proof and findings.

## Handoff Model

Handoff is not a work area at the start.

It becomes relevant when:

- all critical workspace findings are fixed, accepted, or intentionally deferred;
- service owners have completed required proof/checks;
- there is enough context for another person to continue safely.

Until then, Overview can show:

```text
Handoff not ready yet.
Fix and verify the selected findings first.
```

## Route And UI Mapping

| Current route/card | Proposed destination                                                    |
| ------------------ | ----------------------------------------------------------------------- |
| Overview           | Keep, but make it answer-first, not route-first.                        |
| Plan work          | Collapse into Work scope.                                               |
| Services           | Rename/merge into Work scope.                                           |
| Findings and proof | Rename to Fix and verify.                                               |
| People and help    | Rename to People.                                                       |
| Workspace chat     | Rename to Workspace discussion / decisions and keep workspace-attached. |
| Steps              | Collapse into service/finding checklists.                               |
| Handoff            | Keep, but make conditional/final-stage.                                 |
| Proof files metric | Replace with verified/unverified fix state.                             |
| Acceptance checks  | Rename to Ready checks or keep inside Handoff.                          |

## Implementation Sequence

1. Create new workspace information architecture.
   - Replace eight-card route grid with answer-first overview.
   - Keep old routes as compatibility aliases during transition.

2. Rename and collapse navigation.
   - `Plan work` + `Services` + `Steps` -> `Work scope`.
   - `Findings and proof` -> `Fix and verify`.
   - `People and help` -> `People`.
   - `Workspace chat` -> `Workspace discussion / decisions`, still attached to the workspace.

3. Rebuild Overview.
   - Show current phase.
   - Show top blockers.
   - Show next best action with specific copy.
   - Show needs-attention list.
   - Remove proof-file count as a primary metric.

4. Rebuild Work Scope.
   - Service lanes.
   - Finding impact before service add/remove.
   - Service-owned finding include/exclude.
   - Inline checklist items.

5. Rebuild Fix And Verify.
   - Group findings by service.
   - Put proof/check state on each finding.
   - Keep targeted `Check fixes` prominent.
   - Show check progress and result.

6. Rebuild People.
   - Show people, owners, and support requests.
   - Surface unowned services/findings.

7. Rebuild Workspace Discussion / Decisions.
   - Keep discussion scoped to the current workspace.
   - Allow mentions of services/findings.
   - Show sender, timestamp, and related decisions.

8. Rebuild Handoff.
   - Show only when useful.
   - Tie readiness to verified fixes, accepted risks, proof, and owners.

9. Verify locally and live.
   - Desktop overview.
   - Mobile overview.
   - Add service with finding impact.
   - Include/re-add finding through service.
   - Check fixes progress.
   - People/discussion with finding mention.
   - Handoff locked/not-ready and ready states.

## Acceptance Criteria

The redesign is successful when a startup/MVP owner can open a workspace and answer these in under 10 seconds:

- What is this workspace doing?
- What is blocking production readiness?
- What work is in scope?
- Who owns the work?
- What is verified?
- What should I click next?

The UI should not require the owner to understand:

- package modules;
- deliverables;
- proof file counts;
- acceptance criteria;
- scanner tool names;
- internal fix path terminology;
- handoff signals.

Those details can exist, but they should be nested under the practical owner questions.

## Implementation Status - 2026-06-16

Core north-star UI implementation is complete in the current local workspace.

Implemented:

- Overview is answer-first: it surfaces the current workspace state, blockers, scope, people, and a specific next action instead of leading with eight equal route cards.
- `Plan work`, `Services`, and owner-facing `Steps` are collapsed into `Work scope`.
- `Findings and proof` is reframed as `Fix and verify`.
- Workspace findings are grouped under service-owned work, including source proof, service mapping, owner gap, latest baseline, proof need, and targeted `Check fixes`.
- Services render as work lanes with why they are in scope, finding impact, state, owner gap, owner-visible output, and service checklist rows.
- People now starts with an ownership map for services/findings, missing owners, support asks, and actions back to findings/scope.
- Chat is kept as `Workspace discussion / decisions`, scoped to the current workspace and showing finding/service mention context.
- Handoff is gated: when fixes/proof/ownership are not ready, it stays quiet and directs the owner back to `Fix and verify` or `People`.
- The legacy language `Plan work`, `Workspace chat`, `Findings & proof`, top-level `Proof files`, `Acceptance checks`, and separate `Fix path` does not appear in the redesigned owner-facing workspace surfaces.
- Named service owners are now persisted on package modules and assigned from `Work scope`.
- Named finding owners are now persisted on scanner risk threads and assigned from `Fix and verify`.
- Proof attachments now support contextual `SERVICE` and `FINDING` scopes, so service proof sits with the service lane and finding proof sits with the finding.
- Handoff readiness now requires named service/finding ownership, and a ready handoff state is verified through the existing accepted-risk decision flow.
- The AI chat/MAX dock element was intentionally left untouched in this enhancement pass.

Verified locally:

- Desktop overview.
- Mobile overview.
- Work scope service lane with finding impact.
- Service-owned fix/verify finding.
- People ownership map.
- Workspace discussion / decisions with finding and service context.
- Handoff locked/not-ready state.
- Persisted service owner assignment.
- Persisted finding owner assignment.
- Service-scoped proof attachment.
- Finding-scoped proof attachment.
- Handoff ready state after contextual proof, explicit owners, and an accepted-risk owner decision.

Evidence screenshots:

- `tmp/live-verification/2026-06-16/2015-overview-desktop-workspace-north-star-final2-134136.png`
- `tmp/live-verification/2026-06-16/2016-work-scope-service-lanes-workspace-north-star-final2-134136.png`
- `tmp/live-verification/2026-06-16/2017-fix-and-verify-service-owned-workspace-north-star-final2-134136.png`
- `tmp/live-verification/2026-06-16/2018-people-ownership-map-workspace-north-star-final2-134136.png`
- `tmp/live-verification/2026-06-16/2019-discussion-decisions-context-workspace-north-star-final2-134136.png`
- `tmp/live-verification/2026-06-16/2020-handoff-not-ready-gate-workspace-north-star-final2-134136.png`
- `tmp/live-verification/2026-06-16/2021-overview-mobile-workspace-north-star-final2-134136.png`
- `tmp/live-verification/2026-06-16/2030-service-owner-proof-workspace-owner-proof-1781617558488.png`
- `tmp/live-verification/2026-06-16/2031-finding-owner-proof-workspace-owner-proof-1781617558488.png`
- `tmp/live-verification/2026-06-16/2032-ownership-map-assigned-workspace-owner-proof-1781617558488.png`
- `tmp/live-verification/2026-06-16/2033-handoff-ready-owner-review-workspace-owner-proof-1781617558488.png`

Verification report:

- `tmp/live-verification/2026-06-16/2030-workspace-owner-proof-workspace-owner-proof-1781617558488.json`

Validation run:

- `npx prettier --write` on touched workspace files passed.
- `mvn -q -DskipTests compile` passed.
- `npm run type-check` passed.
- Targeted `next lint --file ...` on the touched workspace files passed with the existing `checkProgress` hook dependency warning in `OwnerWorkspaceFixesRiskThreadPanel.tsx`.
- `npm run build` passed.
- Full `npm run lint` is still blocked by unrelated existing lint/prettier debt outside this redesign.

Remaining:

- Deploy to live only after the normal release step is approved; this pass is verified locally, not deployed.

## North Star

Workspace should feel like this:

```text
Here is the work that matters now.
Here are the risks it fixes.
Here is who owns it.
Here is the proof/check state.
Here is the next action.
```

Not like this:

```text
Here are eight internal product areas. Choose one.
```
