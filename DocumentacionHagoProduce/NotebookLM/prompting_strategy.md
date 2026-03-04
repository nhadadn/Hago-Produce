# 📄 PROMPTING STRATEGY - HAGO PRODUCE CHATBOT
# Sprint 7 | Fecha: 28/02/2026
# Basado en: CTO Document y REPOSITORIO COMPLETO de github.

## 1. PRINCIPIOS DE PROMPTING

### Principios guía para este proyecto específico

1. **Precisión sobre Creatividad**: El chatbot es un asistente de ERP, no un chatbot de entretenimiento. Las respuestas deben ser precisas, basadas en datos reales, y evitar alucinaciones.

2. **Contexto de Negocio Siempre Presente**: Cada prompt debe incluir información relevante sobre HAGO PRODUCE (distribuidor de frutas y verduras en Canadá, ERP de gestión agrícola).

3. **Confirmación para Acciones Mutativas**: Cualquier acción que cree o modifique recursos (pedidos, facturas, órdenes de compra) debe requerir confirmación explícita del usuario antes de ejecutarse.

4. **Idioma del Usuario**: El bot debe detectar y responder en el idioma del usuario (español o inglés), manteniendo consistencia throughout la conversación.

5. **Fallback Graceful**: Si no se puede cumplir una solicitud, el bot debe explicar por qué y ofrecer alternativas, no simplemente decir "no puedo".

6. **Transparencia en Fuentes**: Cuando sea posible, el bot debe indicar la fuente de la información (ej. "según el proveedor Agrícola San Juan").

7. **Concisión**: Las respuestas deben ser cortas y directas, especialmente para consultas rápidas de precios o estatus.

### Qué SIEMPRE debe incluir un prompt

- **Rol del asistente**: "Eres el asistente de HAGO PRODUCE, una empresa distribuidora de frutas y verduras en Canadá."
- **Contexto de negocio**: Información sobre el ERP, los servicios disponibles, y el dominio (gestión agrícola/produce).
- **Instrucciones de formato**: Especificación clara del formato de salida esperado (JSON, texto, etc.).
- **Instrucciones de fallback**: Qué hacer si no se puede cumplir la solicitud.
- **Restricciones**: Qué NO hacer (no inventar datos, no hacer suposiciones sin confirmar).
- **Idioma**: Instrucción explícita de responder en el idioma del usuario.

### Qué NUNCA debe incluir un prompt

- **Información sensible**: Nunca incluir datos de clientes, precios específicos, o información confidencial en el prompt.
- **Instrucciones contradictorias**: Evitar decir "sé creativo" y "sé preciso" en el mismo prompt.
- **Formatos ambiguos**: No decir "devuelve algo útil" - ser específico sobre el formato.
- **Referencias a implementación interna**: No mencionar archivos, funciones, o detalles técnicos del código.
- **Instrucciones de seguridad débiles**: No decir "sé cuidadoso" - ser específico sobre validaciones.

### Convenciones de nomenclatura

- **Intents**: `snake_case` (ej: `price_lookup`, `create_order`)
- **Variables**: `camelCase` (ej: `customerName`, `items`)
- **Parámetros de prompts**: `<<variable_name>>` (ej: `<<user_message>>`, `<<session_context>>`)
- **Tools/Functions**: `snake_case` (ej: `route_intent`, `extract_order_params`)
- **Mensajes de sistema**: Prefijo `[SYSTEM]` para claridad
- **Mensajes de usuario**: Prefijo `[USER]` para claridad

## 2. ARQUITECTURA DE PROMPTS

### 2.1 System Prompt Base

#### Estructura recomendada

