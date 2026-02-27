# 🏗️ CTO Strategic System Design — Hago Produce Sprint 5
**Rol:** Chief Technology Officer / Enterprise Systems Architect  
**Fecha:** Sprint 5 Planning  
**Branch:** `sprint-5-planning`  
**Basado en:** Análisis directo del repositorio `nhadadn/Hago-Produce` (schema.prisma, servicios, rutas API, documentación histórica)

---

## 1. DIAGNÓSTICO EJECUTIVO

### 1.1 Lo que el código dice realmente (no lo que el backlog asume)

Después de analizar el repositorio en profundidad, el estado real es este:

**Lo que SÍ existe y funciona:**
- Schema Prisma completo y coherente: `Invoice`, `PurchaseOrder`, `ProductPrice`, `Customer`, `Supplier`, `ChatSession`, `Message`, `BotApiKey`, `AuditLog`, `ReportCache`, `NotificationLog`
- Pipeline de intents funcional: `price_lookup`, `best_supplier`, `invoice_status`, `customer_balance`, `create_order`, `create_purchase_order`, `overdue_invoices`
- `ProductPriceService` con versionado implícito (`isCurrent: true/false`) — el precio anterior no se borra, se marca como no vigente
- `PurchaseOrdersService` con generación de PDF y envío por WhatsApp/Email
- `InvoicesService` con ciclo de vida completo (DRAFT → SENT → PAID/OVERDUE)
- Webhook de Make.com para actualización de precios (`/webhooks/make/prices`)
- `ReportCache` en PostgreSQL (no Redis) — ya existe un mecanismo de caché
- `AuditLog` centralizado

**Lo que NO existe pero el backlog asume:**
- No hay `PriceEngine` como servicio independiente — la lógica de precios está dispersa entre `ProductPriceService` y los intents del chat
- No hay `CRAInvoiceService` — el campo `taxRate` en `Invoice` está hardcodeado a `0.13` sin lógica provincial
- No hay separación entre `costPrice` y `sellPrice` en el flujo de facturación — `InvoiceItem` usa `unitPrice` directamente
- No hay `PriceList` versionada como entidad — solo `ProductPrice` con `effectiveDate` e `isCurrent`
- No hay `PreInvoice` (prefactura) como entidad separada — solo `Invoice` con status `DRAFT`
- El campo `source` en `ProductPrice` tiene valor `"manual"` o `"make_automation"` — no hay fuente `"pdf_ocr"` aún
- Redis no existe en ninguna parte del código — `ReportCache` usa PostgreSQL directamente

**Deuda técnica real identificada:**
- `ProductPriceService.bulkUpdateFromMake()` tiene lógica de negocio mezclada con parsing de payload externo
- `openai-client.ts` construye prompts con string concatenation — no hay template system
- El intent `create_purchase_order` llama directamente a `PurchaseOrdersService` desde el chat — acoplamiento directo
- `source` en `ProductPrice` es un string libre, no un enum — riesgo de inconsistencia
- `PurchaseOrder` se crea directamente como `SENT` — no hay flujo DRAFT → REVIEW → SENT

### 1.2 El Problema Estratégico Real

El backlog del Sprint 5 mezcla tres capas que tienen velocidades de maduración completamente distintas:

| Capa | Madurez Actual | Velocidad de Cambio | Riesgo si se mezcla |
|------|---------------|---------------------|---------------------|
| **Core ERP Operativo** | 70% completo | Alta (iteraciones rápidas) | Bloquea todo lo demás |
| **Cumplimiento CRA** | 0% (solo taxRate hardcodeado) | Baja (regulación estable) | Requiere Core estable primero |
| **Hardening Técnico** | 30% (rate limiting, audit log) | Media | Puede hacerse en paralelo parcial |

**Mezclarlas en el mismo sprint es el error estratégico principal.**

---

## 2. IDENTIDAD DEL SISTEMA AL FINAL DEL SPRINT 5

### Definición Técnica Precisa

Hago Produce al final del Sprint 5 debe ser:

> **Un ERP transaccional de ciclo completo para distribuidores de perecederos en Canadá, con motor de precios versionado, pipeline de ingestión de documentos de proveedores, y capa de consulta omnicanal con IA — capaz de operar sin dependencias externas de terceros (Make.com, Excel, QuickBooks).**

**No es:**
- Un sistema de facturación electrónica CRA (eso es Sprint 6)
- Un sistema multi-tenant (eso es Sprint 7+)
- Un sistema de pagos (Stripe es Sprint 6)
- Una plataforma de analytics avanzado (eso es Sprint 7+)

**Sí es:**
- El sistema de registro único de verdad para precios, pedidos y facturas
- El reemplazo completo de Make.com + Excel + QuickBooks para operaciones diarias
- La base arquitectónica sobre la cual CRA y pagos se construyen en Sprint 6

