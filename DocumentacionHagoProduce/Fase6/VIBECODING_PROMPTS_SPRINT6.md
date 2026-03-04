# VIBECODING PROMPTS — SPRINT 6
**Versión:** 1.0  
**Fecha:** 26 de Febrero, 2026  
**Basado en:** CTO_STRATEGIC_DESIGN_SPRINT6.md (Ground Truth Verificado)

---

## RESUMEN

Serie de 10 prompts quirúrgicos para ejecutar el desarrollo de Sprint 6 de Hago Produce. Cada prompt está diseñado para ser autocontenido, sin ambigüedades y listo para ser usado por un desarrollador o LLM.

**Estrategia:** Deuda técnica bloqueante → ERP Core → CRA Compliance  
**Secuencia:** 10 pasos ordenados por dependencia técnica

---

## S6-P01: CI/CD Pipeline Básico (GitHub Actions)

**Objetivo:** Implementar pipeline de CI/CD con 3 jobs: quality, unit-tests, build

**Contexto:** Estado actual: CI/CD pipeline UNKNOWN. No se encontraron archivos en `.github/workflows/`. Sistema tiene 94.78% coverage con 471 tests pasando.

**Entradas:** Código fuente en rama main, configuración de Jest existente

**Salidas:** Archivo `.github/workflows/ci.yml` con 3 jobs configurados

**Reglas de Negocio:**
- Pipeline debe ejecutarse en cada PR y push a main
- Jobs deben ejecutarse en secuencia: quality → unit-tests → build
- Fallo en cualquier job debe bloquear merge

**Dependencias:** Ninguna

**Criterios de Aceptación:**
- [ ] Job 'quality' ejecuta ESLint con configuración existente
- [ ] Job 'unit-tests' ejecuta `npm test` con `--coverage`
- [ ] Job 'build' ejecuta `npm run build` exitosamente
- [ ] Pipeline pasa en PRs a main
- [ ] Pipeline pasa en pushes directos a main
- [ ] Tiempo de ejecución total < 5 minutos

**Referencias:**
- Decision Log: CI/CD Pipeline básico (3 jobs)
- Secuencia de Construcción Paso 1

**Notas:** Prioridad absoluta - bloquea todo desarrollo posterior sin validación automática

---

## S6-P02: TaxCalculationService

**Objetivo:** Implementar servicio de cálculo de impuestos multi-provincia para las 13 provincias canadienses

**Contexto:** Estado actual: `taxRate` HARDCODEADO a 0.13 (13% HST Ontario) en schema Prisma. Riesgo legal para clientes fuera de Ontario. Servicio no existe.

**Entradas:** Provincia (string), monto (decimal), tipo de transacción (venta/compra)

**Salidas:** Impuesto calculado (decimal), tasa aplicada (decimal), breakdown (objeto con GST/HST/PST)

**Reglas de Negocio:**
- 100% determinístico - sin AI
- Tabla de 13 provincias canadienses hardcodeada en servicio
- GST (5%), HST (combinado 13-15%), PST (provincial 0-10%)
- Error inmediato si provincia no encontrada
- Sin retry

**Dependencias:** S6-P01: CI/CD Pipeline

**Criterios de Aceptación:**
- [ ] Servicio en `src/lib/services/finance/tax-calculation.service.ts`
- [ ] Tabla de 13 provincias canadienses implementada (GST/HST/PST)
- [ ] Tests 100% coverage (statements, branches, functions, lines)
- [ ] Interface `ITaxCalculator` definida
- [ ] Método `calculateTax(province: string, amount: decimal, type: TransactionType): TaxResult`
- [ ] Error lanzado si provincia inválida
- [ ] Documentación de API con ejemplos por provincia

**Referencias:**
- Decision Log: TaxCalculationService con tabla hardcodeada
- Secuencia de Construcción Paso 2
- Gates: Política de TaxRate

**Notas:** Prioridad máxima - riesgo legal bloqueante. Debe ser Week 1.

---

## S6-P03: Migrar Invoice y PurchaseOrder para usar TaxCalculationService

**Objetivo:** Remover `taxRate` hardcodeado de Invoice y PurchaseOrder, inyectar TaxCalculationService

