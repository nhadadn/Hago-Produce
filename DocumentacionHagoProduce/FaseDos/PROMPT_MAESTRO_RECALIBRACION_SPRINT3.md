# 🎯 PROMPT MAESTRO – RE-CALIBRACIÓN TRAE.AI POST-SPRINT 2
## Hago Produce | Baseline para Sprint 3 | Verificado en Repositorio

> **Fecha de Generación:** 2026-02-23  
> **Branch:** main  
> **Commit Base:** 87bf36b  
> **Generado por:** Análisis automatizado del repositorio real

---

## 0. INSTRUCCIÓN DE USO

Este documento es el **punto de entrada obligatorio** para cualquier agente que trabaje en Hago Produce a partir del Sprint 3. Antes de escribir una sola línea de código:

1. Lee este documento completo.
2. Consulta los documentos referenciados en la Sección 2.
3. Verifica el estado real del código en los archivos listados en la Sección 3.
4. Ubica tu tarea en el roadmap de la Sección 5.

---

## 1. ESTADO REAL POST-SPRINT 2 (Verificado en Código)

### 1.1 Resumen Ejecutivo

| Dimensión | Estado | Evidencia |
|---|---|---|
| **Fases 0 → 1C** | ✅ Completadas | Commits históricos en main |
| **Sprint 1 (Consolidación)** | ✅ Completado | `CHECKPOINT_DIA3_SPRINT1.md` |
| **Sprint 2 S2-01 (Chat Hardening)** | ✅ Implementado | `src/app/api/chat/route.ts` con rate limiting + ChatSession |
| **Sprint 2 S2-02 (RAG Real)** | ✅ Implementado | 8 intents en `src/lib/services/chat/intents/` |
| **Sprint 2 S2-03 (Make.com → DB)** | ✅ Implementado | `MAKE_BLUEPRINT_V2.json` + webhook actualizado |
| **Sprint 2 S2-04 (WhatsApp Producción)** | ✅ Implementado | Cron job + notificaciones automáticas |
| **Sprint 2 S2-05 (Documentación)** | ✅ Implementado | 7 documentos operacionales creados |

### 1.2 Inventario de Código Implementado (Sprint 2)

#### Backend - Nuevos Archivos
```
src/app/api/v1/cron/overdue-notifications/route.ts   ← Cron facturas vencidas
src/app/api/chat/route.ts                             ← Rate limiting + ChatSession + SSE
src/app/api/v1/bot/webhook/whatsapp/route.ts          ← Validación firma Twilio prod/dev
src/app/api/v1/webhooks/make/route.ts                 ← Idempotencia + payload Make.com
src/app/api/v1/invoices/[id]/status/route.ts          ← Notificaciones automáticas
src/lib/services/chat/intents/product-info.ts         ← Nuevo intent
src/lib/services/chat/intents/inventory-summary.ts    ← Nuevo intent
src/lib/services/chat/intents/overdue-invoices.ts     ← Nuevo intent
src/lib/services/chat/intents/create-order.ts         ← Nuevo intent
```

#### Base de Datos - Nuevos Modelos
```
ChatSession    ← Persistencia de conversaciones web (migración 20260223202738)
```

#### Tests - Nuevos Archivos
```
src/app/api/chat/__tests__/route.test.ts
src/app/api/v1/bot/webhook/whatsapp/__tests__/route.test.ts
src/lib/services/bot/__tests__/whatsapp.test.ts
src/lib/services/chat/__tests__/rag.test.ts
src/tests/integration/invoice-status-notification.test.ts
src/tests/integration/make-webhook.test.ts
src/tests/unit/notifications/whatsapp-status-change.test.ts
```

