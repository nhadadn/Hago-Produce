# HAGO PRODUCE — Arquitectura C4

---

## Nivel 1: Diagrama de Contexto (System Context)

Este nivel muestra el sistema HAGO PRODUCE y cómo interactúa con los actores externos y sistemas de terceros.

### Actores (Personas)

| Actor | Descripción |
|-------|-------------|
| **Admin / Comercial** | Crea facturas, gestiona productos y clientes, consulta dashboards y chat interno. |
| **Contabilidad** | Cambia estados de facturas, añade notas internas, genera reportes y exportaciones. |
| **Dirección / Gerencia** | Consulta indicadores globales y reportes de alto nivel. |
| **Cliente externo** | Consulta su estado de cuenta, descarga facturas, ve pagos pendientes. |

### Sistemas externos

| Sistema | Relación con HAGO PRODUCE |
|---------|--------------------------|
| **Make.com** | Orquesta automatizaciones: lee PDFs de listas de precios, actualiza Google Sheets, y en V1 alimenta datos de costos al sistema. |
| **Google Sheets** | Almacena el "maestro de costos" actual. En V1 sigue siendo fuente de datos para el chatbot. En V2 se reemplaza por la BD del sistema. |
| **WhatsApp / Telegram** | Canal de notificaciones (cambio de estado de facturas, vencimientos). En V2, canal del bot externo. |
| **Proveedor de autenticación** | Servicio de identidad (Auth0, Supabase Auth, o similar) para login seguro con roles. |
| **Servicio de hosting Cloud** | Infraestructura donde se despliega el sistema (ej. Vercel/Railway/Fly.io + Supabase/PlanetScale). |

### Diagrama conceptual (texto)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ACTORES HUMANOS                              │
│                                                                     │
│   ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌───────────────┐  │
│   │  Admin /  │  │Contabilidad│  │ Dirección │  │   Cliente     │  │
│   │ Comercial │  │            │  │ / Gerencia│  │   Externo     │  │
│   └─────┬─────┘  └─────┬──────┘  └─────┬─────┘  └──────┬────────┘  │
│         │              │              │               │             │
└─────────┼──────────────┼──────────────┼───────────────┼─────────────┘
          │              │              │               │
          ▼              ▼              ▼               ▼
    ┌─────────────────────────────────────────────────────────┐
    │                                                         │
    │              🟩 HAGO PRODUCE SYSTEM                     │
    │                                                         │
    │   Portal web (SPA) + API Backend + Base de datos        │
    │   + Chat/Agente interno + Motor de notificaciones       │
    │                                                         │
    └────────┬──────────────┬──────────────┬──────────────────┘
             │              │              │
             ▼              ▼              ▼
    ┌──────────────┐ ┌────────────┐ ┌──────────────────┐
    │   Make.com   │ │  Google    │ │  WhatsApp /      │
    │ (Automatiz.) │ │  Sheets   │ │  Telegram         │
    └──────────────┘ └────────────┘ └──────────────────┘
```

---

## Nivel 2: Diagrama de Contenedores (Containers)

Este nivel descompone el sistema HAGO PRODUCE en sus contenedores técnicos principales.

### Contenedores

| Contenedor | Tecnología sugerida | Responsabilidad |
|------------|-------------------|-----------------|
| **SPA Frontend** | React / Next.js + TailwindCSS | Interfaz de usuario para todos los roles. Renderizado de vistas por rol. Formularios de facturas, catálogo de productos, chat, dashboards. |
| **API Backend** | Node.js (Express/Fastify) o Python (FastAPI) | Lógica de negocio, autenticación, autorización por roles, CRUD de facturas/productos/clientes, endpoints para chat, webhooks para Make.com. |
| **Base de datos** | PostgreSQL (Supabase / PlanetScale / Railway) | Almacenamiento persistente de facturas, productos, clientes, usuarios, notas, precios por proveedor, logs de chat. |
| **Servicio de autenticación** | Supabase Auth / Auth0 / Clerk | Gestión de identidad, login, registro, tokens JWT, roles y permisos. |
| **Motor de chat / Agente** | LLM API (OpenAI / Claude) + contexto de BD | Responde consultas internas: precios, mejores proveedores, estado de facturas. Lee datos de la BD (o Google Sheets en V1). |
| **Motor de notificaciones** | Webhooks + API de WhatsApp/Telegram | Envía notificaciones automáticas por cambio de estado o vencimiento de facturas. |
| **Webhook receiver (Make.com)** | Endpoint en API Backend | Recibe datos de automatizaciones de Make.com (actualizaciones de precios, listas de proveedores). |

### Diagrama de contenedores (texto)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         HAGO PRODUCE SYSTEM                              │
│                                                                          │
│  ┌─────────────────────┐         ┌─────────────────────────────────┐    │
│  │                     │  HTTP   │                                 │    │
│  │   SPA Frontend      │◄───────►│        API Backend              │    │
│  │   (React/Next.js)   │  REST/  │   (Node.js o FastAPI)          │    │
│  │                     │  JSON   │                                 │    │
│  │  • Vistas por rol   │         │  • Auth middleware (JWT)        │    │
│  │  • Facturas CRUD    │         │  • CRUD Facturas               │    │
│  │  • Catálogo prod.   │         │  • CRUD Productos              │    │
│  │  • Chat UI          │         │  • CRUD Clientes               │    │
│  │  • Dashboards       │         │  • Chat/Agente endpoint        │    │
│  │  • Portal cliente   │         │  • Webhook receiver (Make)     │    │
│  │                     │         │  • Notificaciones engine       │    │
│  └─────────────────────┘         └──────────┬──────────────────────┘    │
│                                              │                          │
│                                    ┌─────────▼──────────┐               │
│                                    │                    │               │
│                                    │   PostgreSQL DB    │               │
│                                    │                    │               │
│                                    │  • users           │               │
│                                    │  • invoices        │               │
│                                    │  • invoice_items   │               │
│                                    │  • products        │               │
│                                    │  • product_prices  │               │
│                                    │  • suppliers       │               │
│                                    │  • customers       │               │
│                                    │  • invoice_notes   │               │
│                                    │  • notifications   │               │
│                                    │                    │               │
│                                    └────────────────────┘               │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
          │                    │                      │
          ▼                    ▼                      ▼
  ┌──────────────┐    ┌──────────────┐     ┌──────────────────┐
  │  Supabase    │    │   Make.com   │     │  WhatsApp /      │
  │  Auth        │    │  (webhooks)  │     │  Telegram API    │
  └──────────────┘    └──────────────┘     └──────────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │ Google Sheets│
                      │ (V1 only)   │
                      └──────────────┘
```