### Identidad Técnica: "Operational Core ERP"

```
┌─────────────────────────────────────────────────────────────┐
│              HAGO PRODUCE — Sprint 5 Identity               │
│                                                             │
│  "Operational Core ERP for Canadian Produce Distributors"  │
│                                                             │
│  ✅ Price Intelligence Engine (versioned, multi-supplier)  │
│  ✅ Document Ingestion Pipeline (PDF → structured data)    │
│  ✅ Omnichannel Query Layer (Web + WhatsApp + Telegram)    │
│  ✅ Full Transaction Cycle (PO → PreInvoice → Invoice)     │
│  ✅ Audit Trail & Traceability                             │
│  ⏳ CRA Compliance (Sprint 6)                              │
│  ⏳ Payment Processing (Sprint 6)                          │
│  ⏳ Multi-tenancy (Sprint 7+)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. ARQUITECTURA OBJETIVO — C4 MENTAL MODEL

### 3.1 Dominio (Domain Layer)

El sistema tiene **4 dominios funcionales** claramente separables:

```
┌──────────────────────────────────────────────────────────────────┐
│                    DOMAIN BOUNDARIES                             │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   PROCUREMENT   │  │    COMMERCE     │  │   INTELLIGENCE  │  │
│  │                 │  │                 │  │                 │  │
│  │ • Supplier Mgmt │  │ • Customer Mgmt │  │ • Price Engine  │  │
│  │ • PDF Ingestion │  │ • Invoice Cycle │  │ • RAG Chat      │  │
│  │ • Price Lists   │  │ • PreInvoice    │  │ • Intent Router │  │
│  │ • PurchaseOrder │  │ • Payments(S6)  │  │ • Query Exec    │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                   │                     │           │
│           └───────────────────┼─────────────────────┘           │
│                               │                                  │
│                    ┌──────────▼──────────┐                       │
│                    │   INFRASTRUCTURE    │                       │
│                    │                     │                       │
│                    │ • Auth/RBAC         │                       │
│                    │ • Audit Log         │                       │
│                    │ • Notifications     │                       │
│                    │ • CRA Service (S6)  │                       │
│                    └─────────────────────┘                       │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Application Layer — Servicios y sus Responsabilidades

**Servicios existentes que deben REFACTORIZARSE (no reescribirse):**

| Servicio Actual | Problema | Acción Sprint 5 |
|----------------|----------|-----------------|
| `ProductPriceService` | Mezcla CRUD con lógica de versionado | Extraer `PriceVersioningService` |
| `openai-client.ts` | Prompts hardcodeados, sin template system | Crear `PromptBuilder` separado |
| `query-executor.ts` | Switch gigante sin extensibilidad | Convertir a registry pattern |
| `PurchaseOrdersService` | Crea PO directamente como SENT | Agregar estado DRAFT y flujo de aprobación |
| `bulkUpdateFromMake()` | Parsing de payload externo en servicio de dominio | Mover parsing a capa de adaptadores |

**Servicios NUEVOS que deben crearse:**

```
src/lib/services/
├── pricing/
│   ├── price-engine.service.ts      ← Motor de inteligencia de precios
│   ├── price-versioning.service.ts  ← Versionado de listas de precios
│   └── price-list.service.ts        ← Gestión de listas por proveedor
├── documents/
│   ├── pdf-ingestion.service.ts     ← Extracción de texto de PDFs
│   ├── document-mapper.service.ts   ← Mapeo configurable por proveedor
│   └── ingestion-queue.service.ts   ← Cola ligera (sin Redis aún)
├── procurement/
│   └── pre-invoice.service.ts       ← Prefactura (entre PO e Invoice)
└── chat/
    ├── prompt-builder.ts            ← Templates de prompts (extraído de openai-client)
    └── intent-registry.ts           ← Registry pattern para intents
```

### 3.3 Dónde Vive Cada Componente Crítico

#### Price Engine
**Ubicación:** `src/lib/services/pricing/price-engine.service.ts`

**Responsabilidad única:** Dado un producto y un contexto (fecha, proveedor, volumen), retornar el precio óptimo con su justificación.

**No hace:** CRUD de precios, parsing de PDFs, comunicación con chat.

**Inputs:** `{ productId, supplierId?, date?, quantity? }`  
**Output:** `{ bestPrice, supplier, margin, confidence, priceHistory[] }`

**Relación con schema actual:** Lee de `ProductPrice` donde `isCurrent = true`, con fallback a historial.

#### CRA Service (Sprint 6 — pero la interfaz se define ahora)
**Ubicación futura:** `src/lib/services/compliance/cra.service.ts`

