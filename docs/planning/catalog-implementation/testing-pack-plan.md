# Testing Pack Catalog Plan

Date: 2026-05-24

Status: implemented in catalog seed, demo seed, matching, frontend category display, and AI-safe knowledge export path

Source context:

- Current catalog includes testing-related services, but they are fragmented.
- Existing related modules include `validation.codebase`, `code.refactor`, `cloud.staging_setup`, `cloud.cicd_setup`, `scale.load_testing`, `security.evidence_review`, `launch.readiness_review`, and `support.bug_triage`.
- There is no single owner-selectable Testing Pack and no dedicated team/solo expert capability model for teams that want to offer testing as a productized service.

Implementation note, 2026-05-24:

- Added `quality-testing` as a first-class service category.
- Added Product Testing Pack, Launch Testing Pack, and Test Automation Foundation package templates.
- Added testing service modules, dependency rules, recommendation rules, and `testing-pack-assist` AI capability contract.
- Added demo team/solo expert testing capabilities and matching support for stable codes and AI assistance tags.
- Existing LoomAI safe knowledge export automatically includes the new service modules, package templates, dependencies, team capabilities, solo expert skills, evidence templates, and AI capability contract.

## 1. Decision

Add a first-class Testing Pack to ProdUS.

The Testing Pack should be a selectable package template and a set of service modules that owners can add to a productization cart. Teams and solo experts should be able to declare that they provide the pack, attach proof, define testing scope, and be matched to owners based on product context, stack, risk profile, and testing needs.

This should not be a generic QA marketplace category. It should be evidence-driven productization testing focused on readiness, release confidence, and owner-visible proof.

## 2. Product Rationale

Owners often do not know whether they need:

- smoke testing
- regression testing
- API testing
- frontend/user-flow testing
- accessibility checks
- performance/load testing
- security verification
- release acceptance testing
- post-fix verification

The existing catalog handles pieces of this, but the owner experience should offer a clear productized path:

```text
My product needs confidence before launch
  -> choose Testing Pack
  -> select testing depth
  -> match with QA-capable teams/experts
  -> get milestone criteria, test evidence, defects, and readiness signal
```

## 3. Owner-Facing Pack

### Pack Name

Testing Pack

Alternative UI names for review:

- Product Testing Pack
- Launch Testing Pack
- QA Readiness Pack
- Release Confidence Pack

Recommended label: **Product Testing Pack**

Reason: clearer than "Testing Pack" and broad enough for launch, regression, API, and product-flow testing.

### Owner Outcome

The owner gets evidence-backed confidence that the product's critical flows work, known defects are visible, and launch or milestone decisions are based on testing proof.

### Owner Copy

Short description:

> Validate critical product flows, APIs, integrations, and release readiness with structured test evidence before launch or milestone approval.

Outcome description:

> Your product gets a scoped testing plan, executed checks, defect triage, evidence attachments, and a readiness summary tied to owner approval.

## 4. Testing Pack Service Modules

Create a new catalog layer or sub-layer named `quality-testing`.

Recommended service modules:

| Stable Code | Name | Purpose |
| --- | --- | --- |
| `quality.test_strategy` | Test Strategy | Define scope, test levels, environments, test data, and acceptance gates. |
| `quality.smoke_testing` | Smoke Testing | Validate the most critical product flows after build, deploy, or milestone completion. |
| `quality.regression_testing` | Regression Testing | Re-run agreed scenarios to confirm new changes did not break core behavior. |
| `quality.api_testing` | API Testing | Validate API contracts, auth behavior, error states, pagination, and integration assumptions. |
| `quality.e2e_testing` | End-to-End Flow Testing | Test owner/customer journeys across frontend, backend, auth, data, and integrations. |
| `quality.accessibility_testing` | Accessibility Testing | Validate key UI flows for accessibility issues and owner-visible remediation priorities. |
| `quality.cross_browser_device_testing` | Browser and Device Testing | Validate supported browsers, mobile layouts, and responsive behavior. |
| `quality.test_automation_setup` | Test Automation Setup | Add maintainable automated checks for critical product paths. |
| `quality.coverage_boost` | Test Coverage Boost | Add or improve unit/integration tests around risky product areas. |
| `quality.release_acceptance_testing` | Release Acceptance Testing | Execute final release criteria and produce go/no-go evidence. |
| `quality.defect_triage` | Defect Triage and Verification | Prioritize defects, reproduce issues, verify fixes, and attach evidence. |

Keep `scale.load_testing` in the Scaling layer, but include it as an optional add-on in the Product Testing Pack because load testing has different environment and safety rules.

## 5. Package Templates

