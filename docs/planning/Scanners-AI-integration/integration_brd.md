# ProdOps Network Integration Layer BRD

**Document type:** Business Requirements Document  
**Product:** ProdOps Network  
**Module:** Integration Layer  
**Version:** 1.0  
**Date:** 2026-05-17  
**Status:** Draft for product and engineering planning

---

## 1. Executive Summary

ProdOps Network is a productization platform that helps product owners turn fragile prototypes, MVPs, no-code products, AI-built apps, and early SaaS products into production-ready software through structured diagnosis, dependency-aware packages, evidence-based milestones, and collaboration with existing or verified specialist teams.

The Integration Layer is the evidence engine of ProdOps. It connects to repositories, CI/CD systems, scanner tools, runtime URLs, external security/code-quality platforms, and future cloud environments. It collects product evidence, normalizes findings, supports AI-assisted diagnosis, maps findings to productization services, and supplies evidence for milestone review.

The Integration Layer must support three operating modes:

1. **ProdOps-hosted scanner jobs** - ProdOps temporarily clones a repository and runs scanner jobs in isolated workers.
2. **External tool import** - ProdOps imports results from tools such as GitHub code scanning, GitLab SAST, Snyk, SonarQube, Semgrep, Socket.dev, and others.
3. **CI evidence mode** - Customers run scanners inside their own CI/CD environment and upload SARIF, JSON, logs, and evidence artifacts to ProdOps.

The layer must not become only a scanner dashboard. Its real value is the chain:

```text
Evidence -> Finding -> Service -> Package -> Dependency -> Milestone -> Evidence Review -> Handoff -> Team Reputation
```

Scanners produce evidence. AI explains and recommends. ProdOps governs the productization workflow. Humans approve critical decisions.

---

## 2. Business Context

Software creation is becoming easier through AI coding tools, no-code platforms, templates, and freelance development. However, production readiness remains difficult. Product owners often have a working product but lack evidence that it is secure, maintainable, deployable, scalable, monitored, backed up, documented, and supportable.

Many owners think they need a single service such as “deployment” or “security check,” but they often actually need a package of dependent services:

- CI/CD setup
- staging environment
- monitoring and logging
- backups and restore validation
- secrets management
- dependency patching
- database review
- deployment handoff
- security evidence review
- support process

ProdOps fills the gap between:

```text
"I built something" -> "This product is production-ready enough to launch, scale, or support."
```

The Integration Layer provides the factual foundation for that transition.

---

## 3. Strategic Objectives

| Objective | Business Outcome |
|---|---|
| Enable evidence-based product diagnosis | Product owners understand real technical and operational gaps before buying services. |
| Convert vague product issues into structured packages | Packages include services, dependencies, milestones, budget bands, acceptance criteria, and evidence requirements. |
| Reduce owner-team delivery disputes | Milestones have defined criteria and evidence before work begins. |
| Support BYOT: Bring Your Own Team | Owners can invite existing developers, freelancers, or agencies without marketplace dependency. |
| Build verified team reputation | Team profiles accumulate accepted milestones, evidence quality, delivery speed, package history, and issue resolution data. |
| Avoid marketplace cold-start | The platform can prove value with existing owner-team relationships before matching unknown parties. |
| Create future marketplace defensibility | Matching is based on actual delivery records, not self-reported portfolios. |

---

## 4. Scope

### 4.1 In Scope

- Repository integrations: GitHub first, GitLab second, Bitbucket optional later.
- Repository scanning orchestration using open-source scanner jobs.
- Importing results from external scanners and code security platforms.
- CI evidence mode where customers run scans in their own CI/CD and upload results to ProdOps.
- Runtime URL scans for authorized public or staging URLs.
- Cloud and infrastructure evidence collection through scanner outputs and future cloud integrations.
- Findings normalization into a unified ProdOps model.
- Finding-to-service and service-to-package mapping.
- AI-assisted summarization, diagnosis, service recommendation, milestone drafting, and evidence comparison.
- Evidence store, scan history, re-scan tracking, and milestone review support.
- Security, privacy, redaction, audit logging, and data retention policies.

### 4.2 Out of Scope for Initial Release

- Full marketplace bidding, open browsing, and dispute arbitration.
- Autonomous code fixing without human review.
- Autonomous production deployment or rollback.
- Final security certification, compliance certification, legal assurance, or insurance-style guarantee.
- Deep penetration testing or active scanning of production domains by default.
- Full cloud account posture management for all providers in MVP.
- Handling regulated compliance frameworks as certifications, such as SOC 2, HIPAA, PCI-DSS, or ISO 27001. ProdOps may support evidence collection later, not certify compliance.

### 4.3 Important Boundary

ProdOps can say:

- evidence suggests this criterion passed
- this risk was detected
- this finding appears resolved
- this service is recommended
- this milestone has enough evidence for human review

ProdOps must not say:

- this product is secure
- this product is compliant
- this product is guaranteed safe
- this product is certified production-ready

---

## 5. Stakeholders and Personas

| Persona | Needs | Integration Layer Value |
|---|---|---|
| Product Owner | Understand product risks, avoid buying wrong services, know what done means | Evidence-based diagnosis, service recommendations, milestone criteria, proof of completion |
| Existing Developer / BYOT Team | Clear scope, fewer disputes, acceptance criteria, portable proof | Structured package, evidence upload, re-scan validation, delivery record |
| Verified Specialist Team | Qualified projects, clear dependencies, strong reputation signal | Package-based requests, capability matching, evidence-based portfolio |
| Platform Admin | Govern quality, tool performance, team behavior, and scan safety | Scanner status, audit logs, integration health, manual override tools |
| Security Reviewer | Review high-risk findings and evidence safely | Secrets redaction, scanner artifacts, evidence comparison, risk acceptance workflow |
| AI/ML Operator | Improve AI quality and reduce hallucination | Prompt/version control, confidence levels, evaluation datasets, feedback loops |

---

## 6. Integration Execution Modes

The Integration Layer must support three execution modes. This allows ProdOps to serve early founders quickly while supporting mature and privacy-sensitive customers later.

| Mode | Description | Best For | Business Value | Risk / Constraint |
|---|---|---|---|---|
| Mode 1: ProdOps-hosted scanner jobs | ProdOps temporarily clones the repo and runs scanner jobs in isolated workers. | MVP, free diagnosis, founders, BYOT teams | Fast onboarding and controlled UX | ProdOps handles compute, isolation, source access, and scanner maintenance |
| Mode 2: External tool import | ProdOps imports findings from GitHub, GitLab, Snyk, SonarQube, Semgrep, Socket.dev, etc. | Teams already using security/quality tools | Lower duplicated scanning, stronger enterprise fit | Vendor-specific APIs, permissions, formats, and pricing |
| Mode 3: CI evidence mode | Customer runs scanners in GitHub Actions, GitLab CI, or other CI and uploads SARIF/JSON/evidence to ProdOps. | Privacy-sensitive customers and enterprise teams | Source code stays in customer environment | More setup effort and less instant onboarding |

### 6.1 Recommended MVP Mode