**Por qué definir la interfaz ahora:** El modelo `Invoice` necesita campos adicionales antes de Sprint 6. Si no se agregan ahora, habrá una migración disruptiva.

**Campos que deben agregarse al schema en Sprint 5:**
```prisma
model Invoice {
  // ... campos existentes ...
  
  // CRA fields (nullable hasta Sprint 6)
  taxRegion        String?   @map("tax_region")      // "ON", "BC", "AB", etc.
  gstAmount        Decimal?  @map("gst_amount")       @db.Decimal(10, 2)
  hstAmount        Decimal?  @map("hst_amount")       @db.Decimal(10, 2)
  pstAmount        Decimal?  @map("pst_amount")       @db.Decimal(10, 2)
  craXmlGenerated  Boolean   @default(false)          @map("cra_xml_generated")
  craSubmittedAt   DateTime? @map("cra_submitted_at")
}

model Customer {
  // ... campos existentes ...
  
  // CRA fields (nullable hasta Sprint 6)
  businessNumber   String?   @map("business_number")  // BN de CRA (9 dígitos)
  province         String?   @default("ON")            // Provincia para cálculo de impuestos
}
```

**Por qué nullable:** Permite migración sin romper datos existentes. Sprint 6 los hace required.

#### Chat Layer — Desacoplamiento
**Problema actual:** El chat llama directamente a servicios de dominio (`PurchaseOrdersService`, `InvoicesService`). Esto crea acoplamiento bidireccional.

**Solución:** Introducir una capa de `CommandBus` ligera:

```
Chat Intent → CommandBus → Domain Service → Result
                ↓
           AuditLog (automático)
```

**Implementación mínima viable:**
```typescript
// src/lib/chat/command-bus.ts
type Command = CreateOrderCommand | CreatePurchaseOrderCommand | ...
type CommandHandler<T extends Command> = (cmd: T) => Promise<CommandResult>

class CommandBus {
  register<T extends Command>(type: string, handler: CommandHandler<T>): void
  execute<T extends Command>(cmd: T): Promise<CommandResult>
}
```

**Beneficio inmediato:** Los intents del chat no importan servicios de dominio directamente. El CommandBus es el único punto de entrada.

#### Versionado de Precios
**Estado actual:** `ProductPrice` con `isCurrent: boolean` e `effectiveDate`. Funciona pero no tiene concepto de "lista de precios" como unidad.

**Problema real:** Cuando un proveedor envía un PDF con 50 productos, ¿cómo se agrupa esa actualización? Actualmente son 50 registros `ProductPrice` independientes sin relación entre sí.

**Solución mínima (sin romper schema):**

```prisma
model PriceList {
  id           String         @id @default(uuid())
  supplierId   String         @map("supplier_id")
  name         String                               // "Lista Semana 2025-W10"
  source       PriceSource                          // PDF, MANUAL, API
  sourceRef    String?        @map("source_ref")    // Nombre del archivo PDF
  effectiveDate DateTime      @map("effective_date")
  isActive     Boolean        @default(true)        @map("is_active")
  createdAt    DateTime       @default(now())       @map("created_at")
  
  supplier     Supplier       @relation(...)
  prices       ProductPrice[] @relation(...)        // Relación con precios existentes
  
  @@map("price_lists")
}

enum PriceSource {
  MANUAL
  PDF_OCR
  MAKE_WEBHOOK
  API
}
```

**Cambio en `ProductPrice`:** Agregar `priceListId String? @map("price_list_id")` — nullable para no romper datos existentes.

#### Flujo PurchaseOrder → PreInvoice → Invoice → CRA XML

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ PurchaseOrder│───▶│  PreInvoice  │───▶│   Invoice    │───▶│  CRA XML     │
│              │    │              │    │              │    │  (Sprint 6)  │
│ DRAFT        │    │ DRAFT        │    │ DRAFT        │    │              │
│ SENT         │    │ APPROVED     │    │ SENT         │    │              │
│ CONFIRMED    │    │ REJECTED     │    │ PAID         │    │              │
│ RECEIVED     │    │              │    │ OVERDUE      │    │              │
│ CANCELLED    │    │              │    │ CANCELLED    │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
  AuditLog           AuditLog            AuditLog
  Notification       Notification        Notification
```

**PreInvoice como entidad:** Es el documento que el cliente aprueba antes de que se genere la factura oficial. Actualmente no existe — se usa `Invoice` con status `DRAFT` para esto, lo cual es semánticamente incorrecto.

**Implementación mínima:**
```prisma
model PreInvoice {
  id           String          @id @default(cuid())
  number       String          @unique              // PRE-YYYY-NNNN
  customerId   String          @map("customer_id")
  status       PreInvoiceStatus @default(DRAFT)
  subtotal     Decimal         @db.Decimal(10, 2)
  taxAmount    Decimal         @db.Decimal(10, 2)
  total        Decimal         @db.Decimal(10, 2)
  notes        String?
  invoiceId    String?         @unique @map("invoice_id")  // Cuando se convierte
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  
  customer     Customer        @relation(...)
  items        PreInvoiceItem[]
  invoice      Invoice?        @relation(...)
  
  @@map("pre_invoices")
}

