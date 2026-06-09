# ProdUS Business Requirements Document

Date: 2026-05-31  
Audience: product owners, technical founders, enterprise innovation teams, agencies, advisors, and delivery stakeholders  
Document purpose: define the external business case, product wedge, buyer value, and required capabilities for ProdUS.

## 1. Executive Summary

ProdUS is an AI-supported production-readiness diagnosis and productization planning system.

Its first business promise is intentionally narrow:

> ProdUS helps an owner understand what is blocking a project from becoming production-ready, what evidence supports that diagnosis, and which lifecycle services are needed to fix it.

Many software projects demonstrate well but are not ready for production. They may lack deployment automation, security review, test evidence, monitoring, data migration proof, operational ownership, or launch readiness. Owners often know the project has potential, but they do not know what production gaps matter most or how to convert those gaps into an actionable plan.

ProdUS addresses that gap by accepting messy owner input, repository links, product documents, and product URLs, then producing a specific production-readiness diagnosis and productization action plan.

The service catalog, project workspace, scanner evidence, and team/expert matching exist to support this core diagnostic promise. They should not be presented as separate products. They are downstream workflow for owners who accept the diagnosis and want to act on it.

## 2. Core Business Hypothesis

ProdUS succeeds only if this assumption is true:

> ProdUS can produce a production-readiness diagnosis that is specific, trustworthy, and actionable enough that an owner changes what they do next.

If the diagnosis is generic, the rest of the platform does not matter. If the diagnosis is credible, the owner will naturally need service recommendations, workspace planning, evidence tracking, and qualified delivery support.

The diagnosis is therefore the product wedge. The catalog, workspace, and talent network are expansion paths pulled by a successful diagnosis.

## 3. Business Problem

Projects commonly get stuck between prototype and product.

Typical owner questions:

- Is this ready for customers?
- What risks would block launch?
- What evidence do I need before production?
- What does the codebase, repository, or architecture suggest?
- Which services do I need: testing, security, cloud, monitoring, database, launch, or support?
- What should I ask a delivery team to do?
- Who is qualified to help?

Current alternatives are incomplete:

- Generic AI can summarize a repository or document but usually lacks governed productization workflow, evidence tracking, catalog-backed actions, and accountability.
- Project-management tools track work after somebody defines it, but they do not diagnose production readiness.
- Marketplaces list providers, but they do not tell the owner what work should be requested.
- Consultants can perform readiness reviews, but the process is manual, inconsistent, and hard to turn into repeatable workflow.

ProdUS should sit before delivery execution. It helps define what needs to happen and why.

## 4. Primary Buyer And User Focus

The primary buyer is not every early founder with an idea. The strongest fit is a serious owner who cares about launch risk, evidence, and delivery accountability.

Primary buyer segments:

- B2B product owners preparing a product, portal, platform, or internal tool for production
- enterprise innovation teams moving prototypes into governed delivery
- agencies or studios that need to assess client projects before committing delivery teams
- technical founders preparing a serious product for pilot, customer use, or investor/customer diligence
- advisors who need a structured way to review product readiness

Secondary users:

- specialist engineering teams
- solo technical experts
- reviewers and advisors
- operations or platform owners

The user experience should serve owners first. Teams and experts matter only after the owner has a clear diagnosis and action plan.

## 5. Product Positioning

Primary positioning:

> ProdUS diagnoses what blocks your project from production and turns it into an actionable productization plan.

Short positioning:

> From prototype to production-ready plan.

What ProdUS is:

- a production-readiness diagnosis system
- a productization action-planning tool
- a catalog-backed service recommendation engine
- a governed evidence and workspace layer for acting on the diagnosis

What ProdUS is not:

- a generic chatbot
- a generic task manager
- a broad freelance marketplace
- a replacement for GitHub, Jira, CI/CD, cloud, or monitoring tools
- an automatic production approval system

## 6. Product Scope Model

