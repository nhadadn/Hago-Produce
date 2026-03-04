# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ DOCUMENTACIÓN OBLIGATORIA

Antes de implementar cualquier feature, **siempre consulta primero** la carpeta:

```
DocumentacionHagoProduce/
```

### Archivos clave a consultar según el contexto:

| Archivo | Cuándo consultarlo |
|---------|-------------------|
| `DocumentacionHagoProduce/docs/00_prompt_maestro_hago_produce.md` | Contexto general del proyecto |
| `DocumentacionHagoProduce/docs/01_architecture_c4.md` | Antes de tocar arquitectura o estructura de carpetas |
| `DocumentacionHagoProduce/docs/02_data_model.md` | Antes de modificar modelos o migraciones de Prisma |
| `DocumentacionHagoProduce/docs/03_api_contracts.md` | Antes de crear o modificar endpoints API |
| `DocumentacionHagoProduce/docs/04_roadmap.md` | Para entender prioridades y fases |
| `DocumentacionHagoProduce/FaseTres/SISTEMA_COLORES_HAGO_PRODUCE.md` | Para cualquier cambio de UI/CSS |
| `DocumentacionHagoProduce/FaseCinco/GROUND_TRUTH_VERIFICATION_REPORT_CORREGIDO.md` | Estado real verificado del sistema (fuente de verdad) |
| `DocumentacionHagoProduce/FaseSeis/CTO_STRATEGIC_DESIGN_SPRINT6.md` | Decisiones arquitectónicas Sprint 6 |
| `DocumentacionHagoProduce/todo.md` | Tareas pendientes actuales |

### Estructura de fases:
```
DocumentacionHagoProduce/
├── docs/              # Documentación core (arquitectura, modelo, API, roadmap)
├── FaseZero/          # Fundación del proyecto
├── FaseDos/           # Sprints 1-2 (auth, catálogo, facturación base)
├── FaseTres/          # Sprint 3 (reportes, integraciones, UX)
├── FaseCuatro/        # Sprint 4 (productización y UX) — ✅ completado
├── FaseCinco/         # Sprint 5 (cobertura, ground truth audit) — ✅ completado
├── FaseSeis/          # Sprint 6 (mejoras de cobertura y CI/CD) — ✅ completado
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
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint

# Testing
npm test                              # Jest unit tests (all)
npm test -- --testPathPattern=chat    # Run a single test file/folder
npm run test:integration              # Integration tests (requires test DB)
npm run test:integration:up           # Start test DB in Docker
npm run test:e2e                      # Playwright E2E tests

# Database
npx prisma migrate dev   # Create & apply DB migrations (dev)
npx prisma migrate deploy # Apply migrations (production/staging)
npx prisma db seed       # Seed database (prisma/seed.ts)
npx prisma studio        # Open Prisma GUI

# Docker (local dev)
docker-compose up -d db  # Start only PostgreSQL (recommended for dev)
docker-compose up        # Start full stack (app + PostgreSQL)
```

---

## Project Structure

```
src/
├── app/                   # Next.js App Router
│   ├── (admin)/           # Admin dashboard routes
│   ├── (auth)/            # Authentication routes
│   ├── (customer)/        # Customer portal routes
│   └── api/
│       └── v1/            # Versioned API endpoints
├── components/            # React components
├── lib/
│   ├── db.ts              # Prisma client singleton
│   ├── auth/              # Auth utilities
│   ├── services/          # Business logic layer
│   ├── validation/        # Zod schemas
│   ├── hooks/             # Custom React hooks
│   ├── api/               # API client functions (fetch wrappers)
│   └── audit/             # Audit logging
├── config/                # App configuration
└── middleware.ts          # Next.js middleware (role-based route protection)
prisma/
├── schema.prisma          # Database schema
├── migrations/            # Migration history
└── seed.ts                # Seed script
DocumentacionHagoProduce/  # ← Documentación oficial del proyecto
```

---

## Architecture Patterns

### Request flow
`Component → src/lib/api/*.ts (fetch wrapper) → API Route /api/v1/* → src/lib/services/*.ts → Prisma → PostgreSQL`

Never call `fetch` directly in components — always use the wrappers in `src/lib/api/`.

### API response envelope
All API routes return a consistent wrapper:
```ts
{ success: true, data: { ... } }          // success
{ success: false, error: "message" }      // error
```
Services return domain objects directly (e.g. `CustomerService.getAll` returns `{ customers, meta }`, NOT `{ data, meta }`). The route handler wraps it.

