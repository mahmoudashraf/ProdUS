
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

Implemented in the current codebase:

- GitHub App connector code paths, callback endpoints, token service boundaries, source creation, and webhook signature verification.
- GitLab connector code paths, callback endpoints, source creation, and webhook token verification.
- hardened scanner worker Dockerfile with pinned scanner binaries and non-root runtime.
- scanner runtime/admin readiness gates.
- object-storage signed URL, retention, export, and deletion ledger backend structures.
- Studio owner UI for connector setup, repository source creation, signed artifact open, and evidence export.
- Admin scanner operations UI for provider status and storage governance.
- LoomAI staging/mock endpoint wiring and fallback tests.
- Local Docker verification for `produs-scanner-worker:local` from `backend/` context, including non-root tool-version checks.

Production dependencies still pending:

- real GitHub App credentials, private key, webhook secret, install validation, token-backed hosted scan validation, and provider event validation.
- real GitLab app/OAuth credentials, webhook secret, project validation, and GitLab report import validation.
- scanner worker image SBOM and vulnerability scan gate.
- production object-store bucket, KMS/provider encryption, block-public-access, retention/export/deletion validation.
- real LoomAI staging/production deployment configuration and live productization allowlist validation.

Recommended production-readiness order:

1. Generate SBOM for `produs-scanner-worker:local` and run image vulnerability scan.
2. Configure object storage in staging and validate signed URL, retention cleanup, export bundle, and deletion ledger flows.
3. Configure GitHub App credentials in staging and verify install, repository picker, webhook, token-backed hosted scan, disconnect, and audit events.
4. Integrate LoomAI staging with the productization MCP allowlist and validate fallback/disallowed-action behavior.
5. Deploy scanner worker and GitHub connector to production behind feature flags.
6. Enable LoomAI production after fallback and allowlist verification.
7. Validate GitLab when a customer path requires it or after the GitHub path stabilizes.

## Operations Support Direction

We still need to model operational/support teams as first-class providers of support packages:

- support package catalog by tools, tech stack, response window, and service scope
- support-plan attachment to workspaces after handoff
- scheduled scanner evidence refresh tied to support plans
- operational team dashboards for incidents, maintenance, scanner drift, and handoff health
