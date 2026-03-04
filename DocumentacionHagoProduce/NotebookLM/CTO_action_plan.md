# 📄 CTO DOCUMENT - HAGO PRODUCE CHATBOT
# Sprint 7 | Fecha: 28/02/2026

## 1. RESUMEN EJECUTIVO

El chatbot de HAGO PRODUCE presenta una **discrepancia crítica entre la documentación ideal y la realidad operativa**: mientras que el 100% de los intents documentados están implementados a nivel de código, el sistema de enrutamiento (NLU) presenta fallos estructurales que bloquean el acceso a esta funcionalidad. La arquitectura híbrida actual (Regex + OpenAI) prioriza reglas deterministas sobre inteligencia semántica, resultando en una percepción de funcionalidad del ~10% por parte de los usuarios a pesar de tener ~80% de código funcional.

**Top 3 brechas críticas:**
1. **Regex agresiva de facturas** bloquea cualquier intento de crear facturas al interpretar "crear factura nueva" como consulta de estatus
2. **Ausencia de OpenAI Tools** en el router principal aumenta latencia y tasa de error en clasificación de intents
3. **Intents de facturación faltantes** en el sistema de tipos (`create_invoice`, `confirm_invoice`, `cancel_invoice`) no existen en el código

**Recomendación principal:** Invertir la lógica de detección para priorizar OpenAI sobre Regex, implementar Tools para clasificación robusta, y completar la implementación de intents de facturación.

## 2. VISIÓN OBJETIVO

### Qué debe hacer el chatbot (del ground truth)
El chatbot debe funcionar como asistente virtual integrado en el ERP de HAGO PRODUCE, capaz de:

**Consultas Informativas (9 intents):**
- `price_lookup`: Consultar precios de productos (costo/venta) y proveedor
- `best_supplier`: Encontrar los 5 proveedores con mejor precio para un producto
- `invoice_status`: Consultar estado de factura por número
- `customer_balance`: Mostrar saldo pendiente de clientes
- `product_info`: Información detallada de producto (SKU, categoría, precios)
- `inventory_summary`: Resumen de productos por categoría con rangos de precios
- `overdue_invoices`: Listar facturas vencidas filtrables por días
- `customer_info`: Buscar información de contacto y fiscal de clientes

**Acciones Transaccionales (8 intents):**
- `create_order` / `confirm_order` / `cancel_order`: Gestión de pedidos de clientes
- `create_purchase_order` / `confirm_purchase_order` / `cancel_purchase_order`: Órdenes de compra a proveedores
- `create_invoice` / `confirm_invoice` / `cancel_invoice`: Creación de facturas directas

### KPIs de éxito definidos
- Intent recognition rate: ≥90%
- Fallback rate máximo: ≤10%
- Tiempo de respuesta: <1.2s mediana
- Tasa de éxito end-to-end: ≥95% en staging

### Arquitectura objetivo resumida
```
Usuario → API Route (/api/chat) → NLU Router (OpenAI Tools优先)
                                    ↓
                         Query Executor → Intent Handlers
                                    ↓
                         ERP Services (Invoices, Orders, etc.)
                                    ↓
                         PostgreSQL (Prisma ORM)
```

## 3. ESTADO ACTUAL

### ✅ Qué está funcionando
- **Persistencia de sesiones**: Tabla `ChatSession` con campo `context` (JSONB) funciona correctamente
- **Rate limiting**: Implementado en `route.ts` con límite configurable (default: 20)
- **Handlers de intents**: 14 de 17 intents implementados y funcionales:
  - Todos los intents de consultas informativas (9/9)
  - Intents de pedidos: `create_order`, `confirm_order`, `cancel_order` (3/3)
  - Intents de purchase orders: `create_purchase_order`, `confirm_purchase_order`, `cancel_purchase_order` (3/3)
- **Integración con servicios**: Conexión correcta con `InvoicesService`, `OrdersService`, `PurchaseOrdersService`
- **Formato de respuestas**: `formatResponse` usa OpenAI para generar respuestas naturales
- **Manejo de contexto**: Actualización correcta de `pendingOrder` y `pendingPurchaseOrders`