#### Documentación Operacional - Nuevos Archivos
```
DocumentacionHagoProduce/FaseDos/AUTOMATIZACIONES_MASTER.md
DocumentacionHagoProduce/FaseDos/MAKE_SETUP_GUIDE.md
DocumentacionHagoProduce/FaseDos/MAKE_PIPELINE_DOCUMENTACION.md
DocumentacionHagoProduce/FaseDos/MAKE_BLUEPRINT_V2.json
DocumentacionHagoProduce/FaseDos/TWILIO_SETUP_GUIDE.md
DocumentacionHagoProduce/FaseDos/WEBHOOKS_CONFIG_GUIDE.md
DocumentacionHagoProduce/FaseDos/RUNBOOK_OPERACIONES.md
DocumentacionHagoProduce/FaseDos/GOLIVE_CHECKLIST.md
```

### 1.3 Schema Prisma - Estado Actual (11 Modelos)

```
User              ← Auth + roles (ADMIN, ACCOUNTING, MANAGEMENT, CUSTOMER)
Customer          ← Clientes externos con portal
Supplier          ← Proveedores
Product           ← Catálogo con name/nameEs, SKU, categoría
ProductPrice      ← Precios por producto-proveedor con historial
Invoice           ← Facturas con estados (DRAFT→SENT→PENDING→PAID→CANCELLED→OVERDUE)
InvoiceItem       ← Líneas de factura
InvoiceNote       ← Notas internas por factura
AuditLog          ← Log de auditoría general
BotApiKey         ← API Keys para bots externos
Message           ← Mensajes WhatsApp/Telegram
WebhookLog        ← Log de webhooks con idempotencia
Notification      ← Notificaciones de usuario (Sprint 1)
ReportCache       ← Caché de reportes (Sprint 1)
ChatSession       ← Sesiones de chat web (Sprint 2)
```

### 1.4 API Endpoints - Inventario Completo

```
# Auth
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me
POST   /api/v1/auth/register
POST   /api/v1/auth/customer-login

# Recursos Core
GET/POST         /api/v1/users
GET/PUT/DELETE   /api/v1/users/[id]
GET/POST         /api/v1/customers
GET/PUT/DELETE   /api/v1/customers/[id]
GET/POST         /api/v1/suppliers
GET/PUT/DELETE   /api/v1/suppliers/[id]
GET/POST         /api/v1/products
GET/PUT/DELETE   /api/v1/products/[id]
GET/POST         /api/v1/product-prices
GET/PUT/DELETE   /api/v1/product-prices/[id]
POST             /api/v1/product-prices/bulk-update

# Facturas
GET/POST         /api/v1/invoices
GET/PUT/DELETE   /api/v1/invoices/[id]
PATCH            /api/v1/invoices/[id]/status
GET/POST         /api/v1/invoices/[id]/notes

# Reportes
GET   /api/v1/reports/revenue
GET   /api/v1/reports/aging
GET   /api/v1/reports/price-trends
GET   /api/v1/reports/top/customers
GET   /api/v1/reports/top/products
GET   /api/v1/reports/export/csv
GET   /api/v1/reports/export/pdf

# Chat & Bot
POST  /api/chat                              ← Rate limited, ChatSession, SSE
POST  /api/v1/chat/query
POST  /api/v1/bot/query
POST  /api/v1/bot/webhook/whatsapp           ← Firma Twilio validada
GET   /api/v1/bot/webhook/whatsapp           ← Verificación Twilio
POST  /api/v1/bot/webhook/telegram

# Bot API Keys (Admin)
GET/POST         /api/bot/keys
GET/PUT/DELETE   /api/bot/keys/[id]
GET              /api/bot/keys/stats
GET              /api/bot/keys/stats/[id]

# Webhooks & Automatizaciones
POST  /api/v1/webhooks/make                  ← Idempotencia, Make.com
POST  /webhooks/make/prices
POST  /webhooks/notifications/send

# Notificaciones
GET   /api/v1/notifications

# Cron Jobs
GET   /api/v1/cron/overdue-notifications     ← Protegido con CRON_SECRET

# Health
GET   /api/health
```

---

## 2. DOCUMENTACIÓN DE REFERENCIA OBLIGATORIA

### 2.1 Documentos de Sprint 2 (Baseline)

