# Estado de Implementación del Chatbot (Gap Analysis)

**Fecha:** 28 de Febrero de 2026
**Versión del Análisis:** 1.0
**Documento Base:** `chatbot_ground_truth.md` vs `src/`

Este documento detalla la auditoría técnica realizada al código fuente del chatbot de HAGO PRODUCE para identificar la discrepancia entre la documentación ideal (Ground Truth) y la realidad operativa.

---

## 1. Auditoría de Intenciones

Se ha revisado el directorio `src/lib/services/chat/intents/` para verificar la existencia y lógica de cada intención documentada.

| Intención | Estado | Archivo Fuente | Observaciones |
| :--- | :---: | :--- | :--- |
| `create_order` | ✅ **IMPLEMENTADA** | `create-order.ts` | Lógica completa con búsqueda de cliente/producto y cálculo de totales. |
| `confirm_order` | ✅ **IMPLEMENTADA** | `create-order.ts` | Llama a `OrdersService` correctamente. |
| `cancel_order` | ✅ **IMPLEMENTADA** | `create-order.ts` | Limpia el contexto. |
| `create_purchase_order` | ✅ **IMPLEMENTADA** | `create-purchase-order.ts` | Similar a pedidos de venta, funcional. |
| `confirm_purchase_order` | ✅ **IMPLEMENTADA** | `create-purchase-order.ts` | Llama a servicio de compras. |
| `cancel_purchase_order` | ✅ **IMPLEMENTADA** | `create-purchase-order.ts` | Funcional. |
| `create_invoice` | ✅ **IMPLEMENTADA** | `create-invoice.ts` | Usa `extractInvoiceParams` con OpenAI Tools internamente. Compleja y funcional. |
| `confirm_invoice` | ✅ **IMPLEMENTADA** | `create-invoice.ts` | Crea factura en estado SENT. |
| `cancel_invoice` | ✅ **IMPLEMENTADA** | `create-invoice.ts` | Funcional. |
| `invoice_status` | ✅ **IMPLEMENTADA** | `invoice-status.ts` | Consulta por número o término de búsqueda. |
| `overdue_invoices` | ✅ **IMPLEMENTADA** | `overdue-invoices.ts` | Filtra por fecha y estado PENDING/OVERDUE. |
| `customer_balance` | ✅ **IMPLEMENTADA** | `customer-balance.ts` | Calcula saldo total y cuenta facturas pendientes. |
| `product_info` | ✅ **IMPLEMENTADA** | `product-info.ts` | Devuelve precios y proveedores del producto. |
| `price_lookup` | ✅ **IMPLEMENTADA** | `price-lookup.ts` | Consulta precios vigentes (`isCurrent: true`). |
| `inventory_summary` | ✅ **IMPLEMENTADA** | `inventory-summary.ts` | Agrupa productos por categoría. |
| `best_supplier` | ✅ **IMPLEMENTADA** | `best-supplier.ts` | Ordena proveedores por precio de costo. |
| `customer_info` | ✅ **IMPLEMENTADA** | `customer-info.ts` | Busca clientes por nombre/email. |

**Conclusión de Intenciones:**
Sorprendentemente, **el 100% de las intenciones están implementadas a nivel de código**. No hay "esqueletos" vacíos; todas realizan consultas reales a la base de datos (Prisma) o llaman a servicios. La percepción de "baja funcionalidad" del usuario no proviene de falta de código, sino de problemas en el **enrutamiento (NLU)** y la **conectividad**.

---

## 2. Auditoría de Conectividad

### A. OpenAI Client (`openai-client.ts`)
*¿Están definidas las Tools/Functions de OpenAI para el enrutamiento?*
🔴 **NO**.
- La función principal `classifyChatIntentWithOpenAI` **NO utiliza `function_calling` (Tools)**.
- Depende exclusivamente de un **System Prompt** que instruye al modelo a responder con un JSON.
- **Riesgo:** Esto es frágil. Si el usuario escribe algo ambiguo, el modelo puede devolver texto libre o un JSON malformado, haciendo que el sistema falle o use el fallback (`price_lookup`).
- *Nota:* Las intenciones individuales como `create_invoice` SÍ usan tools internamente para extraer parámetros, pero el "cerebro" principal (el router) no.

### B. Query Executor (`query-executor.ts`)
*¿El dispatcher invoca realmente a los handlers?*
✅ **SÍ**.
- Existe un `switch` (bloques `if`) completo que cubre las 17 intenciones y delega la ejecución a las funciones importadas correctamente.

