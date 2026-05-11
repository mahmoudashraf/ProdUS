# Notification Provider Adapter Implementation

Date: 2026-05-11

## Scope

This slice turns the notification delivery outbox into a production integration boundary. The default sender remains an audit-log provider for local and test safety. Production can switch email or push delivery to a signed webhook provider without changing domain workflow code.

## Backend Sequence

1. Add a `NotificationDeliverySender` abstraction for provider-specific dispatch.
2. Keep `audit-log` as the default sender for local/test environments.
3. Add a signed `webhook` sender for email and push channels.
4. Sign outbound webhook payloads with `X-ProdUS-Delivery-Signature` over timestamped JSON payloads.
5. Propagate request IDs to outbound webhooks when available.
6. Classify retryable provider failures separately from permanent configuration failures.
7. Add admin-only delivery configuration visibility at `GET /api/notifications/deliveries/config`.

## Frontend Sequence

1. Show delivery provider mode in the admin dashboard operations panel.
2. Show whether email and push providers are configured.
3. Include provider names in recent delivery audit rows.

## Production Configuration

- `APP_NOTIFICATION_EMAIL_PROVIDER=AUDIT_LOG|WEBHOOK`
- `APP_NOTIFICATION_PUSH_PROVIDER=AUDIT_LOG|WEBHOOK`
- `APP_NOTIFICATION_EMAIL_WEBHOOK_URL`
- `APP_NOTIFICATION_PUSH_WEBHOOK_URL`
- `APP_NOTIFICATION_WEBHOOK_SECRET`
- `APP_NOTIFICATION_WEBHOOK_TIMEOUT_MS`

The webhook provider requires both the channel webhook URL and `APP_NOTIFICATION_WEBHOOK_SECRET`.

## Status

Completed and verified locally.

## Verification

- `mvn test` passed, including PostgreSQL Liquibase validation, the productization workflow, and webhook sender signing coverage.
- `npm run type-check` passed.
- `npm test -- --runInBand` passed.
- `npm run build` passed.
- Live smoke passed against fresh dev servers: backend `http://127.0.0.1:8080`, frontend `http://127.0.0.1:3001`, and a local signed webhook receiver on `127.0.0.1:3999`.
- Live smoke created a mock package/workspace/support subscription, escalated an overdue support request, dispatched 4 signed webhook email deliveries, validated every `X-ProdUS-Delivery-Signature`, and confirmed provider message IDs were recorded.
- Docker images rebuilt successfully as `produs-backend:local` and `produs-frontend:local`.
