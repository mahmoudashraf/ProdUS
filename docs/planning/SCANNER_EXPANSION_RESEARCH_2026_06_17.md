# Scanner Expansion Research

Date: 2026-06-17

## Purpose

ProdUS already has a useful scanner foundation. This note compares the scanners currently supported by the product with current free/self-hostable scanners, AI-related scanner options, and commercial scanners that should be treated as paid or license-gated integrations.

The goal is not to add every scanner. For a startup/MVP/prototype owner, the scanner layer should answer:

- What changed since the last check?
- What blocks launch?
- Which service/workspace should fix it?
- Can we prove the fix worked?

## Current ProdUS Scanner Support

Current hosted scanner tools are defined in `backend/src/main/java/com/produs/scanner/ScannerProperties.java`.

| Tool key | Display name | Target | Status | Notes |
| --- | --- | --- | --- | --- |
| `gitleaks` | Gitleaks | Repository | Hosted | Secrets scan. Redacted output. |
| `osv-scanner` | OSV-Scanner | Repository | Hosted | Dependency vulnerability scan using OSV data. |
| `semgrep` | Semgrep | Repository | Hosted | SAST/rule scan. Need rule-license care for SaaS usage. |
| `trivy-fs` | Trivy FS/Config | Repository | Hosted | File system/config/dependency/security scan. |
| `checkov` | Checkov | Repository/IaC | Hosted | Runs only when IaC files exist. |
| `syft` | Syft | Container image | Hosted | SBOM generation. |
| `grype` | Grype | Container image | Hosted | Container/filesystem vulnerability scanner. |
| `trivy-image` | Trivy Image | Container image | Hosted | Container vulnerability/misconfiguration scan. |
| `lighthouse` | Lighthouse | Runtime URL | Hosted | Performance/accessibility/best-practice baseline; not a security scanner alone. |
| `zap-baseline` | OWASP ZAP Baseline | Runtime URL | Hosted | Passive web app baseline check. |

Important implementation details before the 2026-06-17 expansion pass:

- Hosted execution is generic command-template based through `ScannerWorker` and `ScannerProcessRunner`.
- ProdUS already supports `SAFE_STATIC`, `DEPENDENCY_CONTAINER`, and `RUNTIME_BASELINE` scan depths.
- Full suite currently queues static, container, and runtime scans when the required repository/image/runtime target exists.
- External/import path already supports GitHub Code Scanning, GitHub Dependabot, GitHub Secret Scanning, GitLab Security, Snyk, SonarQube, SonarCloud, Semgrep Platform, SARIF, and generic JSON.
- Before this expansion pass, `backend/Dockerfile.scanner` installed `hadolint`, but `hadolint` was not registered in `ScannerProperties`.

## 2026-06-17 Implementation Update

This pass moves the recommended free/self-hostable scanner additions into the dedicated scanner-worker service, not the public API backend.

Registered worker-hosted tools now include:

- Repository safety: `gitleaks`, `trufflehog`, `osv-scanner`, `semgrep`, `opengrep`, `bearer`, `trivy-fs`
- IaC and deployment files: `checkov`, `hadolint`, `kics`, `kube-linter`
- Container/image checks: `syft`, `grype`, `trivy-image`
- Runtime URL checks: `lighthouse`, `zap-baseline`, `testssl`, `nuclei-safe`

Worker-side applicability gates were added so broad scan packs can queue all approved free tools while individual tools skip cleanly when the source does not contain the right target:

- `hadolint` runs only when Dockerfiles exist.
- `semgrep`, `opengrep`, and `bearer` run only when supported source-code files exist.
- `checkov` and `kics` run only when IaC/config files exist.
- `kube-linter` runs only when Kubernetes manifests, Helm charts, or Kubernetes directories exist.
- `testssl` and `nuclei-safe` stay under the runtime URL scan depth and require owner-authorized runtime targets.

The normal owner-facing scanner suite still avoids AI red-team tools, Wapiti, and Nikto by default. AI feature safety tools should use a separate explicit owner-authorization path; Wapiti/Nikto belong in a named deeper web check, not the safe default runtime baseline.

## Best Free/Self-Hostable Additions

### 1. Hadolint

Recommendation: add now.

Why:

