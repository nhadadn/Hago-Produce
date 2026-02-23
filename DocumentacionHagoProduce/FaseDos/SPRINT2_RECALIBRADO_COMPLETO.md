# 🚀 Sprint 2 Recalibrado - Integraciones Externas & Lógica de Negocio
## Hago Produce | Fase 2 | Basado en Auditoría Real del Repositorio

---

## 📊 ESTADO REAL POST-SPRINT 1 (Verificado en Repositorio)

### ✅ Completado y Verificado
| Componente | Archivo | Estado |
|---|---|---|
| Schema Prisma completo | `prisma/schema.prisma` | ✅ 10 modelos activos |
| Auth JWT + Middleware | `src/lib/auth/` | ✅ Funcional |
| Bot API Keys CRUD | `src/app/api/bot/keys/` | ✅ Con rate limiting |
| Chat endpoint base | `src/app/api/chat/route.ts` | ✅ Con OpenAI fallback |
| WhatsApp Webhook (Twilio) | `src/app/api/v1/bot/webhook/whatsapp/` | ✅ Estructura lista |
| Telegram Webhook | `src/app/api/v1/bot/webhook/telegram/` | ✅ Estructura lista |
| Make.com Webhook | `src/app/api/v1/webhooks/make/route.ts` | ✅ Con idempotencia |
| Intents básicos (4) | `src/lib/services/chat/intents/` | ✅ keyword-based |
| Reports API | `src/app/api/v1/reports/` | ✅ 6 endpoints |
| FloatingChatAssistant | `src/components/chat/` | ✅ Sprint 1 |

### 🔴 GAPS CRÍTICOS IDENTIFICADOS (Verificados en Código)

| GAP ID | Descripción | Archivo Afectado | Impacto |
|---|---|---|---|
| GAP-01 | E2E Firefox timeout (Playwright) | `tests/chat.spec.ts` | ⚠️ Warning |
| GAP-02 | Chat `/api/chat` sin Rate Limiting | `src/app/api/chat/route.ts` | 🔴 Seguridad |
| GAP-03 | WhatsApp validación firma en modo DEV | `src/app/api/v1/bot/webhook/whatsapp/route.ts` | 🔴 Seguridad |
| GAP-04 | Intents keyword-based (no RAG real) | `src/lib/services/chat/intents.ts` | 🔴 Funcionalidad |
| GAP-05 | OpenAI sin historial de conversación | `src/app/api/chat/route.ts` | 🟡 UX |
| GAP-06 | Make.com escribe a Google Sheets (no a DB) | `AUTOMATIZACION.json` módulo 39 | 🔴 Arquitectura |
| GAP-07 | Twilio credenciales no configuradas en .env | `.env.example` | 🔴 Operacional |
| GAP-08 | ChatSession sin persistencia en DB | `src/app/api/chat/route.ts` | 🟡 Funcionalidad |
| GAP-09 | Intents faltantes: `product_info`, `create_order` | `src/lib/services/chat/intents/` | 🟡 Funcionalidad |
| GAP-10 | Notificaciones sin canal WhatsApp real | `src/lib/services/notifications/` | 🟡 Funcionalidad |

---

## 🎯 OBJETIVOS DEL SPRINT 2 (Recalibrado)

### Prioridad Absoluta (Días 1-2): Hardening de Seguridad
- Resolver GAP-02: Rate limiting en chat
- Resolver GAP-03: Validación de firma WhatsApp en producción
- Resolver GAP-07: Configuración completa de variables de entorno

### Prioridad Alta (Días 3-5): RAG + Inteligencia Real
- Resolver GAP-04: Migrar de keyword-matching a RAG con datos reales de DB
- Resolver GAP-05: Historial de conversación persistente
- Resolver GAP-09: Nuevos intents de negocio

### Prioridad Alta (Días 4-6): Make.com → DB Migration
- Resolver GAP-06: Redirigir Make.com para escribir directamente a DB (no Google Sheets)
- Implementar flujo completo: PDF → OpenAI → Webhook → DB

### Prioridad Media (Días 6-8): Notificaciones Reales
- Resolver GAP-10: Canal WhatsApp real via Twilio
- Notificaciones automáticas por cambio de estado de facturas

---

## 📋 CHECKLIST DE PROGRESO Y GAPS

### Sprint 1 - Estado Final
- [x] GAP-INFRA-01: Modelo Notification implementado
- [x] GAP-INFRA-02: Modelo ReportCache implementado
- [x] GAP-BOT-01: Admin UI para API Keys
- [x] GAP-CHAT-01: FloatingChatAssistant
- [x] GAP-CHAT-02: Integración OpenAI básica
- [ ] GAP-02: Rate limiting en /api/chat → **Sprint 2 Día 1**
- [ ] GAP-03: WhatsApp firma producción → **Sprint 2 Día 1**
- [ ] GAP-04: RAG real → **Sprint 2 Días 3-4**
- [ ] GAP-06: Make.com → DB → **Sprint 2 Días 4-5**

### Sprint 2 - Tracking
- [ ] META-01: Chat Hardening (Seguridad + Rate Limit)
- [ ] META-02: WhatsApp Business Real (Twilio producción)
- [ ] META-03: RAG con datos reales de inventario/precios
- [ ] META-04: Make.com → DB (eliminar Google Sheets como destino)
- [ ] META-05: Notificaciones WhatsApp automáticas
- [ ] META-06: ChatSession persistente en DB
- [ ] META-07: Nuevos intents de negocio
- [ ] META-08: Documentación de automatizaciones

---

## 🗓️ TIMELINE SPRINT 2 (8 Días Hábiles)

