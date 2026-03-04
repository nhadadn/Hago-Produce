# Ground Truth - Chatbot HAGO PRODUCE

> **Última Actualización:** 2026-02-28

## 1. Resumen Ejecutivo

El chatbot de **HAGO PRODUCE** es un asistente virtual integrado en el ERP diseñado para facilitar operaciones críticas de distribución de perecederos mediante lenguaje natural. Su arquitectura híbrida combina reglas deterministas (Regex) para consultas rápidas con Inteligencia Artificial (OpenAI GPT-4o-mini) para la comprensión de intenciones complejas y extracción de datos estructurados.

**Arquitectura de Alto Nivel:**

```mermaid
graph TD
    User[Usuario (Web/WhatsApp)] -->|Mensaje| API[API Route /api/chat]
    API -->|Rate Limit Check| Audit[Audit Log]
    API -->|Texto| NLU{NLU Router}
    
    NLU -->|Regex Match| SimpleIntent[Consulta Simple]
    NLU -->|OpenAI API| ComplexIntent[Intención Compleja]
    
    SimpleIntent --> QueryExecutor
    ComplexIntent --> QueryExecutor
    
    QueryExecutor -->|Read/Write| DB[(PostgreSQL / Prisma)]
    QueryExecutor -->|Action| Services[ERP Services]
    
    Services -->|Create| Invoice[Factura]
    Services -->|Create| Order[Pedido]
    Services -->|Notify| Channel[WhatsApp/Email]
    
    QueryExecutor -->|Response| API
    API -->|Reply| User
```

-   **Frontend:** Interfaz de chat en Next.js.
-   **API Route:** `src/app/api/chat/route.ts` actúa como orquestador central.
-   **NLU (Natural Language Understanding):** Sistema de doble capa:
    1.  **Detección Rápida:** Palabras clave y Regex para consultas simples.
    2.  **Detección Avanzada:** OpenAI API para clasificación semántica y extracción de parámetros (Function Calling).
-   **Backend Services:** Integración directa con servicios del ERP (Facturación, Pedidos, Inventario) a través de Prisma ORM.
-   **Persistencia:** Sesiones de chat almacenadas en base de datos PostgreSQL (`ChatSession`), permitiendo auditoría y contexto persistente.

---

## 2. Intenciones (Intents) Definidas

El sistema reconoce actualmente **17 intenciones** distintas, divididas en consultas informativas y acciones transaccionales.

| Intent Name | Descripción | Tipo | Archivos Relacionados |
| :--- | :--- | :--- | :--- |
| `price_lookup` | Consulta precios de productos (costo/venta) y proveedor. | Consulta | [price-lookup.ts](src/lib/services/chat/intents/price-lookup.ts) |
| `best_supplier` | Encuentra los 5 proveedores con mejor precio para un producto. | Consulta | [best-supplier.ts](src/lib/services/chat/intents/best-supplier.ts) |
| `invoice_status` | Consulta el estado de una factura por número. | Consulta | [invoice-status.ts](src/lib/services/chat/intents/invoice-status.ts) |
| `customer_balance` | Muestra saldo pendiente de uno o todos los clientes. | Consulta | [customer-balance.ts](src/lib/services/chat/intents/customer-balance.ts) |
| `product_info` | Información detallada de producto (SKU, categoría, precios). | Consulta | [product-info.ts](src/lib/services/chat/intents/product-info.ts) |
| `inventory_summary` | Resumen de productos por categoría con rangos de precios. | Consulta | [inventory-summary.ts](src/lib/services/chat/intents/inventory-summary.ts) |
| `overdue_invoices` | Lista facturas vencidas (filtrable por días de retraso). | Consulta | [overdue-invoices.ts](src/lib/services/chat/intents/overdue-invoices.ts) |
| `customer_info` | Busca información de contacto y fiscal de clientes. | Consulta | [customer-info.ts](src/lib/services/chat/intents/customer-info.ts) |
| `create_order` | Inicia la creación de un pedido de cliente. | Transaccional | [create-order.ts](src/lib/services/chat/intents/create-order.ts) |
| `confirm_order` | Confirma y guarda un pedido pendiente. | Transaccional | [create-order.ts](src/lib/services/chat/intents/create-order.ts) |
| `cancel_order` | Cancela el flujo de creación de pedido actual. | Transaccional | [create-order.ts](src/lib/services/chat/intents/create-order.ts) |
| `create_purchase_order`| Inicia orden de compra a proveedores (automático por mejor precio). | Transaccional | [create-purchase-order.ts](src/lib/services/chat/intents/create-purchase-order.ts) |
| `confirm_purchase_order`| Confirma y envía órdenes de compra pendientes. | Transaccional | [create-purchase-order.ts](src/lib/services/chat/intents/create-purchase-order.ts) |
| `cancel_purchase_order` | Cancela flujo de orden de compra. | Transaccional | [create-purchase-order.ts](src/lib/services/chat/intents/create-purchase-order.ts) |
| `create_invoice` | Inicia creación de factura directa. | Transaccional | [create-invoice.ts](src/lib/services/chat/intents/create-invoice.ts) |
| `confirm_invoice` | Confirma y timbra (simulado) una factura. | Transaccional | [create-invoice.ts](src/lib/services/chat/intents/create-invoice.ts) |
| `cancel_invoice` | Cancela flujo de facturación. | Transaccional | [create-invoice.ts](src/lib/services/chat/intents/create-invoice.ts) |

