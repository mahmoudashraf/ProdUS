# Evidence Attachments Implementation

Date: 2026-05-11

## Scope

This slice closes the evidence gap for the ProdUS execution workflow. Owners, workspace contributors, and assigned dispute teams need to attach concrete proof to workspace, deliverable, and dispute records without relying on admin-only storage endpoints.

## Backend Sequence

1. Add `evidence_attachments` as a first-class PostgreSQL table.
2. Store workspace, optional deliverable, optional dispute, uploader, scope, file metadata, private object key, and provider URL metadata without exposing storage internals in API responses.
3. Add a multipart `/api/attachments` API for upload, listing by workspace or scope, authenticated signed-download URL creation, and deletion.
4. Enforce workspace viewer/contributor and dispute-party permissions before listing or mutation.
5. Validate file size and file type before object storage writes.
6. Keep object storage provider-neutral through the existing S3-compatible service.
7. Harden S3 key generation, URL generation, missing-object handling, and Docker MinIO credentials.

## Frontend Sequence

1. Add typed attachment records and upload service support.
2. Upgrade the shared file picker with inline validation and progress/helper text.
3. Add workspace-level evidence upload/listing.
4. Add dispute evidence upload/listing.
5. Add deliverable evidence upload/listing.
6. Open attachments through the authenticated `/api/attachments/{id}/download-url` endpoint instead of direct object URLs.
7. Use one workspace attachment query and group by scope to keep React hook order stable.

## Status

Completed.

## Verification

- Backend: `mvn test` passed, including PostgreSQL Liquibase validation and mocked multipart evidence upload/list/delete, signed-download permission coverage, and response checks that private storage keys/direct object URLs are not exposed.
- Frontend: `npm run type-check` passed.
- Frontend unit tests: `npm test -- --runInBand` passed.
- Frontend production build: `npm run build` passed.
- Live API smoke: dev backend plus local MinIO uploaded a workspace evidence file through `/api/attachments`, listed one attachment for the workspace, and returned a short-lived signed download URL from `/api/attachments/{id}/download-url`.
- Live UI smoke: headless Chrome rendered `http://127.0.0.1:3001/workspaces` without a blank screen or hook-order runtime crash.
- Docker readiness: `docker build -t produs-backend:local ./backend` and `docker build -t produs-frontend:local ./frontend` passed.
