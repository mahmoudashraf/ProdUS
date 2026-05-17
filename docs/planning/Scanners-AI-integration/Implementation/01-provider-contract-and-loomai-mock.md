# Sequence 01 - Provider Contract And LoomAI Mock

Date: 2026-05-17

Status: implemented - provider contract, package governance wiring, and fallback tests

## Objective

Create a stable ProdUS-owned AI provider contract and wire the existing package governance flow through it. This sequence makes LoomAI mockable without giving AI authority over package construction.

The deterministic package builder remains the source of truth for package modules, dependencies, and workflow state. The provider can review, explain, score, and produce governance metadata, but it cannot directly create unvalidated package contents.

## In Scope

- Define a provider interface for package governance.
- Wire `PackageBuilderService` through the provider.
- Preserve deterministic fallback behavior.
- Add a local LoomAI mock service or dev-only mock endpoint.
- Persist provider output into `AIRecommendation`.
- Add backend contract tests for success, failures, timeout, and disabled mode.

## Out Of Scope

- Real LoomAI production API compatibility.
- Scanner-backed diagnosis.
- Chat UI.
- Team creation, team invitations, profile editing, account settings, or community actions.
- AI-created package modules without deterministic validation.

## Current Code Baseline

Existing:

- `backend/src/main/java/com/produs/ai/loom/LoomAIProvider.java`
- `backend/src/main/java/com/produs/ai/loom/LoomAIProperties.java`
- `backend/src/main/resources/application.yml`
- `backend/src/main/resources/application-prod.yml`
- `backend/src/main/java/com/produs/packages/PackageBuilderService.java`
- `backend/src/main/java/com/produs/ai/AIRecommendation.java`

Implemented:

- `PackageGovernanceProvider` is the ProdUS-owned provider boundary for package governance.
- `LoomAIProvider` implements the provider boundary and falls back deterministically when disabled, unavailable, slow, or invalid.
- `PackageBuilderService` creates deterministic package modules first, then calls the provider for governance metadata.
- `AIRecommendation` stores provider name, provider request ID, fallback flag, fallback reason, confidence, rationale, and output JSON.
- Invalid provider bodies are not persisted raw; fallback output stores a response hash instead.
- Contract tests cover disabled, success, HTTP 500, invalid JSON, and timeout behavior.

## Backend Implementation

### 1. Provider Interface

Add a ProdUS-owned interface, for example:

```text
backend/src/main/java/com/produs/ai/PackageGovernanceProvider.java
```

Contract:

- Input:
  - requirement ID
  - package ID
  - product ID/name
  - business goal
  - risk signals
  - selected module names/codes
  - deterministic package JSON
  - fallback confidence
- Output:
  - provider name
  - prompt/version
  - confidence
  - rationale
  - output JSON
  - fallback flag
  - fallback reason when applicable

### 2. Deterministic Provider

Add a deterministic provider implementation that always returns current behavior.

Rules:

- Used when LoomAI is disabled.
- Used when LoomAI is unavailable.
- Used when LoomAI response is invalid.
- Must not require network access.

### 3. LoomAI Provider Adapter

Keep the current `LoomAIProvider` behavior but adapt it to the interface.

Current endpoint:

```text
POST {LOOMAI_BASE_URL}/api/v1/produs/package-governance
```

Required behavior:

- Send request ID when present.
- Send bearer API key only when configured.
- Timeout using `LOOMAI_TIMEOUT_MS`.
- Treat non-2xx responses as fallback.
- Treat invalid JSON as fallback.
- Never persist API key or full request headers.

### 4. Package Builder Wiring

Update `PackageBuilderService`:

- Build deterministic package modules exactly as today.
- Generate deterministic package JSON.
- Call `PackageGovernanceProvider`.
- Save provider result to `AIRecommendation`.
- Use provider result for `promptVersion`, `confidence`, `rationale`, and `outputJson`.
- Keep package creation successful even when provider fails.

### 5. Dev Mock

Add one of these:

- A small mock HTTP service under a local tooling directory.
- A Spring profile-specific dev mock endpoint.
- A WireMock/test-only server for contract tests.

Minimum dev endpoint:

```text
POST /api/v1/produs/package-governance
```

Minimum response:

```json
{
  "confidence": 0.88,
  "rationale": "Mock LoomAI reviewed the deterministic package, confirmed required dependencies, and found no blocked governance issue.",
  "riskLevel": "LOW",
  "missingDependencies": [],
  "recommendedQuestions": [
    "Confirm repository access before milestone planning.",
    "Confirm ownership of deployment and monitoring credentials."
  ],
  "sourceRefs": [
    "deterministicPackage.modules",
    "requirement.businessGoal"
  ]
}
```

## Environment

Local mock mode:

```bash
LOOMAI_ENABLED=true
LOOMAI_BASE_URL=http://localhost:8090
LOOMAI_API_KEY=dev-loomai-mock
LOOMAI_TIMEOUT_MS=2500
```

Default dev/test behavior:

```bash
LOOMAI_ENABLED=false
```

## Data And Audit Requirements

Persist in `AIRecommendation`:

- `recommendationType`: `PACKAGE_COMPOSITION` or `PACKAGE_GOVERNANCE`
- `sourceEntityType`: `REQUIREMENT_INTAKE` or `PACKAGE_INSTANCE`
- `sourceEntityId`
- `promptVersion`
- `confidence`
- `rationale`
- `outputJson`

Output JSON should include:

- provider name
- fallback flag
- fallback reason when applicable
- deterministic package summary
- safe source references
- missing dependencies if any
- governance warnings if any

Do not persist:

- LoomAI API key
- bearer token
- raw authorization headers
- full user credentials
- private artifact URLs

## Tests

Backend tests:

- `LOOMAI_ENABLED=false` uses deterministic fallback.
- Mock LoomAI 2xx response is saved as provider output.
- Mock LoomAI 500 response falls back.
- Mock LoomAI invalid JSON falls back.
- Mock LoomAI timeout falls back.
- Package creation succeeds even when provider fails.
- Recommendation output does not contain API key or bearer token.

Suggested commands:

```bash
cd backend
mvn test
```

## Exit Criteria

- Package creation continues to work with LoomAI disabled.
- Package creation records LoomAI mock provider output when enabled and configured.
- Fallback paths are tested.
- No package module is created directly from unvalidated AI output.
- The UI can distinguish deterministic-only recommendation from provider-reviewed recommendation through persisted records.

## Production Considerations

- Keep provider disabled by default in production until the real LoomAI contract is confirmed.
- Use low timeout and fallback to protect owner workflow latency.
- Add provider latency and fallback-rate metrics in a later operations sequence.