```
Día 1-2: ████ HARDENING SEGURIDAD (GAP-02, GAP-03, GAP-07)
Día 3-4: ████ RAG + INTELIGENCIA REAL (GAP-04, GAP-05, GAP-09)
Día 4-5: ████ MAKE.COM → DB MIGRATION (GAP-06)
Día 6-7: ████ NOTIFICACIONES WHATSAPP REALES (GAP-10)
Día 8:   ████ TESTING E2E + DOCUMENTACIÓN AUTOMATIZACIONES
```

---

## 🔧 META-PROMPTS DEL SPRINT 2

---

## META-PROMPT S2-01: Chat Hardening Completo (Seguridad + Rate Limit + Sesiones)

```
META-PROMPT S2-01 - Chat Hardening: Rate Limiting + Validación + Sesiones Persistentes
---
Agente: Desarrollador Full Stack / Security Engineer
Nivel de Integración: Nivel 3 (Negocio) - Implementación completa con tests

Resumen:
Resolver los GAPs de seguridad críticos del endpoint /api/chat (sin rate limiting) y del
webhook de WhatsApp (validación de firma solo en modo DEV), e implementar persistencia
real de sesiones de chat en base de datos.

Contexto del Repositorio:
- Archivo a modificar: src/app/api/chat/route.ts
  * Actualmente NO tiene rate limiting
  * Usa crypto.randomUUID() para sessionId pero no persiste en DB
  * Tiene autenticación JWT pero sin throttling
- Archivo a modificar: src/app/api/v1/bot/webhook/whatsapp/route.ts
  * La función GET de verificación acepta cualquier request sin validar
  * La validación de firma usa process.env.TWILIO_AUTH_TOKEN pero en DEV puede ser vacío
- Referencia de rate limiting existente: src/lib/rate-limit.ts y src/lib/utils/rate-limit.ts
  * Ya existe implementación de Token Bucket para bot/keys
  * Debe reutilizarse el mismo patrón para chat
- Schema Prisma: prisma/schema.prisma
  * Modelo Message ya existe con campos: platform, platformUserId, message, response, intent, status
  * Debe crearse modelo ChatSession para persistir conversaciones del chat web

Descripción detallada:

TAREA 1 - Rate Limiting en /api/chat:
Implementar rate limiting estricto en el endpoint POST /api/chat usando el patrón
existente en src/lib/utils/rate-limit.ts. El límite debe ser configurable via variable
de entorno CHAT_RATE_LIMIT (default: 20 req/min por usuario autenticado).
- Identificar usuario por userId del JWT (no por IP, ya que es endpoint autenticado)
- Responder con HTTP 429 y header Retry-After cuando se exceda el límite
- El mensaje de error debe estar en el idioma del usuario (es/en según context.language)
- Loggear en AuditLog los intentos de rate limit excedido

TAREA 2 - Validación de Firma WhatsApp en Producción:
El endpoint GET /api/v1/bot/webhook/whatsapp actualmente acepta cualquier verificación.
Debe implementar validación real del challenge de Twilio:
- Verificar que el request viene de Twilio usando twilio.validateRequest()
- En NODE_ENV=production, rechazar requests sin firma válida (HTTP 401)
- En NODE_ENV=development, permitir bypass con log de advertencia
- Agregar variable de entorno TWILIO_WEBHOOK_URL al .env.example
- Implementar test de integración que valide el rechazo de firma inválida

TAREA 3 - ChatSession Persistente en DB:
Agregar modelo ChatSession al schema.prisma para persistir conversaciones:
- Campos requeridos: id, userId, sessionId (unique), messages (Json[]), 
  context (Json?), createdAt, updatedAt, lastActivityAt
- Relación con User existente
- Modificar /api/chat/route.ts para:
  * Cargar historial de sesión existente al inicio de cada request
  * Agregar mensaje del usuario y respuesta del bot al historial
  * Enviar los últimos N mensajes (configurable, default 10) como contexto a OpenAI
  * Esto convierte el chat de stateless a stateful con memoria real
- Crear migración: npx prisma migrate dev --name add_chat_session
- Índices: userId, sessionId (unique), lastActivityAt

TAREA 4 - Tests de Seguridad (TDD):
Crear suite de tests en src/app/api/chat/__tests__/security.test.ts:
- Test: Rate limit se activa después de N requests del mismo usuario
- Test: Request sin JWT retorna 401
- Test: Request con JWT válido pero rate limit excedido retorna 429 con Retry-After
- Test: Webhook WhatsApp con firma inválida retorna 401 en producción
- Test: Webhook WhatsApp con firma válida retorna 200
- Test: ChatSession se crea en primera interacción
- Test: ChatSession carga historial en interacciones subsecuentes
Coverage mínimo requerido: 85% para los archivos modificados

Criterios de aceptación:
- [ ] Rate limiting activo en /api/chat (20 req/min por usuario, configurable)
- [ ] HTTP 429 con Retry-After header cuando se excede límite
- [ ] Validación de firma Twilio activa en NODE_ENV=production
- [ ] ChatSession modelo creado en schema.prisma con migración ejecutada
- [ ] Historial de conversación cargado en cada request (últimos 10 mensajes)
- [ ] OpenAI recibe contexto de conversación previa
- [ ] Tests de seguridad pasando (mínimo 7 tests, coverage >85%)
- [ ] .env.example actualizado con CHAT_RATE_LIMIT y TWILIO_WEBHOOK_URL
- [ ] AuditLog registra eventos de rate limit excedido

Dependencias:
- src/lib/utils/rate-limit.ts (existente, reutilizar patrón)
- src/lib/auth/middleware.ts (existente, getAuthenticatedUser)
- prisma/schema.prisma (agregar ChatSession)
- TWILIO_AUTH_TOKEN en variables de entorno
---
```

---

## META-PROMPT S2-02: RAG Real con Inventario y Precios de Base de Datos

