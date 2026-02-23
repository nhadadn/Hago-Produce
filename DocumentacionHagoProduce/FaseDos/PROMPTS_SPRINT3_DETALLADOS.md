# 🎯 Prompts Sprint 3 — Completitud & Experiencia de Usuario
## Hago Produce | Fase 2 | Basado en Gaps del Sprint 2

> **Prerrequisito:** Leer `CHECKPOINT_CIERRE_SPRINT2.md` y `PROMPT_MAESTRO_RECALIBRACION_SPRINT3.md` antes de ejecutar cualquier prompt.  
> **Convenciones:** Comentarios en español, código en inglés, ORM único Prisma, formato de respuesta `{ success, data, error }`.

---

## 📊 RESUMEN DE PROMPTS

| # | ID | Nombre | Agente | Día | Prioridad |
|---|---|---|---|---|---|
| 1 | S3-P01 | create_order con OpenAI Function Calling | Full Stack / AI | 1-2 | 🔴 Alta |
| 2 | S3-P02 | ReportCache Activo + Performance | Backend | 2-3 | 🟡 Media |
| 3 | S3-P03 | E2E Firefox Fix + Coverage >80% | QA | 1 | ⚠️ Warning |
| 4 | S3-P04 | SPA Pública — Landing Page Institucional | Frontend | 3-5 | 🟡 Media |
| 5 | S3-P05 | Portal Cliente Avanzado con Gráficos | Full Stack | 4-6 | 🟡 Media |
| 6 | S3-CP1 | Checkpoint Día 2 Sprint 3 | Tech Lead | 2 | — |
| 7 | S3-CP2 | Checkpoint Día 4 Sprint 3 | Tech Lead | 4 | — |
| 8 | S3-CP3 | Checkpoint Cierre Sprint 3 | Tech Lead | 8 | — |

---

## 🔴 DÍA 1-2: create_order con OpenAI Function Calling

---

### PROMPT #S3-P01-A — Implementar OpenAI Function Calling para Extracción de Parámetros

```
PROMPT #S3-P01-A — create_order: Extracción de Parámetros con OpenAI Function Calling
---
Agente: Desarrollador Full Stack / AI Engineer
Resumen: Implementar la extracción estructurada de parámetros para el intent create_order
usando OpenAI Function Calling, permitiendo al chat crear borradores de factura reales
a partir de mensajes en lenguaje natural.

Descripción detallada:
El intent create_order existe en src/lib/services/chat/intents/create-order.ts pero
actualmente no tiene parsing estructurado de parámetros. El agente debe implementar
OpenAI Function Calling para extraer de forma confiable: nombre del cliente, lista de
productos con cantidades y unidades, desde un mensaje en lenguaje natural.

Contexto del repositorio:
- Archivo principal: src/lib/services/chat/intents/create-order.ts
- Referencia de intents: src/lib/services/chat/intents/price-lookup.ts (patrón a seguir)
- OpenAI client: src/lib/services/chat/openai-client.ts (ya tiene formatResponse con historial)
- Schema Prisma: Invoice, InvoiceItem, Customer, Product, ProductPrice (en prisma/schema.prisma)
- Contratos API: DocumentacionHagoProduce/FaseDos/Fase2.0V/03_api_contracts.md
- Modelo de datos: DocumentacionHagoProduce/FaseDos/Fase2.0V/02_data_model.md

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

PARTE B — Función de extracción:
Implementar función extractOrderParams(message, language, apiKey) que:
- Llama a OpenAI con model gpt-4o-mini y tools: [{ type: "function", function: {...} }]
- Usa tool_choice: "required" para forzar el uso de la función
- Parsea el resultado de tool_calls[0].function.arguments
- Retorna { customerName, items, notes } o null si falla
- Tiene timeout de 10 segundos
- Tiene fallback a regex básico si OpenAI no está disponible

PARTE C — Validación contra DB:
Después de extraer parámetros, validar:
- Cliente: buscar en tabla customers con ILIKE '%customer_name%' en campo name
  * Si no se encuentra → retornar error con sugerencias de clientes similares
  * Si hay múltiples matches → retornar lista para que usuario elija
- Productos: para cada item, buscar en tabla products con ILIKE en name o nameEs
  * Si no se encuentra → retornar error con nombre del producto no encontrado
  * Si hay múltiples matches → usar el de mayor relevancia (exact match primero)
- Precios: obtener precio vigente (is_current=true) para cada producto

PARTE D — Flujo de confirmación:
El intent NO debe crear la factura directamente. Debe:
1. Extraer parámetros con OpenAI Function Calling
2. Validar cliente y productos en DB
3. Calcular subtotal, tax (13% HST), total
4. Retornar un objeto de "orden pendiente de confirmación" con todos los detalles
5. El mensaje al usuario debe mostrar el resumen y preguntar "¿Confirmas crear esta factura?"
6. La creación real ocurre en un segundo mensaje cuando el usuario confirma

Criterios de aceptación:
- [ ] Función OpenAI definida con esquema correcto en create-order.ts
- [ ] extractOrderParams() implementada con timeout y fallback
- [ ] Validación de cliente con fuzzy search (ILIKE)
- [ ] Validación de productos con fuzzy search (ILIKE)
- [ ] Cálculo de totales (subtotal + 13% HST + total)
- [ ] Flujo de confirmación implementado (NO crea factura sin confirmación)
- [ ] Mensaje de confirmación en español e inglés según idioma del usuario
- [ ] Manejo de errores: cliente no encontrado, producto no encontrado, OpenAI timeout

Dependencias:
- OPENAI_API_KEY configurado en .env
- Modelos Customer, Product, ProductPrice, Invoice, InvoiceItem en prisma/schema.prisma
- src/lib/services/chat/openai-client.ts (patrón de llamada a OpenAI)
- src/lib/db.ts (cliente Prisma)
---
```

