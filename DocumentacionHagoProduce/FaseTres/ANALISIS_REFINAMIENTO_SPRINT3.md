# 📊 ANÁLISIS Y REFINAMIENTO DE PROMPTS - SPRINT 3
## Hago Produce | Basado en Checkpoint Sprint 2 + Nuevos Requerimientos

> **Fecha:** 2026-02-23  
> **Objetivo:** Refinar prompts existentes y agregar nuevas funcionalidades críticas  
> **Enfoque:** Facturación inteligente, órdenes de compra automatizadas, UX optimizada

---

## 1. ANÁLISIS DEL CHECKPOINT SPRINT 2

### 1.1 Logros Clave del Sprint 2

| Componente | Estado | Impacto en Sprint 3 |
|------------|--------|---------------------|
| **Chat Hardening** | ✅ Completado | Base sólida para nuevas funcionalidades de chat |
| **RAG Real** | ✅ Completado | Contexto de negocio disponible para facturación inteligente |
| **Make.com → DB** | ✅ Completado | Datos de precios actualizados en tiempo real |
| **WhatsApp Real** | ✅ Completado | Canal de notificaciones operativo |
| **Documentación** | ✅ Completada | Guías operativas disponibles |

### 1.2 Gaps Críticos Identificados

| GAP ID | Descripción | Prioridad Sprint 3 |
|--------|-------------|---------------------|
| **GAP-S2-02** | `create_order` sin parsing estructurado de OpenAI | 🔴 CRÍTICA |
| **GAP-S2-04** | E2E Firefox timeout | 🔴 CRÍTICA |
| **GAP-S2-07** | ReportCache sin uso | 🟡 MEDIA |
| **GAP-S2-09** | SPA pública no implementada | 🟡 MEDIA |
| **GAP-S2-10** | Portal cliente sin gráficos avanzados | 🟡 MEDIA |

### 1.3 Lecciones Aprendidas del Sprint 2

1. **META-PROMPTS funcionan bien** → Mantener estructura de prompts agrupados
2. **Patrones reutilizables** → Rate limiting, audit logging, notificaciones
3. **Documentación operativa es clave** → docs-as-code reduce brecha implementación-operación
4. **Integraciones no-code son parte del sistema** → Deben tener mismo nivel de versionado
5. **Testing E2E requiere atención especial** → Firefox timeout debe priorizarse

---

## 2. NUEVAS FUNCIONALIDADES SOLICITADAS

### 2.1 Facturación Inteligente Multi-Canal

**Requerimiento:** El chatbot debe poder crear y enviar facturas a los clientes por correo/WhatsApp/Telegram según preferencias.

**Ejemplo de uso:**
```
Usuario: "Crea una factura para el cliente Tomato King en base a la orden de compra XXX, ya fue confirmada y aprobada."
```

**Componentes necesarios:**
1. **Intent `create_invoice_from_order`** - Detectar solicitud de creación de factura
2. **Validación de orden de compra** - Verificar que la orden existe y está aprobada
3. **Generación de factura** - Crear Invoice DRAFT → SENT
4. **Detección de preferencias de canal** - Leer `preferredChannel` del cliente
5. **Envío multi-canal** - WhatsApp (Twilio), Email (SendGrid/Resend), Telegram (Bot API)
6. **Confirmación de envío** - Registrar en `NotificationLog`

### 2.2 Órdenes de Compra Inteligentes

**Requerimiento:** El chatbot debe poder crear y enviar órdenes de compra con automatización, sugiriendo proveedores y precios actuales.

**Ejemplo de uso:**
```
Usuario: "El cliente Tomato King requiere 15 chiles, 12 manzanas para el día de hoy a las 5 pm. Enviale esta orden a Pedro con posible mejor proveedor y precio actual de la compra."
```

**Componentes necesarios:**
1. **Intent `create_purchase_order`** - Detectar solicitud de orden de compra
2. **Extracción de productos y cantidades** - OpenAI Function Calling
3. **Búsqueda de mejores proveedores** - Query a `ProductPrice` con `is_current=true`
4. **Cálculo de costos totales** - Suma de precios unitarios × cantidades
5. **Generación de orden de compra** - Crear registro en DB (nuevo modelo `PurchaseOrder`)
6. **Envío a proveedor** - WhatsApp/Email según preferencias del proveedor
7. **Notificación al cliente** - Confirmación de orden enviada

### 2.3 Decisiones de Arquitectura

| Funcionalidad | Implementación Interna | Make.com | Justificación |
|--------------|------------------------|----------|---------------|
| **Envío de facturas por Email** | ✅ Recomendado | ❌ | Simple, sin dependencias externas |
| **Envío de facturas por WhatsApp** | ✅ Ya implementado (Twilio) | ❌ | Ya integrado en Sprint 2 |
| **Envío de facturas por Telegram** | ✅ Recomendado | ❌ | API simple, control total |
| **Sugerencia de mejores proveedores** | ✅ Recomendado | ❌ | Lógica de negocio core |
| **Envío de órdenes a proveedores** | ✅ Recomendado | ❌ | Flujo crítico de negocio |
| **Generación de PDF de facturas** | ✅ Recomendado | ❌ | Ya existe lógica en `export.ts` |
| **Notificaciones de estado** | ✅ Ya implementado | ❌ | Servicio de notificaciones listo |

**Justificación general:** Priorizar implementaciones internas para:
- Mayor control y debugging
- Menor dependencia de servicios externos
- Mejor performance (sin latencia de Make.com)
- Costos reducidos (sin créditos de Make.com)
- Testing más sencillo

**Cuándo usar Make.com:**
- Integraciones con sistemas externos complejos (QuickBooks, ERP legacy)
- Automatizaciones que requieren lógica visual/no-code
- Procesos que necesitan ser modificados por usuarios no técnicos

---

## 3. PROMPTS REFINADOS PARA SPRINT 3

### 3.1 S3-P01: create_order con OpenAI Function Calling

**Estado Original:** Prompt existente en `PROMPTS_SPRINT3_DETALLADOS.md`  
**Refinamiento Necesario:** ✅ SÍ - Agregar soporte para envío multi-canal

#### Versión Refinada - S3-P01-A (Extracción de Parámetros)