enum PreInvoiceStatus {
  DRAFT
  SENT
  APPROVED
  REJECTED
  CONVERTED  // Se convirtió en Invoice
}
```

#### Persistencia de Decisiones del Bot
**Problema actual:** `ChatSession` almacena `messages: Json[]` — un array JSON sin estructura tipada. Las decisiones del bot (crear PO, aprobar prefactura) no tienen trazabilidad separada.

**Solución:** Agregar tabla `BotDecision`:
```prisma
model BotDecision {
  id            String   @id @default(cuid())
  sessionId     String   @map("session_id")
  intent        String   @db.VarChar(50)
  params        Json
  result        Json?
  entityType    String?  @map("entity_type")  // "purchase_order", "invoice", etc.
  entityId      String?  @map("entity_id")
  status        String   @default("pending")  // pending, confirmed, cancelled
  createdAt     DateTime @default(now())
  
  @@map("bot_decisions")
  @@index([sessionId])
  @@index([entityType, entityId])
}
```

**Beneficio:** Permite auditar qué decidió el bot, cuándo, y con qué resultado. Esencial antes de CRA.

### 3.4 Infraestructura — Redis: La Decisión Honesta

**Redis NO es necesario en Sprint 5.** Esta es la razón técnica, no una opinión:

1. `ReportCache` ya existe en PostgreSQL y funciona
2. El volumen actual (~20 PDFs/semana, operaciones B2B de baja concurrencia) no justifica la complejidad operacional de Redis
3. Upstash Redis tiene latencia de red adicional en Vercel Edge — para queries simples puede ser más lento que PostgreSQL con índices correctos
4. El problema real no es velocidad de caché, es **queries N+1 no resueltos** en `ProductService` y `DashboardService`

**Acción correcta en Sprint 5:** Resolver los queries N+1 primero. Si después de eso la latencia sigue siendo inaceptable, entonces Redis. No antes.

**Criterio para introducir Redis:** Latencia p95 > 800ms en endpoints con queries optimizados. Medir primero.

---

## 4. RIESGOS ESTRATÉGICOS REALES

### Riesgo 1: Vibecoding sin Arquitectura Estable
**Severidad: CRÍTICA**  
**Descripción:** El equipo está generando código con IA sin haber definido los boundaries de dominio. El resultado es acoplamiento creciente entre capas (chat → servicios de dominio directamente, servicios que hacen parsing de payloads externos, etc.).

**Evidencia en el código:**
- `create-purchase-order.ts` (intent) importa directamente `PurchaseOrdersService`
- `bulkUpdateFromMake()` en `ProductPriceService` mezcla parsing de webhook con lógica de dominio
- `openai-client.ts` construye prompts con lógica de negocio embebida

**Mitigación:** Definir y documentar los boundaries ANTES de generar más código. El CommandBus y el PromptBuilder son las dos piezas más urgentes.

### Riesgo 2: CRA sin CI/CD es Inviable
**Severidad: CRÍTICA**  
**Descripción:** Implementar facturación electrónica CRA sin un pipeline de CI/CD que valide cada commit es una bomba de tiempo. Un error en el XML generado puede resultar en facturas inválidas para clientes reales.

**Evidencia:** No existe `.github/workflows/ci.yml` funcional. Los tests tienen ~67% coverage con módulos críticos al 16-28%.

**Mitigación:** CI/CD es prerequisito bloqueante para CRA. No se puede iniciar CRA sin CI verde.

### Riesgo 3: Sobreingeniería del Pipeline OCR
**Severidad: ALTA**  
**Descripción:** El volumen real es ~20 PDFs/semana. Implementar BullMQ, workers, colas distribuidas para este volumen es sobreingeniería pura. El costo de mantenimiento supera el beneficio.

**Solución correcta:** Procesamiento síncrono con timeout de 30s. Si el PDF tarda más, error con retry manual. Para 20 PDFs/semana, esto es suficiente para los próximos 12 meses.

**Criterio para escalar:** > 200 PDFs/semana o > 5 proveedores simultáneos. No antes.

### Riesgo 4: Dependencia Excesiva de IA en Flujos Transaccionales
**Severidad: ALTA**  
**Descripción:** El sistema usa OpenAI para clasificar intents en flujos que crean Purchase Orders e Invoices reales. Si OpenAI falla o alucina, se crean documentos incorrectos.

**Evidencia:** `create_purchase_order` intent llama directamente a `createPurchaseOrder()` sin validación humana intermedia.

**Mitigación:** Toda acción transaccional del bot debe pasar por un estado `PENDING_CONFIRMATION` antes de ejecutarse. El `BotDecision` model resuelve esto.

### Riesgo 5: Schema Migration sin Staging
**Severidad: ALTA**  
**Descripción:** Las migraciones de Prisma en producción sin un entorno de staging son un riesgo operacional directo. Una migración fallida en Neon puede corromper datos de producción.

**Mitigación:** Staging environment es prerequisito para cualquier migración de schema. Esto debe resolverse en la primera semana del sprint.

### Riesgo 6: `taxRate: 0.13` Hardcodeado
**Severidad: MEDIA (se vuelve CRÍTICA en Sprint 6)**  
**Descripción:** El campo `taxRate` en `Invoice` tiene default `0.13` (Ontario HST). Esto es incorrecto para clientes en Alberta (0% HST), Quebec (QST diferente), etc.

**Evidencia en schema:** `taxRate Decimal @default(0.13)`

**Mitigación Sprint 5:** Agregar `taxRegion` y `province` al schema (nullable). Crear `TaxCalculationService` con tabla de tasas por provincia. No implementar CRA XML aún, pero preparar la base.

---

## 5. SPRINT 5 REESTRUCTURADO — LAS 4 VERSIONES

### Versión A: Full Stack Consolidation
**Alcance:** Core ERP + CRA + Redis + OCR + Testing + CI/CD  
**Duración estimada real:** 8-10 semanas  
**Riesgo:** EXTREMO — demasiado scope, calidad comprometida en todo  
**Veredicto:** ❌ No viable

### Versión B: Core + CRA
**Alcance:** Core ERP consolidado + CRA PoC  
**Duración estimada real:** 5-6 semanas  
**Riesgo:** ALTO — CRA requiere Core estable, que aún no lo está  
**Veredicto:** ❌ Secuencia incorrecta. CRA sobre base inestable = deuda técnica compuesta

### Versión C: Core Primero, CRA Después ✅ RECOMENDADA
**Alcance Sprint 5:** Core ERP completo + PDF Pipeline + CI/CD + Schema preparado para CRA  
**Alcance Sprint 6:** CRA + Stripe + Go-Live  
**Duración Sprint 5:** 3-4 semanas  
**Riesgo:** BAJO — secuencia correcta, scope controlado  
**Veredicto:** ✅ Esta es la opción correcta

### Versión D: Hardening Primero
**Alcance:** Solo testing, CI/CD, refactoring, Redis  
**Duración estimada real:** 2-3 semanas  
**Riesgo:** BAJO técnicamente, ALTO estratégicamente — no avanza el producto  
**Veredicto:** ❌ Necesario pero insuficiente como sprint completo

---

## 6. SPRINT 5 ELEGIDO: VERSIÓN C — "CORE CONSOLIDATION"

### Justificación de la Elección

La Versión C es la única que respeta la **dependencia técnica real**:

```
CI/CD Verde
    ↓