---

### PROMPT #S3-P01-B — Implementar Creación Real de Invoice DRAFT desde Chat

```
PROMPT #S3-P01-B — create_order: Creación de Invoice DRAFT en DB con Confirmación
---
Agente: Desarrollador Full Stack / AI Engineer
Resumen: Implementar la segunda parte del flujo create_order: cuando el usuario confirma
el pedido, crear el Invoice DRAFT real en la base de datos con todos sus InvoiceItems,
y retornar el número de factura generado.

Descripción detallada:
Este prompt es la continuación de S3-P01-A. Una vez que el usuario confirma el pedido
(responde "sí", "confirmo", "ok", "yes", etc.), el sistema debe crear la factura real
en DB y retornar el número de factura al usuario.

Contexto del repositorio:
- Archivo principal: src/lib/services/chat/intents/create-order.ts
- Servicio de facturas: src/lib/services/invoices.service.ts
- API de facturas: src/app/api/v1/invoices/route.ts (POST existente)
- Schema: Invoice (number, customerId, status=DRAFT, subtotal, taxRate, taxAmount, total)
- Schema: InvoiceItem (invoiceId, productId, description, quantity, unitPrice, totalPrice)
- Numeración: formato INV-YYYY-NNNN (ver lógica existente en invoices.service.ts)
- ChatSession: src/app/api/chat/route.ts (para detectar si hay orden pendiente de confirmación)

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
  chatSession.context como { pendingOrder: { customerId, items, subtotal, taxAmount, total } }
- En el siguiente mensaje, verificar si hay pendingOrder en el contexto
- Si el intent es confirm_order y hay pendingOrder → ejecutar createInvoiceFromOrder()
- Si el intent es cancel_order y hay pendingOrder → limpiar pendingOrder del contexto

PARTE C — Función createInvoiceFromOrder():
Implementar en create-order.ts la función que:
1. Crea Invoice con status=DRAFT, customerId, subtotal, taxRate=0.13, taxAmount, total
2. Genera número de factura con formato INV-YYYY-NNNN (reutilizar lógica existente)
3. Crea InvoiceItems para cada producto con quantity, unitPrice, totalPrice
4. Registra en AuditLog: action="create", entityType="invoice", entityId=invoice.id
5. Retorna { invoiceId, invoiceNumber, total, status: "DRAFT" }

PARTE D — Respuesta al usuario:
El mensaje de respuesta debe incluir:
- Número de factura creado (INV-YYYY-NNNN)
- Cliente
- Lista de productos con cantidades y precios
- Total con impuestos
- Instrucción: "Puedes ver y editar la factura en el panel de facturas"
- Link sugerido: /invoices/[invoiceId]

Criterios de aceptación:
- [ ] Intent confirm_order detectado por keywords en ES y EN
- [ ] Intent cancel_order detectado por keywords en ES y EN
- [ ] pendingOrder guardado en chatSession.context
- [ ] createInvoiceFromOrder() crea Invoice DRAFT real en DB
- [ ] InvoiceItems creados correctamente con precios vigentes
- [ ] Número de factura en formato INV-YYYY-NNNN
- [ ] AuditLog registra la creación
- [ ] Respuesta incluye número de factura y link al panel
- [ ] pendingOrder limpiado del contexto después de crear o cancelar

Dependencias:
- S3-P01-A completado (extracción de parámetros)
- src/lib/services/invoices.service.ts (lógica de numeración)
- ChatSession con campo context (ya existe en schema.prisma)
- logAudit() en src/lib/audit/logger.ts
---
```

---

### PROMPT #S3-P01-C — Tests Completos del Flujo create_order

```
PROMPT #S3-P01-C — create_order: Suite de Tests Completa
---
Agente: QA Engineer / Desarrollador Full Stack
Resumen: Crear la suite completa de tests para el flujo create_order, cubriendo
extracción de parámetros, validaciones, flujo de confirmación y creación de factura.

Descripción detallada:
Implementar tests unitarios e integración para el flujo completo de create_order,
usando mocks de OpenAI y Prisma para tests determinísticos.

Contexto del repositorio:
- Archivo a testear: src/lib/services/chat/intents/create-order.ts
- Tests existentes de referencia: src/lib/services/chat/__tests__/rag.test.ts
- Framework: Jest con mocks de Prisma y fetch global
- Patrón de mocks: ver src/tests/unit/chat/intents.test.ts

Requerimientos específicos:

Tests Unitarios (src/lib/services/chat/__tests__/create-order.test.ts):
1. extractOrderParams con OpenAI disponible:
   - Input: "Quiero pedir 5 cajas de mango para Fresh Foods Inc"
   - Mock OpenAI retorna: { customer_name: "Fresh Foods", items: [{product_name: "Mango", quantity: 5, unit: "box"}] }
   - Verificar que retorna objeto con customerName e items correctos

2. extractOrderParams con OpenAI no disponible (fallback):
   - Sin OPENAI_API_KEY configurado
   - Verificar que retorna null o usa regex básico

3. Validación de cliente encontrado:
   - Mock prisma.customer.findFirst retorna cliente existente
   - Verificar que retorna customerId correcto

4. Validación de cliente NO encontrado:
   - Mock prisma.customer.findFirst retorna null
   - Verificar que retorna error con mensaje "Cliente no encontrado"

5. Validación de producto encontrado:
   - Mock prisma.product.findMany retorna producto con precios
   - Verificar que retorna productId y precio vigente

6. Validación de producto NO encontrado:
   - Mock prisma.product.findMany retorna array vacío
   - Verificar que retorna error con nombre del producto

7. Cálculo de totales:
   - Input: 2 productos con precios conocidos
   - Verificar subtotal, taxAmount (13%), total correctos

8. createInvoiceFromOrder happy path:
   - Mock prisma.invoice.create retorna factura con número
   - Mock prisma.invoiceItem.createMany exitoso
   - Verificar que retorna invoiceNumber en formato INV-YYYY-NNNN

9. Detección de confirm_order:
   - analyzeIntent("sí confirmo", "es") → intent confirm_order
   - analyzeIntent("yes proceed", "en") → intent confirm_order

10. Detección de cancel_order:
    - analyzeIntent("no cancelar", "es") → intent cancel_order
    - analyzeIntent("no cancel", "en") → intent cancel_order

Tests de Integración (src/tests/integration/create-order.test.ts):
11. Flujo completo: mensaje → extracción → validación → confirmación → factura creada
12. Flujo con cancelación: mensaje → extracción → cancelación → no se crea factura
13. Flujo con cliente no encontrado: mensaje → error con sugerencias

Criterios de aceptación:
- [ ] Mínimo 13 tests implementados
- [ ] Todos los tests pasando (100%)
- [ ] Coverage de create-order.ts >85%
- [ ] Mocks de OpenAI y Prisma correctamente configurados
- [ ] Tests determinísticos (no dependen de APIs externas)
- [ ] Tests de integración validan el flujo completo

Dependencias:
- S3-P01-A y S3-P01-B completados
- Framework Jest configurado
- Patrón de mocks de src/lib/services/chat/__tests__/rag.test.ts
---
```

