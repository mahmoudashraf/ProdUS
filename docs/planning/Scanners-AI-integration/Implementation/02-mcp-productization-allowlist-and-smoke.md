# Sequence 02 - MCP Productization Allowlist And Smoke

Date: 2026-05-17

Status: implemented - LoomAI allowlist profile and scanner/evidence MCP tools

## Objective

Create a LoomAI-specific action allowlist over the existing MCP gateway and add a repeatable smoke path that proves AI-visible tools are limited to productization, project, evidence, and scanning workflows.

The MCP gateway can remain broader for internal platform use. LoomAI must not import all MCP tools by default.

## In Scope

- Define the first LoomAI-importable MCP tool allowlist.
- Add a local MCP smoke harness or script.
- Verify allowed read and mutation tools.
- Verify excluded tools are not exposed through the LoomAI mock bridge.
- Verify backend authorization and invocation audit.

## Out Of Scope

- Real LoomAI host registration.
- Team creation or team administration through AI.
- Expert profile/community/account flows through AI.
- Scanner tools that do not exist yet.

## Initial Allowlist

Allowed now:

- `produs.catalog.search`
- `produs.product.list`
- `produs.package.inspect`
- `produs.workspace.inspect`
- `produs.requirement.submit`
- `produs.package.build_from_requirement`
- `produs.team.shortlist`
- `produs.workspace.create`
- `produs.deliverable.update`

Allowed after scanner/evidence implementation and now implemented:

- `produs.scan.start`
- `produs.scan.status`
- `produs.scan.cancel`
- `produs.finding.inspect`
- `produs.finding.accept_risk`
- `produs.evidence.upload_ci_result`
- `produs.milestone.review_evidence`

Excluded:

- `produs.team.profile.update`
- `produs.team.capability.add`
- team creation
- team invitations
- team join requests
- expert profile updates
- account settings
- community messages
- broad admin operations
- commercial/payment actions

## Backend/MCP Implementation

Implemented:

- `mcp-server/src/allowlists.ts` defines the `loomai-productization` tool profile and descriptor metadata.
- `PRODUS_MCP_TOOL_PROFILE=loomai-productization` filters registered MCP tools at server startup.
- `/loomai/tool-allowlist` exposes safe allowlist metadata for registration/review without backend credentials.
- Productization and scanner/evidence tools are allowlisted; team/profile/community/admin/commercial tools remain excluded.
- Scanner MCP tools now cover scan start/status/cancel, finding inspect/risk acceptance, evidence list/CI upload, and milestone evidence review.
- Existing MCP mutation handlers still require `confirm: true` and a human-readable `reason`.
- Tests verify allowlist contents, excluded tools, mutation confirmation metadata, secure config defaults, request forwarding, and redacted input hashing.

### 1. Allowlist Descriptor

Add a static or generated descriptor for LoomAI import.

Options:

- JSON file in `mcp-server/src/allowlists/loomaiProductizationTools.json`.
- TypeScript constant exported from `mcp-server/src/allowlists.ts`.
- Backend endpoint that lists AI-importable capabilities.

Required fields:

- tool name
- action category
- read/mutation
- confirmation required
- roles
- target entity type
- reason for inclusion
- excluded related tools

### 2. Mock Bridge Filtering

The LoomAI mock bridge should:

- Discover all MCP tools from `/mcp`.
- Filter to the allowlist.
- Refuse excluded tools even if directly requested.
- Preserve backend authorization by forwarding the user token.
- Require `confirm: true` and `reason` for mutations.

### 3. MCP Smoke Script

Add a local script such as:

```text
mcp-server/scripts/smoke-productization-mcp.ts
```

The script should:

1. Obtain a mock auth token from backend.
2. Connect to MCP.
3. List available tools.
4. Apply the LoomAI allowlist.
5. Call `produs.catalog.search`.
6. Call a mutation without `confirm` and confirm it is rejected.
7. Call one low-risk confirmed productization mutation.
8. Query `/api/mcp/invocations` and verify audit exists.
9. Assert excluded tools are not available through the mock bridge.

## Security Requirements

- MCP remains authenticated by default.
- Backend authorization remains authoritative.
- The allowlist is a presentation/import control, not the security boundary.
- Mutations require confirmation and audit.
- Excluded tools must not appear in LoomAI UI/action catalogs.
- Tool arguments containing tokens/secrets must be redacted before hashing or logging.

## Tests

MCP tests:

- Allowlist contains only approved tools.
- Excluded tools are filtered out.
- Attempt to execute excluded tool through the mock bridge fails before backend call.
- Read tool returns expected JSON content.
- Mutation without confirmation is rejected.
- Confirmed mutation creates an audit row.

Commands:

```bash
cd mcp-server
npm test
npm run type-check
```

Backend supporting test:

```bash
cd backend
mvn -q -Dtest=ProductizationWorkflowIntegrationTest test
```

## Exit Criteria

- LoomAI mock bridge can only see productization tools.
- Excluded team/profile/community tools are not visible to the bridge.
- Confirmed allowed mutation records an MCP invocation.
- Unauthorized backend actions still fail even if a tool is visible.
- A developer can run one smoke command after starting backend and MCP.

## Production Considerations

- Production LoomAI registration must use the allowlist, not raw `tools/list`.
- Host-layer role-aware filtering should be added where supported.
- Backend authorization remains required even after host-layer filtering is added.
