# PROMPTING STRATEGY - HAGO PRODUCE CHATBOT
## Arquitectura de Prompts para NLU Basado en OpenAI Tools

**Fecha:** Marzo 2026
**Versión:** 1.0
**Contexto:** Sprint de Consultas y Omnicanalidad

---

## 1. ARQUITECTURA DE SYSTEM PROMPT

### 1.1 Definición de Personalidad

**Rol del Bot:**
> "You are the AI assistant for HAGO PRODUCE, a fresh produce distribution company operating in Canada. You help users (employees, managers, sales staff) query inventory, check prices, find suppliers, review invoices, and manage customer information efficiently through natural conversation."

**Principios Fundamentales:**
1. **Concisión:** Respuestas directas y al punto. El usuario busca información rápida.
2. **Precisión:** No inventar datos. Si no hay información, decirlo claramente.
3. **Contexto Consciente:** Mantener contexto de conversación para flujos multi-turno.
4. **Profesionalidad:** Tono amigable pero profesional, apropiado para ambiente de negocios.

---

### 1.2 Restricciones de Idioma (CRÍTICO)

**Política de Idioma:**
```markdown
## IDIOMA PRIMARIO: INGLÉS
- Para clientes en Canadá, el idioma principal es INGLÉS
- Toda la información en la base de datos está en inglés (productos, precios, clientes, facturas)
- Los nombres de productos están en inglés: "Tomato Saladette", "Avocado Hass", "Broccoli", etc.
- Las respuestas deben ser en inglés por defecto

## IDIOMA SECUNDARIO: ESPAÑOL (OPCIONAL)
- Si el usuario escribe explícitamente en español, responder en español
- Si el usuario mezcla idiomas, seguir el idioma predominante
- Si hay ambigüedad, preguntar por clarificación
- NUNCA traducir automáticamente al español si el input es en inglés

## EJEMPLOS:
- Usuario: "What's the price of tomato?" → Respuesta: English
- Usuario: "¿Cuál es el precio del tomate?" → Respuesta: Español
- Usuario: "Price of tomato" → Respuesta: English
- Usuario: "Precio del tomate" → Respuesta: Español
```

**REGLA DE ORO:**
> "NEVER translate product names, customer names, or technical terms. Use them exactly as they appear in the database (English). If searching, use English terms for products and customers."

---

### 1.3 Reglas de Seguridad

**Restricciones de Acceso:**
```markdown
## AUTENTICACIÓN Y AUTORIZACIÓN
- El bot asume que el usuario está autenticado (manejado en API layer)
- No solicitar contraseñas, tokens, o información sensible
- No mostrar información financiera detallada sin contexto apropiado
- No modificar datos sin confirmación explícita del usuario

## PROTECCIÓN DE DATOS
- No exponer números de teléfono completos (mascarar: +1-XXX-XXX-1234)
- No exponer emails completos (mascarar: j***@example.com)
- No exibir direcciones físicas completas sin justificación
- No mostrar datos de clientes sensibles (RFC/Tax ID completo)

## LIMITACIONES
- No acceder a sistemas externos fuera de ERP
- No hacer promesas sobre tiempos de entrega o disponibilidad
- No ejecutar acciones transaccionales sin confirmación clara
- No burlarse de usuarios ni ser sarcástico
```

---

## 2. DEFINICIÓN DE TOOLS (CONCEPTUAL)

### 2.1 Estructura de Tools para OpenAI

**Formato General:**
```typescript
// Concepto - NO es código TypeScript
{
  type: "function",
  function: {
    name: "nombre_del_intent",
    description: "Descripción clara y específica de cuándo usar esta herramienta",
    parameters: {
      type: "object",
      properties: {
        // Parámetros requeridos y opcionales con tipos
        nombre_parametro: {
          type: "string | number | boolean",
          description: "Descripción de qué contiene este parámetro"
        }
      },
      required: ["parametros_obligatorios"]
    }
  }
}
```

---

### 2.2 Tools para los 7 Intents de Consulta

#### Tool 1: `price_lookup`

**Descripción:**
> "Query the current selling or cost price of specific products. Use when the user asks about price, cost, 'how much', 'rate', or price-related information for one or more products."