- Already installed in the scanner Docker image.
- Low risk, fast, deterministic.
- Gives clear Dockerfile hygiene findings that are easy to map to launch hardening and cloud/devops services.

Implementation:

- Add `hadolint` to `ScannerProperties`.
- Target type: `repository`.
- Run only when a `Dockerfile` exists.
- Output: JSON if available, otherwise parse line output into normalized findings.
- Map to `cloud.container_readiness`, `cloud.cicd_setup`, or security hardening depending on rule.

### 2. TruffleHog

Recommendation: add as an optional secrets companion to Gitleaks.

Why:

- Strong secret scanner that can scan git, files, GitHub, S3, Docker, Hugging Face, and other sources.
- Useful as a second opinion when a launch-blocking secret risk matters.

Constraints:

- Verification mode may contact external providers to validate credentials. For ProdUS hosted scans, default to non-verifying mode unless the owner explicitly opts in.
- Keep raw secret values redacted.

Implementation:

- Add as `trufflehog`.
- Default to repository scan only.
- Use redacted JSON output.
- Run in "check this fix" mode for secrets where possible.

### 3. Bearer CLI

Recommendation: evaluate for hosted repository scanning.

Why:

- Free/open CLI for SAST plus privacy/data-flow risk.
- Strong fit for startup products because it can identify sensitive data flows, third-party sharing, and privacy risk in owner-readable language.
- Supports common product stacks including JavaScript, TypeScript, Java, Python, Ruby, PHP, and Go.

Constraints:

- It overlaps with Semgrep for SAST. Its product value is better framed as "privacy and sensitive-data risk" rather than another generic code scanner.

Implementation:

- Add as `bearer`.
- Run when supported language files exist.
- Normalize findings into "privacy/data handling", "auth/security", and "compliance readiness" areas.

### 4. OpenGrep

Recommendation: evaluate as an alternative or companion to Semgrep, not as an immediate replacement.

Why:

- Open source Semgrep-compatible engine with broad language support.
- Useful if Semgrep rule licensing or SaaS/vendor restrictions become a concern.

Constraints:

- Need to decide rule strategy. ProdUS should not rely blindly on Semgrep-maintained rule packs if rules are not licensed for ProdUS SaaS use.
- Best path is a ProdUS-owned curated ruleset for startup launch risks.

Implementation:

- Add as `opengrep` only after creating a small ProdUS rule pack.
- Use it for "launch readiness rules", not full enterprise SAST.

### 5. KICS

Recommendation: add only if we want broader IaC coverage than Checkov/Trivy.

Why:

- Open source IaC scanner with broad cloud/IaC support.
- Good for Terraform, Kubernetes, Docker, CloudFormation, Ansible, Helm, and OpenAPI-style infra definitions.

Constraints:

- Overlaps strongly with Checkov and Trivy config scanning.
- Adds value only if we tune deduplication and owner-readable grouping.

Implementation:

- Add as an optional IaC scanner.
- Run only when IaC files exist.
- Deduplicate with Checkov/Trivy by component, rule, and owner impact.

### 6. KubeLinter or Kubescape

Recommendation: do not add globally yet; add when product has Kubernetes manifests or cluster context.

Why:

- KubeLinter is focused and light for Kubernetes YAML/Helm static checks.
- Kubescape is broader and can scan local manifests, Helm charts, repos, and clusters.

Constraints:

- For most prototype/startup products, Kubernetes-specific output can become noise unless the product actually uses Kubernetes.
- Cluster scanning requires stronger authorization and a different risk model.

Implementation:

- Add KubeLinter first if static manifests are common.
- Add Kubescape later for cluster-aware checks.

### 7. testssl.sh

Recommendation: add for runtime baseline.

Why:

- Focused TLS/SSL scanner.
- Gives owner-useful launch signals: expired certs, weak protocols, bad ciphers, missing chain, HTTPS posture.
- Safer and narrower than broad active DAST.

Constraints:

- Needs explicit URL/domain authorization.
- Should run against staging or owner-approved production URL.

Implementation:

- Add as `testssl`.
- Target type: `runtime-url`.
- Normalize to "domain and HTTPS readiness".

### 8. Nuclei

Recommendation: useful, but add only with a curated safe-template allowlist.

Why:

- Very broad community-powered vulnerability scanner.
- Strong for known CVEs, exposed panels, bad headers, DNS/HTTP/SSL checks, and API checks.

