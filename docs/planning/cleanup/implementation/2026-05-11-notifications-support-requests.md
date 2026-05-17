# Notifications and Support Requests Implementation

Date: 2026-05-11

## Scope

This slice turns platform events into owner/team action records and makes support subscriptions operational through tracked support requests. It is intentionally provider-neutral and does not require payment, signature, email, or LoomAI credentials.

## Backend Sequence

1. Add `platform_notifications` for recipient-scoped, typed, priority-aware in-app notifications.
2. Add `/api/notifications`, `/api/notifications/summary`, `/api/notifications/{id}/read`, and `/api/notifications/read-all`.
3. Fan out notifications from proposals, proposal status changes, contracts, invoices, provider webhooks, support subscriptions, support requests, disputes, and evidence attachments.
4. Add `support_requests` tied to workspace, optional support subscription, assigned team, owner, opener, priority, status, due date, and resolution.
5. Add support request list/create/status APIs under `/api/commerce`.
6. Enforce visibility and mutation permissions for workspace owners, admins, assigned team managers, and active assigned team members.

## Frontend Sequence

1. Replace the static template notification menu with API-backed notifications.
2. Show unread count, status filtering, mark-read, and mark-all-read actions in the header.
3. Add dashboard Action Center summary from `/api/notifications/summary`.
4. Extend the workspace Support panel with support request creation, listing, status updates, due dates, and resolution notes.
5. Keep React Query cache invalidation aligned with notification-producing mutations.

## Status

Completed for this implementation slice.

## Verification

- Backend compile: `mvn -DskipTests compile` passed.
- Backend tests: `mvn test` passed, including PostgreSQL Liquibase validation for `platform_notifications` and `support_requests`, notification fan-out, support request lifecycle, and read-all behavior.
- Frontend type check: `npm run type-check` passed.
- Frontend unit tests: `npm test -- --runInBand` passed.
- Frontend production build: `npm run build` passed.
- Live API/UI smoke: dev backend and frontend created a mock package/workspace, submitted a proposal, created an active support subscription, opened and updated a support request, verified owner/team notification fan-out, marked owner notifications read, and served `/dashboard`.
- Docker readiness: `docker build -t produs-backend:local ./backend` and `docker build -t produs-frontend:local ./frontend` passed after this slice.
