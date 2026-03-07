# Prompts Secuenciales – Router y Extracción por Intent

> Objetivo: Proveer secuencias de prompts listas para uso por un LLM de implementación, sin incluir código. Los prompts deben guiar la clasificación, extracción, confirmación y validación de contexto.

## Prompt de Clasificación (Router)
- Instrucción
  - “Clasifica la intención del usuario entre 17 intents definidos para el ERP de HAGO PRODUCE. Responde únicamente indicando el nombre del intent y una lista detallada de parámetros que deben extraerse en el siguiente paso. No inventes datos y usa el idioma del usuario.”
- Reglas
  - Priorizar consultas (precio, proveedor, información de producto, catálogo) vs. documentos (estatus), vs. cobranzas (vencidas, saldo), vs. transaccionales (crear/confirmar/cancelar).
  - Si el mensaje no contiene información suficiente para determinar la intención con alta confianza, indicar ambigüedad y solicitar el dato mínimo (producto/cliente/categoría).
- Señales
  - “precio/costo” → price_lookup
  - “quién vende/mejor proveedor” → best_supplier
  - “info de/qué es” → product_info
  - “catálogo/qué tienes/lista de [categoría]” → inventory_summary
  - “factura/última/lista” → invoice_status
  - “vencidas/atrasadas/cobranza” → overdue_invoices
  - “saldo/cuánto debe” → customer_balance
  - “comprar/pedir crear pedido/factura” → create_* (confirm/cancel solo si hay pending* en contexto)

## Plantillas de Extracción por Intent (17)
> Para cada intent: tres utterances de ejemplo, datos a extraer y un mensaje de confirmación/respuesta sugerido.

### 1) price_lookup
- Ejemplos
  - Natural: “¿A cómo está el aguacate?”
  - Técnica: “Precio de tomate saladette por proveedor.”
  - Incompleta: “Precio, por favor.”
- Datos a extraer
  - product_name (obligatorio), supplier_name (opcional), language.
- Respuesta sugerida
  - “El precio de [producto] es [monto] [moneda], proveedor [nombre].”

### 2) best_supplier
- Ejemplos
  - Natural: “¿Quién vende aguacate más barato?”
  - Técnica: “Mejores 5 proveedores para brócoli.”
  - Incompleta: “Mejor proveedor.”
- Datos a extraer
  - product_name (obligatorio), max_results (opcional), language.
- Respuesta sugerida
  - “Top [N] proveedores para [producto], ordenados por costo: [lista].”

### 3) product_info
- Ejemplos
  - Natural: “Dame información del limón.”
  - Técnica: “Ficha técnica de aguacate hass.”
  - Incompleta: “Información del producto.”
- Datos a extraer
  - product_name (obligatorio), language.
- Respuesta sugerida
  - “Información de [producto]: categoría [cat], unidad [unit], [precios].”

### 4) inventory_summary
- Ejemplos
  - Natural: “¿Qué frutas tienes?”
  - Técnica: “Lista de productos en categoría vegetales.”
  - Incompleta: “Catálogo.”
- Datos a extraer
  - category (opcional), search_term (opcional), language.
- Respuesta sugerida
  - “Catálogo [categoría]: [N] productos. Sugerencias: [categorías] si aplica.”

### 5) invoice_status
- Ejemplos
  - Natural: “¿Cuál es el estado de la factura 1024?”
  - Técnica: “Última factura de Walmart.”
  - Incompleta: “Facturas.”
- Datos a extraer
  - invoice_number (opcional), customer_name (opcional), mode (specific|last|list), language.
- Respuesta sugerida
  - “Factura [número]: [estatus], total [monto], vencimiento [fecha].” o “Últimas facturas de [cliente]: [lista].”

### 6) overdue_invoices
- Ejemplos
  - Natural: “Facturas vencidas de Walmart.”
  - Técnica: “Reporte de cobranza global (+30 días).”
  - Incompleta: “Vencidas.”
- Datos a extraer
  - customer_name (opcional), query_type (single_customer|global_report), days_overdue (opcional), language.
- Respuesta sugerida
  - “Vencidas [modo]: total [monto], [conteo] facturas; urgencia: [etiquetas].”

### 7) customer_balance
- Ejemplos
  - Natural: “¿Cuánto debe La Tiendita?”
  - Técnica: “Saldo total de clientes.”
  - Incompleta: “Saldo.”
- Datos a extraer
  - customer_name (opcional), query_type (single_customer|global_summary), language.
- Respuesta sugerida
  - “Saldo de [cliente]: [monto], [conteo] documentos; [mensaje de estado].” o “Resumen global: top deudores [lista].”

### 8) create_order
- Ejemplos
  - Natural: “Quiero 5 cajas de tomate para La Tiendita.”
  - Técnica: “Pedido: 10 kg de aguacate; canal: WhatsApp.”
  - Incompleta: “Haz un pedido.”
