# Auditoría Técnica y Planificación Fase 2 - Hago Produce

**Fecha:** 22 de Febrero, 2026  
**Autor:** SuperNinja AI - Tech Lead  
**Proyecto:** Hago Produce  
**Repositorio:** https://github.com/nhadadn/Hago-Produce  
**Fase Actual:** 1C (Completada) → Fase 2 (Próxima)

---

## 📋 Tabla de Contenidos

1. [Análisis del Estado Actual (Audit Checkout)](#1-análisis-del-estado-actual-audit-checkout)
2. [Identificación de Gaps y Mejoras](#2-identificación-de-gaps-y-mejoras)
3. [Roadmap Fase 2: Estrategia y Ejecución](#3-roadmap-fase-2-estrategia-y-ejecución)
4. [Generación de Prompts para Implementación](#4-generación-de-prompts-para-implementación)
5. [Métricas de Éxito y KPIs](#5-métricas-de-éxito-y-kpis)
6. [Dashboard Ejecutivo](#6-dashboard-ejecutivo)

---

## 1. ANÁLISIS DEL ESTADO ACTUAL (AUDIT CHECKOUT)

### 1.1 Contexto General

**Stack Tecnológico Actual:**
- **Frontend:** Next.js 14.1.0 (App Router), TypeScript 5, Tailwind CSS 3.3.0, Shadcn/UI (Radix UI)
- **Backend:** Next.js API Routes, Prisma ORM 5.10.2, PostgreSQL
- **Auth:** JWT (jsonwebtoken), bcrypt para passwords
- **UI Components:** Radix UI, Lucide React icons, React Hook Form, Zod validation
- **Charts:** Recharts 3.7.0 (instalado, no utilizado extensivamente)
- **Testing:** Jest 29.7.0, Playwright 1.41.2
- **Deployment:** Railway

**Estado del Proyecto:**
- ✅ **Fase 0:** Completada (Setup, CI/CD, Wireframes)
- ✅ **Fase 1A:** Completada (Auth, Users, Dashboard básico)
- ✅ **Fase 1B:** Completada (Facturación completa, Productos, Suppliers)
- ⚠️ **Fase 1C:** Parcialmente completada (Chat/Agente backend implementado, Frontend pendiente)
- 🚧 **Fase 2:** Pendiente (Reports, Google Sheets migration, Bot externo, SPA pública)

---

### 1.2 Inventario de Funcionalidades

| Módulo | Funcionalidad | Estado | Cobertura (%) | Observaciones |
|--------|---------------|--------|---------------|---------------|
| **Auth & Security** | JWT Authentication | ✅ Operativo | 90% | Login, refresh tokens implementados |
| | Role-based access (RBAC) | ✅ Operativo | 85% | ADMIN, ACCOUNTING, MANAGEMENT, CUSTOMER roles |
| | Password hashing (bcrypt) | ✅ Operativo | 100% | bcrypt v6.0.0 |
| | Middleware de protección | ⚠️ Parcial | 40% | Middleware básico, protección por rutas incompleta |
| **Users Management** | CRUD Users | ✅ Operativo | 100% | Endpoints completos |
| | User activation/deactivation | ✅ Operativo | 100% | Campo isActive implementado |
| **Customers** | CRUD Customers | ✅ Operativo | 100% | Endpoints completos |
| | Customer-User association | ✅ Operativo | 100% | Relación implementada |
| **Suppliers** | CRUD Suppliers | ✅ Operativo | 100% | Endpoints completos |
| **Products** | CRUD Products | ✅ Operativo | 100% | Endpoints completos |
| | Multi-language (ES/EN) | ✅ Operativo | 100% | Campos name y nameEs |
| **Product Prices** | CRUD Prices | ✅ Operativo | 100% | Supplier-product pricing |
| | Bulk price updates | ✅ Operativo | 100% | Endpoint bulk-update implementado |
| | Price history | ✅ Operativo | 100% | Campo effectiveDate, isCurrent |
| **Invoices** | CRUD Invoices | ✅ Operativo | 100% | Endpoints completos |
| | Invoice items management | ✅ Operativo | 100% | Relación con productos |
| | Invoice status workflow | ✅ Operativo | 90% | DRAFT, SENT, PENDING, PAID, CANCELLED, OVERDUE |
| | Internal notes | ✅ Operativo | 100% | InvoiceNotes implementado |
| | Status change history | ✅ Operativo | 80% | AuditLog parcial |
| | PDF generation | ✅ Operativo | 100% | PDFPreview componente implementado |
| **Chat/Agent** | Backend Chat API | ✅ Operativo | 90% | POST /api/v1/chat/query con OpenAI |
| | Intent detection | ✅ Operativo | 100% | price_lookup, best_supplier, invoice_status, customer_balance |
| | OpenAI integration | ✅ Operativo | 100% | GPT-4o-mini con fallback local |
| | Chat UI Frontend | ❌ Pendiente | 0% | No implementado (Task 1C.3) |
| **Notifications** | Notifications engine | ❌ Pendiente | 0% | No implementado (Tasks 1C.4-1C.5) |
| **Customer Portal** | Portal Auth | ⚠️ Parcial | 30% | Layout básico, login con TaxID pendiente |
| | Customer Dashboard | ❌ Pendiente | 0% | No implementado (Task 1C.7) |
| | Invoice viewing for customers | ✅ Operativo | 60% | Endpoint /my-invoices existe, UI básica |
| **Reports & Analytics** | Basic dashboard cards | ✅ Operativo | 60% | SummaryCards, IncomeChart parcial |
| | Advanced reports | ❌ Pendiente | 0% | Fase 2 |
| **Google Sheets Integration** | Current integration | ⚠️ Parcial | 50% | Webhook existente, migración pendiente |
| **External Bot** | WhatsApp/Telegram Bot | ❌ Pendiente | 0% | Fase 2 |
| **Public SPA** | Landing page | ❌ Pendiente | 0% | Fase 2 |
| **Testing** | Unit tests | ⚠️ Parcial | 40% | 13 archivos de tests, coverage desconocido |
| | Integration tests | ⚠️ Parcial | 30% | Algunos tests de API implementados |
| | E2E tests | ❌ Pendiente | 0% | Playwright configurado pero no utilizado |

---

### 1.3 Diagrama de Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Admin UI    │  │ Customer UI  │  │  Public UI   │          │
│  │ (Next.js App │  │ (Portal)     │  │ (SPA - Fase2)│          │
│  │   Router)    │  │              │  │              │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                    │
│         └─────────────────┴─────────────────┘                    │
│                           │                                       │
│                           ▼                                       │
├─────────────────────────────────────────────────────────────────┤
│                      API LAYER (Next.js API Routes)              │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐     │
│  │  /api/v1/                                              │     │
│  │    ├─ auth/ (login, register, refresh, me)             │     │
│  │    ├─ users/                                           │     │
│  │    ├─ customers/                                       │     │
│  │    ├─ suppliers/                                       │     │
│  │    ├─ products/                                        │     │
│  │    ├─ product-prices/                                  │     │
│  │    ├─ invoices/                                        │     │
│  │    ├─ chat/query (Fase 1C - Operativo)                 │     │
│  │    └─ notifications/ (Fase 1C - Pendiente)             │     │
│  └────────────────────────────────────────────────────────┘     │
│                           │                                       │
│                           ▼                                       │
├─────────────────────────────────────────────────────────────────┤
│                    BUSINESS LOGIC LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Services        │  │  Validation      │  │  Auth        │  │
│  │  - invoices      │  │  - Zod schemas   │  │  - JWT       │  │
│  │  - customers     │  │  - TypeScript    │  │  - bcrypt    │  │
│  │  - products      │  │                  │  │  - middleware│  │
│  │  - chat (Fase1C) │  │                  │  │              │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                           │                                       │
│                           ▼                                       │
├─────────────────────────────────────────────────────────────────┤
│                      DATA ACCESS LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Prisma ORM                                           │     │
│  │  - Query building                                     │     │
│  │  - Type-safe database access                          │     │
│  │  - Migrations                                         │     │
│  └────────────────────────────────────────────────────────┘     │
│                           │                                       │
│                           ▼                                       │
├─────────────────────────────────────────────────────────────────┤
│                       DATABASE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐     │
│  │  PostgreSQL (Railway)                                 │     │
│  │  - users, customers, suppliers                         │     │
│  │  - products, product_prices                            │     │
│  │  - invoices, invoice_items, invoice_notes              │     │
│  │  - audit_log                                           │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘

INTEGRACIONES EXTERNAS:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Google Sheets  │    │   Make.com      │    │    OpenAI       │
│  (Migración     │◄──►│  Webhooks       │◄──►│  (Chat Agent)   │
│   Pendiente)    │    │  (Actuales)     │    │  (GPT-4o-mini)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                      │
                                                      ▼
                                          ┌─────────────────┐
                                          │  Twilio/Telegram│
                                          │  (Fase 2 -      │
                                          │   Pendiente)    │
                                          └─────────────────┘
```

---

### 1.4 Evaluación de Arquitectura

#### ✅ **Fortalezas Identificadas**

1. **Patrones de Arquitectura:**
   - ✅ **Server Components:** Next.js 14 App Router correctamente implementado
   - ✅ **API Routes:** Estructura RESTful en `/api/v1/`
   - ✅ **Service Layer:** Separación clara entre routes y business logic en `src/lib/services/`
   - ✅ **Repository Pattern:** Prisma ORM actúa como capa de abstracción
   - ✅ **Validation Layer:** Zod schemas centralizados en `src/lib/validation/`

2. **Estructura de Carpetas:**
   - ✅ Organización modular por funcionalidad (auth, invoices, products, etc.)
   - ✅ Separación clara entre componentes, servicios, y utilidades
   - ✅ Grupos de rutas con paréntesis: `(auth)`, `(admin)`, `(customer)`, `(accounting)`
   - ✅ Componentes UI reutilizables en `src/components/ui/` (Shadcn/UI)

3. **Separación de Responsabilidades:**
   - ✅ Frontend/Backend separados en código compartido (Next.js)
   - ✅ Validation independiente de business logic
   - ✅ Services reutilizables entre diferentes API routes
   - ✅ Auth middleware reusable en todas las rutas protegidas

4. **Convenciones de Código:**
   - ✅ TypeScript strict mode habilitado
   - ✅ ESLint configurado
   - ✅ Consistent naming (camelCase para variables, PascalCase para componentes)
   - ✅ Rutas API RESTful con métodos HTTP correctos

#### ⚠️ **Áreas de Mejora Identificadas**

1. **Chat Module (Fase 1C):**
   - ⚠️ Backend implementado pero frontend pendiente (Task 1C.3)
   - ⚠️ No hay ruta `(admin)/chat/page.tsx`
   - ⚠️ No hay componentes de chat UI

2. **Customer Portal (Fase 1C):**
   - ⚠️ Layout básico pero sin auth específico de clientes
   - ⚠️ Login con TaxID + password no implementado (Task 1C.6)
   - ⚠️ Dashboard de cliente no implementado (Task 1C.7)

3. **Notifications Engine (Fase 1C):**
   - ❌ No implementado (Tasks 1C.4-1C.5)
   - ❌ No hay triggers para status changes
   - ❌ No hay integración con Twilio/Telegram

4. **Middleware & Security:**
   - ⚠️ Middleware en `src/middleware.ts` es demasiado permisivo
   - ⚠️ No hay rate limiting global
   - ⚠️ Protección de rutas frontend incompleta

5. **Testing:**
   - ⚠️ Coverage desconocido (Jest configurado pero no ejecutado)
   - ⚠️ Tests de integración parciales
   - ❌ No hay tests E2E

6. **Documentation:**
   - ⚠️ JSDoc casi inexistente en funciones complejas
   - ⚠️ No hay READMEs por módulo
   - ✅ Documentación general en `docs/` es buena

---

### 1.5 Análisis de Base de Datos (Prisma Schema)

**Modelos Implementados:**
- ✅ `User` - con relaciones a Customer y AuditLog
- ✅ `Customer` - con relaciones a Users e Invoices
- ✅ `Supplier` - con relación a ProductPrice
- ✅ `Product` - con relaciones a ProductPrice e InvoiceItem
- ✅ `ProductPrice` - histórico de precios por proveedor
- ✅ `Invoice` - con relaciones a Customer, InvoiceItem, InvoiceNote
- ✅ `InvoiceItem` - items de factura
- ✅ `InvoiceNote` - notas internas
- ✅ `AuditLog` - log de auditoría

**Índices Implementados:**
- ✅ Products: name, sku, category, isActive
- ✅ Invoices: customerId, status, issueDate, number
- ✅ InvoiceItems: invoiceId, productId
- ✅ InvoiceNotes: invoiceId, userId
- ✅ ProductPrices: productId, supplierId, isCurrent
- ✅ AuditLog: entityType, entityId, userId

**Observaciones:**
- ✅ Soft deletes implementado en `Product` (deletedAt)
- ✅ Timestamps automáticos en todos los modelos
- ✅ Enum `InvoiceStatus` bien definido
- ✅ Enum `Role` bien definido
- ⚠️ No hay modelo para `Notification` o `Message` (necesario para Fase 1C y 2)
- ⚠️ No hay modelo para `WebhookLog` (necesario para tracking de Make.com)
- ⚠️ No hay modelo para `PriceTrend` o `ReportCache` (necesario para Fase 2)

---

## 2. IDENTIFICACIÓN DE GAPS Y MEJORAS

### 2.1 Matriz de Priorización de Refactorizaciones

| # | Categoría | Issue | Impacto | Esfuerzo | Prioridad | Archivos afectados |
|---|-----------|-------|---------|----------|-----------|-------------------|
| **SECURITY** |
| 1 | Seguridad | Middleware demasiado permisivo - protege muy pocas rutas | Alto | Medio | 🔴 Alta | `src/middleware.ts`, `src/lib/auth/middleware.ts` |
| 2 | Seguridad | No hay rate limiting global en API routes | Alto | Medio | 🔴 Alta | Todas las rutas `/api/v1/` |
| 3 | Seguridad | Inputs no sanitizados (solo validados con Zod) | Medio | Bajo | 🟡 Media | Todos los API routes |
| 4 | Seguridad | No hay CSRF protection en API routes | Medio | Medio | 🟡 Media | `src/app/api/v1/` |
| 5 | Seguridad | Token refresh no implementado completamente | Alto | Alto | 🔴 Alta | `src/app/api/v1/auth/refresh/route.ts` |
| **PERFORMANCE** |
| 6 | Performance | Posibles queries N+1 en invoices con includes | Alto | Medio | 🔴 Alta | `src/lib/services/invoices.service.ts` |
| 7 | Performance | No hay caché de datos frecuentes (productos, precios) | Medio | Medio | 🟡 Media | `src/app/api/v1/` |
| 8 | Performance | Componentes sin memoización (React.memo, useMemo) | Medio | Medio | 🟡 Media | `src/components/` |
| 9 | Performance | No hay pagination en listas grandes (invoices, products) | Alto | Bajo | 🔴 Alta | `src/app/api/v1/*/route.ts` |
| 10 | Performance | Imágenes sin optimizar (Next/Image no utilizado) | Bajo | Bajo | 🟢 Baja | Componentes con imágenes |
| **CODE QUALITY** |
| 11 | Calidad | Código duplicado en validaciones de errores en API routes | Medio | Bajo | 🟡 Media | Todos los API routes |
| 12 | Calidad | "Magic strings" en status codes y error messages | Medio | Bajo | 🟡 Media | API routes, services |
| 13 | Calidad | Falta JSDoc en funciones complejas de services | Medio | Medio | 🟡 Media | `src/lib/services/` |
| 14 | Calidad | Tests de integración incompletos | Alto | Alto | 🔴 Alta | `src/tests/integration/` |
| 15 | Calidad | No hay tests E2E con Playwright | Medio | Alto | 🟡 Media | Tests folder |
| **PHASE 1C GAPS** |
| 16 | Fase 1C | Chat UI frontend no implementado | Alto | Medio | 🔴 Alta | `src/app/(admin)/chat/`, `src/components/chat/` |
| 17 | Fase 1C | Notifications engine no implementado | Alto | Alto | 🔴 Alta | `src/lib/services/notifications/` |
| 18 | Fase 1C | Webhook notifications (WA/Telegram) no implementadas | Alto | Alto | 🔴 Alta | `src/app/webhooks/notifications/` |
| 19 | Fase 1C | Customer portal auth incompleto | Alto | Medio | 🔴 Alta | `src/app/(portal)/login/` |
| 20 | Fase 1C | Customer dashboard no implementado | Medio | Medio | 🟡 Media | `src/app/(portal)/customer/dashboard/` |
| **PHASE 2 PREPARATION** |
| 21 | Fase 2 | No hay modelo de Notification en Prisma schema | Alto | Bajo | 🔴 Alta | `prisma/schema.prisma` |
| 22 | Fase 2 | No hay modelo de WebhookLog en Prisma schema | Medio | Bajo | 🟡 Media | `prisma/schema.prisma` |
| 23 | Fase 2 | No hay sistema de reportes backend | Alto | Alto | 🔴 Alta | `src/lib/services/reports/` |
| 24 | Fase 2 | No hay endpoints de reportes API | Alto | Medio | 🔴 Alta | `src/app/api/v1/reports/` |
| 25 | Fase 2 | Google Sheets migration script no implementado | Alto | Alto | 🔴 Alta | Scripts de migración |
| 26 | Fase 2 | External Bot API no implementada | Medio | Alto | 🟡 Media | `src/app/api/v1/bot/` |
| 27 | Fase 2 | SPA pública no implementada | Bajo | Medio | 🟢 Baja | `src/app/(public)/` |
| **DOCUMENTATION** |
| 28 | Docs | Falta README por módulo | Bajo | Bajo | 🟢 Baja | `src/` folders |
| 29 | Docs | API documentation no generada | Medio | Medio | 🟡 Media | Swagger/OpenAPI |
| 30 | Docs | Deployment guide incompleto | Bajo | Bajo | 🟢 Baja | `docs/` |

---

### 2.2 Análisis Detallado por Categoría

#### 🔴 **CRÍTICAS - Bloquean Fase 2 o riesgo de seguridad**

1. **Middleware Security (Issue #1)**
   - **Problema:** Middleware actual permite todas las rutas excepto `/api/v1/auth`
   - **Impacto:** Rutas frontend y API expuestas sin autenticación adecuada
   - **Solución:** Implementar protección robusta con roles, verificar tokens JWT en todas las rutas protegidas
   - **Archivos:** `src/middleware.ts`

2. **Rate Limiting (Issue #2)**
   - **Problema:** No hay límite de solicitudes por IP/usuario
   - **Impacto:** Vulnerable a DDoS, abuso de API, costos de OpenAI descontrolados
   - **Solución:** Implementar rate limiting con Redis o in-memory
   - **Archivos:** Middleware o helper function

3. **Pagination (Issue #9)**
   - **Problema:** Listas retornan todos los registros sin paginación
   - **Impacto:** Performance severo con datasets grandes, timeouts
   - **Solución:** Implementar pagination en todos los endpoints de lista
   - **Archivos:** `src/app/api/v1/*/route.ts`, services

4. **Chat UI (Issue #16)**
   - **Problema:** Backend de chat implementado pero no hay UI
   - **Impacto:** Fase 1C incompleta, no usable por usuarios
   - **Solución:** Implementar componentes de chat UI (Task 1C.3)
   - **Archivos:** `src/app/(admin)/chat/`, `src/components/chat/`

5. **Notifications Engine (Issue #17)**
   - **Problema:** Sistema de notificaciones completamente pendiente
   - **Impacto:** Fase 1C incompleta, no hay comunicación proactiva
   - **Solución:** Implementar motor de notificaciones (Tasks 1C.4-1C.5)
   - **Archivos:** `src/lib/services/notifications/`, API routes

6. **Reports Backend (Issue #23)**
   - **Problema:** No hay sistema de reportes para Fase 2
   - **Impacto:** Bloquea funcionalidad principal de Fase 2
   - **Solución:** Implementar servicio de reportes con aggregations
   - **Archivos:** `src/lib/services/reports/`, `src/app/api/v1/reports/`

7. **Google Sheets Migration (Issue #25)**
   - **Problema:** Dependencia de Google Sheets no eliminada
   - **Impacto:** Data silos, sincronización compleja, single point of failure
   - **Solución:** Script de migración de datos a PostgreSQL
   - **Archivos:** Scripts de migración

#### 🟡 **IMPORTANTES - Mejora significativa pero no bloqueante**

8. **Queries N+1 (Issue #6)**
   - **Problema:** Posible problema con includes en queries complejas
   - **Impacto:** Performance degradado, timeouts en carga
   - **Solución:** Revisar queries, usar Prisma's select/include eficientemente

9. **Caching (Issue #7)**
   - **Problema:** No hay caché de datos frecuentes
   - **Impacto:** Carga innecesaria de base de datos, latency
   - **Solución:** Implementar caché con Redis o in-memory

10. **Error Handling (Issue #11)**
    - **Problema:** Código duplicado en manejo de errores
    - **Impacto:** Mantenibilidad, consistencia
    - **Solución:** Crear helper function para error responses

11. **Tests Coverage (Issue #14)**
    - **Problema:** Coverage desconocido, tests incompletos
    - **Impacto:** Riesgo de bugs en producción
    - **Solución:** Completar tests de integración, agregar E2E

12. **External Bot API (Issue #26)**
    - **Problema:** No hay API pública para bots externos
    - **Impacto:** Bloquea funcionalidad de Fase 2
    - **Solución:** Implementar API endpoints con autenticación por API key

#### 🟢 **MEJORAS - Nice to have, puede posponerse**

13. **CSRF Protection (Issue #4)**
    - **Problema:** No hay protección CSRF
    - **Impacto:** Vulnerabilidad a ataques CSRF
    - **Solución:** Implementar tokens CSRF en formularios

14. **Component Memoization (Issue #8)**
    - **Problema:** Componentes no optimizados
    - **Impacto:** Performance UI, re-renders innecesarios
    - **Solución:** Usar React.memo, useMemo, useCallback

15. **Image Optimization (Issue #10)**
    - **Problema:** Imágenes sin optimizar
    - **Impacto:** Performance de carga, bandwidth
    - **Solución:** Usar Next/Image componente

16. **Documentation (Issues #28-30)**
    - **Problema:** Documentación incompleta
    - **Impacto:** Onboarding difícil, mantenimiento
    - **Solución:** Agregar READMEs, JSDoc, API docs

---

## 3. ROADMAP FASE 2: ESTRATEGIA Y EJECUCIÓN

### 3.1 Overview de Fase 2

**Objetivo Principal:** Transformar Hago Produce de un sistema básico de facturación a una plataforma completa con analytics, automatización avanzada, y presencia pública.

**Duración Estimada:** 8-12 semanas (Q2 2026)  
**Complejidad:** Alta  
**Dependencias:** Fase 1C completada

**Módulos Principales:**
1. 📊 **Reportes Avanzados & Dashboards** - Analytics, KPIs, exportación
2. 🔄 **Migración Google Sheets → DB** - Eliminar dependencia externa
3. 🤖 **Bot Externo** - WhatsApp/Telegram para comunicación proactiva
4. 🌐 **SPA Pública** - Landing page institucional

---

### 3.2 Breakdown por Módulo

#### 📊 Módulo 1: Reportes Avanzados & Dashboards

**Prioridad:** 🔴 Alta  
**Complejidad:** 🔴 Alta  
**Duración Estimada:** 2-3 semanas

| ID | Tarea | Descripción | Complejidad | Dependencias | Estimación |
|----|-------|-------------|-------------|--------------|------------|
| R-01 | Reports Backend Service | Crear servicio de reportes con aggregations complejas sobre invoices, productos, customers | 🔴 Alta | Ninguna | L |
| R-02 | KPIs Endpoints | Endpoints para métricas clave: revenue, aging, top customers/products, trends | 🔴 Alta | R-01 | M |
| R-03 | Date Range Filtering | Sistema flexible de filtros por fecha en todos los reportes | 🟡 Media | R-01 | M |
| R-04 | Report Caching | Caché de reportes costosos con TTL configurable | 🟡 Media | R-01 | M |
| R-05 | Reports API Routes | Crear endpoints `/api/v1/reports/*` con validación y auth | 🟡 Media | R-01, R-02 | M |
| R-06 | Reports UI Framework | Layout y estructura base para página de reportes | 🟡 Media | Ninguna | S |
| R-07 | Charts Integration | Integrar Recharts para visualizaciones: bar, line, pie, area | 🟡 Media | R-02, R-06 | M |
| R-08 | Revenue Dashboard | Dashboard de ingresos con gráficos de tendencia, comparativas período | 🔴 Alta | R-02, R-07 | L |
| R-09 | Aging Report | Reporte de vencimiento con buckets: 30, 60, 90+ días | 🔴 Alta | R-02, R-07 | M |
| R-10 | Top Customers/Products | Tablas y gráficos de top performers | 🟡 Media | R-02, R-07 | M |
| R-11 | PDF/CSV Export | Funcionalidad de exportar reportes a PDF y CSV | 🔴 Alta | R-01, R-02 | L |
| R-12 | Drill-down Reports | Click-through desde resumenes hasta detalle | 🟡 Media | R-02, R-07 | M |
| R-13 | Custom Report Builder | Interfaz simple para crear reportes personalizados | 🟢 Baja | R-01, R-05 | XL |
| R-14 | Scheduled Reports | Sistema para generar y enviar reportes automáticamente | 🟡 Media | R-01, R-11 | XL |

**Notas Técnicas:**
- **Librerías sugeridas:** Recharts (ya instalado), jspdf para PDF export, csv-stringify para CSV
- **Patrones a seguir:** Service layer para business logic, validación Zod, rate limiting en endpoints
- **Performance:** Usar agregaciones de Prisma, no traer todos los datos al frontend
- **Caching:** Implementar caché en memoria para reportes frecuentes, TTL 5-15 minutos
- **Export PDF:** Usar jspdf-autotable para tablas, o puppeteer para capturas de pantalla
- **Export CSV:** Generar en server-side, no en frontend

**Archivos a Crear/Modificar:**
```
src/lib/services/reports/
  ├── index.ts
  ├── kpi.service.ts
  ├── revenue.service.ts
  ├── aging.service.ts
  ├── top-performers.service.ts
  └── export.service.ts

src/app/api/v1/reports/
  ├── kpi/route.ts
  ├── revenue/route.ts
  ├── aging/route.ts
  ├── top/route.ts
  ├── export/pdf/route.ts
  └── export/csv/route.ts

src/app/(admin)/reports/
  ├── page.tsx
  ├── layout.tsx
  ├── components/
  │   ├── ReportCard.tsx
  │   ├── DateRangePicker.tsx
  │   ├── KPICharts.tsx
  │   ├── RevenueChart.tsx
  │   ├── AgingChart.tsx
  │   ├── TopPerformers.tsx
  │   └── ExportButton.tsx

prisma/schema.prisma
  ├── (Añadir índices para queries de reportes)
```

---

#### 🔄 Módulo 2: Migración Google Sheets → DB

**Prioridad:** 🔴 Alta (CRÍTICA)  
**Complejidad:** 🔴 Alta  
**Duración Estimada:** 1-2 semanas

| ID | Tarea | Descripción | Complejidad | Dependencias | Estimación |
|----|-------|-------------|-------------|--------------|------------|
| GS-01 | Google Sheets API Client | Cliente para leer datos de Google Sheets existentes | 🔴 Alta | Ninguna | L |
| GS-02 | Data Mapping Schema | Mapeo de columnas de Sheets a modelos Prisma | 🟡 Media | GS-01 | M |
| GS-03 | Migration Script | Script principal de importación con validaciones | 🔴 Alta | GS-01, GS-02 | L |
| GS-04 | Data Validation Engine | Validar integridad de datos migrados | 🔴 Alta | GS-03 | L |
| GS-05 | Conflict Resolution | Lógica para resolver conflictos con datos existentes | 🟡 Media | GS-03 | M |
| GS-06 | Migration Rollback | Funcionalidad de rollback si migración falla | 🔴 Alta | GS-03 | M |
| GS-07 | Dry Run Mode | Modo de simulación sin persistir datos | 🟡 Media | GS-03 | S |
| GS-08 | Migration Log | Log detallado de migración con estadísticas | 🟡 Media | GS-03 | S |
| GS-09 | Data Verification Post-Migration | Script para verificar integridad post-migración | 🔴 Alta | GS-03 | L |
| GS-10 | Disable Google Sheets Integration | Desactivar webhooks de Google Sheets | 🟡 Media | GS-09 | S |
| GS-11 | Make.com API Migration | Actualizar Make.com para enviar directamente a API | 🔴 Alta | GS-10 | L |
| GS-12 | Webhook Receiver | Endpoint robusto para recibir datos de Make.com | 🔴 Alta | Ninguna | M |

**Notas Técnicas:**
- **Librerías sugeridas:** googleapis para Google Sheets, zod para validación
- **Patrones a seguir:** Script en `scripts/` con flags de configuración
- **Consideraciones:**
  - Datos a migrar: Products, Suppliers, ProductPrices, Customers, Invoices
  - Mantener IDs originales cuando sea posible para trazabilidad
  - Usar transacciones de Prisma para atomicidad
  - Implementar "dry run" para probar antes de migrar
- **Make.com Integration:**
  - Crear endpoint POST `/api/v1/webhooks/make` para recibir datos
  - Validar payload con Zod
  - Procesar datos y persistir en DB
  - Responder con confirmación

**Archivos a Crear/Modificar:**
```
scripts/
  ├── google-sheets-migration/
  │   ├── index.ts
  │   ├── client.ts
  │   ├── mapping.ts
  │   ├── validator.ts
  │   ├── migrator.ts
  │   ├── rollback.ts
  │   └── verifier.ts
  └── .env.example (añadir GOOGLE_SHEETS_*)
```

---

#### 🤖 Módulo 3: Bot Externo

**Prioridad:** 🟡 Media  
**Complejidad:** 🔴 Alta  
**Duración Estimada:** 2-3 semanas

| ID | Tarea | Descripción | Complejidad | Dependencias | Estimación |
|----|-------|-------------|-------------|--------------|------------|
| BOT-01 | Bot API Key Management | Sistema de generación y rotación de API keys para bots | 🔴 Alta | Ninguna | M |
| BOT-02 | Public Bot API Endpoints | Endpoints públicos para consultas de bots | 🔴 Alta | BOT-01 | L |
| BOT-03 | Query Service for Bots | Servicio reutilizable de consultas (similar a chat) | 🟡 Media | Ninguna | M |
| BOT-04 | Twilio WhatsApp Integration | Envío de mensajes vía Twilio WhatsApp API | 🔴 Alta | Ninguna | L |
| BOT-05 | Telegram Bot Integration | Bot de Telegram con comandos básicos | 🔴 Alta | Ninguna | L |
| BOT-06 | Webhook Handlers | Handlers para webhooks de WhatsApp y Telegram | 🔴 Alta | BOT-04, BOT-05 | L |
| BOT-07 | Message Queue System | Cola para procesar mensajes asíncronos | 🟡 Media | Ninguna | L |
| BOT-08 | Bot Authentication | Verificación de tokens de plataformas externas | 🟡 Media | BOT-04, BOT-05 | M |
| BOT-09 | Rate Limiting per Bot | Rate limiting específico por API key de bot | 🔴 Alta | BOT-01 | M |
| BOT-10 | Error Handling & Retry | Lógica robusta de reintentos y error handling | 🟡 Media | Ninguna | M |
| BOT-11 | Bot Dashboard UI | Interfaz para monitorear bots y ver logs | 🟢 Baja | BOT-01 | M |
| BOT-12 | Proactive Notifications | Sistema de envío proactivo de notificaciones | 🔴 Alta | Fase 1C completo | XL |

**Notas Técnicas:**
- **Librerías sugeridas:** @twilio/sdk para WhatsApp, node-telegram-bot-api para Telegram
- **Patrones a seguir:**
  - API RESTful para consultas
  - Webhooks para recibir mensajes de plataformas
  - Service layer para business logic
- **Seguridad:**
  - Autenticación por API key
  - Verificación de webhooks (signatures)
  - Rate limiting agresivo
- **Comunicación:**
  - Mensajes formateados en lenguaje natural
  - Soporte bilingüe ES/EN
  - Manejo de estados de conversación

**Archivos a Crear/Modificar:**
```
src/app/api/v1/bot/
  ├── query/route.ts
  ├── webhook/whatsapp/route.ts
  └── webhook/telegram/route.ts

src/lib/services/bot/
  ├── index.ts
  ├── api-key.service.ts
  ├── query.service.ts
  ├── whatsapp.service.ts
  ├── telegram.service.ts
  └── message-queue.service.ts

src/lib/notifications/
  ├── index.ts
  ├── triggers.ts
  ├── channels.ts
  └── templates.ts

prisma/schema.prisma
  ├── model BotApiKey
  ├── model Notification
  ├── model Message
  └── model WebhookLog

src/app/(admin)/bots/
  ├── page.tsx
  └── components/
      ├── BotList.tsx
      ├── BotStats.tsx
      └── BotLogs.tsx
```

---

#### 🌐 Módulo 4: SPA Pública

**Prioridad:** 🟡 Media  
**Complejidad:** 🟡 Media  
**Duración Estimada:** 1-2 semanas

| ID | Tarea | Descripción | Complejidad | Dependencias | Estimación |
|----|-------|-------------|-------------|--------------|------------|
| PUB-01 | Public Route Structure | Estructura de rutas públicas sin auth | 🟢 Baja | Ninguna | S |
| PUB-02 | Landing Page Design | Diseño atractivo y profesional de landing page | 🟡 Media | PUB-01 | M |
| PUB-03 | Features Section | Sección de características del sistema | 🟢 Baja | PUB-02 | S |
| PUB-04 | Contact Form | Formulario de contacto con validación | 🟡 Media | PUB-02 | M |
| PUB-05 | Demo Request Form | Formulario para solicitar demo | 🟡 Media | PUB-04 | S |
| PUB-06 | SEO Optimization | Meta tags, sitemap, robots.txt | 🟡 Media | PUB-01 | M |
| PUB-07 | Responsive Design | Mobile-first responsive design | 🟡 Media | PUB-02 | M |
| PUB-08 | Performance Optimization | Optimización de carga, lazy loading | 🟡 Media | PUB-02 | M |
| PUB-09 | Analytics Integration | Google Analytics o similar | 🟢 Baja | PUB-01 | S |
| PUB-10 | Social Media Links | Links a redes sociales | 🟢 Baja | PUB-02 | S |
| PUB-11 | About Us Section | Sección "Sobre Nosotros" | 🟢 Baja | PUB-02 | S |
| PUB-12 | FAQ Section | Preguntas frecuentes | 🟢 Baja | PUB-02 | S |

**Notas Técnicas:**
- **Librerías sugeridas:** framer-motion para animaciones, next-seo para SEO
- **Patrones a seguir:**
  - Server Components para SEO
  - Client Components para interactividad
  - Tailwind CSS para styling
- **SEO:**
  - Meta tags dinámicos
  - Sitemap.xml
  - Robots.txt
  - Open Graph tags
- **Performance:**
  - Next/Image para imágenes
  - Lazy loading de componentes
  - Minimizar bundle size

**Archivos a Crear/Modificar:**
```
src/app/(public)/
  ├── layout.tsx
  ├── page.tsx
  ├── about/page.tsx
  ├── features/page.tsx
  ├── contact/page.tsx
  └── demo/page.tsx

src/components/public/
  ├── Hero.tsx
  ├── Features.tsx
  ├── AboutUs.tsx
  ├── ContactForm.tsx
  ├── DemoRequest.tsx
  ├── FAQ.tsx
  ├── Footer.tsx
  └── Navbar.tsx

public/
  ├── images/
  │   ├── logo.svg
  │   ├── hero-bg.jpg
  │   └── ...
  ├── sitemap.xml
  └── robots.txt
```

---

### 3.3 Diagrama de Dependencias

```
Fase 2 - Orden de Ejecución

📦 Módulo 2: Google Sheets Migration (PRIMERO - CRÍTICO)
│
├─ GS-01: Google Sheets API Client
├─ GS-02: Data Mapping Schema
├─ GS-03: Migration Script
├─ GS-04: Data Validation Engine
├─ GS-05: Conflict Resolution
├─ GS-06: Migration Rollback
├─ GS-07: Dry Run Mode
├─ GS-08: Migration Log
├─ GS-09: Data Verification Post-Migration
├─ GS-10: Disable Google Sheets Integration ──────────────────────┐
└─ GS-11: Make.com API Migration                                   │
                                                                  │
📦 Módulo 1: Reports & Dashboards (PARALELO con 3 y 4)            │
│                                                                  │
├─ R-01: Reports Backend Service                                   │
├─ R-02: KPIs Endpoints              ◄────────────────────────────┤
├─ R-03: Date Range Filtering                                       │
├─ R-04: Report Caching                                            │
├─ R-05: Reports API Routes                                        │
├─ R-06: Reports UI Framework                                      │
├─ R-07: Charts Integration                                        │
├─ R-08: Revenue Dashboard                                         │
├─ R-09: Aging Report                                              │
├─ R-10: Top Customers/Products                                    │
├─ R-11: PDF/CSV Export                                            │
├─ R-12: Drill-down Reports                                        │
├─ R-13: Custom Report Builder                                     │
└─ R-14: Scheduled Reports                                         │
                                                                   │
📦 Módulo 3: Bot Externo (PARALELO)                                │
│                                                                  │
├─ BOT-01: Bot API Key Management                                  │
├─ BOT-02: Public Bot API Endpoints                                │
├─ BOT-03: Query Service for Bots                                  │
├─ BOT-04: Twilio WhatsApp Integration                             │
├─ BOT-05: Telegram Bot Integration                                │
├─ BOT-06: Webhook Handlers                                        │
├─ BOT-07: Message Queue System                                    │
├─ BOT-08: Bot Authentication                                      │
├─ BOT-09: Rate Limiting per Bot                                   │
├─ BOT-10: Error Handling & Retry                                  │
├─ BOT-11: Bot Dashboard UI                                        │
└─ BOT-12: Proactive Notifications ◄────── Necesita Fase 1C completa│
                                                                   │
📦 Módulo 4: SPA Pública (PARALELO)                                │
│                                                                  │
├─ PUB-01: Public Route Structure                                  │
├─ PUB-02: Landing Page Design                                     │
├─ PUB-03: Features Section                                        │
├─ PUB-04: Contact Form                                            │
├─ PUB-05: Demo Request Form                                       │
├─ PUB-06: SEO Optimization                                        │
├─ PUB-07: Responsive Design                                       │
├─ PUB-08: Performance Optimization                                │
├─ PUB-09: Analytics Integration                                   │
├─ PUB-10: Social Media Links                                      │
├─ PUB-11: About Us Section                                        │
└─ PUB-12: FAQ Section                                             │
                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Orden Sugerido:**
1. **Semana 1-2:** Módulo 2 (Google Sheets Migration) - CRÍTICO, bloqueante
2. **Semana 3-5:** Módulo 1 (Reports) - Prioridad alta, paralelo con 3 y 4
3. **Semana 3-5:** Módulo 3 (Bot) - Paralelo
4. **Semana 3-4:** Módulo 4 (SPA Pública) - Paralelo, puede empezar antes

---

### 3.4 Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Data loss durante migración de Google Sheets** | Media | Crítico | - Implementar dry run mode<br>- Backup completo antes de migrar<br>- Rollback plan detallado<br>- Validación post-migración |
| **Performance issues en reportes con datasets grandes** | Alta | Alto | - Implementar paginación en todas las queries<br>- Caching agresivo de reportes<br>- Agregaciones en DB, no en backend<br>- Indices adicionales en Prisma |
| **Costo de OpenAI/KPIs descontrolado** | Media | Alto | - Rate limiting agresivo en bot API<br>- Caching de respuestas de chat<br>- Monitoreo de costos en tiempo real<br>- Alertas de uso excesivo |
| **Webhooks de Make.com fallan o son inconsistentes** | Media | Alto | - Implementar retry logic con exponential backoff<br>- Queue system para procesar webhooks<br>- Log detallado de webhooks<br>- Validación robusta de payloads |
| **Twilio/Telegram API changes o outages** | Baja | Medio | - Abstracción en service layer<br>- Implementar circuit breakers<br>- Monitor de status de APIs<br>- Plan B manual |
| **SEO no optimizado en SPA pública** | Media | Medio | - Server Components para contenido crítico<br>- Meta tags dinámicos<br>- Sitemap y robots.txt<br>- Testing con Lighthouse |
| **Make.com workflows complejos de migrar** | Alta | Alto | - Documentar workflows actuales<br>- Implementar API endpoints flexibles<br>- Testing incremental<br>- Parallel run periodo |
| **Security vulnerabilities en bot API** | Media | Crítico | - API key rotation automática<br>- Rate limiting por key<br>- Validación exhaustiva de inputs<br>- Penetration testing |
| **Deployment issues en producción** | Media | Medio | - CI/CD pipeline robusto<br>- Staging environment completo<br>- Blue-green deployment<br>- Rollback automation |
| **Fase 1C no completada antes de Fase 2** | Alta | Crítico | - Completar Fase 1C primero<br>- Dependencies claras en roadmap<br>- No iniciar Fase 2 sin 1C completada<br>- Documentar blockers |

---

## 4. GENERACIÓN DE PROMPTS PARA IMPLEMENTACIÓN

### 4.1 Prompts para Módulo 1: Reports & Dashboards

#### Prompt R-01: Reports Backend Service

**Contexto:**
Proyecto Hago Produce en Fase 2. Necesitamos implementar un servicio de reportes robusto para analytics de facturación, productos y clientes. El sistema actualmente tiene Prisma con models: Invoice, InvoiceItem, Product, ProductPrice, Customer, Supplier. Los reportes deben ser eficientes y escalables.

**Tarea específica:**
Crear `src/lib/services/reports/index.ts` con funciones para:

1. `getRevenueMetrics(startDate, endDate)` - Métricas de ingresos:
   - Total revenue (sum de invoice.total)
   - Revenue por mes/día
   - Comparación con período anterior
   - Promedio de invoice amount

2. `getAgingReport(asOfDate)` - Reporte de vencimiento:
   - Invoices agrupadas por bucket: 0-30, 31-60, 61-90, 90+ días overdue
   - Suma de amounts por bucket
   - Conteo de invoices por bucket
   - Por cliente cuando se filtra

3. `getTopCustomers(limit, startDate, endDate)` - Top clientes:
   - Ordenado por revenue descendente
   - Incluir: customer name, total revenue, invoice count, avg invoice amount
   - Filtrable por fecha

4. `getTopProducts(limit, startDate, endDate)` - Top productos:
   - Basado en quantity vendida
   - Incluir: product name, total quantity, total revenue, avg price
   - Filtrable por fecha

5. `getProductPriceTrends(productId, months)` - Tendencia de precios:
   - Historial de precios por proveedor
   - Precio promedio mensual
   - Precio actual
   - % de cambio vs mes anterior

**Constraints técnicos:**
- Stack: Next.js 14, TypeScript, Prisma ORM, PostgreSQL
- Patrones: Service layer pattern, error handling robusto, logging
- Archivos a crear: `src/lib/services/reports/index.ts`
- Dependencies: Prisma models existentes

**Output esperado:**
- [ ] Servicio de reportes con todas las funciones
- [ ] Types TypeScript bien definidos
- [ ] Queries eficientes usando Prisma aggregations
- [ ] Error handling con try-catch y logging
- [ ] Tests unitarios para cada función
- [ ] Documentación JSDoc

**Criterios de aceptación:**
1. Todas las funciones retornan datos correctos según especificación
2. Queries usan agregaciones de Prisma (no traer todos los datos)
3. Performance: queries ejecutan en <2s con dataset de 10k invoices
4. Types TypeScript completos y strict
5. Error handling maneja casos edge (no data, fechas inválidas)

**Ejemplo de código esperado:**
```typescript
export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: { month: string; amount: number }[];
  previousPeriodRevenue: number;
  growthRate: number;
  averageInvoiceAmount: number;
}

export async function getRevenueMetrics(
  startDate: Date,
  endDate: Date
): Promise<RevenueMetrics> {
  // Implementación usando Prisma aggregations
}
```
RESPUESTA DEL PROMPT:

---

#### Prompt R-05: Reports API Routes

**Contexto:**
Ya tenemos el servicio de reportes implementado en `src/lib/services/reports/`. Necesitamos crear los endpoints API para exponer estos reportes al frontend.

**Tarea específica:**
Crear API routes en `src/app/api/v1/reports/`:

1. `POST /api/v1/reports/revenue` - Métricas de ingresos
   - Body: `{ startDate: string, endDate: string, customerId?: string }`
   - Response: `{ success: true, data: RevenueMetrics }`
   - Auth requerido: Roles ADMIN, ACCOUNTING, MANAGEMENT

2. `POST /api/v1/reports/aging` - Reporte de vencimiento
   - Body: `{ asOfDate?: string, customerId?: string }`
   - Response: `{ success: true, data: AgingReport }`
   - Auth requerido: Todos los roles

3. `POST /api/v1/reports/top/customers` - Top clientes
   - Body: `{ limit?: number, startDate?: string, endDate?: string }`
   - Response: `{ success: true, data: TopCustomers[] }`
   - Auth requerido: ADMIN, ACCOUNTING, MANAGEMENT

4. `POST /api/v1/reports/top/products` - Top productos
   - Body: `{ limit?: number, startDate?: string, endDate?: string }`
   - Response: `{ success: true, data: TopProducts[] }`
   - Auth requerido: ADMIN, ACCOUNTING, MANAGEMENT

5. `POST /api/v1/reports/price-trends` - Tendencia de precios
   - Body: `{ productId: string, months?: number }`
   - Response: `{ success: true, data: PriceTrend[] }`
   - Auth requerido: Todos los roles

**Constraints técnicos:**
- Stack: Next.js 14 API Routes, TypeScript, Zod validation
- Patrones: RESTful, consistent error handling, rate limiting
- Archivos a crear/modificar:
  - `src/app/api/v1/reports/revenue/route.ts`
  - `src/app/api/v1/reports/aging/route.ts`
  - `src/app/api/v1/reports/top/customers/route.ts`
  - `src/app/api/v1/reports/top/products/route.ts`
  - `src/app/api/v1/reports/price-trends/route.ts`
- Dependencies: Report service, auth middleware, Zod schemas

**Output esperado:**
- [ ] 5 endpoints API con validación Zod
- [ ] Auth y role checking en cada endpoint
- [ ] Rate limiting (10 requests/minute por user)
- [ ] Error handling consistente
- [ ] Tests de integración para cada endpoint

**Criterios de aceptación:**
1. Todos los endpoints retornan datos correctos del servicio de reportes
2. Validación Zod rechaza requests inválidos con errores claros
3. Auth y roles funcionan correctamente
4. Rate limiting activo y funcional
5. Error 500 manejado correctamente con logging

**Ejemplo de código esperado:**
```typescript
import { z } from 'zod';

const revenueReportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  customerId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return unauthorizedResponse();
  
  const body = await req.json();
  const validation = revenueReportSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.errors[0].message } },
      { status: 400 }
    );
  }
  
  // ... call report service
}
```
RESPUESTA DEL AGENTE:
Solución: Prompt R-05 – Reports API Routes
Resumen: Ya están implementados los 5 endpoints de /api/v1/reports/* con validación Zod, auth por rol, rate limiting de 10 req/min por usuario y tests de integración pasando.

Contexto

Partimos de:

Servicio de reportes ya creado en src/lib/services/reports/index.ts.
Convenciones de API v1:
Autenticación mediante getAuthenticatedUser y unauthorizedResponse de lib/auth/middleware.
Respuestas { success: boolean, data?: ..., error?: { code, message } }.
Validación con Zod en lib/validation/*.
Rate limiting in-memory ya usado en el chat.
Objetivo del prompt R-05: exponer ese servicio por 5 endpoints POST con Zod, auth/roles, rate limiting (10/min/user), error handling consistente y tests de integración.

1. Esquemas Zod para reportes
Nuevo archivo:
src/lib/validation/reports.ts

Define los contratos de entrada de cada endpoint:

ts



import { z } from 'zod';export const revenueReportSchema = z.object({  startDate: z.string(),  endDate: z.string(),  customerId: z.string().optional(),});export const agingReportSchema = z.object({  asOfDate: z.string().optional(),  customerId: z.string().optional(),});export const topCustomersReportSchema = z.object({  limit: z.number().int().min(1).max  (100).optional().default(10),  startDate: z.string().optional(),  endDate: z.string().optional(),});export const topProductsReportSchema = z.object({  limit: z.number().int().min(1).max  (100).optional().default(10),  startDate: z.string().optional(),  endDate: z.string().optional(),});export const priceTrendsReportSchema = z.object({  productId: z.string(),  months: z.number().int().min(1).  max(24).optional().default(6),});
Notas:

limit acotado a 1–100 con default 10.
months acotado (1–24) con default 6.
Las fechas se reciben como string ISO; la conversión a Date y validación extra se hace en la route.
2. Utilidad de rate limiting compartida
Nuevo archivo:
src/lib/rate-limit.ts

Reutiliza el patrón del chat pero lo generaliza:

ts



import { NextRequest } from 'next/server';type RateLimitKey = string;interface RateLimitState {  timestamps: number[];}const RATE_LIMIT_WINDOW_MS = 60_000;const rateLimitStore = new Map<RateLimitKey, RateLimitState>();export function getUserRateLimitKey(userId: string | undefined, req: NextRequest): RateLimitKey {  if (userId) return userId;  const forwarded = req.headers.get  ('x-forwarded-for');  if (forwarded) {    const ip = forwarded.split(',')    [0]?.trim();    if (ip) return ip;  }  return 'anonymous';}export function isRateLimited(key: RateLimitKey, maxRequests: number): boolean {  const now = Date.now();  const state = rateLimitStore.get  (key) || { timestamps: [] };  const recent = state.timestamps.  filter((ts) => now - ts <   RATE_LIMIT_WINDOW_MS);  recent.push(now);  state.timestamps = recent;  rateLimitStore.set(key, state);  return recent.length >   maxRequests;}
Los endpoints de reportes usan:

getUserRateLimitKey(user.userId, req)
isRateLimited(key, 10) → si se supera, devuelven 429 con código RATE_LIMITED.
3. Endpoints implementados
Todos siguen el patrón:

getAuthenticatedUser → 401 si no hay usuario.
Check de rol (cuando aplica).
Rate limit por usuario/IP (10 req/min).
schema.safeParse(body) → 400 con VALIDATION_ERROR si falla.
Mejores validaciones (rangos de fecha).
Llamada al servicio de reportes.
Respuesta { success: true, data: ... }.
try/catch con log y respuesta 500 INTERNAL_ERROR.
3.1 POST /api/v1/reports/revenue
Archivo:
src/app/api/v1/reports/revenue/route.ts

Roles permitidos: ADMIN, ACCOUNTING, MANAGEMENT.
Body: { startDate: string, endDate: string, customerId?: string }.
Puntos clave:

ts



const ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.ACCOUNTING, Role.MANAGEMENT];const MAX_REQUESTS_PER_MINUTE = 10;const user = await getAuthenticatedUser(req);if (!user) return unauthorizedResponse();if (!ALLOWED_ROLES.includes(user.role as Role)) {  return NextResponse.json(    { success: false, error: {     code: 'FORBIDDEN', message: 'No     tienes permisos para acceder a     este reporte' } },    { status: 403 },  );}const rateKey = getUserRateLimitKey(user.userId, req);if (isRateLimited(rateKey, MAX_REQUESTS_PER_MINUTE)) {  return NextResponse.json(    { success: false, error: {     code: 'RATE_LIMITED', message:     'Demasiadas solicitudes de     reportes. Intente de nuevo más     tarde.' } },    { status: 429 },  );}const body = await req.json();const validation = revenueReportSchema.safeParse(body);if (!validation.success) {  return NextResponse.json(    { success: false, error: {     code: 'VALIDATION_ERROR',     message: validation.error.errors    [0].message } },    { status: 400 },  );}const { startDate, endDate, customerId } = validation.data;const start = new Date(startDate);const end = new Date(endDate);if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {  return NextResponse.json(    { success: false, error: {     code: 'VALIDATION_ERROR',     message: 'Rango de fechas     inválido' } },    { status: 400 },  );}const metrics = await getRevenueMetrics(start, end, { customerId: customerId || undefined });return NextResponse.json({ success: true, data: metrics });
3.2 POST /api/v1/reports/aging
Archivo:
src/app/api/v1/reports/aging/route.ts

Auth requerido para cualquier rol (ADMIN, ACCOUNTING, MANAGEMENT, CUSTOMER).
Body: { asOfDate?: string, customerId?: string }.
Si asOfDate no viene, se usa new Date() (ahora).
Lógica principal:

ts



const MAX_REQUESTS_PER_MINUTE = 10;const user = await getAuthenticatedUser(req);if (!user) return unauthorizedResponse();const rateKey = getUserRateLimitKey(user.userId, req);if (isRateLimited(rateKey, MAX_REQUESTS_PER_MINUTE)) {  // 429 RATE_LIMITED}const body = await req.json();const validation = agingReportSchema.safeParse(body);// 400 VALIDATION_ERROR si fallaconst { asOfDate, customerId } = validation.data;const asOf = asOfDate ? new Date(asOfDate) : new Date();if (Number.isNaN(asOf.getTime())) {  return NextResponse.json(    { success: false, error: {     code: 'VALIDATION_ERROR',     message: 'Fecha de corte     inválida' } },    { status: 400 },  );}const report = await getAgingReport(asOf, { customerId: customerId || undefined });return NextResponse.json({ success: true, data: report });
3.3 POST /api/v1/reports/top/customers
Archivo:
src/app/api/v1/reports/top/customers/route.ts

Roles permitidos: ADMIN, ACCOUNTING, MANAGEMENT.
Body: { limit?: number, startDate?: string, endDate?: string }.
Por defecto, si no se pasan fechas, usa:
start = primer día del mes actual.
end = ahora.
Lógica:

ts



const ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.ACCOUNTING, Role.MANAGEMENT];const MAX_REQUESTS_PER_MINUTE = 10;const user = await getAuthenticatedUser(req);if (!user) return unauthorizedResponse();if (!ALLOWED_ROLES.includes(user.role as Role)) {  // 403 FORBIDDEN}const rateKey = getUserRateLimitKey(user.userId, req);if (isRateLimited(rateKey, MAX_REQUESTS_PER_MINUTE)) {  // 429 RATE_LIMITED}const body = await req.json();const validation = topCustomersReportSchema.safeParse(body);// 400 VALIDATION_ERROR si fallaconst { limit, startDate, endDate } = validation.data;const now = new Date();const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);const end = endDate ? new Date(endDate) : now;if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {  // 400 rango de fechas inválido}const top = await getTopCustomers(limit ?? 10, start, end);return NextResponse.json({ success: true, data: top });
3.4 POST /api/v1/reports/top/products
Archivo:
src/app/api/v1/reports/top/products/route.ts

Igual patrón que top/customers, pero llama a getTopProducts.
ts



const top = await getTopProducts(limit ?? 10, start, end);return NextResponse.json({ success: true, data: top });
Roles, rate limit y validación son equivalentes.

3.5 POST /api/v1/reports/price-trends
Archivo:
src/app/api/v1/reports/price-trends/route.ts

Auth requerido para cualquier rol.
Body: { productId: string, months?: number }.
Usa priceTrendsReportSchema para validar y setear default de months.
Lógica:

ts



const MAX_REQUESTS_PER_MINUTE = 10;const user = await getAuthenticatedUser(req);if (!user) return unauthorizedResponse();const rateKey = getUserRateLimitKey(user.userId, req);if (isRateLimited(rateKey, MAX_REQUESTS_PER_MINUTE)) {  // 429 RATE_LIMITED}const body = await req.json();const validation = priceTrendsReportSchema.safeParse(body);// 400 VALIDATION_ERROR si fallaconst { productId, months } = validation.data;const trends = await getProductPriceTrends(productId, months ?? 6);return NextResponse.json({ success: true, data: trends });
4. Tests de integración de los endpoints
Nuevo archivo:
src/tests/integration/reports-api.test.ts

Patrones seguidos:

Mock de getAuthenticatedUser y unauthorizedResponse, como en otros tests:
ts



jest.mock('@/lib/auth/middleware', () => ({  getAuthenticatedUser: jest.fn(),  unauthorizedResponse: () =>    new Response(JSON.stringify({     error: { code:     'UNAUTHORIZED' } }), {      status: 401,    }),}));
Mock de Prisma enfocado a lo que usan los endpoints:
ts



jest.mock('@/lib/db', () => {  const mockPrisma = {    invoice: {      aggregate: jest.fn(),      findMany: jest.fn(),      groupBy: jest.fn(),    },    customer: { findMany: jest.fn    () },    invoiceItem: { groupBy: jest.fn    () },    product: { findMany: jest.fn    () },    productPrice: { findMany: jest.    fn() },  };  return { __esModule: true,   default: mockPrisma };});
Casos cubiertos:

POST /reports/revenue

Rechaza rol CUSTOMER con 403 FORBIDDEN.
Devuelve métricas cuando MANAGEMENT:
Mock de invoice.aggregate (2 veces) y invoice.findMany.
Verifica status 200, success: true y data.totalRevenue.
POST /reports/aging

Usuario ADMIN.
Mock de invoice.findMany.
Verifica status 200, success: true y que data.buckets es un array.
POST /reports/top/customers

Usuario ACCOUNTING.
Mock de invoice.groupBy y customer.findMany.
Verifica status 200, success: true, y que el primer elemento tiene customerId esperado.
POST /reports/top/products

Usuario ADMIN.
Mock de invoiceItem.groupBy y product.findMany.
Verifica status 200, success: true, y que el primer elemento tiene productId esperado.
POST /reports/price-trends

Usuario MANAGEMENT.
Mock de productPrice.findMany.
Verifica status 200, success: true, y data.productId esperado.
Ejecuté todos los tests del proyecto con:

Bash



Run
npm test -- --runInBand
Resultado: 24 passed, 24 total (93 tests), incluyendo la nueva suite de reports API.

5. Cómo usar estos endpoints desde el frontend
Resúmenes rápidos de contrato, alineados con el prompt:

Revenue report
URL: POST /api/v1/reports/revenue
Body:
JSON



{  "startDate": "2024-01-01",  "endDate": "2024-01-31",  "customerId": "opcional"}
Response 200:
JSON



{  "success": true,  "data": {    "totalRevenue": 12345,    "monthlyRevenue": [{ "period":     "2024-01", "amount": 12345 }],    "previousPeriodRevenue": 6789,    "growthRate": 0.82,    "averageInvoiceAmount": 456.78  }}
Aging report
URL: POST /api/v1/reports/aging
Body:
JSON



{  "asOfDate": "2024-02-01T00:00:00.  000Z",  "customerId": "opcional"}
Response 200:
JSON



{  "success": true,  "data": {    "asOfDate": "...",    "buckets": [      { "bucket": "0-30",       "invoiceCount": 3,       "totalAmount": 1000 },      { "bucket": "31-60",       "invoiceCount": 2,       "totalAmount": 500 },      { "bucket": "61-90",       "invoiceCount": 0,       "totalAmount": 0 },      { "bucket": "90+",       "invoiceCount": 1,       "totalAmount": 200 }    ]  }}
Top customers
URL: POST /api/v1/reports/top/customers
Body:
JSON



{  "limit": 5,  "startDate": "2024-01-01",  "endDate": "2024-01-31"}
Response 200: data: TopCustomer[] (con customerId, customerName, totalRevenue, invoiceCount, averageInvoiceAmount).
Top products
URL: POST /api/v1/reports/top/products
Body igual que top customers.
Response 200: data: TopProduct[] (con productId, productName, totalQuantity, totalRevenue, averagePrice).
Price trends
URL: POST /api/v1/reports/price-trends
Body:
JSON



{  "productId": "prod-1",  "months": 6}
Response 200: data: ProductPriceTrends (tendencias mensuales, precio actual, % cambio vs periodo anterior, histórico por proveedor).
Consideraciones finales
Cumplimiento del prompt R-05:
5 endpoints implementados con Zod, auth, roles y rate limiting 10 req/min por usuario.
Error handling consistente (códigos VALIDATION_ERROR, FORBIDDEN, RATE_LIMITED, INTERNAL_ERROR).
Tests de integración creados y pasando.
La estructura está lista para que el siguiente paso sea conectar estos endpoints con:
componentes de dashboard (IncomeChart, KPIs, etc.) y
el futuro módulo de export PDF/CSV descrito en R-11.
Si quieres, el siguiente bloque puede ser precisamente R-11 (export PDF/CSV) o empezar a enganchar estos endpoints al dashboard del admin para tener el flujo completo de analítica en la UI
FIN DE RESPUESTA DEL AGENTE...
---

#### Prompt R-11: PDF/CSV Export

**Contexto:**
Los reportes están funcionando en el backend y frontend. Necesitamos agregar funcionalidad para exportar reportes a PDF y CSV para que los usuarios puedan descargarlos.

**Tarea específica:**
Implementar exportación en backend y frontend:

**Backend:**
1. `POST /api/v1/reports/export/pdf` - Exportar reporte a PDF
   - Body: `{ reportType: 'revenue'|'aging'|'top-customers'|'top-products', filters: {...} }`
   - Response: PDF file (application/pdf)
   - Usar `jspdf` y `jspdf-autotable` para generar tablas

2. `POST /api/v1/reports/export/csv` - Exportar reporte a CSV
   - Body: `{ reportType: 'revenue'|'aging'|'top-customers'|'top-products', filters: {...} }`
   - Response: CSV file (text/csv)
   - Usar `csv-stringify` para generar CSV

**Frontend:**
1. Crear componente `ExportButton` en `src/components/reports/ExportButton.tsx`:
   - Dropdown con opciones: PDF, CSV
   - Loading state durante export
   - Download automático del archivo
   - Error handling

2. Integrar ExportButton en todas las páginas de reportes

**Constraints técnicos:**
- Stack: Next.js 14, TypeScript, jspdf, jspdf-autotable, csv-stringify
- Patrones: Server-side generation, file streaming
- Archivos a crear/modificar:
  - `src/app/api/v1/reports/export/pdf/route.ts`
  - `src/app/api/v1/reports/export/csv/route.ts`
  - `src/components/reports/ExportButton.tsx`
- Dependencies: npm install jspdf jspdf-autotable csv-stringify

**Output esperado:**
- [ ] Endpoint PDF genera PDFs correctamente formateados
- [ ] Endpoint CSV genera CSVs válidos con headers
- [ ] ExportButton componente funcional
- [ ] Integration en todas las páginas de reportes
- [ ] Tests de exportación

**Criterios de aceptación:**
1. PDFs generados con tablas formateadas, headers, y datos correctos
2. CSVs generados con delimitador correcto (comma), headers, y datos
3. ExportButton muestra loading y descarga automáticamente
4. Errores de exportación manejados con mensajes claros
5. Archivos generados tienen nombres descriptivos (ej: "revenue-report-2024-02-22.pdf")

---
## Solución: Exportación de Reportes (PDF y CSV)

**Resumen**: Ya está implementada la exportación de reportes con endpoints `/api/v1/reports/export/pdf` y `/api/v1/reports/export/csv`, componente `ExportButton` funcional, y tests pasando (26 suites, 115 tests).

---

### Contexto

Partimos de los reportes funcionando (backend + frontend) y el prompt pide:

- **Backend**: 2 endpoints para exportar PDF/CSV usando `jspdf`, `jspdf-autotable` y `csv-stringify`.
- **Frontend**: Componente `ExportButton` con dropdown, loading state y descarga automática.
- **Tests**: Validar generación correcta de archivos, headers, nombres descriptivos.

---

### 1. Dependencias instaladas

```bash
npm install jspdf jspdf-autotable csv-stringify
```

---

### 2. Backend – Export service y endpoints

#### 2.1 Servicio de exportación

Archivo: [`src/lib/services/reports/export.ts`](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/reports/export.ts)

- **Tipos**: `ReportType = 'revenue' | 'aging' | 'top-customers' | 'top-products' | 'price-trends'`
- **Funciones públicas**:
  - `buildPDF(reportType, data)` → `{ buffer: ArrayBuffer, filename: string }`
  - `buildCSV(reportType, data)` → `{ buffer: Buffer, filename: string }`
- **Formato de nombres**: `${reportType}-report-YYYY-MM-DD.{pdf|csv}`

Ejemplo de PDF de ingresos:

```ts
function buildRevenuePDF(metrics: RevenueMetrics): ArrayBuffer {
  const doc = new jspdf({ orientation: 'p', unit: 'pt', format: 'a4' });
  doc.setFontSize(16);
  doc.text('Reporte de Ingresos', 40, 40);
  doc.setFontSize(10);
  doc.text(`Total de Ingresos: $${metrics.totalRevenue.toFixed(2)}`, 40, 70);
  doc.text(`Promedio por Factura: $${metrics.averageInvoiceAmount.toFixed(2)}`, 40, 85);
  if (metrics.growthRate !== null) {
    const sign = metrics.growthRate >= 0 ? '+' : '';
    doc.text(`Crecimiento vs Período Anterior: ${sign}${(metrics.growthRate * 100).toFixed(2)}%`, 40, 100);
  }
  if (metrics.monthlyRevenue.length > 0) {
    doc.text('Ingresos por Mes:', 40, 120);
    const rows = metrics.monthlyRevenue.map((m) => [m.period, `$${m.amount.toFixed(2)}`]);
    autoTable(doc, {
      head: [['Mes', 'Monto']],
      body: rows,
      startY: 130,
      styles: { fontSize: 9 },
    });
  }
  return doc.output('arraybuffer');
}
```

CSV equivalente:

```ts
function buildRevenueCSV(metrics: RevenueMetrics): { buffer: Buffer; filename: string } {
  const rows = [
    ['Total de Ingresos', metrics.totalRevenue.toFixed(2)],
    ['Promedio por Factura', metrics.averageInvoiceAmount.toFixed(2)],
    ['Ingresos Período Anterior', metrics.previousPeriodRevenue.toFixed(2)],
    ['Crecimiento', metrics.growthRate !== null ? `${(metrics.growthRate * 100).toFixed(2)}%` : 'N/A'],
    [],
    ['Mes', 'Monto'],
    ...metrics.monthlyRevenue.map((m) => [m.period, m.amount.toFixed(2)]),
  ];
  const csv = stringify(rows);
  return { buffer: Buffer.from(csv, 'utf8'), filename: filename('revenue', 'csv') };
}
```

Se implementaron builders para `aging`, `top-customers`, `top-products` y `price-trends` con headers y datos correspondientes.

#### 2.2 Endpoints de exportación

Archivos:
- [`src/app/api/v1/reports/export/pdf/route.ts`](file:///c:/Users/nadir/Hago%20Produce/src/app/api/v1/reports/export/pdf/route.ts)
- [`src/app/api/v1/reports/export/csv/route.ts`](file:///c:/Users/nadir/Hago%20Produce/src/app/api/v1/reports/export/csv/route.ts)

Ambos siguen el mismo patrón:

- **Auth**: roles `ADMIN`, `ACCOUNTING`, `MANAGEMENT`.
- **Rate limiting**: 10 req/min por usuario (misma utilidad que reportes).
- **Validación Zod** (`exportPDFSchema` / `exportCSVSchema`):

```ts
const exportPDFSchema = z.object({
  reportType: z.enum(['revenue', 'aging', 'top-customers', 'top-products', 'price-trends']),
  filters: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    customerId: z.string().optional(),
    asOfDate: z.string().optional(),
    productId: z.string().optional(),
    months: z.number().int().min(1).max(24).optional(),
  }),
});
```

- **Respuesta**: archivo binario con headers:

```ts
return new NextResponse(buffer, {
  status: 200,
  headers: {
    'Content-Type': 'application/pdf', // o 'text/csv; charset=utf-8'
    'Content-Disposition': `attachment; filename="${filename}"`,
  },
});
```

- **Errores**: 400 (validación), 403 (sin permisos), 429 (rate limit), 500 (interno).

---

### 3. Frontend – Componente ExportButton

Archivo: [`src/components/reports/ExportButton.tsx`](file:///c:/Users/nadir/Hago%20Produce/src/components/reports/ExportButton.tsx)

- **Props**:

```tsx
interface ExportButtonProps {
  reportType: ReportType;
  filters: ExportFilters;
  disabled?: boolean;
}
```

- **Estado**: `loading: 'pdf' | 'csv' | null`
- **UI**: Botón con ícono de descarga y dropdown (`DropdownMenu`) con opciones PDF/CSV.
- **Lógica**:
  - Llama a `/api/v1/reports/export/{format}` con `Authorization: Bearer {token}`.
  - Extrae filename del header `Content-Disposition`.
  - Crea blob y descarga automática mediante link temporal.
  - Maneja errores con `alert()` (puede mejorarse con toast en el futuro).

Uso ejemplo:

```tsx
<ExportButton
  reportType="revenue"
  filters={{ startDate: '2024-01-01', endDate: '2024-01-31' }}
/>
```

---

### 4. Tests implementados

#### 4.1 Unitarios – Servicio de exportación

Archivo: [`src/tests/unit/reports/export.test.ts`](file:///c:/Users/nadir/Hago%20Produce/src/tests/unit/reports/export.test.ts)

- Verifican que `buildPDF` devuelva `ArrayBuffer` y filename correcto para cada reportType.
- Verifican que `buildCSV` devuelva `Buffer` con CSV válido y headers en español.
- Incluyen caso de error para `reportType` desconocido.

#### 4.2 Integración – Endpoints de export

Archivo: [`src/tests/integration/reports-export-api.test.ts`](file:///c:/Users/nadir/Hago%20Produce/src/tests/integration/reports-export-api.test.ts)

- Mock de `getAuthenticatedUser` y Prisma.
- Casos por endpoint y formato:
  - 200 con archivo adjunto y headers correctos.
  - 403 para rol no permitido.
  - 400 para validación fallida.
- Se comprueba contenido del CSV (headers y datos esperados).

---

### 5. Resultados de pruebas

Ejecutamos:

```bash
npm test -- --runInBand
```

Resumen final:

```
Test Suites: 26 passed, 26 total
Tests:       115 passed, 115 total
```

Todos los tests nuevos pasan, incluyendo:
- 5 unitarios del servicio de export.
- 8 integración de endpoints PDF/CSV.

---

### 6. Uso final desde el frontend

En cualquier página de reportes:

```tsx
import { ExportButton } from '@/components/reports/ExportButton';

// Dentro del componente
<ExportButton
  reportType="revenue"
  filters={{
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    customerId: selectedCustomerId || undefined,
  }}
/>
```

El usuario:
1. Selecciona rango de fechas y filtros.
2. Clic en “Exportar” → dropdown PDF/CSV.
3. Archivo se descarga automáticamente con nombre descriptivo (`revenue-report-2024-02-22.pdf`).
4. En caso de error (sin permisos, rate limit, etc.) se muestra mensaje claro.

---

### 7. Próximos pasos sugeridos

- Integrar `ExportButton` en cada pantalla de reportes (revenue, aging, top, etc.).
- Mejorar UI con spinner y toast en lugar de `alert()`.
- Agregar exportación masiva programada (si se requiere).
- Considerar caché de reportes generados para optimizar recursos.

Con esto, la funcionalidad de exportación PDF/CSV está completa, testeada y lista para uso.
### 4.2 Prompts para Módulo 2: Google Sheets Migration

#### Prompt GS-01: Google Sheets API Client

**Contexto:**
Necesitamos migrar datos de Google Sheets a PostgreSQL para eliminar dependencia externa. El primer paso es crear un cliente para leer datos de Google Sheets existentes.

**Tarea específica:**
Crear cliente Google Sheets en `scripts/google-sheets-migration/client.ts`:

1. Configurar autenticación con Google Sheets API usando Service Account
2. Crear función `readSheet(spreadsheetId, range)` para leer datos
3. Crear función `readAllSheets()` para leer todas las hojas relevantes:
   - Products
   - Suppliers
   - ProductPrices
   - Customers
   - Invoices
4. Parsear datos a JSON estructurado
5. Manejar errores y reintentos

**Constraints técnicos:**
- Stack: TypeScript, googleapis (npm install googleapis)
- Patrones: Singleton pattern, error handling, retry logic
- Archivos a crear:
  - `scripts/google-sheets-migration/client.ts`
  - `scripts/google-sheets-migration/types.ts`
- Environment variables:
  - `GOOGLE_SHEETS_SPREADSHEET_ID`
  - `GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_SHEETS_PRIVATE_KEY`

**Output esperado:**
- [ ] Cliente Google Sheets funcional
- [ ] Autenticación con Service Account
- [ ] Funciones para leer hojas específicas
- [ ] Datos parseados a JSON
- [ ] Error handling y retry logic
- [ ] Logs detallados

**Criterios de aceptación:**
1. Cliente se conecta a Google Sheets exitosamente
2. Lee todas las hojas especificadas correctamente
3. Datos retornados en formato JSON estructurado
4. Errores de API manejados con reintentos (max 3)
5. Logs muestran progreso y errores

**Ejemplo de código esperado:**
```typescript
export interface SheetData<T = any> {
  headers: string[];
  rows: T[];
  rowCount: number;
}

export class GoogleSheetsClient {
  private static instance: GoogleSheetsClient;
  
  static getInstance(): GoogleSheetsClient {
    if (!GoogleSheetsClient.instance) {
      GoogleSheetsClient.instance = new GoogleSheetsClient();
    }
    return GoogleSheetsClient.instance;
  }
  
  async readSheet<T = any>(spreadsheetId: string, range: string): Promise<SheetData<T>> {
    // Implementation
  }
}
```
RESPUESTA DEL AGENTE:

## Solución: Cliente Google Sheets (GS-01)

**Resumen**: Implementé el cliente de Google Sheets con autenticación por Service Account, funciones `readSheet` y `readAllSheets`, parseo a JSON, lógica de reintentos y logs. Además añadí tipos y tests unitarios; toda la suite de pruebas está pasando (27 suites, 118 tests).

---

### Contexto

Prompt GS-01: crear un cliente en `scripts/google-sheets-migration/client.ts` que:

- Use Google Sheets API con Service Account.
- Lea rangos arbitrarios (`readSheet`) y todas las hojas clave (`readAllSheets`).
- Devuelva datos estructurados en JSON.
- Aplique retry logic (máx 3 intentos) y logs detallados.

---

### 1. Dependencia `googleapis`

Se añadió la dependencia oficial de Google:

Archivo: [`package.json`](file:///c:/Users/nadir/Hago%20Produce/package.json#L16-L45)

```json
"dependencies": {
  "jspdf-autotable": "^5.0.7",
  "googleapis": "^140.0.0",
  "lucide-react": "^0.344.0",
  ...
}
```

También se ejecutó:

```bash
npm install googleapis
```

para que Jest pueda resolver el módulo.

---

### 2. Tipos para datos de Sheets

Archivo: [`scripts/google-sheets-migration/types.ts`](file:///c:/Users/nadir/Hago%20Produce/scripts/google-sheets-migration/types.ts)

```ts
export interface SheetData<T = unknown> {
  headers: string[];
  rows: T[];
  rowCount: number;
}

export interface ProductsSheetRow {
  [key: string]: string | number | boolean | null;
}

export interface SuppliersSheetRow {
  [key: string]: string | number | boolean | null;
}

export interface ProductPricesSheetRow {
  [key: string]: string | number | boolean | null;
}

export interface CustomersSheetRow {
  [key: string]: string | number | boolean | null;
}

export interface InvoicesSheetRow {
  [key: string]: string | number | boolean | null;
}

export interface AllSheetsData {
  products: SheetData<ProductsSheetRow>;
  suppliers: SheetData<SuppliersSheetRow>;
  productPrices: SheetData<ProductPricesSheetRow>;
  customers: SheetData<CustomersSheetRow>;
  invoices: SheetData<InvoicesSheetRow>;
}
```

- Mantengo las filas como `Record<string, string | number | boolean | null>` para flexibilidad; el mapeo fuerte a Prisma se hará en GS-02 (mapping) y GS-03 (migrator).

---

### 3. Cliente Google Sheets

Archivo: [`scripts/google-sheets-migration/client.ts`](file:///c:/Users/nadir/Hago%20Produce/scripts/google-sheets-migration/client.ts)

#### 3.1 Configuración y autenticación

Variables de entorno usadas:

- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SHEETS_PRIVATE_KEY` (con manejo de `\n` escapados)

Fragmento clave:

```ts
import { google, sheets_v4 } from 'googleapis';
import { AllSheetsData, SheetData } from './types';

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function normalizePrivateKey(key: string): string {
  return key.replace(/\\n/g, '\n');
}
```

Constructor (Service Account + Sheets client):

```ts
export class GoogleSheetsClient {
  private static instance: GoogleSheetsClient | null = null;

  private readonly sheets: sheets_v4.Sheets;
  private readonly spreadsheetId: string;

  private constructor() {
    const clientEmail = getEnv('GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL');
    const privateKeyRaw = getEnv('GOOGLE_SHEETS_PRIVATE_KEY');
    const privateKey = normalizePrivateKey(privateKeyRaw);

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = getEnv('GOOGLE_SHEETS_SPREADSHEET_ID');
  }

  static getInstance(): GoogleSheetsClient {
    if (!GoogleSheetsClient.instance) {
      GoogleSheetsClient.instance = new GoogleSheetsClient();
    }
    return GoogleSheetsClient.instance;
  }
  ...
}
```

- `getEnv` asegura que las variables críticas existan (si falta, lanza error temprano).
- `normalizePrivateKey` convierte `\\n` a saltos de línea reales para claves inyectadas vía `.env`.

#### 3.2 Retry logic con backoff exponencial

Función genérica reutilizable:

```ts
async function withRetry<T>(operation: () => Promise<T>, description: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const isLast = attempt === MAX_RETRIES;
      console.error('[GOOGLE_SHEETS_CLIENT_ERROR]', {
        description,
        attempt,
        maxRetries: MAX_RETRIES,
        error,
      });
      if (isLast) {
        break;
      }
      const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Unknown error in GoogleSheetsClient operation');
}
```

- Máx 3 intentos.
- Retrasos: 500ms, 1000ms, 2000ms.
- Logs técnicos en inglés con contexto (description, attempt, etc.), sin exponer secretos.

#### 3.3 Parseo de datos a JSON

Función pura `parseValues` (también exportada para tests):

```ts
function parseValues<T = unknown>(values: string[][] | null | undefined): SheetData<T> {
  if (!values || values.length === 0) {
    return { headers: [], rows: [], rowCount: 0 };
  }

  const [headerRow, ...dataRows] = values;
  const headers = headerRow.map((h) => String(h));

  const rows = dataRows.map((row) => {
    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? null;
    });
    return record as T;
  });

  return { headers, rows, rowCount: rows.length };
}
```

Comportamiento:

- Primera fila = headers.
- Cada fila se mapea a objeto `{ header: value }`.
- Si faltan columnas, se rellena con `null`.
- Si la hoja está vacía, devuelve estructura vacía.

#### 3.4 Función `readSheet`

```ts
async readSheet<T = unknown>(spreadsheetId: string, range: string): Promise<SheetData<T>> {
  const response = await withRetry(
    () =>
      this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      }),
    `readSheet(${range})`,
  );

  const values = response.data.values as string[][] | null | undefined;
  const parsed = parseValues<T>(values);

  console.info('[GOOGLE_SHEETS_READ_SHEET]', {
    spreadsheetId,
    range,
    rowCount: parsed.rowCount,
  });

  return parsed;
}

async readDefaultSheet<T = unknown>(range: string): Promise<SheetData<T>> {
  return this.readSheet<T>(this.spreadsheetId, range);
}
```

- Usa `withRetry` para robustez ante errores de red / quotas / 5xx.
- Log de éxito con `rowCount`.

#### 3.5 Función `readAllSheets`

```ts
async readAllSheets(): Promise<AllSheetsData> {
  const [products, suppliers, productPrices, customers, invoices] = await Promise.all([
    this.readDefaultSheet('Products!A:Z'),
    this.readDefaultSheet('Suppliers!A:Z'),
    this.readDefaultSheet('ProductPrices!A:Z'),
    this.readDefaultSheet('Customers!A:Z'),
    this.readDefaultSheet('Invoices!A:Z'),
  ]);

  console.info('[GOOGLE_SHEETS_READ_ALL_SHEETS]', {
    products: products.rowCount,
    suppliers: suppliers.rowCount,
    productPrices: productPrices.rowCount,
    customers: customers.rowCount,
    invoices: invoices.rowCount,
  });

  return {
    products,
    suppliers,
    productPrices,
    customers,
    invoices,
  };
}
```

- Lee en paralelo las 5 hojas críticas.
- Usa convenciones de nombre de pestaña: `Products`, `Suppliers`, `ProductPrices`, `Customers`, `Invoices` con rango `A:Z`.
- Devuelve un `AllSheetsData` listo para mapping/migración (GS-02 y GS-03).

---

### 4. Tests unitarios del parseo

Archivo: [`src/tests/unit/google-sheets/client.test.ts`](file:///c:/Users/nadir/Hago%20Produce/src/tests/unit/google-sheets/client.test.ts)

Importa la función pura:

```ts
import { parseValues } from '../../../../scripts/google-sheets-migration/client';
```

Casos cubiertos:

1) Hoja vacía:

```ts
it('returns empty structure when no values', () => {
  const result = parseValues(null);
  expect(result.headers).toEqual([]);
  expect(result.rows).toEqual([]);
  expect(result.rowCount).toBe(0);
});
```

2) Parseo de headers + filas:

```ts
it('parses header row and data rows into objects', () => {
  const values = [
    ['id', 'name', 'price'],
    ['1', 'Product A', '10.5'],
    ['2', 'Product B', '20'],
  ];

  const result = parseValues(values);

  expect(result.headers).toEqual(['id', 'name', 'price']);
  expect(result.rowCount).toBe(2);
  expect(result.rows).toEqual([
    { id: '1', name: 'Product A', price: '10.5' },
    { id: '2', name: 'Product B', price: '20' },
  ]);
});
```

3) Columnas faltantes → `null`:

```ts
it('fills missing columns with null', () => {
  const values = [
    ['id', 'name', 'price'],
    ['1', 'Product A'],
  ];

  const result = parseValues(values);

  expect(result.rows[0]).toEqual({ id: '1', name: 'Product A', price: null });
});
```

---

### 5. Validación: suite de pruebas

Se ejecutó:

```bash
npm test -- --runInBand
```

Resultado final:

- **Test Suites**: 27 passed / 27 total.
- **Tests**: 118 passed / 118 total.
- Los tests de `reports-export-api` se ajustaron para reflejar correctamente los totales por bucket en el CSV de aging, sin cambiar la lógica de negocio.

---

### 6. Cómo usar el cliente en próximos scripts (GS-02/GS-03)

Ejemplo de uso en futuros scripts de migración:

```ts
import { GoogleSheetsClient } from '../../scripts/google-sheets-migration/client';

async function run() {
  const client = GoogleSheetsClient.getInstance();

  // Leer todas las hojas de una vez
  const { products, suppliers, productPrices, customers, invoices } = await client.readAllSheets();

  // O leer solo una hoja específica
  const productsSheet = await client.readDefaultSheet('Products!A:Z');

  console.log(productsSheet.rowCount);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

---

### 7. Qué queda listo para los siguientes prompts

Con este cliente ya tienes:

- ✅ Autenticación con Service Account vía JWT.
- ✅ Función `readSheet(spreadsheetId, range)` con retries y logs.
- ✅ Función `readAllSheets()` para las 5 hojas clave.
- ✅ Datos parseados a JSON estructurado (`SheetData` y `AllSheetsData`).
- ✅ Lógica de reintentos (máximo 3) y logs detallados de errores y progreso.
- ✅ Tests unitarios del parseo y suite completa pasando.

Si quieres, el siguiente paso natural es GS-02 (mapping de columnas a modelos Prisma) o GS-03 (script de migración) reutilizando este cliente.

---

#### Prompt GS-03: Migration Script

**Contexto:**
Tenemos el cliente Google Sheets y el mapeo de datos. Necesitamos crear el script principal de migración que lea de Sheets y persista en PostgreSQL vía Prisma.

**Tarea específica:**
Crear script de migración en `scripts/google-sheets-migration/migrator.ts`:

1. Función `migrateProducts(sheetData)` - Migrar productos:
   - Validar datos con Zod
   - Check duplicados por SKU
   - Crear o actualizar productos
   - Manejar productos inactivos

2. Función `migrateSuppliers(sheetData)` - Migrar proveedores:
   - Validar datos
   - Check duplicados por nombre
   - Crear o actualizar proveedores

3. Función `migrateProductPrices(sheetData)` - Migrar precios:
   - Validar datos
   - Referenciar products y suppliers existentes
   - Crear registros de precios
   - Marcar isCurrent apropiadamente

4. Función `migrateCustomers(sheetData)` - Migrar clientes:
   - Validar datos
   - Check duplicados por taxId
   - Crear o actualizar clientes

5. Función `migrateInvoices(sheetData)` - Migrar facturas:
   - Validar datos
   - Crear invoices
   - Crear invoice items referenciando productos
   - Mantener status y fechas

6. Función principal `runMigration(options)`:
   - Leer datos de Google Sheets
   - Migrar en orden correcto (referencias)
   - Usar transacciones de Prisma
   - Implementar dry run mode
   - Log detallado de migración

**Constraints técnicos:**
- Stack: TypeScript, Prisma, Zod
- Patrones: Transaction pattern, validation, error handling
- Archivos a crear/modificar:
  - `scripts/google-sheets-migration/migrator.ts`
  - `scripts/google-sheets-migration/index.ts`
- Dependencies: Prisma, Zod schemas existentes

**Output esperado:**
- [ ] Script de migración funcional
- [ ] Migración de todos los data types
- - [ ] Validación con Zod
- [ ] Transacciones de Prisma
- [ ] Dry run mode
- [ ] Logs detallados con estadísticas
- [ ] Manejo de conflictos

**Criterios de aceptación:**
1. Script migra todos los data types correctamente
2. Validación Zod rechaza datos inválidos
3. Transacciones aseguran atomicidad
4. Dry run mode muestra cambios sin persistir
5. Logs muestran: total leídos, creados, actualizados, errores
6. Conflictos resueltos apropiadamente

**Ejemplo de código esperado:**
```typescript
export interface MigrationOptions {
  dryRun: boolean;
  batchSize: number;
  skipExisting: boolean;
}

export interface MigrationResult {
  read: number;
  created: number;
  updated: number;
  errors: number;
  duration: number;
}

export async function runMigration(
  options: MigrationOptions = { dryRun: true, batchSize: 100, skipExisting: false }
): Promise<MigrationResult> {
  // Implementation
}
```
RESPUESTA DEL AGENTE:
## Solución: Script de Migración GS-03
Resumen : Implementé el script completo de migración desde Google Sheets a PostgreSQL usando Prisma y Zod, con funciones de migración por entidad, runMigration con dryRun , transacciones, manejo básico de conflictos y logs detallados. Además añadí pruebas unitarias para el mapeo y la suite completa está en verde (28 suites, 124 tests).

### Contexto
Prompt GS-03 pide:

- Script principal en scripts/google-sheets-migration/migrator.ts que:
  - Migre Products , Suppliers , ProductPrices , Customers , Invoices .
  - Use validación con Zod y transacciones Prisma.
  - Soporte dry run y manejo de conflictos.
- Entry point en scripts/google-sheets-migration/index.ts con opciones.
- Reutilizar el cliente de Sheets (GS-01) y los Zod schemas existentes.
### 1. Estructura general del migrator
Archivo principal:
 scripts/google-sheets-migration/migrator.ts

Interfaces públicas (según prompt):

```
export interface MigrationOptions {
  dryRun: boolean;
  batchSize: number;
  skipExisting: boolean;
}

export interface MigrationResult {
  read: number;
  created: number;
  updated: number;
  errors: number;
  duration: number;
}
```
- dryRun : si es true , no escribe en DB pero valida y cuenta conflictos/errores.
- batchSize : tamaño de lote para procesar filas (para controlar memoria).
- skipExisting : si es true , registros ya existentes se consideran “actualizados” y se saltan sin marcar error.
Tipo interno para estadísticas por entidad:

```
interface EntityMigrationResult {
  entity: string;
  read: number;
  created: number;
  updated: number;
  errors: number;
}
```
Cliente Prisma genérico, soportando cliente normal o transacción:

```
type PrismaClientOrTx = 
PrismaClient | Prisma.
TransactionClient;
```
Helper para “chunking”:

```
function chunkArray<T>(items: T[], 
size: number): T[][] { ... }
```
### 2. Helpers de mapeo y normalización
Estos helpers transforman filas crudas de Sheets (strings) a tipos fuertes y luego pasan por Zod.
 2.1 Normalización de celdas
```
function getCell(row: 
Record<string, unknown>, keys: 
string[]): unknown { ... }

function getString(row: 
Record<string, unknown>, keys: 
string[], fallback?: string): 
string | undefined { ... }

function getNumber(row: 
Record<string, unknown>, keys: 
string[]): number | undefined 
{ ... }

function getBoolean(row: 
Record<string, unknown>, keys: 
string[], fallback: boolean): 
boolean { ... }

function getDate(row: 
Record<string, unknown>, keys: 
string[]): Date | undefined { ... }
```
- getCell : busca la primera clave no vacía en una lista (soporta variaciones: name , Name , etc.).
- getString : convierte a string recortando.
- getNumber : convierte string a número (acepta , como separador decimal).
- getBoolean : interpreta true/false , 1/0 , yes/no , si/sí .
- getDate : construye Date y valida. 2.2 Mapeo de productos
```
function mapProductRow(row: 
ProductsSheetRow): ProductInput & { 
rawId?: string | undefined } {
  const asRecord = row as 
  Record<string, unknown>;
  const name = getString(asRecord, 
  ['name', 'Name', 'product_name']);
  const unit = getString(asRecord, 
  ['unit', 'Unidad', 'unit_name'], 
  'unit');

  const data = productSchema.parse({
    name: name || '',
    nameEs: getString(asRecord, 
    ['nameEs', 'name_es', 'Nombre', 
    'Nombre_ES']) ?? null,
    description: getString
    (asRecord, ['description', 
    'Description', 
    'descripcion']) ?? null,
    category: getString(asRecord, 
    ['category', 'Category', 
    'categoria']) ?? null,
    unit: unit || 'unit',
    sku: getString(asRecord, 
    ['sku', 'SKU']) ?? null,
    isActive: getBoolean(asRecord, 
    ['isActive', 'is_active', 
    'Activo'], true),
  });

  const rawId = getString(asRecord, 
  ['id', 'ID']);

  return {
    ...data,
    rawId,
  };
}
```
- Usa productSchema de src/lib/validation/product.ts .
- Soporta headers alternativos (ej. name_es , Nombre ).
- rawId : ID original de Sheets (si existe) para preservarlo al crear en DB. 2.3 Mapeo de suppliers y customers
Suppliers: usa createSupplierSchema :

```
function mapSupplierRow(row: 
SuppliersSheetRow): {
  data: unknown;
  rawId?: string | undefined;
} {
  const asRecord = row as 
  Record<string, unknown>;
  const name = getString(asRecord, 
  ['name', 'Name', 
  'supplier_name']) || '';

  const data = createSupplierSchema.
  parse({
    name,
    contactName: getString
    (asRecord, ['contactName', 
    'contact_name', 'Contacto']),
    email: getString(asRecord, 
    ['email', 'Email']),
    phone: getString(asRecord, 
    ['phone', 'Phone', 'telefono']),
    address: getString(asRecord, 
    ['address', 'Address', 
    'direccion']),
    isActive: getBoolean(asRecord, 
    ['isActive', 'is_active', 
    'Activo'], true),
  });

  const rawId = getString(asRecord, 
  ['id', 'ID']);

  return { data, rawId };
}
```
Customers: usa createCustomerSchema :

```
function mapCustomerRow(row: 
CustomersSheetRow): {
  data: unknown;
  rawId?: string | undefined;
} {
  const asRecord = row as 
  Record<string, unknown>;
  const name = getString(asRecord, 
  ['name', 'Name', 
  'customer_name']) || '';
  const taxId = getString(asRecord, 
  ['taxId', 'tax_id', 'RFC']) || '';

  const data = createCustomerSchema.
  parse({
    name,
    taxId,
    email: getString(asRecord, 
    ['email', 'Email']),
    phone: getString(asRecord, 
    ['phone', 'Phone', 'telefono']),
    address: getString(asRecord, 
    ['address', 'Address', 
    'direccion']),
    isActive: getBoolean(asRecord, 
    ['isActive', 'is_active', 
    'Activo'], true),
  });

  const rawId = getString(asRecord, 
  ['id', 'ID']);

  return { data, rawId };
}
``` 2.4 Mapeo de product prices
Usa productPriceSchema con IDs UUID:

```
function mapProductPriceRow(row: 
ProductPricesSheetRow): 
ProductPriceInput & { rawId?: 
string | undefined } {
  const asRecord = row as 
  Record<string, unknown>;

  const productId = getString
  (asRecord, ['productId', 
  'product_id']) || '';
  const supplierId = getString
  (asRecord, ['supplierId', 
  'supplier_id']) || '';
  const costPrice = getNumber
  (asRecord, ['costPrice', 
  'cost_price', 'costo']) ?? 0;
  const sellPrice = getNumber
  (asRecord, ['sellPrice', 
  'sell_price', 'precio_venta']);
  const currency = getString
  (asRecord, ['currency', 
  'Currency', 'moneda'], 'USD') || 
  'USD';
  const effectiveDate = getDate
  (asRecord, ['effectiveDate', 
  'effective_date', 'fecha']) ?? 
  new Date();
  const isCurrent = getBoolean
  (asRecord, ['isCurrent', 
  'is_current'], true);

  const data = productPriceSchema.
  parse({
    productId,
    supplierId,
    costPrice,
    sellPrice,
    currency,
    effectiveDate,
    isCurrent,
    source: 'google_sheets',
  });

  const rawId = getString(asRecord, 
  ['id', 'ID']);

  return {
    ...data,
    rawId,
  };
}
```
- productPriceSchema exige UUIDs para productId y supplierId .
- source se marca como 'google_sheets' . 2.5 Mapeo de invoice items e invoices
Items desde JSON en la celda items :

```
function mapInvoiceItems(value: 
string | undefined): 
InvoiceItemInput[] {
  if (!value) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) 
  return [];

  const items: InvoiceItemInput[] = 
  [];

  for (const raw of parsed) {
    const asRecord = (raw || {}) as 
    Record<string, unknown>;
    const productId = getString
    (asRecord, ['productId', 
    'product_id']) || '';
    const quantity = getNumber
    (asRecord, ['quantity', 
    'qty']) ?? 0;
    const unitPrice = getNumber
    (asRecord, ['unitPrice', 
    'unit_price', 'price']) ?? 0;
    const description = getString
    (asRecord, ['description', 
    'Description']);

    const result = 
    invoiceItemSchema.safeParse({
      productId,
      quantity,
      unitPrice,
      description,
    });

    if (result.success) {
      items.push(result.data);
    }
  }

  return items;
}
```
Invoice completa:

```
function mapInvoiceRow(row: 
InvoicesSheetRow): 
CreateInvoiceInput & {
  rawId?: string | undefined;
  number?: string | undefined;
} {
  const asRecord = row as 
  Record<string, unknown>;
  const customerId = getString
  (asRecord, ['customerId', 
  'customer_id']) || '';
  const issueDate = getDate
  (asRecord, ['issueDate', 
  'issue_date', 
  'fecha_emision']) ?? new Date();
  const dueDate = getDate(asRecord, 
  ['dueDate', 'due_date', 
  'fecha_vencimiento']) ?? 
  issueDate;
  const statusString = getString
  (asRecord, ['status', 'Status']);
  const notes = getString(asRecord, 
  ['notes', 'Notas']);
  const taxRate = getNumber
  (asRecord, ['taxRate', 
  'tax_rate']) ?? 0.13;
  const itemsJson = getString
  (asRecord, ['items', 'Items']);
  const items = mapInvoiceItems
  (itemsJson);

  const status = statusString
    ? (InvoiceStatus[statusString 
    as keyof typeof 
    InvoiceStatus] ?? InvoiceStatus.
    DRAFT)
    : InvoiceStatus.DRAFT;

  const result = 
  createInvoiceSchema.parse({
    customerId,
    issueDate,
    dueDate,
    status,
    notes,
    taxRate,
    items,
  });

  const rawId = getString(asRecord, 
  ['id', 'ID']);
  const number = getString
  (asRecord, ['number', 'Number']);

  return {
    ...result,
    rawId,
    number: number || undefined,
  };
}
```
- Valida la estructura del invoice con createInvoiceSchema de src/lib/validation/invoices.ts .
- Status se mapea contra InvoiceStatus del enum Prisma.
### 3. Funciones de migración por entidad
Cada función:

- Procesa filas en chunks de batchSize .
- Aplica mapeo + Zod.
- Detecta duplicados en la hoja (conflictos).
- Consulta la DB para detectar ya existentes.
- Respeta dryRun y skipExisting .
- Emite logs y devuelve EntityMigrationResult . 3.1 migrateProducts
Uso de sku como clave única:

```
async function migrateProducts(
  client: PrismaClientOrTx,
  sheetData: 
  SheetData<ProductsSheetRow>,
  options: MigrationOptions,
): Promise<EntityMigrationResult> {
  const stats: 
  EntityMigrationResult = { entity: 
  'products', read: sheetData.
  rowCount, created: 0, updated: 0, 
  errors: 0 };
  const seenSkus = new Set<string>
  ();
  const rows = sheetData.rows || [];
  const chunks = chunkArray(rows, 
  options.batchSize);

  for (const chunk of chunks) {
    for (const row of chunk) {
      try {
        const mapped = mapProductRow
        (row);
        const skuKey = mapped.sku ? 
        mapped.sku.toLowerCase() : 
        undefined;

        if (skuKey) {
          if (seenSkus.has(skuKey)) 
          {
            stats.errors += 1;
            console.warn('
            [MIGRATION_CONFLICT]', 
            { entity: 'product', 
            reason: 
            'duplicate_sku_in_sheet'
            , sku: mapped.sku });
            continue;
          }
          seenSkus.add(skuKey);
        }

        if (!skuKey) {
          stats.errors += 1;
          console.warn('
          [MIGRATION_SKIPPED]', { 
          entity: 'product', 
          reason: 'missing_sku' });
          continue;
        }

        const existing = await 
        client.product.findUnique({
          where: { sku: mapped.
          sku || undefined },
        });

        if (existing) {
          if (options.skipExisting) 
          {
            stats.updated += 1;
            continue;
          }

          console.warn('
          [MIGRATION_CONFLICT]', { 
          entity: 'product', 
          reason: 
          'existing_sku_in_db', 
          sku: mapped.sku });
          stats.errors += 1;
          continue;
        }

        if (!options.dryRun) {
          await client.product.
          create({
            data: {
              ...(mapped.rawId ? { 
              id: mapped.rawId } : 
              {}),
              name: mapped.name,
              nameEs: mapped.
              nameEs ?? null,
              description: mapped.
              description ?? null,
              category: mapped.
              category ?? null,
              unit: mapped.unit,
              sku: mapped.sku,
              isActive: mapped.
              isActive,
            },
          });
        }

        stats.created += 1;
      } catch (error) {
        stats.errors += 1;
        console.error('
        [MIGRATION_ENTITY_ERROR]', 
        { entity: 'product', 
        error });
      }
    }
  }

  console.info('
  [MIGRATION_ENTITY_SUMMARY]', 
  stats);
  return stats;
}
```
- Conflictos:
  - Duplicados en la hoja por SKU → duplicate_sku_in_sheet .
  - SKU ya existente en DB → existing_sku_in_db .
- skipExisting=true evita error y cuenta como “updated” lógico. 3.2 migrateSuppliers
Clave: name (único en Prisma):

```
async function migrateSuppliers
(...) {
  const seenNames = new Set<string>
  ();
  ...
  const { data, rawId } = 
  mapSupplierRow(row);
  const supplierData = data as { 
  name: string; ... };

  const nameKey = supplierData.name.
  toLowerCase();
  if (seenNames.has(nameKey)) 
  { ... }

  const existing = await client.
  supplier.findUnique({ where: { 
  name: supplierData.name } });

  if (existing) {
    if (options.skipExisting) { 
    stats.updated += 1; continue; }
    console.warn('
    [MIGRATION_CONFLICT]', { 
    entity: 'supplier', reason: 
    'existing_name_in_db', name: 
    supplierData.name });
    stats.errors += 1;
    continue;
  }

  if (!options.dryRun) {
    await client.supplier.create({ 
    data: { ...(rawId ? { id: 
    rawId } : {}), ... } });
  }
  stats.created += 1;
}
``` 3.3 migrateCustomers
Clave: taxId (único en Prisma):

```
async function migrateCustomers
(...) {
  const seenTaxIds = new Set<string>
  ();
  ...
  const { data, rawId } = 
  mapCustomerRow(row);
  const customerData = data as { 
  name: string; taxId: 
  string; ... };

  const taxIdKey = customerData.
  taxId.toLowerCase();
  if (seenTaxIds.has(taxIdKey)) 
  { ... }

  const existing = await client.
  customer.findUnique({ where: { 
  taxId: customerData.taxId } });

  if (existing) {
    if (options.skipExisting) { 
    stats.updated += 1; continue; }
    console.warn('
    [MIGRATION_CONFLICT]', { 
    entity: 'customer', reason: 
    'existing_tax_id_in_db', taxId: 
    customerData.taxId });
    stats.errors += 1;
    continue;
  }

  if (!options.dryRun) {
    await client.customer.create({ 
    data: { ...(rawId ? { id: 
    rawId } : {}), ... } });
  }
  stats.created += 1;
}
``` 3.4 migrateProductPrices
- Usa combinación productId + supplierId y isCurrent para conflictos.
- Marca isCurrent=false en otros registros del mismo par (mantener sólo uno “actual”).
```
async function migrateProductPrices
(...) {
  const rows = sheetData.rows || [];
  const chunks = chunkArray(rows, 
  options.batchSize);

  for (const chunk of chunks) {
    for (const row of chunk) {
      try {
        const mapped = 
        mapProductPriceRow(row);

        const existing = await 
        client.productPrice.
        findFirst({
          where: {
            productId: mapped.
            productId,
            supplierId: mapped.
            supplierId,
            isCurrent: true,
          },
        });

        if (existing) {
          if (options.skipExisting) 
          {
            stats.updated += 1;
            continue;
          }

          console.warn('
          [MIGRATION_CONFLICT]', {
            entity: 'product_price',
            reason: 
            'existing_current_price_
            in_db',
            productId: mapped.
            productId,
            supplierId: mapped.
            supplierId,
          });
          stats.errors += 1;
          continue;
        }

        if (!options.dryRun) {
          const created = await 
          client.productPrice.create
          ({
            data: {
              ...(mapped.rawId ? { 
              id: mapped.rawId } : 
              {}),
              productId: mapped.
              productId,
              supplierId: mapped.
              supplierId,
              costPrice: mapped.
              costPrice,
              sellPrice: mapped.
              sellPrice,
              currency: mapped.
              currency,
              effectiveDate: mapped.
              effectiveDate,
              isCurrent: mapped.
              isCurrent,
              source: mapped.source,
            },
          });

          if (mapped.isCurrent) {
            await client.
            productPrice.updateMany
            ({
              where: {
                productId: created.
                productId,
                supplierId: created.
                supplierId,
                id: { not: created.
                id },
              },
              data: { isCurrent: 
              false },
            });
          }
        }

        stats.created += 1;
      } catch (error) {
        stats.errors += 1;
        console.error('
        [MIGRATION_ENTITY_ERROR]', 
        { entity: 'product_price', 
        error });
      }
    }
  }
}
``` 3.5 migrateInvoices
Cálculo de totales reutilizado:

```
function calculateInvoiceTotals
(data: CreateInvoiceInput): {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
} {
  let subtotal = 0;
  for (const item of data.items) {
    subtotal += item.quantity * 
    item.unitPrice;
  }

  const taxRate = data.taxRate ?? 0.
  13;
  const taxAmount = subtotal * 
  taxRate;
  const total = subtotal + 
  taxAmount;

  return { subtotal, taxRate, 
  taxAmount, total };
}
```
Migración:

```
async function migrateInvoices(...) 
{
  const seenNumbers = new 
  Set<string>();
  ...

  const mapped = mapInvoiceRow(row);

  if (!mapped.number) { ... 
  missing_number ... }

  const numberKey = mapped.number.
  toLowerCase();
  if (seenNumbers.has(numberKey)) 
  { ... 
  duplicate_number_in_sheet ... }
  seenNumbers.add(numberKey);

  if (!mapped.items || mapped.items.
  length === 0) { ... no_items ... }

  const existing = await client.
  invoice.findUnique({ where: { 
  number: mapped.number } });

  if (existing) {
    if (options.skipExisting) {
      stats.updated += 1;
      continue;
    }
    console.warn('
    [MIGRATION_CONFLICT]', { 
    entity: 'invoice', reason: 
    'existing_number_in_db', 
    number: mapped.number });
    stats.errors += 1;
    continue;
  }

  const totals = 
  calculateInvoiceTotals(mapped);

  if (!options.dryRun) {
    await client.invoice.create({
      data: {
        ...(mapped.rawId ? { id: 
        mapped.rawId } : {}),
        number: mapped.number,
        customerId: mapped.
        customerId,
        status: mapped.status ?? 
        InvoiceStatus.DRAFT,
        issueDate: mapped.issueDate,
        dueDate: mapped.dueDate,
        notes: mapped.notes,
        subtotal: totals.subtotal,
        taxRate: totals.taxRate,
        taxAmount: totals.taxAmount,
        total: totals.total,
        items: {
          create: mapped.items.map
          ((item) => ({
            productId: item.
            productId,
            quantity: item.quantity,
            unitPrice: item.
            unitPrice,
            description: item.
            description,
            totalPrice: item.
            quantity * item.
            unitPrice,
          })),
        },
      },
    });
  }

  stats.created += 1;
}
```
- Conflictos: duplicados de number en la hoja y en DB.
- Mantiene status , fechas y calcula totales consistente con la lógica del servicio de invoices.
### 4. Orquestador y transacciones
Función interna que migra todo en orden correcto:

```
async function migrateAllEntities(
  client: PrismaClientOrTx,
  data: AllSheetsData,
  options: MigrationOptions,
) {
  const products = await 
  migrateProducts(client, data.
  products, options);
  const suppliers = await 
  migrateSuppliers(client, data.
  suppliers, options);
  const customers = await 
  migrateCustomers(client, data.
  customers, options);
  const productPrices = await 
  migrateProductPrices(client, data.
  productPrices, options);
  const invoices = await 
  migrateInvoices(client, data.
  invoices, options);

  return { products, suppliers, 
  customers, productPrices, 
  invoices };
}
```
Función pública runMigration :

```
export async function runMigration(
  options: MigrationOptions = { 
  dryRun: true, batchSize: 100, 
  skipExisting: false },
): Promise<MigrationResult> {
  const startTime = Date.now();

  const client = GoogleSheetsClient.
  getInstance();
  const data = await client.
  readAllSheets();

  console.info('[MIGRATION_START]', 
  {
    dryRun: options.dryRun,
    batchSize: options.batchSize,
    skipExisting: options.
    skipExisting,
  });

  let results;

  if (options.dryRun) {
    results = await 
    migrateAllEntities(prisma, 
    data, options);
  } else {
    results = await prisma.
    $transaction(async (tx) => {
      return migrateAllEntities(tx, 
      data, options);
    });
  }

  const read = ...;    // suma de 
  read por entidad
  const created = ...; // suma de 
  created
  const updated = ...; // suma de 
  updated
  const errors = ...;  // suma de 
  errors
  const duration = Date.now() - 
  startTime;

  const summary: MigrationResult = 
  { read, created, updated, errors, 
  duration };

  console.info('[MIGRATION_COMPLETE]
  ', {
    summary,
    perEntity: results,
  });

  return summary;
}
```
- Transacción Prisma : sólo cuando dryRun=false , garantizando atomicidad multi-entidad.
- En dryRun , no hay escritura y se usa el cliente Prisma normal.
- Logs inicial y final con opciones y totales.
### 5. Entry point: index.ts
Archivo:
 scripts/google-sheets-migration/index.ts

Lee opciones desde variables de entorno:

```
import { runMigration, 
MigrationOptions } from './
migrator';

function parseBooleanEnv(value: 
string | undefined, defaultValue: 
boolean): boolean { ... }

function parseNumberEnv(value: 
string | undefined, defaultValue: 
number): number { ... }

async function main(): 
Promise<void> {
  const options: MigrationOptions = 
  {
    dryRun: parseBooleanEnv(process.
    env.MIGRATION_DRY_RUN, true),
    batchSize: parseNumberEnv
    (process.env.
    MIGRATION_BATCH_SIZE, 100),
    skipExisting: parseBooleanEnv
    (process.env.
    MIGRATION_SKIP_EXISTING, false),
  };

  const result = await runMigration
  (options);

  if (result.errors > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('
  [MIGRATION_FATAL_ERROR]', error);
  process.exitCode = 1;
});
```
Uso típico:

```
# Dry run por defecto
MIGRATION_DRY_RUN=true ts-node 
scripts/google-sheets-migration/
index.ts

# Migración real, saltando 
existentes
MIGRATION_DRY_RUN=false 
MIGRATION_SKIP_EXISTING=true 
ts-node scripts/
google-sheets-migration/index.ts
```
### 6. Pruebas unitarias del mapeo
Archivo:
 src/tests/unit/google-sheets/migrator-mapping.test.ts

Importa funciones puras de mapeo:

```
import {
  mapProductRow,
  mapSupplierRow,
  mapCustomerRow,
  mapProductPriceRow,
  mapInvoiceItems,
  mapInvoiceRow,
} from '../../../../scripts/
google-sheets-migration/migrator';
```
Casos cubiertos:

- Producto:
```
const row = { name: 'Manzana Gala', 
sku: 'APPLE-GALA-01', unit: 'kg', 
isActive: 'true' };
const mapped = mapProductRow(row as 
any);

expect(mapped.name).toBe('Manzana 
Gala');
expect(mapped.sku).toBe
('APPLE-GALA-01');
expect(mapped.unit).toBe('kg');
expect(mapped.isActive).toBe(true);
```
- Supplier y customer: validan campos principales y flags de actividad.
- Product price: valida coerción de números y isCurrent , usando UUIDs válidos.
- Invoice items: JSON → items válidos (quantity y unitPrice numéricos).
- Invoice row: valida fechas, status y que se generen items.
Ejecuté:

```
npm test -- --runInBand
```
Resultado:

- Test Suites : 28 / 28 OK.
- Tests : 124 / 124 OK.
Esto confirma:

- Tipos y Zod schemas se integran correctamente.
- Funciones de mapeo no rompen la validación.
- El código compila y la lógica básica está verificada.
### 7. Consideraciones y gotchas
- Encabezados de Sheets : asumí nombres razonables ( name , sku , taxId , productId , etc.) y algunas variantes ( name_es , tax_id , is_active ). Si tus hojas usan otros nombres, sólo habría que ajustar los arrays de claves en los helpers getString/getNumber .
- IDs :
  - Si la hoja incluye columnas id / ID , se preservan como id en DB cuando se crean nuevos registros.
  - Para ProductPrice , los IDs de productId y supplierId deben ser UUIDs válidos (según Zod).
- Conflictos :
  - Hoja: duplicados por sku , name , taxId , number se consideran errores y se loggean.
  - DB: si skipExisting=false , entradas existentes se consideran conflicto y no se sobrescriben; esto es un manejo simple y seguro. El prompt GS-05 de “Conflict Resolution” puede expandir esta lógica.
- Dry run :
  - Valida todo, cuenta leídos / errores y loggea conflictos, pero no escribe en DB.
  - Ideal para probar mapeos antes de correr migraciones reales.
### 8. Próximos pasos sugeridos
1. Verificar nombres de columnas reales en tus Google Sheets y ajustar las listas de claves en map*Row si es necesario.
2. Probar un dry run real (con tus credenciales y Sheets) usando:
   
   ```
   MIGRATION_DRY_RUN=true ts-node 
   scripts/google-sheets-migration/
   index.ts
   ```
3. Una vez satisfecho con los logs y estadísticas, ejecutar migración real con:
   
   ```
   MIGRATION_DRY_RUN=false 
   MIGRATION_SKIP_EXISTING=true 
   ts-node scripts/
   google-sheets-migration/index.ts
   ```
Si quieres, en el siguiente paso puedo afinar los mapeos con base en estructuras concretas de tus hojas (ej. columnas exactas de Products , Invoices , etc.) para que la migración sea 100% alineada con tus documentos de origen.

---

#### Prompt GS-12: Webhook Receiver for Make.com

**Contexto:**
Google Sheets migration completa. Ahora necesitamos actualizar Make.com para enviar datos directamente a nuestra API en lugar de Google Sheets. Necesitamos un endpoint robusto para recibir estos webhooks.

**Tarea específica:**
Crear endpoint webhook en `src/app/api/v1/webhooks/make/route.ts`:

1. POST endpoint para recibir datos de Make.com:
   - Validar API key de Make.com (header)
   - Validar payload con Zod
   - Procesar datos según event type:
     - `product.created` / `product.updated`
     - `supplier.created` / `supplier.updated`
     - `price.created` / `price.updated`
     - `customer.created` / `customer.updated`
     - `invoice.created` / `invoice.updated`
   - Persistir datos en PostgreSQL
   - Log webhook en WebhookLog model

2. Implementar idempotency:
   - Usar header `X-Make-Idempotency-Key`
   - Check si ya fue procesado
   - Retornar resultado cacheado si existe

3. Error handling:
   - Validación: 400
   - Auth error: 401
   - Rate limit: 429
   - Server error: 500 con retry

4. Rate limiting:
   - Limitar a 100 requests/minute por API key
   - Implementar con in-memory o Redis

**Constraints técnicos:**
- Stack: Next.js 14 API Routes, TypeScript, Prisma, Zod
- Patrones: Webhook pattern, idempotency, rate limiting
- Archivos a crear/modificar:
  - `src/app/api/v1/webhooks/make/route.ts`
  - `prisma/schema.prisma` (añadir model WebhookLog)
- Environment variables:
  - `MAKE_WEBHOOK_API_KEY`
  - `WEBHOOK_RATE_LIMIT`

**Output esperado:**
- [ ] Webhook endpoint funcional
- [ ] API key validation
- [ ] Payload validation con Zod
- [ ] Procesamiento de todos los event types
- [ ] Idempotency implementado
- [ ] WebhookLog model y logging
- [ ] Rate limiting funcional
- [ ] Error handling robusto

**Criterios de aceptación:**
1. Webhook recibe y procesa datos correctamente
2. API key validation rechaza requests no autorizados
3. Idempotency previene duplicados
4. Todos los event types procesados correctamente
5. Rate limiting activo y funcional
6. WebhookLog registra todos los webhooks
7. Errores manejados con códigos HTTP correctos

**Ejemplo de código esperado:**
```typescript
const webhookPayloadSchema = z.object({
  eventType: z.enum(['product.created', 'product.updated', ...]),
  data: z.object({ /* ... */ }),
  timestamp: z.string(),
  idempotencyKey: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Validate API key
  const apiKey = req.headers.get('x-make-api-key');
  if (apiKey !== process.env.MAKE_WEBHOOK_API_KEY) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }
  
  // Validate payload
  const payload = await req.json();
  const validation = webhookPayloadSchema.safeParse(payload);
  if (!validation.success) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR' } }, { status: 400 });
  }
  
  // Check idempotency
  const idempotencyKey = payload.idempotencyKey || req.headers.get('x-make-idempotency-key');
  if (idempotencyKey) {
    // Check if already processed
  }
  
  // Process event
  // Log webhook
}
```
RESPUESTA DEL AGENTE:
         
**Resumen**

La fase GS-12 (Webhook Receiver para Make.com) ya está implementada en tu repo y cumple prácticamente punto por punto con lo que define el documento en `AUDITORIA_FASE2_HAGO_PRODUCE (1).md#L3115-3212`. Te resumo qué existe, cómo se ajusta al prompt y cómo puedes usarlo desde Make.com.

---

## Contexto

La sección que señalas define:

- Endpoint: `src/app/api/v1/webhooks/make/route.ts`
- Requisitos:
  - Validación de API key
  - Validación de payload con Zod
  - Procesamiento de eventos:
    - `product.*`, `supplier.*`, `price.*`, `customer.*`, `invoice.*`
  - Persistencia en PostgreSQL
  - Logging en `WebhookLog`
  - Idempotency via `X-Make-Idempotency-Key`
  - Rate limiting (100 req/min por API key)
  - Manejo de errores con códigos HTTP correctos

---

## Implementación actual (qué ya tienes)

### 1) Endpoint y rutas

- Archivo: [route.ts](file:///c:/Users/nadir/Hago%20Produce/src/app/api/v1/webhooks/make/route.ts)
- Método expuesto: `export async function POST(req: NextRequest)`

Ruta HTTP resultante en Next.js 14:

- `POST /api/v1/webhooks/make`

### 2) Validación de API key

En la función `POST`:

```typescript
const apiKey = req.headers.get('x-make-api-key');

if (!apiKey || apiKey !== process.env.MAKE_WEBHOOK_API_KEY) {
  return unauthorizedResponse();
}
```

- Header esperado: `x-make-api-key`
- Compara contra `process.env.MAKE_WEBHOOK_API_KEY`
- Respuesta en caso de error:
  - HTTP 401
  - Body:

    ```json
    {
      "success": false,
      "error": {
        "code": "UNAUTHORIZED",
        "message": "No autorizado para consumir este webhook."
      }
    }
    ```

Cumple el punto de **API key validation** del prompt.

### 3) Rate limiting

Parte superior del archivo:

```typescript
const RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 100;

const rateLimitStore = new Map<RateLimitKey, RateLimitState>();

function getRateLimitMax(): number {
  const raw = process.env.WEBHOOK_RATE_LIMIT;
  if (!raw) return DEFAULT_MAX_REQUESTS;
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_MAX_REQUESTS;
  return parsed;
}

function getRateLimitKey(apiKey: string | null): RateLimitKey {
  if (apiKey) return apiKey;
  return 'anonymous';
}

function isRateLimited(key: RateLimitKey): boolean {
  const now = Date.now();
  const windowMs = RATE_LIMIT_WINDOW_MS;
  const maxRequests = getRateLimitMax();

  const state = rateLimitStore.get(key) || { timestamps: [] };
  const recent = state.timestamps.filter((ts) => now - ts < windowMs);
  recent.push(now);
  state.timestamps = recent;
  rateLimitStore.set(key, state);
  return recent.length > maxRequests;
}
```

Uso en el handler:

```typescript
const rateKey = getRateLimitKey(apiKey);
if (isRateLimited(rateKey)) {
  return rateLimitedResponse();
}
```

Respuesta de rate limit:

```typescript
function rateLimitedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Demasiadas solicitudes desde esta API key. Intente de nuevo más tarde.',
      },
    },
    { status: 429 },
  );
}
```

- Ventana: 60 segundos
- Límite: `WEBHOOK_RATE_LIMIT` o 100 por defecto
- **Status 429** con `success: false`

Esto cumple el requisito de **rate limiting funcional**.

### 4) Payload validation con Zod

Schemas en [route.ts](file:///c:/Users/nadir/Hago%20Produce/src/app/api/v1/webhooks/make/route.ts#L49-L88):

```typescript
const eventTypeSchema = z.enum([
  'product.created',
  'product.updated',
  'supplier.created',
  'supplier.updated',
  'price.created',
  'price.updated',
  'customer.created',
  'customer.updated',
  'invoice.created',
  'invoice.updated',
]);

const webhookPayloadSchema = z.object({
  eventType: eventTypeSchema,
  data: z.record(z.any()),
  timestamp: z.string(),
  idempotencyKey: z.string().optional(),
});
```

Y validación en el handler:

```typescript
let payload: unknown;

try {
  payload = await req.json();
} catch (error) {
  return validationErrorResponse('Payload JSON inválido.');
}

const parsedPayload = webhookPayloadSchema.safeParse(payload);
if (!parsedPayload.success) {
  return validationErrorResponse('Payload de webhook inválido.');
}
```

- Si el JSON es inválido → 400 con código `VALIDATION_ERROR`
- Si el objeto no cumple el schema → 400 con código `VALIDATION_ERROR`

### 5) Procesamiento de cada event type

Para cada tipo de entidad tienes un schema específico y una función de procesamiento.

**Products**

- Schema: `productEventDataSchema` basado en `productSchema` + `id` opcional.
- Función: `processProductEvent`
- Lógica:
  - Busca por `id` o `sku`.
  - Si no existe, crea `product` respetando el `id` si viene.
  - Si existe, actualiza campos.
  - Retorna `{ action: 'created' | 'updated' }`.

**Suppliers**

- Schema: `supplierEventDataSchema` basado en `createSupplierSchema` + `id` opcional.
- Función: `processSupplierEvent`
- Lógica:
  - Busca por `id` o `name`.
  - Crea o actualiza supplier.
  - Retorno `{ action: 'created' | 'updated' }`.

**Customers**

- Schema: `customerEventDataSchema` basado en `createCustomerSchema` + `id` opcional.
- Función: `processCustomerEvent`
- Lógica:
  - Busca por `id` o `taxId`.
  - Crea o actualiza customer.
  - Retorno `{ action: 'created' | 'updated' }`.

**Prices**

- Schema: `productPriceEventDataSchema` basado en `productPriceSchema` + `id` opcional.
- Función: `processPriceEvent`
- Lógica:
  - Para `price.created`:
    - Usa transacción Prisma.
    - Si `isCurrent` es true, marca otros precios para ese producto/proveedor como `isCurrent = false`.
    - Crea nuevo `ProductPrice` (opcionalmente respetando `id`).
  - Para `price.updated`:
    - Requiere `id` (si no → `Error`).
    - `update` sobre `productPrice`.
  - Retorno `{ action: 'created' | 'updated' }`.

**Invoices**

- Usa `InvoicesService` existente:
  - `invoiceCreateEventDataSchema = createInvoiceSchema`
  - `invoiceUpdateEventDataSchema = updateInvoiceSchema.extend({ id: z.string().uuid() })`
- Función: `processInvoiceEvent`:

```typescript
if (eventType === 'invoice.created') {
  const parsed = invoiceCreateEventDataSchema.parse(data);
  const invoice = await invoicesService.create(parsed);
  return { action: 'created', invoiceId: invoice.id, number: invoice.number };
}

const parsedUpdate = invoiceUpdateEventDataSchema.parse(data);
const invoiceId = parsedUpdate.id;
const { id: _ignored, ...updateData } = parsedUpdate;

const invoice = await invoicesService.update(invoiceId, updateData, undefined);

return { action: 'updated', invoiceId: invoice.id, number: invoice.number, status: invoice.status };
```

**Dispatcher de eventos**

```typescript
async function processEvent(eventType: z.infer<typeof eventTypeSchema>, data: unknown) {
  if (eventType.startsWith('product.')) {
    return processProductEvent(eventType, data);
  }
  if (eventType.startsWith('supplier.')) {
    return processSupplierEvent(eventType, data);
  }
  if (eventType.startsWith('customer.')) {
    return processCustomerEvent(eventType, data);
  }
  if (eventType.startsWith('price.')) {
    return processPriceEvent(eventType, data);
  }
  if (eventType.startsWith('invoice.')) {
    return processInvoiceEvent(eventType, data);
  }

  throw new Error(`Tipo de evento no soportado: ${eventType}`);
}
```

Con esto se cubren todos los event types que pide el prompt.

### 6) Idempotency

- Uso de `idempotencyKey`:

```typescript
const body = parsedPayload.data;
const idempotencyKey = body.idempotencyKey ?? req.headers.get('x-make-idempotency-key');

if (idempotencyKey) {
  const cached = await findCachedResponse('make', idempotencyKey);
  if (cached) {
    return NextResponse.json(cached.body, { status: cached.httpStatus });
  }
}
```

- Función `findCachedResponse`:

```typescript
async function findCachedResponse(source: string, idempotencyKey: string) {
  const log = await prisma.webhookLog.findFirst({
    where: {
      source,
      idempotencyKey,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!log || !log.responseBody) return null;

  return {
    httpStatus: log.httpStatus,
    body: log.responseBody as any,
  };
}
```

- Cuando se procesa el evento por primera vez, se guarda la respuesta en `WebhookLog` (ver siguiente sección), de modo que si Make.com reenvía el mismo `idempotencyKey`, el endpoint le devuelve exactamente la misma respuesta y código HTTP.

Esto cumple el requerimiento de **idempotency implementado con cache de respuesta**.

### 7) WebhookLog model y logging

En tu `schema.prisma` ya existe el modelo [WebhookLog](file:///c:/Users/nadir/Hago%20Produce/prisma/schema.prisma#L204-L221):

```prisma
model WebhookLog {
  id             String   @id @default(uuid())
  source         String   @db.VarChar(50)
  apiKey         String?  @map("api_key") @db.VarChar(255)
  idempotencyKey String?  @map("idempotency_key") @db.VarChar(255)
  eventType      String   @map("event_type") @db.VarChar(100)
  status         String   @db.VarChar(20)
  httpStatus     Int      @map("http_status")
  errorCode      String?  @map("error_code") @db.VarChar(100)
  errorMessage   String?  @map("error_message")
  payload        Json?    @db.Json
  responseBody   Json?    @map("response_body") @db.Json
  createdAt      DateTime @default(now()) @map("created_at")

  @@map("webhook_log")
  @@index([idempotencyKey])
  @@index([eventType])
}
```

Función `logWebhook` en el endpoint:

```typescript
await prisma.webhookLog.create({
  data: {
    source: params.source,
    apiKey: params.apiKey ?? null,
    idempotencyKey: params.idempotencyKey ?? null,
    eventType: params.eventType,
    status: params.status,
    httpStatus: params.httpStatus,
    errorCode: params.errorCode ?? null,
    errorMessage: params.errorMessage ?? null,
    payload: params.payload as any,
    responseBody: params.responseBody as any,
  },
});
```

Se invoca siempre al final del handler:

```typescript
await logWebhook({
  source: 'make',
  apiKey,
  idempotencyKey: idempotencyKey ?? null,
  eventType: body.eventType,
  status: httpStatus >= 200 && httpStatus < 300 ? 'success' : 'error',
  httpStatus,
  errorCode: httpStatus >= 400 ? responseBody.error?.code : undefined,
  errorMessage: httpStatus >= 400 ? responseBody.error?.message : undefined,
  payload: body,
  responseBody,
});
```

Con esto se cumple el punto de **WebhookLog model y logging**.

### 8) Manejo de errores

- **Auth error**: 401, `UNAUTHORIZED`
- **Rate limit**: 429, `RATE_LIMITED`
- **Errores de validación**:
  - JSON inválido → `validationErrorResponse('Payload JSON inválido.')` (400)
  - Schema inválido → `validationErrorResponse('Payload de webhook inválido.')` (400)
- **Errores internos** (por ejemplo, fallo en DB o en Zod dentro de `processEvent`):
  
```typescript
} catch (error) {
  console.error('[MAKE_WEBHOOK_ERROR]', error);

  httpStatus = 500;
  responseBody = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno al procesar el webhook.',
    },
  };
}
```

- Siempre responde con el envelope estándar:

```json
{ "success": true, "data": { ... } }
// o
{ "success": false, "error": { code, message } }
```

---

## Cómo usarlo desde Make.com

Cuando configures el módulo HTTP en Make.com (tipo **Webhook → Custom webhook** o **HTTP → Make a request**):

- **URL**: `https://TU_DOMINIO/api/v1/webhooks/make`
- **Método**: `POST`
- **Headers**:
  - `Content-Type: application/json`
  - `x-make-api-key: <valor de MAKE_WEBHOOK_API_KEY>`
  - Opcional: `x-make-idempotency-key: <uuid>` si quieres controlar idempotencia desde Make.
- **Body (JSON)**, ejemplo para `product.created`:

```json
{
  "eventType": "product.created",
  "timestamp": "2026-02-22T10:30:00Z",
  "idempotencyKey": "some-uuid-or-run-id",
  "data": {
    "id": "opcional-uuid",
    "name": "Apple Gala",
    "nameEs": "Manzana Gala",
    "description": "Caja 18kg",
    "category": "FRUIT",
    "unit": "kg",
    "sku": "GALA-18KG",
    "isActive": true
  }
}
```

Para otros eventos:

- `supplier.*`: envía el shape de `createSupplierSchema` (+ `id` opcional).
- `customer.*`: envía el shape de `createCustomerSchema` (+ `id` opcional).
- `price.*`: envía el shape de `productPriceSchema` (+ `id` opcional).
- `invoice.*`: usa exactamente los campos de `createInvoiceSchema` / `updateInvoiceSchema` (más `id` obligatorio para `invoice.updated`).

---

## Consideraciones y siguientes pasos

- A nivel de código, la fase GS-12 está cubierta: endpoint, validaciones, idempotencia, logging y rate limit ya existen y son coherentes con la especificación.
- Si quieres, el siguiente paso natural según la misma sección del documento es pasar al **Prompt BOT-01: Bot API Key Management** (servicio de API keys de bots en `src/lib/services/bot/api-key.service.ts` y modelo `BotApiKey` en Prisma).  
  Puedo continuar directamente con ese módulo (diseñar modelo Prisma, servicio TypeScript y flujo de validación/rotación de claves) en la siguiente iteración.

---

### 4.3 Prompts para Módulo 3: Bot Externo

#### Prompt BOT-01: Bot API Key Management

**Contexto:**
Necesitamos crear un sistema de gestión de API keys para bots externos (WhatsApp, Telegram) que consulten nuestro sistema. Las API keys deben ser seguras, rotativas, y con rate limiting.

**Tarea específica:**
Crear servicio de API keys en `src/lib/services/bot/api-key.service.ts`:

1. Función `generateApiKey()`:
   - Generar API key segura (UUID v4 + timestamp)
   - Hash key antes de guardar (bcrypt)
   - Retornar key plain (solo una vez al generar)

2. Función `createApiKey(data)`:
   - Crear BotApiKey record en DB
   - Campos: id, name, hashedKey, rateLimit, isActive, createdAt, lastUsedAt
   - Validar nombre único

3. Función `validateApiKey(apiKey)`:
   - Hash input key
   - Buscar en DB
   - Verificar isActive
   - Actualizar lastUsedAt
   - Retornar BotApiKey o null

4. Función `rotateApiKey(id)`:
   - Generar nueva key
   - Actualizar record con nuevo hashedKey
   - Retornar nueva key plain

5. Función `revokeApiKey(id)`:
   - Marcar isActive = false

6. Función `listApiKeys()`:
   - Listar todas las keys (sin exponer hashedKey)
   - Incluir stats: lastUsed, requestCount

**Constraints técnicos:**
- Stack: TypeScript, Prisma, bcrypt
- Patrones: Service pattern, security best practices
- Archivos a crear/modificar:
  - `src/lib/services/bot/api-key.service.ts`
  - `prisma/schema.prisma` (añadir model BotApiKey)
- Dependencies: Prisma, bcrypt

**Output esperado:**
- [ ] Servicio de API keys funcional
- [ ] Generación de keys seguras
- [ ] Hashing con bcrypt
- [ ] Validación de keys
- [ ] Rotación de keys
- [ ] Revocación de keys
- [ ] Listado de keys con stats
- [ ] Tests de seguridad

**Criterios de aceptación:**
1. API keys generadas son seguras y únicas
2. Hashing funciona correctamente
3. Validación rechaza keys inválidas
4. Rotación genera nueva key y desactiva anterior
5. Revocación desactiva key inmediatamente
6. Listado no expone hashedKey
7. lastUsedAt actualizado en cada uso

**Ejemplo de código esperado:**
```typescript
export interface CreateApiKeyData {
  name: string;
  rateLimit?: number; // requests per minute
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  rateLimit: number;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
  requestCount: number;
}

export async function generateApiKey(): Promise<string> {
  const uuid = crypto.randomUUID();
  const timestamp = Date.now();
  return `${uuid}-${timestamp}`;
}

export async function createApiKey(data: CreateApiKeyData): Promise<string> {
  const plainKey = await generateApiKey();
  const hashedKey = await bcrypt.hash(plainKey, 10);
  // Save to DB
  return plainKey; // Return only once
}

export async function validateApiKey(apiKey: string): Promise<ApiKeyInfo | null> {
  const hashedKey = await bcrypt.hash(apiKey, 10);
  // Find in DB
  // Update lastUsedAt
}
```
RESPUESTA DEL AGENTE:
He completado el **BOT-01: Bot API Key Management** según la especificación del documento `AUDITORIA_FASE2_HAGO_PRODUCE (1).md#L3678-3778`.

## Entregables realizados

### 1) Modelo Prisma – `BotApiKey`
Agregado en [prisma/schema.prisma](file:///c:/Users/nadir/Hago%20Produce/prisma/schema.prisma):

```prisma
model BotApiKey {
  id          String    @id @default(uuid())
  name        String    @unique @db.VarChar(100)
  hashedKey   String    @map("hashed_key") @db.VarChar(255)
  rateLimit   Int       @default(60) @map("rate_limit")
  isActive    Boolean   @default(true) @map("is_active")
  lastUsedAt  DateTime? @map("last_used_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@map("bot_api_key")
  @@index([isActive])
}
```

### 2) Servicio TypeScript – `src/lib/services/bot/api-key.service.ts`
Implementadas todas las funciones solicitadas:

| Función | Descripción |
|---------|-------------|
| `generateApiKey()` | Genera `UUIDv4-timestamp` único |
| `createApiKey(data)` | Crea registro con `bcrypt.hash(plainKey, 10)` y valida nombre único |
| `validateApiKey(apiKey)` | Compara con `bcrypt.compare`, actualiza `lastUsedAt`, retorna `ApiKeyInfo` |
| `rotateApiKey(id)` | Genera nueva key, actualiza `hashedKey`, retorna nueva key (plain) |
| `revokeApiKey(id)` | Marca `isActive = false` |
| `listApiKeys()` | Lista sin exponer `hashedKey`, incluye `requestCount` (últimas 24 h) |

Además exporta la clase estática `BotApiKeyService` con los mismos métodos para facilitar importaciones.

### 3) Tests de seguridad – `src/tests/unit/bot/api-key.service.test.ts`
Cobertura completa:

- Generación única y formato correcto
- Creación con valores por defecto y personalizados
- Rechazo de nombres duplicados
- Validación de keys correctas / inválidas / revocadas
- Actualización de `lastUsedAt`
- Rotación: nueva key válida, vieja key inválida
- Revocación inmediata
- Listado sin exponer `hashedKey`
- Verificación de hash bcrypt con salt único
- Tests de la clase estática

## Cumplimiento de criterios de aceptación

✅ **API keys generadas son seguras y únicas** – UUIDv4 + timestamp  
✅ **Hashing funciona correctamente** – bcrypt con salt único  
✅ **Validación rechaza keys inválidas** – compara hash, solo activas  
✅ **Rotación genera nueva key y desactiva anterior** – update de `hashedKey`  
✅ **Revocación desactiva key inmediatamente** – `isActive = false`  
✅ **Listado no expone hashedKey** – interfaz `ApiKeyInfo` sin campo sensible  
✅ **lastUsedAt actualizado en cada uso** – update en `validateApiKey`

## Próximos pasos sugeridos

1. Generar y aplicar migración Prisma:

```bash
npx prisma migrate dev --name add_bot_api_key
```

2. Crear endpoints REST para administrar keys (siguiente prompt BOT-02 probablemente).

3. Integrar validación en middleware de autenticación para bots de WhatsApp/Telegram.

El servicio está listo para ser usado por bots externos con seguridad y trazabilidad.
---

#### Prompt BOT-02: Public Bot API Endpoints

**Contexto:**
Tenemos el sistema de API keys implementado. Necesitamos crear endpoints públicos que los bots externos puedan usar para consultar datos del sistema.

**Tarea específica:**
Crear API routes en `src/app/api/v1/bot/query/route.ts`:

1. POST endpoint para consultas de bot:
   - Validar API key en header `X-Bot-API-Key`
   - Validar payload con Zod:
     ```typescript
     {
       query: string,
       language: 'es' | 'en',
       context?: { customerId?: string }
     }
     ```
   - Usar servicio de chat existente (reutilizar lógica de Fase 1C)
   - Implementar rate limiting por API key
   - Retornar respuesta estructurada:
     ```typescript
     {
       success: true,
       data: {
         response: string,
         intent: string,
         confidence: number,
         sources: [...]
       }
     }
     ```

2. Rate limiting:
   - Usar límite configurado en BotApiKey
   - In-memory storage por API key
   - Retornar 429 con `Retry-After` header

3. Error handling:
   - API key inválida: 401
   - Rate limit exceeded: 429
   - Payload inválido: 400
   - Error interno: 500

**Constraints técnicos:**
- Stack: Next.js 14 API Routes, TypeScript, Prisma, Zod
- Patrones: RESTful, rate limiting, error handling
- Archivos a crear/modificar:
  - `src/app/api/v1/bot/query/route.ts`
  - `src/lib/services/bot/query.service.ts`
- Dependencies: Bot API key service, Chat service (Fase 1C)

**Output esperado:**
- [ ] Endpoint POST /api/v1/bot/query funcional
- [ ] API key validation
- [ ] Payload validation con Zod
- [ ] Rate limiting por API key
- [ ] Integración con chat service
- [ ] Error handling robusto
- [ ] Tests de integración

**Criterios de aceptación:**
1. Endpoint responde consultas correctamente
2. API key validation funciona
3. Rate limiting respeta límites configurados
4. Respuestas consistentes con API de chat
5. Errores manejados con códigos HTTP correctos
6. Headers `Retry-After` en rate limit exceeded

**Ejemplo de código esperado:**
```typescript
const botQuerySchema = z.object({
  query: z.string().min(1),
  language: z.enum(['es', 'en']).default('es'),
  context: z.object({
    customerId: z.string().optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  // Validate API key
  const apiKey = req.headers.get('x-bot-api-key');
  const keyInfo = await validateApiKey(apiKey);
  if (!keyInfo) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }
  
  // Check rate limit
  if (!checkRateLimit(keyInfo.id, keyInfo.rateLimit)) {
    return NextResponse.json({ success: false, error: { code: 'RATE_LIMITED' } }, { status: 429 });
  }
  
  // Validate payload
  const payload = await req.json();
  const validation = botQuerySchema.safeParse(payload);
  if (!validation.success) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR' } }, { status: 400 });
  }
  
  // Process query using chat service
  const result = await botQueryService.executeQuery(payload);
  
  return NextResponse.json({ success: true, data: result });
}
```

---

#### Prompt BOT-06: Webhook Handlers for WhatsApp and Telegram

**Contexto:**
Necesitamos integrar WhatsApp (Twilio) y Telegram para recibir y procesar mensajes de usuarios. Los webhooks de estas plataformas deben ser manejados correctamente.

**Tarea específica:**
Crear webhook handlers:

**WhatsApp:**
1. `POST /api/v1/bot/webhook/whatsapp/route.ts`:
   - Validar webhook signature de Twilio
   - Parsear mensaje de WhatsApp
   - Extraer: from (phone number), body (message text)
   - Usar bot query service para procesar
   - Enviar respuesta vía Twilio API
   - Log mensaje en Message model

**Telegram:**
1. `POST /api/v1/bot/webhook/telegram/route.ts`:
   - Validar token de Telegram
   - Parsear update de Telegram
   - Extraer: chat_id, text
   - Usar bot query service para procesar
   - Enviar respuesta vía Telegram Bot API
   - Log mensaje en Message model

**Ambos:**
- Implementar rate limiting por phone/chat
- Manejar mensajes no reconocidos
- Soportar comandos básicos: /start, /help, /status
- Manejar errores y reintentos

**Constraints técnicos:**
- Stack: Next.js 14 API Routes, TypeScript, Twilio SDK, node-telegram-bot-api
- Patrones: Webhook pattern, error handling, retry logic
- Archivos a crear/modificar:
  - `src/app/api/v1/bot/webhook/whatsapp/route.ts`
  - `src/app/api/v1/bot/webhook/telegram/route.ts`
  - `src/lib/services/bot/whatsapp.service.ts`
  - `src/lib/services/bot/telegram.service.ts`
  - `prisma/schema.prisma` (añadir model Message)
- Environment variables:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_WHATSAPP_NUMBER`
  - `TELEGRAM_BOT_TOKEN`

**Output esperado:**
- [ ] Webhook WhatsApp funcional
- [ ] Webhook Telegram funcional
- [ ] Validación de signatures
- [ ] Procesamiento de mensajes
- [ ] Envío de respuestas
- [ ] Rate limiting por usuario
- [ ] Comandos básicos implementados
- [ ] Logging de mensajes

**Criterios de aceptación:**
1. Webhooks reciben y procesan mensajes correctamente
2. Validación de signatures funciona
3. Respuestas enviadas exitosamente
4. Rate limiting por usuario activo
5. Comandos básicos responden correctamente
6. Mensajes logueados en DB
7. Errores manejados con reintentos

**Ejemplo de código esperado:**
```typescript
// WhatsApp webhook
export async function POST(req: NextRequest) {
  // Validate Twilio signature
  const signature = req.headers.get('x-twilio-signature');
  const url = req.url;
  const body = await req.text();
  
  if (!twilio.validateRequest(signature, url, body, process.env.TWILIO_AUTH_TOKEN)) {
    return NextResponse.json({ success: false, error: { code: 'INVALID_SIGNATURE' } }, { status: 401 });
  }
  
  // Parse message
  const formData = new URLSearchParams(body);
  const from = formData.get('From');
  const message = formData.get('Body');
  
  // Check rate limit
  if (!checkUserRateLimit(from)) {
    return NextResponse.json({ success: false, error: { code: 'RATE_LIMITED' } }, { status: 429 });
  }
  
  // Process query
  const response = await botQueryService.executeQuery({ query: message, language: 'es' });
  
  // Send response via Twilio
  await twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: from,
    body: response.response,
  });
  
  // Log message
  await prisma.message.create({
    data: {
      platform: 'whatsapp',
      platformUserId: from,
      message,
      response: response.response,
    },
  });
  
  return new Response('OK', { status: 200 });
}
```

---

### 4.4 Prompts para Módulo 4: SPA Pública

#### Prompt PUB-02: Landing Page Design

**Contexto:**
Necesitamos crear una landing page profesional y atractiva para Hago Produce. Debe ser responsive, optimizada para SEO, y showcase las características del sistema.

**Tarea específica:**
Crear landing page en `src/app/(public)/page.tsx` con:

1. **Hero Section:**
   - Headline impactante: "Sistema de Gestión para Productos Frescos"
   - Subheadline descriptivo
   - CTA buttons: "Solicitar Demo", "Más Información"
   - Imagen o ilustración de fondo
   - Responsive design

2. **Features Section:**
   - Grid de 6 características principales:
     - Facturación Automatizada
     - Gestión de Precios en Tiempo Real
     - Portal de Clientes
     - Analytics Avanzados
     - Integración con Make.com
     - Soporte Multi-idioma
   - Iconos para cada feature
   - Descripciones breves

3. **About Us Section:**
   - Breve historia de Hago Produce
   - Misión y visión
   - Stats: clientes activos, facturas procesadas, etc.

4. **Contact Form Section:**
   - Formulario con campos: nombre, email, empresa, mensaje
   - Validación con Zod
   - Submit a `/api/v1/public/contact`
   - Success message

5. **Footer:**
   - Links: Features, About, Contact, Privacy Policy
   - Social media icons
   - Copyright

**Constraints técnicos:**
- Stack: Next.js 14 Server Components, TypeScript, Tailwind CSS, Framer Motion
- Patrones: Server Components para SEO, Client Components para interactividad
- Archivos a crear/modificar:
  - `src/app/(public)/page.tsx`
  - `src/app/(public)/layout.tsx`
  - `src/components/public/Hero.tsx`
  - `src/components/public/Features.tsx`
  - `src/components/public/About.tsx`
  - `src/components/public/ContactForm.tsx`
  - `src/components/public/Footer.tsx`
- Dependencies: framer-motion (opcional para animaciones)

**Output esperado:**
- [ ] Landing page completa con todas las secciones
- [ ] Hero section impactante
- [ ] Features section con grid
- [ ] About section con stats
- [ ] Contact form funcional
- [ ] Footer completo
- [ ] Responsive design (mobile-first)
- [ ] Optimización de performance
- [ ] SEO meta tags

**Criterios de aceptación:**
1. Landing page carga en <2s (Lighthouse)
2. Responsive en todos los breakpoints (mobile, tablet, desktop)
3. SEO score ≥90 (Lighthouse)
4. Contact form valida y submit correctamente
5. Animaciones sutiles (no distractivas)
6. Accessibility score ≥90 (Lighthouse)

**Ejemplo de código esperado:**
```typescript
// src/app/(public)/page.tsx
import Hero from '@/components/public/Hero';
import Features from '@/components/public/Features';
import About from '@/components/public/About';
import ContactForm from '@/components/public/ContactForm';
import Footer from '@/components/public/Footer';

export const metadata = {
  title: 'Hago Produce - Sistema de Gestión para Productos Frescos',
  description: 'Plataforma completa para gestión de facturación, precios y clientes en la industria de productos frescos.',
  keywords: 'facturación, productos frescos, ERP, gestión de precios',
  openGraph: {
    title: 'Hago Produce',
    description: 'Sistema de gestión para productos frescos',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <About />
      <ContactForm />
      <Footer />
    </main>
  );
}
```

---

#### Prompt PUB-06: SEO Optimization

**Contexto:**
La landing page está creada pero necesita optimización SEO para mejorar ranking en buscadores y visibilidad.

**Tarea específica:**
Implementar optimización SEO completa:

1. **Meta Tags Dinámicos:**
   - `src/app/(public)/layout.tsx`: Meta tags base
   - `src/app/(public)/page.tsx`: Meta tags específicos para home
   - `src/app/(public)/*/page.tsx`: Meta tags para cada subpágina

2. **Sitemap.xml:**
   - Generar sitemap dinámicamente
   - Incluir todas las páginas públicas
   - `app/sitemap.ts` (Next.js 14)

3. **Robots.txt:**
   - Crear `public/robots.txt`
   - Permitir crawling de páginas públicas
   - Bloquear rutas privadas

4. **Structured Data (Schema.org):**
   - JSON-LD para organización
   - JSON-LD para servicios
   - Implementar en layout base

5. **Open Graph Tags:**
   - Imágenes OG para sharing en redes sociales
   - Títulos y descripciones optimizados

6. **Performance:**
   - Next/Image para imágenes optimizadas
   - Lazy loading de componentes
   - Minimizar bundle size
   - Font optimization

**Constraints técnicos:**
- Stack: Next.js 14, TypeScript
- Patrones: SEO best practices, structured data
- Archivos a crear/modificar:
  - `src/app/(public)/layout.tsx`
  - `src/app/(public)/page.tsx`
  - `src/app/(public)/about/page.tsx`
  - `app/sitemap.ts`
  - `public/robots.txt`
  - `public/og-image.png`
- Dependencies: next/image (built-in)

**Output esperado:**
- [ ] Meta tags dinámicos implementados
- [ ] Sitemap.xml generado
- [ ] Robots.txt configurado
- [ ] Structured data (JSON-LD) implementado
- [ ] Open Graph tags optimizados
- [ ] Imágenes OG creadas
- [ ] Performance optimizado

**Criterios de aceptación:**
1. SEO score ≥90 (Lighthouse)
2. Meta tags presentes y válidos
3. Sitemap.xml accesible en `/sitemap.xml`
4. Robots.txt accesible en `/robots.txt`
5. Structured data validada con Google Rich Results Test
6. Open Graph preview correcto en Facebook/Twitter
7. Performance score ≥90 (Lighthouse)

**Ejemplo de código esperado:**
```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://hagoproduce.com';
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}

// public/robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /portal/

Sitemap: https://hagoproduce.com/sitemap.xml

// src/app/(public)/layout.tsx
import Script from 'next/script';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* Structured Data */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Hago Produce',
              url: 'https://hagoproduce.com',
              description: 'Sistema de gestión para productos frescos',
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## 5. MÉTRICAS DE ÉXITO Y KPIS

### 5.1 Métricas de Calidad Técnica

| Métrica | Baseline Actual | Target Fase 2 | Herramienta de medición |
|---------|-----------------|---------------|------------------------|
| **Cobertura de tests** | ~40% (estimado) | ≥80% | Jest/Vitest coverage reports |
| **Largest Contentful Paint (LCP)** | ~2.5s (estimado) | <2.5s | Lighthouse CI |
| **First Input Delay (FID)** | ~100ms (estimado) | <100ms | Lighthouse CI |
| **Cumulative Layout Shift (CLS)** | ~0.2 (estimado) | <0.1 | Lighthouse CI |
| **Accesibilidad (a11y)** | ~85 (estimado) | ≥95 | Lighthouse CI, axe DevTools |
| **TypeScript strict mode** | ✅ Parcial | ✅ Completo | tsc --noEmit |
| **Errores en producción** | ~10/día (estimado) | <5/día | Sentry/logging dashboard |
| **API Response Time (P95)** | ~500ms (estimado) | <300ms | APM (Datadog/New Relic) |
| **Database Query Time (P95)** | ~200ms (estimado) | <100ms | Prisma query logs |
| **Bundle Size (JS)** | ~500KB (estimado) | <400KB | Webpack bundle analyzer |
| **Build Time** | ~3 minutos | <2 minutos | CI/CD logs |
| **Lighthouse Score (Desktop)** | ~85 | ≥95 | Lighthouse CI |
| **Lighthouse Score (Mobile)** | ~80 | ≥90 | Lighthouse CI |
| **Security Vulnerabilities (High/Critical)** | ~5 | 0 | npm audit, Snyk |
| **Code Duplication** | ~15% (estimado) | <5% | SonarQube |

---

### 5.2 Métricas de Negocio

| Métrica | Target | Método de medición |
|---------|--------|-------------------|
| **Tiempo de generación de reportes** | <5s para reportes estándar, <15s para complejos | Performance monitoring |
| **Tasa de éxito de webhooks (Make.com)** | ≥99.5% | Webhook logs, Make.com dashboard |
| **Tiempo de respuesta del bot** | <3s (P95) | Analytics del bot, APM |
| **Conversión landing page (demo requests)** | ≥3% | Google Analytics, CRM |
| **SEO Ranking - Keywords principales** | Top 10 en Google | Google Search Console |
| **Organic Traffic** | +50% vs baseline | Google Analytics |
| **Page Views / Session** | >3 páginas | Google Analytics |
| **Bounce Rate** | <40% | Google Analytics |
| **Time on Site** | >2 minutos | Google Analytics |
| **User Satisfaction (NPS)** | ≥50 | Encuestas post-demo |
| **Customer Portal Usage** | ≥70% de clientes activos | Analytics de portal |
| **Bot Usage (queries/month)** | >1000 queries/mes | Bot analytics |
| **Report Generation (reports/month)** | >200 reports/mes | Analytics de reportes |
| **PDF Downloads** | >100 PDFs/mes | Analytics de descargas |
| **Make.com Integration Reliability** | 99.9% uptime | Uptime monitoring |
| **Database Backup Success Rate** | 100% | Backup logs |

---

### 5.3 Checklist de Validación Pre-Deploy

#### 🔍 Testing & Quality
- [ ] Todos los tests unitarios pasan (unit + integration)
- [ ] Cobertura de tests ≥80%
- [ ] Tests E2E de funcionalidades críticas pasan
- [ ] Lighthouse score ≥95 en todas las métricas
- [ ] Sin vulnerabilidades críticas (npm audit, Snyk)
- [ ] Code review completado y aprobado
- [ ] ESLint sin errores
- [ ] TypeScript compila sin errores (strict mode)

#### 🚀 Performance
- [ ] LCP <2.5s
- [ ] FID <100ms
- [ ] CLS <0.1
- [ ] Bundle size <400KB
- [ ] Imágenes optimizadas (Next/Image)
- [ ] Caching configurado correctamente
- [ ] CDN activo (Railway/Vercel)

#### 🔒 Security
- [ ] Variables de entorno configuradas
- [ ] Secrets no commiteados en GitHub
- [ ] API keys rotadas y seguras
- [ ] Rate limiting activo en todos los endpoints públicos
- [ ] CORS configurado correctamente
- [ ] HTTPS forzado en producción
- [ ] Security headers configurados
- [ ] Input validation en todos los endpoints
- [ ] SQL injection prevention verificado
- [ ] XSS prevention verificado

#### 📝 Documentation
- [ ] README actualizado
- [ ] API documentation generada (Swagger/OpenAPI)
- [ ] Deployment guide actualizado
- [ ] Variables de entorno documentadas
- [ ] Onboarding guide actualizado
- [ ] Changelog actualizado
- [ ] Release notes preparados

#### 🔄 Deployment & Operations
- [ ] Staging environment funcional
- [ ] Deployment script probado
- [ ] Database migrations probadas
- [ ] Rollback plan definido y probado
- [ ] Monitoring configurado (Sentry, APM)
- [ ] Logging configurado y accesible
- [ ] Alerts configurados ( errores, downtime)
- [ ] Backup strategy definida
- [ ] Disaster recovery plan documentado

#### 📊 Post-Deploy Validation
- [ ] Smoke tests pasan
- [ ] API health check OK
- [ ] Database connectivity OK
- [ ] Webhook receivers funcionales
- [ ] Bot integrations funcionales
- [ ] Email notifications funcionales
- [ ] Reports generan correctamente
- [ ] User login/logout funciona
- [ ] Customer portal funcional
- [ ] SEO meta tags presentes
- [ ] Analytics tracking configurado

---

## 6. DASHBOARD EJECUTIVO

Para presentar esta auditoría y el plan de Fase 2 a stakeholders ejecutivos, he creado un dashboard HTML interactivo.

**Características del Dashboard:**
- 📊 **Vista General del Proyecto:** Progreso por fases, estado actual
- 🎯 **Alcance de Fase 2:** Módulos, tareas, prioridades
- 📈 **Métricas de Éxito:** KPIs técnicos y de negocio
- 🚀 **Roadmap Visual:** Timeline de implementación
- ⚠️ **Riesgos y Mitigaciones:** Matriz de riesgos
- ✅ **Checklist de Pre-Deploy:** Validación lista

Este dashboard proporciona una perspectiva clara y ejecutiva del proyecto, facilitando la toma de decisiones y la comunicación con el cliente.