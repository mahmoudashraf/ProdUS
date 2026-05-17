# ProdUS Catalog Engine Phased Implementation Plan

## Source And Scope

Source proposal: [catalog.md](./catalog.md)

This plan converts the catalog proposal into implementation phases for ProdUS. The catalog file remains the source reference for detailed service descriptions, package examples, dependency rules, AI modules, and schema ideas.

The implementation target is the ProdUS productization engine:

- ProdUS Studio owns product intake, diagnosis, service catalog, package builder, service plan, delivery workspace, evidence, review, handoff, and support.
- ProdUS Network owns expert/team profiles, team formation, capability proof, communication, join requests, trials, reputation, and team matching surfaces.
- Admin owns catalog management, templates, dependency rules, team verification, AI configuration, audit, and marketplace controls.

Product-facing wording should avoid early-stage shorthand. Use "prototype", "working prototype", "foundation", "stabilization", "launch readiness", or "production readiness". Keep source terminology only as historical context, not final UI copy.

## Implementation Status - 2026-05-17

Status: implemented and verified locally.

Completed scope:

- Backend catalog foundation: enriched service modules, dependency metadata, package templates, catalog rules, template definitions, and AI capability contracts.
- Catalog seed: 8 service layers, 75 production-ready service modules, 12 package templates, dependency rules, template definitions, and disabled AI capability configs.
- Catalog APIs: public catalog reads, rule evaluation, package template reads, template definition reads, AI capability contract reads, and admin catalog visibility.
- Owner flow: service catalog cards add real services to the draft cart, catalog dependency recommendations update from backend state, blockers prevent project start in UI, and conversion creates package modules, milestones, and evidence deliverables.
- Admin flow: catalog coverage, service modules, package templates, rules, template definitions, and AI-ready contracts are visible in the admin catalog surface.
- AI readiness: schema and APIs expose deterministic context contracts and governance flags, with `aiReady=true` and `aiExecuted=false`; no AI provider execution is implemented.

Verification:

- Backend compile: `mvn -q -DskipTests compile`
- Backend tests: `mvn -q test`
- Frontend type validation and production build: `npm run build`
- Frontend tests: `npm test -- --runInBand`
- Live backend smoke: `http://localhost:8080/actuator/health`, 8 categories, 75 modules, 12 package templates, 6 disabled AI capability contracts.
- Live owner cart smoke: mock owner login, add deployment services, dependency blockers clear after required services are added, convert cart into package/workspace, confirm 3 package modules, 3 milestones, and 2 deliverables on first milestone.
- Live frontend smoke: production frontend served `http://localhost:3000/services` with HTTP 200.

Production follow-up:

- Run the Postgres Liquibase container test on a machine with Docker available. The Maven test run passes locally, but Testcontainers reports Docker socket unavailable in this environment and skips the container-backed assertion.

## Product Thesis

ProdUS should not become a generic marketplace or task board. The platform should be a dependency-aware productization operating system.

The core engine is:

Evidence -> Finding -> Service -> Package -> Dependency -> Milestone -> Evidence -> Review -> Handoff -> Reputation

This chain is the implementation spine. Every phase below exists to strengthen that chain.

## Existing Repo Mapping

Current backend already has several foundational objects:

- `ProductProfile` maps to Product.
- `RequirementIntake` maps to Product Intake.
- `ServiceCategory`, `ServiceModule`, and `ServiceDependency` map to Service Catalog.
- `PackageInstance` and `PackageModule` map to Package and Package Services.
- `ProjectWorkspace`, `Milestone`, and `Deliverable` map to Workspace, Milestone, and work outputs.
- `EvidenceAttachment` maps to Evidence.
- `AIRecommendation` maps to AI recommendation artifacts.
- `Team`, `ExpertProfile`, `TeamCapability`, `TeamShortlist`, `TeamReputationEvent`, `TeamJoinRequest`, `TeamInvitation`, and Network entities map to talent, matching, collaboration, and reputation.
- `SupportSubscription`, `SupportRequest`, `DisputeCase`, `ContractAgreement`, and `InvoiceRecord` map to support, escalation, and commercial workflow.