Constraints:

- It can become noisy and can run intrusive templates if not controlled.
- ProdUS should not run arbitrary community templates against customer targets by default.

Implementation:

- Add as `nuclei-safe`.
- Only use low-impact templates by severity/category allowlist.
- No fuzzing or exploit-style templates unless an expert service explicitly authorizes it.

### 9. Wapiti or Nikto

Recommendation: defer for hosted default scans.

Why:

- They can find useful web/server issues.

Constraints:

- They are more active/noisy than ZAP baseline.
- Nikto database licensing has restrictions; database files may only be distributed with/for Nikto unless commercially licensed.
- Wapiti is GPLv2, so distribution/packaging has stronger obligations than permissive tools.

Implementation:

- Prefer ZAP baseline and testssl first.
- Consider Wapiti/Nikto only for a clearly named "authorized deeper web check" service.

### 10. Language-Specific Dependency Scanners

Recommendation: use selectively, not all by default.

Candidates:

- `pip-audit` for Python
- `govulncheck` for Go
- `cargo-audit` or `cargo-deny` for Rust
- `npm audit` for Node/npm
- OWASP Dependency-Check for broader SCA
- Retire.js for frontend JavaScript library usage

Why:

- They give ecosystem-specific detail that OSV/Trivy may not always capture perfectly.

Constraints:

- They overlap with OSV-Scanner and Trivy.
- Dependency-Check can be heavy and may require NVD API handling.
- Too many dependency scanners will create duplicate owner-facing findings.

Implementation:

- Detect ecosystem first.
- Use one primary dependency scanner per ecosystem.
- Dedupe by package, version, CVE/GHSA/RUSTSEC/PYSEC identifier.

## AI-Related Scanner Options

There are two different meanings of "AI scanner":

1. Scanners that use AI to find/fix normal app security issues.
2. Scanners that test AI/LLM systems, prompts, agents, RAG, or model artifacts.

For ProdUS, the self-hostable path is much stronger for category 2. Most category 1 AI AppSec scanners are SaaS/commercial.

### Self-Hostable / Usable By ProdUS

| Tool | What it checks | Fit for ProdUS | Recommendation |
| --- | --- | --- | --- |
| Promptfoo | LLM evals, RAG/agent red-team, prompt injection, jailbreaks, vulnerability reports | Very high for products with AI features or LoomAI integration | Add as an AI-opportunity/security scan later |
| garak | LLM/dialog-system vulnerability probing: leakage, prompt injection, hallucination, jailbreak, toxicity | High for AI product checks; requires safe target endpoint and prompt limits | Add after defining AI target authorization |
| PyRIT | Microsoft open framework for generative-AI red teaming | Better for expert-led checks than one-click owner scans | Integrate as service/expert workflow later |
| ModelScan | ML model artifact unsafe-code scan | Useful only if products upload or deploy model files | Add only when model artifacts exist |

Implementation principle:

- These should not be mixed into the normal scanner suite by default.
- Create a separate "AI feature safety check" depth or scanner source type.
- Require explicit owner confirmation for target endpoints, prompt budget, and allowed test intensity.
- Store only summarized findings and safe prompts/results, not sensitive conversation data.

## Commercial / Paid / License-Gated Scanner Options

ProdUS should support these first through imports/connectors, not by bundling them into our scanner worker. The exception is when the customer already runs a self-hosted licensed platform and wants ProdUS to import its results.

Deployment model definitions:

- `Customer self-hosted platform`: the vendor product can run substantially inside the customer's infrastructure, usually with a paid license.
- `Hybrid local agent`: scanner/agent/broker runs in the customer's infrastructure, but the vendor SaaS/control plane remains involved.
- `SaaS import only`: ProdUS should treat this as an external result source unless the vendor later offers a clear private deployment.
- `ProdUS-hosted caution`: ProdUS can run an open CLI or community engine, but paid rule packs/platform features need license review.