---

## ⚠️ DÍA 1: E2E Firefox Fix + Coverage

---

### PROMPT #S3-P03 — Resolver E2E Firefox Timeout y Elevar Coverage

```
PROMPT #S3-P03 — E2E Firefox Fix + Coverage Total >80%
---
Agente: QA Engineer / Desarrollador Full Stack
Resumen: Resolver el timeout de E2E en Firefox (GAP-01 original del Sprint 1) y elevar
la cobertura total de tests al objetivo >80% del proyecto.

Descripción detallada:
El test E2E en Firefox falla por timeout de infraestructura (no por lógica de negocio).
Chromium y WebKit pasan exitosamente. Adicionalmente, el coverage total del proyecto
está por debajo del objetivo >80%.

Contexto del repositorio:
- Archivo E2E: tests/chat.spec.ts (o playwright-report/ para ver el reporte actual)
- Config Playwright: playwright.config.ts (si existe) o package.json scripts
- Tests existentes: 35+ archivos en src/tests/ y src/app/api/
- Coverage actual: ~40-60% (estimado)
- Referencia: CHECKPOINT_DIA3_SPRINT1.md (describe el fallo original)

Requerimientos específicos:

PARTE A — Fix E2E Firefox:
1. Revisar playwright.config.ts y aumentar timeout global a 30000ms para Firefox
2. Agregar configuración específica por browser:
   - Chromium: timeout 15000ms
   - WebKit: timeout 20000ms
   - Firefox: timeout 30000ms
3. Agregar retry: 2 para todos los browsers en CI
4. En tests/chat.spec.ts, agregar waitForLoadState('networkidle') antes de interacciones
5. Verificar que el test pasa en los 3 browsers localmente

PARTE B — Análisis de Coverage:
1. Ejecutar: npx jest --coverage --coverageReporters=text
2. Identificar los 10 archivos con menor coverage
3. Priorizar archivos de lógica de negocio crítica:
   - src/lib/services/chat/intents/*.ts
   - src/lib/services/notifications/*.ts
   - src/lib/services/bot/*.ts
   - src/app/api/v1/reports/*.ts

PARTE C — Elevar Coverage:
Para cada archivo con coverage <80%, agregar tests que cubran:
- Happy path (flujo exitoso)
- Error path (manejo de errores)
- Edge cases (valores nulos, arrays vacíos, etc.)
Priorizar archivos que afectan funcionalidades críticas de negocio.

PARTE D — Reporte de Coverage:
Generar reporte HTML de coverage en coverage/ y documentar:
- Coverage por módulo antes y después
- Archivos que aún están por debajo del objetivo
- Justificación para archivos excluidos (si aplica)

Criterios de aceptación:
- [ ] tests/chat.spec.ts pasa en Firefox, Chromium y WebKit
- [ ] playwright.config.ts con timeouts diferenciados por browser
- [ ] retry: 2 configurado para CI
- [ ] Coverage total del proyecto >80%
- [ ] Reporte de coverage generado en coverage/
- [ ] Ningún archivo de lógica de negocio crítica con coverage <70%
- [ ] Documentación de archivos excluidos del coverage (si aplica)

Dependencias:
- Playwright instalado y configurado
- Jest con coverage configurado en package.json
- Todos los tests existentes pasando antes de este prompt
---
```

---

## 🟡 DÍAS 2-3: ReportCache Activo + Performance

---

### PROMPT #S3-P02-A — Activar ReportCache en Servicio de Reportes

