# GROUND TRUTH VERIFICATION REPORT — CORREGIDO
**Fecha:** 26 de Febrero, 2026  
**Método:** Inspección directa del código fuente en rama `main`  
**Autor:** SuperNinja (CTO Audit Mode)  
**Estado:** VERIFICADO — basado en evidencia de código, no en suposiciones

---

## ⚠️ DISCREPANCIA CRÍTICA CON CHECKPOINT_SPRINT_5

El documento `CHECKPOINT_SPRINT_5.md` proporcionado describe un estado del sistema que **NO COINCIDE** con el código actual en la rama `main`.

### Servicios mencionados en CHECKPOINT_SPRINT_5 que NO existen en el código:

| Servicio | Estado en CHECKPOINT | Estado en Código Real |
|---|---|---|
| `bot-decision.service.ts` | ✅ 88.88% coverage | ❌ NO EXISTE |
| `document-mapper.service.ts` | ✅ Degrada gracilmente ante fallos de IA | ❌ NO EXISTE |
| `pdf-ingestion-orchestrator.service.ts` | ✅ 96.29% coverage | ❌ NO EXISTE |
| `tax-calculation.service.ts` | ✅ 100% coverage | ❌ NO EXISTE |
| `intent-resolver.ts` | ✅ 96.29% coverage | ❌ NO EXISTE |
| `price-versioning.service.ts` | ✅ 100% coverage | ❌ NO EXISTE |

### Cobertura mencionada en CHECKPOINT vs Cobertura Real:

| Métrica | CHECKPOINT_SPRINT_5 | Código Real (main) | Discrepancia |
|---|---|---|---|
| Statements | 93.21% | **94.78%** | +1.57% |
| Branches | 77.64% | **80.64%** | +3.00% |
| Functions | 95.20% | **94.83%** | -0.37% |
| Lines | 94.19% | **95.76%** | +1.57% |

**Conclusión:** El CHECKPOINT_SPRINT_5 parece ser un documento de **planificación o estado deseado** que no refleja el código actual. La cobertura real es incluso superior a la mencionada en el checkpoint, pero los servicios específicos descritos no existen.

---

## ESTADO REAL DEL SISTEMA (VERIFICADO)

### 1. Cobertura de Código Real

```text
All files                     |   94.78 |    80.64 |   94.83 |   95.76 |
```

**Test Suites:** 51 passed, 51 total  
**Tests:** 471 passed, 471 total  
**Time:** 23.486 s

### 2. Servicios que SÍ Existen y su Cobertura

| Servicio | Archivo | Statements | Branches | Funcs | Lines |
|---|---|---|---|---|---|
| Customers | `customers.service.ts` | 100% | 100% | 100% | 100% |
| Email | `email.service.ts` | 100% | 90.9% | 100% | 100% |
| Invoices | `invoices.service.ts` | 94.93% | 64.28% | 100% | 96% |
| Products | `productService.ts` | 100% | 100% | 100% | 100% |
| Purchase Orders | `purchase-orders.service.ts` | 91.11% | 64.51% | 83.33% | 90.9% |
| Suppliers | `suppliers.service.ts` | 88.88% | 100% | 83.33% | 88.23% |
| Telegram | `telegram.service.ts` | 82.05% | 62.5% | 69.23% | 82.89% |
| Users | `users.service.ts` | 96.15% | 100% | 100% | 96% |
| API Key | `api-key.service.ts` | 100% | 100% | 100% | 100% |
| Command Handler | `command-handler.service.ts` | 97.22% | 86.95% | 100% | 100% |
| Query Service | `query.service.ts` | 96.25% | 72.97% | 100% | 96.59% |
| WhatsApp Bot | `whatsapp.service.ts` | 100% | 100% | 100% | 100% |
| Intents Registry | `intents.ts` | 100% | 100% | 100% | 100% |
| OpenAI Client | `openai-client.ts` | 100% | 89.13% | 100% | 100% |
| Query Executor | `query-executor.ts` | 100% | 100% | 100% | 100% |
| Notifications | `service.ts` | 100% | 100% | 100% | 100% |
| Reports | `index.ts` | 98.3% | 76.78% | 94.11% | 99.41% |

### 3. Intents que SÍ Existen

