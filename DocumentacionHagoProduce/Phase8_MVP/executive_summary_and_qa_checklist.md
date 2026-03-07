# RESUMEN EJECUTIVO Y CHECKLIST DE QA
## HAGO PRODUCE CHATBOT - Sprint de Consultas y Omnicanalidad

**Fecha:** Marzo 2026
**Versión:** 1.0

---

## 1. RESUMEN EJECUTIVO

### Cómo Estos Documentos Habilitan la Omnicanalidad y Precisión del Bot

Los tres documentos estratégicos generados—CTO Action Plan, Prompting Strategy, y Sequential Prompts—constituyen una base integral de "Verdad Absoluta" para transformar el chatbot de HAGO PRODUCE de un sistema con funcionalidad percibida del 10% a su potencial completo del 80%+. El diagnóstico reveló que el 100% de las intenciones están implementadas a nivel de código, pero un NLU defectuoso basado en regex agresivas y la ausencia de Function Calling bloqueaban el acceso a esta funcionalidad. La solución propuesta invierte el paradigma: priorizar la inteligencia de OpenAI sobre reglas rígidas, implementar tools estructuradas para clasificación confiable, y establecer un manejo de idioma que respete el contexto canadiense (inglés primario). La estrategia omnicanal se logra mediante la persistencia de sessionId basada en identificadores de plataforma (WhatsApp: `whatsapp_{phone}`, Telegram: `telegram_{chatId}`), permitiendo que el contexto conversacional fluya sin interrupciones entre canales. Los prompts secuenciales proporcionan instrucciones precisas para cada intent de consulta, eliminando ambigüedades y estableciendo reglas claras de disambiguación, fallback y formato de respuesta. Esta documentación servirá como la "biblia" de contexto para cualquier LLM de implementación, asegurando consistencia, trazabilidad y calidad en la ejecución del Sprint 1.

---

## 2. CHECKLIST DE QA - SPRINT 1 CONSULTAS

### 10 Puntos Críticos de Validación

#### ✅ QA-01: Clasificación de Intent Correcta
**Validación:** El sistema clasifica correctamente los 7 intents de consulta con confianza > 0.85.

| Mensaje de Prueba | Intent Esperado | Confianza Mínima |
|:---|:---|:---:|
| "What's the price of tomato?" | price_lookup | > 0.90 |
| "Who sells avocado?" | best_supplier | > 0.90 |
| "Tell me about broccoli" | product_info | > 0.90 |
| "Status of invoice 1024" | invoice_status | > 0.90 |
| "How much does Walmart owe?" | customer_balance | > 0.90 |
| "What fruits do you have?" | inventory_summary | > 0.90 |
| "Overdue invoices for Walmart" | overdue_invoices | > 0.90 |

**Estado:** [ ] PASS / [ ] FAIL

---

#### ✅ QA-02: La Palabra "para" NO Dispara Búsqueda de Factura
**Validación:** La regex de facturas NO captura palabras comunes como "para", "nueva", "quiero" como números de factura.

| Mensaje de Prueba | Resultado Esperado |
|:---|:---|
| "Quiero crear una factura nueva" | Intent: create_invoice (NO invoice_status) |
| "Necesito una factura para mi cliente" | Intent: create_invoice (NO invoice_status buscando "para") |
| "Factura para Walmart" | Intent: create_invoice (NO invoice_status buscando "para") |

**Estado:** [ ] PASS / [ ] FAIL

---

#### ✅ QA-03: Extracción de Producto en Inglés
**Validación:** El sistema extrae nombres de productos en inglés, incluso si el usuario escribe en español.

| Mensaje de Prueba | searchTerm Esperado |
|:---|:---|
| "What's the price of tomato?" | "tomato" |
| "¿Cuál es el precio del tomate?" | "tomato" (NO "tomate") |
| "Cost of avocado" | "avocado" |
| "¿Cuánto cuesta el aguacate?" | "avocado" (NO "aguacate") |

**Estado:** [ ] PASS / [ ] FAIL

---