| Documento | Ruta | Cuándo Usarlo |
|---|---|---|
| **SPRINT2_RECALIBRADO_COMPLETO.md** | `DocumentacionHagoProduce/FaseDos/` | Siempre - es el eje central |
| **AUTOMATIZACIONES_MASTER.md** | `DocumentacionHagoProduce/FaseDos/` | Antes de tocar bots/webhooks/cron |
| **MAKE_SETUP_GUIDE.md** | `DocumentacionHagoProduce/FaseDos/` | Configurar Make.com |
| **MAKE_PIPELINE_DOCUMENTACION.md** | `DocumentacionHagoProduce/FaseDos/` | Entender el pipeline de precios |
| **MAKE_BLUEPRINT_V2.json** | `DocumentacionHagoProduce/FaseDos/` | Importar en Make.com |
| **TWILIO_SETUP_GUIDE.md** | `DocumentacionHagoProduce/FaseDos/` | Configurar WhatsApp Business |
| **WEBHOOKS_CONFIG_GUIDE.md** | `DocumentacionHagoProduce/FaseDos/` | Configurar webhooks externos |
| **RUNBOOK_OPERACIONES.md** | `DocumentacionHagoProduce/FaseDos/` | Troubleshooting en producción |
| **GOLIVE_CHECKLIST.md** | `DocumentacionHagoProduce/FaseDos/` | Antes de ir a producción |

### 2.2 Documentos de Arquitectura Global

| Documento | Ruta | Contenido |
|---|---|---|
| **02_data_model.md** | `DocumentacionHagoProduce/FaseDos/Fase2.0V/` | ERD completo, convenciones DB |
| **03_api_contracts.md** | `DocumentacionHagoProduce/FaseDos/Fase2.0V/` | Contratos REST, formatos de respuesta |
| **04_roadmap.md** | `DocumentacionHagoProduce/FaseDos/Fase2.0V/` | Roadmap Fases 0→2 |
| **01_architecture_c4.md** | `DocumentacionHagoProduce/FaseDos/Fase2.0V/` | Arquitectura C4 |

---

## 3. GAPS PENDIENTES POST-SPRINT 2

### 3.1 Gaps de Alta Prioridad (Sprint 3 - Inmediato)

| GAP ID | Descripción | Archivo | Impacto | Sprint |
|---|---|---|---|---|
| **GAP-S2-01** | Checklist Sprint 2 no actualizado en doc | `SPRINT2_RECALIBRADO_COMPLETO.md` | 🟡 Documentación | S3 Día 1 |
| **GAP-S2-02** | `create_order` intent sin parsing estructurado de OpenAI | `src/lib/services/chat/intents/create-order.ts` | 🔴 Funcionalidad | S3 Días 1-2 |
| **GAP-S2-03** | SSE es single-chunk (no streaming real token a token) | `src/app/api/chat/route.ts` | 🟡 UX | S3 Días 2-3 |
| **GAP-S2-04** | E2E Firefox timeout sin resolver (GAP-01 original) | `tests/chat.spec.ts` | ⚠️ Testing | S3 Día 1 |
| **GAP-S2-05** | `classifyChatIntentWithOpenAI` sin parámetros ricos para create_order | `src/lib/services/chat/intents.ts` | 🔴 Funcionalidad | S3 Días 1-2 |
| **GAP-S2-06** | Portal de cliente sin notificaciones en tiempo real | `src/app/(customer)/` | 🟡 UX | S3 Días 3-4 |
| **GAP-S2-07** | Reportes sin caché activo (ReportCache existe pero sin uso) | `src/lib/services/reports/index.ts` | 🟡 Performance | S3 Días 2-3 |
| **GAP-S2-08** | Rate limiting en memoria (no Redis) - no persiste entre instancias | `src/lib/utils/rate-limit.ts` | 🟡 Escalabilidad | S3 Días 4-5 |

### 3.2 Gaps de Media Prioridad (Sprint 3 - Planificado)

| GAP ID | Descripción | Impacto | Sprint |
|---|---|---|---|
| **GAP-S2-09** | SPA pública no implementada (Fase 2 item 2.5) | 🟡 Negocio | S3 Semana 2 |
| **GAP-S2-10** | Portal cliente sin dashboard de gráficos avanzados | 🟡 UX | S3 Semana 2 |
| **GAP-S2-11** | Multi-moneda sin tasas de cambio automáticas | 🟢 Bajo | Backlog |
| **GAP-S2-12** | Pagos online (Stripe) no implementados | 🟢 Bajo | Backlog |

