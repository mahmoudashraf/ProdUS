# ProdUS Frontend

ProdUS frontend is a Next.js 15, React 19, TypeScript, Material UI application for the platform workspace.

## Local Development

Use Node 20+. The repo includes `.nvmrc`, package `engines`, and script wrappers so the frontend commands use a supported Next.js runtime even when an older `/usr/local/bin/node` is earlier on `PATH`.

```bash
npm install
npm run dev
```

The app expects the backend API at `NEXT_PUBLIC_API_URL`, defaulting to `http://localhost:8080/api` in local development.

## Main Areas

- Dashboard: `/dashboard`
- Service catalog: `/catalog`
- Product profiles: `/owner/products`
- Requirement intake: `/owner/requirements`
- Package builder: `/packages`
- Team registry: `/teams`
- Project workspaces: `/workspaces`
- Admin catalog: `/admin/catalog`
- AI recommendation audit: `/admin/recommendations`

## Scripts

- `npm run dev` starts the development server.
- `npm run build` builds the production app.
- `npm run start` starts a production build.
- `npm run type-check` runs TypeScript checks.
- `npm run test` runs Jest tests.
- `npm run format` formats the frontend source.

## Auth

Supabase auth remains the production auth provider. Local development can use mock auth through the backend `/api/mock` endpoints when `NEXT_PUBLIC_MOCK_AUTH_ENABLED=true`.