#### ✅ QA-04: Distinción entre Intents Similares
**Validación:** El sistema distingue correctamente entre intents que comparten palabras clave.

| Escenario | Mensaje | Intent Esperado | Razón |
|:---|:---|:---|:---|
| Precio vs Compra | "I want to buy tomato" | create_order | "buy" indica transacción |
| Precio vs Compra | "What's the price of tomato?" | price_lookup | "price" indica consulta |
| Saldo vs Facturas | "How much does Walmart owe?" | customer_balance | Pregunta por AGGREGATE |
| Saldo vs Facturas | "Show me Walmart's invoices" | invoice_status | Pide LISTA de documentos |
| Saldo vs Vencidas | "Overdue invoices for Walmart" | overdue_invoices | Palabra "overdue" = URGENCIA |
| Producto vs Lista | "Info about tomato" | product_info | DETALLE de UN producto |
| Producto vs Lista | "Show me tomatoes" | inventory_summary | LISTA de productos |

**Estado:** [ ] PASS / [ ] FAIL

---

#### ✅ QA-05: Manejo de Ambigüedad
**Validación:** El sistema pregunta por clarificación cuando faltan parámetros obligatorios.

| Mensaje de Prueba | Respuesta Esperada |
|:---|:---|
| "What's the price?" | Pregunta: "Which product are you asking about?" |
| "Show invoices" | Pregunta: "Which customer's invoices?" |
| "Balance" | Pregunta: "For which customer, or global summary?" |

**Estado:** [ ] PASS / [ ] FAIL

---

#### ✅ QA-06: Fallback NO es price_lookup Automático
**Validación:** Cuando el sistema no puede clasificar el intent, NO asume automáticamente price_lookup.

| Escenario | Comportamiento Esperado |
|:---|:---|
| OpenAI API falla | Usar enhanced regex O preguntar clarificación |
| Intent no reconocido | Preguntar "Could you please rephrase?" |
| Mensaje ambiguo | Ofrecer opciones: "Are you asking about price, product info, or something else?" |

**Estado:** [ ] PASS / [ ] FAIL

---

#### ✅ QA-07: Persistencia de SessionId Omnicanal
**Validación:** El sessionId persiste correctamente en Web, WhatsApp, y Telegram.

| Canal | Identificador | Formato SessionId |
|:---|:---|:---|
| Web | Cookie o generado | UUID estándar |
| WhatsApp | +1234567890 | whatsapp_1234567890 |
| Telegram | 987654321 | telegram_987654321 |

**Prueba:**
1. Iniciar conversación en Web con sessionId X
2. Enviar mensaje "What's the price of tomato?"
3. Verificar que el contexto se mantiene
4. Simular envío desde WhatsApp con mismo userId
5. Verificar que el contexto persiste entre canales

**Estado:** [ ] PASS / [ ] FAIL

---

#### ✅ QA-08: Respuestas en Idioma Correcto
**Validación:** El sistema responde en el idioma del usuario, con datos en inglés.

| Mensaje de Prueba | Idioma Respuesta | Nombre Producto en Respuesta |
|:---|:---|:---|
| "What's the price of tomato?" | Inglés | "Tomato" |
| "¿Cuál es el precio del tomate?" | Español | "Tomato" (NO "Tomate") |
| "Price of avocado" | Inglés | "Avocado" |
| "Precio del aguacate" | Español | "Avocado" (NO "Aguacate") |

**Estado:** [ ] PASS / [ ] FAIL

---

#### ✅ QA-09: Contexto Conversacional Mantenido
**Validación:** El sistema mantiene contexto durante conversación multi-turno.

**Prueba de Flujo:**
1. Usuario: "What's the price of tomato?" → Bot responde con precio
2. Usuario: "And who sells it?" → Bot entiende "it" = "tomato"
3. Usuario: "I want to order 5 boxes" → Bot asocia con "tomato"

| Paso | Mensaje | Contexto Esperado |
|:---:|:---|:---|
| 1 | "What's the price of tomato?" | productContext: "tomato" |
| 2 | "And who sells it?" | Usa productContext = "tomato" |
| 3 | "I want to order 5 boxes" | pendingOrder.productName = "tomato" |