---

## Nivel 3: Diagrama de Componentes (Components)

Descomposición del **API Backend** en sus módulos internos.

### Componentes del API Backend

| Componente | Responsabilidad | Endpoints principales |
|------------|----------------|----------------------|
| **Auth Module** | Autenticación, autorización, gestión de sesiones y roles. | `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `GET /auth/me` |
| **Users Module** | CRUD de usuarios internos, asignación de roles. | `GET /users`, `POST /users`, `PUT /users/:id`, `DELETE /users/:id` |
| **Customers Module** | CRUD de clientes externos (TaxID, nombre, dirección, teléfono). | `GET /customers`, `POST /customers`, `PUT /customers/:id`, `GET /customers/:id/invoices` |
| **Products Module** | CRUD de productos, gestión de precios por proveedor. | `GET /products`, `POST /products`, `PUT /products/:id`, `GET /products/:id/prices` |
| **Suppliers Module** | CRUD de proveedores. | `GET /suppliers`, `POST /suppliers`, `PUT /suppliers/:id` |
| **Product Prices Module** | Gestión de precios por producto-proveedor. Recibe actualizaciones de Make.com. | `GET /product-prices`, `POST /product-prices`, `PUT /product-prices/:id`, `POST /product-prices/bulk-update` |
| **Invoices Module** | Creación, edición, listado y filtrado de facturas. Cambio de estado. | `GET /invoices`, `POST /invoices`, `PUT /invoices/:id`, `PATCH /invoices/:id/status` |
| **Invoice Items Module** | Líneas de detalle de cada factura (producto, cantidad, precio unitario). | Gestionado como sub-recurso de `/invoices/:id/items` |
| **Invoice Notes Module** | Notas internas por factura (no visibles al cliente). | `GET /invoices/:id/notes`, `POST /invoices/:id/notes` |
| **Chat / Agent Module** | Procesa consultas en lenguaje natural. Consulta BD (o Google Sheets en V1) para responder sobre precios, proveedores, estados de facturas. | `POST /chat/query` |
| **Notifications Module** | Genera y envía notificaciones por cambio de estado o vencimiento. Integra con WhatsApp/Telegram API. | `POST /notifications/send`, `GET /notifications` (log) |
| **Webhooks Module** | Recibe datos de Make.com (actualizaciones de precios, listas de proveedores). | `POST /webhooks/make/prices`, `POST /webhooks/make/suppliers` |
| **Reports Module** (V2) | Generación de reportes, exportaciones CSV/PDF, métricas. | `GET /reports/invoices`, `GET /reports/aging`, `GET /reports/revenue` |

### Diagrama de componentes (texto)

```
┌─────────────────────────────────────────────────────────────────┐
│                       API BACKEND                                │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Auth Module  │  │ Users Module │  │  Customers Module    │  │
│  │              │  │              │  │                      │  │
│  │ • Login      │  │ • CRUD users │  │ • CRUD customers     │  │
│  │ • Register   │  │ • Roles      │  │ • Customer invoices  │  │
│  │ • JWT tokens │  │              │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Products    │  │  Suppliers   │  │  Product Prices      │  │
│  │  Module      │  │  Module      │  │  Module              │  │
│  │              │  │              │  │                      │  │
│  │ • CRUD prod. │  │ • CRUD suppl.│  │ • Prices per supplier│  │
│  │ • Search     │  │              │  │ • Bulk update (Make) │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Invoices    │  │ Invoice Notes│  │  Chat / Agent        │  │
│  │  Module      │  │  Module      │  │  Module              │  │
│  │              │  │              │  │                      │  │
│  │ • CRUD inv.  │  │ • Add notes  │  │ • NL query processing│  │
│  │ • Status mgmt│  │ • List notes │  │ • Price lookup       │  │
│  │ • Filters    │  │ • Internal   │  │ • Invoice status     │  │
│  │ • Items mgmt │  │   only       │  │ • Best supplier      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Notifications│  │  Webhooks    │  │  Reports Module      │  │
│  │  Module      │  │  Module      │  │  (V2)                │  │
│  │              │  │              │  │                      │  │
│  │ • Status chg │  │ • Make.com   │  │ • Invoice reports    │  │
│  │ • Due dates  │  │   receiver   │  │ • Aging reports      │  │
│  │ • WA/TG send │  │ • Price sync │  │ • Revenue metrics    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Nivel 4: Código (Code) — Contratos de API y Modelos de Datos

