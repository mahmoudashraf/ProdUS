
# Next Implementation Notes

## Scanner And AI Integration

Current code now supports the scanner/evidence BRD path for:

- connector permission visibility
- source creation, listing, disconnect, and disconnect-time artifact deletion
- hosted scanner runs, cancel, rescan, tool runs, and admin health
- CI evidence upload and external scanner imports
- runtime URL scans behind explicit authorization
- persistent scanner schedules with pause/resume
- owner Studio scanner workflow and admin scanner operations UI

Tracked in:

- `docs/planning/Scanners-AI-integration/integration_brd.md`
- `docs/planning/Scanners-AI-integration/Implementation/08-brd-gap-closure-runtime-connectors-and-schedules.md`
- `docs/planning/Scanners-AI-integration/PRODUCTION_READINESS_PLAN.md`

Production dependencies still pending:

- GitHub App install/token/webhook implementation with real credentials
- GitLab app/OAuth implementation with real credentials
- hardened scanner worker image with pinned scanner binaries
- production object-store retention/export/deletion policy
- real LoomAI staging/production deployment configuration

Recommended production-readiness order:

1. Harden scanner worker image and object storage in staging.
2. Implement GitHub App connector in staging.
3. Verify real GitHub-backed scanner flows against internal/test repositories.
4. Enable retention cleanup and export/deletion verification in staging.
5. Integrate LoomAI staging with the productization MCP allowlist.
6. Deploy scanner worker and GitHub connector to production behind feature flags.
7. Enable LoomAI production after fallback and allowlist verification.
8. Implement GitLab connector after GitHub path stabilizes unless a committed customer requires GitLab first.

## Operations Support Direction

We still need to model operational/support teams as first-class providers of support packages:

- support package catalog by tools, tech stack, response window, and service scope
- support-plan attachment to workspaces after handoff
- scheduled scanner evidence refresh tied to support plans
- operational team dashboards for incidents, maintenance, scanner drift, and handoff health