```
[SYSTEM]
Eres el asistente virtual de HAGO PRODUCE, una empresa distribuidora de frutas y verduras en Canadá.

TU ROL:
- Ayudar a usuarios del ERP a realizar consultas y operaciones de negocio
- Proporcionar información precisa sobre inventario, precios, clientes, facturas y pedidos
- Facilitar la creación de documentos (pedidos, facturas, órdenes de compra) mediante lenguaje natural

CAPACIDADES:
- Consultar precios de productos y proveedores
- Buscar información de clientes y facturas
- Crear pedidos de clientes y órdenes de compra a proveedores
- Generar facturas directas
- Consultar saldos y estatus de documentos

RESTRICCIONES:
- NO inventes datos. Si no encuentras información, indícalo claramente.
- NO hagas suposiciones sin confirmar con el usuario.
- SIEMPRE confirma antes de crear o modificar documentos (pedidos, facturas, órdenes).
- Responde en el idioma del usuario (español o inglés).
- Sé conciso y directo en tus respuestas.

FORMATO DE RESPUESTA:
- Para consultas: Respuesta corta y clara con la información solicitada.
- Para acciones mutativas: Resumen de lo que harás + solicitud de confirmación.
- Para errores: Explicación clara del problema + sugerencia de solución.

CONTEXTO DE NEGOCIO:
- HAGO PRODUCE distribuye productos frescos (frutas, verduras) en Canadá
- Trabaja con múltiples proveedores y clientes
- Usa un sistema ERP para gestionar inventario, pedidos, facturas y compras
- Los productos tienen precios de costo y venta, y pueden tener múltiples proveedores

IDIOMA:
<<language_instruction>>
```

#### Variables de contexto a incluir

- `<<language_instruction>>`: "Responde siempre en español" o "Always respond in English"
- `<<user_role>>`: Rol del usuario (ADMIN, ACCOUNTING, MANAGEMENT, CUSTOMER)
- `<<customer_id>>`: ID del cliente (si aplica)
- `<<session_context>>`: Contexto de la sesión actual (pedidos pendientes, etc.)

#### Información de HAGO PRODUCE a embeber

- Tipo de negocio: Distribuidor de frutas y verduras en Canadá
- Servicios disponibles: Consultas de inventario, precios, clientes, facturas, pedidos
- Proceso de facturación: Creación → Confirmación → Envío → Pago
- Proceso de pedidos: Creación → Confirmación → Notificación → Entrega
- Proceso de compras: Solicitud → Optimización de proveedores → Confirmación → Envío

#### Tono y personalidad del chatbot

- **Profesional pero accesible**: Lenguaje de negocios pero amigable
- **Preciso y directo**: Ir al grano sin rodeos innecesarios
- **Proactivo**: Ofrecer información relevante antes de que se pida
- **Empático**: Entender la urgencia de operaciones de perecederos
- **Consistente**: Mantener el mismo tono throughout la conversación

### 2.2 Prompts por Intent

Para cada uno de los 17 intents identificados en el CTO:

| Intent | Trigger Esperado | Prompt Template | Variables Clave |
|--------|------------------|-----------------|-----------------|
| `price_lookup` | "precio de tomate", "cuánto cuesta el aguacate" | Consulta de precios con producto y proveedor | `<<product_name>>`, `<<supplier_name>>` |
| `best_supplier` | "mejor proveedor para tomate", "quién vende más barato" | Búsqueda de proveedores ordenados por precio | `<<product_name>>` |
| `invoice_status` | "estado de factura #123", "estatus de factura ABC" | Consulta de factura por número o búsqueda | `<<invoice_number>>`, `<<search_term>>` |
| `customer_balance` | "saldo del cliente", "cuánto debe La Tiendita" | Cálculo de saldo pendiente de cliente | `<<customer_name>>`, `<<customer_id>>` |
| `product_info` | "información del producto tomate", "detalles de aguacate" | Información detallada de producto | `<<product_name>>`, `<<product_sku>>` |
| `inventory_summary` | "resumen de inventario", "qué productos tenemos" | Resumen agrupado por categoría | `<<category>>`, `<<price_range>>` |
| `overdue_invoices` | "facturas vencidas", "facturas atrasadas" | Lista de facturas vencidas filtrable | `<<days_overdue>>`, `<<customer_name>>` |
| `customer_info` | "información del cliente", "datos de La Tiendita" | Información de contacto y fiscal | `<<customer_name>>`, `<<customer_email>>` |
| `create_order` | "quiero 5 cajas de tomate para La Tiendita" | Inicio de creación de pedido | `<<customer_name>>`, `<<items>>`, `<<delivery_date>>` |
| `confirm_order` | "sí", "confirmar", "ok" (con pedido pendiente) | Confirmación de pedido pendiente | `<<pending_order>>` |
| `cancel_order` | "no", "cancelar" (con pedido pendiente) | Cancelación de pedido pendiente | `<<pending_order>>` |
| `create_purchase_order` | "necesito 100kg de aguacate" | Inicio de orden de compra | `<<items>>`, `<<quantity>>` |
| `confirm_purchase_order` | "sí", "confirmar" (con orden pendiente) | Confirmación de orden de compra | `<<pending_purchase_orders>>` |
| `cancel_purchase_order` | "no", "cancelar" (con orden pendiente) | Cancelación de orden de compra | `<<pending_purchase_orders>>` |
| `create_invoice` | "crear factura para La Tiendita" | Inicio de creación de factura | `<<customer_name>>`, `<<items>>`, `<<invoice_date>>` |
| `confirm_invoice` | "sí", "confirmar" (con factura pendiente) | Confirmación de factura pendiente | `<<pending_invoice>>` |
| `cancel_invoice` | "no", "cancelar" (con factura pendiente) | Cancelación de factura pendiente | `<<pending_invoice>>` |

