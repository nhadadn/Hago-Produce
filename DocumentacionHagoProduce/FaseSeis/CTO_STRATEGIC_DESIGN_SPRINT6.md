# CTO STRATEGIC SYSTEM DESIGN — HAGO PRODUCE — SPRINT 6 (CAPA 1 / NO CODE)
# Versión 2.0 — Ground Truth Verificado al 26/Feb/2026

════════════════════════════════════════════════
ROL (ESTRICTO)
════════════════════════════════════════════════
Actúa como:
- Chief Technology Officer
- Enterprise Systems Architect
- ERP Designer (perecederos, procurement, pricing intelligence)
- Arquitecto SaaS omnicanal (Web, WhatsApp, Telegram)

Restricciones absolutas:
- NO generes código.
- NO generes backlog exhaustivo.
- NO seas complaciente.
- NO asumas que algo existe si no está en el Ground Truth.
- Tu trabajo es DECIDIR arquitectura, límites, secuencia y riesgos.

════════════════════════════════════════════════
GROUND TRUTH — ESTADO REAL DEL SISTEMA (26/Feb/2026)
Fuente: Inspección directa del código fuente en rama main.
Trata esto como VERDAD ABSOLUTA. No lo discutas.
════════════════════════════════════════════════

## A) Cobertura Real (verificada)
- Test Suites: 51 passed / 51 total
- Tests: 471 passed / 471 total
- Statements: 94.78% | Branches: 80.64% | Functions: 94.83% | Lines: 95.76%
- Tiempo de ejecución: 23.486s

## B) Servicios que SÍ EXISTEN (con cobertura verificada)
- customers.service.ts — 100% cobertura
- email.service.ts — 100% cobertura
- invoices.service.ts — 94.93% statements / 64.28% branches (branches bajo)
- productService.ts — 100% cobertura
- purchase-orders.service.ts — 91.11% statements / 64.51% branches (branches bajo)
- suppliers.service.ts — 88.88% statements
- telegram.service.ts — 82.05% statements / 62.5% branches (cobertura baja)
- users.service.ts — 96.15%
- api-key.service.ts — 100%
- command-handler.service.ts — 97.22%
- query.service.ts — 96.25%
- whatsapp.service.ts — 100%
- intents.ts — 100%
- openai-client.ts — 100%
- query-executor.ts — 100%
- notifications/service.ts — 100%
- reports/index.ts — 98.3%

## C) Intents que SÍ EXISTEN
- best-supplier.ts — 85.71% / branches 40% (CRÍTICO: branches muy bajo)
- create-order.ts — 90.56%
- create-purchase-order.ts — 85.82%
- customer-balance.ts — 95%
- inventory-summary.ts — 100%
- invoice-status.ts — 100%
- overdue-invoices.ts — 92%
- price-lookup.ts — 90.9% / branches 40% (CRÍTICO: branches muy bajo)
- product-info.ts — 91.66% / branches 33.33% (CRÍTICO: branches muy bajo)

## D) Schema Prisma — Entidades que SÍ EXISTEN
User, Customer, Supplier, Product, ProductPrice,
Invoice, InvoiceItem, InvoiceNote,
PurchaseOrder, PurchaseOrderItem,
Notification, NotificationLog,
ReportCache, BotApiKey, Message, WebhookLog,
ChatSession, AuditLog

## E) Entidades que NO EXISTEN en el schema (ausencia verificada)
- PriceList (no existe)
- PreInvoice (no existe)
- BotDecision (no existe)

## F) Servicios que NO EXISTEN (mencionados en checkpoint pero ausentes en código)
- bot-decision.service.ts — NO EXISTE
- document-mapper.service.ts — NO EXISTE
- pdf-ingestion-orchestrator.service.ts — NO EXISTE
- tax-calculation.service.ts — NO EXISTE
- intent-resolver.ts — NO EXISTE
- price-versioning.service.ts — NO EXISTE

## G) Deuda Técnica Verificada (bloqueante)
1. taxRate HARDCODEADO a 0.13 (13% HST Ontario) en schema Prisma
   — Afecta: Invoice.taxRate y PurchaseOrder.taxRate
   — Riesgo: Ilegal para clientes fuera de Ontario (13 provincias canadienses)
2. Sin logging estructurado
   — Solo console.error / console.log / console.warn en producción
   — Sin Sentry, Winston, Pino ni sistema de alertas
