
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

Production dependencies still pending:

- GitHub App install/token/webhook implementation with real credentials
- GitLab app/OAuth implementation with real credentials
- hardened scanner worker image with pinned scanner binaries
- production object-store retention/export/deletion policy
- real LoomAI staging/production deployment configuration

## Operations Support Direction

We still need to model operational/support teams as first-class providers of support packages:

- support package catalog by tools, tech stack, response window, and service scope
- support-plan attachment to workspaces after handoff
- scheduled scanner evidence refresh tied to support plans
- operational team dashboards for incidents, maintenance, scanner drift, and handoff health