### 2.3 Prompts de Flujos Críticos

#### Flujo de Creación de Pedido (`create_order`)

**Prompt de entrada al flujo:**
```
[USER]
<<user_message>>

[SYSTEM]
El usuario quiere crear un pedido. Extrae la siguiente información:
- Nombre del cliente (obligatorio)
- Lista de items: producto, cantidad, unidad (obligatorio)
- Fecha de entrega (opcional, default: hoy)
- Canal de envío (opcional, default: whatsapp)

Si falta información obligatoria, pide al usuario que la proporcione.
Si el cliente no existe, indícalo y pide que verifique el nombre.
Si algún producto no existe, indícalo y pide que verifique el nombre.
```

**Prompt de pasos intermedios (validación):**
```
[SYSTEM]
Valida la información del pedido:
1. Busca el cliente en la base de datos
2. Busca cada producto en la base de datos
3. Resuelve los precios vigentes para cada producto
4. Calcula subtotal, impuestos y total

Si todo es válido, crea un objeto pendingOrder con:
- customerId
- customerName
- items (con productId, productName, quantity, unit, unitPrice, totalPrice)
- subtotal
- taxRate
- taxAmount
- total
- sendChannel

Si hay errores, indícalos claramente al usuario.
```

**Prompt de confirmación/cierre:**
```
[SYSTEM]
Muestra al usuario el resumen del pedido para confirmación:

"Voy a crear el siguiente pedido:
Cliente: <<customer_name>>
Items:
- <<item1>>: <<quantity>> <<unit>> x $<<price>> = $<<total>>
- <<item2>>: <<quantity>> <<unit>> x $<<price>> = $<<total>>
Subtotal: $<<subtotal>>
Impuestos (<<tax_rate>>%): $<<tax_amount>>
Total: $<<total>>

¿Confirmas la creación de este pedido? (sí/no)"

Si el usuario confirma, crea el pedido en la base de datos.
Si el usuario cancela, limpia el contexto.
```

**Prompt de error/fallback:**
```
[SYSTEM]
Si ocurre un error al crear el pedido:
1. Explica claramente qué salió mal
2. Ofrece una solución específica (ej. "El cliente no existe. ¿Quisiste decir X?")
3. Pregunta si el usuario quiere intentar de nuevo o cancelar
```

#### Flujo de Creación de Factura (`create_invoice`)

**Prompt de entrada al flujo:**
```
[USER]
<<user_message>>

[SYSTEM]
El usuario quiere crear una factura. Extrae la siguiente información:
- Nombre del cliente (obligatorio)
- Lista de items: producto, cantidad, unidad, precio unitario (obligatorio)
- Fecha de factura (opcional, default: hoy)
- Notas (opcional)

Si falta información obligatoria, pide al usuario que la proporcione.
Si el cliente no existe, indícalo y pide que verifique el nombre.
Si algún producto no existe, indícalo y pide que verifique el nombre.
```

**Prompt de pasos intermedios (validación):**
```
[SYSTEM]
Valida la información de la factura:
1. Busca el cliente en la base de datos
2. Busca cada producto en la base de datos
3. Verifica que los precios sean válidos
4. Calcula subtotal, impuestos y total

Si todo es válido, crea un objeto pendingInvoice con:
- customerId
- customerName
- items (con productId, productName, quantity, unit, unitPrice, totalPrice)
- subtotal
- taxRate
- taxAmount
- total
- invoiceDate
- notes

Si hay errores, indícalos claramente al usuario.
```