**Contexto:** Estado actual: `Invoice.taxRate` y `PurchaseOrder.taxRate` tienen `@default(0.13)` en schema. Servicios `invoices.service.ts` y `purchase-orders.service.ts` usan valor hardcodeado.

**Entradas:** Servicios existentes de Invoice y PurchaseOrder, TaxCalculationService implementado

**Salidas:** Servicios migrados para calcular impuestos dinámicamente por provincia

**Reglas de Negocio:**
- Remover `@default(0.13)` de schema (breaking change controlado)
- Calcular `taxRate` en runtime usando TaxCalculationService
- Mantener backward compatibility con datos existentes
- Province debe venir de `Customer.address` o parámetro explícito

**Dependencias:** S6-P02: TaxCalculationService

**Criterios de Aceptación:**
- [ ] Schema Prisma actualizado: remover `@default(0.13)` de `Invoice.taxRate` y `PurchaseOrder.taxRate`
- [ ] `invoices.service.ts` inyecta TaxCalculationService
- [ ] `purchase-orders.service.ts` inyecta TaxCalculationService
- [ ] Tests actualizados para cubrir cálculo multi-provincia
- [ ] Coverage ≥ 90% statements en ambos servicios
- [ ] Migración de datos existentes (script de migración incluido)
- [ ] Documentación de breaking changes

**Referencias:**
- Decision Log: Migración schema unificada
- Secuencia de Construcción Paso 3
- Ground Truth: taxRate HARDCODEADO

**Notas:** Depende de S6-P02. Breaking change controlado requiere migración de datos.

---

## S6-P04: LoggerService + Sentry

**Objetivo:** Implementar servicio de logging estructurado (Winston/Pino) con integración Sentry

**Contexto:** Estado actual: Solo `console.error`/`console.log`/`console.warn` en producción. Sin Sentry, Winston, Pino ni sistema de alertas. Producción es caja negra.

**Entradas:** Configuración de Sentry DSN, nivel de log (info/warn/error)

**Salidas:** LoggerService con niveles estructurados, integración Sentry configurada

**Reglas de Negocio:**
- Todos los errores de producción deben llegar a Sentry
- Logging estructurado con niveles (error, warn, info, debug)
- Contexto de request incluido en logs
- No exponer datos sensibles (passwords, tokens)

**Dependencias:** S6-P01: CI/CD Pipeline

**Criterios de Aceptación:**
- [ ] Servicio en `src/lib/infrastructure/logger.service.ts`
- [ ] Interface `ILogger` definida
- [ ] Winston/Pino configurado con transportes (console + file)
- [ ] Sentry integrado y configurado con DSN de entorno
- [ ] Métodos: `error(message, context)`, `warn(message, context)`, `info(message, context)`, `debug(message, context)`
- [ ] Tests 90%+ coverage
- [ ] Documentación de uso en servicios
- [ ] Sentry free tier monitoreado post-go-live

**Referencias:**
- Decision Log: LoggerService con Winston/Pino + Sentry
- Secuencia de Construcción Paso 4
- Riesgos Críticos: Sin logging estructurado

**Notas:** Prioridad crítica - sin observabilidad real, sistema es caja negra en producción.

---

## S6-P05: Migración Schema: PriceList, PreInvoice, BotDecision

**Objetivo:** Crear migración unificada de Prisma con entidades PriceList, PreInvoice, BotDecision

**Contexto:** Estado actual: Entidades NO existen en schema. Servicios que las usan están testeados con mocks. Migración unificada evita breaking changes fraccionados.

**Entradas:** Schema Prisma actual, definiciones de entidades nuevas

**Salidas:** Migración Prisma ejecutada, entidades creadas en DB

**Reglas de Negocio:**
- Migración unificada (no fraccionada)
- Sin breaking changes en entidades existentes
- Índices optimizados para queries frecuentes
- Relaciones bien definidas
- Campos audit (createdAt, updatedAt) en todas las entidades

**Dependencias:** S6-P01: CI/CD Pipeline