Start with **Mode 1** for GitHub repositories and public/staging URL scans. Add **Mode 3** early for privacy-sensitive teams. Mode 2 should follow once demand proves which external tools customers already use.

---

## 7. Target Architecture

### 7.1 High-Level Architecture

```text
Frontend Dashboard
  -> API Backend
    -> Integration Service
      -> Source Connectors
         - GitHub
         - GitLab
         - URL
         - CI Upload
      -> Scan Orchestrator
        -> Job Queue
          -> Scanner Worker Pool
            -> Tool Containers / CLI Scanners
      -> Result Normalizer
      -> Evidence Store
      -> AI Analysis Service
      -> Service/Package Mapper
      -> Milestone & Workspace Services
      -> Audit Log
```

### 7.2 Core Components

| Component | Purpose | Key Responsibilities |
|---|---|---|
| Integration Service | Main gateway for repo, URL, CI, scanner, and external tool connections | Manages connector configuration, permissions, scan requests, integration status |
| Source Connector Layer | Connects to product artifacts | GitHub/GitLab OAuth or app install, repo metadata, branch selection, webhooks |
| Scan Orchestrator | Creates scan plan | Detect stack, choose tools, enforce scan depth, route jobs, retry policies |
| Job Queue | Runs scans asynchronously | Queueing, prioritization, retries, timeouts, cancellation |
| Scanner Worker Pool | Executes tools in isolated containers | Temporary clone, tool execution, raw result collection, cleanup |
| External Tool Connectors | Imports findings from existing tools | Snyk, SonarQube, GitHub CodeQL/code scanning, GitLab, Semgrep, Socket.dev |
| Result Normalizer | Unifies tool outputs | Convert SARIF/JSON/logs to ProdOps Finding schema |
| Evidence Store | Stores scan outputs and proof artifacts | Raw output references, screenshots, logs, PRs, CI runs, scan reports |
| AI Analysis Service | Explains and groups findings | Summaries, severity context, service mapping support, milestone drafting |
| Service/Package Mapper | Turns findings into productization plan | Finding-to-service mapping, dependency rules, package recommendation |
| Audit Log | Records sensitive actions | Access, scans, evidence updates, AI recommendations, approvals, overrides |

### 7.3 MVP Deployment Pattern

For the MVP, avoid over-engineering. Use:

```text
- Web app: Next.js or equivalent
- Backend/API: Node/NestJS or equivalent
- Database: PostgreSQL
- Queue: Redis + BullMQ or equivalent
- Scanner workers: containerized background jobs
- Object store: S3-compatible storage for raw outputs and evidence
- AI: frontier model API with deterministic rules outside the model
- Auth: organization-based RBAC
```

### 7.4 Mature Deployment Pattern

As usage grows, split scanner orchestration, AI analysis, evidence processing, integration connectors, and package mapping into separate services. Mature deployment may run workers on ECS Fargate, Google Cloud Run jobs, AWS Batch, Kubernetes Jobs, Fly Machines, or similar isolated execution platforms.

---

## 8. Scan Lifecycle

### 8.1 Standard Hosted Repo Scan

1. Owner connects repository through GitHub App, GitLab app, or similar least-privilege connector.
2. Owner selects product, repository, branch, scan depth, and optional deployed URL.
3. Scan orchestrator inspects repo metadata and creates a scan plan.
4. Job queue schedules scanner jobs based on priority, scan depth, and tool availability.
5. Scanner worker creates an isolated temporary workspace.
6. Worker clones the repository using a temporary token.
7. Worker runs selected scanners without executing arbitrary application scripts in Level 1 scans.
8. Raw outputs are saved as SARIF, JSON, HTML, logs, or screenshots in object storage.
9. Worker redacts secrets, fingerprints findings, deletes the repo clone, and marks job complete.
10. Normalizer converts raw outputs to ProdOps Finding records.
11. AI Analysis Service summarizes, groups, and explains findings with confidence levels.
12. Service/Package Mapper creates recommendations and dependency warnings.
13. Findings appear in the Diagnosis dashboard and may generate package and milestone suggestions.

### 8.2 Rescan and Evidence Review Cycle

1. Team fixes an issue or completes a milestone.
2. Team attaches evidence: PR, commit, scanner output, deployment log, screenshot, runbook, or dashboard link.
3. ProdOps triggers re-scan or imports fresh CI evidence.
4. Normalizer matches new findings against previous findings using fingerprints.
5. Finding status becomes new, open, resolved, regressed, accepted risk, or insufficient evidence.
6. AI compares evidence against acceptance criteria and gives a non-final recommendation.
7. Owner or authorized reviewer approves, requests changes, or accepts risk.

### 8.3 Scanner Depth Levels

| Level | Name | Allowed Actions | Default Tools | Consent Needed |
|---|---|---|---|---|
| L1 | Safe static scan | Inspect files, manifests, configs, lockfiles. No build scripts or app execution. | Gitleaks, Semgrep, OSV-Scanner, Trivy FS/config, Checkov, Hadolint, ESLint/Ruff where safe | Repo authorization |
| L2 | Dependency/build-aware scan | May install dependencies or parse richer dependency context under sandbox constraints. | Snyk CLI if connected, deeper SCA, package manager analysis, coverage imports | Explicit scan-depth consent |
| L3 | Runtime URL scan | Scan authorized staging/public URL, run passive baseline DAST and web audits. | Lighthouse, OWASP ZAP baseline, controlled Nuclei | Domain authorization and scan target confirmation |
| L4 | Deep project scan | May run tests/builds in isolated environment with strict limits. | CodeQL CLI, tests, custom customer scanner pack | Explicit high-trust consent |

**Safety rule:** Do not run arbitrary install/build/test scripts from untrusted repositories during L1 scans. Dependency install and build execution move the scan into L2 or L4 and require explicit consent and stronger sandboxing.

---

## 9. Tool Integration Catalog

ProdOps should support a default open-source scanner pack first, then add external paid/freemium integrations based on customer demand. Each tool must be treated as an evidence source, not as the final business logic.

### 9.1 MVP Open-Source Scanner Pack

| Need | Primary Tool | Why It Is Useful | Output Type |
|---|---|---|---|
| Secrets | Gitleaks | Detects hardcoded secrets in Git repos, files, and directories | JSON/SARIF-like output |
| Code security | Semgrep Community/CLI | Fast static analysis and custom rules for source code | SARIF/JSON |
| Dependencies | OSV-Scanner | Matches dependencies against OSV vulnerability data | JSON |
| Containers / FS / IaC baseline | Trivy | Finds CVEs and misconfigurations across repositories, containers, binaries, Kubernetes, IaC | JSON/SARIF |
| IaC | Checkov | Scans Terraform, CloudFormation, Kubernetes, Helm, ARM, Serverless for misconfigurations | JSON/SARIF |
| Web performance | Lighthouse | Audits performance, accessibility, SEO, best practices and more | JSON/HTML |
| Runtime web baseline | OWASP ZAP baseline | Passive/baseline DAST against authorized URLs | JSON/HTML |
| JS/TS quality | ESLint | Linting and static analysis for JavaScript/TypeScript | JSON |
| Python quality | Ruff | Fast Python linter/formatter | JSON/text |
| Dockerfile quality | Hadolint | Dockerfile best-practice linting | JSON/text |