```
PROMPT #S3-P02-A — ReportCache: Activar Caché en Servicio de Reportes
---
Agente: Desarrollador Backend
Resumen: Activar el modelo ReportCache (ya existe en DB desde Sprint 1) en el servicio
de reportes para cachear resultados por tipo y parámetros, con TTL configurable y
mejora de performance de <2s a <500ms para reportes cacheados.

Descripción detallada:
El modelo ReportCache existe en prisma/schema.prisma con campos: id, reportType,
parameters (JSON string), data (JSON string), expiresAt, createdAt, updatedAt.
Sin embargo, el servicio de reportes en src/lib/services/reports/index.ts no lo usa.
Este prompt activa el caché en todos los endpoints de reportes.

Contexto del repositorio:
- Servicio de reportes: src/lib/services/reports/index.ts
- Endpoints de reportes: src/app/api/v1/reports/*/route.ts (6 endpoints)
- Modelo ReportCache: prisma/schema.prisma (ya existe)
- Tipos de reporte: REVENUE, AGING, TOP_PERFORMERS, PRICE_TRENDS, TOP_CUSTOMERS, TOP_PRODUCTS

Requerimientos específicos:

PARTE A — Utilidad de caché:
Crear src/lib/utils/report-cache.ts con las siguientes funciones:
- getCachedReport(reportType, parameters): busca en ReportCache por tipo y hash de params
  * Filtra por expiresAt > now() para ignorar cachés expirados
  * Retorna los datos parseados o null si no hay caché válido
- setCachedReport(reportType, parameters, data, ttlMinutes): guarda en ReportCache
  * Genera hash MD5 o SHA256 de los parámetros para la cache key
  * Calcula expiresAt = now() + ttlMinutes
  * Usa upsert para actualizar si ya existe el mismo reportType+parameters
- invalidateCache(reportType?): elimina cachés expirados o de un tipo específico
  * Sin parámetro: elimina todos los cachés con expiresAt < now()
  * Con reportType: elimina todos los cachés de ese tipo

PARTE B — TTL por tipo de reporte:
Configurar TTL en minutos por tipo (en src/lib/utils/report-cache.ts):
- REVENUE: 60 minutos (1 hora)
- AGING: 30 minutos
- TOP_PERFORMERS / TOP_CUSTOMERS / TOP_PRODUCTS: 120 minutos (2 horas)
- PRICE_TRENDS: 360 minutos (6 horas)
Los TTL deben ser configurables via variables de entorno con estos valores como default.

PARTE C — Integrar caché en servicio de reportes:
Modificar src/lib/services/reports/index.ts para:
1. Antes de calcular cada reporte, llamar a getCachedReport()
2. Si hay caché válido, retornar los datos cacheados directamente
3. Si no hay caché, calcular el reporte normalmente
4. Después de calcular, llamar a setCachedReport() con el TTL correspondiente
5. Agregar header X-Cache: HIT o MISS en las respuestas de los endpoints

PARTE D — Endpoint de invalidación manual:
Crear src/app/api/v1/reports/cache/route.ts:
- DELETE /api/v1/reports/cache: invalida todos los cachés (solo ADMIN)
- DELETE /api/v1/reports/cache?type=REVENUE: invalida cachés de un tipo (solo ADMIN)
- Responde con { success: true, deleted: N } donde N es el número de cachés eliminados

Criterios de aceptación:
- [ ] src/lib/utils/report-cache.ts creado con getCachedReport, setCachedReport, invalidateCache
- [ ] TTL configurado por tipo de reporte
- [ ] Todos los endpoints de reportes usan caché
- [ ] Header X-Cache: HIT/MISS en respuestas
- [ ] Endpoint DELETE /api/v1/reports/cache funcional (solo ADMIN)
- [ ] Performance: reportes con caché activo responden en <500ms
- [ ] Cachés expirados no se retornan

Dependencias:
- Modelo ReportCache en prisma/schema.prisma (ya existe)
- src/lib/services/reports/index.ts (existente)
- src/lib/auth/middleware.ts (para verificar rol ADMIN)
---
```

---

### PROMPT #S3-P02-B — Cron Job de Limpieza de Caché + Tests

```
PROMPT #S3-P02-B — ReportCache: Cron de Limpieza + Tests de Performance
---
Agente: Desarrollador Backend / QA Engineer
Resumen: Implementar el cron job de limpieza automática de cachés expirados y crear
la suite de tests para validar el comportamiento del caché y la mejora de performance.

Descripción detallada:
Complemento de S3-P02-A. Agrega limpieza automática de cachés expirados y tests
que validan cache hit, cache miss, expiración y performance.

Contexto del repositorio:
- Cron existente: src/app/api/v1/cron/overdue-notifications/route.ts (patrón a seguir)
- Utilidad de caché: src/lib/utils/report-cache.ts (creado en S3-P02-A)
- CRON_SECRET: ya configurado en .env.example

Requerimientos específicos:

PARTE A — Cron Job de Limpieza:
Crear src/app/api/v1/cron/clean-report-cache/route.ts:
- GET protegido con header x-cron-secret
- Llama a invalidateCache() sin parámetros (elimina todos los expirados)
- Retorna { success: true, deleted: N, timestamp: ISO }
- Documentar en RUNBOOK_OPERACIONES.md cómo configurar en Railway Cron

PARTE B — Tests de Caché:
Crear src/tests/unit/reports/report-cache.test.ts:
1. getCachedReport: retorna null cuando no hay caché
2. getCachedReport: retorna datos cuando hay caché válido
3. getCachedReport: retorna null cuando el caché está expirado
4. setCachedReport: crea nuevo registro en DB
5. setCachedReport: actualiza registro existente (upsert)
6. invalidateCache: elimina cachés expirados
7. invalidateCache con tipo: elimina solo cachés de ese tipo
8. Header X-Cache: HIT cuando hay caché válido
9. Header X-Cache: MISS cuando no hay caché
10. Performance: segundo request es más rápido que el primero (con caché)

PARTE C — Actualizar RUNBOOK_OPERACIONES.md:
Agregar sección "Gestión de Caché de Reportes" con:
- Cómo verificar cachés activos: SELECT * FROM report_cache WHERE expires_at > NOW();
- Cómo invalidar manualmente: curl -X DELETE /api/v1/reports/cache -H "Authorization: Bearer TOKEN"
- Cómo configurar el cron en Railway: Settings → Cron Jobs → GET /api/v1/cron/clean-report-cache

Criterios de aceptación:
- [ ] Cron job de limpieza creado y protegido con CRON_SECRET
- [ ] Mínimo 10 tests de caché pasando
- [ ] Tests de performance validan mejora con caché activo
- [ ] RUNBOOK_OPERACIONES.md actualizado con sección de caché
- [ ] Coverage de report-cache.ts >85%

Dependencias:
- S3-P02-A completado
- CRON_SECRET en .env
- Patrón de cron en src/app/api/v1/cron/overdue-notifications/route.ts
---
```