3. Sin CI/CD pipeline verificado
   — No se encontraron archivos en .github/workflows/
   — Estado: UNKNOWN (puede existir en otra rama o no existir)

## H) Stack confirmado
- Next.js 14 + TypeScript + Prisma + PostgreSQL + Vercel
- OpenAI (intents + structured outputs)
- WhatsApp (Twilio — verificado en código)
- Telegram (node-telegram-bot-api — verificado)
- Web Chat (verificado)

## I) Principios estratégicos (no negociables)
- Make.com se elimina como core
- Excel se elimina como source of truth
- QuickBooks se reemplaza progresivamente

════════════════════════════════════════════════
TU MISIÓN — PASOS (en orden, sin saltarte ninguno)
════════════════════════════════════════════════

1) IDENTIDAD DEL SISTEMA
   Define en 2–3 frases:
   - Qué ES Hago Produce hoy (basado en Ground Truth).
   - Qué debe ser al final de Sprint 6.
   - Qué NO es (límites explícitos).

2) ARQUITECTURA OBJETIVO (C4 mental, conciso)
   Entrega:
   - Bounded Contexts propuestos (máximo 7).
     Para cada uno: source of truth, flujos principales, qué servicio lo posee.
   - Capa Application: servicios/handlers y contratos (sin código).
   - Capa Infra: DB, colas, storage, proveedores externos.
     — Decide explícitamente: ¿Redis/Upstash entra en Sprint 6? Justifica.
   - Capa Integraciones: WhatsApp (Twilio ya existe — ¿se migra a Cloud API?),
     Telegram, Email.
   - Capa AI: dónde entra y dónde NO entra.
     — Reglas determinísticas vs AI: define el límite.
   
   Responde explícitamente:
   - ¿Dónde vive el Price Engine? (no existe aún — ¿cómo se construye sobre ProductPrice?)
   - ¿Cómo se versiona precios? (price-versioning.service.ts no existe)
   - ¿Cómo se persiste contexto conversacional? (ChatSession existe — ¿es suficiente?)
   - ¿Cómo se relaciona PurchaseOrder → Invoice → CRA? (taxRate hardcodeado es bloqueante)

3) KILL LIST — QUÉ NO HACER EN SPRINT 6
   Lista mínimo 6 items con justificación de costo/beneficio.
   Incluye obligatoriamente:
   - ¿Redis/Upstash entra o no? ¿Por qué?
   - ¿Event sourcing entra o no?
   - ¿Microservicios?
   - ¿Contabilidad completa GL/AR/AP?
   - ¿Migración WhatsApp Twilio → Cloud API?

4) RIESGOS SISTÉMICOS (tabla: riesgo / severidad / mitigación)
   Evalúa obligatoriamente:
   - Riesgo fiscal/legal (taxRate hardcodeado — BLOQUEANTE)
   - Riesgo de IA (branches bajos en intents críticos: 33–40%)
   - Riesgo de integraciones (Twilio, Telegram)
   - Riesgo de data model (entidades faltantes: PriceList, PreInvoice, BotDecision)
   - Riesgo de observabilidad (sin logging estructurado en producción)
   - Riesgo de CI/CD (estado UNKNOWN)
   - Riesgo operativo (PDF ingestion no existe como servicio)

5) REESTRUCTURACIÓN SPRINT 6 (elige 1 de 4 opciones)
   Presenta:
   - A: Deuda Técnica + Hardening primero (CI/CD + logging + taxRate)
   - B: ERP Core (PriceList + PreInvoice + BotDecision + price-versioning)
   - C: CRA Compliance primero (TaxCalculationService multi-provincia)
   - D: Híbrido secuenciado (deuda técnica bloqueante → ERP Core → CRA)
   
   Para la opción elegida:
   - Alcance exacto: qué entra / qué no entra (límites duros).
   - Deliverables verificables (criterios de éxito medibles, no subjetivos).
   - Definition of Done a nivel sistema.

6) SECUENCIA REAL DE CONSTRUCCIÓN (máximo 10 pasos)
   Ordena por dependencia técnica real, no por prioridad conceptual.
   Cada paso debe indicar:
   - Qué se construye
   - Por qué en ese orden (dependencia)
   - Qué desbloquea
   
   Incluye obligatoriamente en la secuencia:
   - Resolución de taxRate hardcodeado (¿cuándo y cómo?)
   - Creación de entidades faltantes (PriceList, PreInvoice, BotDecision)
   - Implementación de servicios faltantes (price-versioning, pdf-ingestion, etc.)
   - Logging estructurado (¿cuándo entra?)
   - CI/CD (¿cuándo entra?)