### 9.2 Free / Open-Source Tool List

| Tool | Category | Recommended ProdOps Use |
|---|---|---|
| Gitleaks | Secrets | MVP default for repository secret detection |
| TruffleHog OSS | Secrets | Optional deeper secret discovery and verification; review AGPL licensing before embedding |
| Semgrep Community/CLI | SAST | MVP default for code security and custom productization rules |
| OSV-Scanner | SCA | MVP default for dependency vulnerability scanning |
| OWASP Dependency-Check | SCA | Optional alternative/deeper dependency scanner, especially Java ecosystems |
| Renovate CLI | Dependency updates | Remediation support for dependency update PRs |
| Trivy | Container/IaC/SBOM/vulnerability | MVP default for container, filesystem, IaC, and vulnerability evidence |
| Checkov CLI | IaC | MVP default for IaC misconfiguration scanning |
| Prowler OSS | Cloud posture | Later self-hosted cloud posture checks |
| Kubescape | Kubernetes | Later Kubernetes posture and manifest checks |
| CycloneDX | SBOM standard | SBOM format support and future evidence standard |
| Syft | SBOM generation | Generate SBOMs from containers and filesystems |
| Grype | Vulnerability scanning | Scan SBOMs/images/filesystems for known vulnerabilities |
| OWASP Dependency-Track | SBOM risk platform | Later continuous SBOM/component risk analysis |
| OWASP ZAP | DAST | Runtime baseline scan for authorized staging/public URLs |
| Nuclei | Template-based vulnerability scanning | Later controlled authorized scans with curated templates |
| Lighthouse | Web quality | Performance, accessibility, SEO, best-practices evidence |
| MobSF | Mobile security | Later mobile package scanning for APK/IPA/source |
| ESLint | JS/TS quality | Language-specific quality findings |
| Ruff | Python quality | Language-specific quality findings |
| Hadolint | Dockerfile quality | Container/DevOps quality findings |

### 9.3 Freemium / Paid / Customer-Owned Integrations

| Tool / Platform | Free / Paid Reality | ProdOps Strategy |
|---|---|---|
| GitHub CodeQL / code scanning | Code scanning is available for public repositories and for eligible private/org repositories with GitHub Code Security enabled. | Import CodeQL/code scanning alerts or run CodeQL in customer CI for advanced customers. |
| GitHub secret scanning | Public repository secret scanning is broadly available; private/internal org usage may require paid GitHub secret protection / code security features. | Import alerts where customers have GitHub security features enabled; use Gitleaks for default ProdOps scan. |
| GitHub Dependabot | Dependabot alerts/updates are broadly free, with related GitHub security features varying by plan. | Import alerts and map to dependency review and patch management. |
| GitLab SAST | Basic SAST exists across GitLab tiers; Advanced SAST is paid/Ultimate. | Integrate with GitLab results for GitLab customers. |
| SonarQube / SonarCloud | Community/self-hosted options exist; advanced editions and cloud team/enterprise plans are paid. | Import quality gates, code smells, bugs, maintainability and security findings. |
| Snyk | Free developer tier exists; Team/Enterprise are paid with higher limits and features. | Let customers connect Snyk; import Snyk Code, Open Source, Container, and IaC findings. |
| Semgrep AppSec Platform | Free/community edition plus paid plans with pro rules, management, and advanced features. | Use CLI in MVP; later import Semgrep platform findings for teams already using it. |
| Socket.dev | Free tier/open-source use exists; Team/Business/Enterprise are paid. | Later supply-chain risk integration, especially JS/Python/Go package behavior. |
| Prowler Cloud | Open-source Prowler is free; hosted Prowler Cloud is paid. | Offer customer-owned Prowler Cloud import or self-hosted Prowler scans later. |

---

## 10. Unified Finding and Evidence Model

All scanner and external tool output must be normalized into a single ProdOps Finding model. This prevents the dashboard from becoming a noisy pile of raw vendor output.

### 10.1 Normalized Finding Schema

```yaml
Finding:
  id: finding_123
  product_id: product_456
  scan_run_id: scan_789
  source_tool: gitleaks | semgrep | osv | trivy | checkov | lighthouse | external_snyk | external_sonar
  source_mode: hosted_scan | external_import | ci_evidence
  category: security | dependency | secret | code_quality | cloud | database | performance | launch | support
  type: exposed_secret | vulnerable_dependency | code_smell | no_staging | weak_auth | slow_page | etc.
  severity: critical | high | medium | low | info
  confidence: high | medium | low
  confidence_basis: scan_result | user_input | repo_signal | missing_data | ai_inference
  title: human-readable finding title
  description: normalized explanation
  file_path: optional
  line: optional
  fingerprint: stable hash used for rescan tracking
  evidence_ref: raw artifact reference
  status: new | open | resolved | regressed | accepted_risk | false_positive | insufficient_evidence
  service_recommendations: list of service_module_ids
  milestone_recommendations: list of milestone_template_ids
  created_at: timestamp
  updated_at: timestamp
```

### 10.2 Evidence Item Schema

```yaml
EvidenceItem:
  id: evidence_123
  product_id: product_456
  milestone_id: optional
  finding_id: optional
  evidence_type: scan_result | ci_run | pull_request | commit | deployment_log | screenshot | url_check | runbook | manual_note
  source: github | gitlab | snyk | sonar | prodops_worker | user_upload | ci_callback
  artifact_url: secure object storage reference or external link
  summary: concise human-readable summary
  redaction_status: none | redacted | sensitive_hidden
  verification_status: pending | likely_pass | likely_fail | insufficient | human_approved | rejected
  ai_summary_ref: optional
  created_by: user/system
  created_at: timestamp
```

### 10.3 Finding Status Rules

| Status | Meaning | How Set |
|---|---|---|
| New | Detected in latest scan and not seen before | Fingerprint has no prior match |
| Open | Known unresolved finding | Detected again or not yet remediated |
| Resolved | Previously open finding no longer detected and evidence supports closure | Re-scan plus evidence/human approval depending on severity |
| Regressed | Previously resolved finding appears again | Fingerprint or equivalent pattern reappears |
| Accepted risk | Owner/reviewer accepts risk without fix | Requires reason, expiry date, and approver |
| False positive | Finding judged not applicable | Requires reviewer note and optional tool suppression |
| Insufficient evidence | Evidence does not prove criterion | AI or reviewer marks evidence weak/missing |

### 10.4 Severity and Confidence Model

| Severity | Definition | Example |
|---|---|---|
| Critical | Likely blocks launch or exposes serious security/data/operational risk | Exposed live secret, no backups before migration, critical dependency exploit |
| High | Should be fixed before launch or milestone approval | Weak RBAC, manual deployments, high vulnerability |
| Medium | Important risk that may be sequenced into package | No staging environment, low test coverage, outdated dependencies |
| Low | Useful improvement but not launch-blocking | Minor lint issues, documentation gaps |
| Info | Contextual signal | Framework detected, package inventory generated |

