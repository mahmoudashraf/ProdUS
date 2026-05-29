# ProdUS Platform BRD

Status: active product implementation  
Audience: product, engineering, delivery, AI integration, scanner, and operations teams  
Repository scope: full-stack ProdUS platform, including backend API, frontend UI, scanner integration, MCP/API contracts, and LoomAI-backed assistant workflows

## Page 1: Business Context

### 1. Executive Summary

ProdUS is an AI-assisted productization platform for turning prototypes, internal tools, and early product ideas into production-ready products with governed evidence, lifecycle services, expert delivery, and readiness tracking.

The platform is designed around a simple business problem: product owners often know what they want to ship, but they do not have a reliable path to prove production readiness. They need diagnosis, service planning, scanner evidence, delivery support, milestones, and expert teams in one coherent flow. ProdUS provides that flow through a productization studio for owners and a network for specialist teams and solo experts.

ProdUS is not a generic project management tool. It is a productization operating system. Its purpose is to help owners move from "I have a prototype" to "I have a product-level delivery workspace with evidence, owners, milestones, risks, and production-readiness decisions."

### 2. Business Objectives

The main objectives are:

- Help product owners create structured productization projects from natural input, links, repositories, and private documents.
- Diagnose product readiness using catalog knowledge, scanner findings, evidence, and owner-provided context.
- Recommend lifecycle services such as validation, code rewrite, cloud deployment, security hardening, database readiness, launch readiness, testing, and operations support.
- Let owners build packages and project carts that combine services, teams, solo experts, and workspace creation.
- Match owners with verified teams or solo experts based on capabilities, reputation, service fit, and availability.
- Provide workspaces that make milestones, evidence, blockers, participants, and delivery state visible.
- Use AI as a first-class assistant where it adds value, while keeping ProdUS as the system of record for authorization, business data, audit, and mutations.
- Keep private documents and product data protected, scoped, auditable, and available only to authorized users and approved AI flows.

### 3. Product Domains

ProdUS is organized into two primary product domains:

1. Studio

   Studio is the productization workspace for product owners. It covers product creation, AI project analysis, product diagnosis, scanner integration, lifecycle services, packages, carts, team shortlists, workspace delivery, milestones, evidence, and readiness decisions.

2. Network

   Network is the expert community and delivery-side experience. It covers team profiles, solo expert profiles, formation posts, expert discovery, invitations, join requests, team capabilities, trial collaborations, reputation, and service coverage.

The intended deployment model supports subdomains:

- `studio.produs.com` for productization and owner workflows.
- `network.produs.com` for expert community and team formation.
- Shared authentication should use a server-managed session cookie scoped to `.produs.com` when production auth is finalized.

### 4. Primary User Types

Product Owner:

Owns a prototype or product initiative. Needs to create a productization project, upload supporting context, connect source evidence, choose services, compare teams, and create a delivery workspace.

Team Lead:

Represents a specialist delivery team. Needs to maintain a team profile, publish capabilities, respond to opportunities, manage members, and prove delivery outcomes.

Solo Expert:

Works independently and may join teams, create a team, participate in expert community discussions, or be selected directly for focused productization work.

Admin or Operator:

Manages platform configuration, catalog quality, scanner readiness, production readiness, integrations, AI configuration, and operational governance.

AI Assistant:

Supports owner and operator workflows through analysis, summarization, recommendations, evidence explanation, scanner finding interpretation, and selected confirmed actions. AI does not replace authorization, audit, or business-state ownership in ProdUS.

## Page 2: Functional Scope

### 5. Core Productization Journey

The primary owner journey is:

1. Owner starts a productization project in Studio.
2. Owner describes the product naturally and may attach private documents, links, and repository URLs.
3. Owner chooses whether AI may assist with project analysis.
4. ProdUS stores uploaded documents privately and issues short-lived temporary AI URLs only for selected files.
5. LoomAI analyzes owner input and selected files, then returns structured project attributes and document-use evidence.
6. Owner reviews AI-generated project attributes.
7. Product/project creation occurs through the governed ProdUS action flow.
8. Owner runs diagnosis and connects repository or scanner sources.
9. ProdUS normalizes findings, evidence, and readiness state.
10. Owner selects lifecycle services and builds a package/cart.
11. Owner reviews matched teams and solo experts.
12. Owner creates a workspace with selected participants and delivery scope.
13. Teams and experts execute milestones, attach evidence, and resolve blockers.
14. Owner reviews product-level readiness and makes launch or remediation decisions.

### 6. AI-Assisted Project Creation

AI-assisted project creation is a two-step flow:

Step 1: Analysis

ProdUS sends LoomAI a backend-mediated `/query-once` request with:

- owner brief
- stage hint
- product URL
- repository URL
- known risks
- selected private document descriptors
- short-lived temporary document URLs
- instructions to return strict structured JSON

LoomAI must return:

- draft product name
- outcome summary
- business stage
- tech stack
- product URL
- repository URL
- risk notes
- analysis summary
- assumptions
- missing evidence
- per-document usage evidence

Documents must be passed to the model/provider as typed file URL inputs. ProdUS must not send private document excerpts as prompt text for this flow.

Step 2: Creation

After analysis, ProdUS creates a short-lived creation intent and provides an owner-approved action payload. The actual mutation is executed through the ProdUS backend action/MCP flow, with consent token, idempotency key, authorization, and audit enforcement.

AI may create the productization project record when the owner has opted into the AI flow. AI must not create teams, invites, participants, access lists, or selected experts in this stage.

### 7. Lifecycle Service Catalog

The catalog is the structured source of productization services, service modules, dependencies, packages, templates, and acceptance expectations.

Expected service areas include:

- Validation and readiness review
- Code rewrite and refactor
- Scaling and performance
- Cloud and DevOps
- Database readiness
- Security hardening
- Launch readiness
- Operations and support
- Testing pack and quality assurance
- Scanner and evidence enablement

The catalog must support:

- service categories
- service modules
- dependencies and conflicts
- package templates
- milestone templates
- acceptance criteria templates
- evidence templates
- AI-safe capability descriptions
- team and expert service coverage

Owners should be able to add services to a project cart and convert that cart into a productization workspace. Teams and solo experts should be able to declare which services they provide.

### 8. Scanner and Evidence Foundation

ProdUS supports repository and readiness scanning as part of product diagnosis. Scanner flows should support GitHub and GitLab source connections, manual public repository input, scanner job scheduling, normalized findings, evidence records, and status summaries.

Scanner categories include:

- secrets exposure
- dependency vulnerabilities
- container and image risk
- infrastructure as code quality
- static analysis
- CI/CD readiness
- test and coverage evidence
- deployment readiness
- monitoring and operations readiness
- database readiness

Findings should be normalized into product-level risk, severity, status, affected area, recommended fix, evidence source, and readiness impact.

### 9. Expert Network and Team Formation

The Network experience supports teams and solo experts who provide productization services.

It includes:

- team profile management
- solo expert profile management
- profile photos and cover photos
- bio and capability editing
- service coverage
- join requests
- invitations
- formation posts
- expert directory
- trial collaborations
- messaging and community interaction
- reputation and proof of work

Owner-facing team selection should be focused on product outcomes, not generic hiring. Owners need shortlists, compare views, service fit, reputation, availability, and clear actions to add teams or experts to a project cart.

## Page 3: Integration, Quality, and Readiness

### 10. AI Integration Requirements

ProdUS integrates with LoomAI through backend-mediated private runtime calls. The browser must never call LoomAI directly and must never receive runtime API keys, signing secrets, provider credentials, MCP secrets, or internal action credentials.

The integration must support:

- private runtime signed assertions
- canonical query payloads
- `/query-once` for non-conversational analysis
- `/query` for conversational assistant flows
- safe context enrichment from ProdUS backend
- read-only MCP actions for catalog, products, packages, workspaces, scans, findings, evidence, and milestone review
- confirmed write actions only where ProdUS has owner consent and audit enforcement
- managed vectorization for safe shared knowledge
- no indexing of private project documents unless explicitly designed and approved for a separate flow

For project creation documents:

- files remain private in ProdUS
- owner selects which files are shared with AI
- ProdUS creates short-lived temporary URLs
- LoomAI passes URLs as provider-native file inputs
- AI must return `documentUsage` for every selected document
- ProdUS treats missing evidence as not used
- access expires quickly and is revoked after project creation

### 11. Data and Authorization Requirements

ProdUS should use PostgreSQL as the primary database and Supabase for auth/users when production auth is configured. Temporary mocked auth may be used only for controlled staging validation.

Authorization requirements:

- owner data is restricted to the owner unless workspace participation grants access
- private attachments are restricted to owner and approved workspace participants
- AI document access is short-lived and token-based
- AI document URLs must not be stored in persistent chat history or logs
- every AI-created or AI-assisted mutation must be audited
- team membership, invitations, participant access, and milestone approval require human-controlled authorization

### 12. Non-Functional Requirements

Security:

- backend-only secrets
- no browser runtime secrets
- HMAC/private runtime assertion support for LoomAI
- webhook signature validation for providers
- secure object storage access patterns
- no raw temporary document token logging
- least-privilege action design

Reliability:

- transactional boundaries must make AI-accessible document tokens available before provider fetches
- idempotency keys must prevent duplicate AI action creation
- scanner jobs must record state transitions and failure reasons
- integrations must fail closed when authorization or evidence is missing

Usability:

- Apple-inspired clean interface
- role-specific dashboards for owners, teams, solo experts, and admins
- clear AI evidence and "used/not used" states
- no unclear buttons or fake actions
- every visible action should have a backend effect or a disabled state with reason
- responsive mobile-friendly layouts

Auditability:

- record human initiator
- record AI provider request id
- record action payload provenance
- record product, workspace, scanner, and evidence mutations
- expose operational status for admins

### 13. Current Technical Shape

Backend:

- Java Spring Boot API
- PostgreSQL-compatible persistence
- scanner and connector services
- MCP server/API support
- LoomAI backend adapter
- object storage abstraction
- audit and authorization services

Frontend:

- Next.js
- role-aware Studio and Network UI
- owner productization flows
- AI project creation UI
- service catalog and cart UI
- expert network UI
- scanner and evidence UI

Infrastructure:

- Docker-ready backend and frontend
- staging deployment on Coolify
- staging API and UI are separated
- scanner runtime image includes production scanning tools

### 14. Success Metrics

Product success should be measured by:

- time from owner intake to created productization project
- percentage of projects with scanner evidence attached
- percentage of AI project analyses with document usage evidence
- service package creation rate
- workspace creation rate from project carts
- milestone evidence completion rate
- reduction in unresolved readiness blockers
- owner acceptance of AI-generated project attributes
- team/expert response and match conversion rates
- production readiness score improvement over time

### 15. Out of Scope for Initial Production Readiness

The following should not be treated as complete until explicitly implemented and validated:

- autonomous AI team invitation
- autonomous participant access changes
- autonomous milestone approval
- autonomous production launch approval
- permanent indexing of private owner documents
- payment release automation
- compliance certification claims without human review
- production auth without proper Supabase/session configuration

### 16. Product Principle

ProdUS should feel like a senior productization partner: structured, calm, evidence-backed, and useful. AI should reduce owner effort and improve clarity, but ProdUS must remain the trusted system of record for data, permissions, evidence, and decisions.