Schema Migrations Seguras
    ↓
Core ERP Consolidado (PriceEngine, PreInvoice, PDF Pipeline)
    ↓
Tests al 80%
    ↓
[Sprint 6] CRA + Stripe + Go-Live
```

Sin CI/CD, no hay migraciones seguras. Sin migraciones seguras, no hay CRA. Sin Core consolidado, CRA se construye sobre arena.

### Backlog Reestructurado Sprint 5

#### 🔴 BLOQUE 0 — Prerequisitos (Semana 1, Días 1-3)
*Sin esto, nada más puede avanzar con seguridad*

**S5-B0-01: CI/CD Pipeline Funcional**
- GitHub Actions: lint → typecheck → test → build
- Vercel Preview por PR
- Coverage report en cada PR
- **Criterio de salida:** Pipeline verde en `sprint-5-planning` branch

**S5-B0-02: Staging Environment**
- Neon branch para staging (feature de Neon)
- Variables de entorno separadas en Vercel
- Seed script con datos de demo
- **Criterio de salida:** URL de staging funcional con datos demo

**S5-B0-03: Schema Preparación CRA (nullable fields)**
- Agregar `taxRegion`, `gstAmount`, `hstAmount`, `pstAmount` a `Invoice` (nullable)
- Agregar `businessNumber`, `province` a `Customer` (nullable)
- Migración probada en staging primero
- **Criterio de salida:** Migración aplicada en staging sin errores, datos existentes intactos

#### 🟠 BLOQUE 1 — Core ERP Consolidado (Semana 1-2)
*El corazón del sistema*

**S5-B1-01: PriceList Entity + PriceVersioningService**
- Crear modelo `PriceList` en schema
- Crear `PriceVersioningService` (extraído de `ProductPriceService`)
- Actualizar `ProductPrice` con `priceListId` (nullable)
- Migración en staging
- Tests unitarios

**S5-B1-02: Price Engine Service**
- Crear `PriceEngineService` en `src/lib/services/pricing/`
- Lógica: dado producto + contexto → precio óptimo con justificación
- Integrar con intent `price_lookup` y `best_supplier`
- Tests unitarios con casos edge (sin precios, múltiples proveedores)

**S5-B1-03: PreInvoice Entity + Service**
- Crear modelo `PreInvoice` en schema
- Crear `PreInvoiceService`
- Endpoint `POST /api/v1/pre-invoices`
- Endpoint `PATCH /api/v1/pre-invoices/[id]/status`
- Endpoint `POST /api/v1/pre-invoices/[id]/convert` (→ Invoice)
- Tests de integración para flujo completo

**S5-B1-04: BotDecision Entity + CommandBus**
- Crear modelo `BotDecision` en schema
- Crear `CommandBus` ligero
- Migrar intents transaccionales (`create_order`, `create_purchase_order`) a CommandBus
- Estado `PENDING_CONFIRMATION` antes de ejecutar acciones reales
- Tests unitarios

#### 🟡 BLOQUE 2 — PDF Ingestion Pipeline (Semana 2)
*Reemplazo de Make.com*

**S5-B2-01: PDF Parser Service**
- Instalar `pdf-parse` (ya en ecosistema Node, sin dependencias nativas)
- Crear `PdfIngestionService` en `src/lib/services/documents/`
- Extracción de texto estructurado
- Tests con PDFs reales de proveedores

**S5-B2-02: Document Mapper Service**
- Crear `DocumentMapperService` con configuración por proveedor (JSON)
- Mapeo de campos extraídos → `ProductPrice` records
- Validación con Zod antes de persistir
- Tests con casos de PDFs malformados

**S5-B2-03: Ingestion Endpoint**
- Endpoint `POST /api/v1/documents/ingest-pdf` (multipart/form-data)
- Procesamiento síncrono (no colas — volumen no lo justifica)
- Crear `PriceList` automáticamente con `source: PDF_OCR`
- Actualizar `ProductPrice` records con `priceListId`
- Audit log de cada ingestión
- Tests de integración

**S5-B2-04: Migrar Webhook Make.com → Internal**
- Mantener endpoint `/webhooks/make/prices` funcionando (no romper)
- Agregar endpoint interno `/api/v1/documents/ingest-prices` (JSON directo)
- Actualizar `source` en `ProductPrice` a enum `PriceSource`
- Deprecar Make.com webhook (no eliminar aún — hay datos en vuelo)

#### 🟢 BLOQUE 3 — Testing & Hardening (Semana 2-3)
*Calidad no negociable*

**S5-B3-01: Coverage Críticos al 80%**
- `api-key.service.ts`: 16% → 85%
- `openai-client.ts`: 28% → 80%
- `invoices/[id]/route.ts`: 41% → 80%
- `customers/[id]/route.ts`: 41% → 80%
- `webhooks/make/route.ts`: 51% → 75%

**S5-B3-02: PromptBuilder Refactor**
- Extraer construcción de prompts de `openai-client.ts`
- Crear `PromptBuilder` con templates tipados
- Tests unitarios para cada template

**S5-B3-03: Intent Registry Refactor**
- Convertir switch en `query-executor.ts` a registry pattern
- Facilita agregar nuevos intents sin modificar el executor
- Tests de regresión para todos los intents existentes

**S5-B3-04: Queries N+1 Audit**
- Identificar y resolver queries N+1 en `ProductService` y `DashboardService`
- Agregar `select` específicos en lugar de `include` completos
- Medir latencia antes/después
- Documentar mejoras en `REFACTORING_LOG.md`

#### 🔵 BLOQUE 4 — Preparación CRA (Semana 3)
*Fundamentos para Sprint 6*

**S5-B4-01: TaxCalculationService**
- Tabla de tasas por provincia canadiense (GST/HST/PST/QST)
- Servicio que calcula impuestos dado `province` y `subtotal`
- Tests con todas las provincias
- **No genera XML CRA aún** — solo calcula correctamente

**S5-B4-02: Invoice Tax Calculation Update**
- Actualizar `InvoicesService.create()` para usar `TaxCalculationService`
- Poblar `gstAmount`, `hstAmount`, `pstAmount` en nuevas facturas
- Facturas existentes no se modifican (nullable fields)
- Tests de regresión

---

## 7. SECUENCIA REAL DE CONSTRUCCIÓN

### Por Dependencia Técnica (no por prioridad conceptual)

```
SEMANA 1 — DÍAS 1-3: FUNDAMENTOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1] CI/CD Pipeline (S5-B0-01)
    ↓ prerequisito para todo
