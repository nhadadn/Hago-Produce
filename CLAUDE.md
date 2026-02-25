# CLAUDE.md — Hago Produce

## ⚠️ DOCUMENTACIÓN OBLIGATORIA

Antes de implementar cualquier feature, **siempre consulta primero** la carpeta:

```
DocumentacionHagoProduce/
```

Esta carpeta contiene toda la documentación oficial del proyecto organizada por fase.

### Archivos clave a consultar según el contexto:

| Archivo | Cuándo consultarlo |
|---------|-------------------|
| `docs/00_prompt_maestro_hago_produce.md` | Contexto general del proyecto |
| `docs/01_architecture_c4.md` | Antes de tocar arquitectura o estructura de carpetas |
| `docs/02_data_model.md` | Antes de modificar modelos o migraciones de Prisma |
| `docs/03_api_contracts.md` | Antes de crear o modificar endpoints API |
| `docs/04_roadmap.md` | Para entender prioridades y fases |
| `docs/05_project_brief.md` | Contexto de negocio |
| `FaseTres/SISTEMA_COLORES_HAGO_PRODUCE.md` | Para cualquier cambio de UI/CSS |
| `FaseCuatro/PLAN_ESTRATEGICO_SPRINT4.md` | Sprint actual — tareas y prioridades |
| `FaseCuatro/PROMPT_MAESTRO_RECALIBRACION_SPRINT4.md` | Instrucciones del sprint 4 |
| `todo.md` | Tareas pendientes actuales |

### Estructura de fases:
```
DocumentacionHagoProduce/
├── docs/              # Documentación core (arquitectura, modelo, API, roadmap)
├── FaseZero/          # Fundación del proyecto
├── FaseDos/           # Sprints 1-2 (auth, catálogo, facturación base)
├── FaseTres/          # Sprint 3 (reportes, integraciones, UX)
├── FaseCuatro/        # Sprint 4 — SPRINT ACTUAL
└── todo.md            # Pendientes globales
```

---

## Project Overview

**Hago Produce** is a full-stack invoicing, cost management, and customer tracking system for a Canadian raw materials company (fruits, vegetables, nuts). It replaces QuickBooks and Google Sheets workflows.

**Goals:**
- Replace QuickBooks by 01/04/2026
- Reduce invoice creation from ~20 min to <3 min
- Centralize business data in one portal
- AI-powered chat assistant for business queries
- Multi-channel bot support (WhatsApp, Telegram)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth.js v5 + JWT |
| UI | shadcn/ui + Radix UI + TailwindCSS |
| Forms | React Hook Form + Zod |
| AI | OpenAI (GPT-4o-mini) |
| Messaging | Twilio (WhatsApp), SendGrid / Resend (email) |
| Charts | Recharts |
| PDF | jsPDF + jsPDF-autotable |
| Testing | Jest (unit) + Playwright (E2E) |
| Deployment | Railway (app + managed PostgreSQL) |
| CI/CD | GitHub Actions |

---

## Key Commands

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npm test                 # Jest unit tests
npm run test:e2e         # Playwright E2E tests

npx prisma migrate dev   # Create & apply DB migrations
npx prisma db seed       # Seed database (prisma/seed.ts)
npx prisma studio        # Open Prisma GUI

docker-compose up        # Local dev environment (app + PostgreSQL 15)
```

---

## Project Structure

```
src/
├── app/                   # Next.js App Router
│   ├── (admin)/           # Admin dashboard routes
│   ├── (accounting)/      # Accounting module routes
│   ├── (auth)/            # Authentication routes
│   ├── (customer)/        # Customer portal routes
│   └── api/
│       └── v1/            # Versioned API endpoints
├── components/            # React components
├── lib/
│   ├── db.ts              # Prisma client singleton
│   ├── auth/              # Auth utilities
│   ├── services/          # Business logic
│   ├── validation/        # Zod schemas
│   ├── hooks/             # Custom React hooks
│   ├── api/               # API client functions (fetch wrappers)
│   └── audit/             # Audit logging
├── config/                # App configuration
└── middleware.ts          # Next.js middleware
prisma/
├── schema.prisma          # Database schema
├── migrations/            # Migration history
└── seed.ts                # Seed script
DocumentacionHagoProduce/  # ← Documentación oficial del proyecto
```

---

## Database Models

| Model | Purpose |
|-------|---------|
| `User` | System users — roles: ADMIN, ACCOUNTING, MANAGEMENT, CUSTOMER |
| `Customer` | Business customers |
| `Supplier` | Product suppliers |
| `Product` | Catalog items (bilingual EN/ES) |
| `Invoice` | Sales invoices — states: DRAFT → SENT → PENDING → PAID / CANCELLED / OVERDUE |
| `InvoiceItem` | Line items on invoices |
| `ProductPrice` | Cost & sell prices per supplier |
| `ChatSession` / `Message` | Conversation sessions |
| `BotApiKey` | External bot API keys |
| `AuditLog` | System audit trail |
| `Notification` / `NotificationLog` | Notification delivery |
| `PurchaseOrder` / `PurchaseOrderItem` | Supplier POs |
| `WebhookLog` | External webhook tracking |
| `ReportCache` | Cached report data |

---

## Architecture Patterns

- **Monorepo**: Frontend and backend co-located in a single Next.js app
- **API versioning**: All backend routes under `/api/v1/`
- **Route groups**: `(admin)`, `(accounting)`, `(auth)`, `(customer)` use Next.js route groups
- **Validation**: Zod schemas in `src/lib/validation/` used at API boundaries
- **Auth middleware**: `src/middleware.ts` protects routes by role
- **Prisma singleton**: Import from `src/lib/db.ts`, never instantiate directly
- **Audit logging**: Use `src/lib/audit/` for write operations
- **API clients**: Fetch wrappers in `src/lib/api/` — use these in components, never fetch directly

---

## Known Fixes (no revertir)

### AdminShell layout
`src/components/layout/AdminShell.tsx` **debe** tener `flex` en el wrapper:
```tsx
<div className="flex min-h-screen bg-background">   // ← flex es obligatorio
  <Sidebar ... />
  <div className="flex flex-col flex-1 min-w-0">    // ← flex-1 min-w-0, NO lg:pl-64
```

### useAuth.ts
`src/lib/hooks/useAuth.ts` debe importar de `next/navigation`, no `next/router`:
```ts
import { useRouter } from 'next/navigation'; // ✅
```

---

## Environment Variables

See `.env.example`. Key:
- `DATABASE_URL` — `postgresql://postgres:postgres@localhost:5433/hago_produce` (local Docker)
- `NEXTAUTH_SECRET` / `NEXTAUTH_URL`
- `OPENAI_API_KEY`
- `TWILIO_*` — WhatsApp
- `SENDGRID_API_KEY` / `RESEND_API_KEY`

---

## Testing

- **Unit tests**: `npm test` — Jest + @testing-library/jest-dom
- **E2E tests**: `npm run test:e2e` — Playwright (Chrome, Firefox, Safari)
- **CI**: GitHub Actions en PRs

---

## Deployment

- **Platform**: Railway
- **Config**: `railway.json`, `Dockerfile`
- **Local dev**: `docker-compose up` → PostgreSQL 15 en puerto `5433`