| Confidence | Basis |
|---|---|
| High | Direct scanner output, CI run, tool API result, deployment check, or explicit evidence |
| Medium | Combination of structured user input, repo signals, or partial evidence |
| Low | Inference from missing data or AI interpretation without direct evidence |

---

## 11. Finding-to-Service Mapping

Findings must drive service recommendations. The Integration Layer must expose structured outputs that the service/package engine can consume.

| Finding / Signal | Recommended Service Modules | Typical Package Impact |
|---|---|---|
| Exposed secret | `security.secrets_scan`, `security.fix_sprint`, `cloud.env_config_audit` | Security Hardening, MVP Stabilization |
| Vulnerable dependency | `security.dependency_review`, `support.security_patching` | Security Hardening, Ongoing Product Operations |
| Code vulnerability | `security.api_review`, `security.fix_sprint` | Security Hardening |
| High code smell / complexity | `code.refactor`, `code.ai_cleanup` | AI-Built App Cleanup, Code Cleanup |
| No staging environment | `cloud.staging_setup`, `cloud.deployment_setup` | Cloud/DevOps Foundation, SaaS Launch Readiness |
| Manual deployment | `cloud.cicd_setup`, `support.release_management` | Cloud/DevOps Foundation |
| No monitoring | `cloud.monitoring_setup`, `cloud.logging_alerting` | MVP Stabilization, Support |
| No backup evidence | `cloud.backup_restore`, `db.backup_validation` | Database Rescue, Cloud/DevOps Foundation |
| Slow page / poor Lighthouse score | `scale.frontend_optimization`, `launch.onboarding_review` | Scale Readiness, Launch Readiness |
| IaC misconfiguration | `cloud.env_config_audit`, `cloud.deployment_setup`, `security.fix_sprint` | Cloud/DevOps Foundation, Security Hardening |
| Container vulnerabilities | `cloud.deployment_setup`, `security.dependency_review` | Cloud/DevOps Foundation, Security Hardening |
| No SBOM | `security.dependency_review`, `support.security_patching` | Enterprise Pilot Readiness |
| Mobile security issue | `security.auth_review`, `mobile_optimization`, `security.api_review` | Mobile Optimization, Security Hardening |
| No documentation or runbook | `launch.documentation_setup`, `support.handoff` | Launch Readiness, Ongoing Operations |

### 11.1 Dependency-Aware Package Rules

```text
- If launch.go_live_checklist is selected, require security.readiness_review, cloud.monitoring_setup, and cloud.backup_restore.
- If db.migration_execution is selected, require db.migration_plan, backup evidence, and rollback plan.
- If scale.load_testing is selected, require staging environment and owner-approved target traffic profile.
- If security.fix_sprint is selected, require evidence review and re-scan before milestone approval.
- If support.basic_maintenance is selected, require support.handoff and monitoring baseline.
- If cloud.deployment_setup is selected, recommend staging, CI/CD, monitoring, rollback, and backup setup.
```

---

## 12. Functional Requirements

Priority definitions:

- **P0** - MVP-critical
- **P1** - near-term expansion
- **P2** - mature platform

| ID | Priority | Requirement | Description |
|---|---|---|---|
| FR-CONN-001 | P0 | GitHub App connector | System shall allow an owner to connect a GitHub repository through a GitHub App with least-privilege repository access. |
| FR-CONN-002 | P1 | GitLab connector | System shall allow connection to GitLab repositories and imports of GitLab security results. |
| FR-CONN-003 | P2 | Bitbucket connector | System should support Bitbucket repositories if demand validates it. |
| FR-CONN-004 | P0 | Repo selection | System shall allow owner to select organization, repository, branch, and scan depth. |
| FR-CONN-005 | P0 | Permission visibility | System shall show exactly what permissions are requested and why. |
| FR-CONN-006 | P0 | Disconnect and delete | System shall allow users to disconnect integrations and request deletion of scan artifacts. |
| FR-SCAN-001 | P0 | Scan plan generation | System shall detect repo stack and generate a scan plan based on files, frameworks, configs, and chosen scan depth. |
| FR-SCAN-002 | P0 | Asynchronous scanning | System shall enqueue scan jobs and process them asynchronously with progress status. |
| FR-SCAN-003 | P0 | Scanner worker isolation | System shall run scans in isolated temporary workspaces and delete repo clones after scan completion. |
| FR-SCAN-004 | P0 | Safe scan level | System shall support L1 safe static scans that do not execute arbitrary project scripts. |
| FR-SCAN-005 | P1 | Runtime URL scans | System shall support authorized staging/public URL scans using Lighthouse and ZAP baseline. |
| FR-SCAN-006 | P1 | Rescan | System shall allow re-scanning after fixes and compare results against previous findings. |
| FR-SCAN-007 | P1 | Scan scheduling | System should support scheduled scans for active workspaces and support plans. |
| FR-TOOL-001 | P0 | Gitleaks integration | System shall run Gitleaks for secret detection in repository scans. |
| FR-TOOL-002 | P0 | OSV-Scanner integration | System shall run OSV-Scanner for dependency vulnerability detection. |
| FR-TOOL-003 | P0 | Semgrep integration | System shall run Semgrep CLI for SAST and custom rules. |
| FR-TOOL-004 | P0 | Trivy integration | System shall run Trivy for filesystem/container/IaC vulnerability and misconfiguration evidence where applicable. |
| FR-TOOL-005 | P1 | Checkov integration | System shall run Checkov for IaC repositories with Terraform, CloudFormation, Kubernetes, Helm, ARM, or Serverless configs. |
| FR-TOOL-006 | P1 | Lighthouse integration | System shall run Lighthouse against authorized product URLs. |
| FR-TOOL-007 | P1 | OWASP ZAP baseline | System shall run ZAP baseline only against authorized URLs and shall avoid active production scanning by default. |
| FR-TOOL-008 | P1 | SonarQube import | System should import SonarQube/SonarCloud quality findings when connected. |
| FR-TOOL-009 | P1 | Snyk import | System should import Snyk Code/Open Source/Container/IaC findings when connected. |
| FR-TOOL-010 | P2 | SBOM generation | System should generate or import SBOMs using Syft/CycloneDX and scan them with Grype/Dependency-Track. |
| FR-TOOL-011 | P2 | Cloud posture | System should integrate Prowler or similar tools for cloud posture evidence. |
| FR-TOOL-012 | P2 | Mobile scanner | System should integrate MobSF for mobile productization packages. |
| FR-NORM-001 | P0 | Normalize outputs | System shall convert all supported tool outputs into the unified Finding schema. |
| FR-NORM-002 | P0 | Finding fingerprint | System shall generate stable fingerprints to track findings across scans. |
| FR-NORM-003 | P0 | Severity normalization | System shall normalize vendor severities into ProdOps severity levels. |
| FR-NORM-004 | P0 | Secret redaction | System shall redact sensitive values and never display full secrets. |
| FR-AI-001 | P0 | Finding summarization | System shall use AI to summarize raw findings in founder-friendly language. |
| FR-AI-002 | P0 | Confidence labeling | AI-generated recommendations shall include confidence level and basis. |
| FR-AI-003 | P0 | Service suggestion | System shall use rules plus AI assistance to suggest service modules. |
| FR-AI-004 | P1 | Milestone drafting | System should generate draft milestones, acceptance criteria, and evidence requirements from packages. |
| FR-AI-005 | P1 | Evidence comparison | System should compare submitted evidence to criteria and classify likely pass/fail/insufficient evidence. |
| FR-AI-006 | P0 | Human approval boundary | AI shall not be able to approve high-risk milestones, release payments, certify security, or certify compliance. |
| FR-PKG-001 | P0 | Service mapping | System shall map findings to service modules and packages. |
| FR-PKG-002 | P0 | Dependency warnings | System shall show hard and soft dependencies when package services are selected. |
| FR-PKG-003 | P1 | Package builder | System should generate package composition, milestone phases, budget bands, and rationale. |
| FR-EVID-001 | P0 | Evidence storage | System shall store raw outputs and normalized evidence references securely. |
| FR-EVID-002 | P1 | Evidence upload | System shall allow teams to attach PRs, commits, logs, screenshots, runbooks, and scan results to milestone criteria. |
| FR-EVID-003 | P1 | Evidence review | System shall support owner/reviewer approval, rejection, and request changes. |
| FR-SEC-001 | P0 | Audit logs | System shall audit repo access, scan runs, evidence changes, AI recommendations, approvals, and overrides. |
| FR-SEC-002 | P0 | Least privilege | System shall request only required integration permissions. |
| FR-SEC-003 | P0 | Runtime scan authorization | System shall require proof/confirmation of authorization before scanning URLs. |
| FR-OP-001 | P0 | Scan status | System shall expose scan status: queued, running, completed, failed, canceled. |
| FR-OP-002 | P1 | Retries and timeouts | System shall support retry and timeout policies per tool. |
| FR-OP-003 | P1 | Tool health dashboard | System should expose scanner worker, queue, failure, and integration health metrics to admins. |