### 5.1 Product Testing Pack

Target:

- prototype preparing for pilot
- product preparing for launch
- owner with unclear quality risk
- product with scanner or diagnosis signals showing missing tests

Included modules:

- `quality.test_strategy`
- `quality.smoke_testing`
- `quality.regression_testing`
- `quality.e2e_testing`
- `quality.defect_triage`
- `quality.release_acceptance_testing`

Optional modules:

- `quality.api_testing`
- `quality.accessibility_testing`
- `quality.cross_browser_device_testing`
- `quality.test_automation_setup`
- `quality.coverage_boost`
- `scale.load_testing`
- `security.evidence_review`

Suggested duration:

- 1 to 4 weeks for focused scope
- 4 to 8 weeks when automation and coverage boost are included

Suggested budget bands:

- Starter: `$5K-$20K`
- Growth: `$20K-$75K`
- Enterprise: `$75K-$180K`

### 5.2 Launch Testing Pack

Target:

- product near launch or milestone acceptance
- owner wants go/no-go readiness proof

Included modules:

- `quality.test_strategy`
- `quality.smoke_testing`
- `quality.e2e_testing`
- `quality.release_acceptance_testing`
- `launch.readiness_review`

Optional:

- `scale.load_testing`
- `quality.accessibility_testing`
- `quality.api_testing`
- `cloud.monitoring_setup`

### 5.3 Test Automation Foundation

Target:

- product has manual testing pain
- product needs repeatable checks before future releases

Included modules:

- `quality.test_strategy`
- `quality.test_automation_setup`
- `quality.api_testing`
- `quality.e2e_testing`
- `quality.coverage_boost`
- `cloud.cicd_setup`

## 6. Dependencies And Rules

Add dependency rules:

| Source | Depends On | Severity | Reason |
| --- | --- | --- | --- |
| `quality.e2e_testing` | `cloud.staging_setup` | Warning | End-to-end testing needs a stable environment and realistic test data. |
| `quality.release_acceptance_testing` | `quality.test_strategy` | Required | Release acceptance must use agreed criteria and scope. |
| `quality.test_automation_setup` | `cloud.cicd_setup` | Recommended | Automated tests are more useful when connected to release gates. |
| `quality.coverage_boost` | `validation.codebase` | Recommended | Coverage work should start with codebase risk context. |
| `quality.api_testing` | `code.api_redesign` | Optional/conditional | API testing should align with active API contract changes where relevant. |
| `scale.load_testing` | `cloud.staging_setup` | Existing warning | Load testing should run in staging or a safe test environment, not production by default. |

Add recommendation rules:

- If diagnosis says `no tests`, recommend `quality.test_strategy` and `quality.coverage_boost`.
- If product stage is `pilot`, `validated`, or `production_candidate`, recommend `quality.smoke_testing` and `quality.release_acceptance_testing`.
- If frontend rewrite or customer-facing UI work is selected, recommend `quality.e2e_testing` and `quality.cross_browser_device_testing`.
- If API redesign/backend rewrite is selected, recommend `quality.api_testing`.
- If launch readiness is selected, recommend `quality.release_acceptance_testing`.
- If scanner findings affect launch-critical flows, recommend `quality.regression_testing` and `quality.defect_triage`.

## 7. Team And Solo Expert Capability Model

Teams and solo experts should be able to offer the Testing Pack through verified capabilities.

Add capability categories:

- `quality-testing`
- `test-strategy`
- `manual-qa`
- `test-automation`
- `api-testing`
- `e2e-testing`
- `accessibility-testing`
- `performance-testing`
- `release-acceptance`
- `defect-triage`

Team profile fields:

- testing services offered
- supported stacks
- supported test tools
- manual vs automated coverage
- environments supported
- sample test plan
- sample evidence report
- average defect turnaround
- preferred project size
- availability
- verification status

Solo expert profile fields:

- testing specialty
- tools used
- evidence examples
- industries/domains
- supported engagement type
- availability
- join/team preference

Proof requirements:

- sample anonymized test plan
- sample defect report
- sample release acceptance checklist
- test automation repository or CI evidence where applicable
- owner review or completed delivery record

## 8. Matching Behavior

Owner matching should use:

- selected testing modules
- product stack
- product stage
- scanner/diagnosis findings
- browser/device requirements
- API complexity
- target launch date
- budget band
- desired automation depth
- team/expert evidence and reputation

Example match rationale:

> Northstar Engineers matches this Product Testing Pack because they provide API testing, E2E flow testing, and release acceptance evidence for React/Postgres products. Their profile includes CI test automation proof and prior launch-readiness delivery records.

## 9. Workspace Behavior

