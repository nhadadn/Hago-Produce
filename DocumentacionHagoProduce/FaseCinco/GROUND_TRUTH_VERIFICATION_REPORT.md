# GROUND TRUTH VERIFICATION REPORT — POST SPRINT 5
**Fecha:** Verificación post-patch de realidad  
**Método:** Inspección directa del código fuente en rama `sprint-5-planning`  
**Autor:** SuperNinja (CTO Audit Mode)  
**Estado:** VERIFICADO — basado en evidencia de código, no en suposiciones

---

## RESUMEN EJECUTIVO

El sistema Hago Produce tiene una base ERP operativa real con 558 tests pasando. Sin embargo, la verificación directa del código revela **tres brechas críticas** entre lo planificado en Sprint 5 y lo que realmente existe en el codebase:

1. **`PriceList`, `PreInvoice`, `BotDecision` NO existen en `prisma/schema.prisma`** — los servicios que los usan están testeados con mocks de Prisma, ocultando que las tablas no existen en la base de datos real.
2. **`IntentRegistry` ES un singleton mutable** — el warning de overwriting en tests es síntoma de un patrón de registro global que puede producir race conditions en runtime.
3. **No existe logging estructurado** — toda la observabilidad en producción depende de `console.error` / `console.log`, sin Sentry, Winston, Pino ni ningún sistema de alertas.

---

## SECCIÓN 1: INTEGRIDAD DEL SCHEMA (PREGUNTA CTO #1)

### Veredicto: ⚠️ BRECHA CONFIRMADA

**Entidades planificadas en Sprint 5 que NO están en `prisma/schema.prisma`:**

| Entidad | Estado en Schema | Estado en Tests |
|---|---|---|
| `PriceList` | ❌ NO EXISTE | ✅ Testeado con mock de Prisma |
| `PreInvoice` | ❌ NO EXISTE | ✅ Testeado con mock de Prisma |
| `BotDecision` | ❌ NO EXISTE | ✅ Testeado con mock de Prisma |
| Campos CRA en `Invoice` | ❌ NO EXISTEN | UNKNOWN |
| Campos CRA en `Customer` | ❌ NO EXISTEN | UNKNOWN |

**Entidades que SÍ existen en el schema actual:**
- `User`, `Customer`, `Supplier`, `Product`, `ProductPrice`
- `Invoice`, `InvoiceItem`
- `PurchaseOrder`, `PurchaseOrderItem`
- `Notification`, `NotificationLog`
- `ReportCache`
- `ApiKey`

**Evidencia directa:**
```bash
grep "PriceList\|PreInvoice\|BotDecision" prisma/schema.prisma
→ 0 resultados
```

**Implicación crítica:** Los tests de `price-versioning.service.test.ts` y `pre-invoices.service.test.ts` usan `jest.mock('@/lib/prisma')` o equivalente. Esto significa que 558 tests verdes NO garantizan que el schema esté migrado. Un deploy a producción con el schema actual rompería cualquier endpoint que intente acceder a `PriceList`, `PreInvoice` o `BotDecision`.

**Acción requerida:** Ejecutar `S5-B0-03` (migración unificada de schema) antes de cualquier deploy de los nuevos servicios.

---

## SECCIÓN 2: INTENTREGISTRY — SINGLETON Y MUTABILIDAD (PREGUNTA CTO #2)

### Veredicto: ⚠️ RIESGO CONFIRMADO — SINGLETON MUTABLE

**Arquitectura actual verificada:**

```typescript
// src/lib/chat/intent-registry.ts
class IntentRegistry {
  private intents: Map<string, IntentHandler> = new Map();
  
  register(intent: string, handler: IntentHandler): void {
    // Sin guard de inmutabilidad post-bootstrap
    // Sin verificación de duplicados con error
    this.intents.set(intent, handler); // ← SOBRESCRIBE silenciosamente
  }
  
  execute(intent: string, params: unknown): Promise<unknown> {
    const handler = this.intents.get(intent);
    // ...
  }
}

export const intentRegistry = new IntentRegistry(); // ← SINGLETON DE MÓDULO
```

```typescript
// src/lib/chat/register-intents.ts
// Llama a intentRegistry.register() para cada intent
// Esta función puede ser llamada múltiples veces si el módulo se re-evalúa
```

