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

**Objetivo:** Implementar servicio de versionado de precios sobre ProductPrice existente

**Contexto:** Estado actual: `price-versioning.service.ts` NO existe. `ProductPrice` existe en schema. `PriceList` y `PriceVersion` creados en S6-P05.

**Entradas:** SupplierId, productId, price, validFrom, validTo

**Salidas:** PriceVersion creada, PriceList actualizada si es nueva versión

**Reglas de Negocio:**
- Reutilizar `ProductPrice` existente
- `PriceList` agrupa versiones por proveedor y período
- Solo una `PriceList` `isCurrent=true` por supplier
- Lookup de precio vigente por fecha actual
- Crear nueva versión no elimina versiones anteriores (histórico)

**Dependencias:** S6-P05: Migración Schema

**Criterios de Aceptación:**
- [ ] Servicio en `src/lib/services/pricing/price-versioning.service.ts`
- [ ] Interface `IPriceVersioner` definida
- [ ] Método `createPriceVersion(supplierId, productId, price, validFrom, validTo): PriceVersion`
- [ ] Método `getCurrentPrice(supplierId, productId, date?): ProductPrice`
- [ ] Método `createPriceList(supplierId, name, validFrom): PriceList`
- [ ] Tests 90%+ coverage
- [ ] Tests de lookup de precios vigentes
- [ ] Tests de histórico de versiones
- [ ] Documentación de API

**Referencias:**
- Decision Log: PriceVersioningService sobre ProductPrice
- Secuencia de Construcción Paso 6
- Gates: Naming/Boundaries de Servicios Nuevos

**Notas:** Week 3. Desbloquea pricing inteligente con histórico.

---

## S6-P07: PdfIngestionService

**Objetivo:** Implementar servicio de ingestión de PDFs con lazy loading de pdf-parse

**Contexto:** Estado actual: `pdf-ingestion.service.ts` NO existe. `pdf-ingestion-orchestrator.service.ts` NO existe. Problema: `pdf-parse` inicializa workers nativos al importar, causando open handles en Jest.

**Entradas:** Buffer de PDF, supplierId

**Salidas:** Texto extraído del PDF, metadatos

**Reglas de Negocio:**
- Lazy loading de `pdf-parse` (solo cargar en `extractFromBuffer`)
- Fix open handles en Jest
- Validar que es PDF válido
- Manejar errores de parsing
- Timeout de 30s para extracción
- Soporte PDFs hasta 10MB

**Dependencias:** S6-P01: CI/CD Pipeline

**Criterios de Aceptación:**
- [ ] Servicio en `src/lib/services/documents/pdf-ingestion.service.ts`
- [ ] Interface `IPdfIngestor` definida
- [ ] Método `extractFromBuffer(buffer: Buffer, supplierId: string): Promise<PdfExtractionResult>`
- [ ] Lazy loading de `pdf-parse` (require dentro del método)
- [ ] Validación de tipo de archivo (PDF)
- [ ] Manejo de errores con try-catch
- [ ] Tests 90%+ coverage
- [ ] Tests de timeout y errores de parsing
- [ ] `npx jest --detectOpenHandles` reporta 0 errores
- [ ] Documentación de uso

**Referencias:**
- Decision Log: PdfIngestionService con lazy loading
- Secuencia de Construcción Paso 7
- CHECKPOINT_SPRINT_5: Estabilidad de Infraestructura de Tests

**Notas:** Week 3. Fix open handles + base para ingestión de documentos.

---

## S6-P08: BotDecisionService

**Objetivo:** Implementar servicio de persistencia de decisiones del bot para auditoría

**Contexto:** Estado actual: `bot-decision.service.ts` NO existe. `BotDecision` entity creada en S6-P05. `ChatSession` existe pero no persiste decisiones individuales.

**Entradas:** SessionId, intent, confidence, decision (objeto)

**Salidas:** BotDecision persistida en DB

**Reglas de Negocio:**
- Persistir todas las decisiones del bot
- Incluir timestamp (executedAt)
- Decision es JSON flexible
- No sobrescribir decisiones anteriores (histórico)
- Query por sessionId para auditoría/debugging

**Dependencias:** S6-P05: Migración Schema

**Criterios de Aceptación:**
- [ ] Servicio en `src/lib/services/chat/bot-decision.service.ts`
- [ ] Interface `IBotDecisionRepository` definida
- [ ] Método `saveDecision(sessionId, intent, confidence, decision): Promise<BotDecision>`
- [ ] Método `getDecisionsBySession(sessionId): Promise<BotDecision[]>`
- [ ] Método `getRecentDecisions(limit?): Promise<BotDecision[]>`
- [ ] Tests 90%+ coverage
- [ ] Tests de persistencia y query
- [ ] Documentación de uso

**Referencias:**
- Decision Log: BotDecisionService para auditoría
- Secuencia de Construcción Paso 8
- Gates: Naming/Boundaries de Servicios Nuevos

**Notas:** Week 3. Desbloquea auditoría de decisiones del bot.

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