---

## 4. CONVENCIONES OBLIGATORIAS

### 4.1 Idioma y Estilo
- **Comentarios en código:** ESPAÑOL
- **Documentación:** ESPAÑOL
- **Nombres de variables/funciones:** inglés (estilo técnico estándar)
- **Mensajes de error al usuario final:** ESPAÑOL
- **Logs técnicos:** inglés

### 4.2 ORM y Base de Datos
- ORM único: **Prisma** — NO usar TypeORM ni otros
- Respetar modelos y relaciones en `prisma/schema.prisma`
- Convenciones de nombres: `snake_case` en DB, `camelCase` en TypeScript
- Soft delete con `deletedAt` en entidades críticas (Customer, Product, Invoice)
- Todos los IDs son `UUID` (uuid()) o `CUID` (cuid()) según el modelo

### 4.3 Formato de Respuesta API (Estándar Obligatorio)
```typescript
// Éxito
{ success: true, data: { ... }, meta?: { page, per_page, total } }

// Error
{ success: false, error: { code: string, message: string, details?: any[] } }
```

### 4.4 Patrones de Seguridad (Ya Implementados - Reutilizar)
```typescript
// Rate limiting (src/lib/utils/rate-limit.ts)
isRateLimited('namespace', userId, limit)
createRateLimitResponse('namespace', userId, language)

// Auth middleware (src/lib/auth/middleware.ts)
getAuthenticatedUser(req)  // → { userId, role, customerId }
unauthorizedResponse()

// Audit logging (src/lib/audit/logger.ts)
logAudit({ userId, action, entityType, entityId, changes })

// Webhook idempotencia (WebhookLog en Prisma)
// Verificar X-Idempotency-Key antes de procesar
```

### 4.5 Patrones de Notificaciones (Ya Implementados - Reutilizar)
```typescript
// src/lib/services/notifications/service.ts
NotificationsService.sendInvoiceStatusNotification(invoiceId, newStatus)

// Siempre asíncrono - no bloquear respuesta HTTP
// Registrar en notifications_log (tabla en DB)
// Fallback: WhatsApp → Email si WhatsApp falla
```

### 4.6 Patrones de Chat/RAG (Ya Implementados - Reutilizar)
```typescript
// src/lib/services/chat/intents.ts
analyzeIntent(message, language)  // → DetectedIntent

// src/lib/services/chat/query-executor.ts
executeQuery(detected, language, context)  // → QueryExecutionResult

// src/lib/services/chat/openai-client.ts
formatResponse(intent, language, result, messages?)  // → string
// messages = historial de ChatSession para contexto
```

---

## 5. ROADMAP SPRINT 3 (Propuesto)

### 5.1 Objetivos del Sprint 3

Basado en el análisis de gaps y el roadmap de Fase 2 (`04_roadmap.md`), el Sprint 3 debe enfocarse en:

1. **Completar create_order con OpenAI Function Calling real** (GAP-S2-02, GAP-S2-05)
2. **Activar ReportCache** para performance de reportes (GAP-S2-07)
3. **Resolver E2E Firefox** (GAP-S2-04)
4. **SPA Pública** - Landing page institucional (Fase 2 item 2.5)
5. **Portal Cliente Avanzado** - Dashboard con gráficos (Fase 2 item 2.7)

### 5.2 Meta-Prompts Propuestos para Sprint 3

#### META-PROMPT S3-01: create_order con OpenAI Function Calling Real
**Agente:** Desarrollador Full Stack / AI Engineer  
**Nivel:** Nivel 3 (Negocio)  
**Días:** 1-2  
**Archivos a modificar:**
- `src/lib/services/chat/intents/create-order.ts`
- `src/lib/services/chat/intents.ts` (classifyChatIntentWithOpenAI)
- `src/lib/services/chat/openai-client.ts`

