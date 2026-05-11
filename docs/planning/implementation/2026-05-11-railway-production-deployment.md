# Railway Production Deployment Plan

Date: 2026-05-11
Status: repo-ready, Railway account provisioning blocked until a valid Railway token/session is available.

## Target Shape

- Repository: `mahmoudashraf/ProdUS`, branch `main`.
- Railway project: user-owned project in the `My Projects` workspace.
- Services:
  - `Postgres`: Railway PostgreSQL database service.
  - `produs-backend`: Spring Boot API, root directory `/backend`, config file `/backend/railway.json`, Dockerfile `/backend/Dockerfile`.
  - `produs-frontend`: Next.js UI, root directory `/frontend`, config file `/frontend/railway.json`, Dockerfile `/frontend/Dockerfile`.
- Database: PostgreSQL only for production.
- Auth/users: Supabase production project.
- Mock auth: disabled in production.
- LoomAI: optional assistant integration; deterministic platform flows remain the fallback path.

## Sequenced Implementation

1. Create or link the Railway project in the correct workspace.
   - Use the existing project if the pasted UUID is the Railway project ID.
   - CLI setup requires either a browser-authenticated Railway session, a project token in `RAILWAY_TOKEN`, or an account/workspace token in `RAILWAY_API_TOKEN`.

2. Add the managed PostgreSQL service.
   - Service name: `Postgres`.
   - Enable backups before real production traffic.
   - Keep database access private to the Railway project unless external admin access is explicitly needed.

3. Add the backend service from GitHub.
   - Source: `mahmoudashraf/ProdUS`, branch `main`.
   - Root directory: `/backend`.
   - Config file path: `/backend/railway.json`.
   - Dockerfile path from config: `Dockerfile` inside the backend root, repository path `/backend/Dockerfile`.
   - Health check: `/api/health`.
   - Copy variables from `railway/backend.variables.example`, replacing blanks with production secrets.
   - Use Railway Postgres references for `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD`.

4. Add the frontend service from GitHub.
   - Source: `mahmoudashraf/ProdUS`, branch `main`.
   - Root directory: `/frontend`.
   - Config file path: `/frontend/railway.json`.
   - Dockerfile path from config: `Dockerfile` inside the frontend root, repository path `/frontend/Dockerfile`.
   - Health check: `/`.
   - Copy variables from `railway/frontend.variables.example`, replacing blanks with production Supabase values.
   - Set `NEXT_PUBLIC_API_URL` and `REACT_APP_API_URL` to the backend Railway public domain plus `/api`.

5. Wire CORS and Supabase callback URLs.
   - Backend `APP_CORS_ALLOWED_ORIGINS` must include the final frontend Railway or custom domain.
   - Supabase auth redirect URLs must include the final frontend Railway or custom domain.
   - Keep `NEXT_PUBLIC_MOCK_AUTH_ENABLED=false`.

6. Verify deployment.
   - Backend: `GET https://<backend-domain>/api/health` returns `UP`.
   - Frontend: `GET https://<frontend-domain>/` returns `200`.
   - Database: backend startup logs show Liquibase completed without pending migration errors.
   - Auth: Supabase sign-in returns a JWT accepted by backend protected endpoints.
   - Workflow smoke: owner product profile, requirement intake, package generation, workspace creation, invoice/contract callback mock, and dispute update.

7. Production readiness follow-through.
   - Add custom domains and TLS.
   - Rotate all placeholder webhook/storage/LoomAI values.
   - Configure Railway alerts, log drains, and Postgres backups.
   - Add CI/CD gates for backend tests, frontend type-check/tests/build, and Docker builds before autodeploy.

## Current Execution Notes

- The local Railway CLI is available through `npx @railway/cli`.
- The pasted UUID did not authenticate as either `RAILWAY_API_TOKEN` or `RAILWAY_TOKEN`; it is likely a project ID, not an API token.
- Until a valid token or interactive Railway login exists, CLI provisioning cannot create services or set variables.
- The repo now contains the service config and variable templates needed to complete setup from the Railway dashboard or CLI.

## CLI Commands Once Authenticated

```bash
export RAILWAY_API_TOKEN=<account-or-workspace-token>

npx -y @railway/cli link --project <railway-project-id>
npx -y @railway/cli add --database postgres

# Then create two GitHub-backed services from the dashboard or CLI, named:
# - produs-backend
# - produs-frontend
#
# Set each service root/config path as documented above, paste the matching
# variables file into the service Variables raw editor, generate domains, and deploy.
```