| Tool/platform | Category | Deployment model | Why paid/license-gated | Best ProdUS approach |
| --- | --- | --- | --- | --- |
| GitHub Code Security / Secret Protection / Advanced Security | Code scanning, CodeQL, Dependabot, secret scanning | Customer self-hosted platform through GitHub Enterprise Server, or GitHub-hosted with self-hosted runners | CodeQL private/org use and advanced security features require GitHub paid licensing in many cases | Import GitHub code scanning, Dependabot, and secret scanning alerts; do not host CodeQL for private commercial repos without license clarity |
| GitLab Ultimate security scanning | SAST, SCA, DAST, IaC, container scanning, AI remediation | Customer self-hosted platform through GitLab Self-Managed | Advanced security and agentic remediation are tier-gated | Import GitLab security reports from SaaS or self-managed GitLab |
| Snyk | SAST, SCA, IaC, container, AI fix | Hybrid local broker; no full on-prem Snyk platform | Free tier exists, commercial use at scale is paid; Snyk states it does not provide on-prem deployment | Keep existing external provider import; optional connector using Snyk Broker for private/self-hosted SCM |
| Semgrep Platform / Semgrep paid plans | SAST, SCA, secrets, AI/multimodal | SaaS platform; CLI can run locally | Community engine exists, but platform features and maintained rules have licensing constraints | Continue hosted CE/OpenGrep carefully with ProdUS-owned rules; import Semgrep Platform for customers who pay |
| SonarQube Server / SonarCloud commercial tiers | Code quality, SAST, secrets, supply chain | Customer self-hosted platform for SonarQube Server; SaaS for SonarCloud | Paid by LOC/tier for many security features | Keep import path; support SonarQube Server exports/connectors for customers already running it |
| GitGuardian | Secrets and NHI governance | Customer self-hosted platform available | Platform/enterprise secrets monitoring is paid | Import/connector; use Gitleaks/TruffleHog for hosted free checks |
| Aikido | SAST, SCA, DAST, cloud, AI code audit | Mostly SaaS/commercial, with local scanner concepts | Commercial platform; AI code audit is credit-based | Import/connector candidate; do not depend on it for ProdUS-hosted baseline |
| Endor Labs | SCA, reachability, AI-native AppSec | Hybrid customer-deployed components such as GHES app/outpost; SaaS platform remains central | Commercial platform | Import/connector candidate, especially for customers with GHES or private CI |
| Qwiet AI | AI-assisted SAST/SCA/secrets/container | SaaS/commercial; no clear full self-hosted platform found | Commercial platform | Import/connector candidate |
| Mend.io | SCA/SAST/container/AI/AppSec | Partial self-hosted repository integrations and Renovate self-hosted options; AppSec platform is commercial | Commercial platform | Import/connector candidate; keep customer-owned CI upload path |
| Veracode | SAST/SCA/DAST | SaaS/commercial scan platform with CI/IDE integrations; no clear full self-hosted platform found | Commercial enterprise scanner | Import/connector candidate |
| Burp Suite Professional/DAST | Web DAST | Customer self-hosted platform for Burp Suite DAST/Enterprise; Burp Pro is local desktop | Professional/Enterprise scanner is paid | Import scanner results or use for expert service evidence; consider connector for customer self-hosted DAST |
| StackHawk | DAST/API security, AI-agent workflow | Hybrid local scanner via Docker/CLI with StackHawk account/API | Commercial platform with hosted/CLI flow | Import or connector; compare with ZAP/testssl for free baseline |
| Invicti | Web/API DAST | Customer self-hosted platform/on-premises option available | Commercial quote-based scanner | Import result evidence or connect to customer on-prem Invicti |
| Tenable WAS/Nessus Expert | Web app / vulnerability management | Hybrid/cloud plus scanners/sensors; Nessus can run locally, WAS is licensed platform | Licensed/subscription products | Import result evidence; avoid presenting it as a ProdUS-hosted free scanner |
| Qualys WAS | Web app DAST | Hybrid cloud platform plus scanner appliance for internal scanning | Annual subscription/licensed platform | Import result evidence; customer manages Qualys appliance/account |
| Mobb | AI remediation of findings | SaaS/commercial remediation workflow; no clear scanner self-hosting found | Commercial/AI remediation product | Potential remediation partner, not a primary scanner |

Practical ProdUS conclusion:

- For self-hosted commercial customers, prioritize imports/connectors for GitLab Self-Managed, SonarQube Server, GitGuardian Self-Hosted, Burp Suite DAST self-hosted, Invicti on-premises, and GitHub Enterprise Server.
- For hybrid vendors, ProdUS should show them as "connect your existing scanner" rather than "run ProdUS scan".
- For SaaS-only vendors, keep the current external import model and avoid making the owner think ProdUS controls the scanner runtime.