**Criterios de Aceptación:**
- [ ] `model PriceList` creado con campos: id, name, supplierId, isCurrent, validFrom, validTo, prices[]
- [ ] `model PriceVersion` creado con campos: id, priceListId, productId, price, validFrom, validTo
- [ ] `model PreInvoice` creado con campos: id, customerId, status, subtotal, taxAmount, total, items[]
- [ ] `model PreInvoiceItem` creado con campos: id, preInvoiceId, productId, quantity, unitPrice, totalPrice
- [ ] `model BotDecision` creado con campos: id, sessionId, intent, confidence, decision, executedAt
- [ ] Relaciones bien definidas con entidades existentes (Supplier, Product, Customer)
- [ ] Índices en campos frecuentemente query-eados
- [ ] Migración ejecutada exitosamente: `prisma migrate dev`
- [ ] Tests de integración para nuevas entidades
- [ ] Documentación de schema actualizada

**Referencias:**
- Decision Log: Migración schema unificada
- Secuencia de Construcción Paso 5
- Gates: Schema Prisma (Modelos Nuevos)
- Ground Truth: Entidades que NO existen

**Notas:** Base para PriceVersioningService y BotDecisionService. Week 2.

---
## S6-P06: PriceVersioningService

**Objetivo:** Implementar servicio de versionado de precios

**Stack:** Next.js 14+ Fullstack (NO NestJS). Servicios como 
clases TypeScript en src/lib/services/. Sin @Injectable().

**Contexto del Schema (S6-P05):**
- PriceList: vinculada a Supplier, campos isCurrent, 
  validFrom, validTo
- PriceVersion: historial de precios por producto 
  dentro de una PriceList
- ProductPrice: entidad existente en schema
IMPORTANTE: Antes de implementar, confirma si ProductPrice 
y PriceVersion son entidades separadas o la misma.

**Implementación Requerida:**

1. Interface IPriceVersioner en 
   src/lib/services/pricing/price-versioning.service.ts

2. Métodos obligatorios:
   - createPriceVersion(supplierId, productId, price, 
     validFrom, validTo?): Promise<PriceVersion>
     → validTo es OPCIONAL (precio abierto = vigente 
       hasta nueva versión)
   
   - getCurrentPrice(supplierId, productId, date?): 
     Promise<PriceVersion | null>
     → date default = new Date()
     → Busca PriceVersion en PriceList activa (isCurrent=true)
       cuyo validFrom <= date AND (validTo >= date OR validTo IS NULL)
   
   - createPriceList(supplierId, name, validFrom): 
     Promise<PriceList>
     → Usar prisma.$transaction() para garantizar 
       que solo una PriceList tenga isCurrent=true por supplier

3. Reglas de Negocio CRÍTICAS:
   - Solo una PriceList isCurrent=true por supplier
     → Implementar con prisma.$transaction()
   - Crear nueva versión NO elimina versiones anteriores
   - Usar Prisma.Decimal para todos los campos de precio
   - Validar overlap de fechas: si validFrom de nueva versión
     se solapa con versión existente, lanzar error descriptivo
     con los detalles del conflicto

4. Logging (usar LoggerService.getInstance()):
   - logger.debug() en operaciones exitosas
   - logger.warn() en casos edge (validTo null, 
     precio sin PriceList activa)
   - logger.error() + throw en errores de validación

5. Tests (coverage ≥ 90%):
   Unitarios (mocks de Prisma):
   - createPriceVersion: caso normal, validTo null, 
     overlap de fechas (debe fallar)
   - getCurrentPrice: precio vigente, sin precio vigente,
     con fecha específica, validTo null vigente
   - createPriceList: primera lista, segunda lista 
     (verifica que anterior queda isCurrent=false),
     transacción atómica
   
   Integración (DB real):
   - Flujo completo: crear lista → crear versiones → 
     lookup por fecha
   - Verificar que isCurrent=true es único por supplier

6. Documentación:
   - JSDoc en todos los métodos públicos
   - Actualizar MANUAL_TECNICO.md con sección 
     PriceVersioningService
   - Documentar comportamiento de validTo=null