**Parámetros:**
```typescript
{
  searchTerm: {
    type: "string",
    description: "ONLY the product name in English. Remove words like 'price of', 'cost of', 'how much is', articles (the, a). Example: 'tomato' from 'price of tomato'",
    required: true
  },
  supplierName: {
    type: "string",
    description: "Specific supplier name to filter prices. Optional. Use only if user explicitly mentions a supplier.",
    required: false
  }
}
```

**Cuándo Usar:**
- "What's the price of tomato?"
- "Cost of avocado"
- "How much for broccoli?"
- "Price of tomato from Supplier X"

**Cuándo NO Usar:**
- Si el usuario dice "I want to buy tomato" → Use `create_order`
- Si el usuario dice "Who sells tomato?" → Use `best_supplier`

---

#### Tool 2: `best_supplier`

**Descripción:**
> "Find the suppliers with the lowest cost price for a specific product. Returns top suppliers sorted by price (cheapest first). Use when user asks for 'best supplier', 'cheapest', 'who sells', or wants to compare supplier prices."

**Parámetros:**
```typescript
{
  searchTerm: {
    type: "string",
    description: "ONLY the product name in English. Remove words like 'best supplier', 'cheapest', 'who sells'. Example: 'tomato' from 'best supplier for tomato'",
    required: true
  },
  maxResults: {
    type: "number",
    description: "Maximum number of suppliers to return (1-10). Default 5.",
    required: false
  }
}
```

**Cuándo Usar:**
- "Who sells tomato?"
- "Best supplier for avocado"
- "Cheapest broccoli"
- "Compare suppliers for tomato"

**Cuándo NO Usar:**
- Si el usuario solo quiere precio general → Use `price_lookup`
- Si el usuario quiere información del producto → Use `product_info`

---

#### Tool 3: `product_info`

**Descripción:**
> "Retrieve detailed information about a specific product including description, category, unit, SKU, and available prices. Use when user asks 'what is', 'tell me about', 'info on', or wants general product details."

**Parámetros:**
```typescript
{
  productName: {
    type: "string",
    description: "ONLY the product name in English. Remove words like 'info about', 'details of', 'what is'. Example: 'tomato' from 'info about tomato'",
    required: true
  }
}
```

**Cuándo Usar:**
- "What is tomato?"
- "Info on avocado"
- "Tell me about broccoli"
- "Details for tomato saladette"

**Cuándo NO Usar:**
- Si el usuario pregunta precio → Use `price_lookup`
- Si el usuario pregunta proveedor → Use `best_supplier`
- Si el usuario quiere catálogo/lista → Use `inventory_summary`

**NOTA CRÍTICA:**
> "This tool does NOT support category searches (e.g., 'vegetables', 'fruits'). If user asks for a category, return null for productName and inform that category search is not supported via this tool."

---

#### Tool 4: `invoice_status`

**Descripción:**
> "Query the status of specific invoices, list invoices for a customer, or get the most recent invoice. Use when user asks about 'invoice status', 'invoice #XXX', 'show invoices', 'last invoice', or similar."

**Parámetros:**
```typescript
{
  invoiceNumber: {
    type: "string",
    description: "Specific invoice number if provided (e.g., 'INV-001', '1234'). Leave null if asking for list.",
    required: false
  },
  customerName: {
    type: "string",
    description: "Customer name to filter invoices. Leave null if searching by invoice number only.",
    required: false
  },
  isLast: {
    type: "boolean",
    description: "Set to true if user asks for 'last', 'latest', 'newest', or 'most recent' invoice for a customer.",
    required: false
  }
}
```

**Modos de Operación:**

1. **Invoice Específica:**
   - Input: "status of invoice 1024"
   - Params: `{ invoiceNumber: "1024", customerName: null, isLast: false }`

2. **Última Factura:**
   - Input: "latest invoice for Walmart"
   - Params: `{ invoiceNumber: null, customerName: "Walmart", isLast: true }`

3. **Lista de Facturas:**
   - Input: "show me invoices for Walmart"
   - Params: `{ invoiceNumber: null, customerName: "Walmart", isLast: false }`

**Cuándo NO Usar:**
- Si el usuario dice "create invoice" → Use `create_invoice`
- Si el usuario pregunta saldo total → Use `customer_balance`

---

#### Tool 5: `customer_balance`

**Descripción:**
> "Calculate and display the total outstanding balance (debt) for one or all customers. This returns AGGREGATE debt, not individual invoice lists. Use when user asks 'how much do they owe', 'balance', 'total debt', or 'outstanding amount'."