---

## 🟡 DÍAS 3-5: SPA Pública — Landing Page Institucional

---

### PROMPT #S3-P04-A — Estructura y Layout de la SPA Pública

```
PROMPT #S3-P04-A — SPA Pública: Estructura, Layout y Rutas
---
Agente: Desarrollador Frontend / UI Developer
Resumen: Crear la estructura base de la SPA pública de HAGO PRODUCE con layout,
rutas y componentes base, sin autenticación requerida.

Descripción detallada:
Implementar la landing page pública de HAGO PRODUCE (Fase 2 item 2.5 del roadmap).
La SPA debe ser accesible sin autenticación, con diseño profesional y responsive,
orientada a clientes potenciales y actuales.

Contexto del repositorio:
- Stack: Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui
- Rutas existentes: src/app/(admin)/, src/app/(customer)/, src/app/api/
- Componentes UI: src/components/ui/ (shadcn/ui ya configurado)
- Colores de marca: gradiente #667eea → #764ba2 (ver DASHBOARD_EJECUTIVO_FASE2.html)
- Middleware: src/middleware.ts (verificar que rutas públicas no requieren auth)

Requerimientos específicos:

PARTE A — Route Group Público:
Crear src/app/(public)/ con:
- layout.tsx: Layout sin sidebar de admin, con header y footer públicos
- page.tsx: Landing page principal (/)
- Verificar en src/middleware.ts que las rutas bajo (public) no requieren JWT

PARTE B — Header Público:
Crear src/components/public/PublicHeader.tsx:
- Logo HAGO PRODUCE con gradiente de marca
- Navegación: Inicio, Productos, Nosotros, Contacto
- Botón "Portal de Clientes" → /customer/login
- Botón "Acceso Interno" → /login (para usuarios internos)
- Menú hamburguesa en mobile
- Sticky con sombra al hacer scroll

PARTE C — Footer Público:
Crear src/components/public/PublicFooter.tsx:
- Logo y descripción breve de HAGO PRODUCE
- Links de navegación
- Información de contacto (placeholder)
- Copyright © 2026 HAGO PRODUCE
- Links: Política de Privacidad, Términos de Uso

PARTE D — SEO y Meta Tags:
En src/app/(public)/layout.tsx configurar:
- title: "HAGO PRODUCE — Distribuidora de Frutas y Verduras en Canadá"
- description: "Proveedor confiable de frutas, verduras y frutos secos frescos en Canadá"
- Open Graph: og:title, og:description, og:image (placeholder)
- Viewport y charset correctos

Criterios de aceptación:
- [ ] Route group (public) creado con layout.tsx y page.tsx
- [ ] Rutas públicas accesibles sin autenticación (verificar middleware)
- [ ] PublicHeader con navegación y botones de acceso
- [ ] PublicFooter con información de contacto
- [ ] SEO meta tags configurados
- [ ] Responsive design (mobile-first)
- [ ] Consistente con paleta de colores de marca

Dependencias:
- Next.js 14 App Router configurado
- Tailwind CSS y shadcn/ui instalados
- src/middleware.ts accesible para modificar rutas públicas
---
```

---

### PROMPT #S3-P04-B — Secciones de Contenido de la Landing Page

```
PROMPT #S3-P04-B — SPA Pública: Hero, Productos Destacados, Nosotros y Contacto
---
Agente: Desarrollador Frontend / UI Developer
Resumen: Implementar las secciones de contenido de la landing page: Hero con CTA,
Productos Destacados cargados desde DB, Sobre Nosotros y Formulario de Contacto.

Descripción detallada:
Completar el contenido de la landing page con secciones que comuniquen el valor
de HAGO PRODUCE y permitan a clientes potenciales conocer los productos y contactar.

Contexto del repositorio:
- Layout base: src/app/(public)/layout.tsx (creado en S3-P04-A)
- Componentes UI: src/components/ui/ (shadcn/ui)
- API de productos: src/app/api/v1/products/route.ts (GET existente)
- Modelo Product: name, nameEs, description, category, unit, isActive

Requerimientos específicos:

PARTE A — Sección Hero:
Crear src/components/public/HeroSection.tsx:
- Título principal: "Frutas y Verduras Frescas para tu Negocio"
- Subtítulo: "Distribuidor confiable en Canadá con más de X años de experiencia"
- CTA primario: "Ver Catálogo" → scroll a sección de productos
- CTA secundario: "Portal de Clientes" → /customer/login
- Imagen de fondo o ilustración de frutas/verduras (usar imagen de Unsplash)
- Gradiente de marca como overlay

PARTE B — Sección Productos Destacados:
Crear src/components/public/FeaturedProducts.tsx:
- Cargar productos activos desde API: GET /api/v1/products?is_active=true&per_page=8
- Mostrar en grid de 4 columnas (2 en tablet, 1 en mobile)
- Cada card: nombre del producto, categoría, imagen placeholder por categoría
- Filtros por categoría (frutas, verduras, frutos secos)
- Loading skeleton mientras carga
- Estado vacío si no hay productos

PARTE C — Sección Sobre Nosotros:
Crear src/components/public/AboutSection.tsx:
- Título: "¿Quiénes somos?"
- Descripción de HAGO PRODUCE (texto institucional)
- 3 pilares: Calidad, Frescura, Confiabilidad
- Estadísticas: X clientes, X productos, X años de experiencia (valores configurables)
- Imagen o ilustración representativa

PARTE D — Formulario de Contacto:
Crear src/components/public/ContactForm.tsx:
- Campos: Nombre, Email, Empresa, Mensaje
- Validación client-side con mensajes en español
- Al enviar: POST /api/v1/contact (crear este endpoint simple)
- El endpoint guarda en DB o envía email (implementar como AuditLog por ahora)
- Feedback visual: loading, éxito, error
- Mapa o dirección de la empresa (placeholder)

Criterios de aceptación:
- [ ] HeroSection con CTA funcionales
- [ ] FeaturedProducts carga datos reales de DB
- [ ] Filtros por categoría funcionan
- [ ] Loading skeleton implementado
- [ ] AboutSection con contenido institucional
- [ ] ContactForm con validaciones y feedback
- [ ] Endpoint POST /api/v1/contact creado
- [ ] Lighthouse score >85 en Performance
- [ ] Lighthouse score >90 en Accessibility

Dependencias:
- S3-P04-A completado (layout y rutas)
- API GET /api/v1/products existente
- Imágenes de Unsplash para productos (usar URLs reales)
---
```