**Objetivo:** Implementar el intent `create_order` con parsing estructurado real usando OpenAI Function Calling para extraer cliente, productos, cantidades y unidades del mensaje del usuario, y crear un Invoice DRAFT real en DB con confirmación del usuario.

**Criterios de Aceptación:**
- [ ] OpenAI Function Calling extrae: customer_name, items[{product_name, quantity, unit}]
- [ ] Validación: cliente existe en DB (fuzzy search con ILIKE)
- [ ] Validación: productos existen en DB (fuzzy search con ILIKE)
- [ ] Confirmación con usuario antes de crear (respuesta "¿Confirmas crear esta factura?")
- [ ] Invoice DRAFT creado en DB con InvoiceItems correctos
- [ ] Número de factura retornado al usuario (INV-YYYY-NNNN)
- [ ] Tests: mínimo 5 casos (happy path, cliente no encontrado, producto no encontrado, confirmación rechazada, creación exitosa)

---

#### META-PROMPT S3-02: ReportCache Activo + Performance
**Agente:** Desarrollador Backend  
**Nivel:** Nivel 3 (Negocio)  
**Días:** 2-3  
**Archivos a modificar:**
- `src/lib/services/reports/index.ts`
- `src/app/api/v1/reports/*/route.ts` (todos los endpoints de reportes)

**Objetivo:** Activar el modelo ReportCache (ya existe en DB) en el servicio de reportes para cachear resultados por tipo y parámetros, con TTL configurable y limpieza automática de cachés expirados.

**Criterios de Aceptación:**
- [ ] Todos los endpoints de reportes usan ReportCache antes de calcular
- [ ] TTL configurable por tipo: REVENUE (1h), AGING (30min), TOP_PERFORMERS (2h), PRICE_TRENDS (6h)
- [ ] Cache key = hash de reportType + parameters JSON
- [ ] Endpoint de invalidación manual: `DELETE /api/v1/reports/cache` (solo ADMIN)
- [ ] Cron job de limpieza: `GET /api/v1/cron/clean-report-cache` (protegido con CRON_SECRET)
- [ ] Performance: reportes complejos <500ms con caché activo (vs <2s sin caché)
- [ ] Tests: cache hit, cache miss, cache expirado, invalidación manual

---

#### META-PROMPT S3-03: E2E Tests Firefox + Coverage
**Agente:** QA Engineer / Desarrollador Full Stack  
**Nivel:** Nivel 2 (Conexión)  
**Días:** 1  
**Archivos a modificar:**
- `tests/chat.spec.ts`
- `playwright.config.ts` (si existe)

**Objetivo:** Resolver el timeout de E2E en Firefox (GAP-01 original) aumentando timeouts y agregando retry logic en Playwright, y elevar la cobertura de tests al objetivo >80%.

**Criterios de Aceptación:**
- [ ] `tests/chat.spec.ts` pasa en Firefox (Chromium, WebKit y Firefox)
- [ ] Timeout de Playwright configurado a 30s para Firefox
- [ ] Retry automático: 2 reintentos en CI
- [ ] Coverage total del proyecto >80%
- [ ] Reporte de coverage generado en `coverage/`

---

#### META-PROMPT S3-04: SPA Pública - Landing Page Institucional
**Agente:** Desarrollador Frontend / UI Developer  
**Nivel:** Nivel 3 (Negocio)  
**Días:** 3-5  
**Archivos a crear:**
- `src/app/(public)/page.tsx` (landing page)
- `src/app/(public)/layout.tsx`
- `src/components/public/` (componentes de la SPA)

**Objetivo:** Implementar la landing page pública de HAGO PRODUCE (Fase 2 item 2.5) con información institucional, catálogo visual de productos, formulario de contacto y CTA para el portal de clientes.

