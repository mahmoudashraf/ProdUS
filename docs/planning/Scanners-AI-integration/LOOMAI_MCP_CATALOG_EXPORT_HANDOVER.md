# ProdUS MCP Catalog Export Handover For LoomAI

Date: 2026-06-01

Purpose: add a read-only MCP action that lets LoomAI `thinker` answer broad service-catalog questions without paging through search results.

## New MCP Tool

Tool name:

```text
produs.catalog.export
```

Expected LoomAI action id after import:

```text
produs_catalog_export
```

Mode:

```text
read
```

Confirmation required:

```text
false
```

Description:

```text
Fetch the full active ProdUS lifecycle service catalog for broad service, package, dependency, and capability questions.
```

## Inputs

All inputs are optional.

```json
{
  "categorySlug": "quality-testing",
  "serviceLayer": "testing",
  "includeDependencies": true,
  "includePackageTemplates": true
}
```

Accepted aliases:

- `categorySlug`: `category`, `category_slug`
- `serviceLayer`: `layer`, `service_layer`

Defaults:

- `includeDependencies`: `true`
- `includePackageTemplates`: `true`

Usage guidance:

- Call with no arguments when the user asks "what services do you provide?", "what testing packs exist?", "what can ProdUS help with?", or similar broad service questions.
- Use `produs.catalog.search` for targeted lookup.
- Use `produs.catalog.export` when answer quality depends on knowing the complete active catalog and package-template shape.

## Output Shape

The MCP response keeps the standard `result.structuredContent` wrapper. The structured content shape is:

```json
{
  "status": "OK",
  "tool": "produs.catalog.export",
  "filters": {
    "categorySlug": null,
    "serviceLayer": null,
    "includeDependencies": true,
    "includePackageTemplates": true
  },
  "counts": {
    "categories": 0,
    "modules": 0,
    "dependencies": 0,
    "packageTemplates": 0
  },
  "summary": "Matched categories: ...; service modules: ...; package templates: ....",
  "categories": [
    {
      "id": "uuid",
      "name": "Quality Testing",
      "slug": "quality-testing",
      "description": "Owner-safe category summary."
    }
  ],
  "modules": [
    {
      "id": "uuid",
      "name": "Test Coverage Boost",
      "slug": "test-coverage-boost",
      "stableCode": "quality.test_coverage_boost",
      "category": "Quality Testing",
      "categorySlug": "quality-testing",
      "serviceLayer": "testing",
      "description": "Owner-safe module summary.",
      "ownerOutcome": "Business outcome for the owner.",
      "expectedDeliverables": "Concrete deliverables.",
      "acceptanceCriteria": "Acceptance criteria.",
      "timelineRange": "1-2 weeks",
      "priceRange": "$...",
      "maturityLevel": "..."
    }
  ],
  "dependencies": [
    {
      "sourceModule": {
        "id": "uuid",
        "name": "Launch Readiness",
        "slug": "launch-readiness"
      },
      "dependsOnModule": {
        "id": "uuid",
        "name": "Security Review",
        "slug": "security-review"
      },
      "required": true,
      "dependencyType": "REQUIRES",
      "reason": "Why this dependency exists.",
      "message": "Owner-facing dependency message."
    }
  ],
  "packageTemplates": [
    {
      "id": "uuid",
      "name": "Production Readiness Package",
      "slug": "production-readiness-package",
      "targetProductStage": "PROTOTYPE",
      "description": "Template description.",
      "customerFit": "Who this package fits.",
      "timelineRange": "4-6 weeks",
      "budgetRange": "$...",
      "outcomeSummary": "Expected package outcome.",
      "modules": [
        {
          "name": "Security Review",
          "slug": "security-review",
          "stableCode": "security.review",
          "required": true,
          "phaseName": "Secure",
          "rationale": "Why the module belongs in this template."
        }
      ]
    }
  ]
}
```

## LoomAI Update Needed

After ProdUS backend is deployed with this tool:

1. Rerun MCP discovery against ProdUS staging:

```text
GET https://produs-api-staging.46.224.145.148.sslip.io/loomai/tool-allowlist
POST https://produs-api-staging.46.224.145.148.sslip.io/mcp
```

2. Use the existing staging MCP API key from the private handoff. Do not add this secret to docs.

3. Update the ProdUS read-action Marketplace manifest/import to include:

```text
produs.catalog.export
```

4. Reapply the LoomAI deployment and verify the runtime action catalog exposes:

```text
produs_catalog_export
```

5. Run a `thinker` smoke prompt:

```text
What lifecycle services and testing-related packages does ProdUS offer?
```

Expected behavior:

- LoomAI may call `produs_catalog_export`.
- The answer should describe concrete ProdUS services/modules/templates by name.
- The answer should not invent services outside the returned catalog.
- Mutating actions must remain unavailable in this read-only answer path.

## ProdUS Verification Commands

Tool list:

```bash
curl -fsS \
  -H "X-MCP-API-KEY: <private-mcp-key>" \
  https://produs-api-staging.46.224.145.148.sslip.io/loomai/tool-allowlist
```

MCP call:

```bash
curl -fsS \
  -H "X-MCP-API-KEY: <private-mcp-key>" \
  -H "Content-Type: application/json" \
  https://produs-api-staging.46.224.145.148.sslip.io/mcp \
  --data '{
    "jsonrpc": "2.0",
    "id": "catalog-export-smoke",
    "method": "tools/call",
    "params": {
      "name": "produs.catalog.export",
      "arguments": {
        "includeDependencies": true,
        "includePackageTemplates": true
      }
    }
  }'
```

Do not share returned private operational data beyond sanitized counts and service names.