```
META-PROMPT S2-02 - RAG: Retrieval Augmented Generation con Datos Reales de DB
---
Agente: Desarrollador Full Stack / AI Engineer
Nivel de Integración: Nivel 3 (Negocio) - RAG completo con datos reales

Resumen:
Migrar el sistema de chat de keyword-matching básico a RAG real que consulta la base
de datos de productos, precios, proveedores e inventario para generar respuestas
precisas y contextualizadas. Agregar nuevos intents de negocio críticos.

Contexto del Repositorio:
- Sistema actual: src/lib/services/chat/intents.ts
  * Usa keyword matching simple (includesKeyword)
  * Solo 4 intents: price_lookup, best_supplier, invoice_status, customer_balance
  * No tiene contexto de conversación previa
- Query executor: src/lib/services/chat/query-executor.ts
  * Ejecuta queries directas a Prisma por intent
  * No tiene búsqueda semántica ni fuzzy matching
- OpenAI client: src/lib/services/chat/openai-client.ts
  * Llama a gpt-4o-mini con datos JSON
  * No usa function calling de OpenAI
  * No tiene historial de mensajes en el prompt
- Modelos disponibles en DB: Product, ProductPrice, Supplier, Customer, Invoice,
  InvoiceItem, Notification, ReportCache (todos en prisma/schema.prisma)

Descripción detallada:

TAREA 1 - Mejorar Intent Detection con OpenAI Function Calling:
Reemplazar el keyword matching en src/lib/services/chat/intents.ts con un sistema
híbrido: primero intenta keyword matching rápido, si no hay match con alta confianza
(>0.8), usa OpenAI para clasificar el intent con function calling.

Definir las siguientes funciones para OpenAI:
- get_product_prices(product_name: string, supplier_name?: string): Consulta precios
- get_best_supplier(product_name: string, quantity?: number): Mejor proveedor por precio
- get_invoice_status(invoice_number?: string, customer_name?: string): Estado de factura
- get_customer_balance(customer_name: string): Saldo pendiente del cliente
- get_product_info(product_name: string): Info completa del producto (categoría, unidad, SKU)
- get_inventory_summary(): Resumen de productos activos con precios vigentes
- create_invoice_draft(customer_name: string, items: array): Crear borrador de factura
- get_overdue_invoices(days_overdue?: number): Facturas vencidas

TAREA 2 - Implementar Nuevos Intents en Query Executor:
Agregar en src/lib/services/chat/intents/ los siguientes archivos:
- product-info.ts: Consulta Product + ProductPrice + Supplier con Prisma
  * Buscar por nombre con búsqueda fuzzy (ILIKE en PostgreSQL)
  * Retornar: nombre, categoría, unidad, SKU, precios vigentes por proveedor
- inventory-summary.ts: Resumen de todos los productos activos
  * Agrupar por categoría
  * Incluir precio mínimo y máximo por producto
  * Filtrar solo productos con is_active=true y precios con is_current=true
- create-order.ts: Crear borrador de factura desde el chat
  * Validar que el cliente existe en DB
  * Validar que los productos existen
  * Crear Invoice en estado DRAFT con InvoiceItems
  * Retornar número de factura generado
- overdue-invoices.ts: Facturas vencidas
  * Filtrar invoices con status=PENDING y dueDate < now()
  * Agrupar por cliente
  * Calcular días de atraso

TAREA 3 - Context-Aware Responses con Historial:
Modificar src/lib/services/chat/openai-client.ts para:
- Aceptar parámetro messages: ChatMessage[] (historial de conversación)
- Incluir los últimos 10 mensajes en el array de messages enviado a OpenAI
- El system prompt debe incluir contexto del negocio:
  * "Eres el asistente de HAGO PRODUCE, empresa distribuidora de frutas y verduras en Canadá"
  * "Tienes acceso a datos reales de inventario, precios y facturas"
  * "Responde siempre en el idioma del usuario (es/en)"
  * "Para crear facturas, confirma siempre con el usuario antes de proceder"
- Implementar streaming de respuesta (Server-Sent Events) para mejor UX

TAREA 4 - Fuzzy Search para Productos:
Implementar búsqueda fuzzy en las queries de productos para manejar errores de
tipeo y variaciones de nombres:
- Usar operador ILIKE de PostgreSQL: WHERE name ILIKE '%pineapple%'
- Buscar también en name_es para queries en español
- Ordenar resultados por relevancia (exact match primero, luego partial)
- Máximo 5 resultados por búsqueda

TAREA 5 - Tests de Integración RAG:
Crear src/lib/services/chat/__tests__/rag.test.ts:
- Test: "precio de piña" → intent price_lookup → datos reales de DB
- Test: "mejor proveedor de almendras" → intent best_supplier → datos reales
- Test: "información del producto mango" → intent product_info → datos reales
- Test: "facturas vencidas" → intent overdue_invoices → lista correcta
- Test: "crear factura para Fresh Foods Inc" → intent create_order → draft creado
- Test: Query con typo "preecios de pina" → fuzzy match → resultado correcto
- Test: Historial de conversación incluido en prompt de OpenAI
- Mock de OpenAI API para tests determinísticos
Coverage mínimo: 80%

Criterios de aceptación:
- [ ] Intent detection híbrido (keyword + OpenAI function calling)
- [ ] 8 intents implementados (4 existentes + 4 nuevos)
- [ ] Fuzzy search con ILIKE para productos y clientes
- [ ] Historial de conversación incluido en prompts de OpenAI
- [ ] Streaming de respuesta implementado (SSE)
- [ ] create_order crea Invoice DRAFT real en DB
- [ ] Tests de integración pasando (mínimo 8 tests, coverage >80%)
- [ ] Tiempo de respuesta <3s para queries simples, <8s para create_order

Dependencias:
- META-PROMPT S2-01 completado (ChatSession con historial)
- OPENAI_API_KEY configurado en .env
- Datos de seed en DB (productos, proveedores, precios)
- prisma/schema.prisma (modelos Product, ProductPrice, Supplier, Customer, Invoice)
---
```