---

## 🟡 DÍAS 4-6: Portal Cliente Avanzado con Gráficos

---

### PROMPT #S3-P05-A — Dashboard con Gráficos para Portal de Cliente

```
PROMPT #S3-P05-A — Portal Cliente: Dashboard con Gráficos de Compras Históricas
---
Agente: Desarrollador Full Stack / Frontend
Resumen: Mejorar el portal de cliente con un dashboard de gráficos que muestre
compras históricas por mes, top productos comprados y estado de cuenta visual.

Descripción detallada:
El portal de cliente existe en src/app/(customer)/ con funcionalidades básicas.
Este prompt agrega un dashboard visual con gráficos usando Chart.js (ya incluido
en el proyecto según DASHBOARD_EJECUTIVO_FASE2.html).

Contexto del repositorio:
- Portal cliente: src/app/(customer)/ (rutas existentes)
- Auth cliente: src/lib/hooks/useCustomerAuth.ts
- API facturas: src/app/api/v1/invoices/route.ts (GET con filtro por customerId)
- Chart.js: ya usado en DASHBOARD_EJECUTIVO_FASE2.html (disponible via CDN o npm)
- Modelo Invoice: status, total, issueDate, dueDate, customerId

Requerimientos específicos:

PARTE A — Endpoint de Analytics para Cliente:
Crear src/app/api/v1/customer/analytics/route.ts:
- GET protegido con auth de cliente (useCustomerAuth)
- Retorna datos para los gráficos:
  * monthly_purchases: array de { month: "YYYY-MM", total: number, count: number }
    para los últimos 12 meses
  * top_products: array de { productName: string, totalQuantity: number, totalAmount: number }
    top 5 productos más comprados
  * account_summary: { totalPending, totalOverdue, totalPaid, invoicesCount }
  * upcoming_due: facturas con dueDate en los próximos 7 días

PARTE B — Componente de Gráfico de Compras Mensuales:
Crear src/components/customer/MonthlyPurchasesChart.tsx:
- Gráfico de barras con Chart.js (o recharts si ya está instalado)
- Eje X: últimos 12 meses (formato "Ene 2026")
- Eje Y: monto total en CAD
- Tooltip con monto y número de facturas
- Responsive con altura fija de 300px
- Loading skeleton mientras carga

PARTE C — Componente de Top Productos:
Crear src/components/customer/TopProductsChart.tsx:
- Gráfico de dona (doughnut) con top 5 productos
- Leyenda con nombre y porcentaje
- Colores consistentes con la paleta de marca
- Tooltip con cantidad total y monto

PARTE D — Componente de Estado de Cuenta:
Crear src/components/customer/AccountSummaryCards.tsx:
- 4 tarjetas: Total Pagado, Pendiente, Vencido, Próximo a Vencer
- Colores semafóricos: verde (pagado), amarillo (pendiente), rojo (vencido), naranja (próximo)
- Monto en CAD con formato de moneda
- Número de facturas en cada categoría

PARTE E — Integrar en Dashboard del Cliente:
Modificar src/app/(customer)/dashboard/page.tsx (o crear si no existe):
- Layout con las 4 tarjetas de estado de cuenta arriba
- Gráfico de compras mensuales en el centro
- Gráfico de top productos a la derecha
- Tabla de facturas recientes abajo (ya existente o crear)

Criterios de aceptación:
- [ ] Endpoint /api/v1/customer/analytics retorna datos correctos
- [ ] Gráfico de barras mensual implementado con Chart.js
- [ ] Gráfico de dona de top productos implementado
- [ ] Tarjetas de estado de cuenta con colores semafóricos
- [ ] Dashboard integrado en portal de cliente
- [ ] Loading states en todos los componentes
- [ ] Datos filtrados por customerId del cliente autenticado
- [ ] Responsive design

Dependencias:
- Auth de cliente: src/lib/hooks/useCustomerAuth.ts
- API de facturas existente
- Chart.js disponible (CDN o npm)
---
```

---

### PROMPT #S3-P05-B — Historial Completo y Descarga Masiva de Facturas