**Criterios de Aceptación:**
- [ ] Ruta pública `/` accesible sin autenticación
- [ ] Secciones: Hero, Sobre Nosotros, Productos Destacados, Contacto
- [ ] Productos destacados cargados desde DB (productos activos con is_active=true)
- [ ] Formulario de contacto funcional (envía email o crea registro en DB)
- [ ] CTA "Portal de Clientes" → `/customer/login`
- [ ] Responsive design (mobile-first)
- [ ] SEO básico: meta tags, Open Graph
- [ ] Performance: Lighthouse score >90

---

#### META-PROMPT S3-05: Portal Cliente Avanzado con Gráficos
**Agente:** Desarrollador Frontend / Full Stack  
**Nivel:** Nivel 3 (Negocio)  
**Días:** 4-6  
**Archivos a modificar:**
- `src/app/(customer)/` (rutas del portal de cliente)
- `src/components/customer/` (componentes del portal)

**Objetivo:** Mejorar el portal de cliente (Fase 2 item 2.7) con dashboard de gráficos de compras históricas, historial completo de facturas con descarga masiva, y notificaciones en tiempo real.

**Criterios de Aceptación:**
- [ ] Dashboard con gráficos: compras por mes (últimos 12 meses), top productos comprados
- [ ] Historial completo de facturas con filtros (fecha, estado, monto)
- [ ] Descarga masiva de PDFs (selección múltiple → ZIP)
- [ ] Notificaciones en tiempo real (polling cada 30s o SSE)
- [ ] Estado de cuenta: total pendiente, facturas vencidas, próximas a vencer
- [ ] Responsive design
- [ ] Tests: dashboard carga datos correctos, descarga masiva funciona

---

### 5.3 Timeline Sprint 3

```
Día 1:   S3-03 (E2E Firefox) + S3-01 inicio (create_order)
Día 2:   S3-01 finalización + S3-02 inicio (ReportCache)
Día 3:   S3-02 finalización + S3-04 inicio (SPA Pública)
Día 4:   S3-04 continuación
Día 5:   S3-04 finalización + S3-05 inicio (Portal Cliente)
Día 6:   S3-05 continuación
Día 7:   S3-05 finalización
Día 8:   Testing E2E completo + Checkpoint Sprint 3
```

### 5.4 Dependencias Sprint 3

```
S3-03 (E2E) ──────────────────────────────────────────► Sin dependencias
S3-01 (create_order) ─────────────────────────────────► S2-01 (ChatSession) ✅
S3-02 (ReportCache) ──────────────────────────────────► Sprint 1 (ReportCache model) ✅
S3-04 (SPA Pública) ──────────────────────────────────► Sin dependencias
S3-05 (Portal Cliente) ───────────────────────────────► S3-04 (layout público) + S2-04 (notificaciones) ✅
```

---

## 6. VARIABLES DE ENTORNO - REFERENCIA COMPLETA

```env
# ============================================
# HAGO PRODUCE - Variables de Entorno Completas
# Actualizado: Sprint 2 completado
# ============================================

# App
NODE_ENV=development                          # development | production
APP_URL=http://localhost:3000                 # URL base de la aplicación

# Base de Datos (Railway PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:port/db

# Auth
NEXTAUTH_SECRET=<string-32-chars-aleatorio>
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=<string-32-chars-aleatorio>

# OpenAI
OPENAI_API_KEY=sk-...                         # platform.openai.com → API Keys
OPENAI_MODEL=gpt-4o-mini                      # Modelo a usar (default: gpt-4o-mini)

# Twilio - WhatsApp Business
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx  # console.twilio.com → Account Info
TWILIO_AUTH_TOKEN=<auth-token>                 # console.twilio.com → Account Info
TWILIO_WHATSAPP_NUMBER=+14155238886            # Número de Twilio (sandbox o producción)
TWILIO_WEBHOOK_URL=https://[dominio]/api/v1/bot/webhook/whatsapp
TWILIO_SANDBOX_MODE=true                       # true en desarrollo, false en producción

# Make.com
MAKE_WEBHOOK_API_KEY=hk_prod_xxxxxxxx          # Admin UI → /admin/bot-api-keys
WEBHOOK_RATE_LIMIT=100                         # Requests por minuto para webhooks

# Chat
CHAT_RATE_LIMIT=20                             # Requests por minuto por usuario

# Cron Jobs
CRON_SECRET=<string-aleatorio>                 # Protege endpoints de cron

# Railway (CI/CD)
RAILWAY_TOKEN=<token>
RAILWAY_PROJECT_ID=<project-id>
```

