# CTO ACTION PLAN - HAGO PRODUCE CHATBOT
## Sprint de Consultas y Omnicanalidad

**Fecha:** Marzo 2026
**Versión:** 1.0
**Estatus:** Estratégico - Prioridad CRÍTICA

---

## 1. DIAGNÓSTICO DE BLOQUEADORES CRÍTICOS

### 1.1 El "Agujero Negro" de la Regex de Facturas

**Ubicación:** `src/lib/services/chat/intents.ts` (Línea ~189)

**Problema Detectado:**
```typescript
const invoiceNumberMatch = lower.match(/(factura\s*#?\s*|invoice\s*#?\s*)([a-z0-9-]+)/i);
```

**Análisis de Impacto:**
Esta expresión regular es excesivamente "hambrienta" (greedy) y captura secuencias inválidas. Cuando el usuario dice:
- Usuario: *"Quiero crear una factura nueva"*
- Regex captura: `"factura "` (Grupo 1) + `"nueva"` (Grupo 2)
- **Resultado:** El sistema interpreta esto como una búsqueda de factura número "nueva" en lugar de crear una factura nueva.

**Consecuencia:** Bloquea cualquier intento de crear facturas o hablar sobre ellas de forma natural, forzando a los usuarios a usar frases muy específicas y artificiales.

---

### 1.2 Ausencia de Function Calling en el Router Principal

**Ubicación:** `src/lib/services/chat/openai-client.ts` - Función `classifyChatIntentWithOpenAI`

**Problema Detectado:**
El router principal confía en que GPT-4o-mini obedezca un prompt de texto para devolver JSON estructurado:
```typescript
// Código actual - ENFOQUE FRÁGIL
const messages = [
  { role: 'system', content: buildIntentClassificationSystemPrompt(language) },
  { role: 'user', content: message }
];
// Sin 'tools' ni 'tool_choice'
```

**Análisis de Impacto:**
- **Alta tasa de fallo:** Si el modelo "alucina" o añade texto antes/después del JSON, `JSON.parse()` falla.
- **Latencia incrementada:** El modelo debe inferir el esquema JSON sin validación estructurada.
- **Inconsistencia:** Las respuestas pueden variar en formato, dificultando el parsing.

**Por qué esto es un problema:**
Los handlers individuales (como `create_invoice`) SÍ usan `tools` internamente, pero el "cerebro" que decide QUÉ handler ejecutar NO usa esta funcionalidad más confiable de OpenAI.

---

### 1.3 Orden de Evaluación Invertido: Tontas sobre Inteligente

**Ubicación:** `src/lib/services/chat/intents.ts` - Función `analyzeIntent`

**Problema Detectado:**
```typescript
// ORDEN ACTUAL (INCORRECTO):
if (isInvoiceStatus) { 
  return { intent: 'invoice_status', ... };  // ← Retorna INMEDIATAMENTE
}
// ...
const aiDetected = await classifyChatIntentWithOpenAI(...);  // ← NUNCA SE EJECUTA
```

**Análisis de Impacto:**
- **Inteligencia desperdiciada:** La IA (OpenAI) nunca tiene oportunidad de corregir errores de las regex.
- **Priorización equivocada:** El sistema prioriza coincidencias superficiales (palabras clave) sobre comprensión semántica.
- **Experiencia de usuario pobre:** Frases naturales malinterpretadas por regex simples nunca alcanzan al modelo más inteligente.

**Analogía:** Es como tener un experto humano (OpenAI) disponible pero primero pedirle a un robot simple (regex) que interprete el mensaje, y si el robot responde (aunque erróneamente), el experto nunca es consultado.

---

### 1.4 Manejo Incorrecto del Idioma

**Problema Detectado:**
Aunque la variable de entorno indica que el cliente está en Canadá y toda la información está en inglés:
- Productos en DB: nombres en inglés (`"Tomato Saladette"`, `"Avocado Hass"`)
- Precios, facturas, clientes: información en inglés
- Nombres de campos en DB: inglés

**Sin embargo:**
- El sistema está configurado para traducir automáticamente al español
- `ChatLanguage` default es `'es'`
- Muchos prompts y respuestas están en español

**Consecuencia:**
- **Búsquedas fallidas:** Si el usuario busca en inglés y el sistema intenta traducir, puede no encontrar productos.
- **Inconsistencia:** El bot responde en español pero muestra datos en inglés.
- **Contexto canadiense:** Para un cliente en Canadá, la interacción debe ser primariamente en inglés, con español opcional.

---

## 2. HOJA DE RUTA SPRINT 1 (CONSULTAS)

### 2.1 Priorización de los 7 Intents de Consulta

**Orden de Implementación (basado en frecuencia de uso + impacto en UX):**

