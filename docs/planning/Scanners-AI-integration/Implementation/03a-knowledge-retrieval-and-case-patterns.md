# Sequence 03A - Knowledge Retrieval And Case Patterns

Date: 2026-05-17

Status: implemented - safe catalog/package knowledge export foundation

## Objective

Create the safe knowledge layer that LoomAI can use for productization guidance, package governance, service recommendations, milestone drafting, and handoff readiness.

This sequence covers what can be indexed, what must stay behind live ProdUS APIs, and how completed project patterns become reusable without exposing sensitive customer data.

## In Scope

- Safe knowledge source inventory.
- Data-sync/export contract for approved shared knowledge.
- Retrieval connector contract for customer-owned live records.
- Case pattern anonymization rules.
- Knowledge freshness, deletion, and environment separation.
- Retrieval evaluation fixtures.

## Out Of Scope

- Raw repository indexing.
- Raw scanner artifact indexing.
- User/private message indexing.
- Customer credential or secret indexing.
- Real LoomAI production data sync before staging contract confirmation.

## Safe Knowledge Sources

Safe to index after review:

- service catalog categories/modules
- service dependencies
- package templates
- milestone templates
- acceptance criteria templates
- evidence requirement templates
- handoff checklists
- scanner tool descriptions
- productization workflow guidance
- public/help documentation
- anonymized completed package patterns
- anonymized team delivery outcome patterns for project matching only

Not safe to index by default:

- raw repository contents
- raw scanner outputs
- unredacted SARIF artifacts
- secrets, tokens, private URLs, credentials
- user-owned product records
- private workspace messages
- full webhook payloads
- uploaded evidence files
- payment/commercial records

## Data Sync Contract

Prepare a ProdUS-owned export shape that can later map to LoomAI data-sync endpoints.

Record fields:

- record ID
- tenant/environment
- record type
- title
- body/summary
- tags
- source URL or backend reference
- version
- updated at
- sensitivity level
- allowed use: `retrieval`, `evaluation`, `operator_only`
- deletion key

Supported record types:

- `service_module`
- `service_dependency`
- `package_template`
- `milestone_template`
- `acceptance_criteria_template`
- `evidence_template`
- `handoff_checklist`
- `scanner_tool_description`
- `case_pattern`

## Future LoomAI Data Sync Mapping

The external LoomAI proposal references:

```text
POST /api/ai/data-sync/upsert
POST /api/ai/data-sync/batch
POST /api/ai/data-sync/delete
GET /api/admin/indexing/overview
GET /api/admin/indexing/vectors
```

ProdUS should not hard-code those paths into core logic yet. Add a provider/export adapter so the final LoomAI data-sync contract can be swapped in after staging confirmation.

## Live Retrieval Connector

For user-owned or sensitive records, use live lookup through ProdUS APIs/MCP instead of bulk indexing.

Examples:

- product health summary
- workspace evidence state
- scan run status
- finding detail
- package-specific team shortlist
- milestone review status

Connector behavior:

- receives authenticated user/session context
- enforces backend ACLs
- returns only safe snippets/summaries
- includes source refs
- redacts secrets/private URLs
- fails closed when ownership is unclear

## Case Pattern Rules

Completed project patterns can improve recommendations, but only after anonymization.

Allowed fields:

- product stage
- broad tech stack
- service package shape
- timeline band
- budget band
- finding categories
- milestone structure
- evidence types used
- outcome summary
- delivery risk factors

Excluded fields:

- customer names unless public and approved
- repository names/URLs
- raw code paths if identifying
- private team messages
- exact contract terms
- exact payment details
- secrets/tokens/logs

## Backend Implementation

Implemented:

- `LoomAIIntegrationService` builds safe knowledge records for service categories, service modules, service dependencies, package templates, and AI capability contracts.
- Admin-only `/api/ai/loomai/knowledge-preview` returns the safe export preview without secret material.
- Admin-only `/api/ai/loomai/knowledge-sync` posts records to the configured LoomAI batch sync path when enabled and configured.
- If LoomAI is disabled or unconfigured, sync returns an explicit `SKIPPED` status instead of pretending the index is updated.
- Customer-owned product, workspace, scanner, and finding records remain behind authorized live context APIs and are not bulk-indexed.

Add read-only knowledge export endpoints or services:

```text
GET /api/ai-knowledge/exports/catalog
GET /api/ai-knowledge/exports/templates
GET /api/ai-knowledge/exports/case-patterns
GET /api/ai-knowledge/exports/deletions
```

Alternatively, keep these as internal services first and expose through an admin-only sync job later.

Required behavior:

- stable IDs
- version/hash
- sensitivity classification
- deleted-record tombstones
- environment/tenant separation
- audit sync runs

## Frontend Implementation

Admin/operator view later:

- knowledge sync status
- indexed record counts by type
- stale records
- failed syncs
- last deletion sync
- sensitivity warnings

Owner/team UI does not need a visible knowledge management screen.

## MCP/AI Support

MCP remains the live data path for user-owned product/project data.

Retrieval is used for:

- general productization guidance
- service definitions
- package template rationale
- dependency explanations
- acceptance criteria examples
- handoff checklist guidance
- anonymized case pattern hints

## Tests

Backend:

- exports include catalog/templates/rules.
- exports exclude secrets/private URLs.
- case pattern anonymization removes customer identifiers.
- deletion tombstones are emitted.
- only admin/internal sync can access exports if exposed.

Retrieval evaluation fixtures:

- service recommendation question returns relevant service modules.
- package dependency question returns dependency rules.
- milestone evidence question returns criteria/evidence templates.
- no fixture returns raw secrets or private data.

## Exit Criteria

- Safe knowledge sources are inventoried.
- A data-sync/export adapter contract exists.
- Sensitive live data remains behind authorized API/MCP lookup.
- Case pattern anonymization rules are documented and testable.
- Sequence 06 has a concrete retrieval source list to register with LoomAI staging.

## Production Considerations

- Separate staging and production indexes.
- Do not copy staging vectors into production.
- Add deletion sync before production indexing.
- Add retention rules for case patterns.
- Review each new knowledge source before indexing.
