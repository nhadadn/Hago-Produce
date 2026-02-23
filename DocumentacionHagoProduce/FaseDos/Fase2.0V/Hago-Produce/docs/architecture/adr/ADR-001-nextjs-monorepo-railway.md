# ADR-001: Use Next.js Monorepo on Railway

## Status
Accepted

## Context
We need a unified framework for both Frontend and Backend to simplify development and deployment. The project is hosted on Railway.

## Decision
We will use **Next.js** as a monorepo framework.
- **Frontend:** React Server Components + Client Components.
- **Backend:** Next.js API Routes (Route Handlers).

## Consequences
**Pros:**
- Single repository to manage.
- Shared types between frontend and backend.
- Simplified deployment on Railway (one service).

**Cons:**
- Tighter coupling between FE and BE.
- Scaling individual components (e.g., just the API) requires scaling the whole app (though usually acceptable for this scale).