**Prompt de confirmación/cierre:**
```
[SYSTEM]
Muestra al usuario el resumen de la factura para confirmación:

"Voy a crear la siguiente factura:
Cliente: <<customer_name>>
Fecha: <<invoice_date>>
Items:
- <<item1>>: <<quantity>> <<unit>> x $<<price>> = $<<total>>
- <<item2>>: <<quantity>> <<unit>> x $<<price>> = $<<total>>
Subtotal: $<<subtotal>>
Impuestos (<<tax_rate>>%): $<<tax_amount>>
Total: $<<total>>

¿Confirmas la creación de esta factura? (sí/no)"

Si el usuario confirma, crea la factura en la base de datos con estado SENT.
Si el usuario cancela, limpia el contexto.
```

**Prompt de error/fallback:**
```
[SYSTEM]
Si ocurre un error al crear la factura:
1. Explica claramente qué salió mal
2. Ofrece una solución específica (ej. "El cliente no existe. ¿Quisiste decir X?")
3. Pregunta si el usuario quiere intentar de nuevo o cancelar
```

## 3. FUNCTION CALLING / TOOLS

### 3.1 Tools recomendadas

Para cada tool/función:

#### `route_intent`
- **Nombre y descripción**: Clasifica el mensaje del usuario en uno de los intents predefinidos
- **Cuándo activarla**: Siempre que llega un mensaje del usuario
- **Parámetros esperados**:
  - `message` (string): El mensaje del usuario
  - `language` (string): Idioma del usuario ('es' o 'en')
  - `context` (object): Contexto de la sesión actual
- **Output esperado**:
  - `intent` (string): El intent detectado
  - `confidence` (number): Confianza de la clasificación (0-1)
  - `params` (object): Parámetros extraídos del mensaje
- **Archivos del proyecto**: `src/lib/services/chat/openai-client.ts`

#### `extract_order_params`
- **Nombre y descripción**: Extrae parámetros para crear un pedido
- **Cuándo activarla**: Cuando el intent es `create_order`
- **Parámetros esperados**:
  - `message` (string): El mensaje del usuario
  - `language` (string): Idioma del usuario
- **Output esperado**:
  - `customerName` (string): Nombre del cliente
  - `items` (array): Lista de items con productName, quantity, unit
  - `deliveryDate` (string): Fecha de entrega (opcional)
  - `sendChannel` (string): Canal de envío (opcional)
- **Archivos del proyecto**: `src/lib/services/chat/intents/create-order.ts`

#### `extract_invoice_params`
- **Nombre y descripción**: Extrae parámetros para crear una factura
- **Cuándo activarla**: Cuando el intent es `create_invoice`
- **Parámetros esperados**:
  - `message` (string): El mensaje del usuario
  - `language` (string): Idioma del usuario
- **Output esperado**:
  - `customerName` (string): Nombre del cliente
  - `items` (array): Lista de items con productName, quantity, unit, unitPrice
  - `invoiceDate` (string): Fecha de factura (opcional)
  - `notes` (string): Notas (opcional)
- **Archivos del proyecto**: `src/lib/services/chat/intents/create-invoice.ts`

#### `extract_purchase_order_params`
- **Nombre y descripción**: Extrae parámetros para crear una orden de compra
- **Cuándo activarla**: Cuando el intent es `create_purchase_order`
- **Parámetros esperados**:
  - `message` (string): El mensaje del usuario
  - `language` (string): Idioma del usuario
- **Output esperado**:
  - `items` (array): Lista de items con productName, quantity, unit
  - `notes` (string): Notas (opcional)
- **Archivos del proyecto**: `src/lib/services/chat/intents/create-purchase-order.ts`

#### `price_lookup_tool`
- **Nombre y descripción**: Busca precios de productos
- **Cuándo activarla**: Cuando el intent es `price_lookup`
- **Parámetros esperados**:
  - `searchTerm` (string): Término de búsqueda
  - `language` (string): Idioma del usuario
- **Output esperado**:
  - `items` (array): Lista de productos con precios y proveedores
- **Archivos del proyecto**: `src/lib/services/chat/intents/price-lookup.ts`