| Intent | Archivo | Statements | Branches | Funcs | Lines |
|---|---|---|---|---|---|
| Best Supplier | `best-supplier.ts` | 85.71% | 40% | 75% | 90.9% |
| Create Order | `create-order.ts` | 90.56% | 75.91% | 94.73% | 93.87% |
| Create Purchase Order | `create-purchase-order.ts` | 85.82% | 69.35% | 84.61% | 87.28% |
| Customer Balance | `customer-balance.ts` | 95% | 83.33% | 100% | 94.44% |
| Inventory Summary | `inventory-summary.ts` | 100% | 80% | 100% | 100% |
| Invoice Status | `invoice-status.ts` | 100% | 75% | 100% | 100% |
| Overdue Invoices | `overdue-invoices.ts` | 92% | 60% | 100% | 91.66% |
| Price Lookup | `price-lookup.ts` | 90.9% | 40% | 100% | 88.88% |
| Product Info | `product-info.ts` | 91.66% | 33.33% | 100% | 90% |

### 4. Schema de Prisma (Entidades que SÍ Existen)

- `User`, `Customer`, `Supplier`, `Product`, `ProductPrice`
- `Invoice`, `InvoiceItem`, `InvoiceNote`
- `PurchaseOrder`, `PurchaseOrderItem`
- `Notification`, `NotificationLog`
- `ReportCache`
- `BotApiKey`, `Message`, `WebhookLog`
- `ChatSession`, `AuditLog`

**Entidades que NO existen en el schema:**
- `PriceList`
- `PreInvoice`
- `BotDecision`

---

## DEUDAS TÉCNICAS IDENTIFICADAS

### 1. `taxRate: 0.13` Hardcoded

**Estado:** ❌ NO RESUELTO

```typescript
// prisma/schema.prisma
model Invoice {
  taxRate Decimal @default(0.13) @map("tax_rate") @db.Decimal(5, 4)
}

model PurchaseOrder {
  taxRate Decimal @default(0.13) @db.Decimal(5, 4)
}
```

El `taxRate` está hardcodeado en el schema como `0.13` (13% HST de Ontario). No existe un `TaxCalculationService` para manejar las 13 provincias canadienses.

### 2. Logging Estructurado

**Estado:** ❌ AUSENCIA CONFIRMADA

Solo `console.error`, `console.log`, `console.warn` en producción. No hay Sentry, Winston, Pino ni ningún sistema de alertas.

### 3. CI/CD Pipeline

**Estado:** UNKNOWN

```bash
ls .github/workflows/
→ No se encontraron archivos de workflow
```

---

## CONCLUSIONES

1. **El CHECKPOINT_SPRINT_5 no refleja el código actual** — Describe servicios que no existen en la rama `main`.

2. **La cobertura real es excelente** — 94.78% statements, superior al objetivo del checkpoint.

3. **El sistema es funcional y estable** — 51 suites, 471 tests pasando sin errores.

4. **Deudas técnicas pendientes:**
   - `taxRate` hardcodeado (crítico para clientes fuera de Ontario)
   - Sin logging estructurado
   - Sin CI/CD pipeline verificado

5. **Servicios del CHECKPOINT que faltan implementar:**
   - `bot-decision.service.ts`
   - `document-mapper.service.ts`
   - `pdf-ingestion-orchestrator.service.ts`
   - `tax-calculation.service.ts`
   - `intent-resolver.ts`
   - `price-versioning.service.ts`

---

## ACCIONES RECOMENDADAS

1. **Clarificar el estado del CHECKPOINT_SPRINT_5** — ¿Es un documento de planificación o un reporte de una rama diferente?

2. **Si el CHECKPOINT es el estado deseado:**
   - Implementar los servicios faltantes del CHECKPOINT
   - Migrar el schema para incluir `PriceList`, `PreInvoice`, `BotDecision`
   - Implementar `TaxCalculationService` para las 13 provincias

3. **Si el código actual es el estado real:**
   - Actualizar el CHECKPOINT_SPRINT_5 para reflejar el estado real
   - Documentar los servicios que realmente existen
   - Priorizar la implementación de `TaxCalculationService`

---

*Documento generado por inspección directa del código fuente en la rama `main`. Todos los hallazgos son verificables ejecutando los comandos de verificación.*