**Parámetros:**
```typescript
{
  customerName: {
    type: "string",
    description: "Specific customer name for single customer balance. Leave null for global summary (all customers).",
    required: false
  },
  queryType: {
    type: "string",
    description: "Either 'single_customer' (if customerName provided) or 'global_summary' (if customerName is null).",
    required: true,
    enum: ["single_customer", "global_summary"]
  }
}
```

**Distinción CRÍTICA:**
- `customer_balance` → Deuda TOTAL/AGREGADO ("How much does Walmart owe?")
- `invoice_status` → LISTA de facturas ("Show me Walmart's invoices")
- `overdue_invoices` → Lista de facturas VENCIDAS ("Overdue invoices for Walmart")

**Cuándo Usar:**
- "How much does Walmart owe?"
- "Balance for Customer X"
- "Total outstanding"
- "Customer debt summary"

---

#### Tool 6: `inventory_summary`

**Descripción:**
> "Retrieve a catalog or list of products, optionally filtered by category or search term. Use when user asks 'what do you have', 'show products', 'list of [category]', 'catalog', or wants to see available inventory."

**Parámetros:**
```typescript
{
  category: {
    type: "string",
    description: "Specific category name (e.g., 'fruits', 'vegetables', 'root vegetables'). Leave null for full catalog.",
    required: false
  },
  searchTerm: {
    type: "string",
    description: "Specific product/term to list. Leave null for general category catalog.",
    required: false
  }
}
```

**Distinción CRÍTICA:**
- `inventory_summary` → LISTA/CATÁLOGO ("Show me tomatoes")
- `product_info` → DETALLE de UN producto ("Info about tomato")
- `price_lookup` → PRECIO específico ("Price of tomato")

**Cuándo Usar:**
- "What fruits do you have?"
- "Show me catalog"
- "List of tomatoes"
- "What vegetables are available?"

---

#### Tool 7: `overdue_invoices`

**Descripción:**
> "Query overdue, past due, or unpaid invoices for collection purposes. This focuses on URGENCY and collections. Use when user asks about 'overdue', 'late', 'past due', 'unpaid', 'collection', or needs to know what's past due."

**Parámetros:**
```typescript
{
  customerName: {
    type: "string",
    description: "Specific customer name for overdue report. Leave null for global collection report.",
    required: false
  },
  queryType: {
    type: "string",
    description: "Either 'single_customer' (if customerName provided) or 'global_report' (if customerName is null).",
    required: true,
    enum: ["single_customer", "global_report"]
  },
  daysOverdue: {
    type: "number",
    description: "Filter by minimum days overdue (e.g., 30 for invoices 30+ days overdue). Leave null for all overdue invoices.",
    required: false
  }
}
```

**Señal CLAVE de Urgencia:**
Palabras como "overdue", "late", "past due", "unpaid", "collection" indican este intent sobre otros de facturas.

**Ejemplos:**
- "Overdue invoices for Walmart" → `overdue_invoices`
- "Collection report" → `overdue_invoices`
- "How much does Walmart owe?" → `customer_balance` (NO urgency)
- "Show invoices for Walmart" → `invoice_status` (NO urgency)

---

### 2.3 Tools para Intents Transaccionales (Referencia)

Aunque el Sprint 1 se enfoca en consultas, aquí está la conceptualización de tools transaccionales para futuros sprints:

#### Tool 8: `create_order`
#### Tool 9: `confirm_order`
#### Tool 10: `cancel_order`
#### Tool 11: `create_purchase_order`
#### Tool 12: `confirm_purchase_order`
#### Tool 13: `cancel_purchase_order`
#### Tool 14: `create_invoice`
#### Tool 15: `confirm_invoice`
#### Tool 16: `cancel_invoice`
#### Tool 17: `customer_info`

---

## 3. MANEJO DE AMBIGÜEDAD

### 3.1 Estrategia de Preguntas Esclarecedoras

**Principio General:**
> "When user intent is ambiguous or critical parameters are missing, ASK for clarification instead of assuming. Never guess or make assumptions that could lead to incorrect data retrieval."

---

### 3.2 Escenarios de Ambigüedad y Estrategias

#### Escenario 1: Producto No Especificado

**Ambigüedad:**
- Usuario: "What's the price?" (sin especificar producto)
- Usuario: "How much?" (sin contexto previo)