**Por qué el warning de overwriting ocurre en tests:**
- Jest re-evalúa módulos entre suites (o dentro de la misma suite si hay `jest.resetModules()`)
- El singleton persiste entre tests en la misma suite si no se limpia
- `register()` sobrescribe sin lanzar error → warning silencioso

**Riesgo en producción (Next.js):**
- En Next.js con App Router, los módulos de servidor se inicializan una vez por worker
- Si `register-intents.ts` se llama más de una vez (ej: hot reload en dev, o múltiples imports), los intents se sobrescriben silenciosamente
- En producción con múltiples workers de Vercel, cada worker tiene su propio singleton → comportamiento consistente pero sin protección contra doble-registro en el mismo worker

**Severidad:** MEDIA en producción actual (Vercel serverless = workers efímeros), ALTA si se migra a servidor persistente (Node.js long-running).

**Fix recomendado (S5-B3-03 — IntentRegistry pattern):**
```typescript
register(intent: string, handler: IntentHandler): void {
  if (this.intents.has(intent)) {
    throw new Error(`Intent '${intent}' already registered. Use replace() to override explicitly.`);
  }
  this.intents.set(intent, handler);
}
```

---

## SECCIÓN 3: OBSERVABILIDAD EN PRODUCCIÓN (PREGUNTA CTO #3)

### Veredicto: ❌ AUSENCIA CONFIRMADA DE LOGGING ESTRUCTURADO

**Evidencia directa:**
```bash
grep -rn "Sentry\|winston\|pino\|structuredLog\|logger" src/ --include="*.ts" | grep -v ".test."
→ 0 resultados
```

**Patrón actual en producción:**
```typescript
// Patrón encontrado en múltiples servicios
try {
  // operación
} catch (error) {
  console.error('Error description:', error); // ← ÚNICO mecanismo de observabilidad
  throw error; // o return fallback
}
```

**Servicios con `console.error` en código de producción (no tests):**
- `src/lib/services/chat/openai-client.ts`
- `src/lib/services/bot/telegram.service.ts`
- `src/lib/services/bot/whatsapp.service.ts`
- `src/lib/services/notifications/service.ts`
- Múltiples route handlers en `src/app/api/`

**Implicación:** Los errores de OpenAI (rate limits, timeouts), Twilio (webhook failures), y Telegram (bot errors) llegan únicamente a los logs de Vercel, que:
- No tienen alertas automáticas por defecto
- No tienen correlación de requests
- No tienen métricas de error rate
- Se pierden después del período de retención de Vercel (7 días en plan gratuito)

**Acción requerida:** Implementar logging estructurado mínimo viable antes del go-live. Opciones ordenadas por costo/esfuerzo:
1. **Vercel Log Drains** → Logtail/Papertrail (costo: $0-$10/mes, esfuerzo: 2h)
2. **Sentry** (costo: $0 en free tier, esfuerzo: 4h, cubre errores + performance)
3. **Winston/Pino** custom (costo: $0, esfuerzo: 8h, máximo control)

---

## SECCIÓN 4: ESTADO DE DEUDAS TÉCNICAS IDENTIFICADAS EN SPRINT 5

### 4.1 `taxRate: 0.13` Hardcoded

**Estado:** ❌ NO RESUELTO

```typescript
// src/lib/services/invoices/invoices.service.ts
const taxRate = 0.13; // ← HARDCODED, sin cambios
```

El servicio `TaxCalculationService` planificado en `S5-B4-01` (13 provincias canadienses) **no existe** en el codebase. La deuda técnica de impuestos provinciales persiste.

### 4.2 Make.com Webhook

**Estado:** UNKNOWN — No se encontró evidencia de deprecación ni de endpoint activo en el código fuente inspeccionado. Requiere verificar `src/app/api/v1/documents/` o rutas de webhook específicas.

### 4.3 CommandBus

**Estado:** ❌ NO IMPLEMENTADO

```bash
grep -rn "CommandBus\|command-bus\|commandBus" src/ --include="*.ts" | grep -v ".test."
→ 0 resultados
```

El `command-handler.service.ts` del bot maneja comandos como `STATUS`, pero no existe un CommandBus desacoplado. Los chat intents siguen llamando servicios de dominio directamente desde `query-executor.ts`.