| Prioridad | Intent | Rationale | Complejidad |
|:---:|:---|:---|:---:|
| **1** | `product_info` | ESPECIAL FOCO: Base fundamental para consultas de productos | Media |
| **2** | `best_supplier` | ESPECIAL FOCO: Decisiones de compra críticas | Media |
| **3** | `price_lookup` | Consulta más frecuente, ya implementada | Baja |
| **4** | `invoice_status` | Consulta de facturas esencial | Alta |
| **5** | `customer_balance` | Consulta financiera importante | Media |
| **6** | `inventory_summary` | Catálogo general, útil pero menos crítico | Baja |
| **7** | `overdue_invoices` | Específico para cobranza | Alta |

**NOTA ESPECIAL:** Los intents `product_info` y `best_supplier` requieren atención prioritaria porque son fundamentales para las decisiones de negocio y actualmente tienen problemas de extracción de entidades.

---

### 2.2 Estrategia Omnicanal: Persistencia de SessionId

**Objetivo:** Asegurar que `sessionId` persista correctamente en WhatsApp, Telegram y Web para mantener contexto conversacional.

**Arquitectura Actual (Web):**
```typescript
// src/app/api/chat/route.ts
const currentSessionId = sessionId || crypto.randomUUID();
let session = await prisma.chatSession.findUnique({
  where: { sessionId: currentSessionId }
});
```

**Estrategia para WhatsApp/Telegram:**

#### A. Identificación de Usuario por Número/ID
```markdown
1. **WhatsApp:**
   - Identificador: `from.number` (formato: +1234567890)
   - Mapeo: Crear `sessionId` basado en número de teléfono
   - Formato: `whatsapp_{normalizedPhone}`

2. **Telegram:**
   - Identificador: `message.chat.id` (número entero)
   - Mapeo: Crear `sessionId` basado en chat ID
   - Formato: `telegram_{chatId}`
```

#### B. Gestión de SessionId en Integradores
```markdown
1. **Middleware de Integración:**
   - Crear middleware en integradores WhatsApp/Telegram
   - Extraer userId del mensaje entrante
   - Generar/Recuperar sessionId con formato {platform}_{userId}
   - Pasar sessionId al API endpoint /api/chat

2. **Almacenamiento Persistente:**
   - SessionId debe mantenerse en DB (ChatSession)
   - No depender de cookies/sesiones HTTP (no existen en WhatsApp/Telegram)

3. **Mapeo de Usuario a Cliente:**
   - Para UX omnicanal, mapear phoneNumber → customerId
   - Permitir que el bot reconozca clientes independientemente del canal
```

#### C. Validación de Contexto
```markdown
- Implementar verificación de sessionId antes de cada mensaje
- Si sessionId no existe, crear nueva ChatSession
- Mantener `pendingOrder`, `pendingInvoice` en contexto JSONB
- Limpiar contexto después de confirmar/cancelar acciones
```

---

### 2.3 Matriz de Responsabilidad de Archivos

| Archivo | Rol en Solución | Cambios Requeridos | Prioridad |
|:---|:---|:---|:---:|
| `src/lib/services/chat/intents.ts` | **ROTOR PRINCIPAL** - Analiza y enruta intents | Eliminar regex agresiva, invertir orden (OpenAI primero), ajustar idioma | **ALTA** |
| `src/lib/services/chat/openai-client.ts` | **CEREBRO NLU** - Clasificación OpenAI | Implementar `tools`/`function_calling`, reescribir system prompt | **ALTA** |
| `src/app/api/chat/route.ts` | **ORQUESTADOR API** - Maneja sesión y respuesta | Validar sessionId omnicanal, ajustar language default | **MEDIA** |
| `src/lib/services/chat/query-executor.ts` | **DISPATCHER** - Ejecuta handlers específicos | Revisar orden de ejecución, validar parámetros | **BAJA** |
| `src/lib/services/chat/intents/product-info.ts` | Handler: Info de productos | Mejorar extracción de searchTerm, manejo de inactivos | **MEDIA** |
| `src/lib/services/chat/intents/best-supplier.ts` | Handler: Mejor proveedor | Validar límites, ordenamiento, sugerencias | **MEDIA** |
| `src/lib/services/chat/intents/price-lookup.ts` | Handler: Consulta de precios | Ya está bien implementado, revisar idioma | **BAJA** |
| `src/lib/services/chat/intents/invoice-status.ts` | Handler: Estado de facturas | Ajustar para soportar creación de facturas | **MEDIA** |
| `src/lib/services/chat/intents/customer-balance.ts` | Handler: Saldo de clientes | Validar queries, manejo de múltiples clientes | **MEDIA** |
| `src/lib/services/chat/intents/inventory-summary.ts` | Handler: Resumen inventario | Revisar agrupación por categoría | **BAJA** |
| `src/lib/services/chat/intents/overdue-invoices.ts` | Handler: Facturas vencidas | Validar filtros de días vencidos | **MEDIA** |

**Leyenda de Prioridad:**
- **ALTA:** Bloqueadores críticos que deben resolverse en Sprint 1
- **MEDIA:** Mejoras importantes pero no bloquean funcionalidad
- **BAJA:** Optimizaciones o validaciones secundarias

---

## 3. ESTRATEGIA DE IMPLEMENTACIÓN

### 3.1 Fase 1: Desbloqueo Crítico (Días 1-3)

