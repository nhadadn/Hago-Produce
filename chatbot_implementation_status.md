# Estado de Implementación del Chatbot – HAGO PRODUCE

## Resumen
- Este documento compara el Ground Truth con la implementación actual en código.
- Incluye auditoría de intenciones, conectividad entre módulos, estimaciones de avance y bloqueadores críticos, con referencias a código.

## 1. Auditoría de Intenciones

| Intent | Archivo | Estado | Observación breve |
| :--- | :--- | :--- | :--- |
| price_lookup | [price-lookup.ts](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents/price-lookup.ts) | IMPLEMENTADA | Búsqueda y agrupación por producto, sugerencias si vacío |
| best_supplier | [best-supplier.ts](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents/best-supplier.ts) | IMPLEMENTADA | Ordena por costo, límite dinámico, sugerencias |
| invoice_status | [invoice-status.ts](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents/invoice-status.ts) | IMPLEMENTADA | Soporta número, última y lista, con resumen |
| customer_balance | [customer-balance.ts](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents/customer-balance.ts) | IMPLEMENTADA | Modo cliente único y resumen global, desgloses |
| product_info | [product-info.ts](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents/product-info.ts) | IMPLEMENTADA | Devuelve ficha con precios normalizados y sugerencias |
| inventory_summary | [inventory-summary.ts](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents/inventory-summary.ts) | IMPLEMENTADA | Lista productos con resumen por categoría |
| overdue_invoices | [overdue-invoices.ts](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents/overdue-invoices.ts) | IMPLEMENTADA | Reporte por cliente y global, urgencia y días |
| customer_info | [customer-info.ts](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents/customer-info.ts) | IMPLEMENTADA | Busca por nombre/email/RFC, con actividad |
| create_order | [create-order.ts](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents/create-order.ts) | IMPLEMENTADA | Extracción con OpenAI/regex, cálculo de impuestos y pendingOrder |
| confirm_order | [create-order.ts](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents/create-order.ts#L502-L741) | IMPLEMENTADA | Crea factura, genera PDF, notifica y audita |
| cancel_order | [create-order.ts](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents/create-order.ts#L743-L759) | IMPLEMENTADA | Devuelve éxito y route limpia contexto |
| create_purchase_order | [create-purchase-order.ts](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents/create-purchase-order.ts) | IMPLEMENTADA | Extracción con Function Calling, mejor proveedor, pendingOrders |
| confirm_purchase_order | [create-purchase-order.ts](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents/create-purchase-order.ts#L382-L492) | IMPLEMENTADA | Crea órdenes, notifica proveedor, audita |
| cancel_purchase_order | [create-purchase-order.ts](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents/create-purchase-order.ts#L494-L510) | IMPLEMENTADA | Devuelve éxito y route limpia contexto |
| create_invoice | [create-invoice.ts](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents/create-invoice.ts) | IMPLEMENTADA | Extracción con Function Calling, pendingInvoice |
| confirm_invoice | [create-invoice.ts](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents/create-invoice.ts#L341-L411) | IMPLEMENTADA | Crea factura via service, retorna datos |
| cancel_invoice | [create-invoice.ts](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents/create-invoice.ts#L413-L429) | IMPLEMENTADA | Devuelve éxito y route limpia contexto |

## 2. Auditoría de Conectividad

- OpenAI Tools/Functions
  - Definidas para extracción en intenciones transaccionales: create_order, create_purchase_order y create_invoice.
  - La clasificación de intención se hace por prompt (sin Tools), lo que puede degradar precisión. Inconsistencia en `tool_choice` detectada en varias extracciones.
- Dispatcher de intents
  - [query-executor.ts](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/query-executor.ts) mapea todas las intenciones con condicionales explícitos. Cobertura completa de los 17 intents.
- Orquestación y Contexto de sesión
  - [route.ts](file:///c:/Users/nadir/Hago%20Produce/src/app/api/chat/route.ts) recupera `ChatSession` por `sessionId`. Si no existe, crea nueva. Actualiza `context` y `messages` en cada turno y limpia `pending*` en confirm/cancel.
  - Dependencia de que el cliente conserve y envíe `sessionId` entre turnos; sin eso, el multi-turno se pierde pese a que el backend está listo.

## 3. Porcentaje de Progreso Real

| Módulo | Estimación | Justificación |
| :--- | :--- | :--- |
| NLU / Detección de Intenciones | 55% | Clasificador por prompt con definiciones extensas; fallback simple a `price_lookup` sin API Key; sin Function Calling para la clasificación; algunas detecciones por keywords deshabilitadas |
| Flujos Multi-turno | 70% | `pendingOrder`, `pendingPurchaseOrders`, `pendingInvoice` persisten en `ChatSession.context` y se limpian en confirm/cancel; depende del `sessionId` del cliente |
| Integración con ERP Services | 60% | Uso de `InvoicesService`, `purchaseOrdersService`, cálculo de impuestos, envío por canales y logging de notificaciones |
| Persistencia y Auditoría | 60% | Guardado de sesiones y contexto; auditoría en confirmaciones y rate limit; `BotDecisionService` en confirmación de factura; faltan más puntos de auditoría y pruebas |

## 4. Bloqueadores Críticos

1) `tool_choice` mal estructurado en Function Calling
   - Causa: El campo `function` se pasa como string en algunas extracciones, lo que impide invocar la tool con modelos recientes.
   - Referencias:
     - [create-order.ts:L206-L210](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents/create-order.ts#L206-L210)
     - [create-invoice.ts:L121-L127](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents/create-invoice.ts#L121-L127)
   - Estado: Crítico para extracción robusta; debe ser `{ type: 'function', function: { name: '...' } }`.

2) Fallback agresivo a `price_lookup` cuando no hay `OPENAI_API_KEY`
   - Causa: Se asigna la intención `price_lookup` usando el mensaje completo como `searchTerm`, lo que rompe la búsqueda para consultas no relacionadas con productos.
   - Referencia: [intents.ts:L230-L238](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents.ts#L230-L238)
   - Impacto: El bot interpreta consultas de saldo, estatus o catálogo como precio.

3) Regex de número de factura demasiado permisivo
   - Causa: El patrón puede capturar números no deseados en frases generales y confundir la detección de `invoice_status`.
   - Referencia: [intents.ts:L178-L186](file:///c:/Users/nadir/Hago%20Produce/src/lib/services/chat/intents.ts#L178-L186)
   - Acción: Endurecer regex con anclajes y contexto, y preferir extracción semántica cuando haya API Key.

## 5. Backlog Prioritario (para alcanzar el Ground Truth)

1. Corregir `tool_choice` en todas las extracciones para usar objeto `{ name }`.
2. Remover el fallback por defecto a `price_lookup`; usar router determinista mínimo o respuestas de error claras.
3. Endurecer regex de `invoice_number` y añadir validación de prefijos conocidos.
4. Añadir Function Calling para clasificación de intents con esquema estricto.
5. Rehabilitar/ajustar detección determinista de `customer_balance` y `inventory_summary`.
6. Forzar persistencia de `sessionId` en el cliente (middleware/UI) y documentar su ciclo de vida.
7. Añadir auditorías en confirmaciones de compra y balance; centralizar logs en `AuditLog`.
8. Tests integrales de multi-turno para `create_*` con confirm/cancel y verificación de limpieza de contexto.
9. Validaciones adicionales de negocio (existencia de precios, estados, límites) y mensajes de error en español.
10. Monitoreo de fallos de OpenAI y reintentos con backoff; registrar en `WebhookLog`/`AuditLog`.

## 6. Observaciones Finales
- La lógica de intents y los handlers están implementados y conectados; los principales defectos están en la capa NLU (clasificación y extracción) y en la robustez de los fallbacks.
- Con las correcciones anteriores, el avance efectivo puede subir rápidamente por encima del 80% en escenarios típicos del ERP.