The plan should evolve these models instead of replacing them.

## Target Domain Objects

Implement or enrich these objects:

- Product: owner prototype, SaaS, app, tool, or live product.
- Product Version: optional later layer for tracking diagnosis and delivery per release.
- Product Intake: structured owner answers, access status, risk signals, goals, budget, timeline, team status.
- Diagnosis: evidence-based product readiness assessment.
- Finding: issue, gap, risk, blocker, or improvement opportunity.
- Service Module: reusable productization service with triggers, dependencies, evidence, acceptance criteria, team capability needs, AI assistance, and human review rules.
- Package Template: reusable package recipe.
- Package Instance: owner/product-specific package generated from templates, findings, and selected services.
- Dependency Rule: hard, soft, parallel, approval, evidence, access, risk, and commercial dependency.
- Milestone Template: reusable delivery stage.
- Milestone: package/workspace delivery checkpoint.
- Acceptance Criterion: testable requirement for milestone or deliverable approval.
- Evidence Requirement: required proof type for acceptance.
- Evidence Item: uploaded or linked proof.
- Automated Check: scanner, CI run, uptime check, dependency scan, deployment check, or validation script result.
- Review: human acceptance, rejection, request changes, or approval record.
- Handoff Document: final operational handoff.
- Support Plan: ongoing maintenance and operations scope.
- Incident: support or production issue.
- Team Capability: service-module capability with proof, stack, domains, support availability, and delivery history.
- Delivery Record: completed package/milestone performance data used for reputation.
- AI Artifact: recommendation, finding rationale, confidence basis, evidence comparison, prompt version, and human decision.
- Audit Log: immutable administrative and high-risk workflow events.

## Service Layers To Preserve

The catalog proposal defines eight service layers. Keep all eight as the canonical taxonomy:

- Validation and Diagnosis
- Code Modernization and Rewrite
- Security Hardening
- Cloud, DevOps, and Deployment
- Database and Data Infrastructure
- Scaling and Performance
- Launch Readiness and GTM Enablement
- Support and Operations

## Service Catalog To Preserve

The initial mature catalog should preserve these service modules as structured data, even if only a smaller subset is enabled in the first production release.

Validation and Diagnosis:

- Product Readiness Diagnosis
- Technical Requirement Analysis
- Architecture Review
- Codebase Assessment
- Launch Risk Review
- Build-vs-Rebuild Assessment
- Product Scope Extraction
- Business/Product Alignment Review

Code Modernization and Rewrite:

- Code Refactor
- Backend Rewrite
- Frontend Rewrite
- No-Code to Custom Migration
- AI-Built App Cleanup
- API Redesign
- Authentication Rebuild
- Multi-Tenant SaaS Refactor
- Legacy Modernization

Security Hardening:

- Security Readiness Review
- Secrets Scan and Remediation
- Authentication Review
- Authorization / RBAC Review
- API Security Review
- Dependency Vulnerability Review
- Payment Flow Review
- Data Privacy Review
- Security Fix Sprint
- Security Evidence Review

Cloud, DevOps, and Deployment:

- Cloud Deployment Setup
- Staging / Production Environment Setup
- CI/CD Pipeline Setup
- Rollback Process Setup
- Monitoring Setup
- Logging and Alerting Setup
- Backup and Restore Setup
- Infrastructure Cost Review
- Environment Configuration Audit
- Deployment Handoff

Database and Data Infrastructure:

- Database Review
- Schema Redesign
- Data Migration Planning
- Data Migration Execution
- Query Performance Optimization
- Backup and Restore Validation
- Data Integrity Review
- Analytics Readiness Setup
- Multi-Tenant Data Isolation Review

Scaling and Performance:

- Performance Audit
- Load Testing
- Frontend Performance Optimization
- Backend Performance Optimization
- Database Performance Optimization
- Caching Strategy Setup
- Queue / Async Processing Setup
- Scale Architecture Review
- Cost-to-Scale Review

Launch Readiness and GTM Enablement:

- Launch Readiness Review
- User Onboarding Review
- Admin Console Setup
- Analytics Setup
- Payment / Subscription Setup
- Email / Notification Setup
- Customer Support Readiness
- Documentation Setup
- Beta Launch Management
- Go-Live Checklist Execution

Support and Operations:

- Basic Maintenance
- Operational Monitoring
- Incident Response Setup
- Bug Triage Workflow
- Release Management
- Monthly Product Health Review
- Security Patch Management
- Cloud Cost Monitoring
- Support Handoff
- Growth Support Retainer

## Package Templates To Preserve

Implement these as `package_templates` with services, phases, dependency rules, estimated duration, budget band, target customer, and human review flags:

- Prototype Stabilization: source proposal frames this as early-stage stabilization.
- SaaS Launch Readiness.
- No-Code to Custom Migration.
- AI-Built App Cleanup.
- Security Hardening.
- Cloud / DevOps Foundation.
- Database Rescue.
- Scale Readiness.
- Mobile Optimization.
- Fintech Productization.
- Enterprise Pilot Readiness.
- Ongoing Product Operations.

## Template Library To Preserve

Intake templates:

- Product Intake Form
- Repo Access Request
- Deployment Access Request
- Security Intake
- Database Intake
- Support Intake
- Launch Intake
- Team Intake

Diagnosis templates:

- Product Readiness Scorecard
- Security Risk Matrix
- Deployment Readiness Checklist
- Database Risk Report
- Codebase Health Report
- Launch Blocker Report
- Build-vs-Rebuild Recommendation
- Service Recommendation Report

Package templates:

- Prototype Stabilization Package
- SaaS Launch Readiness Package
- No-Code Migration Package
- AI-Built App Cleanup Package
- Security Hardening Package
- Cloud Foundation Package
- Database Rescue Package
- Scale Readiness Package
- Mobile Optimization Package
- Enterprise Pilot Package
- Fintech Productization Package
- Ongoing Operations Package

Milestone templates:

- Diagnosis Complete
- Scope Approved
- Access Ready
- Security Review Complete
- CI/CD Setup Complete
- Staging Environment Ready
- Database Migration Complete
- Monitoring Live
- Launch Checklist Passed
- Handoff Complete
- Support Started

Acceptance criteria templates:

- Security Criteria
- Deployment Criteria
- Database Criteria
- Performance Criteria
- Launch Criteria
- Support Criteria
- Handoff Criteria

Evidence templates:

- Repo Evidence
- Scan Evidence
- Deployment Evidence
- Monitoring Evidence
- Database Evidence
- Security Evidence
- Performance Evidence
- Handoff Evidence
- Support Evidence

## Dependency Rules To Preserve

Implement a rule engine with these dependency types:

- Hard dependency
- Soft dependency
- Parallel dependency
- Approval dependency
- Evidence dependency
- Access dependency
- Risk dependency
- Commercial dependency

Seed these first dependency rules:

- Cloud deployment should recommend staging, monitoring, and backup setup.
- Launch readiness cannot be approved without security, monitoring, and backup checks.
- Data migration execution requires migration plan, backup setup, and backup validation.
- Security fix sprint requires evidence review and scan/remediation evidence before acceptance.
- Load testing requires staging and must not run against production by default.
- Support package requires handoff and monitoring baseline.

## AI Modules To Preserve

AI must assist but not make final approvals. Implement these modules as explicit capabilities with prompt/config records, output schemas, confidence, and audit:

- Intake Copilot
- Diagnosis Copilot
- Service Recommendation Engine
- Package Composer
- Milestone Generator
- Evidence Reviewer
- Team Matching AI
- Delivery Risk Monitor
- Handoff Copilot
- Support Intelligence

All AI outputs must include:

- confidence level: high, medium, low
- confidence basis: scan result, user input, repo signal, missing data, inference
- recommended next action
- human review requirement
- source evidence references where available

Forbidden AI claims:

- final approval
- legal certification
- compliance certification
- security certification
- production deployment without approval
- payment release without human approval

## Phase 0 - Catalog Normalization And Product Boundary

Status: Pending

Objective:

Turn the proposal into canonical ProdUS language, taxonomy, and implementation boundaries.

Backend:

- Add catalog constants or seed definitions for service layers.
- Normalize slugs to stable identifiers, for example `security.api_review` and `cloud.cicd_setup`.
- Define product-facing names separate from internal stable IDs.
- Keep source aliases for future migration from existing seed slugs.

Frontend:

- Update Studio wording to explain Lifecycle Services as productization services.
- Use owner-first language: "Select services", "Create service plan", "Start productization workspace".
- Keep Network copy focused on experts, teams, formation, and reputation.

Admin:

- Add catalog governance rules to docs before exposing editable catalog UI.

Acceptance:

- Canonical service layers and package names are documented.
- Product-facing language uses mature productization terms.
- Studio/Network boundaries are explicit.

## Phase 1 - Service Catalog Foundation

Status: Pending

Objective:

Make `service_modules` rich enough to power recommendations, package building, team matching, and evidence requirements.

Backend:

- Extend `ServiceModule` with:
  - stable service code
  - layer
  - triggers
  - required inputs
  - required evidence types
  - typical milestones
  - suggested team roles
  - AI assistance tags
  - human review required
  - enabled/visible flags
  - maturity level or release stage
- Add or enrich `ServiceDependency` with:
  - dependency type
  - severity
  - source service
  - target service
  - message
  - rule metadata
- Add seed data for the service catalog listed above.
- Preserve existing service-module IDs by migration, not destructive replacement.

Frontend:

- Upgrade `/services` and Studio service selection to show:
  - layer
  - outcome copy
  - required inputs
  - expected deliverables
  - evidence requirements
  - dependencies
  - "Add to service plan" action
- Ensure all service actions mutate cart/service-plan backend state.

Tests:

- Repository tests for service module lookup by stable code.
- API tests for catalog listing and filtering by layer.
- UI smoke test for service selection and cart mutation.

Acceptance:

- Services are no longer static display cards.
- Every service has backend data for inputs, deliverables, acceptance criteria, evidence, and dependency metadata.

## Phase 2 - Package Templates And Template Library

Status: Pending

Objective:

Introduce reusable package recipes and reusable templates for intake, diagnosis, milestones, acceptance criteria, evidence, handoff, and support.

Backend:

- Add `package_templates`.
- Add `package_template_services`.
- Add `template_definitions` or scoped template tables for:
  - intake
  - diagnosis
  - package
  - milestone
  - acceptance criterion
  - evidence
  - handoff
  - support
- Seed all package templates listed in this plan.
- Seed milestone, acceptance, and evidence templates listed in this plan.
- Add admin-only APIs to list templates.

Frontend:

- Add Admin Catalog Manager read view.
- Add Studio package-template selection and preview.
- In owner flows, present packages as outcomes:
  - stabilize prototype
  - prepare for launch
  - clean AI-built code
  - harden security
  - set up cloud foundation
  - prepare enterprise pilot
  - start product operations

Tests:

- Template seed migration tests.
- Package template API tests.
- UI smoke test for package template preview.

Acceptance:

- A package template can be selected and expanded into package services.
- Templates include milestones, criteria, and evidence requirements.

## Phase 3 - Product Intake And Diagnosis

Status: Pending

Objective:

Convert owner input into structured product data, diagnosis records, and findings.

Backend:

- Extend `RequirementIntake` or add richer `product_intakes`.
- Add `diagnoses`.
- Add `findings`.
- Add finding severity, confidence, category, affected layer, source, status, and recommended services.
- Add links from diagnosis to product, product version when available, intake, findings, and AI recommendation artifacts.
- Store access readiness signals:
  - repo access
  - deployment access
  - database access
  - security/auth context
  - analytics/support context

Frontend:

- Build owner Product Intake UI in Studio as a guided product profile flow.
- Add Diagnosis Dashboard:
  - readiness score
  - findings grouped by layer
  - severity filters
  - missing access or missing evidence
  - suggested services
  - AI confidence labels
- Make "create service plan" the next action from diagnosis.

AI:

- Implement Intake Copilot output schema.
- Implement Diagnosis Copilot output schema.
- Persist AI confidence basis and human review requirement.

Tests:

- Intake create/update tests.
- Diagnosis/finding API tests.
- AI output parser/schema tests using mocks.
- UI smoke test for intake -> diagnosis -> findings.

Acceptance:

- Owner can submit structured product intake.
- System can create diagnosis and findings.
- Findings can recommend services.
- AI output is clearly marked as recommendation, not final decision.

## Phase 4 - Finding-To-Service Mapping And Dependency Engine

Status: Pending

Objective:

Make recommendations deterministic enough to be trusted, with AI support layered on top.

Backend:

- Add `finding_service_mappings`.
- Add `dependency_rules`.
- Add a `DependencyEvaluationService`.
- Add a `ServiceRecommendationService`.
- Support rule outputs:
  - required service
  - recommended service
  - warning
  - blocker
  - missing input
  - missing evidence
  - approval needed
- Implement source rules from catalog:
  - no staging -> cloud deployment, staging, CI/CD
  - manual deployment -> CI/CD, release management
  - no monitoring -> monitoring, logging/alerting
  - no backups -> backup/restore, database review
  - exposed secrets -> secrets scan/remediation, security fix sprint
  - weak authentication -> auth review, auth rebuild
  - no RBAC -> RBAC review, admin console setup
  - outdated dependencies -> dependency review, patch management
  - no tests -> codebase assessment, test/QA criteria
  - slow APIs -> performance audit, backend optimization
  - slow queries -> database review, query optimization
  - no analytics -> analytics setup, launch readiness
  - no support process -> support readiness, bug triage, support plan
  - no documentation -> documentation setup, handoff
  - no-code limitations -> build-vs-rebuild, no-code migration
  - messy AI-generated code -> AI-built app cleanup, code refactor
  - high cloud cost -> cost review, cost-to-scale review
  - payment risks -> payment flow review, security review
  - sensitive customer data -> data privacy review, security hardening

Frontend:

- Show recommendation rationale in Studio.
- Show dependency warnings in package builder.
- Differentiate hard blockers from recommended additions.
- Let owner remove optional services but not silently bypass hard dependencies.

AI:

- Implement Service Recommendation Engine as an explainer and confidence scorer, not the sole recommender.

Tests:

- Unit tests for dependency-rule evaluation.
- Mapping tests for each seeded finding type.
- API tests for package recommendation responses.

Acceptance:

- Recommendations are explainable and reproducible.
- Hard dependencies cannot be bypassed without an explicit approval path.

## Phase 5 - Dependency-Aware Package Composer And Service Plan

Status: Pending

Objective:

Convert selected goals, findings, services, package templates, and dependency rules into a concrete service plan.

Backend:

- Add package composer service.
- Extend `PackageBuilderService`.
- Support owner goals:
  - launch
  - scale
  - fix security
  - move from no-code
  - stabilize AI-built app
  - start ongoing support
- Generate:
  - package name
  - service modules
  - required vs optional flags
  - dependency warnings
  - rationale
  - duration band
  - budget band
  - milestone phases
  - acceptance criteria
  - evidence requirements
- Convert draft cart to service plan with preserved product context.

Frontend:

- Replace unclear cart language with "Draft Service Plan".
- Add a unified owner productization workspace:
  - product brief
  - selected services
  - service plan
  - dependency warnings
  - suggested package template
  - required evidence
  - recommended teams/experts
  - start workspace action
- Clarify every button:
  - Add service
  - Remove service
  - Resolve dependency
  - Review service plan
  - Create productization workspace
  - Compare teams

AI:

- Implement Package Composer.
- Store package rationale and confidence basis.

Tests:

- Cart-to-package tests.
- Package composer tests.
- Dependency warning UI smoke test.
- Button action tests for all primary commands.

Acceptance:

- Owner can move from product brief to service plan to package/workspace without confusion.
- Every visible package-builder action has backend effect.

## Phase 6 - Milestone, Acceptance Criteria, Evidence, And Review Engine

Status: Pending

Objective:

Make delivery evidence-based instead of task-board based.

Backend:

- Add `acceptance_criteria`.
- Add `evidence_requirements`.
- Add `automated_checks`.
- Add `reviews`.
- Link criteria to milestones, package modules, services, and evidence.
- Extend `Milestone` with:
  - phase
  - owner approver
  - assigned team/expert
  - dependency status
  - risk level
- Extend `Deliverable` or create evidence-centric deliverable model.
- Add review workflow:
  - submit evidence
  - request changes
  - approve criterion
  - approve milestone
  - reject with reason

Frontend:

- Upgrade workspace milestone review page:
  - criteria checklist
  - required evidence
  - automated check status
  - human reviewer
  - decision status
  - comments
  - approve/request changes actions
- Add Evidence Center filtered by:
  - repo
  - scan
  - deployment
  - monitoring
  - database
  - security
  - performance
  - handoff
  - support

AI:

- Implement Evidence Reviewer with outputs:
  - likely pass
  - likely fail
  - insufficient evidence
  - requires human review
- Never label evidence as certified, guaranteed, secure, or compliant.

Tests:

- Criteria and evidence API tests.
- Review permission tests.
- Evidence upload and attach tests.
- UI smoke test for milestone review.

Acceptance:

- A milestone cannot be accepted without required criteria and evidence state.
- Automated checks can support but not replace human approval where required.

## Phase 7 - Team Matching And Network Capability Integration

Status: Pending

Objective:

Connect Studio package requirements to Network expert/team capability proof.

Backend:

- Extend `TeamCapability` with:
  - service module code
  - domain tags
  - stack tags
  - evidence links
  - completed milestones
  - average acceptance rate
  - average delivery speed
  - evidence quality score
  - support availability
- Extend matching to score:
  - service fit
  - stack fit
  - domain fit
  - budget range
  - timeline availability
  - timezone/working style
  - evidence history
  - reputation
- Connect package instances to team shortlists and trial collaboration.

Frontend:

- Owner Studio:
  - recommended teams for this service plan
  - compare teams
  - shortlist team
  - invite existing team
  - invite solo expert
  - request intro
- Network:
  - capability editor for teams/experts
  - proof/evidence attachment to capabilities
  - join/team formation flows linked to service capabilities
  - trial collaboration linked to package/workspace

AI:

- Implement Team Matching AI as explanation layer for fit score and risk flags.

Tests:

- Matching score tests.
- Shortlist backend effect tests.
- Join/invitation/trial integration tests.
- UI smoke tests for owner compare and team capability edit.

Acceptance:

- Team recommendations are based on package service requirements, not generic profile text.
- Network reputation improves from completed delivery records.

## Phase 8 - Handoff, Support, Incidents, And Product Operations

Status: Pending

Objective:

Complete the productization lifecycle after delivery.

Backend:

- Add or enrich handoff documents.
- Add support plan templates.
- Extend `SupportSubscription` and `SupportRequest` for product operations packages.
- Add `Incident` if support requests are not enough for incident lifecycle.
- Link support plan to workspace, product, team, support SLA, and handoff evidence.
- Create monthly health review records.

Frontend:

- Add Handoff Center:
  - access checklist
  - runbooks
  - deployment ownership
  - known issues
  - monitoring links
  - support scope
  - final acceptance
- Add Support Dashboard:
  - active plan
  - requests/incidents
  - SLA status
  - monthly health review
  - risk trend
  - suggested next package

AI:

- Implement Handoff Copilot.
- Implement Support Intelligence.

Tests:

- Handoff completion tests.
- Support plan creation tests.
- Support SLA tests.
- UI smoke tests for handoff and support dashboard.

Acceptance:

- A completed workspace can move into handoff.
- A handoff can start a support plan.
- Support and operations feed back into product health and team reputation.

## Phase 9 - Admin Catalog, Template, Rules, And Governance Console

Status: Pending

Objective:

Give platform admins control over the engine without code changes for every service/template/rule update.

Backend:

- Admin APIs for:
  - service catalog manager
  - package template manager
  - template manager
  - dependency rule manager
  - team verification manager
  - AI prompt/config manager
  - review/audit log
  - dispute/escalation tools
  - marketplace control panel
- Add audit logging around catalog/rule/template edits.
- Add RBAC checks for all admin-only mutations.

Frontend:

- Add Admin Catalog Manager.
- Add Template Manager.
- Add Dependency Rule Manager.
- Add AI Config Manager.
- Add Team Verification Manager.
- Add audit/review console.

Tests:

- Admin permission tests.
- Audit log tests.
- Rule/template mutation tests.
- UI route and mutation smoke tests.

Acceptance:

- Admin can manage catalog mechanics safely.
- Every high-risk admin mutation is audited.

## Phase 10 - AI And Tool Integration Production Hardening

Status: Pending

Objective:

Connect diagnostics, scanning, repository signals, and AI workflow to production-safe integrations.

Backend:

- Extend MCP/API tool invocation records.
- Add integration records for:
  - GitHub repository analysis
  - CI/CD checks
  - dependency scanning
  - secrets scanning
  - deployment status
  - monitoring and uptime
  - database backup/check signals
- Persist tool results as evidence or automated checks.
- Add retry, rate limit, and audit behavior.
- Enforce least-privilege access and scoped tokens.

Frontend:

- Add Integration Setup in Studio:
  - connect repo
  - connect deployment
  - connect monitoring
  - connect issue tracker
  - connect support tool
- Show integration status in diagnosis, service plan, workspace, and evidence center.

AI:

- AI can summarize scan outputs and map them to findings.
- AI cannot claim security/compliance certification.

Tests:

- Mock integration tests.
- Tool invocation audit tests.
- Evidence creation from tool result tests.
- UI integration-state smoke tests.

Acceptance:

- Diagnostic and scanning integrations can feed findings, evidence, and automated checks.
- All tool activity is traceable.

## Cross-Phase Security And Production Requirements

Apply these requirements in every phase:

- Server-side authorization for every mutation.
- Role-aware behavior for owner, team manager, specialist, advisor, and admin.
- Audit logs for high-risk actions.
- Human approval required for reviews, security decisions, compliance-sensitive decisions, production deployments, and payment releases.
- Structured validation for every AI output.
- No hidden backend mutations from UI actions.
- No UI-only state for business-critical actions.
- PostgreSQL-compatible schema migrations.
- Supabase-backed user identity in production.
- Secure session-cookie path for subdomains in production.
- Mock users remain available only in development.

## Verification Strategy

Backend:

- Unit tests for recommendation, dependency evaluation, package composition, matching, review, and support logic.
- Controller tests for service catalog, package templates, diagnosis, findings, package builder, evidence, review, admin rules, and Network matching APIs.
- Migration validation against PostgreSQL where possible.

Frontend:

- Type checks for all DTOs.
- Component tests for critical form/action behavior.
- Live smoke tests against the backend for:
  - service add/remove
  - package compose
  - dependency warnings
  - workspace creation
  - evidence attach
  - milestone review
  - shortlist/team invite
  - support handoff

API smoke:

- owner intake -> diagnosis
- diagnosis -> findings
- findings -> service recommendations
- service plan -> package instance
- package -> workspace
- workspace -> evidence -> review
- handoff -> support plan
- package requirements -> team matching

## Recommended Build Order

1. Catalog schema and seed normalization.
2. Package templates and template library.
3. Diagnosis and findings.
4. Recommendation and dependency rule engine.
5. Package composer and service-plan UI.
6. Criteria, evidence requirements, automated checks, and reviews.
7. Studio unified owner productization workspace.
8. Network capability/matching integration.
9. Handoff and support operations.
10. Admin catalog/rules/templates/AI governance console.
11. Production tool integrations and diagnostics.

## Definition Of Done For The Catalog Engine

The catalog engine is complete when:

- Services are structured business objects, not cards.
- Package templates compose services into realistic delivery plans.
- Findings map to services through deterministic mappings and AI explanation.
- Dependency rules can block, warn, or recommend changes.
- Milestones are generated with acceptance criteria and evidence requirements.
- Evidence supports milestone review.
- Human approval is explicit.
- Team matching uses service capabilities and delivery evidence.
- Handoff and support close the lifecycle.
- AI recommendations are governed, auditable, and confidence-scored.
- Admins can manage catalog, templates, rules, verification, and AI config.