---

## 13. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Security | Use least-privilege access, temporary tokens, encrypted storage, secret redaction, audit logging, and explicit authorization for runtime scans. |
| Privacy | Store findings and evidence, not full source code by default. Delete temporary repo clones after scan. |
| Reliability | Scanner jobs must be retryable, cancellable, and observable with clear failure reasons. |
| Scalability | Worker pool must scale horizontally. Queue must support prioritization by plan and active workspace status. |
| Performance | L1 hosted scan should return initial diagnosis for small/medium repos within a target range of minutes, not hours. |
| Multi-tenancy | All artifacts, tokens, scan results, and evidence must be organization-scoped and isolated. |
| Auditability | Every sensitive action must have actor, timestamp, target, and before/after metadata where applicable. |
| Explainability | AI recommendations must include evidence basis, confidence level, and source finding references. |
| Extensibility | New tools should be added through connector adapters and normalizer mappers, not hardcoded UI logic. |
| Compliance readiness | Support retention settings, exportable evidence bundles, access logs, and data deletion. |

---

## 14. Business Rules

| Rule ID | Rule |
|---|---|
| BR-001 | No full secret values may be displayed in the UI or exported reports. |
| BR-002 | Runtime scans may only run against authorized domains or URLs provided by the product owner. |
| BR-003 | Level 1 scans may not execute arbitrary project scripts, install scripts, or untrusted commands. |
| BR-004 | AI cannot approve milestones, release payments, certify compliance, or certify security. |
| BR-005 | Critical findings cannot be marked resolved without re-scan evidence or explicit risk acceptance. |
| BR-006 | Risk acceptance requires an approver, reason, expiry/review date, and affected milestone/package. |
| BR-007 | Hard package dependencies cannot be skipped unless owner accepts risk and the system records the exception. |
| BR-008 | Findings from external tools must be tagged with source, timestamp, and import method. |
| BR-009 | Every AI recommendation must reference evidence, source findings, or missing-data basis. |
| BR-010 | Team reputation must be based on completed milestones, evidence quality, delivery speed, and owner acceptance, not only self-declared skills. |
| BR-011 | Deep scans involving builds, dependency installation, or test execution require explicit consent and sandboxing. |
| BR-012 | Production active DAST is disabled by default and requires explicit high-risk authorization. |

---

## 15. AI Usage Across the Integration Layer

### 15.1 AI Responsibilities

| Stage | AI Use | Human / Rule Boundary |
|---|---|---|
| Product Intake | Summarize owner input, detect missing fields, ask follow-up questions | Owner confirms product profile |
| Scan Interpretation | Translate raw scanner output into business-readable findings | Scanner output remains source of evidence |
| Risk Grouping | Group duplicate/noisy findings and explain business impact | Severity normalization rules remain deterministic |
| Service Mapping | Suggest service modules from evidence and missing data | Package rules enforce hard dependencies |
| Package Creation | Draft rationale, milestone phases, budget assumptions, risk notes | Owner/team approves package |
| Milestone Creation | Draft criteria and evidence requirements | Human may edit and approve |
| Evidence Review | Compare evidence to criteria and label likely pass/fail/insufficient | Owner/reviewer makes final acceptance decision |
| Handoff | Draft handoff checklists, runbooks, support docs | Team completes and owner accepts |
| Support | Summarize incidents and recurring risks | Support team executes fixes |

### 15.2 AI Output Contract

```yaml
AIRecommendation:
  id: ai_rec_123
  type: finding_summary | service_recommendation | package_rationale | evidence_review | risk_alert
  source_refs: [finding_id, evidence_id, scan_run_id]
  recommendation: text
  confidence: high | medium | low
  confidence_basis: scan_result | user_input | repo_signal | missing_data | inference
  limitations: text
  required_human_review: true | false
  created_at: timestamp
  model_version: string
  prompt_version: string
```

### 15.3 Disallowed AI Claims

AI must not claim that:

- the product is secure
- the product is compliant
- an app is production-safe without qualification
- a milestone is finally approved
- payments should be released
- contractual acceptance is complete
- production-changing actions should happen without human approval

---

## 16. Security, Privacy, and Trust Requirements

### 16.1 Repo Access and Token Handling

- Use GitHub App/GitLab app permissions rather than broad personal tokens where possible.
- Request repository-level access instead of whole-account access.
- Use temporary installation tokens for cloning/scanning.
- Encrypt tokens at rest and never expose them to scanner logs.
- Allow users to disconnect integrations and delete stored scan artifacts.
- Log all token use, repo access, scan start, scan completion, and failures.

### 16.2 Worker Isolation

- Create a fresh workspace per scan run.
- Do not reuse cloned repos across customers.
- Delete local workspace after scan completion or failure timeout.
- Apply CPU, memory, disk, and execution time limits.
- Disable outbound network access for scanner jobs unless a tool requires it and the requirement is documented.
- Do not execute arbitrary repo scripts in L1 scans.
- Capture tool logs but redact secrets and tokens.

### 16.3 Secret Redaction