**Criterios de Aceptación:**
- [ ] Interface IPriceVersioner definida
- [ ] createPriceVersion() con validación de overlap
- [ ] getCurrentPrice() maneja validTo=null
- [ ] createPriceList() con transacción atómica
- [ ] Tests unitarios ≥ 90% coverage
- [ ] Tests de integración: flujo completo
- [ ] Logging integrado (LoggerService)
- [ ] Prisma.Decimal para precios
- [ ] Documentación JSDoc + MANUAL_TECNICO.md
---
## S6-P06: PdfIngestionService con Lazy Loading

**Stack:** Next.js 14+ Fullstack (NO NestJS).
Servicios como clases TypeScript en src/lib/services/.

**SCOPE ACLARADO:**
Implementar SOLO pdf-ingestion.service.ts en este task.
El orchestrator (pdf-ingestion-orchestrator.service.ts)
es un task separado futuro. NO implementar el orchestrator.

**1. Interface PdfExtractionResult:**
Define en el mismo archivo o en src/lib/types/pdf.types.ts:

```typescript
interface PdfExtractionResult {
  text: string;
  pageCount: number;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: Date;
    [key: string]: unknown;
  };
  supplierId: string;
  extractedAt: Date;
  fileSizeBytes: number;
}

interface IPdfIngestor {
  extractFromBuffer(
    buffer: Buffer,
    supplierId: string
  ): Promise<PdfExtractionResult>;
}
2. Implementación PdfIngestionService:

Archivo: src/lib/services/documents/pdf-ingestion.service.ts

Reglas CRÍTICAS: a) LAZY LOADING obligatorio:

NO importar pdf-parse al top del archivo
Usar require() DENTRO de extractFromBuffer()
Esto resuelve open handles en Jest
b) VALIDACIONES en orden:

Tamaño: buffer.length > 10MB → throw error
Magic bytes: primeros 4 bytes !== '%PDF' → throw error
Buffer vacío: buffer.length === 0 → throw error
c) TIMEOUT de 30 segundos: Implementar con Promise.race():


const TIMEOUT_MS = 30_000;
await Promise.race([
  extractPromise,
  new Promise((_, reject) =>
    setTimeout(() => reject(
      new Error('PDF extraction timeout after 30s')
    ), TIMEOUT_MS)
  )
]);
d) LOGGING con LoggerService.getInstance():

logger.debug(): extracción exitosa con métricas (páginas, tamaño, supplierId, tiempo de procesamiento)
logger.warn(): PDF sin texto extraído (posible imagen)
logger.error(): cualquier error → captura Sentry
e) MANEJO DE ERRORES: Crear errores tipados:

PdfValidationError (archivo inválido)
PdfExtractionError (fallo de parsing)
PdfTimeoutError (timeout 30s)
3. Tests (coverage ≥ 90%):

Unitarios (src/tests/unit/services/pdf-ingestion.service.test.ts): IMPORTANTE para evitar open handles:

Mockear pdf-parse completamente: jest.mock('pdf-parse', () => jest.fn())
NO usar pdf-parse real en unit tests
Casos requeridos:

✅ Extracción exitosa con PDF válido (mock)
✅ Buffer vacío → PdfValidationError
✅ Archivo > 10MB → PdfValidationError
✅ Magic bytes inválidos → PdfValidationError
✅ pdf-parse lanza error → PdfExtractionError
✅ Timeout 30s → PdfTimeoutError (usar jest.useFakeTimers())
✅ PDF sin texto extraído → warn en logger
✅ Verificar lazy loading: require() llamado DENTRO del método, no al importar el módulo
Integración (src/tests/integration/services/pdf-ingestion.integration.test.ts):

Usar un PDF real pequeño (fixture en tests/fixtures/)
Verificar extracción de texto real
Verificar metadatos
4. Verificación Open Handles: Después de implementar, ejecutar: npx jest --detectOpenHandles src/tests/unit/services/pdf-ingestion.service.test.ts Debe reportar 0 open handles.

5. Documentación:

JSDoc completo en extractFromBuffer() con @example
Actualizar MANUAL_TECNICO.md sección "Servicios de Documentos"
Documentar comportamiento con PDFs de solo imagen (texto vacío, no es error, es warning)
Criterios de Aceptación:

 Interface IPdfIngestor y PdfExtractionResult definidas
 Lazy loading verificable (require dentro del método)
 Validaciones: tamaño, magic bytes, buffer vacío
 Timeout 30s con Promise.race()
 Errores tipados: PdfValidationError, PdfExtractionError, PdfTimeoutError
 Tests unitarios ≥ 90% con pdf-parse mockeado
 npx jest --detectOpenHandles = 0 errores
 JSDoc + MANUAL_TECNICO.md actualizado

---
## S6-P08: BotDecisionService

**Stack:** Next.js 14+ Fullstack (NO NestJS).
Servicios como clases TypeScript en src/lib/services/.

**PASO 0 - Verificación de Schema:**
Antes de implementar, confirma en schema.prisma:
1. Campos exactos de BotDecision (especialmente
   el tipo del campo 'decision' en Prisma)
2. ¿Existen índices en sessionId y executedAt?
   Si NO existen, agrégalos en schema.prisma y
   ejecuta npx prisma db push antes de continuar.
3. ¿BotDecision tiene relación con PreInvoice?
   Confirma el campo botDecisionId en PreInvoice.

**1. Tipos e Interface:**

Crea src/lib/types/bot-decision.types.ts:

```typescript
interface BotDecisionPayload {
  action: string;
  reasoning?: string;
  parameters?: Record<string, unknown>;
  outcome?: string;
  [key: string]: unknown;
}