---

## META-PROMPT S2-03: Make.com → DB Migration (Eliminar Google Sheets como Destino)

```
META-PROMPT S2-03 - Make.com Pipeline: Google Drive PDF → OpenAI → Webhook → DB
---
Agente: Desarrollador de Automatizaciones Make.com / Integrador de APIs
Nivel de Integración: Nivel 3 (Negocio) - Flujo completo con transformación de datos

Resumen:
Rediseñar el pipeline de Make.com para que los precios extraídos de PDFs de Google Drive
sean enviados directamente al webhook de Hago Produce (POST /api/v1/webhooks/make) en
lugar de escribirse a Google Sheets. Documentar paso a paso la configuración completa.

Contexto del Blueprint Actual (AUTOMATIZACION.json - 13 módulos):
Flujo actual:
  [1] Google Drive: Watch Files in Folder (HAGO_Precios)
  [48] BasicFeeder: Iterar archivos
  [15] Google Drive: Get File (descargar PDF)
  [30] SetVariable: Guardar nombre del archivo
  [47] HTTP: Enviar PDF a PDF.co para conversión
  [5] PDF.co: Convertir PDF a texto/JSON
  [18] BasicFeeder: Iterar páginas del PDF
  [6] OpenAI GPT: Extraer datos estructurados del texto
  [23] JSON: Parse respuesta de OpenAI
  [17] BasicFeeder: Iterar items extraídos
  [36] BasicAggregator: Agregar todos los items
  [34] SetVariables: Preparar datos finales
  [39] Google Sheets: addMultipleRows ← ESTE MÓDULO DEBE REEMPLAZARSE

Problema: El módulo [39] escribe a Google Sheets en lugar de enviar al webhook de la DB.
Solución: Reemplazar módulo [39] con HTTP: ActionSendData al webhook de Hago Produce.

Descripción detallada:

TAREA 1 - Documentación del Flujo Actual:
Crear documento DocumentacionHagoProduce/FaseDos/MAKE_PIPELINE_DOCUMENTACION.md con:
- Diagrama ASCII del flujo actual de 13 módulos
- Descripción de cada módulo con sus parámetros actuales
- Formato exacto del JSON que produce OpenAI GPT (módulo [6])
- Formato exacto de los datos que llegan al módulo [39] (Google Sheets)
- Variables de entorno necesarias en Make.com

TAREA 2 - Diseño del Nuevo Módulo HTTP Webhook:
Documentar la configuración exacta del nuevo módulo HTTP que reemplaza a Google Sheets:
- URL: {APP_URL}/api/v1/webhooks/make
- Method: POST
- Headers:
  * Content-Type: application/json
  * X-API-Key: {MAKE_WEBHOOK_API_KEY} (API Key generada en Admin UI)
  * X-Idempotency-Key: {archivo_nombre}_{timestamp}
- Body (JSON): Debe coincidir con el schema del webhook existente en
  src/app/api/v1/webhooks/make/route.ts
  Formato esperado:
  {
    "event_type": "price.updated",
    "data": {
      "product_name": "...",
      "supplier_name": "...",
      "cost_price": 0.00,
      "sell_price": 0.00,
      "currency": "CAD",
      "effective_date": "YYYY-MM-DD",
      "source": "make_automation"
    }
  }

TAREA 3 - Validar Compatibilidad con Webhook Existente:
Revisar src/app/api/v1/webhooks/make/route.ts para confirmar:
- Que el event_type "price.updated" está en el schema de validación Zod
- Que el handler de "price.updated" actualiza ProductPrice en DB correctamente
- Que la idempotencia funciona (mismo X-Idempotency-Key no procesa dos veces)
- Si hay gaps, documentarlos y proponer el fix en el código

TAREA 4 - Configuración de API Key en Make.com:
Documentar paso a paso cómo configurar la API Key en Make.com:
1. Ir a Admin UI → /admin/bot-api-keys
2. Crear nueva API Key con nombre "Make.com Price Automation"
3. Copiar el valor de la key generada
4. En Make.com → Scenario → HTTP Module → Headers → agregar X-API-Key
5. Guardar y probar con "Run Once"

TAREA 5 - Crear Blueprint Actualizado:
Generar el archivo DocumentacionHagoProduce/FaseDos/MAKE_BLUEPRINT_V2.json con el
blueprint actualizado donde el módulo [39] (Google Sheets) es reemplazado por un
módulo HTTP con la configuración documentada en TAREA 2.
El blueprint debe ser importable directamente en Make.com.

TAREA 6 - Manejo de Errores en Make.com:
Documentar la configuración de error handling en Make.com:
- Configurar "Error Handler" en el módulo HTTP para capturar errores 4xx/5xx
- Configurar retry automático (máx 3 intentos con backoff exponencial)
- Configurar notificación por email si el webhook falla 3 veces consecutivas
- Documentar cómo ver los logs de ejecución en Make.com

TAREA 7 - Test End-to-End del Pipeline:
Documentar el procedimiento de prueba completo:
1. Subir un PDF de precios de prueba a la carpeta HAGO_Precios en Google Drive
2. Ejecutar el escenario manualmente en Make.com ("Run Once")
3. Verificar en los logs de Make.com que el HTTP module retorna 200
4. Verificar en la DB que el ProductPrice fue creado/actualizado
5. Verificar en WebhookLog que el evento fue registrado
6. Verificar idempotencia: ejecutar dos veces con mismo archivo → solo 1 registro

Criterios de aceptación:
- [ ] Documento MAKE_PIPELINE_DOCUMENTACION.md creado con diagrama y descripción
- [ ] Configuración del módulo HTTP documentada con formato exacto del payload
- [ ] Compatibilidad con webhook existente validada (o gaps documentados con fix)
- [ ] Guía paso a paso para configurar API Key en Make.com
- [ ] Blueprint V2 generado e importable en Make.com
- [ ] Error handling documentado con retry y notificaciones
- [ ] Procedimiento de test E2E documentado
- [ ] Al ejecutar el pipeline, ProductPrice se actualiza en DB (no en Google Sheets)

Dependencias:
- Admin UI de API Keys funcional (Sprint 1 completado)
- Webhook /api/v1/webhooks/make funcional y con idempotencia
- Acceso a cuenta de Make.com con el escenario HAGO Produce
- Acceso a Google Drive carpeta HAGO_Precios
- PDF de precios de prueba disponible
---
```