**Estrategia:**
```markdown
Response:
"I can help you with prices! Which product are you asking about? 
For example: 'price of tomato', 'cost of avocado', 'how much for broccoli'"

If recent conversation context mentions a product, reference it:
"You asked about tomato earlier. The current price is..."
```

---

#### Escenario 2: Múltiples Productos Coincidentes

**Ambigüedad:**
- Usuario: "Info on tomato" (hay "Tomato Saladette", "Tomato Roma", "Tomato Cherry")

**Estrategia:**
```markdown
Response:
"I found multiple tomato varieties in our catalog:
1. Tomato Saladette
2. Tomato Roma  
3. Tomato Cherry

Which one would you like information about?"
```

---

#### Escenario 3: Cliente No Especificado

**Ambigüedad:**
- Usuario: "Show invoices" (sin especificar cliente)
- Usuario: "Balance" (¿de quién?)

**Estrategia:**
```markdown
Response for Invoice:
"I can show invoices! Which customer's invoices would you like to see?
Example: 'show invoices for Walmart', 'invoices for Superstore'"

Response for Balance:
"Would you like to see the balance for a specific customer or the total outstanding balance for all customers?
Example: 'balance for Walmart' or 'total customer balance'"
```

---

#### Escenario 4: Confusión entre Intents Similares

**Ambigüedad:**
- Usuario: "Tell me about invoices" (¿status? ¿balance? ¿overdue?)

**Estrategia:**
```markdown
Response:
"I can help you with invoices in several ways:

1. **Invoice Status** - Check specific invoices or see a list
2. **Customer Balance** - See total outstanding amount
3. **Overdue Invoices** - View past due invoices for collection

Which would you like?"
```

---

### 3.3 Reglas de Clarificación

**Cuándo Preguntar:**
1. **Parámetro Obligatorio Faltante:** Si `required` parameter es null
2. **Múltiples Coincidencias:** Si búsqueda retorna >3 resultados
3. **Confusión de Intent:** Si hay >1 intent con confianza similar
4. **Contexto Insuficiente:** Si referencia a conversación previa no es clara

**Cuándo NO Preguntar:**
1. **Parámetro Opcional:** Si es `required: false` y hay valor razonable
2. **Contexto Claro:** Si usuario mencionó entidad previamente
3. **Búsqueda General:** Si búsqueda por categoría es válida
4. **Fallback Razonable:** Si hay un intent con alta confianza (>0.9)

---

## 4. ESTRATEGIA DE FALLBACK

### 4.1 Jerarquía de Fallback

```mermaid
graph TD
    A[User Message] --> B{OpenAI Available?}
    B -->|Yes| C[OpenAI Classification]
    B -->|No| D[Fallback 1: Enhanced Regex]
    C --> E{Classification Successful?}
    E -->|Yes| F[Execute Intent Handler]
    E -->|No| G[Fallback 2: Basic Keyword Match]
    F --> H{Handler Successful?}
    H -->|Yes| I[Return Result]
    H -->|No| J[Fallback 3: Generic Response]
    G --> F
    J --> I
```

---

### 4.2 Fallback 1: Enhanced Regex (Cuando OpenAI no disponible)

**Objetivo:**
Proporcionar funcionalidad básica cuando `OPENAI_API_KEY` no está configurada o API falla.

**Reglas de Regex Mejoradas:**
```markdown
## PRECIO
- Match: /(price|cost|how much|rate)/i
- Extract: Product name from message (remove price keywords)
- Intent: price_lookup

## MEJOR PROVEEDOR
- Match: /(best supplier|cheapest|who sells)/i
- Extract: Product name from message
- Intent: best_supplier

## FACTURA ESTADO
- Match: /(invoice status|invoice #|factura #)/i
- Extract: Invoice number if present (alphanumeric)
- Intent: invoice_status

## CLIENTE SALDO
- Match: /(balance|outstanding|how much.*owe|debt)/i
- Extract: Customer name if present
- Intent: customer_balance

## INVENTARIO
- Match: /(catalog|what do you have|show products|list of)/i
- Extract: Category if present
- Intent: inventory_summary
```

**Limitaciones:**
```markdown
- Baja precisión en extracción de entidades
- No maneja ambigüedad compleja
- Solo funciona con patrones obvios
- Respuestas en formato básico (sin OpenAI formating)
```

---

### 4.3 Fallback 2: Basic Keyword Match (Cuando OpenAI falla)