[2] Staging Environment (S5-B0-02)
    ↓ prerequisito para migraciones
[3] Schema CRA Prep (S5-B0-03)
    ↓ migración en staging primero

SEMANA 1 — DÍAS 4-5: SCHEMA CORE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[4] PriceList + PriceSource enum (S5-B1-01 schema)
    ↓ prerequisito para PDF Pipeline
[5] PreInvoice model (S5-B1-03 schema)
    ↓ prerequisito para flujo transaccional
[6] BotDecision model (S5-B1-04 schema)
    ↓ prerequisito para CommandBus
    
    ⚠️ CHECKPOINT: Una sola migración con todos los cambios de schema
    Aplicar en staging → validar → aplicar en prod

SEMANA 2 — DÍAS 1-3: SERVICIOS CORE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[7] PriceVersioningService (S5-B1-01 service)
    ↓ prerequisito para PriceEngine
[8] PriceEngineService (S5-B1-02)
    ↓ prerequisito para actualizar intents de chat
[9] PreInvoiceService + endpoints (S5-B1-03)
    ↓ independiente, puede ir en paralelo con [8]
[10] CommandBus + BotDecision (S5-B1-04)
    ↓ prerequisito para migrar intents transaccionales

SEMANA 2 — DÍAS 4-5: PDF PIPELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[11] PdfIngestionService (S5-B2-01)
    ↓ prerequisito para DocumentMapper