Secret findings must show enough information to act without leaking the secret again.

```text
Example display:
Secret type: Stripe secret key
Location: src/config/payments.ts:42
Fingerprint: sk_live_****9f3a
Recommended action: rotate key, remove from repo/history where possible, move to secret manager
Never display: full token value
```

### 16.4 Runtime Scan Authorization

- Owner must explicitly confirm authorization to scan the URL/domain.
- Default runtime scan is passive/baseline against staging or low-risk targets.
- Active or aggressive scanning requires separate warning, explicit approval, and rate limits.
- ProdOps must not allow users to scan arbitrary third-party targets through the platform.
- Scan logs must include target URL, authorization record, actor, time, scanner type, and scope.

### 16.5 Data Retention

| Data Type | Default Retention | Notes |
|---|---|---|
| Temporary repo clone | Deleted immediately after scan | Never retained as product feature unless explicit enterprise agreement |
| Raw scan outputs | Configurable, default 90 days | Sensitive outputs redacted where possible |
| Normalized findings | Retained while product/workspace active | Needed for trend and delivery evidence |
| Evidence artifacts | Retained per workspace/support plan | Can be exported/deleted subject to policy |
| Audit logs | Longer retention, e.g. 1 year+ | Needed for security and accountability |
| AI prompts/outputs | Retained with redaction controls | Model evaluation and traceability |

---

## 17. External Tool Connector Requirements

### 17.1 GitHub

- GitHub App installation for repository access.
- Read repository metadata, branch, file tree, package manifests, CI workflow files, and workflow run evidence where permissioned.
- Optional import of code scanning alerts, Dependabot alerts, and secret scanning alerts when available.
- Optional SARIF upload/import compatibility for customer-owned CI mode.
- Webhooks for push, pull request, workflow run, and installation events.

### 17.2 GitLab

- OAuth/app integration for repository access.
- Import GitLab SAST and security dashboard results when available.
- Support GitLab CI evidence uploads for scanner outputs.
- Support project-level tokens or app-based integration depending on GitLab deployment.

### 17.3 Snyk

- Import Snyk Open Source, Code, Container, and IaC findings where customer connects account.
- Map Snyk vulnerability and license findings to dependency review, security hardening, and patch management services.
- Use customer-owned Snyk account to avoid ProdOps becoming the scanner cost sink.

### 17.4 SonarQube / SonarCloud

- Import project quality gate status, bugs, vulnerabilities, security hotspots, code smells, maintainability signals, and coverage metrics.
- Map maintainability findings to Code Cleanup / AI-Built App Cleanup packages.
- Use quality gates as milestone evidence where appropriate.

### 17.5 Semgrep AppSec Platform

- Use Semgrep CLI in hosted scanner mode for MVP.
- Later import Semgrep platform findings for organizations using paid/team Semgrep workflows.
- Support custom Semgrep rules for productization-specific anti-patterns.

### 17.6 Cloud Providers

Cloud provider direct integrations are P2/mature because they carry higher permission and privacy implications. Initial cloud evidence can come from IaC files, deployment URLs, owner input, and CI artifacts. Later integrations may support AWS, Azure, GCP, Vercel, Netlify, Render, Railway, Fly.io, and Kubernetes environments.

---

## 18. API and UI Requirements

### 18.1 API Endpoints Conceptual Map

| Endpoint Area | Example Endpoints | Purpose |
|---|---|---|
| Connections | `POST /integrations/github/install`, `GET /integrations`, `DELETE /integrations/{id}` | Connect/disconnect external sources |
| Scan Runs | `POST /products/{id}/scans`, `GET /scans/{id}`, `POST /scans/{id}/cancel` | Start and monitor scans |
| Tool Runs | `GET /scans/{id}/tools` | Show individual tool status and errors |
| Findings | `GET /products/{id}/findings`, `PATCH /findings/{id}` | View and manage normalized findings |
| Evidence | `POST /milestones/{id}/evidence`, `GET /evidence/{id}` | Submit and review evidence |
| AI | `GET /findings/{id}/summary`, `POST /packages/recommend` | AI summaries and recommendations |
| Packages | `POST /packages/build`, `GET /packages/{id}` | Create dependency-aware packages |
| Milestones | `POST /packages/{id}/milestones`, `PATCH /milestones/{id}/review` | Generate and review milestones |
| CI Upload | `POST /ci/scans/{scan_id}/upload` | Receive customer-owned scan outputs |

### 18.2 User-Facing Screens Impacted

| Screen | Integration Layer Content |
|---|---|
| Products Overview | Health status, last scan, recommended package, next milestone, critical risks |
| Diagnosis Report | Findings grouped by evidence source, severity, confidence, service recommendation |
| Package Builder | Service recommendations, dependencies, package rationale, budget/duration ranges |
| Team Matching | Capabilities required by package and team fit based on delivery data |
| Workspace | Milestone progress, blockers, AI assistant, activity, scan status |
| Milestone Review | Acceptance criteria checklist, automated check results, evidence, pass/fail/insufficient |
| Evidence Center | Raw artifacts, scan reports, PRs, logs, screenshots, runbooks |
| Admin Integration Health | Scanner failures, queue status, connector errors, tool versions |

---

## 19. Milestone Acceptance and Evidence Rules

### 19.1 Example: Security Hardening Milestone

| Criterion | Evidence Source | Check Type | Approval Rule |
|---|---|---|---|
| No exposed secrets remain | Gitleaks/TruffleHog result | Automated + human | No critical secrets detected; reviewer confirms key rotation where applicable |
| Critical dependencies patched | OSV/Snyk/Dependabot result | Automated | No open critical dependency findings or accepted-risk record exists |
| Code vulnerabilities remediated | Semgrep/CodeQL/Snyk Code | Automated + human | High/critical findings resolved or risk-accepted |
| Auth/RBAC reviewed | Config evidence + test result | Partial automated + human | Role matrix validated by reviewer |
| Runtime scan has no critical issues | ZAP baseline on authorized staging URL | Automated + human | No critical baseline findings |

### 19.2 Example: Cloud/DevOps Milestone

| Criterion | Evidence Source | Check Type | Approval Rule |
|---|---|---|---|
| Staging environment exists | URL check / deployment evidence | Automated + human | Staging URL reachable and owner/team confirms usage |
| CI/CD pipeline passes | GitHub/GitLab CI run | Automated | Build/test/deploy stages pass |
| Rollback process documented | Runbook | Human | Reviewer confirms rollback steps are clear and current |
| Monitoring active | Monitoring screenshot/API check | Automated + human | Dashboard or uptime check attached |
| Backup job verified | Backup log / restore test | Automated + human | Backup ran and restore test evidence exists |

### 19.3 Example: Database Migration Milestone

| Criterion | Evidence Source | Check Type | Approval Rule |
|---|---|---|---|
| Migration plan approved | Plan document | Human | Owner/team approve sequence, rollback, and validation steps |
| Pre-migration backup completed | Backup log | Automated + human | Backup exists before migration |
| Migration executed | Migration log | Automated | No migration errors |
| Row counts validated | Validation script report | Automated | Expected counts match or differences are explained |
| Rollback plan exists | Runbook | Human | Reviewer accepts rollback plan |