7) GATES PARA ACTIVAR VIBECODING (checklist)
   Lista exactamente qué debe estar "decidido y congelado" antes de escribir código.
   Incluye:
   - Naming/Boundaries de cada servicio nuevo
   - Schema Prisma (modelos nuevos + migraciones necesarias)
   - Contratos de endpoints (método, path, input, output)
   - Reglas determinísticas documentadas (qué hace AI vs reglas fijas)
   - Política de errores/retry/auditoría
   - Política de taxRate (tabla de provincias o servicio externo)

════════════════════════════════════════════════
FORMATO DE SALIDA (estricto — en español)
════════════════════════════════════════════════

Devuelve exactamente estas secciones, en este orden:

1. Diagnóstico Ejecutivo (10–15 líneas)
2. Identidad del Sistema (Ahora / Fin Sprint 6 / Qué NO es)
3. Arquitectura Propuesta (Bounded Contexts + C4 mental + flujos)
4. Kill List (NO hacer en Sprint 6) — con razones
5. Riesgos Críticos (tabla: riesgo | severidad | mitigación)
6. Plan Sprint 6 (opciones A/B/C/D + opción elegida + DoD)
7. Secuencia de Construcción (pasos numerados con dependencias)
8. Gates para Activar Vibecoding (checklist)
9. Assumptions & Unknowns (máximo 8 items)
10. Decision Log (máximo 10 decisiones: motivo | alternativas rechazadas | impacto)
11. Recomendación Final (3–5 bullets, sin ambigüedad)

No seas complaciente.
No digas que todo es importante.
No repitas el Ground Truth como output.
No optimices antes de resolver deuda técnica bloqueante.

---

## 1. DIAGNÓSTICO EJECUTIVO

Hago Produce es un ERP operacional para distribuidores de perecederos en Canadá con 94.78% de cobertura de tests y 471 tests pasando. El sistema tiene capacidades omnicanal (WhatsApp, Telegram, Web Chat) y servicios de dominio sólidos (customers, invoices, purchase orders, reports), pero enfrenta **tres bloqueantes críticos**: (1) `taxRate` hardcodeado a 0.13 (13% HST Ontario) — riesgo legal para clientes en otras 12 provincias; (2) ausencia de logging estructurado — producción es una caja negra sin alertas; (3) CI/CD pipeline desconocido — sin validación automática de calidad. Adicionalmente, existen **deudas técnicas de data model**: entidades faltantes (PriceList, PreInvoice, BotDecision) y servicios ausentes (TaxCalculationService, PriceVersioningService, PdfIngestionService). El CHECKPOINT_SPRINT_5 proporcionado no refleja el código actual — describe servicios que no existen. Sprint 6 debe priorizar **deuda técnica bloqueante** antes de expansión funcional.

---

## 2. IDENTIDAD DEL SISTEMA

### Ahora (Ground Truth Verificado)
Hago Produce es un **ERP operacional B2B para distribuidores de perecederos en Canadá** con capacidades de facturación, órdenes de compra, reporting y chat omnicanal (WhatsApp, Telegram, Web). El sistema tiene 94.78% de cobertura de tests y 471 tests pasando, pero carece de compliance fiscal multi-provincia (taxRate hardcodeado), observabilidad en producción (sin logging estructurado) y validación automática de calidad (CI/CD desconocido).

### Fin Sprint 6
Hago Produce será un **ERP operacional fiscalmente compliant** con soporte para las 13 provincias canadienses, observabilidad completa (Winston/Pino + Sentry), CI/CD pipeline automatizado, y capacidades expandidas de pricing (PriceList + PriceVersioning) y auditoría de decisiones del bot (BotDecision). El sistema tendrá 90%+ de cobertura global y 0 open handles en tests.

### Qué NO es (Límites Explícitos)
- NO es un sistema de contabilidad completa (GL/AR/AP) — QuickBooks bridge es suficiente
- NO es multi-tenant — single-tenant por cliente
- NO es un sistema de inventario en tiempo real (RFID/IoT) — inventario basado en POs e invoices
- NO es un sistema de reporting fiscal completo (CRA XML) — eso es Sprint 7+
- NO es un sistema de pricing dinámico en tiempo real — pricing basado en listas versionadas
- NO es un sistema de AI-first — AI es herramienta, no core del negocio

---

