# Support SLA, Notification Delivery, and CI Implementation

Date: 2026-05-11

## Scope

This slice adds the production operations path around support requests and notifications. It keeps external email/push providers optional by using a persisted delivery outbox and audited dispatch path that can be swapped to provider-specific senders later.

## Backend Sequence

1. Extend `support_requests` with SLA state, escalation count, escalation timestamp, and last SLA scan timestamp.
2. Add a support SLA service and scheduled scanner for due-soon and overdue support requests.
3. Add admin-only manual SLA scan API: `POST /api/commerce/support-requests/sla/run`.
4. Add `notification_deliveries` as an outbox for email/push delivery attempts tied to platform notifications.
5. Enqueue delivery records when notifications are created, controlled by environment-backed delivery flags.
6. Add scheduled and admin-triggered delivery dispatch with auditable sent/failed/skipped outcomes.
7. Add admin-only delivery APIs under `/api/notifications/deliveries`.

## Frontend Sequence

1. Show support request SLA state and escalation count in the workspace support panel.
2. Add admin dashboard controls for manual SLA scans and notification delivery dispatch.
3. Show recent notification delivery records on the dashboard for admin operations.

## CI Sequence

1. Replace stale template workflows with ProdUS workflows.
2. Run backend tests with Java 21.
3. Run frontend install, type-check, unit tests, and production build with Node 20.
4. Build backend and frontend Docker images in CI after tests pass.
5. Keep a manual full verification workflow for clean-test and Docker confirmation.

## Status

Completed and verified locally.

## Verification

- Backend compile: `mvn -DskipTests compile` passed.
- Backend tests: `mvn test` passed, including PostgreSQL Testcontainers migration coverage for `notification_deliveries`, support request SLA columns, and the productization workflow SLA/outbox path.
- Frontend type check: `npm run type-check` passed.
- Frontend tests: `npm test -- --runInBand` passed.
- Frontend production build: `npm run build` passed.
- Live backend/frontend smoke passed against `http://127.0.0.1:8080` and `http://127.0.0.1:3001`.
- Live smoke covered admin catalog setup, product/requirement/package/workspace creation, support subscription creation, overdue support request passive SLA state, owner-forbidden admin operations, admin SLA escalation, escalation notification fan-out, admin delivery dispatch, and sent email delivery lookup.
- Docker images rebuilt successfully as `produs-backend:local` and `produs-frontend:local`.