```markdown
PROMPT #S3-P01-A — create_order: Extracción de Parámetros con OpenAI Function Calling
---
Agente: Desarrollador Full Stack / AI Engineer
Resumen: Implementar la extracción estructurada de parámetros para el intent create_order
usando OpenAI Function Calling, permitiendo al chat crear borradores de factura reales
a partir de mensajes en lenguaje natural, con soporte para detección de preferencias de envío.

Descripción detallada:
El intent create_order existe en src/lib/services/chat/intents/create-order.ts pero
actualmente no tiene parsing estructurado de parámetros. El agente debe implementar
OpenAI Function Calling para extraer de forma confiable: nombre del cliente, lista de
productos con cantidades y unidades, notas adicionales, y PREFERENCIA DE CANAL DE ENVÍO
(WhatsApp, Email, Telegram) basada en el mensaje del usuario o configuración del cliente.

Contexto del repositorio:
- Archivo principal: src/lib/services/chat/intents/create-order.ts
- Referencia de intents: src/lib/services/chat/intents/price-lookup.ts (patrón a seguir)
- OpenAI client: src/lib/services/chat/openai-client.ts (ya tiene formatResponse con historial)
- Schema Prisma: Invoice, InvoiceItem, Customer, Product, ProductPrice (en prisma/schema.prisma)
- Contratos API: DocumentacionHagoProduce/FaseDos/Fase2.0V/03_api_contracts.md
- Modelo de datos: DocumentacionHagoProduce/FaseDos/Fase2.0V/02_data_model.md
- Servicio de notificaciones: src/lib/services/notifications/service.ts (Sprint 2)

Requerimientos específicos:

PARTE A — Definición de la función OpenAI:
Crear en src/lib/services/chat/intents/create-order.ts la definición de la función
para OpenAI Function Calling con el siguiente esquema:
- Nombre de la función: "extract_order_parameters"
- Descripción: "Extrae los parámetros de un pedido desde el mensaje del usuario"
- Parámetros requeridos:
  * customer_name (string): Nombre o razón social del cliente
  * items (array): Lista de productos con:
    - product_name (string): Nombre del producto
    - quantity (number): Cantidad solicitada
    - unit (string, enum: kg, lb, unit, box, case): Unidad de medida
  * notes (string, opcional): Notas adicionales del pedido
  * send_channel (string, opcional, enum: whatsapp, email, telegram, none): Canal de envío preferido
  * delivery_date (string, opcional, formato ISO 8601): Fecha de entrega solicitada
  * delivery_time (string, opcional): Hora de entrega solicitada

PARTE B — Función de extracción:
Implementar función extractOrderParams(message, language, apiKey) que:
- Llama a OpenAI con model gpt-4o-mini y tools: [{ type: "function", function: {...} }]
- Usa tool_choice: "required" para forzar el uso de la función
- Parsea el resultado de tool_calls[0].function.arguments
- Retorna { customerName, items, notes, sendChannel, deliveryDate, deliveryTime } o null si falla
- Tiene timeout de 10 segundos
- Tiene fallback a regex básico si OpenAI no está disponible
- Si send_channel no se especifica en el mensaje, retorna "none" para usar preferencia del cliente

PARTE C — Validación contra DB:
Después de extraer parámetros, validar:
- Cliente: buscar en tabla customers con ILIKE '%customer_name%' en campo name
  * Si no se encuentra → retornar error con sugerencias de clientes similares
  * Si hay múltiples matches → retornar lista para que usuario elija
  * Leer preferredChannel del cliente (si existe) para usar como default
- Productos: para cada item, buscar en tabla products con ILIKE en name o nameEs
  * Si no se encuentra → retornar error con nombre del producto no encontrado
  * Si hay múltiples matches → usar el de mayor relevancia (exact match primero)
- Precios: obtener precio vigente (is_current=true) para cada producto

PARTE D — Flujo de confirmación:
El intent NO debe crear la factura directamente. Debe:
1. Extraer parámetros con OpenAI Function Calling
2. Validar cliente y productos en DB
3. Calcular subtotal, tax (13% HST), total
4. Determinar canal de envío:
   - Si send_channel especificado en mensaje → usar ese canal
   - Si no → usar preferredChannel del cliente
   - Si cliente no tiene preferencia → usar "none" (no enviar automáticamente)
5. Retornar un objeto de "orden pendiente de confirmación" con todos los detalles
6. El mensaje al usuario debe mostrar el resumen y preguntar "¿Confirmas crear esta factura?"
7. Incluir información del canal de envío: "Se enviará por [WhatsApp/Email/Telegram]"
8. La creación real ocurre en un segundo mensaje cuando el usuario confirma

Criterios de aceptación:
- [ ] Función OpenAI definida con esquema correcto en create-order.ts
- [ ] extractOrderParams() implementada con timeout y fallback
- [ ] Validación de cliente con fuzzy search (ILIKE)
- [ ] Validación de productos con fuzzy search (ILIKE)
- [ ] Cálculo de totales (subtotal + 13% HST + total)
- [ ] Detección de send_channel desde mensaje del usuario
- [ ] Lectura de preferredChannel del cliente como default
- [ ] Flujo de confirmación implementado (NO crea factura sin confirmación)
- [ ] Mensaje de confirmación incluye canal de envío
- [ ] Mensaje de confirmación en español e inglés según idioma del usuario
- [ ] Manejo de errores: cliente no encontrado, producto no encontrado, OpenAI timeout

Dependencias:
- OPENAI_API_KEY configurado en .env
- Modelos Customer, Product, ProductPrice, Invoice, InvoiceItem en prisma/schema.prisma
- Campo preferredChannel en modelo Customer (verificar si existe, agregar si no)
- src/lib/services/chat/openai-client.ts (patrón de llamada a OpenAI)
- src/lib/db.ts (cliente Prisma)
- src/lib/services/notifications/service.ts (para envío futuro)
---
```

#### Versión Refinada - S3-P01-B (Creación de Invoice + Envío Multi-Canal)