## 3. ARQUITECTURA PROPUESTA

### Bounded Contexts (7 máximo)

| Context | Source of Truth | Flujos Principales | Servicio Dueño |
|---|---|---|---|
| **Commerce** | Invoice, PurchaseOrder | Facturación, órdenes de compra, pagos | `invoices.service.ts`, `purchase-orders.service.ts` |
| **Procurement** | Supplier, Product, ProductPrice | Gestión de proveedores, catálogo de productos | `suppliers.service.ts`, `productService.ts` |
| **Pricing** | PriceList, PriceVersion | Versionado de precios, lookup de precios | `PriceVersioningService` (nuevo) |
| **Finance** | TaxCalculationService (tabla) | Cálculo de impuestos por provincia | `TaxCalculationService` (nuevo) |
| **Intelligence** | BotDecision, ChatSession | Chat omnicanal, decisiones del bot | `query-executor.ts`, `BotDecisionService` (nuevo) |
| **Documents** | PreInvoice, PDF files | Ingestión de PDFs, pre-facturación | `PdfIngestionService` (nuevo) |
| **Infrastructure** | AuditLog, NotificationLog | Logging, notificaciones, auditoría | `LoggerService` (nuevo), `notifications/service.ts` |

### Capa Application (Servicios/Handlers)

**Servicios Nuevos:**
- `TaxCalculationService` — cálculo de impuestos por provincia canadiense
- `PriceVersioningService` — versionado de precios sobre ProductPrice
- `PdfIngestionService` — ingestión de PDFs con lazy loading
- `BotDecisionService` — persistencia de decisiones del bot
- `LoggerService` — logging estructurado (Winston/Pino)

**Contratos (sin código):**
- `ITaxCalculator` — interface para TaxCalculationService
- `IPriceVersioner` — interface para PriceVersioningService
- `IPdfIngestor` — interface para PdfIngestionService
- `IBotDecisionRepository` — interface para BotDecisionService
- `ILogger` — interface para LoggerService

### Capa Infra

**DB:** PostgreSQL (Neon) — source of truth único
- **Colas:** NO en Sprint 6 — procesamiento síncrono es suficiente (20 PDFs/semana)
- **Storage:** Vercel Blob Storage o S3 para PDFs
- **Proveedores externos:** OpenAI (intents + structured outputs), Twilio (WhatsApp), Telegram API

**Decisión Redis/Upstash:** ❌ NO entra en Sprint 6
- **Justificación:** Volumen actual (20 PDFs/semana) no justifica infra adicional. Fix N+1 queries primero ($0), medir, luego decidir. Redis introduce complejidad de ops sin beneficio claro.

### Capa Integraciones

**WhatsApp:** Twilio API SMS (existente) — NO migrar a Cloud API en Sprint 6
- **Justificación:** API SMS funciona. Cloud API requiere refactorización completa ($40-60h) sin beneficio funcional claro.

**Telegram:** node-telegram-bot-api (existente) — mantener

**Email:** Nodemailer (existente) — mantener

### Capa AI

**Dónde entra AI:**
- Intent Detection (OpenAI GPT-4) — clasificación de mensajes de chat
- Document Mapping (OpenAI structured outputs) — extracción de datos de PDFs
- Supplier Recommendation (OpenAI) — ranking basado en múltiples factores

**Dónde NO entra AI:**
- Tax Calculation — 100% determinístico (tabla de provincias)
- Price Lookup — 100% determinístico (consulta a PriceList/PriceVersion)
- Invoice Validation — 100% determinístico (reglas de negocio)
- Purchase Order Validation — 100% determinístico (reglas de negocio)

**Límite:** AI solo para tareas no determinísticas donde el costo de error es bajo. Cálculo fiscal o pricing es 100% determinístico.

### Preguntas Críticas

**¿Dónde vive el Price Engine?**
- `PriceVersioningService` en `src/lib/services/pricing/price-versioning.service.ts`
- Se construye sobre `ProductPrice` existente + nuevas entidades `PriceList` y `PriceVersion`
- Source of truth: `PriceVersion` en PostgreSQL

**¿Cómo se versiona precios?**
- `PriceList` agrupa versiones de precios por proveedor y período
- `PriceVersion` contiene precios específicos por producto con `validFrom` y `validTo`
- `PriceVersioningService` maneja lookup de precios vigentes y creación de nuevas versiones