```
PROMPT #S3-P05-B — Portal Cliente: Historial Completo + Descarga Masiva de PDFs
---
Agente: Desarrollador Full Stack
Resumen: Implementar el historial completo de facturas con filtros avanzados y
la funcionalidad de descarga masiva de PDFs como archivo ZIP.

Descripción detallada:
El portal de cliente necesita una vista de historial completo de facturas con
filtros por fecha, estado y monto, y la capacidad de seleccionar múltiples facturas
y descargarlas como un archivo ZIP.

Contexto del repositorio:
- Portal cliente: src/app/(customer)/invoices/ (crear si no existe)
- API facturas: src/app/api/v1/invoices/route.ts (GET con paginación)
- PDF export: src/lib/services/reports/export.ts (ya existe lógica de PDF)
- Auth cliente: src/lib/hooks/useCustomerAuth.ts

Requerimientos específicos:

PARTE A — Vista de Historial Completo:
Crear src/app/(customer)/invoices/page.tsx:
- Tabla con columnas: Número, Fecha, Vencimiento, Estado, Total, Acciones
- Paginación: 20 facturas por página
- Filtros: Estado (todos/draft/sent/pending/paid/cancelled), Rango de fechas, Búsqueda por número
- Ordenamiento por: Fecha (desc default), Vencimiento, Total
- Badge de estado con colores semafóricos
- Botón de descarga individual por factura

PARTE B — Selección Múltiple para Descarga Masiva:
Agregar a la tabla:
- Checkbox en cada fila para selección
- Checkbox "Seleccionar todos" en el header
- Contador de facturas seleccionadas
- Botón "Descargar seleccionadas (N)" que aparece cuando hay selección
- Límite de 20 facturas por descarga masiva

PARTE C — Endpoint de Descarga Masiva:
Crear src/app/api/v1/customer/invoices/bulk-download/route.ts:
- POST con body: { invoiceIds: string[] }
- Verificar que todas las facturas pertenecen al cliente autenticado
- Generar PDF para cada factura (reutilizar lógica de export.ts)
- Comprimir en ZIP usando la librería 'archiver' o 'jszip'
- Retornar el ZIP como blob con Content-Type: application/zip
- Nombre del archivo: facturas_HAGO_PRODUCE_YYYY-MM-DD.zip
- Límite: máximo 20 facturas por request

PARTE D — Notificaciones en Tiempo Real (Polling):
Crear src/components/customer/NotificationBell.tsx:
- Icono de campana en el header del portal
- Badge con número de notificaciones no leídas
- Polling cada 30 segundos a GET /api/v1/notifications
- Dropdown con las últimas 5 notificaciones
- Marcar como leída al hacer click
- Link a la factura relacionada si aplica

Criterios de aceptación:
- [ ] Historial completo con paginación y filtros
- [ ] Selección múltiple con checkbox funcional
- [ ] Endpoint de descarga masiva retorna ZIP válido
- [ ] ZIP contiene PDFs de las facturas seleccionadas
- [ ] Límite de 20 facturas por descarga masiva
- [ ] NotificationBell con polling cada 30s
- [ ] Notificaciones marcadas como leídas al interactuar
- [ ] Responsive design

Dependencias:
- S3-P05-A completado (dashboard base)
- src/lib/services/reports/export.ts (generación de PDF)
- Librería ZIP disponible (archiver o jszip)
- API GET /api/v1/notifications existente
---
```

---

## 📋 CHECKPOINTS DEL SPRINT 3

---

### CHECKPOINT #S3-CP1 — Fin del Día 2: create_order + E2E Fix

```
CHECKPOINT #S3-CP1 — Fin del Día 2: create_order + E2E Firefox
---
Agente: Tech Lead / Project Manager
Resumen: Documentar el progreso al finalizar el Día 2 del Sprint 3, validando
que create_order con Function Calling y el fix de E2E Firefox están completados.

Información a registrar:

1. Estado de S3-P01 (create_order):
   - S3-P01-A (Extracción OpenAI): ✅ / ⚠️ / ❌
   - S3-P01-B (Creación Invoice DRAFT): ✅ / ⚠️ / ❌
   - S3-P01-C (Tests completos): ✅ / ⚠️ / ❌
   - Coverage create-order.ts: ___%
   - Gaps detectados: [ COMPLETAR ]

2. Estado de S3-P03 (E2E Firefox):
   - Firefox timeout resuelto: ✅ / ❌
   - Coverage total del proyecto: ___%
   - Tests E2E pasando en 3 browsers: ✅ / ⚠️ / ❌

3. Resultados de tests:
   - Total tests ejecutados: ___
   - Tests pasando: ___ (%__)
   - Tests fallando: ___

4. Archivos modificados/creados:
   [ COMPLETAR lista de archivos ]

5. Decisión de continuidad:
   - ¿Listo para continuar a Días 3-4 (ReportCache + SPA)?
   - Bloqueadores identificados: [ COMPLETAR o "Ninguno" ]

Criterios de aceptación:
- [ ] Documento de checkpoint generado
- [ ] Estado de S3-P01 y S3-P03 documentado
- [ ] Resultados de tests registrados
- [ ] Decisión de continuidad tomada
- [ ] Guardado en DocumentacionHagoProduce/FaseDos/CHECKPOINT_DIA2_SPRINT3.md
---
```

---

### CHECKPOINT #S3-CP2 — Fin del Día 4: ReportCache + SPA Pública