```markdown
PROMPT #S3-P01-B — create_order: Creación de Invoice DRAFT + Envío Multi-Canal
---
Agente: Desarrollador Full Stack / AI Engineer
Resumen: Implementar la segunda parte del flujo create_order: cuando el usuario confirma
el pedido, crear el Invoice DRAFT real en la base de datos con todos sus InvoiceItems,
y enviar la factura por el canal preferido del cliente (WhatsApp, Email o Telegram).

Descripción detallada:
Este prompt es la continuación de S3-P01-A. Una vez que el usuario confirma el pedido
(responde "sí", "confirmo", "ok", "yes", etc.), el sistema debe crear la factura real
en DB, generar el PDF, y enviarla por el canal preferido del cliente.

Contexto del repositorio:
- Archivo principal: src/lib/services/chat/intents/create-order.ts
- Servicio de facturas: src/lib/services/invoices.service.ts
- API de facturas: src/app/api/v1/invoices/route.ts (POST existente)
- Schema: Invoice (number, customerId, status=DRAFT, subtotal, taxRate, taxAmount, total)
- Schema: InvoiceItem (invoiceId, productId, description, quantity, unitPrice, totalPrice)
- Schema: Customer (preferredChannel, email, phone)
- Numeración: formato INV-YYYY-NNNN (ver lógica existente en invoices.service.ts)
- ChatSession: src/app/api/chat/route.ts (para detectar si hay orden pendiente de confirmación)
- Servicio de notificaciones: src/lib/services/notifications/service.ts
- Export PDF: src/lib/services/reports/export.ts (ya existe)
- Twilio WhatsApp: src/lib/services/bot/whatsapp.service.ts (Sprint 2)

Requerimientos específicos:

PARTE A — Detección de confirmación:
En src/lib/services/chat/intents.ts, agregar detección del intent "confirm_order":
- Keywords de confirmación ES: ["sí", "si", "confirmo", "confirmar", "ok", "dale", "adelante", "procede"]
- Keywords de confirmación EN: ["yes", "confirm", "ok", "proceed", "go ahead", "sure"]
- Keywords de cancelación ES: ["no", "cancelar", "cancel", "no gracias"]
- Keywords de cancelación EN: ["no", "cancel", "nevermind", "stop"]
- Este intent solo aplica si hay una "orden pendiente" en el contexto de la ChatSession

PARTE B — Persistencia de orden pendiente en ChatSession:
Modificar src/app/api/chat/route.ts para:
- Cuando create_order retorna una orden pendiente de confirmación, guardarla en
  chatSession.context como { pendingOrder: { customerId, items, subtotal, taxAmount, total, sendChannel } }
- En el siguiente mensaje, verificar si hay pendingOrder en el contexto
- Si el intent es confirm_order y hay pendingOrder → ejecutar createInvoiceFromOrder()
- Si el intent es cancel_order y hay pendingOrder → limpiar pendingOrder del contexto

PARTE C — Función createInvoiceFromOrder():
Implementar en create-order.ts la función que:
1. Crea Invoice con status=DRAFT, customerId, subtotal, taxRate=0.13, taxAmount, total
2. Genera número de factura con formato INV-YYYY-NNNN (reutilizar lógica existente)
3. Crea InvoiceItems para cada producto con quantity, unitPrice, totalPrice
4. Actualiza status de Invoice a SENT (ya que se enviará inmediatamente)
5. Genera PDF de la factura usando src/lib/services/reports/export.ts
6. Envía la factura por el canal especificado:
   - WhatsApp: usar src/lib/services/bot/whatsapp.service.ts
   - Email: implementar servicio de email (ver Parte D)
   - Telegram: implementar servicio de telegram (ver Parte E)
7. Registra en AuditLog: action="create", entityType="invoice", entityId=invoice.id
8. Registra en NotificationLog: canal usado, estado de envío, timestamp
9. Retorna { invoiceId, invoiceNumber, total, status: "SENT", sentVia: "whatsapp|email|telegram" }

PARTE D — Servicio de Email (Nuevo):
Crear src/lib/services/email.service.ts con:
- Función sendInvoiceEmail(customerEmail, invoiceNumber, pdfBuffer, customerName)
- Usar SendGrid o Resend (configurable via EMAIL_PROVIDER en .env)
- Template HTML profesional con logo de HAGO PRODUCE
- Adjuntar PDF de la factura
- Retornar { success: true, messageId: string } o { success: false, error: string }
- Manejo de errores con reintentos (máximo 3)
- Logging de intentos de envío

PARTE E — Servicio de Telegram (Nuevo):
Crear src/lib/services/telegram.service.ts con:
- Función sendInvoiceDocument(chatId, invoiceNumber, pdfBuffer, caption)
- Usar Telegram Bot API (configurar TELEGRAM_BOT_TOKEN en .env)
- Enviar PDF como documento (sendDocument method)
- Caption con información de la factura
- Retornar { success: true, messageId: string } o { success: false, error: string }
- Manejo de errores con reintentos (máximo 3)
- Logging de intentos de envío

PARTE F — Respuesta al usuario:
El mensaje de respuesta debe incluir:
- Número de factura creado (INV-YYYY-NNNN)
- Cliente
- Lista de productos con cantidades y precios
- Total con impuestos
- Canal de envío usado: "Enviada por [WhatsApp/Email/Telegram]"
- Instrucción: "Puedes ver y editar la factura en el panel de facturas"
- Link sugerido: /invoices/[invoiceId]

Criterios de aceptación:
- [ ] Intent confirm_order detectado por keywords en ES y EN
- [ ] Intent cancel_order detectado por keywords en ES y EN
- [ ] pendingOrder guardado en chatSession.context con sendChannel
- [ ] createInvoiceFromOrder() crea Invoice SENT real en DB
- [ ] InvoiceItems creados correctamente con precios vigentes
- [ ] Número de factura en formato INV-YYYY-NNNN
- [ ] PDF de factura generado correctamente
- [ ] Envío por WhatsApp funcional (reutilizar Twilio)
- [ ] Envío por Email funcional (nuevo servicio)
- [ ] Envío por Telegram funcional (nuevo servicio)
- [ ] AuditLog registra la creación
- [ ] NotificationLog registra el envío
- [ ] Respuesta incluye número de factura y canal de envío
- [ ] pendingOrder limpiado del contexto después de crear o cancelar
- [ ] Manejo de errores si el envío falla (reintentos + logging)

Dependencias:
- S3-P01-A completado (extracción de parámetros con sendChannel)
- src/lib/services/invoices.service.ts (lógica de numeración)
- src/lib/services/reports/export.ts (generación de PDF)
- src/lib/services/bot/whatsapp.service.ts (envío WhatsApp)
- ChatSession con campo context (ya existe en schema.prisma)
- logAudit() en src/lib/audit/logger.ts
- Variables de entorno: EMAIL_PROVIDER, SENDGRID_API_KEY o RESEND_API_KEY, TELEGRAM_BOT_TOKEN
---
```

---

## 4. NUEVOS PROMPTS PROPUESTOS

### 4.1 S3-P06: create_purchase_order - Órdenes de Compra Inteligentes

```markdown
PROMPT #S3-P06-A — create_purchase_order: Extracción y Sugerencia de Proveedores
---
Agente: Desarrollador Full Stack / AI Engineer
Resumen: Implementar el intent create_purchase_order para crear órdenes de compra
inteligentes que sugieren automáticamente los mejores proveedores y precios actuales
basándose en el inventario y precios vigentes.

Descripción detallada:
Este nuevo intent permite a los usuarios crear órdenes de compra para proveedores
con sugerencias automáticas de mejores proveedores basadas en precios actuales.
El sistema debe extraer productos y cantidades del mensaje, buscar los mejores
proveedores para cada producto, calcular costos totales, y generar una orden de
compra lista para enviar.

Contexto del repositorio:
- Archivo principal: src/lib/services/chat/intents/create-purchase-order.ts (nuevo)
- Referencia de intents: src/lib/services/chat/intents/create-order.ts (patrón a seguir)
- OpenAI client: src/lib/services/chat/openai-client.ts
- Schema Prisma: Product, ProductPrice, Supplier, PurchaseOrder (nuevo modelo), PurchaseOrderItem (nuevo modelo)
- Contratos API: DocumentacionHagoProduce/FaseDos/Fase2.0V/03_api_contracts.md
- Modelo de datos: DocumentacionHagoProduce/FaseDos/Fase2.0V/02_data_model.md

Requerimientos específicos:

PARTE A — Crear modelos Prisma (si no existen):
Agregar a prisma/schema.prisma:
```prisma
model PurchaseOrder {
  id          String   @id @default(cuid())
  orderNumber String   @unique // PO-YYYY-NNNN
  supplierId  String
  supplier    Supplier @relation(fields: [supplierId], references: [id])
  status      PurchaseOrderStatus @default(DRAFT)
  subtotal    Decimal  @db.Decimal(10, 2)
  taxRate     Decimal  @default(0.13) @db.Decimal(5, 4)
  taxAmount   Decimal  @db.Decimal(10, 2)
  total       Decimal  @db.Decimal(10, 2)
  notes       String?
  deliveryDate DateTime?
  deliveryTime String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  items       PurchaseOrderItem[]
  auditLogs   AuditLog[]
}