[12] DocumentMapperService (S5-B2-02)
    ↓ prerequisito para endpoint
[13] Ingestion Endpoint (S5-B2-03)
    ↓ integra todo el pipeline
[14] Migrar Make.com webhook (S5-B2-04)
    ↓ puede ir en paralelo con [13]

SEMANA 3 — DÍAS 1-3: TESTING & REFACTOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[15] PromptBuilder refactor (S5-B3-02)
    ↓ independiente
[16] Intent Registry refactor (S5-B3-03)
    ↓ independiente
[17] Coverage críticos (S5-B3-01)
    ↓ después de refactors para no reescribir tests
[18] Queries N+1 audit (S5-B3-04)
    ↓ independiente

SEMANA 3 — DÍAS 4-5: CRA PREP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[19] TaxCalculationService (S5-B4-01)
    ↓ prerequisito para [20]
[20] Invoice Tax Calculation Update (S5-B4-02)
    ↓ cierre del sprint
```

### Reglas de Dependencia Críticas

1. **CI/CD antes que cualquier migración de schema** — sin pipeline verde, no hay forma segura de validar migraciones
2. **Staging antes que producción** — toda migración se prueba en staging primero
3. **Una sola migración de schema** — todos los cambios de schema (PriceList, PreInvoice, BotDecision, CRA fields) en una sola migración para minimizar downtime
4. **Servicios antes que endpoints** — los endpoints son thin wrappers sobre servicios; los servicios se testean independientemente
5. **Refactors antes que nuevos tests** — si se refactoriza `openai-client.ts`, los tests existentes pueden romperse; mejor refactorizar primero
6. **Make.com webhook se mantiene funcionando** — no se elimina hasta que el pipeline interno esté probado en producción

---

## 8. CONDICIÓN DE LISTO PARA VIBECODING

### Lo que DEBE estar decidido antes de generar código

#### Modelos de Datos (Decididos en este documento)
- [x] `PriceList` con `PriceSource` enum
- [x] `PreInvoice` con `PreInvoiceStatus` enum
- [x] `BotDecision` con estados
- [x] Campos CRA en `Invoice` y `Customer` (nullable)
- [x] `priceListId` en `ProductPrice` (nullable)

#### Boundaries de Dominio (Decididos en este documento)
- [x] `PriceEngineService` no hace CRUD — solo consulta y calcula
- [x] `CommandBus` es el único punto de entrada para acciones transaccionales del chat
- [x] `PdfIngestionService` no conoce el dominio de precios — solo extrae texto
- [x] `DocumentMapperService` no conoce el dominio de PDFs — solo mapea campos
- [x] `TaxCalculationService` no genera XML — solo calcula montos

#### Naming Conventions (Establecidas)
- Servicios de dominio: `[Entity]Service` (ej: `PreInvoiceService`)
- Servicios de infraestructura: `[Function]Service` (ej: `PdfIngestionService`)
- Servicios de inteligencia: `[Domain]EngineService` (ej: `PriceEngineService`)
- Comandos del bot: `[Action][Entity]Command` (ej: `CreatePurchaseOrderCommand`)
- Enums: PascalCase singular (ej: `PriceSource`, `PreInvoiceStatus`)

#### Separación de Responsabilidades (Establecida)
```
HTTP Layer (routes)          → Validación de request, autenticación, respuesta HTTP
Application Layer (services) → Lógica de negocio, transacciones, audit log
Domain Layer (models)        → Tipos, validaciones de dominio, invariantes
Infrastructure Layer         → DB (Prisma), Email, WhatsApp, PDF, OpenAI
```

#### Restricciones Técnicas (No Negociables)
1. **No Redis en Sprint 5** — resolver N+1 primero, medir, decidir en Sprint 6
2. **No BullMQ/colas** — procesamiento síncrono para PDFs (volumen no lo justifica)
3. **No CRA XML** — solo preparar schema y TaxCalculationService
4. **No eliminar Make.com webhook** — deprecar, no eliminar
5. **No modificar datos existentes en migraciones** — solo agregar campos nullable
6. **No llamadas directas de intents a servicios de dominio** — todo por CommandBus
7. **No prompts hardcodeados** — todo por PromptBuilder

#### Contratos de API (Nuevos endpoints Sprint 5)
```
POST   /api/v1/documents/ingest-pdf          → Ingestar PDF de proveedor
POST   /api/v1/documents/ingest-prices       → Ingestar precios (JSON, reemplaza Make)
GET    /api/v1/price-lists                   → Listar listas de precios
GET    /api/v1/price-lists/[id]              → Detalle de lista de precios
POST   /api/v1/pre-invoices                  → Crear prefactura
GET    /api/v1/pre-invoices                  → Listar prefacturas
PATCH  /api/v1/pre-invoices/[id]/status      → Cambiar estado
POST   /api/v1/pre-invoices/[id]/convert     → Convertir a Invoice
GET    /api/v1/pricing/best-price            → Consultar precio óptimo
```

---

## 9. RECOMENDACIÓN FINAL

### La Decisión

**Ejecutar Sprint 5 como "Core Consolidation" (Versión C).**

**CRA se mueve a Sprint 6.** Esta no es una concesión — es la decisión técnicamente correcta.

### Por qué esta secuencia y no otra

El sistema tiene hoy un problema de **coherencia arquitectónica**, no de falta de features. El código funciona, pero los boundaries están difusos. Agregar CRA sobre esta base es construir sobre arena.

La secuencia correcta es:
1. **Sprint 5:** Consolidar Core → CI/CD → Schema limpio → PDF Pipeline → Tests 80%
2. **Sprint 6:** CRA + Stripe + Go-Live (sobre base sólida)
3. **Sprint 7:** Redis + Multi-tenancy + Expansión (si los números lo justifican)

### Lo que NO se debe hacer

- No agregar Redis antes de resolver N+1 queries
- No implementar CRA XML antes de tener CI/CD verde
- No generar más código sin definir CommandBus primero
- No crear más intents sin migrarlos al registry pattern
- No hacer migraciones de schema en producción sin staging

### La Pregunta Honesta

> ¿Puede el equipo entregar CI/CD + Schema Migration + PriceEngine + PreInvoice + PDF Pipeline + 80% Coverage en 3-4 semanas?

**Sí, si y solo si:**
- Se respeta la secuencia de dependencias técnicas
- No se agrega scope adicional durante el sprint
- Los modelos de datos están decididos antes de escribir código
- El vibecoding se usa para implementar, no para diseñar

**No, si:**
- Se intenta hacer CRA en paralelo
- Se introduce Redis sin evidencia de necesidad
- Se generan features sin tests
- Se hacen migraciones de schema sin staging

---

## 10. DOCUMENTOS A CREAR EN SPRINT 5

| Documento | Propósito | Semana |
|-----------|-----------|--------|
| `CTO_STRATEGIC_DESIGN_SPRINT5.md` | Este documento | S1 |
| `SCHEMA_MIGRATION_PLAN.md` | Plan detallado de migración | S1 |
| `PRICE_ENGINE_SPEC.md` | Especificación del motor de precios | S1 |
| `PDF_PIPELINE_SPEC.md` | Especificación del pipeline OCR | S1 |
| `COMMAND_BUS_SPEC.md` | Especificación del CommandBus | S1 |
| `TAX_CALCULATION_SPEC.md` | Especificación del servicio de impuestos | S2 |
| `API_CONTRACTS_V2.md` | Contratos de nuevos endpoints | S1 |
| `REFACTORING_LOG.md` | Log de cambios de refactorización | S2-S3 |
| `CI_CD_SETUP.md` | Guía de configuración CI/CD | S1 |
| `STAGING_RUNBOOK.md` | Runbook del entorno de staging | S1 |

---

*Documento generado por análisis directo del repositorio `nhadadn/Hago-Produce`.*  
*Branch: `sprint-5-planning` | Commit base: análisis de schema.prisma, servicios y documentación histórica.*