---

## 7. CHECKLIST DE SPRINT 2 ACTUALIZADO (Estado Real)

### Seguridad ✅
- [x] Rate limiting en /api/chat (20 req/min) — `src/app/api/chat/route.ts`
- [x] Validación firma Twilio en producción — `src/app/api/v1/bot/webhook/whatsapp/route.ts`
- [x] Variables de entorno completas en .env.example — `.env.example`
- [x] CRON_SECRET configurado — `src/app/api/v1/cron/overdue-notifications/route.ts`

### Funcionalidad ✅
- [x] ChatSession persistente en DB — `prisma/schema.prisma` + migración 20260223202738
- [x] 8 intents implementados — `src/lib/services/chat/intents/` (8 archivos)
- [x] Fuzzy search para productos — ILIKE en queries de Prisma
- [x] Streaming SSE básico en chat — `src/app/api/chat/route.ts` (single-chunk)
- [x] Make.com escribe a DB — `MAKE_BLUEPRINT_V2.json` módulo HTTP id=50
- [x] Notificaciones WhatsApp automáticas — `src/app/api/v1/invoices/[id]/status/route.ts`
- [x] Cron job facturas vencidas — `src/app/api/v1/cron/overdue-notifications/route.ts`

### Documentación ✅
- [x] AUTOMATIZACIONES_MASTER.md
- [x] MAKE_SETUP_GUIDE.md
- [x] MAKE_BLUEPRINT_V2.json
- [x] TWILIO_SETUP_GUIDE.md
- [x] WEBHOOKS_CONFIG_GUIDE.md
- [x] RUNBOOK_OPERACIONES.md
- [x] GOLIVE_CHECKLIST.md

### Testing ⚠️ (Parcial)
- [x] Tests S2-01: seguridad chat + WhatsApp webhook
- [x] Tests S2-02: RAG intents + query executor
- [x] Tests S2-04: WhatsApp service + notificaciones
- [ ] E2E Firefox timeout — **GAP-S2-04 → Sprint 3**
- [x] Pipeline Make.com → DB verificado (tests de integración)

---

## 8. FLUJO DE TRABAJO PARA SPRINT 3

### Antes de Cada Tarea
1. Leer el META-PROMPT correspondiente en este documento (Sección 5.2)
2. Verificar dependencias completadas (Sección 5.4)
3. Consultar `02_data_model.md` para modelos afectados
4. Consultar `03_api_contracts.md` para endpoints afectados
5. Revisar tests existentes relacionados en `src/tests/`

### Durante la Implementación
1. Seguir convenciones de la Sección 4
2. Reutilizar patrones existentes (rate limiting, audit, notificaciones, chat)
3. Incluir tests en el mismo PR (TDD o al menos tests de integración)
4. Comentarios en español, código en inglés
5. Actualizar documentación en `DocumentacionHagoProduce/FaseDos/` si aplica

### Al Completar Cada Tarea
1. Ejecutar tests: `npm test` o `npx jest --testPathPattern=[archivo]`
2. Verificar que no se rompieron tests existentes
3. Actualizar checklist en este documento
4. Crear checkpoint en `DocumentacionHagoProduce/FaseDos/CHECKPOINT_[DIA]_SPRINT3.md`
5. Commit con mensaje descriptivo siguiendo el patrón:
   ```
   feat(s3-01): implement create_order with OpenAI Function Calling
   
   - Add structured parameter extraction for customer and items
   - Add confirmation flow before creating Invoice DRAFT
   - Add tests for happy path and error cases
   ```

---

**Documento generado:** 2026-02-23  
**Basado en:** Análisis real del repositorio nhadadn/Hago-Produce (commit 87bf36b)  
**Próxima revisión:** Post-Sprint 3  
**Estado:** ✅ Listo para uso como baseline de Sprint 3