- Datos a extraer
  - customer_name, items[] (product_name, quantity, unit), send_channel, delivery_date/time, notes, language.
- Confirmación sugerida
  - “Pedido pendiente para [cliente]: subtotal [monto], impuesto [tasa], total [monto]. ¿Confirmas?”

### 9) confirm_order
- Ejemplos
  - Natural: “Sí, confirmo.”
  - Técnica: “Confirmar pedido pendiente.”
  - Incompleta: “Ok.”
- Datos a extraer
  - confirm (boolean), language.
- Confirmación sugerida
  - “Pedido confirmado: factura [número], total [monto]. Enviado por [canal] si aplica.”

### 10) cancel_order
- Ejemplos
  - Natural: “Mejor cancela.”
  - Técnica: “Cancelar el pedido actual.”
  - Incompleta: “No.”
- Datos a extraer
  - cancel (boolean), language.
- Confirmación sugerida
  - “Pedido cancelado y contexto limpiado.”

### 11) create_purchase_order
- Ejemplos
  - Natural: “Necesito 100 kg de aguacate y 50 cajas de limón.”
  - Técnica: “Generar Órdenes por mejor precio.”
  - Incompleta: “Orden de compra.”
- Datos a extraer
  - items[] (product_name, quantity, unit), delivery_date/time, notes, recipient_name, language.
- Confirmación sugerida
  - “Órdenes pendientes por proveedor: [lista], total [monto]. ¿Confirmas envío?”

### 12) confirm_purchase_order
- Ejemplos
  - Natural: “Sí, envía las órdenes.”
  - Técnica: “Confirmar órdenes de compra pendientes.”
  - Incompleta: “Adelante.”
- Datos a extraer
  - confirm (boolean), language.
- Confirmación sugerida
  - “Órdenes creadas: [números], proveedor [nombres], total [monto].”

### 13) cancel_purchase_order
- Ejemplos
  - Natural: “Cancela esas órdenes.”
  - Técnica: “Cancelar órdenes pendientes.”
  - Incompleta: “No.”
- Datos a extraer
  - cancel (boolean), language.
- Confirmación sugerida
  - “Órdenes de compra canceladas y contexto limpiado.”

### 14) create_invoice
- Ejemplos
  - Natural: “Genera factura para La Tiendita: 5 cajas de tomate.”
  - Técnica: “Factura: cliente Walmart; items con descripción; vencimiento 30 días.”
  - Incompleta: “Crear factura.”
- Datos a extraer
  - customer_name, items[] (product_name, quantity, unit_price opcional, description opcional), notes, due_date, tax_rate, language.
- Confirmación sugerida
  - “Factura pendiente para [cliente]: subtotal [monto], impuesto [tasa], total [monto]. ¿Confirmas?”

### 15) confirm_invoice
- Ejemplos
  - Natural: “Sí, confirma la factura.”
  - Técnica: “Confirmar factura pendiente.”
  - Incompleta: “Ok.”
- Datos a extraer
  - confirm (boolean), language.
- Confirmación sugerida
  - “Factura confirmada: número [número], total [monto].”

### 16) cancel_invoice
- Ejemplos
  - Natural: “Cancela la factura.”
  - Técnica: “Cancelar facturación en curso.”
  - Incompleta: “No.”
- Datos a extraer
  - cancel (boolean), language.
- Confirmación sugerida
  - “Facturación cancelada y contexto limpiado.”

### 17) customer_info
- Ejemplos
  - Natural: “Dame el email y dirección de Walmart.”
  - Técnica: “Buscar cliente por RFC ABC1234.”
  - Incompleta: “Información de cliente.”
- Datos a extraer
  - customer_name (opcional), customer_email (opcional), customer_tax_id (opcional), search_type (by_name|by_email|by_taxid|unknown), language.
- Respuesta sugerida
  - “Datos de [cliente]: email [x], teléfono [y], dirección [z], RFC [id]. Sugerencias si hay múltiples.”

## Prompt de Validación de Contexto
- Instrucción
  - “Antes de responder, revisa ChatSession.context. Si hay pendingOrder, pendingInvoice o pendingPurchaseOrders, interpreta ‘sí/no/confirmar/cancelar’ como acciones de confirmación/cancelación correspondientes. Si no hay pending*, procesa el mensaje con el Router normal.”
- Reglas
  - Confirmar solo si la respuesta es inequívoca (“sí/confirmo/ok”); cancelar si se expresa “no/cancelar”.
  - Tras confirm/cancel, detallar brevemente el resultado y sugerir el siguiente paso (enviar, descargar, etc.).
  - Mantener contexto limpio: indicar que se eliminó pending* después de confirm/cancel.