---

## META-PROMPT S2-04: WhatsApp Business Real + Notificaciones Automáticas

```
META-PROMPT S2-04 - WhatsApp Business: Twilio Producción + Notificaciones Automáticas
---
Agente: Integrador de APIs / Desarrollador Backend
Nivel de Integración: Nivel 3 (Negocio) - Flujo completo de mensajería bidireccional

Resumen:
Configurar Twilio WhatsApp Business en modo producción (no sandbox), implementar
notificaciones automáticas de cambio de estado de facturas via WhatsApp, y documentar
el proceso completo de configuración de webhooks en el panel de Twilio.

Contexto del Repositorio:
- WhatsApp Service: src/lib/services/bot/whatsapp.service.ts
  * Usa twilio SDK correctamente
  * Formatea números con código de país +52 (México) por defecto
  * PROBLEMA: El código de país por defecto debe ser +1 (Canadá) para Hago Produce
- Webhook Handler: src/app/api/v1/bot/webhook/whatsapp/route.ts
  * Validación de firma implementada pero GET acepta sin validar
  * Rate limiting por número de teléfono implementado
  * Logging en tabla Message implementado
- Notifications Service: src/lib/services/notifications/
  * service.ts: Motor de notificaciones con AuditLog
  * twilio.ts: Servicio Twilio para WhatsApp
  * triggers.ts: Triggers de notificaciones
  * types.ts: Tipos de notificaciones
- Variables de entorno faltantes en .env.example:
  * TWILIO_ACCOUNT_SID (no está)
  * TWILIO_AUTH_TOKEN (no está)
  * TWILIO_WHATSAPP_NUMBER (no está)
  * TWILIO_WEBHOOK_URL (no está)

Descripción detallada:

TAREA 1 - Corrección de Código de País por Defecto:
En src/lib/services/bot/whatsapp.service.ts, la función formatWhatsAppNumber()
actualmente asume +52 (México). Debe cambiarse a +1 (Canadá) ya que Hago Produce
opera en Canadá. Actualizar también la lógica de detección:
- Si el número empieza con '1' → agregar '+'
- Si el número empieza con '+' → usar tal cual
- Si el número tiene 10 dígitos → asumir +1 (Canadá/USA)
- Agregar validación de longitud mínima (10 dígitos)

TAREA 2 - Configuración Completa de Variables de Entorno:
Actualizar .env.example con todas las variables necesarias para Twilio:
- TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
- TWILIO_AUTH_TOKEN=your_auth_token_here
- TWILIO_WHATSAPP_NUMBER=+14155238886 (número de Twilio sandbox o producción)
- TWILIO_WEBHOOK_URL=https://your-domain.com/api/v1/bot/webhook/whatsapp
- TWILIO_SANDBOX_MODE=true (para desarrollo con sandbox)
Crear documento de guía: DocumentacionHagoProduce/FaseDos/TWILIO_SETUP_GUIDE.md

TAREA 3 - Guía de Configuración de Twilio (Paso a Paso):
Crear DocumentacionHagoProduce/FaseDos/TWILIO_SETUP_GUIDE.md con:

SECCIÓN A - Configuración del Sandbox (Desarrollo):
1. Ir a console.twilio.com → Messaging → Try it out → Send a WhatsApp message
2. Conectar número de prueba enviando "join [sandbox-keyword]" al número de Twilio
3. Configurar Webhook URL en Sandbox Settings:
   - When a message comes in: https://[ngrok-url]/api/v1/bot/webhook/whatsapp
   - Method: HTTP POST
4. Copiar Account SID y Auth Token a .env.local
5. Probar enviando un mensaje al número de sandbox

SECCIÓN B - Configuración de Producción (WhatsApp Business API):
1. Solicitar acceso a WhatsApp Business API en Twilio Console
2. Registrar número de teléfono de negocio
3. Configurar perfil de negocio (nombre, logo, descripción)
4. Configurar Webhook URL de producción:
   - URL: https://hagoproduce.com/api/v1/bot/webhook/whatsapp
   - Fallback URL: (opcional)
5. Verificar que el webhook responde correctamente al challenge de Twilio
6. Configurar templates de mensajes aprobados por Meta (para mensajes outbound)

SECCIÓN C - Templates de WhatsApp Requeridos:
Documentar los templates necesarios para notificaciones:
- Template "invoice_status_change":
  "Hola {{1}}, tu factura {{2}} ha cambiado a estado {{3}}. Total: {{4}} CAD."
- Template "invoice_overdue":
  "Hola {{1}}, tu factura {{2}} está vencida desde hace {{3}} días. Total pendiente: {{4}} CAD."
- Template "payment_received":
  "Hola {{1}}, hemos recibido tu pago de {{2}} CAD para la factura {{3}}. ¡Gracias!"

TAREA 4 - Implementar Notificaciones Automáticas por Cambio de Estado:
Revisar y completar src/lib/services/notifications/triggers.ts para:
- Trigger en cambio de estado de factura (DRAFT→SENT, PENDING→PAID, etc.)
- Enviar WhatsApp al número del cliente si tiene phone configurado
- Usar templates aprobados de Twilio para mensajes outbound
- Registrar en notifications_log (tabla existente en data model)
- Manejar errores: si WhatsApp falla, intentar email como fallback
- Rate limiting: máximo 1 notificación por factura por hora

Integración con el flujo existente de cambio de estado:
- El endpoint PATCH /api/v1/invoices/[id]/status ya existe
- Debe llamar a NotificationsService.sendInvoiceStatusNotification() después del cambio
- La notificación debe ser asíncrona (no bloquear la respuesta HTTP)

TAREA 5 - Tests de Integración WhatsApp:
Crear src/lib/services/bot/__tests__/whatsapp.test.ts:
- Test: formatWhatsAppNumber con número de 10 dígitos → +1XXXXXXXXXX
- Test: formatWhatsAppNumber con número que empieza con +1 → sin cambios
- Test: validateWebhookSignature con firma válida → true
- Test: validateWebhookSignature con firma inválida → false
- Test: sendMessage exitoso → retorna SID de Twilio
- Test: sendMessage con error de Twilio → lanza excepción con mensaje claro
- Test: Notificación de cambio de estado → mensaje enviado + log en notifications_log
- Mock de Twilio SDK para tests sin llamadas reales
Coverage mínimo: 80%

TAREA 6 - Cron Job para Notificaciones de Vencimiento:
Crear src/app/api/v1/cron/overdue-notifications/route.ts:
- Endpoint GET protegido con CRON_SECRET header
- Buscar facturas con status=PENDING y dueDate < now() - 1 día
- Para cada factura, verificar si ya se envió notificación en las últimas 24h
- Enviar WhatsApp de "factura vencida" al cliente
- Registrar en notifications_log
- Documentar cómo configurar el cron en Railway (o Vercel Cron Jobs)

Criterios de aceptación:
- [ ] Código de país corregido a +1 (Canadá) en whatsapp.service.ts
- [ ] .env.example actualizado con todas las variables de Twilio
- [ ] TWILIO_SETUP_GUIDE.md creado con guías de sandbox y producción
- [ ] Templates de WhatsApp documentados (3 templates)
- [ ] Notificaciones automáticas en cambio de estado de factura
- [ ] Notificaciones asíncronas (no bloquean respuesta HTTP)
- [ ] Fallback a email si WhatsApp falla
- [ ] Cron job para facturas vencidas implementado
- [ ] Tests de integración pasando (mínimo 8 tests, coverage >80%)
- [ ] notifications_log registra cada intento de notificación

Dependencias:
- Cuenta de Twilio con WhatsApp habilitado
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER en .env
- Endpoint PATCH /api/v1/invoices/[id]/status existente
- Modelo notifications_log en DB (ya existe en data model)
---
```