model PurchaseOrderItem {
  id              String        @id @default(cuid())
  purchaseOrderId String
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  productId       String
  product         Product       @relation(fields: [productId], references: [id])
  supplierId      String        // Proveedor sugerido para este item
  supplier        Supplier      @relation(fields: [supplierId], references: [id])
  description     String
  quantity        Decimal       @db.Decimal(10, 2)
  unit            String
  unitPrice       Decimal       @db.Decimal(10, 2)
  totalPrice      Decimal       @db.Decimal(10, 2)
  createdAt       DateTime      @default(now())
}

enum PurchaseOrderStatus {
  DRAFT
  SENT
  CONFIRMED
  RECEIVED
  CANCELLED
}
```

PARTE B — Definición de la función OpenAI:
Crear en src/lib/services/chat/intents/create-purchase-order.ts la definición de la función
para OpenAI Function Calling con el siguiente esquema:
- Nombre de la función: "extract_purchase_order_parameters"
- Descripción: "Extrae los parámetros de una orden de compra desde el mensaje del usuario"
- Parámetros requeridos:
  * items (array): Lista de productos con:
    - product_name (string): Nombre del producto
    - quantity (number): Cantidad solicitada
    - unit (string, enum: kg, lb, unit, box, case): Unidad de medida
  * delivery_date (string, opcional, formato ISO 8601): Fecha de entrega solicitada
  * delivery_time (string, opcional): Hora de entrega solicitada
  * notes (string, opcional): Notas adicionales
  * recipient_name (string, opcional): Nombre del destinatario (ej: "Pedro")

PARTE C — Función de extracción:
Implementar función extractPurchaseOrderParams(message, language, apiKey) que:
- Llama a OpenAI con model gpt-4o-mini y tools: [{ type: "function", function: {...} }]
- Usa tool_choice: "required" para forzar el uso de la función
- Parsea el resultado de tool_calls[0].function.arguments
- Retorna { items, deliveryDate, deliveryTime, notes, recipientName } o null si falla
- Tiene timeout de 10 segundos
- Tiene fallback a regex básico si OpenAI no está disponible

PARTE D — Búsqueda de mejores proveedores:
Implementar función findBestSuppliersForItems(items) que:
- Para cada item en items:
  * Buscar productos en DB con ILIKE en name o nameEs
  * Si no se encuentra → retornar error con nombre del producto
  * Buscar precios vigentes (is_current=true) para el producto
  * Ordenar por price ASC (precio más bajo primero)
  * Seleccionar el proveedor con mejor precio
  * Calcular totalPrice = quantity * unitPrice
- Retornar array de { productId, productName, supplierId, supplierName, quantity, unit, unitPrice, totalPrice }

PARTE E — Generación de orden de compra pendiente:
Implementar función generatePendingPurchaseOrder(items, deliveryDate, deliveryTime, notes, recipientName) que:
- Agrupa items por proveedor (una orden por proveedor)
- Para cada proveedor:
  * Calcula subtotal, tax (13%), total
  * Genera orden de compra pendiente con todos los detalles
- Retorna array de órdenes pendientes (una por proveedor)

PARTE F — Flujo de confirmación:
El intent NO debe crear la orden directamente. Debe:
1. Extraer parámetros con OpenAI Function Calling
2. Buscar mejores proveedores para cada producto
3. Agrupar items por proveedor
4. Generar órdenes de compra pendientes
5. Retornar resumen al usuario con:
   - Lista de productos con mejores proveedores y precios
   - Total por proveedor
   - Total general
   - Pregunta: "¿Confirmas crear estas órdenes de compra?"
6. La creación real ocurre en un segundo mensaje cuando el usuario confirma

Criterios de aceptación:
- [ ] Modelos PurchaseOrder y PurchaseOrderItem creados en schema.prisma
- [ ] Función OpenAI definida con esquema correcto
- [ ] extractPurchaseOrderParams() implementada con timeout y fallback
- [ ] findBestSuppliersForItems() busca mejores precios
- [ ] Agrupación de items por proveedor funcional
- [ ] Cálculo de totales (subtotal + 13% HST + total)
- [ ] Flujo de confirmación implementado
- [ ] Mensaje de confirmación incluye proveedores sugeridos y precios
- [ ] Manejo de errores: producto no encontrado, OpenAI timeout

Dependencias:
- OPENAI_API_KEY configurado en .env
- Modelos Product, ProductPrice, Supplier en prisma/schema.prisma
- src/lib/services/chat/openai-client.ts
- src/lib/db.ts (cliente Prisma)
---
```

```markdown
PROMPT #S3-P06-B — create_purchase_order: Creación de Orden + Envío a Proveedores
---
Agente: Desarrollador Full Stack / AI Engineer
Resumen: Implementar la segunda parte del flujo create_purchase_order: cuando el usuario
confirma, crear las órdenes de compra reales en DB y enviarlas a los proveedores por
WhatsApp o Email según preferencias.

Descripción detallada:
Este prompt es la continuación de S3-P06-A. Una vez que el usuario confirma las órdenes
de compra, el sistema debe crear los registros en DB, generar los documentos PDF,
y enviarlos a los proveedores por sus canales preferidos.

Contexto del repositorio:
- Archivo principal: src/lib/services/chat/intents/create-purchase-order.ts
- Servicio de órdenes de compra: src/lib/services/purchase-orders.service.ts (nuevo)
- Schema: PurchaseOrder, PurchaseOrderItem (creados en S3-P06-A)
- Schema: Supplier (preferredChannel, email, phone)
- Servicio de notificaciones: src/lib/services/notifications/service.ts
- Export PDF: src/lib/services/reports/export.ts
- Twilio WhatsApp: src/lib/services/bot/whatsapp.service.ts
- Email service: src/lib/services/email.service.ts (creado en S3-P01-B)

Requerimientos específicos:

PARTE A — Detección de confirmación:
En src/lib/services/chat/intents.ts, agregar detección del intent "confirm_purchase_order":
- Keywords de confirmación ES: ["sí", "si", "confirmo", "confirmar", "ok", "dale", "adelante", "procede"]
- Keywords de confirmación EN: ["yes", "confirm", "ok", "proceed", "go ahead", "sure"]
- Keywords de cancelación ES: ["no", "cancelar", "cancel", "no gracias"]
- Keywords de cancelación EN: ["no", "cancel", "nevermind", "stop"]
- Este intent solo aplica si hay "órdenes pendientes" en el contexto de la ChatSession

PARTE B — Persistencia de órdenes pendientes en ChatSession:
Modificar src/app/api/chat/route.ts para:
- Cuando create_purchase_order retorna órdenes pendientes, guardarlas en
  chatSession.context como { pendingPurchaseOrders: [{ supplierId, items, subtotal, taxAmount, total }] }
- En el siguiente mensaje, verificar si hay pendingPurchaseOrders en el contexto
- Si el intent es confirm_purchase_order y hay órdenes pendientes → ejecutar createPurchaseOrders()
- Si el intent es cancel_purchase_order y hay órdenes pendientes → limpiar del contexto

PARTE C — Función createPurchaseOrders():
Implementar en create-purchase-order.ts la función que:
1. Para cada orden pendiente:
   * Crea PurchaseOrder con status=DRAFT, supplierId, subtotal, taxRate=0.13, taxAmount, total
   * Genera número de orden con formato PO-YYYY-NNNN
   * Crea PurchaseOrderItems para cada producto
   * Actualiza status a SENT
   * Genera PDF de la orden de compra
   * Envía la orden al proveedor por su canal preferido (WhatsApp/Email)
   * Registra en AuditLog
   * Registra en NotificationLog
2. Retorna array de { purchaseOrderId, orderNumber, supplierName, total, status: "SENT", sentVia: "whatsapp|email" }

PARTE D — Servicio de Órdenes de Compra:
Crear src/lib/services/purchase-orders.service.ts con:
- Función generatePurchaseOrderNumber(): genera PO-YYYY-NNNN
- Función createPurchaseOrder(data): crea orden en DB
- Función generatePurchaseOrderPDF(purchaseOrderId): genera PDF
- Función sendPurchaseOrderToSupplier(purchaseOrderId, channel): envía por WhatsApp/Email

PARTE E — Respuesta al usuario:
El mensaje de respuesta debe incluir:
- Lista de órdenes creadas con números (PO-YYYY-NNNN)
- Proveedores y totales
- Canales de envío usados
- Instrucción: "Puedes ver las órdenes en el panel de compras"
- Link sugerido: /purchase-orders

Criterios de aceptación:
- [ ] Intent confirm_purchase_order detectado
- [ ] pendingPurchaseOrders guardado en chatSession.context
- [ ] createPurchaseOrders() crea PurchaseOrders en DB
- [ ] Números de orden en formato PO-YYYY-NNNN
- [ ] PDFs de órdenes generados
- [ ] Envío por WhatsApp funcional
- [ ] Envío por Email funcional
- [ ] AuditLog registra las creaciones
- [ ] NotificationLog registra los envíos
- [ ] Respuesta incluye números de orden y canales de envío

Dependencias:
- S3-P06-A completado (modelos y extracción)
- S3-P01-B completado (email service)
- src/lib/services/bot/whatsapp.service.ts
- src/lib/services/reports/export.ts
- ChatSession con campo context
---
```