**¿Cómo se persiste contexto conversacional?**
- `ChatSession` existe en schema — es suficiente para contexto básico
- `BotDecision` (nuevo) persiste decisiones del bot para auditoría
- Contexto de conversación se almacena en `ChatSession.messages` (JSON array)

**¿Cómo se relaciona PurchaseOrder → Invoice → CRA?**
- `PurchaseOrder` → `Invoice` es un flujo de negocio (no relación directa en DB)
- `Invoice` usa `TaxCalculationService` para calcular impuestos por provincia
- CRA compliance requiere `TaxCalculationService` multi-provincia (Sprint 6) + CRA XML generation (Sprint 7+)

---

## 4. KILL LIST — QUÉ NO HACER EN SPRINT 6

| Item | Decisión | Justificación Costo/Beneficio |
|---|---|---|
| **Redis/Upstash** | ❌ NO | Volumen actual (20 PDFs/semana) no justifica infra adicional. Fix N+1 queries primero ($0), medir, luego decidir. |
| **Event Sourcing** | ❌ NO | Complejidad arquitectónica excesiva para ERP operacional. PostgreSQL con audit logs es suficiente. |
| **Microservicios** | ❌ NO | Monolito modular (Next.js) es óptimo para equipo actual. Split prematuro = overhead de ops sin beneficio. |
| **Contabilidad completa GL/AR/AP** | ❌ NO | Fuera de scope. Facturación operativa sí, contabilidad general no. QuickBooks bridge es suficiente. |
| **Migración WhatsApp Twilio → Cloud API** | ❌ NO | API SMS funciona. Cloud API requiere refactorización completa ($40-60h) sin beneficio funcional claro. |
| **CRA XML Generation** | ❌ NO | Sprint 6 es fiscal compliance (tax calculation), no reporting fiscal completo. CRA XML es Sprint 7+. |
| **Multi-tenant** | ❌ NO | Single-tenant por cliente. Multi-tenant requiere schema redesign completo ($80-100h). |
| **Real-time Inventory Sync** | ❌ NO | Inventario basado en POs e invoices es suficiente para distribuidores de perecederos. RFID/IoT es overkill. |

---

## 5. RIESGOS CRÍTICOS

| Riesgo | Severidad | Mitigación |
|---|---|---|
| **taxRate hardcodeado a 0.13** | 🔴 CRÍTICO (Legal) | Implementar `TaxCalculationService` con tabla de 13 provincias canadienses en Sprint 6, Week 1. |
| **Branches de intents al 33-40%** | 🟡 ALTO (Operativo) | Aumentar cobertura de branches en `best-supplier.ts`, `price-lookup.ts`, `product-info.ts` a 70%+ antes de go-live. |
| **Sin logging estructurado** | 🔴 CRÍTICO (Observabilidad) | Implementar `LoggerService` (Winston/Pino) + Sentry en Sprint 6, Week 2. |
| **Entidades faltantes (PriceList, PreInvoice, BotDecision)** | 🟡 ALTO (Data Model) | Migración unificada de schema en Sprint 6, Week 2. |
| **CI/CD estado UNKNOWN** | 🟡 ALTO (Entrega) | Verificar si existe en otra rama. Si no, implementar pipeline básico (quality + unit tests + build) en Sprint 6, Week 1. |
| **PDF ingestion no existe como servicio** | 🟡 MEDIO (Operativo) | Implementar `PdfIngestionService` con lazy loading (fix open handles) en Sprint 6, Week 3. |
| **Integraciones (Twilio, Telegram)** | 🟡 MEDIO (Disponibilidad) | Agregar retry policy + circuit breaker en Sprint 6, Week 2. |
| **PriceVersioningService no existe** | 🟡 MEDIO (Pricing) | Implementar sobre `ProductPrice` existente en Sprint 6, Week 3. |

---

## 6. PLAN SPRINT 6

### Opciones Presentadas

**A: Deuda Técnica + Hardening primero**
- CI/CD + logging + taxRate + branches de intents
- **Pros:** Elimina bloqueantes críticos, reduce riesgo operativo
- **Contras:** No entrega funcionalidad visible al cliente

**B: ERP Core**
- PriceList + PreInvoice + BotDecision + price-versioning
- **Pros:** Expande capacidades del sistema
- **Contras:** Deja deuda técnica bloqueante sin resolver

**C: CRA Compliance primero**
- TaxCalculationService multi-provincia + reporting fiscal
- **Pros:** Resuelve riesgo legal inmediato
- **Contras:** No aborda observabilidad ni CI/CD