#### `best_supplier_tool`
- **Nombre y descripción**: Encuentra los mejores proveedores para un producto
- **Cuándo activarla**: Cuando el intent es `best_supplier`
- **Parámetros esperados**:
  - `searchTerm` (string): Término de búsqueda del producto
  - `language` (string): Idioma del usuario
- **Output esperado**:
  - `items` (array): Lista de proveedores ordenados por precio
- **Archivos del proyecto**: `src/lib/services/chat/intents/best-supplier.ts`

### 3.2 Estrategia de orquestación

#### Orden de evaluación de tools

1. **`route_intent`** (siempre primero)
   - Clasifica el mensaje del usuario
   - Determina qué tool usar a continuación

2. **Tools de extracción de parámetros** (según intent)
   - `extract_order_params` para `create_order`
   - `extract_invoice_params` para `create_invoice`
   - `extract_purchase_order_params` para `create_purchase_order`

3. **Tools de consulta** (según intent)
   - `price_lookup_tool` para `price_lookup`
   - `best_supplier_tool` para `best_supplier`
   - (otras tools de consulta según intent)

4. **Tools de confirmación/cancelación** (según contexto)
   - Si hay `pendingOrder`, `confirm_order` o `cancel_order`
   - Si hay `pendingInvoice`, `confirm_invoice` o `cancel_invoice`
   - Si hay `pendingPurchaseOrders`, `confirm_purchase_order` o `cancel_purchase_order`

#### Manejo de tools en cadena

- **Caso 1: Creación de pedido**
  1. `route_intent` → detecta `create_order`
  2. `extract_order_params` → extrae parámetros
  3. Validación interna → busca cliente y productos
  4. Si válido → guarda en `pendingOrder` y pide confirmación
  5. `route_intent` → detecta `confirm_order` o `cancel_order`
  6. Ejecuta acción correspondiente

- **Caso 2: Consulta de precio**
  1. `route_intent` → detecta `price_lookup`
  2. `price_lookup_tool` → busca precios
  3. Formatea respuesta y la devuelve al usuario

#### Validación de outputs de tools

- **Validación de tipos**: Verificar que los outputs tengan los tipos correctos
- **Validación de campos obligatorios**: Verificar que los campos obligatorios estén presentes
- **Validación de rangos**: Verificar que los valores estén en rangos aceptables (ej. cantidad > 0)
- **Validación de negocio**: Verificar que los datos sean válidos según las reglas del negocio
- **Manejo de errores**: Si una tool falla, devolver un error claro y ofrecer alternativas

## 4. MANEJO DE CONTEXTO MULTI-TURNO

### 4.1 Qué persistir en contexto

#### Variables de sesión críticas

- `pendingOrder`: Datos temporales del pedido pendiente de confirmación
  - `customerId`: ID del cliente
  - `customerName`: Nombre del cliente
  - `items`: Lista de items del pedido
  - `subtotal`: Subtotal del pedido
  - `taxRate`: Tasa de impuesto
  - `taxAmount`: Monto de impuestos
  - `total`: Total del pedido
  - `sendChannel`: Canal de envío

- `pendingInvoice`: Datos temporales de la factura pendiente de confirmación
  - `customerId`: ID del cliente
  - `customerName`: Nombre del cliente
  - `items`: Lista de items de la factura
  - `subtotal`: Subtotal de la factura
  - `taxRate`: Tasa de impuesto
  - `taxAmount`: Monto de impuestos
  - `total`: Total de la factura
  - `invoiceDate`: Fecha de la factura
  - `notes`: Notas de la factura

- `pendingPurchaseOrders`: Lista de órdenes de compra pendientes de confirmación
  - Array de objetos con datos de cada orden de compra

#### Historial relevante a mantener

- Últimos 20 mensajes de la conversación
- Intents detectados en cada mensaje
- Respuestas del asistente
- Timestamps de cada mensaje

#### Cuándo limpiar el contexto

- **Después de confirmar una acción mutativa**: Limpiar `pendingOrder`, `pendingInvoice`, `pendingPurchaseOrders`
- **Después de cancelar una acción mutativa**: Limpiar el contexto correspondiente
- **Después de 30 minutos de inactividad**: Limpiar todo el contexto
- **Cuando el usuario inicia una nueva conversación**: Limpiar todo el contexto

### 4.2 Estrategia de ventana de contexto