### 4.2 S3-P07: Servicio de Email Unificado

```markdown
PROMPT #S3-P07 — Servicio de Email Unificado para Facturas y Órdenes
---
Agente: Desarrollador Backend
Resumen: Implementar un servicio de email unificado que permita enviar facturas,
órdenes de compra y notificaciones por email usando SendGrid o Resend, con
templates HTML profesionales y manejo de errores robusto.

Descripción detallada:
Crear un servicio de email reutilizable que pueda enviar diferentes tipos de
documentos (facturas, órdenes de compra, notificaciones) con templates HTML
profesionales, adjuntos PDF, y manejo de errores con reintentos.

Contexto del repositorio:
- Archivo principal: src/lib/services/email.service.ts (nuevo)
- Proveedor: SendGrid o Resend (configurable)
- Templates HTML: src/lib/services/email/templates/ (nuevo directorio)
- Variables de entorno: EMAIL_PROVIDER, SENDGRID_API_KEY o RESEND_API_KEY

Requerimientos específicos:

PARTE A — Configuración del servicio:
Crear src/lib/services/email.service.ts con:
- Configuración del proveedor (SendGrid o Resend) basada en EMAIL_PROVIDER
- Función sendEmail(to, subject, htmlContent, attachments?): Promise<SendEmailResult>
- Función sendInvoiceEmail(customerEmail, invoiceNumber, pdfBuffer, customerName)
- Función sendPurchaseOrderEmail(supplierEmail, orderNumber, pdfBuffer, supplierName)
- Función sendNotificationEmail(to, subject, message)
- Manejo de errores con reintentos (máximo 3)
- Logging de todos los intentos de envío

PARTE B — Templates HTML:
Crear templates profesionales en src/lib/services/email/templates/:
- invoice.html: Template para facturas con logo, datos del cliente, tabla de items, totales
- purchase-order.html: Template para órdenes de compra con logo, datos del proveedor, tabla de items
- notification.html: Template simple para notificaciones
- Variables dinámicas usando {{variable}} syntax
- Diseño responsive y profesional con colores de marca HAGO PRODUCE

PARTE C — Integración con SendGrid:
Si EMAIL_PROVIDER=sendgrid:
- Usar @sendgrid/mail package
- Configurar API key desde SENDGRID_API_KEY
- Usar templates dinámicos de SendGrid o HTML personalizado
- Manejo de errores específicos de SendGrid

PARTE D — Integración con Resend:
Si EMAIL_PROVIDER=resend:
- Usar resend package
- Configurar API key desde RESEND_API_KEY
- Enviar emails con HTML personalizado
- Manejo de errores específicos de Resend

PARTE E — Manejo de errores y reintentos:
Implementar lógica de reintentos con:
- Exponential backoff: 1s, 2s, 4s
- Máximo 3 reintentos
- Logging detallado de cada intento
- Retornar { success: true, messageId: string } o { success: false, error: string, attempts: number }

PARTE F — Tests:
Crear src/lib/services/email/__tests__/email.service.test.ts con:
- Test de envío exitoso
- Test de envío con reintentos
- Test de manejo de errores
- Test de templates HTML
- Mock de SendGrid/Resend

Criterios de aceptación:
- [ ] email.service.ts creado con todas las funciones
- [ ] Templates HTML profesionales creados
- [ ] Integración con SendGrid funcional
- [ ] Integración con Resend funcional
- [ ] Manejo de errores con reintentos implementado
- [ ] Logging de todos los envíos
- [ ] Tests completos pasando
- [ ] Coverage >85%

Dependencias:
- Variables de entorno: EMAIL_PROVIDER, SENDGRID_API_KEY o RESEND_API_KEY
- Packages: @sendgrid/mail o resend
- src/lib/services/reports/export.ts (para generar PDFs)
---
```

### 4.3 S3-P08: Servicio de Telegram