interface IBotDecisionService {
  saveDecision(
    sessionId: string,
    intent: string,
    confidence: number,        // Rango: 0.0 - 1.0
    decision: BotDecisionPayload,
    preInvoiceId?: string      // Opcional: vincula con PreInvoice
  ): Promise<BotDecision>;

  getDecisionsBySession(
    sessionId: string
  ): Promise<BotDecision[]>;

  getRecentDecisions(
    limit?: number             // Default: 10, Max: 100
  ): Promise<BotDecision[]>;
}


**Notas:** Week 3. Desbloquea auditoría de decisiones del bot.


## Tech Debt Log - S6-P08

### TD-S6P08-001: Documentar Puertos de DB por Entorno
- Agregar a PIPELINE.md y README:
  Puerto 5432 → DB desarrollo (Neon)
  Puerto 5434 → DB tests locales (Docker)
  Puerto 5432 → DB CI/CD (GitHub Actions service container)
- Riesgo: BAJO (ya funciona, solo falta documentación)
- Owner: Próximo sprint o PR de documentación


---

## S6-P09: Aumentar Branches de Intents Críticos

**Objetivo:** Aumentar cobertura de branches en intents críticos de 33-40% a 70%+

**Contexto:** Estado actual: `best-supplier.ts` (40% branches), `price-lookup.ts` (40% branches), `product-info.ts` (33.33% branches). Riesgo operativo de comportamiento no determinista.

**Entradas:** Tests existentes de intents

**Salidas:** Tests adicionales para cubrir branches faltantes

**Reglas de Negocio:**
- Cobertura objetivo: 70%+ branches en intents críticos
- Tests de edge cases y error paths
- Tests de inputs malformados
- Tests de timeouts de OpenAI
- Tests de respuestas vacías o irrelevantes

**Dependencias:** S6-P04: LoggerService + Sentry

**Criterios de Aceptación:**
- [ ] `best-supplier.ts`: branches ≥ 70%
- [ ] `price-lookup.ts`: branches ≥ 70%
- [ ] `product-info.ts`: branches ≥ 70%
- [ ] Tests de edge cases agregados
- [ ] Tests de error paths agregados
- [ ] Tests de timeouts de OpenAI agregados
- [ ] Cobertura global ≥ 90% statements
- [ ] `npx jest --coverage` confirma objetivos
- [ ] Documentación de casos de prueba

**Referencias:**
- Riesgos Críticos: Branches de intents al 33-40%
- Secuencia de Construcción Paso 9
- Ground Truth: Intents que SÍ EXISTEN

**Notas:** Week 3-4. Riesgo operativo de comportamiento no determinista.

---