```
CHECKPOINT #S3-CP2 — Fin del Día 4: ReportCache + SPA Pública
---
Agente: Tech Lead / Project Manager
Resumen: Documentar el progreso al finalizar el Día 4 del Sprint 3, validando
que ReportCache está activo y la SPA pública tiene su estructura base.

Información a registrar:

1. Estado de S3-P02 (ReportCache):
   - S3-P02-A (Caché activo en reportes): ✅ / ⚠️ / ❌
   - S3-P02-B (Cron limpieza + tests): ✅ / ⚠️ / ❌
   - Performance con caché: ___ ms (objetivo <500ms)
   - Performance sin caché: ___ ms

2. Estado de S3-P04 (SPA Pública):
   - S3-P04-A (Estructura y layout): ✅ / ⚠️ / ❌
   - S3-P04-B (Secciones de contenido): ✅ / ⚠️ / ❌
   - Lighthouse Performance: ___
   - Lighthouse Accessibility: ___

3. Resultados de tests:
   - Tests de caché pasando: ___ / ___
   - Coverage report-cache.ts: ___%

4. Archivos modificados/creados:
   [ COMPLETAR lista de archivos ]

5. Decisión de continuidad:
   - ¿Listo para continuar a Días 5-6 (Portal Cliente)?
   - Bloqueadores identificados: [ COMPLETAR o "Ninguno" ]

Criterios de aceptación:
- [ ] Documento de checkpoint generado
- [ ] Estado de S3-P02 y S3-P04 documentado
- [ ] Métricas de performance registradas
- [ ] Decisión de continuidad tomada
- [ ] Guardado en DocumentacionHagoProduce/FaseDos/CHECKPOINT_DIA4_SPRINT3.md
---
```

---

### CHECKPOINT #S3-CP3 — Cierre Oficial del Sprint 3

```
CHECKPOINT #S3-CP3 — Cierre Oficial del Sprint 3
---
Agente: Tech Lead / Project Manager
Resumen: Documento de cierre oficial del Sprint 3, validando todos los entregables,
métricas finales y decisión de continuidad hacia Sprint 4 o producción.

Información a registrar:

1. Estado de todos los prompts:
   - S3-P01 (create_order): ✅ / ⚠️ / ❌
   - S3-P02 (ReportCache): ✅ / ⚠️ / ❌
   - S3-P03 (E2E Firefox): ✅ / ⚠️ / ❌
   - S3-P04 (SPA Pública): ✅ / ⚠️ / ❌
   - S3-P05 (Portal Cliente): ✅ / ⚠️ / ❌

2. Métricas finales:
   - Coverage total: ___%
   - Tests pasando: ___ / ___ (%__)
   - Performance reportes con caché: ___ ms
   - Lighthouse SPA: Performance ___, Accessibility ___
   - E2E Firefox: ✅ / ❌

3. Gaps identificados para Sprint 4:
   [ COMPLETAR lista de gaps ]

4. Decisión de continuidad:
   - ¿Listo para Sprint 4 o producción?
   - Condiciones pendientes: [ COMPLETAR o "Ninguno" ]

5. Lecciones aprendidas:
   [ COMPLETAR mínimo 3 puntos ]

Criterios de aceptación:
- [ ] Documento de cierre generado
- [ ] Estado de todos los prompts documentado
- [ ] Métricas finales registradas
- [ ] Gaps para Sprint 4 identificados
- [ ] Decisión de continuidad tomada
- [ ] Guardado en DocumentacionHagoProduce/FaseDos/CHECKPOINT_CIERRE_SPRINT3.md
---
```

---

## 📊 RESUMEN EJECUTIVO DEL SPRINT 3

### Timeline Completo

```
Día 1:   S3-P03 (E2E Firefox) + S3-P01-A inicio (create_order extracción)
Día 2:   S3-P01-B (Invoice DRAFT) + S3-P01-C (Tests) → CHECKPOINT S3-CP1
Día 3:   S3-P02-A (ReportCache activo) + S3-P04-A inicio (SPA estructura)
Día 4:   S3-P02-B (Cron + Tests) + S3-P04-B (SPA contenido) → CHECKPOINT S3-CP2
Día 5:   S3-P05-A (Portal dashboard gráficos)
Día 6:   S3-P05-B (Historial + descarga masiva)
Día 7:   Testing E2E completo + ajustes finales
Día 8:   CHECKPOINT S3-CP3 (Cierre oficial)
```

### Dependencias Críticas

```
S3-P03 (E2E) ──────────────────────────────────────────► Sin dependencias
S3-P01-A ──────────────────────────────────────────────► ChatSession (S2-01) ✅
S3-P01-B ──────────────────────────────────────────────► S3-P01-A
S3-P01-C ──────────────────────────────────────────────► S3-P01-A + S3-P01-B
S3-P02-A ──────────────────────────────────────────────► ReportCache model (Sprint 1) ✅
S3-P02-B ──────────────────────────────────────────────► S3-P02-A
S3-P04-A ──────────────────────────────────────────────► Sin dependencias
S3-P04-B ──────────────────────────────────────────────► S3-P04-A
S3-P05-A ──────────────────────────────────────────────► S3-P04-A (layout público)
S3-P05-B ──────────────────────────────────────────────► S3-P05-A + S2-04 (notificaciones) ✅
```

### Métricas de Éxito del Sprint 3

| Métrica | Objetivo |
|---|---|
| Coverage total | >80% |
| E2E Firefox | ✅ Pasando |
| create_order con Function Calling | ✅ Funcional |
| Reportes con caché | <500ms |
| SPA Pública Lighthouse Performance | >85 |
| Portal Cliente con gráficos | ✅ Funcional |
| Descarga masiva de PDFs | ✅ Funcional |

---

**Documento generado:** 2026-02-23  
**Sprint:** 3 — Completitud & Experiencia de Usuario  
**Duración Estimada:** 8 días hábiles  
**Basado en:** Gaps reales del Sprint 2 + Roadmap Fase 2  
**Repositorio:** https://github.com/nhadadn/Hago-Produce