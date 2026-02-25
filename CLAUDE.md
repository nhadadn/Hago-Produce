# CLAUDE.md — Hago Produce

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
│           ├── auth/
│           ├── customers/
│           ├── invoices/
│           ├── products/
│           ├── product-prices/
│           ├── suppliers/
│           ├── reports/
│           ├── chat/
│           ├── bot/
│           ├── users/
│           ├── notifications/
│           └── webhooks/
├── components/            # React components (mirrors API structure)
├── lib/
│   ├── db.ts              # Prisma client singleton
│   ├── auth/              # Auth utilities
│   ├── services/          # Business logic
│   ├── validation/        # Zod schemas
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # General utilities
│   ├── audit/             # Audit logging
│   ├── chat/              # Chat service logic
│   └── __mocks__/         # Test mock data
├── config/                # App configuration
├── scripts/               # Utility scripts
└── middleware.ts          # Next.js middleware
prisma/
├── schema.prisma          # Database schema
├── migrations/            # Migration history
└── seed.ts                # Seed script
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
- **Route groups**: `(admin)`, `(accounting)`, `(auth)`, `(customer)` use Next.js route groups for layout isolation
- **Validation**: Zod schemas in `src/lib/validation/` used at API boundaries
- **Auth middleware**: `src/middleware.ts` protects routes by role
- **Prisma singleton**: Import the client from `src/lib/db.ts`, never instantiate directly
- **Audit logging**: Use the audit service in `src/lib/audit/` for write operations

---

## Environment Variables

See `.env.example` for required variables. Key categories:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` / `NEXTAUTH_URL` — Auth config
- `OPENAI_API_KEY` — Chat agent
- `TWILIO_*` — WhatsApp messaging
- `SENDGRID_API_KEY` / `RESEND_API_KEY` — Email
- `GOOGLE_*` — Google Sheets integration

---

## Testing

- **Unit tests**: Jest + @testing-library/jest-dom. Mocks live in `src/lib/__mocks__/`
- **E2E tests**: Playwright across Chrome, Firefox, Safari
- **CI**: GitHub Actions runs tests on PRs (`.github/workflows/`)

---

## Deployment

- **Platform**: Railway
- **Config**: `railway.json`, `Dockerfile` (multi-stage: deps → builder → runner)
- **Database**: Railway managed PostgreSQL
- **Local dev**: `docker-compose up` spins up PostgreSQL 15 + app

---

## Current Sprint Context

The project follows a sprint-based roadmap documented in `docs/`. Check `docs/audit/` for sprint retrospectives and `docs/prompts/` for AI prompt documentation.

**Known gaps (as of last audit):**
- Admin UI for bot API key management is missing
- Customer portal reports not yet integrated
- Google Sheets migration scripts need validation