**Objetivo:** Resolver los 3 bloqueadores principales que impiden el funcionamiento básico.

1. **Eliminar Regex de Facturas** (Bloqueador #1)
   - Eliminar línea agresiva en `intents.ts`
   - Dejar que OpenAI maneje todas las consultas de facturas
   - Validar con tests unitarios

2. **Implementar Function Calling** (Bloqueador #2)
   - Refactorizar `classifyChatIntentWithOpenAI`
   - Definir tools para cada intent
   - Migrar de system prompt JSON a tools estructuradas

3. **Invertir Orden de Detección** (Bloqueador #3)
   - Llamar a OpenAI PRIMERO para clasificación
   - Usar regex solo para extraer datos específicos DENTRO de handlers
   - Implementar fallback si OpenAI falla

### 3.2 Fase 2: Optimización de Consultas (Días 4-7)

**Objetivo:** Mejorar precisión de los 7 intents de consulta.

1. **Mejorar `product_info` y `best_supplier`**
   - Ajustar prompts de extracción
   - Validar limpieza de searchTerm
   - Implementar sugerencias fuzzy

2. **Corregir Manejo de Idioma**
   - Cambiar `ChatLanguage` default a `'en'`
   - Mantener español como opción explícita
   - Ajustar prompts para manejar bilingüismo

3. **Validar Intents de Facturas**
   - Separar claramente `invoice_status` de `create_invoice`
   - Implementar prompts de confirmación
   - Validar parámetros de extracción

### 3.3 Fase 3: Omnicanalidad (Días 8-10)

**Objetivo:** Integrar WhatsApp y Telegram con persistencia de sesión.

1. **Implementar Middleware de Integración**
   - Crear extractor de userId para WhatsApp
   - Crear extractor de userId para Telegram
   - Mapear a sessionId con formato {platform}_{userId}

2. **Validar Persistencia de Contexto**
   - Probar flujos multi-turno en WhatsApp
   - Probar flujos multi-turno en Telegram
   - Asegurar limpieza de contexto correcta

3. **Testing End-to-End**
   - Crear suite de tests E2E
   - Validar persistencia de sesión
   - Probar límites de rate limiting

---

## 4. MÉTRICAS DE ÉXITO

### 4.1 Métricas Técnicas

| Métrica | Objetivo | Cómo Medir |
|:---|:---:|:---|
| **Tasa de Clasificación Correcta** | > 95% | Tests unitarios de intents vs. mensajes reales |
| **Latencia Promedio** | < 2s | Logs de timestamp en API |
| **Fallback Rate** | < 5% | Contador de llamadas a fallback en logs |
| **Sesión Persistente** | 100% | Tests de multi-turno en todos los canales |

### 4.2 Métricas de Usuario

| Métrica | Objetivo | Cómo Medir |
|:---|:---:|:---|
| **Satisfacción de Usuario** | > 4/5 | Encuestas post-interacción |
| **Consultas Exitosas** | > 90% | Tracking de ejecuciones exitosas vs. errores |
| **Tiempo hasta Primera Respuesta** | < 1.5s | Métricas de tiempo de respuesta |

---

## 5. RIESGOS Y MITIGACIÓN

### 5.1 Riesgos Identificados

| Riesgo | Impacto | Probabilidad | Mitigación |
|:---|:---:|:---:|:---|
| **OpenAI API falla** | Alto | Medio | Implementar fallback a regex mejoradas |
| **Costo de API aumenta** | Medio | Bajo | Cacheo de respuestas comunes, tuning de prompts |
| **Usuarios confundidos por cambio de idioma** | Alto | Bajo | Comunicación clara, período de transición |
| **Integración WhatsApp/Telegram compleja** | Medio | Alto | Documentación exhaustiva, pruebas tempranas |

### 5.2 Plan de Contingencia

1. **Si OpenAI falla:**
   - Activar modo "básico" con regex mejoradas
   - Notificar a usuarios de funcionalidad limitada
   - Registrar incidente para análisis

2. **Si persistencia de sesión falla:**
   - Implementar cookie-based fallback para Web
   - Crear mecanismo de "recovery" basado en userId
   - Logging agresivo para debugging

3. **Si costo excede presupuesto:**
   - Implementar rate limiting más agresivo
   - Mover a modelo más barato (gpt-3.5-turbo)
   - Cacheo agresivo de consultas repetidas

---

## 6. PRÓXIMOS PASOS INMEDIATOS

1. **HOY:** Reunión con equipo de desarrollo para priorización
2. **MAÑANA:** Comenzar eliminación de regex agresiva (Bloqueador #1)
3. **Día 3:** Implementar function calling (Bloqueador #2)
4. **Día 4:** Invertir orden de detección (Bloqueador #3)
5. **Día 5:** Validar con tests unitarios
6. **Día 7:** Deploy a staging
7. **Día 10:** Deploy a producción (si tests pasan)

---

**FIRMADO POR:** CTO - HAGO PRODUCE
**REVISADO POR:** Equipo de Desarrollo
**APROBADO POR:** Stakeholders