---

## 20. Data Model

### 20.1 Core Tables

| Table | Purpose | Important Fields |
|---|---|---|
| `organizations` | Tenant boundary | `id`, `name`, `plan`, `settings` |
| `users` | User accounts | `id`, `org_id`, `role`, `email`, `status` |
| `products` | Owner products | `id`, `org_id`, `name`, `stage`, `stack`, `health_score` |
| `integrations` | Connected tools/sources | `id`, `org_id`, `type`, `provider`, `status`, `permissions` |
| `repositories` | Connected repos | `id`, `integration_id`, `provider`, `repo_ref`, `default_branch` |
| `scan_runs` | Scan executions | `id`, `product_id`, `mode`, `depth`, `status`, `started_at`, `completed_at` |
| `tool_runs` | Per-tool execution | `id`, `scan_run_id`, `tool`, `status`, `raw_output_ref`, `error` |
| `findings` | Normalized risks/issues | `id`, `scan_run_id`, `category`, `severity`, `confidence`, `fingerprint`, `status` |
| `evidence_items` | Proof artifacts | `id`, `product_id`, `milestone_id`, `finding_id`, `type`, `source`, `artifact_ref` |
| `service_modules` | Reusable services | `id`, `layer`, `name`, `description`, `triggers` |
| `package_templates` | Reusable packages | `id`, `name`, `target_stage`, `service_ids` |
| `packages` | Product-specific packages | `id`, `product_id`, `template_id`, `status`, `services`, `budget_band` |
| `dependencies` | Dependency rules | `id`, `source_service`, `target_service`, `type`, `severity` |
| `milestones` | Delivery stages | `id`, `package_id`, `name`, `status`, `assigned_team_id` |
| `acceptance_criteria` | Milestone criteria | `id`, `milestone_id`, `description`, `evidence_required` |
| `reviews` | Approval records | `id`, `milestone_id`, `reviewer_id`, `decision`, `notes` |
| `teams` | BYOT or verified teams | `id`, `org_id/null`, `name`, `status`, `verification_level` |
| `team_delivery_records` | Reputation data | `id`, `team_id`, `package_id`, `milestone_id`, `acceptance_rate`, `evidence_quality` |
| `ai_recommendations` | AI outputs | `id`, `type`, `source_refs`, `confidence`, `model_version`, `prompt_version` |
| `audit_logs` | Security and operational logs | `id`, `actor`, `action`, `target`, `timestamp`, `metadata` |

### 20.2 Relationship Map

```text
Organization -> Products
Product -> Integrations / Repositories / Scan Runs / Packages
Scan Run -> Tool Runs -> Raw Artifacts
Tool Runs -> Findings
Findings -> Service Recommendations -> Package Services
Package -> Milestones -> Acceptance Criteria -> Evidence Items -> Reviews
Team -> Assigned Milestones -> Delivery Records -> Reputation
AI Recommendations -> Findings / Packages / Evidence / Milestones
Audit Logs -> All sensitive actions
```

---

## 21. Reporting and Metrics

| Metric | Why It Matters |
|---|---|
| Scan completion rate | Shows scanner reliability and onboarding friction |
| Average scan duration by depth/tool | Helps manage cost and UX expectations |
| Findings per product by category | Shows productization demand patterns |
| Critical findings resolved | Measures delivery value |
| Rescan improvement score | Shows before/after product health improvement |
| Package recommendation conversion | Measures diagnosis-to-workspace conversion |
| Milestone evidence pass rate | Measures clarity and team execution quality |
| AI recommendation acceptance rate | Measures AI usefulness |
| False positive rate | Measures scanner/AI noise |
| Team delivery record quality | Enables future matching credibility |

---

## 22. Phased Delivery Plan

### 22.1 Phase 0: Manual Validation

- Use manual intake and limited repo scans on sample/friendly products.
- Validate which findings owners understand and which service recommendations convert.
- Manually map findings to services and milestones before automation.

### 22.2 Phase 1: MVP Integration Layer

- GitHub App connector.
- L1 safe static scan depth.
- Scanner worker with Gitleaks, Semgrep, OSV-Scanner, Trivy, optional ESLint/Ruff/Hadolint.
- Raw result storage and normalized findings.
- AI finding summarization and service recommendation.
- Diagnosis dashboard and initial package recommendation.

### 22.3 Phase 2: Productization Workspace Integration

- Package builder connected to findings.
- Milestone and acceptance criteria generation.
- Evidence upload and milestone review.
- Re-scan after fix and finding status comparison.
- BYOT team invitation.

### 22.4 Phase 3: External Imports and CI Evidence

- GitHub code scanning, Dependabot, and secret scanning imports where available.
- GitLab security result import.
- Snyk and SonarQube imports.
- ProdOps GitHub Action / GitLab CI template for customer-owned scanning.
- CI artifact uploader and SARIF/JSON ingestion.

### 22.5 Phase 4: Mature Governance and Marketplace Readiness

- Team delivery record profiles based on accepted milestones and evidence quality.
- Package-specific team matching.
- Cloud posture and SBOM integrations.
- Support/operations scan scheduling.
- Advanced AI risk monitor and handoff copilot.

---

## 23. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Scanner false positives create noise | Owners lose trust | Group findings, show confidence, require evidence basis, allow false-positive workflow |
| Scanner false negatives create overconfidence | Product owners may assume safety | Use careful disclaimers, do not certify security, recommend human review for high-risk products |
| Repo access privacy concerns | Owners avoid connecting repos | Offer CI evidence mode, least-privilege permissions, deletion controls, and clear data retention |
| Runtime scanning abuse | Legal/security exposure | Require domain authorization, rate limits, target scope, and disable active production scans by default |
| AI hallucination | Bad recommendations | Use deterministic rules, source references, confidence levels, and human approval boundaries |
| Tool licensing issues | Legal/product risk | Review licenses, especially AGPL tools like TruffleHog OSS, before embedding in SaaS |
| Compute costs grow | Margin pressure | Use scan depth tiers, caching, external imports, CI mode, and plan-based limits |
| Becoming a generic scanner dashboard | Weak differentiation | Always map findings to service/package/milestone/evidence workflows |
| Developers feel monitored | Team adoption resistance | Position as clear scope, fewer disputes, and verified portfolio benefit |
| Marketplace cold-start | No liquidity | Start with BYOT and curated teams before broad marketplace |

---

## 24. BRD Acceptance Criteria

| Area | Acceptance Criteria |
|---|---|
| Repo Integration | Owner can connect GitHub repo, select branch, start L1 scan, and disconnect integration. |
| Scanner Execution | At least Gitleaks, Semgrep, OSV-Scanner, and Trivy run in isolated worker and return raw outputs. |
| Normalization | Outputs are converted into unified Finding records with severity, confidence, category, fingerprint, and source. |
| AI Summary | Findings are summarized with source references and confidence basis. |
| Service Mapping | At least 20 common findings map to service modules and package recommendations. |
| Evidence Workflow | Team can submit evidence, owner can review it, and system can re-scan to update finding status. |
| Security | Secrets are redacted; repo clones deleted after scan; audit logs record scan activity. |
| Runtime Scan | Lighthouse scan works for authorized URLs; ZAP baseline available behind explicit authorization. |
| Admin Operations | Admin can view scan failures, tool run statuses, worker health, and integration errors. |