### Auth & roles
- `src/middleware.ts` enforces role-based access on every request
- Roles: `ADMIN`, `ACCOUNTING`, `MANAGEMENT`, `CUSTOMER`
- Customer portal login is separate: `POST /api/v1/auth/customer-login` (uses TaxID + password)

### Validation
- Zod schemas live in `src/lib/validation/`
- Used at API boundaries (route handlers), not inside services

### Audit logging
All write operations on invoices and critical entities must use `src/lib/audit/` helpers.

### Prisma singleton
Always import from `src/lib/db.ts`. Never instantiate `PrismaClient` directly.

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

## Known Fixes (no revertir)

### AdminShell layout
`src/components/layout/AdminShell.tsx` **debe** tener `flex` en el wrapper — sin esto el sidebar y el contenido se apilan verticalmente y los widgets no aparecen:
```tsx
<div className="flex min-h-screen bg-background">   // ← flex es obligatorio
  <Sidebar ... />
  <div className="flex flex-col flex-1 min-w-0">    // ← flex-1 min-w-0, NO lg:pl-64
```
Este fix se rompe cada vez que el compañero sube cambios a este archivo. Verificar siempre después de un merge.

### useAuth.ts
`src/lib/hooks/useAuth.ts` debe importar de `next/navigation`, no `next/router` (App Router):
```ts
import { useRouter } from 'next/navigation'; // ✅
```

---

## Estado actual — Sprint 6 completado (Mar 2026)

**🎯 META CRÍTICA: Dejar QuickBooks antes del 01/04/2026 — quedan ~4 semanas.**

### Sprints completados ✅
- Sprint 1-3: Backend + Auth + Productos + Facturación + Chat + Portal Cliente
- Sprint 4: Productización y UX
- Sprint 5: Auditoría Ground Truth, cobertura de tests
- Sprint 6: Mejoras de cobertura y CI/CD

### Estado real del sistema (verificado en código — 26/Feb/2026)
- **Tests:** 51 suites, 471 tests — todos pasando ✅
- **Cobertura:** Statements 94.78% | Branches 80.64% | Functions 94.83% | Lines 95.76%
- **CI/CD:** Sin pipeline de GitHub Actions verificado ❌

### Deudas técnicas pendientes (priorizadas)
1. **`taxRate` hardcodeado a 0.13** — Solo Ontario (HST). No soporta otras provincias canadienses. Crítico para clientes fuera de Ontario.
2. **Sin logging estructurado** — Solo `console.log/error` en producción. Falta Sentry/Winston/Pino.
3. **Sin CI/CD pipeline** — Falta GitHub Actions workflow verificado.
4. **Branches bajas en intents críticos:**
   - `best-supplier.ts` — 40% branches
   - `price-lookup.ts` — 40% branches
   - `product-info.ts` — 33% branches

### Servicios que NO existen (mencionados en docs pero ausentes en código)
> ⚠️ No implementar basándose en checkpoints anteriores — verificar siempre contra el código real.
- `bot-decision.service.ts` — NO EXISTE
- `document-mapper.service.ts` — NO EXISTE
- `pdf-ingestion-orchestrator.service.ts` — NO EXISTE
- `tax-calculation.service.ts` — NO EXISTE
- `intent-resolver.ts` — NO EXISTE
- `price-versioning.service.ts` — NO EXISTE

### Entidades Prisma que NO existen en schema
- `PriceList`, `PreInvoice`, `BotDecision` — NO EXISTEN

---

## Environment Variables

See `.env.example`. Key:
- `DATABASE_URL` — `postgresql://postgres:postgres@localhost:5433/hago_produce` (local Docker, port 5433)
- `NEXTAUTH_SECRET` / `NEXTAUTH_URL`
- `OPENAI_API_KEY`
- `TWILIO_*` — WhatsApp
- `SENDGRID_API_KEY` / `RESEND_API_KEY`

---

## Testing

- **Unit**: `npm test` — Jest + @testing-library/jest-dom
- **Integration**: `npm run test:integration` — requiere Docker DB de prueba (`npm run test:integration:up`)
- **E2E**: `npm run test:e2e` — Playwright (Chrome, Firefox, Safari)
- **CI**: GitHub Actions en PRs — todos los tests deben pasar

---

## Deployment

- **Platform**: Railway (app + managed PostgreSQL)
- **Config**: `railway.json`, `Dockerfile`
- **Local dev**: `docker-compose up -d db` → PostgreSQL 15 en puerto `5433`
- **Seed admin**: `admin@hagoproduce.com` / `password123` (solo dev/staging)