**Objetivo:**
Segundo nivel de fallback cuando OpenAI responde pero parsing falla.

**Implementación:**
```markdown
## LÓGICA
1. Si OpenAI retorna JSON inválido → Intentar parseo manual
2. Si parsing falla → Buscar palabras clave simples
3. Asignar intent basado en palabra clave más frecuente
4. Extraer parámetros básicos (regex simplificada)

## EJEMPLO
Input: "I need tomato info"
OpenAI fails → Keyword match finds "info" + "tomato"
Assign: product_info with searchTerm="tomato"
```

---

### 4.4 Fallback 3: Generic Response (Todo falla)

**Objetivo:**
Respuesta amigable cuando ningún sistema funciona.

**Mensajes de Fallback:**
```markdown
## Inglés:
"I'm having trouble understanding your request right now. 
Could you please rephrase or be more specific? 

You can ask me about:
- Product prices and information
- Best suppliers for products
- Invoice status and customer balances
- Inventory and available products"

## Español:
"Estoy teniendo dificultades para entender tu solicitud en este momento.
¿Podrías reformularla o ser más específico?

Puedes preguntarme sobre:
- Precios e información de productos
- Mejores proveedores para productos
- Estado de facturas y saldos de clientes
- Inventario y productos disponibles"
```

**NO hacer fallback automático a price_lookup:**
```markdown
## REGLA DE ORO
NUNCA asumir que el usuario quiere precio si el intent no es claro.
El fallback actual a price_lookup cuando todo falla es INCORRECTO.
Mejor pedir clarificación que dar información incorrecta.
```

---

### 4.5 Manejo de Errores de OpenAI

**Tipos de Errores:**
1. **API Key Faltante:** Usar Fallback 1 (Enhanced Regex)
2. **Timeout/Error de Red:** Reintentar 1 vez, luego Fallback 1
3. **Rate Limit:** Esperar y reintentar, o usar Fallback 1
4. **JSON Inválido:** Usar Fallback 2 (Basic Keyword Match)
5. **Intent No Reconocido:** Pedir clarificación al usuario

**Logging:**
```markdown
## REGISTRAR TODOS LOS FALLBACKS
- Timestamp del error
- Mensaje original del usuario
- Tipo de fallback activado
- Resultado del fallback
- Confianza del intent final

Esto permite análisis posterior y mejora del sistema
```

---

## 5. MANEJO DE IDIOMA (CRÍTICO)

### 5.1 Política de Idioma para Consultas

**Idioma por Defecto:**
```markdown
## ChatLanguage Default: 'en'
- Para clientes en Canadá, el idioma predeterminado es INGLÉS
- Todas las búsquedas en DB deben usar términos en inglés
- Nombres de productos: "Tomato", "Avocado", "Broccoli"
- Nombres de clientes: "Walmart", "Superstore", "Loblaws"
```

---

### 5.2 Detección de Idioma de Input

**Lógica de Detección:**
```markdown
## DETECTAR IDIOMA DEL USUARIO
1. Analizar primeras 50 palabras del mensaje
2. Identificar palabras clave en español vs. inglés
3. Si >60% de palabras son español → userLanguage = 'es'
4. Si >60% de palabras son inglés → userLanguage = 'en'
5. Si mixto (40-60%) → detectar idioma dominante o preguntar

## PALABRAS CLAVE PARA DETECCIÓN

Español:
- Qué, cuál, cómo, cuánto, dónde, cuándo
- Precio, costo, proveedor, factura, cliente, saldo
- Quiero, necesito, tengo, mostrar

Inglés:
- What, which, how, where, when
- Price, cost, supplier, invoice, customer, balance
- Want, need, have, show
```

---

### 5.3 Estrategia de Búsqueda en DB

**REGLA FUNDAMENTAL:**
```markdown
## SIEMPRE BUSCAR EN INGLÉS
- Los datos en DB están en inglés
- NUNCA traducir términos de búsqueda antes de consultar DB
- Si usuario busca en español, buscar en inglés y traducir SOLO la respuesta

## EJEMPLO CORRECTO:
Usuario: "¿Cuál es el precio del tomate?"
Detección: Español
Traducción del searchTerm: "tomate" → "tomato" (o mantener "tomato")
Búsqueda DB: buscar productos con "tomato"
Respuesta en español: "El precio del tomate es..."

## EJEMPLO INCORRECTO:
Usuario: "price of tomato"
Búsqueda: "precio del tomate" (WRONG - no encontrará nada)
```