---

## 3. Flujos Multi-turno Soportados

El chatbot maneja estado conversacional para operaciones complejas que requieren confirmación.

### 3.1 Creación de Pedido (`create_order`)
1.  **Extracción:** El usuario dice "Quiero 5 cajas de tomate para La Tiendita".
    -   Se usa OpenAI (Function Calling) o Regex para extraer: `customerName`, `items` (producto, cantidad, unidad), `deliveryDate`, `sendChannel`.
2.  **Validación:** Se busca el cliente y los productos en la DB. Se resuelven precios vigentes.
3.  **Estado Pendiente:** Si todo es válido, se guarda un objeto `pendingOrder` en `ChatSession.context` y se pide confirmación al usuario mostrando el total calculado.
4.  **Confirmación (`confirm_order`):** Si el usuario responde "sí/confirmar", se ejecuta la creación en DB, se genera PDF y se notifica.
5.  **Cancelación (`cancel_order`):** Si responde "no/cancelar", se limpia el contexto.

### 3.2 Orden de Compra Inteligente (`create_purchase_order`)
1.  **Extracción:** "Necesito 100kg de aguacate y 50 cajas de limón".
2.  **Optimización:** El sistema busca automáticamente los **proveedores con el precio más bajo** para cada producto solicitado.
3.  **Agrupación:** Genera múltiples órdenes de compra potenciales agrupadas por proveedor.
4.  **Confirmación:** Muestra el desglose por proveedor y total estimado.
5.  **Ejecución:** Al confirmar, crea todas las órdenes y notifica a cada proveedor individualmente.

### 3.3 Manejo de Contexto (`ChatSession`)
El contexto se almacena en la columna JSONB `context` de la tabla `ChatSession`.
-   **Estructura:**
    ```typescript
    interface ChatServiceContext {
      userId?: string;
      pendingOrder?: PendingOrder;           // Datos temporales del pedido
      pendingInvoice?: PendingInvoice;       // Datos temporales de la factura
      pendingPurchaseOrders?: PendingPurchaseOrder[]; // Lista de órdenes a proveedores
    }
    ```
-   **Ciclo de Vida:** El contexto se limpia automáticamente tras una confirmación exitosa o una cancelación explícita.

---

## 4. Integración con Servicios Backend

### 4.1 Servicios Internos (Services Layer)
El chatbot invoca directamente a la capa de servicios del ERP:
-   `InvoicesService`: Para crear facturas (`create`).
-   `PurchaseOrdersService`: Para crear y notificar órdenes de compra.
-   `BotDecisionService`: Registra decisiones críticas (auditoría de confirmaciones).
-   `TaxCalculationService`: Cálculo centralizado de impuestos según provincia.

### 4.2 Integraciones Externas
-   **OpenAI API:**
    -   Modelos: `gpt-4o-mini` (default).
    -   Uso: Clasificación de intención y extracción de entidades estructuradas (JSON).
-   **Notificaciones:**
    -   **WhatsApp:** Vía `WhatsAppService` (Meta Business API).
    -   **Telegram:** Vía `TelegramService` (Bot API, envío de documentos).
    -   **Email:** Vía `EmailService` (SMTP/Resend).

### 4.3 Base de Datos (Prisma)
-   Lectura intensiva para búsquedas (productos, clientes, facturas).
-   Escritura transaccional al confirmar operaciones.
-   Registro de auditoría en tablas `AuditLog` y `NotificationLog`.

---

## 5. Validaciones y Blindajes

### 5.1 Rate Limiting
-   Implementado en `src/app/api/chat/route.ts`.
-   Límite configurable vía `CHAT_RATE_LIMIT` (default: 20 peticiones/usuario).
-   Respuesta `429 Too Many Requests` si se excede.
-   Registro de auditoría `RATE_LIMIT_EXCEEDED`.

### 5.2 Sanitización y Fallbacks
-   **Input Length:** Truncado de mensajes a 1000 caracteres para evitar ataques de DoS o consumo excesivo de tokens.
-   **Fallback a Regex:** Si `OPENAI_API_KEY` no está configurada o la API falla, el sistema intenta extraer datos usando expresiones regulares básicas (definidas en `basicRegexFallback`).
-   **Manejo de Errores:** Bloques `try-catch` en todos los handlers con logging estructurado (`logger.error`).