```markdown
PROMPT #S3-P08 — Servicio de Telegram para Envío de Documentos
---
Agente: Desarrollador Backend
Resumen: Implementar un servicio de Telegram que permita enviar facturas,
órdenes de compra y notificaciones por Telegram usando la Bot API, con
soporte para documentos, mensajes formateados y manejo de errores.

Descripción detallada:
Crear un servicio de Telegram reutilizable que pueda enviar diferentes tipos de
documentos (facturas, órdenes de compra) como archivos PDF, mensajes con formato
Markdown, y manejo de errores con reintentos.

Contexto del repositorio:
- Archivo principal: src/lib/services/telegram.service.ts (nuevo)
- Telegram Bot API: https://core.telegram.org/bots/api
- Variables de entorno: TELEGRAM_BOT_TOKEN
- Modelo Customer: telegramChatId (campo opcional para guardar chat ID del cliente)

Requerimientos específicos:

PARTE A — Configuración del servicio:
Crear src/lib/services/telegram.service.ts con:
- Configuración del bot token desde TELEGRAM_BOT_TOKEN
- Función sendMessage(chatId, text, parseMode?): Promise<SendMessageResult>
- Función sendDocument(chatId, fileBuffer, filename, caption?): Promise<SendDocumentResult>
- Función sendInvoiceDocument(chatId, invoiceNumber, pdfBuffer, customerName)
- Función sendPurchaseOrderDocument(chatId, orderNumber, pdfBuffer, supplierName)
- Función sendNotification(chatId, message)
- Manejo de errores con reintentos (máximo 3)
- Logging de todos los intentos de envío

PARTE B — Funciones de la Bot API:
Implementar llamadas a la Bot API:
- sendMessage: https://api.telegram.org/bot{token}/sendMessage
- sendDocument: https://api.telegram.org/bot{token}/sendDocument
- Soporte para parseMode: Markdown o HTML
- Manejo de respuestas y errores de la API

PARTE C — Manejo de chat IDs:
Implementar lógica para:
- Guardar telegramChatId en el modelo Customer cuando el cliente inicia un chat
- Función linkTelegramChat(customerId, chatId): vincula chat ID con cliente
- Función getCustomerChatId(customerId): obtiene chat ID del cliente
- Validación de chat ID antes de enviar mensajes

PARTE D — Webhook de Telegram (opcional):
Crear src/app/api/v1/bot/webhook/telegram/route.ts para:
- Recibir mensajes de Telegram
- Procesar comandos (/start, /help, /invoices)
- Vincular chat ID con cliente (si el cliente se identifica)
- Reenviar mensajes al chat interno de Hago Produce

PARTE E — Manejo de errores y reintentos:
Implementar lógica de reintentos con:
- Exponential backoff: 1s, 2s, 4s
- Máximo 3 reintentos
- Logging detallado de cada intento
- Retornar { success: true, messageId: string } o { success: false, error: string, attempts: number }

PARTE F — Tests:
Crear src/lib/services/telegram/__tests__/telegram.service.test.ts con:
- Test de envío de mensaje exitoso
- Test de envío de documento exitoso
- Test de manejo de errores
- Test de vinculación de chat ID
- Mock de Telegram Bot API

Criterios de aceptación:
- [ ] telegram.service.ts creado con todas las funciones
- [ ] Funciones sendMessage y sendDocument funcionales
- [ ] Manejo de chat IDs implementado
- [ ] Webhook de Telegram opcional implementado
- [ ] Manejo de errores con reintentos implementado
- [ ] Logging de todos los envíos
- [ ] Tests completos pasando
- [ ] Coverage >85%

Dependencias:
- Variables de entorno: TELEGRAM_BOT_TOKEN
- Campo telegramChatId en modelo Customer (agregar si no existe)
- src/lib/services/reports/export.ts (para generar PDFs)
---
```

---

## 5. ESTRATEGIA DE INTEGRACIÓN

### 5.1 Funcionalidades con Implementación Interna

| Funcionalidad | Archivos Principales | Complejidad | Justificación |
|--------------|---------------------|-------------|---------------|
| **Envío de facturas por Email** | `src/lib/services/email.service.ts` | 🟡 Media | API simple, control total |
| **Envío de facturas por WhatsApp** | `src/lib/services/bot/whatsapp.service.ts` | 🟢 Baja | Ya implementado en Sprint 2 |
| **Envío de facturas por Telegram** | `src/lib/services/telegram.service.ts` | 🟡 Media | API simple, sin dependencias |
| **Sugerencia de mejores proveedores** | `src/lib/services/chat/intents/create-purchase-order.ts` | 🟡 Media | Lógica de negocio core |
| **Creación de órdenes de compra** | `src/lib/services/purchase-orders.service.ts` | 🟡 Media | Flujo crítico de negocio |
| **Envío de órdenes a proveedores** | `email.service.ts`, `whatsapp.service.ts`, `telegram.service.ts` | 🟢 Baja | Reutilizar servicios existentes |

### 5.2 Funcionalidades con Make.com (Blueprints Personalizados)

**Decisión:** NO se requieren blueprints de Make.com para las funcionalidades solicitadas.

**Justificación:**
1. Todas las funcionalidades pueden implementarse internamente con mayor control
2. Menor latencia (sin llamadas a Make.com)
3. Costos reducidos (sin créditos de Make.com)
4. Testing más sencillo
5. Mejor debugging y monitoreo

**Cuándo considerar Make.com en el futuro:**
- Integración con QuickBooks (contabilidad)
- Integración con ERP legacy
- Automatizaciones que requieren lógica visual
- Procesos que necesitan ser modificados por usuarios no técnicos

### 5.3 Integraciones de Terceros Necesarias

| Servicio | Propósito | Variables de Entorno | Costo |
|----------|-----------|---------------------|-------|
| **SendGrid** | Envío de emails | `SENDGRID_API_KEY` | Freemium (100 emails/día) |
| **Resend** | Envío de emails (alternativa) | `RESEND_API_KEY` | Freemium (3,000 emails/mes) |
| **Telegram Bot API** | Envío de mensajes y documentos | `TELEGRAM_BOT_TOKEN` | Gratis |
| **Twilio** | Envío de WhatsApp (ya configurado) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | Pago por mensaje |

**Recomendación:** Usar Resend para emails (más generoso en plan gratuito) y Twilio para WhatsApp (ya configurado).

---

## 6. MEJORAS DE UX Y PRODUCTIZACIÓN

### 6.1 Recomendaciones para Simplificar la Experiencia de Usuario

#### 6.1.1 Chatbot - Curva de Aprendizaje Mínima

**Principios:**
1. **Lenguaje Natural:** El usuario debe poder expresarse en lenguaje natural sin aprender comandos
2. **Confirmación Inteligente:** El sistema debe pedir confirmación solo para acciones críticas
3. **Sugerencias Proactivas:** El chatbot debe sugerir acciones basadas en contexto
4. **Feedback Inmediato:** Cada acción debe tener feedback visual claro

**Implementaciones:**
- **Sugerencias de autocompletado:** Mientras el usuario escribe, mostrar sugerencias de clientes y productos
- **Respuestas rápidas:** Botones con acciones comunes ("Crear factura", "Ver facturas vencidas", "Crear orden de compra")
- **Historial visible:** Mostrar las últimas 5 acciones del usuario en el chat
- **Ayuda contextual:** Botón "¿Qué puedo hacer?" que muestra ejemplos de comandos

#### 6.1.2 Portal de Cliente - UX Optimizada

**Principios:**
1. **Dashboard Visual:** Gráficos y tarjetas con información clave de un vistazo
2. **Navegación Intuitiva:** Menú claro con secciones bien definidas
3. **Filtros Potentes:** Búsqueda y filtros avanzados en todas las listas
4. **Acciones Rápidas:** Botones de acción prominentes para tareas comunes

**Implementaciones:**
- **Tarjetas de estado de cuenta:** Colores semafóricos (verde, amarillo, rojo)
- **Gráficos interactivos:** Compras por mes, top productos, tendencias
- **Descarga masiva:** Selección múltiple con checkbox y descarga en ZIP
- **Notificaciones en tiempo real:** Campana con badge de notificaciones no leídas

#### 6.1.3 Portal Admin - Eficiencia Operativa