---

## META-PROMPT S2-05: Documentación Completa de Automatizaciones y Flujos

```
META-PROMPT S2-05 - Documentación Maestra de Automatizaciones y Configuración de Flujos
---
Agente: Technical Writer / Desarrollador de Automatizaciones
Nivel de Integración: Nivel 3 (Negocio) - Documentación operacional completa

Resumen:
Crear la documentación técnica completa y operacional para todas las automatizaciones,
webhooks, API Keys y flujos del sistema Hago Produce, permitiendo que cualquier
miembro del equipo pueda configurar, operar y mantener las integraciones.

Contexto del Sistema:
- Make.com: Escenario "HAGO Produce" con 13 módulos (Google Drive → PDF.co → OpenAI → DB)
- Twilio: WhatsApp Business para notificaciones y bot de consultas
- Webhooks internos: /api/v1/webhooks/make, /api/v1/bot/webhook/whatsapp, /api/v1/bot/webhook/telegram
- API Keys: Sistema de gestión en /admin/bot-api-keys
- Cron Jobs: Notificaciones de vencimiento
- OpenAI: Chat assistant con RAG

Descripción detallada:

TAREA 1 - Documento Maestro de Automatizaciones:
Crear DocumentacionHagoProduce/FaseDos/AUTOMATIZACIONES_MASTER.md con:

SECCIÓN 1 - Inventario de Automatizaciones:
Tabla con todas las automatizaciones del sistema:
| ID | Nombre | Plataforma | Trigger | Acción | Estado | Frecuencia |
|---|---|---|---|---|---|---|
| AUTO-01 | Price Extraction | Make.com | Nuevo PDF en Drive | Actualizar precios en DB | Activo | On-demand |
| AUTO-02 | Invoice Notifications | Internal | Cambio de estado | WhatsApp al cliente | Activo | Event-driven |
| AUTO-03 | Overdue Reminders | Cron | Diario 9am | WhatsApp facturas vencidas | Activo | Diario |
| AUTO-04 | WhatsApp Bot | Twilio | Mensaje entrante | Respuesta del bot | Activo | Real-time |
| AUTO-05 | Telegram Bot | Telegram | Mensaje entrante | Respuesta del bot | Activo | Real-time |

SECCIÓN 2 - Diagrama de Flujo Completo:
Diagrama ASCII del flujo completo del sistema:
```
[Google Drive PDF] → [Make.com] → [PDF.co] → [OpenAI] → [Webhook /make] → [DB ProductPrice]
                                                                              ↓
[WhatsApp Usuario] → [Twilio] → [Webhook /whatsapp] → [Bot Query Service] → [OpenAI RAG]
                                                                              ↓
[Invoice Status Change] → [Notifications Service] → [Twilio] → [WhatsApp Cliente]
                                                              → [Email Cliente]
