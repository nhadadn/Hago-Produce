<h1>🏗️ CTO Strategic System Design — Hago Produce Sprint 5</h1><p><strong>Rol:</strong> Chief Technology Officer / Enterprise Systems Architect<br><strong>Fecha:</strong> Sprint 5 Planning<br><strong>Branch:</strong> <code>sprint-5-planning</code><br><strong>Basado en:</strong> Análisis directo del repositorio <code>nhadadn/Hago-Produce</code> (schema.prisma, servicios, rutas API, documentación histórica)</p><hr><h2>1. DIAGNÓSTICO EJECUTIVO</h2><h3>1.1 Lo que el código dice realmente (no lo que el backlog asume)</h3><p>Después de analizar el repositorio en profundidad, el estado real es este:</p><p><strong>Lo que SÍ existe y funciona:</strong></p><ul> <li>Schema Prisma completo y coherente: <code>Invoice</code>, <code>PurchaseOrder</code>, <code>ProductPrice</code>, <code>Customer</code>, <code>Supplier</code>, <code>ChatSession</code>, <code>Message</code>, <code>BotApiKey</code>, <code>AuditLog</code>, <code>ReportCache</code>, <code>NotificationLog</code></li> <li>Pipeline de intents funcional: <code>price_lookup</code>, <code>best_supplier</code>, <code>invoice_status</code>, <code>customer_balance</code>, <code>create_order</code>, <code>create_purchase_order</code>, <code>overdue_invoices</code></li> <li><code>ProductPriceService</code> con versionado implícito (<code>isCurrent: true/false</code>) — el precio anterior no se borra, se marca como no vigente</li> <li><code>PurchaseOrdersService</code> con generación de PDF y envío por WhatsApp/Email</li> <li><code>InvoicesService</code> con ciclo de vida completo (DRAFT → SENT → PAID/OVERDUE)</li> <li>Webhook de Make.com para actualización de precios (<code>/webhooks/make/prices</code>)</li> <li><code>ReportCache</code> en PostgreSQL (no Redis) — ya existe un mecanismo de caché</li> <li><code>AuditLog</code> centralizado</li> </ul><p><strong>Lo que NO existe pero el backlog asume:</strong></p><ul> <li>No hay <code>PriceEngine</code> como servicio independiente — la lógica de precios está dispersa entre <code>ProductPriceService</code> y los intents del chat</li> <li>No hay <code>CRAInvoiceService</code> — el campo <code>taxRate</code> en <code>Invoice</code> está hardcodeado a <code>0.13</code> sin lógica provincial</li> <li>No hay separación entre <code>costPrice</code> y <code>sellPrice</code> en el flujo de facturación — <code>InvoiceItem</code> usa <code>unitPrice</code> directamente</li> <li>No hay <code>PriceList</code> versionada como entidad — solo <code>ProductPrice</code> con <code>effectiveDate</code> e <code>isCurrent</code></li> <li>No hay <code>PreInvoice</code> (prefactura) como entidad separada — solo <code>Invoice</code> con status <code>DRAFT</code></li> <li>El campo <code>source</code> en <code>ProductPrice</code> tiene valor <code>"manual"</code> o <code>"make_automation"</code> — no hay fuente <code>"pdf_ocr"</code> aún</li> <li>Redis no existe en ninguna parte del código — <code>ReportCache</code> usa PostgreSQL directamente</li> </ul><p><strong>Deuda técnica real identificada:</strong></p><ul> <li><code>ProductPriceService.bulkUpdateFromMake()</code> tiene lógica de negocio mezclada con parsing de payload externo</li> <li><code>openai-client.ts</code> construye prompts con string concatenation — no hay template system</li> <li>El intent <code>create_purchase_order</code> llama directamente a <code>PurchaseOrdersService</code> desde el chat — acoplamiento directo</li> <li><code>source</code> en <code>ProductPrice</code> es un string libre, no un enum — riesgo de inconsistencia</li> <li><code>PurchaseOrder</code> se crea directamente como <code>SENT</code> — no hay flujo DRAFT → REVIEW → SENT</li> </ul><h3>1.2 El Problema Estratégico Real</h3><p>El backlog del Sprint 5 mezcla tres capas que tienen velocidades de maduración completamente distintas:</p><table class="e-rte-table"> <thead> <tr> <th>Capa</th> <th>Madurez Actual</th> <th>Velocidad de Cambio</th> <th>Riesgo si se mezcla</th> </tr> </thead> <tbody><tr> <td><strong>Core ERP Operativo</strong></td> <td>70% completo</td> <td>Alta (iteraciones rápidas)</td> <td>Bloquea todo lo demás</td> </tr> <tr> <td><strong>Cumplimiento CRA</strong></td> <td>0% (solo taxRate hardcodeado)</td> <td>Baja (regulación estable)</td> <td>Requiere Core estable primero</td> </tr> <tr> <td><strong>Hardening Técnico</strong></td> <td>30% (rate limiting, audit log)</td> <td>Media</td> <td>Puede hacerse en paralelo parcial</td> </tr> </tbody></table><p><strong>Mezclarlas en el mismo sprint es el error estratégico principal.</strong></p><hr><h2>2. IDENTIDAD DEL SISTEMA AL FINAL DEL SPRINT 5</h2><h3>Definición Técnica Precisa</h3><p>Hago Produce al final del Sprint 5 debe ser:</p><blockquote> <p><strong>Un ERP transaccional de ciclo completo para distribuidores de perecederos en Canadá, con motor de precios versionado, pipeline de ingestión de documentos de proveedores, y capa de consulta omnicanal con IA — capaz de operar sin dependencias externas de terceros (Make.com, Excel, QuickBooks).</strong></p> </blockquote><p><strong>No es:</strong></p><ul> <li>Un sistema de facturación electrónica CRA (eso es Sprint 6)</li> <li>Un sistema multi-tenant (eso es Sprint 7+)</li> <li>Un sistema de pagos (Stripe es Sprint 6)</li> <li>Una plataforma de analytics avanzado (eso es Sprint 7+)</li> </ul><p><strong>Sí es:</strong></p><ul> <li>El sistema de registro único de verdad para precios, pedidos y facturas</li> <li>El reemplazo completo de Make.com + Excel + QuickBooks para operaciones diarias</li> <li>La base arquitectónica sobre la cual CRA y pagos se construyen en Sprint 6</li> </ul><h3>Identidad Técnica: "Operational Core ERP"</h3><pre><code>┌─────────────────────────────────────────────────────────────┐
│              HAGO PRODUCE — Sprint 5 Identity               │
│                                                             │
│  "Operational Core ERP for Canadian Produce Distributors"  │
│                                                             │
│  ✅ Price Intelligence Engine (versioned, multi-supplier)  │
│  ✅ Document Ingestion Pipeline (PDF → structured data)    │
│  ✅ Omnichannel Query Layer (Web + WhatsApp + Telegram)    │
│  ✅ Full Transaction Cycle (PO → PreInvoice → Invoice)     │
│  ✅ Audit Trail &amp; Traceability                             │
│  ⏳ CRA Compliance (Sprint 6)                              │
│  ⏳ Payment Processing (Sprint 6)                          │
│  ⏳ Multi-tenancy (Sprint 7+)                              │
└─────────────────────────────────────────────────────────────┘
</code></pre><hr><h2>3. ARQUITECTURA OBJETIVO — C4 MENTAL MODEL</h2><h3>3.1 Dominio (Domain Layer)</h3><p>El sistema tiene <strong>4 dominios funcionales</strong> claramente separables:</p><pre><code>┌──────────────────────────────────────────────────────────────────┐
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
</code></pre><h3>3.2 Application Layer — Servicios y sus Responsabilidades</h3><p><strong>Servicios existentes que deben REFACTORIZARSE (no reescribirse):</strong></p><table class="e-rte-table"> <thead> <tr> <th>Servicio Actual</th> <th>Problema</th> <th>Acción Sprint 5</th> </tr> </thead> <tbody><tr> <td><code>ProductPriceService</code></td> <td>Mezcla CRUD con lógica de versionado</td> <td>Extraer <code>PriceVersioningService</code></td> </tr> <tr> <td><code>openai-client.ts</code></td> <td>Prompts hardcodeados, sin template system</td> <td>Crear <code>PromptBuilder</code> separado</td> </tr> <tr> <td><code>query-executor.ts</code></td> <td>Switch gigante sin extensibilidad</td> <td>Convertir a registry pattern</td> </tr> <tr> <td><code>PurchaseOrdersService</code></td> <td>Crea PO directamente como SENT</td> <td>Agregar estado DRAFT y flujo de aprobación</td> </tr> <tr> <td><code>bulkUpdateFromMake()</code></td> <td>Parsing de payload externo en servicio de dominio</td> <td>Mover parsing a capa de adaptadores</td> </tr> </tbody></table><p><strong>Servicios NUEVOS que deben crearse:</strong></p><pre><code>src/lib/services/
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
</code></pre><h3>3.3 Dónde Vive Cada Componente Crítico</h3><h4>Price Engine</h4><p><strong>Ubicación:</strong> <code>src/lib/services/pricing/price-engine.service.ts</code></p><p><strong>Responsabilidad única:</strong> Dado un producto y un contexto (fecha, proveedor, volumen), retornar el precio óptimo con su justificación.</p><p><strong>No hace:</strong> CRUD de precios, parsing de PDFs, comunicación con chat.</p><p><strong>Inputs:</strong> <code>{ productId, supplierId?, date?, quantity? }</code><br><strong>Output:</strong> <code>{ bestPrice, supplier, margin, confidence, priceHistory[] }</code></p><p><strong>Relación con schema actual:</strong> Lee de <code>ProductPrice</code> donde <code>isCurrent = true</code>, con fallback a historial.</p><h4>CRA Service (Sprint 6 — pero la interfaz se define ahora)</h4><p><strong>Ubicación futura:</strong> <code>src/lib/services/compliance/cra.service.ts</code></p><p><strong>Por qué definir la interfaz ahora:</strong> El modelo <code>Invoice</code> necesita campos adicionales antes de Sprint 6. Si no se agregan ahora, habrá una migración disruptiva.</p><p><strong>Campos que deben agregarse al schema en Sprint 5:</strong></p><pre><code class="language-prisma">model Invoice {
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
</code></pre><p><strong>Por qué nullable:</strong> Permite migración sin romper datos existentes. Sprint 6 los hace required.</p><h4>Chat Layer — Desacoplamiento</h4><p><strong>Problema actual:</strong> El chat llama directamente a servicios de dominio (<code>PurchaseOrdersService</code>, <code>InvoicesService</code>). Esto crea acoplamiento bidireccional.</p><p><strong>Solución:</strong> Introducir una capa de <code>CommandBus</code> ligera:</p><pre><code>Chat Intent → CommandBus → Domain Service → Result
                ↓
           AuditLog (automático)
</code></pre><p><strong>Implementación mínima viable:</strong></p><pre><code class="language-typescript">// src/lib/chat/command-bus.ts
type Command = CreateOrderCommand | CreatePurchaseOrderCommand | ...
type CommandHandler&lt;T extends Command&gt; = (cmd: T) =&gt; Promise&lt;CommandResult&gt;

class CommandBus {
  register&lt;T extends Command&gt;(type: string, handler: CommandHandler&lt;T&gt;): void
  execute&lt;T extends Command&gt;(cmd: T): Promise&lt;CommandResult&gt;
}
</code></pre><p><strong>Beneficio inmediato:</strong> Los intents del chat no importan servicios de dominio directamente. El CommandBus es el único punto de entrada.</p><h4>Versionado de Precios</h4><p><strong>Estado actual:</strong> <code>ProductPrice</code> con <code>isCurrent: boolean</code> e <code>effectiveDate</code>. Funciona pero no tiene concepto de "lista de precios" como unidad.</p><p><strong>Problema real:</strong> Cuando un proveedor envía un PDF con 50 productos, ¿cómo se agrupa esa actualización? Actualmente son 50 registros <code>ProductPrice</code> independientes sin relación entre sí.</p><p><strong>Solución mínima (sin romper schema):</strong></p><pre><code class="language-prisma">model PriceList {
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
</code></pre><p><strong>Cambio en <code>ProductPrice</code>:</strong> Agregar <code>priceListId String? @map("price_list_id")</code> — nullable para no romper datos existentes.</p><h4>Flujo PurchaseOrder → PreInvoice → Invoice → CRA XML</h4><pre><code>┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
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
</code></pre><p><strong>PreInvoice como entidad:</strong> Es el documento que el cliente aprueba antes de que se genere la factura oficial. Actualmente no existe — se usa <code>Invoice</code> con status <code>DRAFT</code> para esto, lo cual es semánticamente incorrecto.</p><p><strong>Implementación mínima:</strong></p><pre><code class="language-prisma">model PreInvoice {
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
</code></pre><h4>Persistencia de Decisiones del Bot</h4><p><strong>Problema actual:</strong> <code>ChatSession</code> almacena <code>messages: Json[]</code> — un array JSON sin estructura tipada. Las decisiones del bot (crear PO, aprobar prefactura) no tienen trazabilidad separada.</p><p><strong>Solución:</strong> Agregar tabla <code>BotDecision</code>:</p><pre><code class="language-prisma">model BotDecision {
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
</code></pre><p><strong>Beneficio:</strong> Permite auditar qué decidió el bot, cuándo, y con qué resultado. Esencial antes de CRA.</p><h3>3.4 Infraestructura — Redis: La Decisión Honesta</h3><p><strong>Redis NO es necesario en Sprint 5.</strong> Esta es la razón técnica, no una opinión:</p><ol> <li><code>ReportCache</code> ya existe en PostgreSQL y funciona</li> <li>El volumen actual (~20 PDFs/semana, operaciones B2B de baja concurrencia) no justifica la complejidad operacional de Redis</li> <li>Upstash Redis tiene latencia de red adicional en Vercel Edge — para queries simples puede ser más lento que PostgreSQL con índices correctos</li> <li>El problema real no es velocidad de caché, es <strong>queries N+1 no resueltos</strong> en <code>ProductService</code> y <code>DashboardService</code></li> </ol><p><strong>Acción correcta en Sprint 5:</strong> Resolver los queries N+1 primero. Si después de eso la latencia sigue siendo inaceptable, entonces Redis. No antes.</p><p><strong>Criterio para introducir Redis:</strong> Latencia p95 &gt; 800ms en endpoints con queries optimizados. Medir primero.</p><hr><h2>4. RIESGOS ESTRATÉGICOS REALES</h2><h3>Riesgo 1: Vibecoding sin Arquitectura Estable</h3><p><strong>Severidad: CRÍTICA</strong><br><strong>Descripción:</strong> El equipo está generando código con IA sin haber definido los boundaries de dominio. El resultado es acoplamiento creciente entre capas (chat → servicios de dominio directamente, servicios que hacen parsing de payloads externos, etc.).</p><p><strong>Evidencia en el código:</strong></p><ul> <li><code>create-purchase-order.ts</code> (intent) importa directamente <code>PurchaseOrdersService</code></li> <li><code>bulkUpdateFromMake()</code> en <code>ProductPriceService</code> mezcla parsing de webhook con lógica de dominio</li> <li><code>openai-client.ts</code> construye prompts con lógica de negocio embebida</li> </ul><p><strong>Mitigación:</strong> Definir y documentar los boundaries ANTES de generar más código. El CommandBus y el PromptBuilder son las dos piezas más urgentes.</p><h3>Riesgo 2: CRA sin CI/CD es Inviable</h3><p><strong>Severidad: CRÍTICA</strong><br><strong>Descripción:</strong> Implementar facturación electrónica CRA sin un pipeline de CI/CD que valide cada commit es una bomba de tiempo. Un error en el XML generado puede resultar en facturas inválidas para clientes reales.</p><p><strong>Evidencia:</strong> No existe <code>.github/workflows/ci.yml</code> funcional. Los tests tienen ~67% coverage con módulos críticos al 16-28%.</p><p><strong>Mitigación:</strong> CI/CD es prerequisito bloqueante para CRA. No se puede iniciar CRA sin CI verde.</p><h3>Riesgo 3: Sobreingeniería del Pipeline OCR</h3><p><strong>Severidad: ALTA</strong><br><strong>Descripción:</strong> El volumen real es ~20 PDFs/semana. Implementar BullMQ, workers, colas distribuidas para este volumen es sobreingeniería pura. El costo de mantenimiento supera el beneficio.</p><p><strong>Solución correcta:</strong> Procesamiento síncrono con timeout de 30s. Si el PDF tarda más, error con retry manual. Para 20 PDFs/semana, esto es suficiente para los próximos 12 meses.</p><p><strong>Criterio para escalar:</strong> &gt; 200 PDFs/semana o &gt; 5 proveedores simultáneos. No antes.</p><h3>Riesgo 4: Dependencia Excesiva de IA en Flujos Transaccionales</h3><p><strong>Severidad: ALTA</strong><br><strong>Descripción:</strong> El sistema usa OpenAI para clasificar intents en flujos que crean Purchase Orders e Invoices reales. Si OpenAI falla o alucina, se crean documentos incorrectos.</p><p><strong>Evidencia:</strong> <code>create_purchase_order</code> intent llama directamente a <code>createPurchaseOrder()</code> sin validación humana intermedia.</p><p><strong>Mitigación:</strong> Toda acción transaccional del bot debe pasar por un estado <code>PENDING_CONFIRMATION</code> antes de ejecutarse. El <code>BotDecision</code> model resuelve esto.</p><h3>Riesgo 5: Schema Migration sin Staging</h3><p><strong>Severidad: ALTA</strong><br><strong>Descripción:</strong> Las migraciones de Prisma en producción sin un entorno de staging son un riesgo operacional directo. Una migración fallida en Neon puede corromper datos de producción.</p><p><strong>Mitigación:</strong> Staging environment es prerequisito para cualquier migración de schema. Esto debe resolverse en la primera semana del sprint.</p><h3>Riesgo 6: <code>taxRate: 0.13</code> Hardcodeado</h3><p><strong>Severidad: MEDIA (se vuelve CRÍTICA en Sprint 6)</strong><br><strong>Descripción:</strong> El campo <code>taxRate</code> en <code>Invoice</code> tiene default <code>0.13</code> (Ontario HST). Esto es incorrecto para clientes en Alberta (0% HST), Quebec (QST diferente), etc.</p><p><strong>Evidencia en schema:</strong> <code>taxRate Decimal @default(0.13)</code></p><p><strong>Mitigación Sprint 5:</strong> Agregar <code>taxRegion</code> y <code>province</code> al schema (nullable). Crear <code>TaxCalculationService</code> con tabla de tasas por provincia. No implementar CRA XML aún, pero preparar la base.</p><hr><h2>5. SPRINT 5 REESTRUCTURADO — LAS 4 VERSIONES</h2><h3>Versión A: Full Stack Consolidation</h3><p><strong>Alcance:</strong> Core ERP + CRA + Redis + OCR + Testing + CI/CD<br><strong>Duración estimada real:</strong> 8-10 semanas<br><strong>Riesgo:</strong> EXTREMO — demasiado scope, calidad comprometida en todo<br><strong>Veredicto:</strong> ❌ No viable</p><h3>Versión B: Core + CRA</h3><p><strong>Alcance:</strong> Core ERP consolidado + CRA PoC<br><strong>Duración estimada real:</strong> 5-6 semanas<br><strong>Riesgo:</strong> ALTO — CRA requiere Core estable, que aún no lo está<br><strong>Veredicto:</strong> ❌ Secuencia incorrecta. CRA sobre base inestable = deuda técnica compuesta</p><h3>Versión C: Core Primero, CRA Después ✅ RECOMENDADA</h3><p><strong>Alcance Sprint 5:</strong> Core ERP completo + PDF Pipeline + CI/CD + Schema preparado para CRA<br><strong>Alcance Sprint 6:</strong> CRA + Stripe + Go-Live<br><strong>Duración Sprint 5:</strong> 3-4 semanas<br><strong>Riesgo:</strong> BAJO — secuencia correcta, scope controlado<br><strong>Veredicto:</strong> ✅ Esta es la opción correcta</p><h3>Versión D: Hardening Primero</h3><p><strong>Alcance:</strong> Solo testing, CI/CD, refactoring, Redis<br><strong>Duración estimada real:</strong> 2-3 semanas<br><strong>Riesgo:</strong> BAJO técnicamente, ALTO estratégicamente — no avanza el producto<br><strong>Veredicto:</strong> ❌ Necesario pero insuficiente como sprint completo</p><hr><h2>6. SPRINT 5 ELEGIDO: VERSIÓN C — "CORE CONSOLIDATION"</h2><h3>Justificación de la Elección</h3><p>La Versión C es la única que respeta la <strong>dependencia técnica real</strong>:</p><pre><code>CI/CD Verde
    ↓
Schema Migrations Seguras
    ↓
Core ERP Consolidado (PriceEngine, PreInvoice, PDF Pipeline)
    ↓
Tests al 80%
    ↓
[Sprint 6] CRA + Stripe + Go-Live
</code></pre><p>Sin CI/CD, no hay migraciones seguras. Sin migraciones seguras, no hay CRA. Sin Core consolidado, CRA se construye sobre arena.</p><h3>Backlog Reestructurado Sprint 5</h3><h4>🔴 BLOQUE 0 — Prerequisitos (Semana 1, Días 1-3)</h4><p><em>Sin esto, nada más puede avanzar con seguridad</em></p><p><strong>S5-B0-01: CI/CD Pipeline Funcional</strong></p><ul> <li>GitHub Actions: lint → typecheck → test → build</li> <li>Vercel Preview por PR</li> <li>Coverage report en cada PR</li> <li><strong>Criterio de salida:</strong> Pipeline verde en <code>sprint-5-planning</code> branch</li> </ul><p><strong>S5-B0-02: Staging Environment</strong></p><ul> <li>Neon branch para staging (feature de Neon)</li> <li>Variables de entorno separadas en Vercel</li> <li>Seed script con datos de demo</li> <li><strong>Criterio de salida:</strong> URL de staging funcional con datos demo</li> </ul><p><strong>S5-B0-03: Schema Preparación CRA (nullable fields)</strong></p><ul> <li>Agregar <code>taxRegion</code>, <code>gstAmount</code>, <code>hstAmount</code>, <code>pstAmount</code> a <code>Invoice</code> (nullable)</li> <li>Agregar <code>businessNumber</code>, <code>province</code> a <code>Customer</code> (nullable)</li> <li>Migración probada en staging primero</li> <li><strong>Criterio de salida:</strong> Migración aplicada en staging sin errores, datos existentes intactos</li> </ul><h4>🟠 BLOQUE 1 — Core ERP Consolidado (Semana 1-2)</h4><p><em>El corazón del sistema</em></p><p><strong>S5-B1-01: PriceList Entity + PriceVersioningService</strong></p><ul> <li>Crear modelo <code>PriceList</code> en schema</li> <li>Crear <code>PriceVersioningService</code> (extraído de <code>ProductPriceService</code>)</li> <li>Actualizar <code>ProductPrice</code> con <code>priceListId</code> (nullable)</li> <li>Migración en staging</li> <li>Tests unitarios</li> </ul><p><strong>S5-B1-02: Price Engine Service</strong></p><ul> <li>Crear <code>PriceEngineService</code> en <code>src/lib/services/pricing/</code></li> <li>Lógica: dado producto + contexto → precio óptimo con justificación</li> <li>Integrar con intent <code>price_lookup</code> y <code>best_supplier</code></li> <li>Tests unitarios con casos edge (sin precios, múltiples proveedores)</li> </ul><p><strong>S5-B1-03: PreInvoice Entity + Service</strong></p><ul> <li>Crear modelo <code>PreInvoice</code> en schema</li> <li>Crear <code>PreInvoiceService</code></li> <li>Endpoint <code>POST /api/v1/pre-invoices</code></li> <li>Endpoint <code>PATCH /api/v1/pre-invoices/[id]/status</code></li> <li>Endpoint <code>POST /api/v1/pre-invoices/[id]/convert</code> (→ Invoice)</li> <li>Tests de integración para flujo completo</li> </ul><p><strong>S5-B1-04: BotDecision Entity + CommandBus</strong></p><ul> <li>Crear modelo <code>BotDecision</code> en schema</li> <li>Crear <code>CommandBus</code> ligero</li> <li>Migrar intents transaccionales (<code>create_order</code>, <code>create_purchase_order</code>) a CommandBus</li> <li>Estado <code>PENDING_CONFIRMATION</code> antes de ejecutar acciones reales</li> <li>Tests unitarios</li> </ul><h4>🟡 BLOQUE 2 — PDF Ingestion Pipeline (Semana 2)</h4><p><em>Reemplazo de Make.com</em></p><p><strong>S5-B2-01: PDF Parser Service</strong></p><ul> <li>Instalar <code>pdf-parse</code> (ya en ecosistema Node, sin dependencias nativas)</li> <li>Crear <code>PdfIngestionService</code> en <code>src/lib/services/documents/</code></li> <li>Extracción de texto estructurado</li> <li>Tests con PDFs reales de proveedores</li> </ul><p><strong>S5-B2-02: Document Mapper Service</strong></p><ul> <li>Crear <code>DocumentMapperService</code> con configuración por proveedor (JSON)</li> <li>Mapeo de campos extraídos → <code>ProductPrice</code> records</li> <li>Validación con Zod antes de persistir</li> <li>Tests con casos de PDFs malformados</li> </ul><p><strong>S5-B2-03: Ingestion Endpoint</strong></p><ul> <li>Endpoint <code>POST /api/v1/documents/ingest-pdf</code> (multipart/form-data)</li> <li>Procesamiento síncrono (no colas — volumen no lo justifica)</li> <li>Crear <code>PriceList</code> automáticamente con <code>source: PDF_OCR</code></li> <li>Actualizar <code>ProductPrice</code> records con <code>priceListId</code></li> <li>Audit log de cada ingestión</li> <li>Tests de integración</li> </ul><p><strong>S5-B2-04: Migrar Webhook Make.com → Internal</strong></p><ul> <li>Mantener endpoint <code>/webhooks/make/prices</code> funcionando (no romper)</li> <li>Agregar endpoint interno <code>/api/v1/documents/ingest-prices</code> (JSON directo)</li> <li>Actualizar <code>source</code> en <code>ProductPrice</code> a enum <code>PriceSource</code></li> <li>Deprecar Make.com webhook (no eliminar aún — hay datos en vuelo)</li> </ul><h4>🟢 BLOQUE 3 — Testing &amp; Hardening (Semana 2-3)</h4><p><em>Calidad no negociable</em></p><p><strong>S5-B3-01: Coverage Críticos al 80%</strong></p><ul> <li><code>api-key.service.ts</code>: 16% → 85%</li> <li><code>openai-client.ts</code>: 28% → 80%</li> <li><code>invoices/[id]/route.ts</code>: 41% → 80%</li> <li><code>customers/[id]/route.ts</code>: 41% → 80%</li> <li><code>webhooks/make/route.ts</code>: 51% → 75%</li> </ul><p><strong>S5-B3-02: PromptBuilder Refactor</strong></p><ul> <li>Extraer construcción de prompts de <code>openai-client.ts</code></li> <li>Crear <code>PromptBuilder</code> con templates tipados</li> <li>Tests unitarios para cada template</li> </ul><p><strong>S5-B3-03: Intent Registry Refactor</strong></p><ul> <li>Convertir switch en <code>query-executor.ts</code> a registry pattern</li> <li>Facilita agregar nuevos intents sin modificar el executor</li> <li>Tests de regresión para todos los intents existentes</li> </ul><p><strong>S5-B3-04: Queries N+1 Audit</strong></p><ul> <li>Identificar y resolver queries N+1 en <code>ProductService</code> y <code>DashboardService</code></li> <li>Agregar <code>select</code> específicos en lugar de <code>include</code> completos</li> <li>Medir latencia antes/después</li> <li>Documentar mejoras en <code>REFACTORING_LOG.md</code></li> </ul><h4>🔵 BLOQUE 4 — Preparación CRA (Semana 3)</h4><p><em>Fundamentos para Sprint 6</em></p><p><strong>S5-B4-01: TaxCalculationService</strong></p><ul> <li>Tabla de tasas por provincia canadiense (GST/HST/PST/QST)</li> <li>Servicio que calcula impuestos dado <code>province</code> y <code>subtotal</code></li> <li>Tests con todas las provincias</li> <li><strong>No genera XML CRA aún</strong> — solo calcula correctamente</li> </ul><p><strong>S5-B4-02: Invoice Tax Calculation Update</strong></p><ul> <li>Actualizar <code>InvoicesService.create()</code> para usar <code>TaxCalculationService</code></li> <li>Poblar <code>gstAmount</code>, <code>hstAmount</code>, <code>pstAmount</code> en nuevas facturas</li> <li>Facturas existentes no se modifican (nullable fields)</li> <li>Tests de regresión</li> </ul><hr><h2>7. SECUENCIA REAL DE CONSTRUCCIÓN</h2><h3>Por Dependencia Técnica (no por prioridad conceptual)</h3><pre><code>SEMANA 1 — DÍAS 1-3: FUNDAMENTOS
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

SEMANA 3 — DÍAS 1-3: TESTING &amp; REFACTOR
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
</code></pre><h3>Reglas de Dependencia Críticas</h3><ol> <li><strong>CI/CD antes que cualquier migración de schema</strong> — sin pipeline verde, no hay forma segura de validar migraciones</li> <li><strong>Staging antes que producción</strong> — toda migración se prueba en staging primero</li> <li><strong>Una sola migración de schema</strong> — todos los cambios de schema (PriceList, PreInvoice, BotDecision, CRA fields) en una sola migración para minimizar downtime</li> <li><strong>Servicios antes que endpoints</strong> — los endpoints son thin wrappers sobre servicios; los servicios se testean independientemente</li> <li><strong>Refactors antes que nuevos tests</strong> — si se refactoriza <code>openai-client.ts</code>, los tests existentes pueden romperse; mejor refactorizar primero</li> <li><strong>Make.com webhook se mantiene funcionando</strong> — no se elimina hasta que el pipeline interno esté probado en producción</li> </ol><hr><h2>8. CONDICIÓN DE LISTO PARA VIBECODING</h2><h3>Lo que DEBE estar decidido antes de generar código</h3><h4>Modelos de Datos (Decididos en este documento)</h4><ul> <li><input checked="" disabled="" type="checkbox"> <code>PriceList</code> con <code>PriceSource</code> enum</li> <li><input checked="" disabled="" type="checkbox"> <code>PreInvoice</code> con <code>PreInvoiceStatus</code> enum</li> <li><input checked="" disabled="" type="checkbox"> <code>BotDecision</code> con estados</li> <li><input checked="" disabled="" type="checkbox"> Campos CRA en <code>Invoice</code> y <code>Customer</code> (nullable)</li> <li><input checked="" disabled="" type="checkbox"> <code>priceListId</code> en <code>ProductPrice</code> (nullable)</li> </ul><h4>Boundaries de Dominio (Decididos en este documento)</h4><ul> <li><input checked="" disabled="" type="checkbox"> <code>PriceEngineService</code> no hace CRUD — solo consulta y calcula</li> <li><input checked="" disabled="" type="checkbox"> <code>CommandBus</code> es el único punto de entrada para acciones transaccionales del chat</li> <li><input checked="" disabled="" type="checkbox"> <code>PdfIngestionService</code> no conoce el dominio de precios — solo extrae texto</li> <li><input checked="" disabled="" type="checkbox"> <code>DocumentMapperService</code> no conoce el dominio de PDFs — solo mapea campos</li> <li><input checked="" disabled="" type="checkbox"> <code>TaxCalculationService</code> no genera XML — solo calcula montos</li> </ul><h4>Naming Conventions (Establecidas)</h4><ul> <li>Servicios de dominio: <code>[Entity]Service</code> (ej: <code>PreInvoiceService</code>)</li> <li>Servicios de infraestructura: <code>[Function]Service</code> (ej: <code>PdfIngestionService</code>)</li> <li>Servicios de inteligencia: <code>[Domain]EngineService</code> (ej: <code>PriceEngineService</code>)</li> <li>Comandos del bot: <code>[Action][Entity]Command</code> (ej: <code>CreatePurchaseOrderCommand</code>)</li> <li>Enums: PascalCase singular (ej: <code>PriceSource</code>, <code>PreInvoiceStatus</code>)</li> </ul><h4>Separación de Responsabilidades (Establecida)</h4><pre><code>HTTP Layer (routes)          → Validación de request, autenticación, respuesta HTTP
Application Layer (services) → Lógica de negocio, transacciones, audit log
Domain Layer (models)        → Tipos, validaciones de dominio, invariantes
Infrastructure Layer         → DB (Prisma), Email, WhatsApp, PDF, OpenAI
</code></pre><h4>Restricciones Técnicas (No Negociables)</h4><ol> <li><strong>No Redis en Sprint 5</strong> — resolver N+1 primero, medir, decidir en Sprint 6</li> <li><strong>No BullMQ/colas</strong> — procesamiento síncrono para PDFs (volumen no lo justifica)</li> <li><strong>No CRA XML</strong> — solo preparar schema y TaxCalculationService</li> <li><strong>No eliminar Make.com webhook</strong> — deprecar, no eliminar</li> <li><strong>No modificar datos existentes en migraciones</strong> — solo agregar campos nullable</li> <li><strong>No llamadas directas de intents a servicios de dominio</strong> — todo por CommandBus</li> <li><strong>No prompts hardcodeados</strong> — todo por PromptBuilder</li> </ol><h4>Contratos de API (Nuevos endpoints Sprint 5)</h4><pre><code>POST   /api/v1/documents/ingest-pdf          → Ingestar PDF de proveedor
POST   /api/v1/documents/ingest-prices       → Ingestar precios (JSON, reemplaza Make)
GET    /api/v1/price-lists                   → Listar listas de precios
GET    /api/v1/price-lists/[id]              → Detalle de lista de precios
POST   /api/v1/pre-invoices                  → Crear prefactura
GET    /api/v1/pre-invoices                  → Listar prefacturas
PATCH  /api/v1/pre-invoices/[id]/status      → Cambiar estado
POST   /api/v1/pre-invoices/[id]/convert     → Convertir a Invoice
GET    /api/v1/pricing/best-price            → Consultar precio óptimo
</code></pre><hr><h2>9. RECOMENDACIÓN FINAL</h2><h3>La Decisión</h3><p><strong>Ejecutar Sprint 5 como "Core Consolidation" (Versión C).</strong></p><p><strong>CRA se mueve a Sprint 6.</strong> Esta no es una concesión — es la decisión técnicamente correcta.</p><h3>Por qué esta secuencia y no otra</h3><p>El sistema tiene hoy un problema de <strong>coherencia arquitectónica</strong>, no de falta de features. El código funciona, pero los boundaries están difusos. Agregar CRA sobre esta base es construir sobre arena.</p><p>La secuencia correcta es:</p><ol> <li><strong>Sprint 5:</strong> Consolidar Core → CI/CD → Schema limpio → PDF Pipeline → Tests 80%</li> <li><strong>Sprint 6:</strong> CRA + Stripe + Go-Live (sobre base sólida)</li> <li><strong>Sprint 7:</strong> Redis + Multi-tenancy + Expansión (si los números lo justifican)</li> </ol><h3>Lo que NO se debe hacer</h3><ul> <li>No agregar Redis antes de resolver N+1 queries</li> <li>No implementar CRA XML antes de tener CI/CD verde</li> <li>No generar más código sin definir CommandBus primero</li> <li>No crear más intents sin migrarlos al registry pattern</li> <li>No hacer migraciones de schema en producción sin staging</li> </ul><h3>La Pregunta Honesta</h3><blockquote> <p>¿Puede el equipo entregar CI/CD + Schema Migration + PriceEngine + PreInvoice + PDF Pipeline + 80% Coverage en 3-4 semanas?</p> </blockquote><p><strong>Sí, si y solo si:</strong></p><ul> <li>Se respeta la secuencia de dependencias técnicas</li> <li>No se agrega scope adicional durante el sprint</li> <li>Los modelos de datos están decididos antes de escribir código</li> <li>El vibecoding se usa para implementar, no para diseñar</li> </ul><p><strong>No, si:</strong></p><ul> <li>Se intenta hacer CRA en paralelo</li> <li>Se introduce Redis sin evidencia de necesidad</li> <li>Se generan features sin tests</li> <li>Se hacen migraciones de schema sin staging</li> </ul><hr><h2>10. DOCUMENTOS A CREAR EN SPRINT 5</h2><table class="e-rte-table"> <thead> <tr> <th>Documento</th> <th>Propósito</th> <th>Semana</th> </tr> </thead> <tbody><tr> <td><code>CTO_STRATEGIC_DESIGN_SPRINT5.md</code></td> <td>Este documento</td> <td>S1</td> </tr> <tr> <td><code>SCHEMA_MIGRATION_PLAN.md</code></td> <td>Plan detallado de migración</td> <td>S1</td> </tr> <tr> <td><code>PRICE_ENGINE_SPEC.md</code></td> <td>Especificación del motor de precios</td> <td>S1</td> </tr> <tr> <td><code>PDF_PIPELINE_SPEC.md</code></td> <td>Especificación del pipeline OCR</td> <td>S1</td> </tr> <tr> <td><code>COMMAND_BUS_SPEC.md</code></td> <td>Especificación del CommandBus</td> <td>S1</td> </tr> <tr> <td><code>TAX_CALCULATION_SPEC.md</code></td> <td>Especificación del servicio de impuestos</td> <td>S2</td> </tr> <tr> <td><code>API_CONTRACTS_V2.md</code></td> <td>Contratos de nuevos endpoints</td> <td>S1</td> </tr> <tr> <td><code>REFACTORING_LOG.md</code></td> <td>Log de cambios de refactorización</td> <td>S2-S3</td> </tr> <tr> <td><code>CI_CD_SETUP.md</code></td> <td>Guía de configuración CI/CD</td> <td>S1</td> </tr> <tr> <td><code>STAGING_RUNBOOK.md</code></td> <td>Runbook del entorno de staging</td> <td>S1</td> </tr> </tbody></table><hr><p><em>Documento generado por análisis directo del repositorio <code>nhadadn/Hago-Produce</code>.</em><br><em>Branch: <code>sprint-5-planning</code> | Commit base: análisis de schema.prisma, servicios y documentación histórica.</em></p>