#### Qué incluir siempre (contexto fijo)

- **System prompt base**: Información sobre HAGO PRODUCE y el rol del asistente
- **Instrucciones de formato**: Formato esperado de las respuestas
- **Restricciones**: Qué NO hacer el asistente
- **Idioma del usuario**: Instrucción de responder en el idioma correcto

#### Qué incluir dinámicamente

- **Últimos 20 mensajes**: Historial reciente de la conversación
- **Contexto de sesión**: `pendingOrder`, `pendingInvoice`, `pendingPurchaseOrders`
- **Información del usuario**: Rol, ID de cliente (si aplica)
- **Datos relevantes**: Información de clientes, productos, etc. que se haya mencionado recientemente

#### Cómo comprimir contexto largo

- **Resumen de conversación**: Generar un resumen de los últimos 50 mensajes
- **Eliminación de mensajes redundantes**: Remover mensajes que no aportan información nueva
- **Agrupación de información**: Agrupar información relacionada (ej. todos los items de un pedido)
- **Priorización de información reciente**: Dar más peso a los mensajes más recientes

#### Límites de tokens recomendados

- **System prompt**: ~500 tokens
- **Historial de conversación**: ~2000 tokens (últimos 20 mensajes)
- **Contexto de sesión**: ~500 tokens
- **Total**: ~3000 tokens (para GPT-4o-mini que tiene 16k tokens)

## 5. ESTRATEGIAS DE FALLBACK

### 5.1 Árbol de decisión de fallbacks

```
Usuario envía mensaje
    ↓
¿OpenAI API está disponible?
    ↓ Sí
¿Clasificación de intent tiene confianza ≥ 0.8?
    ↓ Sí
¿Intent está implementado?
    ↓ Sí
¿Parámetros extraídos son válidos?
    ↓ Sí
Ejecutar intent
    ↓
¿Ejecución fue exitosa?
    ↓ Sí
Devolver respuesta al usuario
    ↓ No
Fallback por error de ejecución
    ↓ No
Fallback por parámetros inválidos
    ↓ No
Fallback por intent no implementado
    ↓ No
Fallback por baja confianza
    ↓ No
¿OpenAI API está disponible?
    ↓ No
Fallback por error de API
```

### 5.2 Tipos de fallback

#### Fallback por intent no reconocido

**Trigger**: Cuando la confianza de la clasificación es < 0.8

**Mensaje de fallback**:
```
[ES] "No estoy seguro de entender tu solicitud. ¿Podrías reformularla de otra manera?"
[EN] "I'm not sure I understand your request. Could you rephrase it?"
```

**Acción**: Pedir al usuario que reformule su solicitud

#### Fallback por error de tool/API

**Trigger**: Cuando una tool falla o la API de OpenAI no responde

**Mensaje de fallback**:
```
[ES] "Ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo en unos momentos."
[EN] "An error occurred while processing your request. Please try again in a few moments."
```

**Acción**: Registrar el error y pedir al usuario que intente de nuevo

#### Fallback por contexto insuficiente

**Trigger**: Cuando falta información obligatoria para ejecutar un intent

**Mensaje de fallback**:
```
[ES] "Necesito más información para <<intent>>. Por favor, proporciona: <<missing_info>>"
[EN] "I need more information to <<intent>>. Please provide: <<missing_info>>"
```

**Acción**: Pedir al usuario la información faltante

#### Fallback por respuesta fuera de scope

**Trigger**: Cuando el usuario solicita algo que el chatbot no puede hacer

**Mensaje de fallback**:
```
[ES] "Lo siento, no puedo <<action>>. Mi función es ayudar con consultas y operaciones del ERP de HAGO PRODUCE."
[EN] "Sorry, I cannot <<action>>. My function is to help with queries and operations of the HAGO PRODUCE ERP."
```

**Acción**: Explicar las limitaciones del chatbot y ofrecer alternativas

### 5.3 Mensajes de fallback

#### Templates de mensajes por tipo

**Fallback genérico**:
```
[ES] "Lo siento, no pude procesar tu solicitud. ¿Podrías intentar de nuevo con otras palabras?"
[EN] "Sorry, I couldn't process your request. Could you try again with different words?"
```