When a Testing Pack becomes a workspace, create milestone templates:

1. Test Scope and Criteria
   - acceptance criteria approved
   - environments and test data confirmed
   - critical flows listed

2. Test Execution
   - smoke tests executed
   - E2E scenarios executed
   - API tests executed if selected
   - defects logged and prioritized

3. Fix Verification
   - high-priority fixes verified
   - regression checks passed
   - failed criteria explained

4. Release Acceptance
   - readiness report attached
   - unresolved risks listed
   - owner go/no-go decision recorded

Evidence requirements:

- test plan
- executed test report
- defect list
- screenshots or videos for UI defects where relevant
- API test output
- CI test output if automation is included
- release acceptance checklist
- owner approval or request-changes decision

## 10. AI Support

AI should support testing but not replace QA ownership.

AI can:

- recommend testing modules from product context
- summarize scan and diagnosis signals into testing scope
- draft test plan outline
- propose acceptance criteria
- explain defect impact
- summarize evidence for owner review
- compare team/expert testing capabilities
- identify missing evidence before release acceptance

AI must not:

- certify product quality
- approve release acceptance
- mark tests as passed without evidence
- fabricate test results
- create invitations or contracts
- mutate workspace state without explicit user confirmation

LoomAI context:

- safe indexed knowledge: service modules, testing templates, acceptance criteria templates, team/solo public testing capabilities
- live context: selected product, selected package, current findings, current workspace/milestone evidence

## 11. UI Plan

Owner surfaces:

- Service catalog: Testing category or "Product Testing Pack" card.
- Product cart: selected testing services with dependencies and add-ons.
- Package builder: testing scope, milestones, evidence requirements, and budget/timeline.
- Team matching: teams/experts filtered by testing capability.
- Workspace: testing milestones, defect triage, evidence checklist, release acceptance summary.

Team/solo expert surfaces:

- Profile edit: testing services offered.
- Capability proof upload.
- Availability and preferred testing engagement size.
- Evidence examples.
- Delivery record/reputation for testing work.

Admin surfaces:

- Manage testing service modules.
- Manage testing package templates.
- Verify team/expert testing proof.
- Review AI capability contracts for testing recommendations.

## 12. Backend Implementation Plan

1. Catalog seed updates
   - Add `quality-testing` category.
   - Seed the testing service modules listed above.
   - Seed Testing Pack package templates.
   - Add dependency and recommendation rules.

2. Team capability updates
   - Add testing capability tags and proof metadata.
   - Ensure teams and solo experts can declare testing services.
   - Add matching weight for testing capability and evidence quality.

3. Package/workspace updates
   - Generate testing-specific milestones and deliverables.
   - Generate evidence requirements for test reports and acceptance checklists.
   - Add defect triage deliverable type if not already represented.

4. AI/export updates
   - Include testing modules/templates in managed vectorization export.
   - Include team/solo testing public capabilities in safe export.
   - Add AI query contexts for testing recommendation and evidence review.

5. Audit and governance
   - Audit Testing Pack creation, service selection, team assignment, release acceptance, and risk acceptance.
   - Keep final release acceptance human-confirmed.

## 13. Testing And Verification Plan

Backend tests:

- service module seed includes `quality-testing`
- package template includes expected testing modules
- dependency rules fire correctly
- recommendations trigger from `no tests`, launch, frontend, API, and scanner finding signals
- team matching ranks testing-capable teams higher for Testing Pack
- workspace conversion creates testing milestones and evidence requirements

Frontend tests:

- owner can add Product Testing Pack to cart
- dependencies and optional add-ons render correctly
- team profile can publish testing capabilities
- matching page shows testing rationale
- workspace shows test evidence checklist and release acceptance state

Live smoke:

1. Create owner product with known risk "no tests and launch soon".
2. Confirm Testing Pack is recommended.
3. Add Testing Pack to cart.
4. Convert to package/workspace.
5. Confirm testing milestones and evidence requirements exist.
6. Create or update a team profile with testing capability.
7. Confirm the team appears in matching.
8. Ask AI to explain why the Testing Pack was recommended.

## 14. Review Questions

- Should the primary owner-facing name be "Product Testing Pack" or "Release Confidence Pack"?
- Should testing be its own top-level service category, or a package template spanning Validation, Cloud/DevOps, Scaling, Launch Readiness, and Support?
- Should teams be allowed to offer the full pack only after verification, or can unverified teams offer it with lower ranking?
- Should load testing remain an add-on only, given staging safety requirements?
- Should accessibility testing be included by default or as an optional add-on?
- Should we include mobile-device testing as a separate module in the first pass?
