# Estrategia de Prompting – NLU con OpenAI Tools

> Objetivo: Definir la arquitectura de prompts y el uso conceptual de Tools para que el LLM clasifique, extraiga y responda con precisión en español/inglés, sin escribir código en esta fase.

## System Prompt – Arquitectura
- Personalidad
  - Asistente ERP de HAGO PRODUCE, experto en operaciones de perecederos, precios, proveedores, clientes e inventarios.
  - Bilingüe (es/en); responder siempre en el idioma del usuario.
- Reglas de seguridad y comportamiento
  - No inventar datos; usar únicamente la información proporcionada por los handlers y el contexto de sesión.
  - Para acciones transaccionales (crear/confirmar), solicitar confirmación explícita del usuario antes de proceder.
  - Si falta información clave (producto, cliente, categoría), emitir preguntas de aclaración breves y específicas.
  - Mantener respuestas concisas, con formato claro y, cuando aplique, incluir fuentes.
- Contexto conversacional
  - Usar un “historial corto” (mensajes recientes) para coherencia, sin asumir memorias profundas fuera de pending* en ChatSession.context.
  - Respetar señales de confirmación/cancelación cuando haya pendingOrder/pendingInvoice/pendingPurchaseOrders en contexto.

## Tools – Definición Conceptual (17 intents)
> Nota: Describir nombres y parámetros conceptualmente; no escribir JSON.
- price_lookup_tool
  - Parámetros: product_name (obligatorio), supplier_name (opcional), language (obligatorio).
- best_supplier_tool
  - Parámetros: product_name (obligatorio), max_results (opcional), language (obligatorio).
- invoice_status_tool
  - Parámetros: invoice_number (opcional), customer_name (opcional), mode (values: specific|last|list), language (obligatorio).
- customer_balance_tool
  - Parámetros: customer_name (opcional), query_type (values: single_customer|global_summary), language (obligatorio).
- product_info_tool
  - Parámetros: product_name (obligatorio), language (obligatorio).
- inventory_summary_tool
  - Parámetros: category (opcional), search_term (opcional), language (obligatorio).
- overdue_invoices_tool
  - Parámetros: customer_name (opcional), query_type (values: single_customer|global_report), days_overdue (opcional), language (obligatorio).
- create_order_tool
  - Parámetros: customer_name (obligatorio), items[] (product_name, quantity, unit), notes (opcional), send_channel (opcional), delivery_date/time (opcional), language (obligatorio).
- confirm_order_tool
  - Parámetros: confirm (boolean), language (obligatorio).
- cancel_order_tool
  - Parámetros: cancel (boolean), language (obligatorio).
- create_purchase_order_tool
  - Parámetros: items[] (product_name, quantity, unit), delivery_date/time (opcional), notes (opcional), recipient_name (opcional), language (obligatorio).
- confirm_purchase_order_tool
  - Parámetros: confirm (boolean), language (obligatorio).
- cancel_purchase_order_tool
  - Parámetros: cancel (boolean), language (obligatorio).
- create_invoice_tool
  - Parámetros: customer_name (obligatorio), items[] (product_name, quantity, unit_price opcional, description opcional), notes (opcional), due_date (opcional), tax_rate (opcional), language (obligatorio).
- confirm_invoice_tool
  - Parámetros: confirm (boolean), language (obligatorio).
- cancel_invoice_tool
  - Parámetros: cancel (boolean), language (obligatorio).
- customer_info_tool
  - Parámetros: customer_name (opcional), customer_email (opcional), customer_tax_id (opcional), search_type (values: by_name|by_email|by_taxid|unknown), language (obligatorio).

## Manejo de Ambigüedad
- Principios
  - Si el usuario menciona “precio” sin producto, preguntar: “¿De qué producto necesitas el precio?”.
  - Si pide “facturas” sin cliente ni número, preguntar: “¿Deseas la última factura o una lista por cliente? Especifica el cliente.”
  - Si pide “saldo” sin cliente, preguntar: “¿Saldo de qué cliente? Si quieres resumen global, indícalo.”
  - Si pide “catálogo” sin categoría, sugerir categorías disponibles y preguntar una preferencia.
- Técnicas
  - Preguntas con una sola decisión por turno (evitar sobrecargar).
  - Reforzar la intención con ejemplos breves (p.ej. “Ej.: ‘precio de tomate’”).
  - Mantener consistencia de idioma y evitar suposiciones; confirmar nombres exactos.

## Estrategia de Fallback (sin OpenAI o error)
- Principios
  - Nunca saltar automáticamente a price_lookup cuando el mensaje es ambiguo.
  - Preferir respuestas pedagógicas: explicar qué falta y pedir el dato mínimo.
  - Ofrecer sugerencias (productos/clientes/categorías) si es posible desde datos locales.
- Comportamiento
  - Si falla la clasificación: Responder que se requiere producto/cliente/categoría según el caso, con un ejemplo de cómo formular la consulta.
  - Si falta API Key: Operar modo “básico” con mensajería guiada (no extracción automática); no asumir intent ni parsear números por regex salvo confirmaciones/cancelaciones explícitas en multi-turno.
  - Log de errores: Registrar el fallo con trazabilidad mínima (sin exponer secretos) y dar respuesta clara al usuario.