**Fallback por cliente no encontrado**:
```
[ES] "No encontré el cliente '<<customer_name>>'. ¿Quisiste decir: <<suggestions>>?"
[EN] "I couldn't find the customer '<<customer_name>>'. Did you mean: <<suggestions>>?"
```

**Fallback por producto no encontrado**:
```
[ES] "No encontré el producto '<<product_name>>'. ¿Quisiste decir: <<suggestions>>?"
[EN] "I couldn't find the product '<<product_name>>'. Did you mean: <<suggestions>>?"
```

**Fallback por factura no encontrada**:
```
[ES] "No encontré la factura '<<invoice_number>>'. Por favor, verifica el número."
[EN] "I couldn't find the invoice '<<invoice_number>>'. Please verify the number."
```

#### Cómo escalar a humano si aplica

**Trigger**: Cuando el usuario solicita ayuda humana explícitamente o cuando el chatbot no puede resolver el problema después de 3 intentos

**Mensaje de escalado**:
```
[ES] "Voy a conectararte con un agente humano para que pueda ayudarte mejor."
[EN] "I'm going to connect you with a human agent who can better assist you."
```

**Acción**: Notificar al equipo de soporte y proporcionar el historial de la conversación

## 6. VALIDACIÓN Y CALIDAD

### 6.1 Checklist de validación por prompt

- [ ] ¿Incluye contexto suficiente?
  - [ ] Información sobre HAGO PRODUCE
  - [ ] Rol del asistente
  - [ ] Capacidades y restricciones
  - [ ] Idioma del usuario

- [ ] ¿Define claramente el output esperado?
  - [ ] Formato de salida (JSON, texto, etc.)
  - [ ] Campos obligatorios y opcionales
  - [ ] Tipos de datos esperados
  - [ ] Validaciones requeridas

- [ ] ¿Tiene instrucción de fallback?
  - [ ] Qué hacer si no se puede cumplir la solicitud
  - [ ] Mensaje de error claro
  - [ ] Ofrecer alternativas

- [ ] ¿Es compatible con el estado actual?
  - [ ] Usa intents que están implementados
  - [ ] Usa servicios que existen
  - [ ] Respeta las restricciones del sistema

- [ ] ¿Fue probado con casos edge?
  - [ ] Mensajes vacíos
  - [ ] Mensajes muy largos
  - [ ] Caracteres especiales
  - [ ] Múltiples idiomas en el mismo mensaje

### 6.2 Casos de prueba recomendados

#### Para cada intent/flujo crítico:

**Caso happy path**:
- `price_lookup`: "precio de tomate" → Devuelve precio correcto
- `create_order`: "quiero 5 cajas de tomate para La Tiendita" → Crea pedido correctamente
- `create_invoice`: "crear factura para La Tiendita con 10 cajas de tomate" → Crea factura correctamente

**Caso edge**:
- `price_lookup`: "precio de" → Pide nombre del producto
- `create_order`: "quiero pedido" → Pide cliente y items
- `create_invoice`: "crear factura" → Pide cliente y items

**Caso de error esperado**:
- `price_lookup`: "precio de producto_inexistente" → Indica que no existe
- `create_order`: "quiero 5 cajas de tomate para cliente_inexistente" → Indica que cliente no existe
- `create_invoice`: "crear factura para cliente_inexistente" → Indica que cliente no existe

### 6.3 Métricas de éxito del prompting

- **Intent recognition rate objetivo**: ≥90%
  - Medición: Porcentaje de mensajes clasificados correctamente
  - Frecuencia: Diaria
  - Umbral de alerta: <85%

- **Fallback rate máximo aceptable**: ≤10%
  - Medición: Porcentaje de mensajes que terminan en fallback
  - Frecuencia: Diaria
  - Umbral de alerta: >15%

- **Tiempo de respuesta objetivo**: <1.2s mediana
  - Medición: Tiempo desde que el usuario envía el mensaje hasta que recibe la respuesta
  - Frecuencia: Diaria
  - Umbral de alerta: >2s

- **Satisfacción de usuario objetivo**: ≥4/5
  - Medición: Encuestas de satisfacción después de cada interacción
  - Frecuencia: Semanal
  - Umbral de alerta: <3.5/5

- **Tasa de éxito end-to-end**: ≥95% en staging
  - Medición: Porcentaje de operaciones completadas exitosamente de principio a fin
  - Frecuencia: Semanal
  - Umbral de alerta: <90%

