# Pending Production Readiness Plan

Date: 2026-05-11

Status: pending

## Objective

Move the completed ProdUS MVP from local/dev readiness into a production-acceptance path. This plan is intentionally limited to readiness sequencing; no production implementation is started from this document alone.

## Sequence

1. Production environment setup
   - Create/configure the Supabase project for production auth and user identity.
   - Provision production PostgreSQL, either Railway Postgres or another managed Postgres target.
   - Configure backend environment variables for PostgreSQL, Supabase JWT validation, CORS, storage, webhook secrets, notification provider settings, and LoomAI if enabled.
   - Configure frontend environment variables for API origin and Supabase public credentials.
   - Disable mock auth and H2 outside local/test profiles.

2. Production-like Docker deployment smoke
   - Start backend and frontend from the production Docker images.
   - Run Liquibase migrations against PostgreSQL.
   - Verify backend health, frontend route serving, CORS, request IDs, and auth token validation.
   - Run the owner, team manager, specialist, and admin happy paths against the deployed environment.
   - Verify support SLA scans, notification delivery dispatch, signed webhook callbacks, and evidence attachment upload/download.

3. End-to-end acceptance coverage
   - Add Playwright acceptance flows for owner onboarding, requirement intake, package generation, workspace execution, support requests, and notifications.
   - Add team manager acceptance flows for team setup, proposals, support subscriptions, disputes, and evidence.
   - Add specialist acceptance flows for workspace participation and deliverables.
   - Add admin acceptance flows for catalog setup, SLA scans, notification dispatch, and provider configuration visibility.
   - Use mocks for provider callbacks, outbound notification webhooks, and non-critical external integrations.

4. Real provider adapter selection
   - Choose payment provider path: Stripe or Adyen.
   - Choose e-signature provider path: DocuSign or PandaDoc.
   - Choose email/push provider path: signed webhook bridge, Resend/SendGrid, FCM, or APNs.
   - Keep provider-specific adapters behind the existing provider-neutral callback and notification boundaries.

5. Production operations
   - Define PostgreSQL backup, restore, and migration rollback procedures.
   - Add error monitoring and log correlation around `X-Request-ID`.
   - Define admin bootstrap and role-assignment procedures.
   - Review public endpoints, role boundaries, webhook signature handling, file access, and CORS settings before launch.

## Acceptance Criteria

- Production-like deployment runs with PostgreSQL and Supabase auth, with mock auth disabled.
- Docker images boot cleanly with production environment variables.
- Core owner, team, specialist, and admin flows pass against the deployed environment.
- Signed inbound and outbound webhook paths are verified with mocks.
- Evidence storage works with production-compatible object storage.
- E2E acceptance suite covers the launch-critical flows.
- Operations runbooks exist for deployment, backup/restore, rollback, and admin bootstrap.
