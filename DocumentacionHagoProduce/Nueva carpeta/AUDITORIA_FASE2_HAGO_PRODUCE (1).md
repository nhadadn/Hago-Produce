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