## Recommended ProdUS Roadmap

### Phase 1: Low-Cost Hosted Additions

1. Register Hadolint.
2. Add testssl.sh for runtime HTTPS readiness.
3. Add TruffleHog as an optional second secrets check.
4. Improve deduplication and "check fixes" selection before adding broad scanners.

Why this order:

- High owner value.
- Low implementation risk.
- Clear mapping to existing service/workspace model.
- Minimal noisy output.

### Phase 2: Startup-Relevant Risk Expansion

1. Add Bearer CLI for privacy and sensitive-data flow checks.
2. Add KICS only if we want broader IaC coverage beyond Checkov/Trivy.
3. Add ecosystem-specific dependency scanners only when the product stack needs them.

### Phase 3: Controlled Runtime/DAST Expansion

1. Add Nuclei with a safe-template allowlist.
2. Consider Wapiti/Nikto only for an "authorized deeper web check" path.
3. Keep ZAP baseline as the default safe web baseline.

### Phase 4: AI Feature Safety Checks

1. Add Promptfoo as the first AI-specific scanner.
2. Add garak for deeper LLM/system red-team checks.
3. Add PyRIT only as an expert-service workflow.
4. Add ModelScan only when model artifacts exist.

## Product/UI Implications

Do not show every scanner name first. For owners, scanners should be grouped by answer:

- Repository safety
- Dependencies and containers
- Live app readiness
- AI feature safety
- Proof and fix verification

The scanner details page can still show exact tools, logs, and evidence. The product/workspace surfaces should lead with:

- Last check
- What changed
- Current launch blockers
- Fix owner/service
- Recheck button
- Evidence that proves the risk is fixed

## Sources Checked

- Gitleaks: https://github.com/gitleaks/gitleaks
- OSV-Scanner: https://google.github.io/osv-scanner/
- Semgrep Community Edition and licensing: https://semgrep.dev/products/community-edition and https://docs.semgrep.dev/licensing
- OWASP ZAP Docker baseline: https://www.zaproxy.org/docs/docker/baseline-scan/
- Trivy: https://trivy.dev/
- Syft: https://github.com/anchore/syft
- Grype: https://github.com/anchore/grype
- Checkov: https://www.checkov.io/ and https://github.com/bridgecrewio/checkov
- Hadolint: https://github.com/hadolint/hadolint
- TruffleHog: https://github.com/trufflesecurity/trufflehog
- Bearer CLI: https://docs.bearer.com/ and https://github.com/bearer/bearer
- OpenGrep: https://www.opengrep.dev/ and https://github.com/opengrep/opengrep
- Nuclei: https://github.com/projectdiscovery/nuclei
- KICS: https://github.com/checkmarx/kics
- Kubescape: https://kubescape.io/
- KubeLinter: https://docs.kubelinter.io/
- OWASP Dependency-Check: https://owasp.org/www-project-dependency-check/
- pip-audit: https://pypi.org/project/pip-audit/
- govulncheck: https://pkg.go.dev/golang.org/x/vuln/cmd/govulncheck
- cargo-audit / RustSec: https://rustsec.org/
- Promptfoo: https://github.com/promptfoo/promptfoo and https://www.promptfoo.dev/pricing
- garak: https://github.com/NVIDIA/garak and https://garak.ai/
- PyRIT: https://github.com/microsoft/PyRIT
- ModelScan: https://github.com/protectai/modelscan
- GitHub CodeQL / Advanced Security: https://docs.github.com/en/code-security/concepts/code-scanning/codeql/codeql-cli and https://github.com/security/plans
- Snyk: https://snyk.io/plans/
- GitLab security scanning: https://docs.gitlab.com/user/application_security/
- Sonar pricing: https://www.sonarsource.com/plans-and-pricing/
- GitGuardian pricing: https://www.gitguardian.com/pricing
- Burp Suite: https://portswigger.net/burp/pro
- Tenable pricing: https://www.tenable.com/buy
- Qualys WAS: https://www.qualys.com/apps/web-app-scanning
- Aikido pricing: https://www.aikido.dev/pricing
- Endor Labs pricing: https://www.endorlabs.com/pricing