### 6.1 Core Wedge: Diagnosis And Action Plan

This is the primary product.

Required capabilities:

- collect owner brief, repository URL, product URL, documents, and known risks
- analyze business context and technical evidence
- identify production blockers
- explain evidence and missing evidence
- prioritize risks
- recommend lifecycle services from the ProdUS catalog
- state the next owner decision

### 6.2 Downstream Workflow: Service Plan And Workspace

This exists only after the owner accepts the diagnosis.

Required capabilities:

- convert recommended services into selected services
- show required dependencies before workspace start
- create a service plan
- create milestones and evidence expectations
- preserve repository and scanner focus
- create a governed workspace for action

### 6.3 Later Expansion: Team And Expert Network

This should be activated when owners ask who can fix the identified gaps.

Required capabilities:

- match teams and experts to selected lifecycle services
- show verification, availability, and capability fit
- support shortlist, compare, and invite flows
- keep participant and access decisions under owner control

The team/expert network should not be the first business bet. It should be pulled by owner demand after diagnosis proves value.

## 7. Core User Journey

The first externally validated journey should be:

```text
Owner provides messy context
  -> ProdUS runs AI-supported readiness analysis
  -> ProdUS produces diagnosis and evidence summary
  -> ProdUS maps blockers to catalog services
  -> owner reviews recommended service plan
  -> ProdUS shows required missing dependencies
  -> owner creates workspace only when setup is credible
  -> owner sees scanner focus, milestones, evidence, and delivery options
```

The user should always understand:

- what ProdUS found
- why it matters
- what evidence was used
- what evidence is missing
- what service should address it
- what the owner should do next

## 8. Business Capabilities

### 8.1 Intake And Evidence Collection

ProdUS must accept incomplete, messy owner input.

Inputs may include:

- natural-language project description
- product URL
- repository URL
- uploaded documents
- architecture notes
- launch concerns
- known risks
- target users or customer context

Business requirement:

- the owner should not need to write a perfect brief
- ProdUS should separate explicit owner input from AI inference
- selected documents must show use evidence or not-used reason

### 8.2 Production-Readiness Diagnosis

The diagnosis must be the highest-quality output in the system.

It should include:

- readiness summary
- prioritized blocker list
- severity
- evidence used
- missing evidence
- scanner-backed facts when available
- technical and business implications
- recommended owner decision
- confidence or limitation notes

Business requirement:

- the diagnosis must be specific enough that an owner can act on it
- it must avoid overclaiming when evidence is missing
- it must be understandable to business users and credible to technical reviewers

### 8.3 Catalog-Backed Service Recommendations

Every recommended service should map to a real ProdUS lifecycle service.

Service recommendation should include:

- service name
- catalog module code
- business outcome
- reason it was recommended
- blocker or evidence signal that triggered it
- required dependencies
- whether it is required before workspace start

Business requirement:

- AI must not return vague free-text service names as primary recommendations
- if AI identifies a need that is not covered by the catalog, it should report a catalog gap

### 8.4 Dependency Guardrails

ProdUS must prevent weak or incomplete workspace creation.

Example:

- if cloud deployment is selected, CI/CD and monitoring may be required
- if launch readiness is selected, testing and acceptance evidence may be required
- if security hardening is selected, secrets scanning or auth review may be required

Business requirement:

- missing required services must be shown before workspace start
- blockers must explain business reason, not only technical dependency
- owner should be able to resolve missing dependencies in-flow

### 8.5 Workspace Conversion

When the owner creates a workspace, it should not be empty.

It should carry forward:

- product profile
- repository/source setup
- scanner focus areas
- selected services
- service plan
- milestones
- evidence expectations
- diagnosis summary
- recommended next actions

Business requirement:

- workspace creation should feel like turning diagnosis into action
- the next step after workspace creation should be obvious

### 8.6 Team And Expert Matching

Team and expert matching should be driven by the selected service plan.