## S6-P10: Integrar LoggerService en Todos los Servicios

**Objetivo:** Reemplazar `console.error`/`console.log`/`console.warn` por LoggerService en todos los servicios

**Contexto:** Estado actual: Solo `console.error`/`log`/`warn` en producción. LoggerService implementado en S6-P04. Servicios existentes: customers, email, invoices, products, purchase-orders, suppliers, telegram, users, api-key, command-handler, query, whatsapp, intents, openai-client, query-executor, notifications, reports.

**Entradas:** LoggerService implementado, servicios existentes

**Salidas:** Todos los servicios usando LoggerService estructurado

**Reglas de Negocio:**
- Reemplazar todos los `console.error` por `logger.error`
- Reemplazar todos los `console.log` por `logger.info`
- Reemplazar todos los `console.warn` por `logger.warn`
- Incluir contexto relevante en cada log
- No exponer datos sensibles

**Dependencias:** S6-P04: LoggerService + Sentry

**Criterios de Aceptación:**
- [ ] `customers.service.ts` usa LoggerService
- [ ] `email.service.ts` usa LoggerService
- [ ] `invoices.service.ts` usa LoggerService
- [ ] `productService.ts` usa LoggerService
- [ ] `purchase-orders.service.ts` usa LoggerService
- [ ] `suppliers.service.ts` usa LoggerService
- [ ] `telegram.service.ts` usa LoggerService
- [ ] `users.service.ts` usa LoggerService
- [ ] `api-key.service.ts` usa LoggerService
- [ ] `command-handler.service.ts` usa LoggerService
- [ ] `query.service.ts` usa LoggerService
- [ ] `whatsapp.service.ts` usa LoggerService
- [ ] `intents.ts` usa LoggerService
- [ ] `openai-client.ts` usa LoggerService
- [ ] `query-executor.ts` usa LoggerService
- [ ] `notifications/service.ts` usa LoggerService
- [ ] `reports/index.ts` usa LoggerService
- [ ] 0 `console.error`/`log`/`warn` en código de producción
- [ ] Todos los errores llegan a Sentry
- [ ] Tests actualizados para mockear LoggerService
- [ ] Cobertura ≥ 90% statements mantenida

**Referencias:**
- Decision Log: Integrar LoggerService en todos los servicios
- Secuencia de Construcción Paso 10
- Riesgos Críticos: Sin logging estructurado

**Notas:** Week 4. Desbloquea observabilidad completa del sistema.

---

## SECUENCIA DE EJECUCIÓN

1. **S6-P01** → CI/CD Pipeline (Week 1)
2. **S6-P02** → TaxCalculationService (Week 1)
3. **S6-P03** → Migrar Invoice/PurchaseOrder (Week 1-2)
4. **S6-P04** → LoggerService + Sentry (Week 2)
5. **S6-P05** → Migración Schema (Week 2)
6. **S6-P06** → PriceVersioningService (Week 3)
7. **S6-P07** → PdfIngestionService (Week 3)
8. **S6-P08** → BotDecisionService (Week 3)
9. **S6-P09** → Aumentar Branches Intents (Week 3-4)
10. **S6-P10** → Integrar LoggerService (Week 4)

---

*Documento generado por VibeCoding Prompt Generator. Basado en CTO_STRATEGIC_DESIGN_SPRINT6.md y Ground Truth verificado al 26/Feb/2026.*

## CHECKPOINT_SPRINT_6: Documento de Estado del Sistema

**Objetivo:** Crear documento de checkpoint que capture el estado
completo del sistema al finalizar Sprint 6, sirviendo como
línea base para Sprint 7.

**Archivo a crear:** docs/checkpoints/CHECKPOINT_SPRINT_6.md

---

### INSTRUCCIONES DE EJECUCIÓN:

**PASO 1 - Ejecuta estos comandos y captura el output:**