---

## 25. Glossary

| Term | Definition |
|---|---|
| BYOT | Bring Your Own Team. Product owner invites existing developer, freelancer, or agency into ProdOps. |
| SAST | Static Application Security Testing. Source code analysis before runtime. |
| DAST | Dynamic Application Security Testing. Runtime/web app scanning against a deployed target. |
| SCA | Software Composition Analysis. Dependency and open-source component risk analysis. |
| IaC | Infrastructure as Code, such as Terraform, CloudFormation, Kubernetes manifests, Helm charts. |
| SBOM | Software Bill of Materials. Inventory of software components. |
| SARIF | Static Analysis Results Interchange Format, a standard output format for static analysis results. |
| Finding | Normalized issue, risk, signal, or gap identified by scanners, external tools, owner input, or AI. |
| Evidence | Artifact proving or supporting a finding, fix, milestone, or acceptance criterion. |
| Package | A dependency-aware group of productization services arranged into milestones. |

---

## Appendix A: Tool Reference Catalog

| Tool | Category | Free/Paid Classification | Primary ProdOps Use |
|---|---|---|---|
| Gitleaks | Secrets | Open source/free | Default secret scanning for repos/files/directories |
| TruffleHog OSS | Secrets | Open source/free, AGPL licensing caution | Optional deeper secret discovery/verification |
| Semgrep | SAST/SCA/secrets | Free/community + paid platform | Code security and custom productization rules |
| GitHub CodeQL | SAST/code scanning | Free for public and paid/private depending on GitHub plan/security features | Import/run code scanning alerts |
| GitLab SAST | SAST | Basic SAST free tier availability; Advanced SAST paid/Ultimate | Import GitLab-native security evidence |
| SonarQube/SonarCloud | Code quality/security | Community/free + paid editions/cloud plans | Code smells, maintainability, bugs, vulnerabilities |
| Snyk | SAST/SCA/container/IaC | Free developer tier + paid Team/Enterprise | Customer-owned advanced security findings |
| OSV-Scanner | SCA | Open source/free | Dependency vulnerability scanning |
| OWASP Dependency-Check | SCA | Open source/free | Known vulnerable component scanning |
| Renovate | Dependency updates | Open source CLI + hosted options | Dependency update PR recommendations |
| Socket.dev | Supply chain | Free/open-source support + paid plans | Package behavior/supply-chain risk |
| Trivy | Container/IaC/vulnerability/SBOM | Open source/free | All-in-one security scanner for repos, containers, IaC |
| Checkov | IaC | Open source/free CLI + platform ecosystem | IaC misconfiguration evidence |
| Prowler | Cloud posture | Open source/free + paid Prowler Cloud | Cloud security posture evidence |
| Kubescape | Kubernetes | Open source/free | Kubernetes posture and manifest scanning |
| CycloneDX | SBOM standard | Open standard / open-source ecosystem | SBOM format support |
| Syft | SBOM generation | Open source/free | Generate SBOMs |
| Grype | Vulnerability scanner | Open source/free | Scan images/filesystems/SBOMs |
| Dependency-Track | SBOM risk platform | Open source/free | Continuous component risk analysis |
| OWASP ZAP | DAST | Open source/free | Authorized runtime baseline scans |
| Nuclei | Template scanner | Open source/free + ProjectDiscovery paid offerings | Controlled template-based scanning |
| Lighthouse | Web quality | Open source/free | Performance/accessibility/SEO/best-practice evidence |
| MobSF | Mobile security | Open source/free | Mobile static/dynamic security assessment |
| ESLint | JS/TS linting | Open source/free | Language-level code quality |
| Ruff | Python lint/format | Open source/free | Language-level code quality |
| Hadolint | Dockerfile linting | Open source/free | Dockerfile best-practice evidence |

---

## Appendix B: Reference Sources

Pricing and packaging can change. Product and engineering should validate vendor capabilities, licensing, and pricing before commercial commitments.

| Reference | URL |
|---|---|
| GitHub CodeQL and code scanning | https://docs.github.com/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql |
| GitHub SARIF upload/code scanning | https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/integrate-with-existing-tools/uploading-a-sarif-file-to-github |
| OASIS SARIF standard | https://www.oasis-open.org/standard/sarifv2-1-os/ |
| Semgrep Code overview | https://semgrep.dev/docs/semgrep-code/overview |
| SonarQube Server docs | https://docs.sonarsource.com/sonarqube-server |
| Snyk Open Source docs | https://docs.snyk.io/scan-with-snyk/snyk-open-source |
| Snyk IaC docs | https://docs.snyk.io/scan-with-snyk/snyk-iac/scan-your-iac-source-code |
| Gitleaks | https://gitleaks.io/ |
| TruffleHog | https://github.com/trufflesecurity/trufflehog |
| OSV-Scanner | https://google.github.io/osv-scanner/ |
| OWASP Dependency-Check | https://owasp.org/www-project-dependency-check/ |
| Renovate | https://docs.renovatebot.com/ |
| Trivy | https://trivy.dev/ |
| Checkov | https://www.checkov.io/ |
| OWASP ZAP | https://www.zaproxy.org/ |
| Lighthouse | https://developer.chrome.com/docs/lighthouse/overview |
| CycloneDX | https://cyclonedx.org/ |
| Syft | https://github.com/anchore/syft |
| Grype | https://github.com/anchore/grype |
| MobSF | https://mobsf.github.io/docs/ |

---

## Appendix C: MVP Integration Checklist

### Must Have

- GitHub repository connection
- Repo/branch selection
- L1 safe static scanner depth
- Gitleaks, Semgrep, OSV-Scanner, and Trivy
- Raw result storage
- Finding normalization
- Secret redaction
- Finding fingerprinting
- AI finding summaries with confidence basis
- Finding-to-service mapping
- Diagnosis dashboard
- Package recommendation
- Evidence attachment
- Rescan after fix
- Audit logs

### Should Have

- Checkov for IaC
- Lighthouse for authorized URL scan
- OWASP ZAP baseline behind explicit authorization
- GitHub Action for CI evidence mode
- SonarQube import
- Snyk import
- Admin integration health dashboard

### Could Have Later

- Prowler cloud posture
- Kubescape Kubernetes scanning
- MobSF mobile scanning
- SBOM generation with Syft/CycloneDX
- Grype and Dependency-Track
- Socket.dev supply-chain import
- External marketplace team matching based on delivery records

---

## Appendix D: Core Principle

ProdOps must not be positioned as “a scanner.”

ProdOps is a productization governance engine that uses scanners as evidence sources.

```text
External tools = evidence
AI = interpretation and recommendation
ProdOps = governance, packaging, milestones, review, reputation
```

That is the durable product thesis.