### 5.3 Validación de Negocio
-   Verificación de existencia de clientes/productos antes de proponer una orden.
-   Resolución de ambigüedades (ej. múltiples clientes con nombre similar).
-   Validación de precios vigentes (usa precio de costo si no hay precio de venta definido).

---

## 6. Configuración y Variables de Entorno

Variables críticas para el funcionamiento completo del chatbot:

| Variable | Requerido | Descripción |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | **Sí** | Habilita la inteligencia real. Sin esto, funciona en modo "básico" (regex). |
| `OPENAI_MODEL` | No | Modelo a usar (default: `gpt-4o-mini`). |
| `CHAT_RATE_LIMIT` | No | Peticiones permitidas por ventana de tiempo (default: 20). |
| `DATABASE_URL` | **Sí** | Conexión a PostgreSQL (Neon). |
| `WHATSAPP_API_KEY` | No | Para notificaciones por WhatsApp. |
| `TELEGRAM_BOT_TOKEN`| No | Para notificaciones por Telegram. |

---

## 7. Limitaciones y Áreas de Mejora

Basado en el análisis del código actual:

1.  **Dependencia de OpenAI:** Aunque hay fallback a Regex, la extracción compleja (múltiples items, unidades variadas) depende fuertemente de la calidad de la respuesta del LLM.
2.  **Flujos Rígidos:** Una vez iniciado un flujo (ej. `create_order`), el usuario debe confirmar o cancelar. No se pueden editar items individuales en el turno de confirmación ("ah, cambia los tomates a 6 cajas").
3.  **Sin Historial Conversacional Profundo:** Aunque se envía historial reciente a OpenAI, la lógica de intents no soporta referencias complejas a conversaciones pasadas fuera del contexto inmediato de `pending...`.
4.  **Internacionalización Parcial:** El código soporta `ChatLanguage` ('es' | 'en'), pero muchas respuestas de error o logs internos pueden estar hardcodeados en inglés o español mixto.
5.  **Búsqueda de Productos:** La búsqueda es por coincidencia de texto (`contains`). No tiene búsqueda semántica/vectorial para productos (ej. "algo para guacamole" no encontraría "aguacate" a menos que esté en la descripción).

---

## 8. Referencias de Código Clave

-   **Orquestador API:** [src/app/api/chat/route.ts](src/app/api/chat/route.ts)
-   **Router de Intents:** [src/lib/services/chat/query-executor.ts](src/lib/services/chat/query-executor.ts)
-   **Analizador de Intents:** [src/lib/services/chat/intents.ts](src/lib/services/chat/intents.ts)
-   **Tipos de Datos:** [src/lib/chat/types.ts](src/lib/chat/types.ts)
-   **Cliente OpenAI:** [src/lib/services/chat/openai-client.ts](src/lib/services/chat/openai-client.ts)

---

## Anexos

### Ejemplo de Respuesta API (Intent: `price_lookup`)

```json
{
  "reply": "El precio de *Tomate Saladette* es **$25.50/kg** (Proveedor: Agrícola San Juan).",
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "intent": "price_lookup"
}
```

### Ejemplo de Estructura de Pending Order (Contexto)

```json
{
  "pendingOrder": {
    "customerId": "cm7pp...",
    "customerName": "La Tiendita",
    "items": [
      {
        "productId": "prod_123",
        "productName": "Tomate Saladette",
        "quantity": 5,
        "unit": "box",
        "unitPrice": 350.00,
        "totalPrice": 1750.00
      }
    ],
    "subtotal": 1750.00,
    "taxRate": 0.16,
    "taxAmount": 280.00,
    "total": 2030.00,
    "sendChannel": "whatsapp"
  }
}
```

---

## 9. Plan de Mantenimiento

Este documento actúa como la **Fuente de Verdad (Single Source of Truth)** para el funcionamiento del chatbot. Para mantener su relevancia y utilidad:

1.  **Frecuencia de Actualización:**
    -   **Obligatorio:** Con cada Pull Request que modifique la lógica de intents (`src/lib/services/chat/intents/`), el orquestador (`route.ts`) o el modelo de datos (`ChatSession`).
    -   **Revisión General:** Al finalizar cada Sprint (quincenal) para asegurar sincronía con nuevas features.

2.  **Responsables:**
    -   **Tech Lead:** Validar la exactitud técnica de los diagramas y flujos.
    -   **Developers:** Actualizar ejemplos de JSON y referencias de código al implementar cambios.

3.  **Proceso de Actualización:**
    -   La documentación vive junto al código (Docs as Code).
    -   Cualquier cambio en la lógica del chatbot debe incluir una actualización correspondiente en este archivo.
    -   Verificar que los links a archivos sigan siendo válidos.