> Este nivel se detalla en los documentos separados:
> - `02_data_model.md` — Modelo de datos / ERD
> - `03_api_contracts.md` — Contratos de API detallados
> - `04_roadmap.md` — Roadmap por fases

---

## Decisiones arquitectónicas clave

### 1. Stack tecnológico recomendado

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Frontend** | Next.js 14 (App Router) + TailwindCSS + shadcn/ui | SSR/SSG para SEO (SPA pública), excelente DX, componentes accesibles, ideal para "vibe coding" con IA. |
| **Backend** | Next.js API Routes (o FastAPI si se prefiere separar) | Monorepo simplificado, menos infraestructura, TypeScript end-to-end. Si se necesita separar, FastAPI es excelente para APIs REST + integración con LLMs. |
| **Base de datos** | PostgreSQL via Supabase | Tier gratuito generoso, Auth integrado, Realtime, Storage, Row Level Security (RLS) para multi-tenant. Ideal para presupuesto bajo. |
| **ORM** | Prisma (si Node) / SQLAlchemy (si Python) | Type-safe, migraciones, excelente DX. |
| **Autenticación** | Supabase Auth | Incluido en Supabase, JWT, roles, social login, sin costo adicional. |
| **Chat/Agente** | OpenAI API (GPT-4o-mini) + function calling | Bajo costo por consulta, function calling para consultar BD de forma estructurada. |
| **Notificaciones** | Twilio (WhatsApp) / Telegram Bot API | APIs maduras, bajo costo por mensaje. |
| **Hosting** | Vercel (frontend) + Supabase (BD + Auth) | Tier gratuito para ambos, escalable, sin DevOps complejo. |
| **CI/CD** | GitHub Actions | Gratuito para repos privados, integración nativa con Vercel. |

### 2. Justificación del enfoque monorepo (Next.js full-stack)

Para un equipo pequeño y presupuesto bajo, un monorepo Next.js con API Routes reduce:
- Complejidad de infraestructura (un solo deploy).
- Costo de hosting (Vercel free tier).
- Tiempo de desarrollo (TypeScript end-to-end, sin duplicar tipos).
- Curva de aprendizaje (un solo framework).

Si en el futuro se necesita escalar el backend independientemente, se puede extraer a un servicio separado (FastAPI, NestJS) sin cambiar el frontend.

### 3. Estrategia de migración de Google Sheets

| Fase | Fuente de datos para costos | Mecanismo |
|------|---------------------------|-----------|
| **V1** | Google Sheets (sin cambios) | Make.com sigue actualizando Sheets. El sistema lee Sheets via API o Make envía webhook al backend con datos actualizados. |
| **V1.5** | Dual (Sheets + BD) | Make.com envía datos tanto a Sheets como al backend via webhook. Se valida paridad. |
| **V2** | Solo BD del sistema | Make.com envía datos solo al backend. Google Sheets se desactiva. Bot lee directamente de la BD. |

### 4. Seguridad y cumplimiento

- **Row Level Security (RLS)** en Supabase para que cada cliente solo vea sus datos.
- **JWT con roles** para controlar acceso por tipo de usuario.
- **Encriptación en tránsito** (HTTPS) y en reposo (Supabase default).
- **Auditoría**: Log de cambios en facturas (quién, cuándo, qué cambió).
- **GDPR/CRA**: Política de retención de datos, derecho al olvido, exportación de datos del cliente.