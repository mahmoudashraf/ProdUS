# Docker Image Readiness

Date: 2026-05-11
Status: backend and frontend images build and smoke-run locally.

## Images

- Backend image: `produs-backend:local`
  - Build context: `backend`
  - Runtime: Eclipse Temurin 21 JRE Alpine
  - Default profile: `prod`
  - Smoke profile: `dev` with H2 and mock auth
  - Health endpoint: `/api/health`

- Frontend image: `produs-frontend:local`
  - Build context: `frontend`
  - Runtime: Next.js standalone server on Node 20 Alpine
  - Build-time public config is required for `NEXT_PUBLIC_*` values.
  - Local smoke API URL: `http://localhost:8080/api`

## Verified Commands

```bash
DOCKER_BUILDKIT=0 docker build -t produs-backend:local ./backend

DOCKER_BUILDKIT=0 docker build -t produs-frontend:local \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080/api \
  --build-arg REACT_APP_API_URL=http://localhost:8080/api \
  --build-arg NEXT_PUBLIC_ENVIRONMENT=production \
  --build-arg NEXT_PUBLIC_MOCK_AUTH_ENABLED=false \
  ./frontend
```

## Smoke Run

```bash
docker run -d --name produs-backend-smoke \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=dev \
  produs-backend:local

curl http://localhost:8080/api/health
curl -X POST http://localhost:8080/api/mock/auth/login-as/ADMIN

docker run -d --name produs-frontend-smoke \
  -p 3000:3000 \
  produs-frontend:local

curl http://localhost:3000/dashboard
```

## Compose Contract

- Backend containers must receive PostgreSQL settings through `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD`.
- Storage credentials use `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.
- Backend health checks use `wget` against `/api/health`, which is available in the Alpine runtime image.
- Frontend `NEXT_PUBLIC_API_URL` must be the browser-reachable API origin, not the internal Docker service hostname. For local Compose this is `http://localhost:8080/api`; for production it must be the public API domain.
- Supabase values are required for production auth builds. Mock auth remains a local/test path only.

## Current Constraints

- Docker Desktop on this machine has very limited host disk headroom. Large failed builds can stop the Docker daemon.
- The frontend Dockerfile now avoids a separate dependency-copy stage to reduce duplicated `node_modules` layers during local image builds.
- Local regenerated artifacts were removed to recover disk: `frontend/node_modules`, `frontend/.next`, and `backend/target`.