```bash
# 1. Coverage completo
npx jest --coverage --coverageReporters=text-summary

# 2. Auditoría de console.* residual
grep -rn "console\." src/ --include="*.ts" \
  --exclude-dir=node_modules

# 3. Verificar 0 imports de NestJS
grep -rn "@nestjs" src/ --include="*.ts"

# 4. Estado de migraciones Prisma
npx prisma migrate status

# 5. Auditoría de TODOs y FIXMEs pendientes
grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.ts"

# 6. Verificar variables de entorno documentadas
cat .env.example


1. RESUMEN EJECUTIVO
1.1 Objetivos del Sprint
[Lista de S6-P01 a S6-P10 con estado]

1.2 Métricas de Calidad
Métrica	Objetivo	Resultado	Estado
Statements coverage
≥ 90%
X%
✅/❌
Branches coverage
≥ 70%
X%
✅/❌
console.* en producción
0
X
✅/❌
Tests unitarios pasando
100%
X/X
✅/❌
Tests integración pasando
100%
X/X
✅/❌
Open handles en Jest
0
X
✅/❌
2. ARQUITECTURA DEL SISTEMA
2.1 Stack Tecnológico Confirmado
Framework: Next.js 14+ App Router (Fullstack)
Base de Datos: PostgreSQL + Prisma ORM
DB Producción: Neon (cloud)
DB Tests: PostgreSQL Docker (puerto 5434)
Testing: Jest (unit + integration)
CI/CD: GitHub Actions
Logging: Winston + Sentry (servidor) / clientLogger (browser)
Dominio: Hago Produce (productos frescos, Canadá)
2.2 Estructura de Directorios Clave
[Documenta la estructura real del proyecto] src/ ├── app/ │ └── api/ ← API Routes (Next.js) ├── lib/ │ ├── constants/ ← taxes.ts, etc. │ ├── services/ ← Lógica de negocio │ │ ├── chat/ ← BotDecision, intents │ │ ├── documents/← PdfIngestion │ │ ├── finance/ ← TaxCalculation │ │ └── pricing/ ← PriceVersioning │ ├── infrastructure/← LoggerService │ └── types/ ← Interfaces y tipos ├── tests/ │ ├── unit/ │ └── integration/ └── middleware.ts ← Correlation IDs

2.3 Decisiones Arquitectónicas Clave
[Referencia a DECISION_LOG.md - lista las decisiones principales]

Next.js Fullstack (no NestJS separado)
LoggerService Singleton (no DI container)
PriceList → Supplier (no Customer)
DEFAULT_TAX_FALLBACK = Ontario 13% HST
Lazy loading pdf-parse (open handles fix)
Dos loggers: server (Winston) vs client (clientLogger)
3. SERVICIOS IMPLEMENTADOS EN SPRINT 6
3.1 TaxCalculationService
Archivo: src/lib/services/finance/tax-calculation.service.ts
Responsabilidad: Cálculo de impuestos multi-provincia canadiense
Cobertura: X% statements, X% branches
Fallback: Ontario 13% HST (src/lib/constants/taxes.ts)
Provincias soportadas: 13 (todas las de Canadá)
3.2 PriceVersioningService
Archivo: src/lib/services/pricing/price-versioning.service.ts
Responsabilidad: Historial de precios por proveedor
Cobertura: X% statements, X% branches
Nota: ProductPrice legacy no sincronizado (TD-S6P06-001)
3.3 PdfIngestionService
Archivo: src/lib/services/documents/pdf-ingestion.service.ts
Responsabilidad: Extracción de texto de PDFs
Cobertura: X% statements, X% branches
Técnica: Dynamic import para evitar open handles
3.4 BotDecisionService
Archivo: src/lib/services/chat/bot-decision.service.ts
Responsabilidad: Auditoría de decisiones del bot IA
Cobertura: X% statements, X% branches
Límites: MAX_LIMIT=100, confidence [0,1]
3.5 LoggerService
Archivo: src/lib/infrastructure/logger.service.ts
Responsabilidad: Logging estructurado + Sentry
Patrón: Singleton con AsyncLocalStorage
Contexto: x-correlation-id automático
4. SCHEMA DE BASE DE DATOS
4.1 Entidades Nuevas en Sprint 6
PriceList: Listas de precios por proveedor
PriceVersion: Versiones históricas de precios
PreInvoice: Borradores de facturación (IA/manual)
BotDecision: Auditoría de decisiones del bot
4.2 Entidades Modificadas
Invoice: taxRate sin @default(0.13)
PurchaseOrder: taxRate sin @default(0.13)
4.3 Estado de Migraciones
[Output de npx prisma migrate status]

4.4 Índices Críticos
[Lista los índices agregados en Sprint 6]

5. CONFIGURACIÓN DE ENTORNOS
5.1 Variables de Entorno Requeridas
[Output de cat .env.example]

5.2 Puertos por Entorno
Entorno	Puerto	Host	Propósito
Desarrollo
5432
Neon cloud
DB principal
Tests locales
5434
localhost Docker
Tests integración
CI/CD
5432
localhost (service)
GitHub Actions
5.3 Comandos de Entorno

# Desarrollo
npm run dev

# Tests unitarios
npm run test

# Tests integración (requiere Docker en puerto 5434)
npm run test:integration

# Tests con coverage
npx jest --coverage

# Verificar open handles
npx jest --detectOpenHandles

# Sync schema a test DB
DATABASE_URL="postgresql://test_user:test_password
@localhost:5434/hago_produce_test" npx prisma db push
6. CI/CD PIPELINE
6.1 Jobs del Pipeline
quality: Lint + type-check
unit-tests: Tests unitarios (sin DB)
integration-tests: Tests con PostgreSQL Docker
build: Solo si todos los anteriores pasan
6.2 Archivo de Referencia
docs/devops/PIPELINE.md

7. DEUDA TÉCNICA ACTIVA
7.1 Prioridad Alta
ID	Descripción	Riesgo	Owner
TD-S6P06-001
ProductPrice legacy sin sync
MEDIO-ALTO
Sprint 7
7.2 Prioridad Media
ID	Descripción	Riesgo	Owner
TD-S6P05-002
PreInvoice conversion service
MEDIO
Sprint 7
TD-S6P03-002
Clientes sin dirección en prod
MEDIO
Sprint 7
7.3 Prioridad Baja
ID	Descripción	Riesgo	Owner
TD-S6P03-001
Naming columnas DB inconsistente
BAJO
Sprint 7
TD-S6P05-001
PriceList para Clientes (futuro)
BAJO
Sprint 7+
TD-LOGGER-001
Documentar regla dos loggers
BAJO
Sprint 7
TD-S6P08-001
Documentar puertos DB
BAJO
Sprint 7
8. RIESGOS CONOCIDOS PARA SPRINT 7
8.1 Riesgos Técnicos
ProductPrice desincronizado: Servicios que lean ProductPrice pueden tener precios desactualizados
PreInvoice sin flujo completo: Entidad creada pero sin servicio de conversión a Invoice
extractProvinceFromAddress: Regex puede fallar con formatos de dirección no estándar
8.2 Riesgos Operativos
Clientes sin dirección: Fallback a Ontario 13% puede ser incorrecto para clientes fuera de Ontario
PDF de solo imagen: Extracción retorna texto vacío (warning en logs, no error)
9. CHECKLIST DE ESTABILIDAD
9.1 Código
 0 console.* en src/lib/services/
 0 imports de @nestjs en el proyecto
 0 TODOs críticos sin ticket
 Todos los servicios usan LoggerService
 Datos sensibles enmascarados en logs
9.2 Tests
 Statements ≥ 90%
 Branches ≥ 70% en intents críticos
 0 open handles en Jest
 Tests integración pasando con DB real
 Mock centralizado en jest.setup.ts
9.3 Infraestructura
 .env.example actualizado
 PIPELINE.md documentado
 DECISION_LOG.md al día
 MANUAL_TECNICO.md actualizado
 schema.prisma sincronizado con DB test
10. PRÓXIMOS PASOS - SPRINT 7
10.1 Deuda Técnica a Resolver
[Lista priorizada del punto 7]

10.2 Nuevas Funcionalidades Anticipadas
[Basado en el roadmap del proyecto]

10.3 Mejoras de Infraestructura
Resolver TD-S6P06-001 (ProductPrice sync)
Implementar PreInvoice → Invoice conversion
Auditoría de clientes sin dirección en staging