## 7. ROADMAP DE IMPLEMENTACIÓN

### Semana 1 - Fundamentos

**Día 1-2: Implementar System Prompt Base**
- Crear system prompt base con información de HAGO PRODUCE
- Definir variables de contexto
- Implementar instrucciones de formato y restricciones
- Testear con mensajes simples

**Día 3-4: Implementar Tools de Clasificación**
- Implementar `route_intent` con OpenAI Tools
- Implementar tools de extracción de parámetros
- Validar outputs de tools
- Testear con casos edge

**Día 5: Implementar Fallbacks Básicos**
- Implementar fallback por intent no reconocido
- Implementar fallback por error de API
- Implementar fallback por contexto insuficiente
- Testear con casos de error

### Semana 2 - Intents Críticos

**Día 1-2: Implementar Intents de Consultas**
- Implementar prompts para `price_lookup`, `best_supplier`, `invoice_status`
- Implementar prompts para `customer_balance`, `product_info`, `inventory_summary`
- Testear con casos happy path y edge

**Día 3-4: Implementar Intents Transaccionales**
- Implementar prompts para `create_order`, `confirm_order`, `cancel_order`
- Implementar prompts para `create_purchase_order`, `confirm_purchase_order`, `cancel_purchase_order`
- Testear flujos completos end-to-end

**Día 5: Implementar Intents de Facturación**
- Implementar prompts para `create_invoice`, `confirm_invoice`, `cancel_invoice`
- Testear flujos completos end-to-end
- Validar integración con `InvoicesService`

### Semana 3 - Optimización y Pruebas

**Día 1-2: Optimizar Prompts**
- A/B testing de diferentes variantes de prompts
- Optimizar para reducir latencia
- Optimizar para mejorar intent recognition rate
- Documentar mejores prácticas

**Día 3-4: Pruebas Exhaustivas**
- Testear con casos edge y adversariales
- Testear con múltiples idiomas
- Testear con usuarios reales (beta testers)
- Recopilar feedback y ajustar

**Día 5: Documentación y Despliegue**
- Documentar todos los prompts
- Crear guía de mantenimiento
- Desplegar a staging
- Monitorear métricas y ajustar según necesario

## 8. GUÍA DE MANTENIMIENTO

### Cuándo revisar y actualizar prompts

- **Semanalmente**: Revisar métricas de éxito (intent recognition rate, fallback rate, tiempo de respuesta)
- **Quincenalmente**: Revisar feedback de usuarios y ajustar prompts según necesario
- **Mensualmente**: Revisar logs de errores y ajustar fallbacks
- **Trimestralmente**: Revisión completa de todos los prompts y actualización según cambios en el negocio

### Proceso de A/B testing de prompts

1. **Definir hipótesis**: Qué se quiere mejorar (ej. reducir fallback rate)
2. **Crear variantes**: Crear 2-3 variantes del prompt
3. **Definir métricas**: Qué métricas se van a medir (ej. intent recognition rate)
4. **Implementar test**: Desplegar variantes en staging con tráfico dividido
5. **Recopilar datos**: Recopilar datos durante al menos 1 semana
6. **Analizar resultados**: Comparar métricas entre variantes
7. **Seleccionar ganador**: Elegir la variante con mejores resultados
8. **Desplegar a producción**: Desplegar la variante ganadora

### Cómo documentar cambios

- **Formato de documentación**: Markdown con la siguiente estructura:
  - Fecha del cambio
  - Prompt modificado
  - Razón del cambio
  - Variante anterior (para rollback)
  - Métricas antes y después
  - Responsable del cambio

- **Ubicación de documentación**: `docs/prompts/` con un archivo por prompt
- **Versionamiento**: Usar git para versionar los cambios
- **Comunicación**: Notificar al equipo sobre cambios importantes

### Proceso de rollback

1. **Identificar problema**: Detectar que un cambio causó un problema
2. **Revisar métricas**: Verificar qué métricas se vieron afectadas
3. **Revertir cambio**: Volver a la versión anterior del prompt
4. **Investigar causa**: Analizar por qué el cambio causó el problema
5. **Documentar aprendizaje**: Documentar lo aprendido para evitar el mismo error en el futuro
6. **Comunicar**: Notificar al equipo sobre el rollback y el aprendizaje