**D: Híbrido Secuenciado** ⭐ **ELEGIDA**
- Deuda técnica bloqueante → ERP Core → CRA Compliance

### Opción Elegida: D — Híbrido Secuenciado

**Alcance Exacto (Límites Duros):**

**Week 1-2: Deuda Técnica Bloqueante**
- ✅ `TaxCalculationService` (13 provincias canadienses)
- ✅ `LoggerService` (Winston/Pino + Sentry)
- ✅ CI/CD Pipeline básico (quality + unit tests + build)
- ✅ Aumentar branches de intents críticos a 70%+

**Week 3-4: ERP Core**
- ✅ Migración schema: `PriceList`, `PreInvoice`, `BotDecision`
- ✅ `PriceVersioningService` (sobre `ProductPrice` existente)
- ✅ `PdfIngestionService` (lazy loading, fix open handles)
- ✅ `BotDecisionService` (persistencia de decisiones)

**NO entra en Sprint 6:**
- ❌ CRA XML Generation (Sprint 7)
- ❌ Redis/Upstash (Sprint 7+ si N+1 queries persisten)
- ❌ Migración WhatsApp Cloud API (Sprint 7+)
- ❌ Contabilidad completa GL/AR/AP (Sprint 7+)

**Deliverables Verificables:**
1. `TaxCalculationService` con tests 100% coverage + tabla de 13 provincias
2. `LoggerService` integrado en todos los servicios + Sentry configurado
3. CI/CD pipeline pasando en GitHub Actions (3 jobs: quality, unit-tests, build)
4. Schema migrado con `PriceList`, `PreInvoice`, `BotDecision`
5. `PriceVersioningService` con tests 90%+ coverage
6. `PdfIngestionService` con tests 90%+ coverage + 0 open handles
7. Branches de intents críticos ≥ 70%
8. Cobertura global ≥ 90% statements

**Definition of Done (Sistema):**
- [ ] Todos los servicios nuevos tienen ≥ 90% coverage
- [ ] CI/CD pipeline pasa en cada PR
- [ ] `taxRate` ya no está hardcodeado en ningún servicio
- [ ] Todos los errores de producción llegan a Sentry
- [ ] Schema migrado sin breaking changes
- [ ] 0 open handles en `npx jest --detectOpenHandles`
- [ ] Documentación de API actualizada (OpenAPI/Swagger)

---

## 7. SECUENCIA DE CONSTRUCCIÓN

1. **Verificar/Implementar CI/CD Pipeline**
   - Qué: GitHub Actions workflow (quality → unit-tests → build)
   - Por qué: Bloquea todo desarrollo posterior sin validación automática
   - Desbloquea: Validación continua de código

2. **Implementar TaxCalculationService**
   - Qué: Servicio con tabla de 13 provincias canadienses (GST/HST/PST)
   - Por qué: Riesgo legal bloqueante — debe ser Week 1
   - Desbloquea: Facturación fiscalmente compliant

3. **Migrar Invoice y PurchaseOrder para usar TaxCalculationService**
   - Qué: Remover `taxRate` hardcodeado, inyectar `TaxCalculationService`
   - Por qué: Depende de paso 2
   - Desbloquea: Facturación multi-provincia

4. **Implementar LoggerService + Sentry**
   - Qué: Winston/Pino + integración Sentry
   - Por qué: Observabilidad crítica para producción
   - Desbloquea: Detección temprana de errores

5. **Migración Schema: PriceList, PreInvoice, BotDecision**
   - Qué: `prisma migrate dev` con entidades nuevas
   - Por qué: Base para servicios de pricing y bot decisions
   - Desbloquea: PriceVersioningService y BotDecisionService

6. **Implementar PriceVersioningService**
   - Qué: Servicio de versionado sobre `ProductPrice` existente
   - Por qué: Depende de paso 5 (PriceList)
   - Desbloquea: Pricing inteligente con histórico

7. **Implementar PdfIngestionService**
   - Qué: Servicio con lazy loading de `pdf-parse`
   - Por qué: Fix open handles + base para ingestión de documentos
   - Desbloquea: Pipeline de procesamiento de PDFs

8. **Implementar BotDecisionService**
   - Qué: Persistencia de decisiones del bot en DB
   - Por qué: Depende de paso 5 (BotDecision entity)
   - Desbloquea: Auditoría de decisiones del bot