**Principios:**
1. **Vistas consolidadas:** Toda la información relevante en una sola pantalla
2. **Acciones en lote:** Operaciones sobre múltiples registros a la vez
3. **Búsqueda global:** Buscar en todo el sistema desde una barra
4. **Exportación flexible:** Exportar a CSV, Excel, PDF con filtros personalizados

**Implementaciones:**
- **Tabla de facturas con filtros avanzados:** Fecha, estado, cliente, monto
- **Acciones en lote:** Enviar facturas, cambiar estado, exportar
- **Búsqueda global:** Buscar facturas, clientes, productos desde una barra
- **Reportes personalizables:** Crear reportes con filtros y columnas personalizadas

### 6.2 Checklist de Productización

#### 6.2.1 Pre-Launch

- [ ] **Testing Completo:**
  - [ ] Unit tests >80% coverage
  - [ ] Integration tests para todos los endpoints críticos
  - [ ] E2E tests pasando en Chrome, Firefox, Safari
  - [ ] Tests de carga para endpoints de reportes
  - [ ] Tests de seguridad (OWASP Top 10)

- [ ] **Performance:**
  - [ ] Tiempo de respuesta <500ms para endpoints cacheados
  - [ ] Tiempo de respuesta <2s para endpoints no cacheados
  - [ ] Lighthouse score >90 en Performance
  - [ ] Lighthouse score >95 en Accessibility
  - [ ] Optimización de imágenes y assets

- [ ] **Seguridad:**
  - [ ] Rate limiting configurado en todos los endpoints públicos
  - [ ] Validación de firma en webhooks externos
  - [ ] HTTPS obligatorio en producción
  - [ ] Headers de seguridad configurados (CSP, HSTS, X-Frame-Options)
  - [ ] Variables de entorno sensibles en secrets management
  - [ ] Auditoría de accesos y acciones críticas

- [ ] **Documentación:**
  - [ ] Guía de usuario para chatbot
  - [ ] Guía de usuario para portal de cliente
  - [ ] Guía de usuario para portal admin
  - [ ] Runbook de operaciones actualizado
  - [ ] API documentation (Swagger/OpenAPI)
  - [ ] Diagramas de arquitectura actualizados

- [ ] **Integraciones:**
  - [ ] Twilio WhatsApp configurado y probado
  - [ ] SendGrid/Resend configurado y probado
  - [ ] Telegram Bot configurado y probado
  - [ ] Make.com webhooks configurados (si aplica)
  - [ ] Base de datos de producción configurada
  - [ ] Backups automatizados configurados

#### 6.2.2 Launch

- [ ] **Monitoreo:**
  - [ ] Logs centralizados (Sentry, LogRocket, o similar)
  - [ ] Métricas de performance (New Relic, Datadog, o similar)
  - [ ] Uptime monitoring (UptimeRobot, Pingdom, o similar)
  - [ ] Alertas configuradas para errores críticos
  - [ ] Dashboard de monitoreo operativo

- [ ] **Soporte:**
  - [ ] Canales de soporte configurados (email, chat, teléfono)
  - [ ] Sistema de tickets (Zendesk, Freshdesk, o similar)
  - [ ] Base de conocimiento para usuarios
  - [ ] Procedimientos de escalado
  - [ ] Equipo de soporte entrenado

- [ ] **Backup y Recovery:**
  - [ ] Backups diarios de base de datos
  - [ ] Backups de archivos (PDFs, imágenes)
  - [ ] Procedimiento de restore probado
  - [ ] Disaster recovery plan documentado
  - [ ] RTO (Recovery Time Objective) <4 horas
  - [ ] RPO (Recovery Point Objective) <1 hora

#### 6.2.3 Post-Launch

- [ ] **Optimización Continua:**
  - [ ] Análisis de logs de errores
  - [ ] Análisis de performance
  - [ ] Feedback de usuarios
  - [ ] A/B testing de features
  - [ ] Optimización de costos

- [ ] **Mantenimiento:**
  - [ ] Actualizaciones de dependencias
  - [ ] Parches de seguridad
  - [ ] Limpieza de cachés expirados
  - [ ] Archivo de datos antiguos
  - [ ] Revisión de límites de APIs externas

### 6.3 Métricas de Éxito Sugeridas

#### 6.3.1 Métricas de Negocio

| Métrica | Objetivo | Frecuencia de Medición |
|---------|----------|------------------------|
| **Tasa de adopción del chatbot** | >60% de usuarios internos usan chatbot semanalmente | Semanal |
| **Reducción de tiempo de creación de facturas** | >50% reducción vs proceso manual | Mensual |
| **Tasa de error en creación de facturas** | <5% | Semanal |
| **Satisfacción del cliente (CSAT)** | >4.5/5 | Trimestral |
| **Tiempo de respuesta a consultas** | <2 minutos promedio | Semanal |
| **Tasa de entrega de facturas** | >95% entregadas exitosamente | Diaria |
| **Costo por factura enviada** | <$0.10 | Mensual |

#### 6.3.2 Métricas Técnicas

| Métrica | Objetivo | Frecuencia de Medición |
|---------|----------|------------------------|
| **Uptime** | >99.9% | Continua |
| **Tiempo de respuesta promedio** | <500ms (p95) | Continua |
| **Error rate** | <0.1% | Continua |
| **Coverage de tests** | >80% | Cada commit |
| **Tiempo de despliegue** | <10 minutos | Cada despliegue |
| **Tiempo de recovery** | <4 horas | Incidentes |
| **Costo de infraestructura** | <$500/mes | Mensual |

#### 6.3.3 Métricas de UX

| Métrica | Objetivo | Frecuencia de Medición |
|---------|----------|------------------------|
| **Task completion rate** | >90% | Mensual |
| **Time on task** | <2 minutos para crear factura | Mensual |
| **Error rate en UI** | <2% | Semanal |
| **NPS (Net Promoter Score)** | >50 | Trimestral |
| **Tasa de abandono** | <10% | Mensual |
| **Sesiones por usuario** | >5/semana | Semanal |

---

## 7. ROADMAP ACTUALIZADO

### 7.1 Priorización de Prompts para Sprint 3

| Prioridad | Prompt | Descripción | Días Estimados | Dependencias |
|-----------|--------|-------------|----------------|--------------|
| 🔴 **P0** | S3-P03 | E2E Firefox Fix + Coverage >80% | 1 | Ninguna |
| 🔴 **P0** | S3-P01-A | create_order: Extracción con sendChannel | 1-2 | S2-01 ✅ |
| 🔴 **P0** | S3-P01-B | create_order: Creación + Envío Multi-Canal | 1-2 | S3-P01-A |
| 🔴 **P0** | S3-P07 | Servicio de Email Unificado | 1 | Ninguna |
| 🔴 **P0** | S3-P08 | Servicio de Telegram | 1 | Ninguna |
| 🟡 **P1** | S3-P06-A | create_purchase_order: Extracción + Sugerencias | 2 | S3-P07 ✅ |
| 🟡 **P1** | S3-P06-B | create_purchase_order: Creación + Envío | 1-2 | S3-P06-A |
| 🟡 **P1** | S3-P02-A | ReportCache Activo + Performance | 1 | Sprint 1 ✅ |
| 🟡 **P1** | S3-P02-B | ReportCache: Cron + Tests | 1 | S3-P02-A |
| 🟢 **P2** | S3-P04-A | SPA Pública: Estructura y Layout | 1-2 | Ninguna |
| 🟢 **P2** | S3-P04-B | SPA Pública: Contenido | 2 | S3-P04-A |
| 🟢 **P2** | S3-P05-A | Portal Cliente: Dashboard Gráficos | 2 | S3-P04-A |
| 🟢 **P2** | S3-P05-B | Portal Cliente: Historial + Descarga | 2 | S3-P05-A |