### ⚠️ Qué está parcialmente implementado
- **NLU Router**: Sistema híbrido Regex + OpenAI pero con orden incorrecto de prioridad
- **Clasificación de intents**: `classifyChatIntentWithOpenAI` funciona pero NO usa Tools, solo prompts de texto
- **Fallbacks**: Existen pero son básicos (fallback a `price_lookup` en la mayoría de casos)

### ❌ Qué está pendiente o roto
- **Intents de facturación**: `create_invoice`, `confirm_invoice`, `cancel_invoice` NO existen en:
  - `src/lib/chat/types.ts` (tipo `ChatIntent`)
  - `src/lib/services/chat/intents/` (archivos de implementación)
  - `src/lib/services/chat/query-executor.ts` (dispatcher)
- **Regex de facturas**: Línea 189 en `intents.ts` captura incorrectamente "crear factura nueva"
- **OpenAI Tools**: Router principal NO usa function calling, solo JSON parsing
- **Prioridad de detección**: Regex se evalúa ANTES de OpenAI, bloqueando la IA

### Archivos clave involucrados
- `src/app/api/chat/route.ts`: Orquestador principal (autenticación, rate limiting, sesión)
- `src/lib/services/chat/intents.ts`: Analizador de intents (Regex + OpenAI) - **CRÍTICO**
- `src/lib/services/chat/openai-client.ts`: Cliente OpenAI - **NECESITA REFACTOR**
- `src/lib/services/chat/query-executor.ts`: Dispatcher de intents
- `src/lib/chat/types.ts`: Definición de tipos - **INCOMPLETO**
- `src/lib/services/chat/intents/*.ts`: Handlers individuales (14 archivos existentes)

## 4. ANÁLISIS DE BRECHAS

| Brecha | Impacto Usuario | Impacto Negocio | Prioridad | Archivos |
|--------|----------------|-----------------|-----------|----------|
| Regex agresiva de facturas captura "crear factura nueva" como consulta de estatus | Alto - Bloquea creación de facturas | Alto - Impacta facturación | Must | `src/lib/services/chat/intents.ts:189` |
| Ausencia de intents `create_invoice`, `confirm_invoice`, `cancel_invoice` en tipos y código | Alto - Funcionalidad no disponible | Alto - Core del ERP | Must | `src/lib/chat/types.ts`, `src/lib/services/chat/intents/`, `src/lib/services/chat/query-executor.ts` |
| Router NO usa OpenAI Tools, solo JSON parsing | Medio - Aumenta errores de clasificación | Medio - Aumenta costos de soporte | Must | `src/lib/services/chat/openai-client.ts` |
| Prioridad incorrecta: Regex antes de OpenAI | Alto - IA nunca corrige errores de Regex | Alto - Experiencia de usuario pobre | Must | `src/lib/services/chat/intents.ts` |
| Fallback genérico a `price_lookup` | Medio - Respuestas irrelevantes | Medio - Confusión de usuarios | Should | `src/lib/services/chat/openai-client.ts`, `src/lib/services/chat/intents.ts` |
| Búsqueda de productos por texto (no semántica) | Bajo - No encuentra "guacamole" → "aguacate" | Bajo - UX subóptima | Could | `src/lib/services/chat/intents/*.ts` |
| Internacionalización parcial (hardcoded en inglés/español) | Bajo - Respuestas mixtas | Bajo - Imagen profesional | Could | Múltiples archivos |

## 5. PLAN ESTRATÉGICO DE CIERRE

### Fase 1 - Quick Wins (Sprint actual - 48-72 horas)

#### Acción 1.1: Corregir Regex de facturas
- **Descripción**: Hacer regex más estricta o eliminarla para facturas
- **Responsable**: Backend Developer
- **Criterio de éxito**: "Quiero crear una factura nueva" → `create_invoice` (no `invoice_status`)
- **Dependencias**: Ninguna
- **Archivos**: `src/lib/services/chat/intents.ts:189`

#### Acción 1.2: Invertir lógica de detección
- **Descripción**: Llamar a OpenAI PRIMERO para clasificación general, usar Regex solo para extracción específica
- **Responsable**: Backend Developer
- **Criterio de éxito**: OpenAI clasifica antes que Regex en 100% de casos
- **Dependencias**: Ninguna
- **Archivos**: `src/lib/services/chat/intents.ts`