**Estado:** [ ] PASS / [ ] FAIL

---

#### ✅ QA-10: Formato de Respuesta Consistente
**Validación:** Las respuestas siguen un formato consistente y legible.

**Formato Esperado para price_lookup:**
```markdown
**Price: {productName}**

- **Supplier:** {supplierName}
- **Cost Price:** {costPrice} {currency}
- **Sell Price:** {sellPrice} {currency}
- **Currency:** {currency}

Would you like to see other suppliers or more product details?
```

**Formato Esperado para best_supplier:**
```markdown
**Best Suppliers for {productName}:**

| Rank | Supplier | Cost Price | Currency |
|------|----------|------------|----------|
| 1 | {supplier1} | {price1} | {currency} |
| 2 | {supplier2} | {price2} | {currency} |
...

The cheapest option is **{supplier1}** at **{price1}** {currency}.
```

**Criterios de Validación:**
- [ ] Título claro con entidad principal
- [ ] Información en formato legible (bullets o tabla)
- [ ] Moneda visible (CAD para clientes canadienses)
- [ ] Sugerencia de seguimiento opcional

**Estado:** [ ] PASS / [ ] FAIL

---

## 3. RESULTADO FINAL DE QA

| QA # | Descripción | Estado |
|:---:|:---|:---:|
| QA-01 | Clasificación de Intent Correcta | [ ] PASS / [ ] FAIL |
| QA-02 | "para" NO Dispara Factura | [ ] PASS / [ ] FAIL |
| QA-03 | Extracción de Producto en Inglés | [ ] PASS / [ ] FAIL |
| QA-04 | Distinción entre Intents Similares | [ ] PASS / [ ] FAIL |
| QA-05 | Manejo de Ambigüedad | [ ] PASS / [ ] FAIL |
| QA-06 | Fallback NO es price_lookup | [ ] PASS / [ ] FAIL |
| QA-07 | Persistencia SessionId Omnicanal | [ ] PASS / [ ] FAIL |
| QA-08 | Respuestas en Idioma Correcto | [ ] PASS / [ ] FAIL |
| QA-09 | Contexto Conversacional Mantenido | [ ] PASS / [ ] FAIL |
| QA-10 | Formato de Respuesta Consistente | [ ] PASS / [ ] FAIL |

**Resultado Final:** ___ / 10 tests passing

**Criterio de Aprobación del Sprint:**
- **Mínimo:** 8/10 tests PASS (80%)
- **Óptimo:** 10/10 tests PASS (100%)

---

## 4. PRÓXIMOS PASOS POST-QA

### Si Todos los Tests PASS:
1. Deploy a staging para pruebas adicionales
2. Documentar métricas de rendimiento
3. Preparar demo para stakeholders
4. Planificar Sprint 2 (Intents Transaccionales)

### Si Algunos Tests FALLAN:
1. Documentar fallos específicos
2. Analizar logs y traces
3. Ajustar prompts según sea necesario
4. Repetir tests hasta alcanzar 80% mínimo
5. No pasar a producción hasta criterio de aprobación

---

## 5. MÉTRICAS DE ÉXITO POST-IMPLEMENTACIÓN

| Métrica | Objetivo | Medición |
|:---|:---:|:---|
| **Tasa de Clasificación Correcta** | > 95% | Tests automatizados |
| **Latencia Promedio** | < 2s | Logs de API |
| **Fallback Rate** | < 5% | Contador de fallbacks |
| **Satisfacción de Usuario** | > 4/5 | Encuestas |
| **Tiempo hasta Primera Respuesta** | < 1.5s | Métricas de respuesta |
| **Persistencia de Sesión** | 100% | Tests de multi-turno |

---

**DOCUMENTO VERSION:** 1.0
**FECHA DE VALIDACIÓN:** ___/___/______
**VALIDADO POR:** ____________________
**FIRMA CTO:** ____________________