[Cron 9am] → [Overdue Check] → [Twilio] → [WhatsApp Clientes con facturas vencidas]
```

SECCIÓN 3 - Variables de Entorno Requeridas:
Lista completa de todas las variables de entorno con descripción y cómo obtenerlas:
- DATABASE_URL: Railway PostgreSQL → Settings → Connect
- OPENAI_API_KEY: platform.openai.com → API Keys
- TWILIO_ACCOUNT_SID: console.twilio.com → Account Info
- TWILIO_AUTH_TOKEN: console.twilio.com → Account Info
- TWILIO_WHATSAPP_NUMBER: console.twilio.com → Phone Numbers
- TWILIO_WEBHOOK_URL: URL pública del servidor + /api/v1/bot/webhook/whatsapp
- MAKE_WEBHOOK_API_KEY: Admin UI → /admin/bot-api-keys → Crear key "Make.com"
- CHAT_RATE_LIMIT: Número de requests por minuto (default: 20)
- CRON_SECRET: String aleatorio para proteger endpoints de cron
- JWT_SECRET: String aleatorio de 32+ caracteres
- NEXTAUTH_SECRET: String aleatorio de 32+ caracteres

TAREA 2 - Guía de Configuración de Make.com (Paso a Paso):
Crear DocumentacionHagoProduce/FaseDos/MAKE_SETUP_GUIDE.md con:

PASO 1 - Importar Blueprint:
1. Ir a Make.com → Create a new scenario
2. Click en "..." → Import Blueprint
3. Seleccionar archivo MAKE_BLUEPRINT_V2.json
4. Confirmar importación

PASO 2 - Configurar Conexiones:
1. Módulo Google Drive: Conectar cuenta Google con acceso a HAGO_Precios
2. Módulo PDF.co: Agregar API Key de PDF.co (obtener en pdf.co/dashboard)
3. Módulo OpenAI: Agregar OPENAI_API_KEY
4. Módulo HTTP (Webhook): Configurar URL y headers (ver TAREA 3 de S2-03)

PASO 3 - Configurar Scheduling:
1. Click en el reloj del escenario
2. Seleccionar "Immediately as data arrives" para trigger de Google Drive
3. O configurar "Every 1 hour" para polling

PASO 4 - Activar y Probar:
1. Click en "ON" para activar el escenario
2. Subir un PDF de prueba a HAGO_Precios en Google Drive
3. Verificar en Make.com → History que el escenario se ejecutó
4. Verificar en Hago Produce → DB que el precio fue actualizado

TAREA 3 - Guía de Configuración de Webhooks Externos:
Crear DocumentacionHagoProduce/FaseDos/WEBHOOKS_CONFIG_GUIDE.md con:

WEBHOOK 1 - Twilio WhatsApp:
- URL: https://[dominio]/api/v1/bot/webhook/whatsapp
- Configurar en: console.twilio.com → Phone Numbers → [número] → Messaging
- Campo "A message comes in": POST → URL del webhook
- Verificar con: curl -X POST [URL] -d "Body=hola&From=whatsapp:+1234567890"

WEBHOOK 2 - Make.com → Hago Produce:
- URL: https://[dominio]/api/v1/webhooks/make
- Header requerido: X-API-Key: [key de Admin UI]
- Header requerido: X-Idempotency-Key: [unique-id]
- Verificar con: curl -X POST [URL] -H "X-API-Key: [key]" -d '{"event_type":"price.updated",...}'

TAREA 4 - Runbook de Operaciones:
Crear DocumentacionHagoProduce/FaseDos/RUNBOOK_OPERACIONES.md con:

SECCIÓN - Troubleshooting Común:
| Problema | Síntoma | Diagnóstico | Solución |
|---|---|---|---|
| Make.com no envía precios | ProductPrice no se actualiza | Ver WebhookLog en DB | Verificar API Key y URL |
| WhatsApp bot no responde | Mensajes sin respuesta | Ver tabla Message en DB | Verificar TWILIO_AUTH_TOKEN |
| Chat lento | Respuestas >5s | Ver logs de OpenAI | Verificar OPENAI_API_KEY y modelo |
| Notificaciones no llegan | notifications_log con status=failed | Ver error_message | Verificar número de teléfono del cliente |

SECCIÓN - Comandos de Diagnóstico:
```bash
# Ver últimos webhooks recibidos
SELECT * FROM webhook_log ORDER BY created_at DESC LIMIT 20;

# Ver mensajes de WhatsApp recientes
SELECT * FROM messages WHERE platform='whatsapp' ORDER BY created_at DESC LIMIT 20;

# Ver notificaciones fallidas
SELECT * FROM notifications_log WHERE status='failed' ORDER BY created_at DESC LIMIT 20;

# Ver precios actualizados hoy
SELECT * FROM product_prices WHERE source='make_automation' AND created_at > NOW() - INTERVAL '24 hours';
```

TAREA 5 - Checklist de Go-Live:
Crear DocumentacionHagoProduce/FaseDos/GOLIVE_CHECKLIST.md con:
- [ ] DATABASE_URL apunta a base de datos de producción
- [ ] OPENAI_API_KEY configurado y con créditos suficientes
- [ ] TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN de cuenta de producción
- [ ] TWILIO_WHATSAPP_NUMBER es número de producción (no sandbox)
- [ ] Make.com escenario activo y apuntando a URL de producción
- [ ] API Key "Make.com Price Automation" creada en Admin UI
- [ ] Webhook URL de Twilio apunta a URL de producción
- [ ] CRON_SECRET configurado
- [ ] JWT_SECRET y NEXTAUTH_SECRET son strings seguros (32+ chars)
- [ ] SSL/HTTPS activo en el dominio
- [ ] Health check endpoint /api/health responde 200
- [ ] Test de WhatsApp: enviar "hola" al número de producción
- [ ] Test de Make.com: subir PDF de prueba y verificar en DB
- [ ] Test de notificaciones: cambiar estado de factura de prueba

Criterios de aceptación:
- [ ] AUTOMATIZACIONES_MASTER.md creado con inventario completo
- [ ] Diagrama de flujo completo del sistema documentado
- [ ] Lista completa de variables de entorno con instrucciones de obtención
- [ ] MAKE_SETUP_GUIDE.md con pasos detallados para importar y configurar
- [ ] WEBHOOKS_CONFIG_GUIDE.md con configuración de Twilio y Make.com
- [ ] RUNBOOK_OPERACIONES.md con troubleshooting y comandos SQL
- [ ] GOLIVE_CHECKLIST.md con todos los items de verificación
- [ ] Documentación revisada y aprobada por el equipo

Dependencias:
- META-PROMPTS S2-01, S2-02, S2-03, S2-04 completados
- Acceso a Make.com, Twilio, Google Drive
- Dominio de producción configurado
- Blueprint V2 de Make.com generado (S2-03)
---
```

