# ProdUS Network Development Guide

## Purpose

ProdUS Network is the expert community and team-formation product area. It lives beside ProdUS Studio, uses the same backend and user model, and is built for expert profiles, team profiles, formation posts, contextual messages, service-category channels, join requests, trials, search, and notifications.

Canonical product domains:

- `produs.com`: public site and logged-out discovery.
- `studio.produs.com`: productization, lifecycle services, draft cart, service plans, team selection, workspaces, evidence, and delivery.
- `network.produs.com`: expert community, team formation, expert/team profiles, channels, messages, join requests, and trial collaboration.
- `api.produs.com`: backend API.

Production auth should use a server-managed secure HTTP-only session cookie scoped to `.produs.com`, with Supabase as the identity provider. Local mock auth still uses bearer tokens for development.

## Local Startup

Backend:

```bash
cd backend
SPRING_PROFILES_ACTIVE=dev APP_MOCK_AUTH_ENABLED=true mvn spring-boot:run
```

Frontend production-style run:

```bash
cd frontend
NEXT_PUBLIC_MOCK_AUTH_AUTO_LOGIN=true NEXT_PUBLIC_MOCK_AUTH_DEFAULT_ROLE=SPECIALIST npm run build
rm -rf .next/standalone/.next/static .next/standalone/public
mkdir -p .next/standalone/.next
cp -R .next/static .next/standalone/.next/static
test -d public && cp -R public .next/standalone/public || true
PORT=3000 HOSTNAME=0.0.0.0 node .next/standalone/server.js
```

Development-mode frontend:

```bash
cd frontend
npm run dev
```

Useful local URLs:

- `http://localhost:3000/expert-network`
- `http://localhost:3000/expert-network/directory`
- `http://localhost:3000/expert-network/formation`
- `http://localhost:3000/expert-network/messages`
- `http://localhost:3000/expert-network/channels`
- `http://localhost:3000/expert-network/notifications`
- `http://localhost:3000/expert-network/search?q=security`

## Mock Users

Use these local test accounts:

- `admin@produs.com` / `admin123`
- `owner@produs.com` / `owner123`
- `team@produs.com` / `team123`
- `specialist@produs.com` / `specialist123`
- `advisor@produs.com` / `advisor123`

Mock login API:

```bash
curl -sS -X POST http://localhost:8080/api/mock/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"specialist@produs.com","password":"specialist123"}'
```

## Backend Package

Network backend code lives in:

```text
backend/src/main/java/com/produs/network/
```

Main controller:

```text
backend/src/main/java/com/produs/network/ExpertNetworkController.java
```

Migration:

```text
backend/src/main/resources/db/changelog/V013__expert_network_community.yaml
```

Seed data:

```text
backend/src/main/java/com/produs/service/PlatformDemoSeedService.java
```

## Core API

Network home and search:

- `GET /api/expert-network/home`
- `GET /api/expert-network/search?query=security`

Formation:

- `GET /api/expert-network/formation-posts`
- `POST /api/expert-network/formation-posts`
- `PUT /api/expert-network/formation-posts/{id}`
- `POST /api/expert-network/formation-posts/{id}/close`

Channels:

- `GET /api/expert-network/channels`
- `GET /api/expert-network/channels/{slug}/posts`
- `POST /api/expert-network/channels/{slug}/posts`
- `GET /api/expert-network/posts/{id}`
- `POST /api/expert-network/posts/{id}/comments`
- `POST /api/expert-network/posts/{id}/helpful`

Messages:

- `GET /api/expert-network/conversations`
- `GET /api/expert-network/conversations/{id}`
- `POST /api/expert-network/conversations`
- `POST /api/expert-network/conversations/{id}/messages`
- `POST /api/expert-network/conversations/{id}/read`
- `POST /api/expert-network/conversations/{id}/mute`

Trial collaboration:

- `GET /api/expert-network/trials`
- `POST /api/expert-network/trials`
- `POST /api/expert-network/trials/{id}/accept`
- `POST /api/expert-network/trials/{id}/activate`
- `POST /api/expert-network/trials/{id}/complete`
- `POST /api/expert-network/trials/{id}/cancel`

Notifications:

- `GET /api/notifications`
- `GET /api/notifications/summary`
- `PUT /api/notifications/{id}/read`
- `PUT /api/notifications/read-all`

Team membership APIs used by Network:

- `GET /api/teams/mine`
- `POST /api/teams/{id}/invitations`
- `GET /api/teams/join-requests/mine`
- `POST /api/teams/{id}/join-requests`
- `GET /api/teams/{id}/join-requests`
- `PUT /api/teams/join-requests/{requestId}`

Expert/team profile APIs used by Network:

- `GET /api/expert-profiles`
- `GET /api/expert-profiles/me`
- `PUT /api/expert-profiles/me`
- `GET /api/teams`
- `GET /api/teams/{id}`

Account settings:

- `GET /api/users/me`
- `PUT /api/users/me`

## Frontend Structure

Route group:

```text
frontend/src/app/(network)/expert-network/
```

Feature implementation:

```text
frontend/src/features/expert-network/
```

Important files:

- `NetworkChrome.tsx`: Network shell, sidebar, header, Studio/Network switcher, global search, notification/message badges.
- `NetworkPages.tsx`: page implementations for home, directory, formation, messages, channels, notifications, search, trials, profile, settings, and detail pages.
- `api.ts`: typed frontend API wrapper.
- `types.ts`: Network-specific frontend DTO types.
- `frontend/src/middleware.ts`: subdomain rewrites for `network.produs.com`, `teams.produs.com`, and `studio.produs.com`.

## UI Quality Rules

- Keep pages light, calm, and Apple-like.
- Use clear primary actions; avoid duplicate button sizes in the same action row.
- Every visible command must either mutate backend state or route to a concrete working page.
- Avoid generic social-feed mechanics. Conversations must stay attached to profiles, channels, openings, requests, trials, or delivery context.
- Owners should use Studio flows; expert/team formation belongs in Network.
- Sidebar and header counts must come from backend state, not static UI values.

## Verification Commands

Backend:

```bash
cd backend
mvn -q test
mvn -q -DskipTests compile
```

Frontend:

```bash
cd frontend
npm run type-check
npm run build
npm test -- --runInBand
```

Live API smoke test:

```bash
TOKEN=$(curl -sS -X POST http://localhost:8080/api/mock/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"specialist@produs.com","password":"specialist123"}' | jq -r '.token')

curl -sS -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/expert-network/home | jq '.channels | length'
curl -sS -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/expert-network/search?query=security" | jq '.results | length'
curl -sS -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/notifications/summary | jq '.unreadCount'
```

Static asset MIME check:

```bash
CSS=$(curl -sS http://localhost:3000/expert-network | rg -o '/_next/static/css/[^" ]+' | head -1)
curl -I -sS "http://localhost:3000$CSS" | rg -i 'HTTP|content-type'
```

Expected CSS content type:

```text
Content-Type: text/css; charset=UTF-8
```

## Production Notes

- PostgreSQL is the production database.
- Supabase remains the identity provider, but Studio and Network should rely on a server-issued platform session cookie scoped to `.produs.com`.
- Browser localStorage tokens are development-only.
- Notification delivery is already integrated with the platform notification delivery service and can later fan out to email/push/webhooks.
- Network conversation content must remain permission scoped. Do not expose private messages in public profiles, owner discovery pages, search snippets beyond authorized participants, or AI tools without explicit authorization checks.