Matching should consider:

- service capabilities
- domain fit
- technical skills
- availability
- verification status
- reputation
- prior work

Business requirement:

- matching is useful only when it answers “who can fix the diagnosed gaps?”
- owner must control shortlist, invitation, participant, and access decisions

## 9. AI Requirements

AI in ProdUS should be governed and contextual.

AI should:

- help structure messy owner input
- analyze selected documents and repository context
- explain findings in business language
- map diagnosis to catalog services
- prepare next decisions
- support project creation when the owner chooses the AI-assisted path

AI should not:

- operate as an uncontrolled browser-side chatbot
- approve production readiness
- choose teams or participants without owner approval
- expose private documents
- invent services outside the catalog without marking them as catalog gaps
- hide uncertainty

## 10. Trust And Governance Requirements

ProdUS must be trusted by owners and delivery stakeholders.

Required trust controls:

- role-based access
- owner-controlled document sharing
- no public exposure of private project documents
- backend-mediated AI calls
- no browser-side AI secrets
- auditable AI-assisted creation
- scanner evidence traceability
- clear separation between AI advice and system actions
- structured error handling for blocked workspace conversion

## 11. Differentiation

ProdUS must answer why an owner should not simply paste a repository into a general AI tool and hire a contractor.

The differentiation should be:

- specific production-readiness diagnosis, not generic advice
- scanner and evidence-backed findings
- catalog-backed services that convert diagnosis into action
- dependency guardrails before delivery starts
- governed workspace and audit trail
- optional delivery team/expert matching after the plan is clear

The strongest defensible advantage is not AI alone. It is the combination of AI, evidence, catalog, workflow, and governance.

## 12. Commercial Direction

Recommended commercial entry point:

- paid readiness diagnosis or productization assessment
- SaaS subscription for repeated productization assessments
- agency/team account for assessing incoming client projects
- later service-plan or marketplace transaction revenue after demand is proven

Do not lead with marketplace revenue until owner demand and provider liquidity are demonstrated.

## 13. Success Metrics

The next validation phase should measure:

- percentage of diagnoses rated useful by owners
- percentage of diagnoses rated credible by technical reviewers
- percentage of AI recommendations mapped to catalog services
- percentage of created projects with repository/source configured
- percentage of workspaces created with service plan and evidence expectations
- average time from owner input to actionable diagnosis
- number of missing dependencies resolved before workspace start
- owner willingness to pay for the diagnosis/action plan
- delivery-team assessment of scope clarity

## 14. External Validation Questions

For owners:

- Did ProdUS understand your project?
- Did the diagnosis identify real blockers?
- Did it explain what evidence was used?
- Did it tell you what to do next?
- Would you trust this enough to change your launch or delivery plan?
- Would you pay for this assessment?

For technical reviewers:

- Is the diagnosis specific or generic?
- Are the findings technically defensible?
- Are missing evidence and uncertainty handled honestly?
- Are the recommended services appropriate?

For delivery teams:

- Would this diagnosis help scope work?
- Are the service recommendations actionable?
- Is the workspace setup enough to start delivery planning?

## 15. Acceptance Criteria

ProdUS is ready for serious external validation when:

- an owner can provide a rough brief, repo link, and document
- ProdUS returns a specific readiness diagnosis
- the diagnosis includes evidence used and missing evidence
- recommended services map to real catalog services
- required dependencies are clearly identified
- the owner can create a workspace that carries forward repository, scanner focus, service plan, milestones, and evidence expectations
- the owner understands the next decision
- a technical reviewer considers the diagnosis credible
- a delivery team can scope initial work from the output

## 16. Strategic Boundary

Until the diagnosis is proven, ProdUS should not expand the external story around:

- broad expert community
- generic marketplace
- complex social collaboration
- non-productization AI actions
- large admin surfaces
- generic project management

Those capabilities should support the readiness diagnosis and productization action plan, not compete with them for product focus.