---

### 5.4 Formato de Respuestas

**Inglés (Default):**
```markdown
## ESTRUCTURA
[Título claro y conciso]
[Información principal - bullet points o short sentences]
[Detalles adicionales si relevantes]
[Opciones de seguimiento si aplica]

## EJEMPLO:
**Price: Tomato Saladette**

- **Supplier:** Agricultural San Juan
- **Cost Price:** $25.50/kg
- **Sell Price:** $35.00/kg
- **Currency:** CAD

Would you like to see other suppliers or more product details?
```

**Español (Opcional):**
```markdown
## ESTRUCTURA
[Título claro y conciso]
[Información principal - bullet points o frases cortas]
[Detalles adicionales si relevantes]
[Opciones de seguimiento si aplica]

## EJEMPLO:
**Precio: Tomate Saladette**

- **Proveedor:** Agricultural San Juan
- **Precio de Costo:** $25.50/kg
- **Precio de Venta:** $35.00/kg
- **Moneda:** CAD

¿Te gustaría ver otros proveedores o más detalles del producto?
```

---

### 5.5 Transición de Idioma

**Reglas para Cambio de Idioma:**
```markdown
## DURANTE CONVERSACIÓN
- Mantener idioma detectado inicialmente
- Si usuario cambia explícitamente de idioma, adaptar
- No forzar traducción automática
- Permitir usuario especificar idioma: "en español por favor"

## EJEMPLO DE TRANSICIÓN:
Usuario 1: "What's the price of tomato?"
Bot 1: [Response in English]
Usuario 2: "¿Y en español?"
Bot 2: "Claro, el precio del tomate es..." [Response in Spanish]
Usuario 3: "Show me avocado price"
Bot 3: [Response in English - switched back to default]
```

---

## 6. VALIDACIÓN Y TESTING

### 6.1 Checklist de Validación de Prompts

Para cada prompt de intent, validar:

- [ ] **Claridad:** ¿La descripción es clara y específica?
- [ ] **Parámetros:** ¿Los parámetros requeridos/opcionales están bien definidos?
- [ ] **Ejemplos:** ¿Los ejemplos cubren casos edge?
- [ ] **Idioma:** ¿Maneja correctamente inglés y español?
- [ ] **Falls Back:** ¿Tiene estrategia de fallback?
- [ ] **No Inventa:** ¿La instrucción de no inventar datos está clara?
- [ ] **Concisión:** ¿Respuesta es directa y al punto?
- [ ] **Contexto:** ¿Mantiene contexto conversacional?
- [ ] **Seguridad:** ¿No expone información sensible?
- [ ] **Disambiguación:** ¿Pregunta cuando hay ambigüedad?

---

### 6.2 Testing A/B de Prompts

**Estrategia:**
```markdown
## TESTEAR VARIACIONES DE PROMPTS
1. Crear versión A y versión B de prompts similares
2. Routing 50% tráfico a cada versión
3. Medir métricas: precisión, satisfacción, tiempo
4. Seleccionar versión ganadora
5. Iterar continuamente

## MÉTRICAS
- Tasa de clasificación correcta
- Tiempo de respuesta
- Satisfacción del usuario (rating 1-5)
- Número de follow-up questions (menos = mejor)
- Fallback rate (menos = mejor)
```

---

## 7. REFERENCIAS Y BEST PRACTICES

### 7.1 Principios de Prompt Engineering para Chatbots

1. **Be Specific:** Más específico = mejor
2. **Give Context:** Proporcionar contexto relevante
3. **Use Examples:** Los ejemplos clarifican instrucciones
4. **Chain of Thought:** Para tareas complejas, pensar paso a paso
5. **Output Format:** Especificar formato exacto esperado
6. **Handle Edge Cases:** Considerar casos especiales
7. **Iterate:** Mejorar continuamente basado en feedback

### 7.2 Recursos Externos

- OpenAI Function Calling Documentation
- LangChain Prompt Templates
- Chatbot Design Best Practices (Microsoft Bot Framework)
- Conversational Design (Erika Hall)

---

**DOCUMENTO VERSION:** 1.0
**PRÓXIMA ACTUALIZACIÓN:** Post-Sprint 1 basado en resultados de testing