#### Acción 1.3: Implementar intents de facturación
- **Descripción**: Crear `create-invoice.ts`, `confirm-invoice.ts`, `cancel-invoice.ts` y actualizar tipos
- **Responsable**: Backend Developer
- **Criterio de éxito**: Los 3 intents funcionan end-to-end
- **Dependencias**: `InvoicesService` ya existe
- **Archivos**: `src/lib/chat/types.ts`, `src/lib/services/chat/intents/create-invoice.ts`, `src/lib/services/chat/query-executor.ts`

### Fase 2 - Mejoras estructurales (próx. 2 sprints)

#### Acción 2.1: Implementar OpenAI Tools en router
- **Descripción**: Refactorizar `classifyChatIntentWithOpenAI` para usar `tools` en lugar de JSON parsing
- **Responsable**: Backend Developer + AI Engineer
- **Criterio de éxito**: Intent recognition rate ≥90%
- **Dependencias**: Fase 1 completada
- **Archivos**: `src/lib/services/chat/openai-client.ts`

#### Acción 2.2: Mejorar sistema de fallbacks
- **Descripción**: Implementar fallbacks específicos por intent, no genérico a `price_lookup`
- **Responsable**: Backend Developer
- **Criterio de éxito**: Fallback rate ≤10%
- **Dependencias**: Acción 2.1
- **Archivos**: `src/lib/services/chat/openai-client.ts`, `src/lib/services/chat/intents.ts`

#### Acción 2.3: Búsqueda semántica de productos
- **Descripción**: Implementar búsqueda vectorial para productos (ej. "guacamole" → "aguacate")
- **Responsable**: Backend Developer + AI Engineer
- **Criterio de éxito**: Búsqueda semántica funciona para 90% de casos
- **Dependencias**: Vector database (ej. pgvector)
- **Archivos**: `src/lib/services/chat/intents/*.ts`

### Fase 3 - Optimización (largo plazo)

#### Acción 3.1: Internacionalización completa
- **Descripción**: Mover todos los textos hardcodeados a archivos de traducción
- **Responsable**: Frontend Developer
- **Criterio de éxito**: 100% de respuestas en idioma del usuario
- **Dependencias**: Ninguna
- **Archivos**: Múltiples archivos

#### Acción 3.2: Historial conversacional profundo
- **Descripción**: Implementar RAG para referencias a conversaciones pasadas
- **Responsable**: AI Engineer
- **Criterio de éxito**: Bot recuerda contexto de sesiones anteriores
- **Dependencias**: Vector database
- **Archivos**: `src/lib/services/chat/`

#### Acción 3.3: Edición de items en flujos multi-turno
- **Descripción**: Permitir editar items individuales en confirmación de pedidos
- **Responsable**: Backend Developer
- **Criterio de éxito**: Usuario puede decir "cambia los tomates a 6 cajas"
- **Dependencias**: Fase 2 completada
- **Archivos**: `src/lib/services/chat/intents/create-order.ts`

## 6. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| OpenAI API downtime o rate limits | Media | Alto | Implementar fallback robusto a Regex + caché de clasificaciones |
| Costos de OpenAI escalan con uso | Alta | Medio | Implementar caché de intents comunes, usar modelo más pequeño |
| Cambios en API de OpenAI rompen Tools | Baja | Alto | Versionar cliente OpenAI, tests de integración |
| Usuarios confundidos con respuestas incorrectas | Alta | Alto | Mejorar mensajes de error, agregar botón "¿Quisiste decir...?" |
| Performance degradada con muchos intents | Media | Medio | Implementar rate limiting, monitoreo de latencia |
| Seguridad: inyección de prompts | Baja | Crítico | Sanitizar inputs, validar outputs de OpenAI |

## 7. ARCHIVOS Y MÓDULOS CLAVE