---

## 📊 ROADMAP TÉCNICO ACTUALIZADO (Post-Sprint 1)

### Estado de Fases

```
FASE 0:  ████████████ ✅ COMPLETADA (Infraestructura base)
FASE 1A: ████████████ ✅ COMPLETADA (Auth + Productos + Proveedores)
FASE 1B: ████████████ ✅ COMPLETADA (Facturas + Panel Contable)
FASE 1C: ████████████ ✅ COMPLETADA (Chat base + Portal Cliente)
FASE 2:  ████░░░░░░░░ 🔄 EN PROGRESO
  Sprint 1: ████████ ✅ COMPLETADO (Consolidación)
  Sprint 2: ░░░░░░░░ 🎯 INICIANDO (Integraciones)
  Sprint 3: ░░░░░░░░ ⏳ PENDIENTE (Finalización)
```

### Sprint 2 - Secuencia de Ejecución

```
DÍA 1-2: S2-01 Chat Hardening
  └── Rate limiting /api/chat
  └── WhatsApp firma producción
  └── ChatSession persistente en DB
  └── Tests de seguridad

DÍA 3-4: S2-02 RAG Real
  └── OpenAI Function Calling
  └── 4 nuevos intents
  └── Fuzzy search productos
  └── Historial conversación
  └── Streaming SSE

DÍA 4-5: S2-03 Make.com → DB
  └── Documentar pipeline actual
  └── Diseñar módulo HTTP
  └── Blueprint V2
  └── Test E2E pipeline

DÍA 6-7: S2-04 WhatsApp Producción
  └── Fix código de país (+1 Canadá)
  └── Variables de entorno Twilio
  └── Notificaciones automáticas
  └── Cron facturas vencidas
  └── Tests integración

DÍA 8: S2-05 Documentación
  └── AUTOMATIZACIONES_MASTER.md
  └── MAKE_SETUP_GUIDE.md
  └── WEBHOOKS_CONFIG_GUIDE.md
  └── RUNBOOK_OPERACIONES.md
  └── GOLIVE_CHECKLIST.md
```

### Dependencias Críticas

```
S2-01 (Hardening) ──────────────────────────────────────────► S2-02 (RAG)
                                                                    │
S2-03 (Make.com) ──────────────────────────────────────────────────┤
                                                                    │
S2-04 (WhatsApp) ──────────────────────────────────────────────────┤
                                                                    ▼
                                                              S2-05 (Docs)
```

---

## 🔐 CONFIGURACIÓN DE VARIABLES DE ENTORNO (Referencia Rápida)

### .env.example Actualizado (Agregar al Repositorio)

```env
# ============================================
# HAGO PRODUCE - Environment Variables
# ============================================

# App
NODE_ENV=development
APP_URL=http://localhost:3000

# Database (Railway PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:port/db

# Auth
NEXTAUTH_SECRET=your-32-char-secret-here
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret-here

# AI - OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Twilio - WhatsApp Business
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=+14155238886
TWILIO_WEBHOOK_URL=https://your-domain.com/api/v1/bot/webhook/whatsapp
TWILIO_SANDBOX_MODE=true

# Make.com Integration
MAKE_WEBHOOK_API_KEY=hk_prod_xxxxxxxxxxxxxxxx
WEBHOOK_RATE_LIMIT=100

# Chat Configuration
CHAT_RATE_LIMIT=20

# Cron Jobs
CRON_SECRET=your-cron-secret-here

# Railway
RAILWAY_TOKEN=your-token
RAILWAY_PROJECT_ID=your-project-id
```

---

## 📋 CHECKLIST FINAL DEL SPRINT 2

### Seguridad
- [ ] Rate limiting en /api/chat (20 req/min)
- [ ] Validación firma Twilio en producción
- [ ] Variables de entorno completas en .env.example
- [ ] CRON_SECRET configurado

### Funcionalidad
- [ ] ChatSession persistente en DB
- [ ] 8 intents implementados (4 nuevos)
- [ ] Fuzzy search para productos
- [ ] Streaming SSE en chat
- [ ] Make.com escribe a DB (no Google Sheets)
- [ ] Notificaciones WhatsApp automáticas
- [ ] Cron job facturas vencidas

### Documentación
- [ ] AUTOMATIZACIONES_MASTER.md
- [ ] MAKE_SETUP_GUIDE.md
- [ ] MAKE_BLUEPRINT_V2.json
- [ ] TWILIO_SETUP_GUIDE.md
- [ ] WEBHOOKS_CONFIG_GUIDE.md
- [ ] RUNBOOK_OPERACIONES.md
- [ ] GOLIVE_CHECKLIST.md

### Testing
- [ ] Tests S2-01: 7 tests seguridad, coverage >85%
- [ ] Tests S2-02: 8 tests RAG, coverage >80%
- [ ] Tests S2-04: 8 tests WhatsApp, coverage >80%
- [ ] E2E Firefox timeout resuelto (GAP-01)
- [ ] Pipeline Make.com → DB verificado E2E

---

**Fecha de Creación:** 2026-02-23
**Sprint:** 2 - Integraciones Externas & Lógica de Negocio
**Duración Estimada:** 8 días hábiles
**Estado:** ✅ Plan Generado - Listo para Ejecución
**Basado en:** Análisis real del repositorio nhadadn/hago-produce (branch: main)