### 7.2 Timeline Actualizado Sprint 3

```
Semana 1 (Días 1-5):
  Día 1:   S3-P03 (E2E Firefox) + S3-P07 (Email) inicio
  Día 2:   S3-P07 finalización + S3-P08 (Telegram) inicio
  Día 3:   S3-P08 finalización + S3-P01-A (create_order extracción) inicio
  Día 4:   S3-P01-A finalización + S3-P01-B (create_order envío) inicio
  Día 5:   S3-P01-B finalización → CHECKPOINT S3-CP1

Semana 2 (Días 6-10):
  Día 6:   S3-P06-A (purchase_order extracción) inicio
  Día 7:   S3-P06-A finalización + S3-P06-B (purchase_order envío) inicio
  Día 8:   S3-P06-B finalización + S3-P02-A (ReportCache) inicio
  Día 9:   S3-P02-A finalización + S3-P02-B (ReportCache tests) inicio
  Día 10:  S3-P02-B finalización → CHECKPOINT S3-CP2

Semana 3 (Días 11-15):
  Día 11:  S3-P04-A (SPA estructura) inicio
  Día 12:  S3-P04-A finalización + S3-P04-B (SPA contenido) inicio
  Día 13:  S3-P04-B finalización + S3-P05-A (Portal dashboard) inicio
  Día 14:  S3-P05-A finalización + S3-P05-B (Portal historial) inicio
  Día 15:  S3-P05-B finalización → CHECKPOINT S3-CP3 (Cierre)
```

### 7.3 Dependencias Críticas

```
S3-P03 (E2E) ──────────────────────────────────────────────▶ Sin dependencias
S3-P07 (Email) ─────────────────────────────────────────────▶ Sin dependencias
S3-P08 (Telegram) ─────────────────────────────────────────▶ Sin dependencias
S3-P01-A (create_order extracción) ────────────────────────▶ S2-01 (ChatSession) ✅
S3-P01-B (create_order envío) ─────────────────────────────▶ S3-P01-A + S3-P07 + S3-P08
S3-P06-A (purchase_order extracción) ──────────────────────▶ S3-P07 ✅
S3-P06-B (purchase_order envío) ───────────────────────────▶ S3-P06-A + S3-P07 + S3-P08
S3-P02-A (ReportCache) ────────────────────────────────────▶ Sprint 1 (ReportCache model) ✅
S3-P02-B (ReportCache tests) ──────────────────────────────▶ S3-P02-A
S3-P04-A (SPA estructura) ─────────────────────────────────▶ Sin dependencias
S3-P04-B (SPA contenido) ──────────────────────────────────▶ S3-P04-A
S3-P05-A (Portal dashboard) ───────────────────────────────▶ S3-P04-A
S3-P05-B (Portal historial) ───────────────────────────────▶ S3-P05-A + S2-04 (notificaciones) ✅
```

### 7.4 Riesgos Identificados y Mitigaciones

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| **Timeout en E2E Firefox persiste** | 🟡 Medio | 🟡 Media | Aumentar timeout a 60s, agregar retry, considerar Chrome-only en CI |
| **OpenAI API rate limits** | 🟡 Medio | 🟢 Baja | Implementar caching de respuestas, usar gpt-4o-mini, agregar retry con backoff |
| **Envío de emails falla** | 🔴 Alto | 🟡 Media | Implementar reintentos (3x), fallback a WhatsApp, logging detallado |
| **Telegram Bot API bloquea IP** | 🟡 Medio | 🟢 Baja | Usar proxy si es necesario, implementar fallback a Email |
| **Performance de reportes sin caché** | 🟡 Medio | 🟡 Media | Priorizar S3-P02 (ReportCache), implementar paginación, optimizar queries |
| **Coverage no alcanza 80%** | 🟡 Medio | 🟡 Media | Priorizar tests de lógica de negocio, excluir archivos de configuración |
| **Integración con proveedores de email falla** | 🔴 Alto | 🟢 Baja | Probar ambos SendGrid y Resend, tener fallback configurado |
| **UX del chatbot no es intuitiva** | 🟡 Medio | 🟡 Media | Implementar sugerencias proactivas, respuestas rápidas, ayuda contextual |

---

## 8. RESUMEN EJECUTIVO

### 8.1 Cambios Principales

1. **Refinamiento de S3-P01 (create_order):**
   - Agregado soporte para detección de canal de envío (WhatsApp/Email/Telegram)
   - Agregado envío multi-canal de facturas después de confirmación
   - Mejorado flujo de confirmación con información del canal

2. **Nuevos Prompts Agregados:**
   - **S3-P06:** create_purchase_order - Órdenes de compra inteligentes con sugerencias de mejores proveedores
   - **S3-P07:** Servicio de Email Unificado - Envío de facturas y órdenes por email
   - **S3-P08:** Servicio de Telegram - Envío de documentos por Telegram

3. **Decisiones de Arquitectura:**
   - Priorizar implementaciones internas sobre Make.com
   - Usar Resend para emails (plan gratuito generoso)
   - Reutilizar Twilio para WhatsApp (ya configurado)
   - Implementar Telegram Bot API para canal adicional

4. **Mejoras de UX:**
   - Sugerencias proactivas en chatbot
   - Respuestas rápidas con acciones comunes
   - Dashboard visual en portal de cliente
   - Notificaciones en tiempo real
   - Descarga masiva de documentos

5. **Productización:**
   - Checklist completo de pre-launch, launch y post-launch
   - Métricas de negocio, técnicas y UX definidas
   - Plan de monitoreo y soporte
   - Procedimientos de backup y recovery

### 8.2 Impacto en Timeline

- **Sprint 3 original:** 8 días (S3-P01 a S3-P05)
- **Sprint 3 refinado:** 15 días (agregando S3-P06, S3-P07, S3-P08)
- **Justificación:** Las nuevas funcionalidades (facturación multi-canal y órdenes de compra) son críticas para el negocio y requieren tiempo adicional para implementación y testing

### 8.3 Próximos Pasos

1. **Revisar y aprobar este documento** con el equipo
2. **Priorizar prompts P0** (S3-P03, S3-P01, S3-P07, S3-P08) para la primera semana
3. **Configurar variables de entorno** para SendGrid/Resend y Telegram
4. **Crear branch feature/sprint3** en el repositorio
5. **Comenzar ejecución** siguiendo el timeline actualizado

---

**Documento generado:** 2026-02-23  
**Basado en:** CHECKPOINT_CIERRE_SPRINT2.md + PROMPTS_SPRINT3_DETALLADOS.md + Nuevos requerimientos  
**Estado:** ✅ Listo para revisión y aprobación  
**Próxima revisión:** Post-aprobación, antes de iniciar Sprint 3