### Core del Chatbot
- **`src/app/api/chat/route.ts`**: Orquestador principal. Maneja autenticación, rate limiting, sesión, llama a `analyzeIntent` y `executeQuery`
- **`src/lib/services/chat/intents.ts`**: Analizador de intents. **CRÍTICO** - contiene Regex defectuosa y orden incorrecto de evaluación
- **`src/lib/services/chat/openai-client.ts`**: Cliente OpenAI. **NECESITA REFACTOR** - no usa Tools para clasificación
- **`src/lib/services/chat/query-executor.ts`**: Dispatcher. Delega a handlers según intent detectado
- **`src/lib/chat/types.ts`**: Definición de tipos. **INCOMPLETO** - faltan intents de facturación

### Handlers de Intents (Implementados)
- **`src/lib/services/chat/intents/price-lookup.ts`**: Consulta precios de productos
- **`src/lib/services/chat/intents/best-supplier.ts`**: Encuentra mejores proveedores
- **`src/lib/services/chat/intents/invoice-status.ts`**: Consulta estado de facturas
- **`src/lib/services/chat/intents/customer-balance.ts`**: Calcula saldo de clientes
- **`src/lib/services/chat/intents/product-info.ts`**: Información de productos
- **`src/lib/services/chat/intents/inventory-summary.ts`**: Resumen de inventario
- **`src/lib/services/chat/intents/overdue-invoices.ts`**: Lista facturas vencidas
- **`src/lib/services/chat/intents/customer-info.ts`**: Información de clientes
- **`src/lib/services/chat/intents/create-order.ts`**: Crea pedidos de clientes (3 intents: create, confirm, cancel)
- **`src/lib/services/chat/intents/create-purchase-order.ts`**: Crea órdenes de compra (3 intents: create, confirm, cancel)

### Handlers de Intents (FALTANTES)
- **`src/lib/services/chat/intents/create-invoice.ts`**: NO EXISTE - debe crear facturas directas
- **`src/lib/services/chat/intents/confirm-invoice.ts`**: NO EXISTE - debe confirmar facturas
- **`src/lib/services/chat/intents/cancel-invoice.ts`**: NO EXISTE - debe cancelar facturas

### Servicios del ERP (Integrados)
- **`src/lib/services/invoices.service.ts`**: Servicio de facturación - ya existe y funciona
- **`src/lib/services/orders.service.ts`**: Servicio de pedidos - ya existe y funciona
- **`src/lib/services/purchase-orders.service.ts`**: Servicio de compras - ya existe y funciona
- **`src/lib/services/bot-decision.service.ts`**: Registra decisiones críticas - ya existe

### Base de Datos
- **`prisma/schema.prisma`**: Modelo de datos. Tabla `ChatSession` con campo `context` (JSONB) funciona correctamente

### Tests
- **`src/tests/unit/chat/`**: Tests unitarios de chatbot
- **`src/tests/integration/`**: Tests de integración

## 8. PRÓXIMOS PASOS INMEDIATOS (Top 5 - 48-72 horas)

1. **Corregir Regex de facturas** (30 min)
   - Editar `src/lib/services/chat/intents.ts:189`
   - Hacer regex más estricta: exigir dígitos o longitud mínima
   - Test: "Quiero crear una factura nueva" → debe ser `create_invoice`

2. **Invertir lógica de detección** (1 hora)
   - Mover llamada a `classifyChatIntentWithOpenAI` ANTES de evaluación de Regex
   - Usar Regex solo para extracción de parámetros específicos
   - Test: Verificar que OpenAI clasifica correctamente

3. **Implementar `create-invoice.ts`** (2 horas)
   - Crear archivo basado en `create-order.ts`
   - Usar `InvoicesService` para crear factura
   - Implementar extracción de parámetros con OpenAI Tools
   - Test: Crear factura completa end-to-end

4. **Actualizar tipos y dispatcher** (30 min)
   - Agregar `create_invoice`, `confirm_invoice`, `cancel_invoice` a `ChatIntent` en `types.ts`
   - Agregar casos en `query-executor.ts`
   - Test: Verificar que TypeScript no tiene errores

5. **Implementar `confirm-invoice.ts` y `cancel-invoice.ts`** (1 hora)
   - Crear archivos para confirmar y cancelar facturas
   - Integrar con `BotDecisionService` para auditoría
   - Test: Flujo completo de creación → confirmación → cancelación

**Total estimado**: ~5 horas de desarrollo
**Impacto esperado**: Desbloquear funcionalidad de facturación, mejorar intent recognition rate de ~60% a ~85%