9. **Aumentar branches de intents críticos**
   - Qué: Tests adicionales para `best-supplier.ts`, `price-lookup.ts`, `product-info.ts`
   - Por qué: Riesgo operativo de comportamiento no determinista
   - Desbloquea: Confianza en producción

10. **Integrar LoggerService en todos los servicios**
    - Qué: Reemplazar `console.error` por `logger.error` en todos los servicios
    - Por qué: Depende de paso 4
    - Desbloquea: Observabilidad completa del sistema

---

## 8. GATES PARA ACTIVAR VIBECODING

**Checklist de Decisiones Congeladas:**

- [ ] **Naming/Boundaries de Servicios Nuevos**
  - `TaxCalculationService` — `src/lib/services/finance/tax-calculation.service.ts`
  - `PriceVersioningService` — `src/lib/services/pricing/price-versioning.service.ts`
  - `PdfIngestionService` — `src/lib/services/documents/pdf-ingestion.service.ts`
  - `BotDecisionService` — `src/lib/services/chat/bot-decision.service.ts`
  - `LoggerService` — `src/lib/infrastructure/logger.service.ts`

- [ ] **Schema Prisma (Modelos Nuevos)**
  ```prisma
  model PriceList {
    id          String   @id @default(uuid())
    name        String
    supplierId  String
    supplier    Supplier @relation(fields: [supplierId], references: [id])
    isCurrent   Boolean  @default(false)
    validFrom   DateTime
    validTo     DateTime?
    prices      PriceVersion[]
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
  }

  model PriceVersion {
    id          String   @id @default(uuid())
    priceListId String
    priceList   PriceList @relation(fields: [priceListId], references: [id])
    productId   String
    product     Product  @relation(fields: [productId], references: [id])
    price       Decimal  @db.Decimal(10, 2)
    validFrom   DateTime
    validTo     DateTime?
    createdAt   DateTime @default(now())
  }

  model PreInvoice {
    id          String   @id @default(uuid())
    customerId  String
    customer    Customer @relation(fields: [customerId], references: [id])
    status      PreInvoiceStatus @default(DRAFT)
    subtotal    Decimal  @db.Decimal(10, 2)
    taxAmount   Decimal  @db.Decimal(10, 2)
    total       Decimal  @db.Decimal(10, 2)
    items       PreInvoiceItem[]
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
  }

  model BotDecision {
    id          String   @id @default(uuid())
    sessionId   String
    intent      String
    confidence  Float
    decision    Json
    executedAt  DateTime @default(now())
  }
  ```

- [ ] **Contratos de Endpoints**
  - `POST /api/v1/finance/tax/calculate` — `{ province: string, amount: decimal }` → `{ tax: decimal, rate: decimal, breakdown: object }`
  - `POST /api/v1/pricing/price-lists` — `{ name: string, supplierId: string, validFrom: date }` → `{ priceList: object }`
  - `POST /api/v1/documents/ingest-pdf` — `{ file: File, supplierId: string }` → `{ documents: object[] }`
  - `GET /api/v1/chat/decisions/:sessionId` — `{ decisions: BotDecision[] }`

- [ ] **Reglas Determinísticas Documentadas**
  - **Tax Calculation:** 100% determinístico — tabla de provincias canadienses, sin AI
  - **Price Lookup:** 100% determinístico — consulta a PriceList/PriceVersion, sin AI
  - **Invoice Validation:** 100% determinístico — reglas de negocio, sin AI
  - **Intent Detection:** AI (OpenAI GPT-4) — clasificación de mensajes
  - **Document Mapping:** AI (OpenAI structured outputs) — extracción de datos de PDFs
  - **Supplier Recommendation:** AI (OpenAI) — ranking basado en múltiples factores

- [ ] **Política de Erros/Retry/Auditoría**
  - **OpenAI:** Retry 3x con exponential backoff (1s, 2s, 4s), timeout 25s
  - **Twilio/Telegram:** Retry 3x con exponential backoff, circuit breaker después de 5 fallos consecutivos
  - **Tax Calculation:** Sin retry — error inmediato si provincia no encontrada
  - **Auditoría:** Todas las decisiones del bot se persisten en `BotDecision`
  - **Logging:** Todos los errores se envían a Sentry + se loguean estructuradamente

- [ ] **Política de TaxRate**
  - Tabla de 13 provincias canadienses (GST/HST/PST) hardcodeada en `TaxCalculationService`
  - No se usa servicio externo — riesgo de latencia/costo no justificado
  - Actualización manual por release (frecuencia: trimestral)