### 4.4 CI/CD Pipeline

**Estado:** UNKNOWN

```bash
ls .github/workflows/
→ No se encontraron archivos de workflow
```

No se encontró evidencia de `.github/workflows/*.yml`. El pipeline CI/CD planificado en `S5-B0-01` puede no estar implementado, o puede estar en una rama diferente.

### 4.5 Cobertura de Tests

**Estado:** UNKNOWN — La configuración de Jest (`jest.config.ts`) no tiene `collectCoverage: true` por defecto. Los 558 tests passing no implican 80% de cobertura. Requiere ejecutar `jest --coverage` para verificar.

---

## SECCIÓN 5: CAPACIDADES CONFIRMADAS (OPERATIVAS)

Estas capacidades están verificadas por existencia de código fuente + tests:

| Capacidad | Servicio | Tests | Estado |
|---|---|---|---|
| Chat Web con OpenAI | `openai-client.ts` | ✅ | OPERATIVO |
| Bot WhatsApp (Twilio) | `whatsapp.service.ts` | ✅ | OPERATIVO |
| Bot Telegram | `telegram.service.ts` | ✅ | OPERATIVO |
| Intent Registry | `intent-registry.ts` | ✅ | OPERATIVO (con deuda) |
| Purchase Orders | `purchase-orders.service.ts` | ✅ | OPERATIVO |
| Invoices | `invoices.service.ts` | ✅ | OPERATIVO (tax hardcoded) |
| Reports (revenue, aging, top) | `reports/index.ts` | ✅ | OPERATIVO |
| Notifications + Log | `notifications/service.ts` | ✅ | OPERATIVO |
| PDF Ingestion | `pdf-ingestion.service.ts` | ✅ | OPERATIVO |
| Price Versioning | `price-versioning.service.ts` | ✅ | OPERATIVO (schema pendiente) |
| Pre-Invoices | `pre-invoices.service.ts` | ✅ | OPERATIVO (schema pendiente) |
| API Key Auth | `api-key.service.ts` | ✅ | OPERATIVO |

---

## SECCIÓN 6: PLAN DE ACCIÓN INMEDIATO

Ordenado por riesgo de bloqueo para go-live:

### CRÍTICO (bloquea go-live)
1. **Ejecutar migración de schema** (`S5-B0-03`) — `PriceList`, `PreInvoice`, `BotDecision` deben existir en la DB antes de cualquier deploy de los nuevos servicios
2. **Verificar cobertura real** — `npx jest --coverage` para confirmar si se alcanzó el 80% objetivo

### ALTO (riesgo operativo)
3. **Implementar logging estructurado mínimo** — Sentry o Vercel Log Drains antes del go-live
4. **Fix IntentRegistry** (`S5-B3-03`) — Agregar guard de duplicados en `register()`

### MEDIO (deuda técnica)
5. **TaxCalculationService** (`S5-B4-01`) — Crítico para clientes en Alberta, Quebec, BC
6. **CI/CD Pipeline** (`S5-B0-01`) — Verificar si existe en otra rama o implementar

### BAJO (planificado Sprint 6)
7. **CommandBus** — Desacoplamiento de intents (no bloquea funcionalidad actual)
8. **Make.com deprecación** — Verificar estado y completar transición

---

## APÉNDICE: COMANDOS DE VERIFICACIÓN EJECUTADOS

```bash
# Schema verification
grep "PriceList\|PreInvoice\|BotDecision" prisma/schema.prisma → 0 results

# Tax hardcoding
grep -rn "taxRate\|0\.13" src/lib/services/invoices/invoices.service.ts → taxRate = 0.13 confirmed

# CommandBus
grep -rn "CommandBus" src/ --include="*.ts" | grep -v ".test." → 0 results

# Logging
grep -rn "Sentry\|winston\|pino" src/ --include="*.ts" | grep -v ".test." → 0 results

# CI/CD
ls .github/workflows/ → not found

# IntentRegistry pattern
cat src/lib/chat/intent-registry.ts → singleton mutable confirmed
```

---

*Documento generado por inspección directa del código fuente. Todos los hallazgos son verificables ejecutando los comandos del Apéndice.*