### C. API Route (`route.ts`)
*¿Se mantiene la sesión y el contexto?*
✅ **SÍ**.
- El código recupera `prisma.chatSession` usando el `sessionId`.
- El campo `context` (JSONB) se pasa correctamente a `analyzeIntent` y `executeQuery`.
- Se actualiza la base de datos con el nuevo contexto al finalizar la ejecución.

---

## 3. Porcentaje de Progreso Real

Basado en la auditoría de código:

| Módulo | Progreso | Justificación |
| :--- | :---: | :--- |
| **Lógica de Negocio (Handlers)** | **95%** | Los handlers (`create-order.ts`, etc.) son robustos y conectan con la DB. Faltan quizás validaciones de negocio más finas (ej. crédito insuficiente). |
| **Persistencia (DB/Contexto)** | **100%** | La tabla `ChatSession` y el manejo de JSONB funcionan correctamente. |
| **NLU / Detección (Routing)** | **40%** | **Aquí está el cuello de botella.** El sistema híbrido (Regex + Prompt JSON) es inestable. Las Regex son demasiado agresivas y el Prompt JSON es menos fiable que las Tools. |
| **Integración ERP** | **90%** | Conecta con `InvoicesService`, `OrdersService`, etc. |
| **Front-end / Respuesta** | **80%** | Formatea respuestas con OpenAI correctamente, pero el fallback a texto plano es básico. |

**Promedio General de Código Funcional:** ~80%
**Percepción de Usuario:** ~10% (Debido a que el 40% del NLU bloquea el acceso al resto del código).

---

## 4. Bloqueadores Críticos Identificados

Estos son los 3 errores exactos de código que están "rompiendo" la experiencia:

### 🔴 1. El "Agujero Negro" de la Regex de Facturas
**Archivo:** `src/lib/services/chat/intents.ts` (Línea ~189)
**Código:**
```typescript
const invoiceNumberMatch = lower.match(/(factura\s*#?\s*|invoice\s*#?\s*)([a-z0-9-]+)/i);
```
**El Problema:** Esta expresión regular es demasiado "hambrienta".
- Si el usuario dice: *"Quiero crear una factura nueva"*
- La regex captura: "factura " (Grupo 1) y "nueva" (Grupo 2).
- **Resultado:** El bot piensa que la intención es `invoice_status` buscando la factura número "nueva".
- **Impacto:** Bloquea casi cualquier intento de hablar de facturas que no sea consultar un estatus.

### 🔴 2. Ausencia de "Tools" en el Router Principal
**Archivo:** `src/lib/services/chat/openai-client.ts`
**El Problema:** La función `classifyChatIntentWithOpenAI` confía en que GPT-4o-mini obedezca un prompt de texto para devolver JSON.
- **Código Actual:** `Respond with a strict JSON object...`
- **Código Ideal:** Usar `tools: [{ type: "function", name: "route_intent", ... }]`.
- **Impacto:** Aumenta la latencia y la tasa de error. Si el modelo "alucina" o añade texto antes del JSON, el `JSON.parse` falla y el bot responde con el fallback (usualmente "No prices found" o similar).

### 🔴 3. Orden de Evaluación en `analyzeIntent`
**Archivo:** `src/lib/services/chat/intents.ts`
**El Problema:** Aunque se intenta priorizar `create_invoice` sobre `invoice_status`, la lógica de detección mixta (Regex vs OpenAI) es confusa.
- Si una Regex coincide (incluso erróneamente como en el punto 1), el código retorna INMEDIATAMENTE esa intención, sin consultar nunca a OpenAI.
- **Código:**
  ```typescript
  if (isInvoiceStatus) { return { intent: 'invoice_status', ... }; }
  // ...
  const aiDetected = await classifyChatIntentWithOpenAI(...);
  ```
- **Impacto:** La IA (que es más inteligente) nunca tiene la oportunidad de corregir el error de la Regex. El sistema prioriza reglas tontas (Regex) sobre inteligencia (LLM).

---

## Recomendaciones Inmediatas (Quick Wins)

1.  **Corregir la Regex de Facturas:** Hacerla más estricta (ej. exigir dígitos o longitud mínima) o eliminarla y dejar que OpenAI decida.
2.  **Invertir la Lógica de Detección:** Llamar a OpenAI *primero* para clasificación general, y usar Regex solo para extraer datos específicos (como números de serie) *dentro* del handler, o como fallback si OpenAI falla.
3.  **Implementar OpenAI Tools:** Refactorizar `classifyChatIntentWithOpenAI` para usar `tools` definidos formalmente.