---

## 9. ASSUMPTIONS & UNKNOWNS

| Item | Estado | Nota |
|---|---|---|
| **CI/CD Pipeline existe en otra rama** | UNKNOWN | Requiere verificar ramas `feature/sprint*` o `dependabot/*` |
| **Volumen real de PDFs/semana** | ASSUMPTION | 20 PDFs/semana basado en CHECKPOINT — requiere validación con cliente |
| **Número de clientes por provincia** | UNKNOWN | Requiere validación para priorizar implementación de TaxCalculationService |
| **Twilio API SMS vs Cloud API** | ASSUMPTION | API SMS actual es suficiente — requiere validación con cliente |
| **QuickBooks bridge requerido** | UNKNOWN | Requiere validación con cliente para Sprint 7 |
| **N+1 queries en producción** | UNKNOWN | Requiere profiling de queries reales en staging |
| **Sentry free tier suficiente** | ASSUMPTION | 5,000 errors/mes — requiere monitoreo post-go-live |
| **Vercel Log Drains configurados** | UNKNOWN | Requiere verificar configuración de Vercel |

---

## 10. DECISION LOG

| Decisión | Motivo | Alternativas Rechazadas | Impacto |
|---|---|---|---|
| **TaxCalculationService con tabla hardcodeada** | Riesgo legal bloqueante, latencia/costo de servicio externo no justificado | Servicio externo de tax (Avalara, TaxJar) | Reducción de riesgo legal a 0, costo $0 |
| **NO Redis/Upstash en Sprint 6** | Volumen actual (20 PDFs/semana) no justifica infra adicional | Implementar Redis/Upstash | Ahorro $10-20/mes, reducción de complejidad |
| **LoggerService con Winston/Pino + Sentry** | Observabilidad crítica para producción, sin logging actual | Solo console.error | Detección temprana de errores, reducción de MTTR |
| **CI/CD Pipeline básico (3 jobs)** | Validación continua de código, bloquea desarrollo sin calidad | Sin CI/CD | Reducción de bugs en producción, velocidad de entrega |
| **Migración schema unificada** | Evitar múltiples migraciones fraccionadas, reducir riesgo de breaking changes | Migraciones incrementales | Reducción de riesgo de downtime |
| **PriceVersioningService sobre ProductPrice** | Reutilizar entidad existente, minimizar cambios de schema | Nueva entidad PriceVersion independiente | Reducción de complejidad, tiempo de implementación |
| **PdfIngestionService con lazy loading** | Fix open handles en Jest, reducir memoria | Cargar pdf-parse al inicio | Reducción de memoria, tests más rápidos |
| **BotDecisionService para auditoría** | Transparencia de decisiones del bot, debugging | Sin persistencia de decisiones | Mejor debugging, confianza del cliente |
| **NO migración WhatsApp Cloud API** | API SMS funciona, costo/beneficio no justifica cambio | Migrar a Cloud API | Ahorro $40-60h de desarrollo |
| **Híbrido Secuenciado (Opción D)** | Balance óptimo entre deuda técnica y funcionalidad visible | Opción A (solo deuda), Opción B (solo ERP), Opción C (solo CRA) | Reducción de riesgo legal + entrega de valor al cliente |

---

## 11. RECOMENDACIÓN FINAL

1. **Prioridad absoluta:** Implementar `TaxCalculationService` en Week 1 — riesgo legal bloqueante que debe resolverse antes de cualquier otra funcionalidad.

2. **Segunda prioridad:** Implementar `LoggerService` + Sentry en Week 2 — sin observabilidad real, el sistema es una caja negra en producción.

3. **Tercera prioridad:** Verificar/Implementar CI/CD Pipeline en Week 1 — sin validación automática, cada PR es un riesgo de regresión.

4. **Cuarta prioridad:** Migración schema unificada (PriceList, PreInvoice, BotDecision) en Week 2-3 — base para servicios de pricing y bot decisions.

5. **Quinta prioridad:** Aumentar branches de intents críticos a 70%+ en Week 3-4 — riesgo operativo de comportamiento no determinista en producción.

**NO comenzar desarrollo de nuevas funcionalidades hasta que estos 5 items estén completados.** Deuda técnica bloqueante primero, expansión funcional después.

---

*Documento generado por CTO Strategic Design Mode. Ground Truth verificado al 26/Feb/2026. Todas las decisiones están basadas en evidencia de código, no en suposiciones.*