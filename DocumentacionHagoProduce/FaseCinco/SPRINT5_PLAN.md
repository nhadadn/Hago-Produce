# Sprint 5 Planning: Hago Produce

## Objetivo del Sprint 5

**"Construir los cimientos técnicos escalables para la expansión internacional y el crecimiento masivo mediante PoCs validados de facturación electrónica canadiense, arquitectura de caché distribuido y automatización de procesamiento de documentos."**

---

## Backlog del Sprint 5

### 🔴 P0 - Crítico (Expansión Internacional)

#### US-001: Implementación de Facturación Electrónica CRA (Canadá)
**Como** productor canadiense  
**Quiero** generar facturas electrónicas certificadas por la CRA  
**Para** cumplir con las regulaciones fiscales canadienses (GST/HST)

**Criterios de Aceptación:**
- [ ] Implementar generación de XML con estructura CRA-compliant
- [ ] Integrar firma digital X.509 para certificación
- [ ] Calcular automáticamente GST (5%) y HST (provincial) según ubicación
- [ ] Crear endpoint `/api/v1/invoices/[id]/xml-cra` para exportación
- [ ] Validar XML generado contra schema oficial de CRA
- [ ] Implementar almacenamiento seguro de certificados digitales
- [ ] Crear PoC: Generar factura XML firmada que pase validador CRA

**Tareas Técnicas:**
- Investigar schema XML de CRA (GST/HST)
- Implementar librería de firma digital (crypto/node-forge)
- Crear servicio `CRAInvoiceService` en `src/lib/services/invoicing/cra.service.ts`
- Actualizar `InvoiceService` para soportar cálculos de impuestos canadienses
- Tests unitarios para validación de estructura XML
- Tests de integración con validador CRA mock

---

#### US-002: Adaptación de Data Model para Regulación Canadiense
**Como** sistema de facturación  
**Quiero** extender el modelo de datos para soportar regulaciones canadienses  
**Para** almacenar información fiscal requerida por CRA

**Criterios de Aceptación:**
- [ ] Agregar campos a `Invoice`: `taxRegion`, `gstAmount`, `hstAmount`, `craReferenceNumber`
- [ ] Crear enum `TaxRegion` con provincias/territorios canadienses
- [ ] Actualizar `Customer` con `businessNumber` (BN de CRA)
- [ ] Agregar tabla `TaxConfiguration` para tasas por región
- [ ] Migración de base de datos Prisma
- [ ] Actualizar tipos TypeScript

**Tareas Técnicas:**
- Modificar `prisma/schema.prisma`
- Crear migración: `npx prisma migrate dev --name add_cra_tax_support`
- Actualizar DTOs y Zod schemas
- Documentar cambios en `FaseCinco/DATA_MODEL_CHANGES.md`

---

### 🟡 P1 - Alto (Performance & Escalabilidad)

#### US-003: Implementación de Motor de Caché Distribuido (Redis)
**Como** sistema de alta concurrencia  
**Quiero** implementar caché Redis con políticas de invalidación inteligente  
**Para** reducir latencia en consultas frecuentes y escalar el sistema

**Criterios de Aceptación:**
- [ ] Configurar Redis (Upstash/Redis Cloud) en entorno de desarrollo
- [ ] Implementar wrapper `CacheService` con TTL configurable
- [ ] Aplicar caché a `ProductService` y `DashboardService`
- [ ] Implementar invalidación por eventos (actualización de producto/precio)
- [ ] Alcanzar hit rate > 85% en endpoints cacheados
- [ ] Monitoreo de métricas de caché (hits, misses, memory)

**Tareas Técnicas:**
- Instalar dependencias: `ioredis`, `@upstash/redis`
- Crear `src/lib/cache/redis.service.ts`
- Crear decorador `@Cacheable()` para métodos
- Implementar `CacheInvalidationStrategy` (event-driven)
- Configurar variables de entorno: `REDIS_URL`, `CACHE_TTL`
- Tests de integración para escenarios de cache/invalidation
- Documentar estrategia en `FaseCinco/CACHE_ARCHITECTURE.md`

---

#### US-004: Pipeline de Automatización de PDF (Reemplazo de Make.com)
**Como** operador del sistema  
**Quiero** procesar automáticamente PDFs de proveedores extrayendo datos estructurados  
**Para** eliminar dependencia de Make.com y mejorar precisión

**Criterios de Aceptación:**
- [ ] Implementar extracción de texto de PDF (pdf-parse o pdf.js)
- [ ] Integrar OCR/NLP para datos no estructurados (Tesseract.js o API externa)
- [ ] Crear mapeador dinámico de campos (configurable por proveedor)
- [ ] Implementar validación de datos extraídos (Zod schemas)
- [ ] Crear endpoint `/api/v1/documents/process-pdf` (upload síncrono)
- [ ] Alcanzar precisión > 95% en extracción de datos clave
- [ ] Procesar ~20 PDFs/semana sin errores

**Tareas Técnicas:**
- Crear `src/lib/services/documents/pdf-parser.service.ts`
- Crear `src/lib/services/documents/ocr.service.ts`
- Crear `src/lib/services/documents/mapper.service.ts`
- Implementar cola ligera (BullMQ o simple array en memoria)
- Crear configuración de mapeos por proveedor (JSON/YAML)
- Tests con PDFs reales de proveedores
- Documentar pipeline en `FaseCinco/PDF_OCR_PIPELINE.md`

---

#### US-005: Optimización y Refactorización de Código
**Como** equipo de desarrollo  
**Quiero** limpiar y optimizar el código existente  
**Para** mejorar mantenibilidad y performance

**Criterios de Aceptación:**
- [ ] Eliminar código duplicado (DRY principle)
- [ ] Optimizar queries Prisma (eager loading, select específicos)
- [ ] Reducir bundle size (tree-shaking, code splitting)
- [ ] Mejorar legibilidad (nombres descriptivos, comentarios)
- [ ] Refactorizar servicios monolíticos en módulos más pequeños
- [ ] Actualizar dependencias obsoletas

**Tareas Técnicas:**
- Análisis de duplicación con SonarQube o similar
- Revisión de queries N+1 en Prisma
- Configurar `next.config.js` para optimización de bundle
- Crear `REFACTORING_LOG.md` con cambios realizados
- Code review pair programming

---

### 🟢 P2 - Medio (Estabilización & Testing)

#### US-006: Aumentar Coverage de Testing a 80%
**Como** equipo de calidad  
**Quiero** alcanzar 80% de cobertura de tests  
**Para** garantizar estabilidad antes de expansión

**Criterios de Aceptación:**
- [ ] Alcanzar 80% coverage global (Lines, Branches, Functions)
- [ ] Priorizar módulos críticos (< 50% actual):
  - `api-key.service.ts` → 90%
  - `openai-client.ts` → 85%
  - `invoices/[id]/route.ts` → 85%
  - `customers/[id]/route.ts` → 85%
  - `webhooks/make/route.ts` → 80%
- [ ] Agregar tests de integración para flujos complejos
- [ ] Configurar CI/CD para ejecutar tests en cada PR

**Tareas Técnicas:**
- Crear tests unitarios para servicios críticos
- Crear tests de integración con Playwright
- Configurar GitHub Actions workflow `.github/workflows/ci.yml`
- Agregar reporte de coverage en PRs
- Documentar estrategia de testing en `FaseCinco/TESTING_STRATEGY.md`

---

#### US-007: Robustecer Agente RAG (Optimización de Contexto)
**Como** usuario del chatbot  
**Quiero** respuestas más precisas y con menos alucinaciones  
**Para** confiar en el asistente de IA

**Criterios de Aceptación:**
- [ ] Implementar re-ranking de resultados (Cross-Encoder)
- [ ] Mejorar manejo de contexto (windowing, summarization)
- [ ] Agregar fallback a búsqueda híbrida (keyword + semantic)
- [ ] Implementar detección de alucinaciones (confidence scoring)
- [ ] Reducir tasa de alucinaciones en < 5%
- [ ] Mejorar precisión de recuperación en consultas complejas

**Tareas Técnicas:**
- Integrar re-ranker (Cohere Rerank o similar)
- Implementar `ContextWindowManager` en `openai-client.ts`
- Agregar búsqueda híbrida con PostgreSQL full-text search
- Crear `HallucinationDetector` service
- Tests con dataset de consultas complejas
- Métricas de evaluación (precision, recall, F1)

---

### 🔵 P3 - Bajo (Preparación Futura)

#### US-008: Auditoría de Seguridad OWASP
**Como** equipo de seguridad  
**Quiero** auditar vulnerabilidades según OWASP Top 10  
**Para** garantizar seguridad antes de go-live

**Criterios de Aceptación:**
- [ ] Ejecutar escaneo automatizado (OWASP ZAP o Snyk)
- [ ] Revisar y mitigar vulnerabilidades críticas
- [ ] Validar headers de seguridad (CSP, HSTS, X-Frame-Options)
- [ ] Auditar manejo de secrets (environment variables)
- [ ] Revisar autenticación y autorización (JWT, RBAC)
- [ ] Documentar findings y remediation en `FaseCinco/SECURITY_AUDIT.md`

**Tareas Técnicas:**
- Configurar Snyk para escaneo de dependencias
- Ejecutar OWASP ZAP en staging
- Revisar middleware de seguridad
- Implementar rate limiting mejorado
- Crear checklist de seguridad

---

#### US-009: Configuración de Entornos Staging/Prod
**Como** equipo de DevOps  
**Quiero** configurar entornos separados de staging y producción  
**Para** validar cambios antes de go-live

**Criterios de Aceptación:**
- [ ] Configurar proyecto Vercel para staging
- [ ] Configurar base de datos Neon para staging
- [ ] Implementar Infraestructura como Código (Terraform o Pulumi)
- [ ] Configurar secrets management (Vercel Env Variables)
- [ ] Implementar blue-green deployment strategy
- [ ] Documentar arquitectura de infra en `FaseCinco/INFRASTRUCTURE.md`

**Tareas Técnicas:**
- Crear `vercel.staging.json`
- Configurar Terraform para recursos cloud
- Implementar scripts de deployment
- Configurar monitoreo (Sentry, LogRocket)
- Crear runbooks de operación

---

## Plan de Mitigación de Riesgos

### Riesgo 1: Gaps del Sprint 4 se arrastran
**Probabilidad:** Alta  
**Impacto:** Alto

**Mitigación:**
1. **Landing Page Pública:**
   - Delegar a P3 (baja prioridad técnica)
   - Crear versión MVP con contenido estático
   - Usar plantilla de shadcn/ui para acelerar desarrollo

2. **Testing Coverage (< 80%):**
   - Priorizar módulos críticos en US-006
   - Usar tests de integración para cubrir múltiples módulos rápidamente
   - Aceptar 75% como mínimo viable para Sprint 5, completar en Sprint 6

3. **Pagos (Stripe Parcial):**
   - Mantener simulación en Sprint 5
   - Priorizar integración CRA (P0) sobre Stripe
   - Planificar integración completa de Stripe para Sprint 6

4. **CI/CD Inexistente:**
   - Implementar pipeline básico en US-006
   - Configurar GitHub Actions para tests y linting
   - Dejar deployment manual para Sprint 5

### Riesgo 2: PoC de Facturación CRA falla
**Probabilidad:** Media  
**Impacto:** Crítico

**Mitigación:**
- Investigación profunda previa (semana 1)
- Crear sandbox de pruebas con XML de ejemplo
- Tener plan B: Integrar librería existente (ej. `node-ebics` o similar)
- Consultar con experto fiscal canadiense si es necesario

### Riesgo 3: CRA no valida XML generado
**Probabilidad:** Baja  
**Impacto:** Alto

**Mitigación:**
- Validar contra schema oficial desde el inicio
- Usar herramientas de validación CRA online
- Crear suite de tests con casos edge
- Documentar requisitos exactos de CRA

### Riesgo 4: Redis no mejora performance significativamente
**Probabilidad:** Baja  
**Impacto:** Medio

**Mitigación:**
- Implementar métricas desde el inicio
- A/B testing con y sin caché
- Optimizar queries antes de cachear
- Considerar estrategias de caché alternativas (CDN, edge)

### Riesgo 5: Pipeline OCR no alcanza 95% de precisión
**Probabilidad:** Media  
**Impacto:** Medio

**Mitigación:**
- Empezar con proveedores de PDFs simples
- Implementar revisión manual de resultados (human-in-the-loop)
- Usar API externa de OCR de alta calidad (Google Vision, AWS Textract)
- Crear dataset de entrenamiento con PDFs reales

### Riesgo 6: Deuda técnica acumulada afecta desarrollo
**Probabilidad:** Alta  
**Impacto:** Medio

**Mitigación:**
- Dedicar 20% de tiempo a refactorización (US-005)
- Code reviews estrictos
- Documentar deuda técnica y plan de pago
- No agregar nueva funcionalidad sin resolver deuda crítica

---

## Definition of Done (DoD) para Go-Live

### ✅ Criterios Técnicos Obligatorios

#### Backend & API
- [ ] Todos los endpoints API tienen tests unitarios (coverage > 80%)
- [ ] Todos los endpoints tienen documentación OpenAPI/Swagger
- [ ] Rate limiting configurado y probado
- [ ] Headers de seguridad implementados (CSP, HSTS, X-Frame-Options, etc.)
- [ ] Logs estructurados implementados (JSON format)
- [ ] Auditoría de eventos críticos (creación, actualización, eliminación)
- [ ] Manejo de errores centralizado con códigos HTTP apropiados
- [ ] Validación de inputs con Zod en todos los endpoints
- [ ] Timeouts configurados para todas las llamadas externas
- [ ] Retry logic implementado para servicios externos (OpenAI, Twilio, etc.)

#### Base de Datos
- [ ] Migraciones de Prisma versionadas y probadas
- [ ] Índices optimizados para queries frecuentes
- [ ] Backups automatizados configurados (diarios)
- [ ] Restore de backups probado y documentado
- [ ] Connection pooling configurado
- [ ] Queries N+1 eliminadas
- [ ] Transacciones usadas donde es necesario
- [ ] Soft delete implementado para datos sensibles

#### Caché & Performance
- [ ] Redis configurado y operativo
- [ ] Hit rate de caché > 85% en endpoints críticos
- [ ] TTL configurado apropiadamente por tipo de dato
- [ ] Invalidación de caché probada y documentada
- [ ] Métricas de caché monitoreadas
- [ ] Latencia p95 < 500ms para endpoints cacheados
- [ ] Bundle size optimizado (< 200KB gzipped)

#### Seguridad
- [ ] Auditoría OWASP completada sin vulnerabilidades críticas
- [ ] Secrets management implementado (no hardcoded secrets)
- [ ] JWT tokens con expiración y refresh tokens
- [ ] RBAC implementado y probado
- [ ] SQL injection prevenido (Prisma parameterized queries)
- [ ] XSS prevenido (sanitización de inputs, CSP)
- [ ] CSRF protection implementado
- [ ] Dependencias sin vulnerabilidades conocidas (Snyk scan)

#### Testing
- [ ] Coverage global > 80%
- [ ] Tests unitarios para todos los servicios
- [ ] Tests de integración para flujos críticos
- [ ] Tests E2E con Playwright para user journeys clave
- [ ] Tests de carga para picos de tráfico
- [ ] Tests de seguridad automatizados
- [ ] CI/CD pipeline ejecuta todos los tests automáticamente

#### Integraciones Externas
- [ ] OpenAI API: Rate limiting, fallback, error handling
- [ ] Twilio: Webhooks validados, retry logic
- [ ] CRA: XML validado, firma digital probada
- [ ] OCR Pipeline: Precisión > 95%, manejo de errores
- [ ] Make.com (legacy): Desactivado o migrado
- [ ] Webhooks: Autenticación (HMAC), idempotency

#### Frontend & UX
- [ ] Landing page pública funcional
- [ ] Dashboard responsive (mobile, tablet, desktop)
- [ ] Todos los formularios tienen validación
- [ ] Loading states implementados
- [ ] Error boundaries implementados
- [ ] Accesibilidad (WCAG 2.1 AA)
- [ ] SEO optimizado (meta tags, sitemap, robots.txt)
- [ ] Performance: Lighthouse score > 90

#### DevOps & Infraestructura
- [ ] Entornos separados: Dev, Staging, Prod
- [ ] CI/CD pipeline configurado y probado
- [ ] Blue-green deployment implementado
- [ ] Rollback automatizado en caso de fallo
- [ ] Monitoreo configurado (Sentry para errores, LogRocket para UX)
- [ ] Alerts configurados (errores críticos, downtime, performance)
- [ ] Uptime monitoring (Pingdom, UptimeRobot)
- [ ] Log aggregation (Datadog, ELK stack)
- [ ] Infraestructura como Código (Terraform/Pulumi)
- [ ] Disaster Recovery Plan documentado y probado

#### Documentación
- [ ] Arquitectura del sistema documentada (C4 models)
- [ ] API documentation completa (OpenAPI/Swagger)
- [ ] Guía de deployment actualizada
- [ ] Runbooks de operación creados
- [ ] Troubleshooting guide documentado
- [ ] Onboarding guide para nuevos desarrolladores
- [ ] Changelog mantenido

### ✅ Criterios de Negocio

#### Funcionalidad
- [ ] Todas las User Stories del Sprint completadas
- [ ] Facturación electrónica CRA funcional y validada
- [ ] Pipeline OCR procesando PDFs reales
- [ ] Caché Redis mejorando performance
- [ ] Chatbot con respuestas precisas (> 95%)
- [ ] Pagos funcionales (Stripe o CRA)

#### Calidad
- [ ] Zero bugs críticos en producción
- [ ] Zero bugs altos en producción
- [ ] < 5 bugs medios en producción
- [ ] Uptime > 99.5%
- [ ] Tiempo de respuesta < 2s (p95)
- [ ] Satisfacción de usuario > 4.5/5

#### Cumplimiento
- [ ] Regulaciones CRA cumplidas
- [ ] GDPR/CCPA compliant (si aplica)
- [ ] Terms of Service y Privacy Policy publicados
- [ ] Contratos de servicio con proveedores firmados
- [ ] Seguro de ciberseguridad contratado

### ✅ Criterios de Equipo

#### Proceso
- [ ] Code review completado para todos los PRs
- [ ] Todos los tests pasando en CI/CD
- [ ] Documentación actualizada
- [ ] Deuda técnica documentada y priorizada
- [ ] Retrospectiva de Sprint completada
- [ ] Demo de Sprint realizada con stakeholders

#### Comunicación
- [ ] Stakeholders informados del progreso
- [ ] Risks mitigados o documentados
- [ ] Decisions log mantenido
- [ ] Sprint backlog actualizado
- [ ] Daily standups realizadas

---

## Documentación a Crear en Sprint 5

1. **`SPRINT5_PLAN.md`** - Este documento
2. **`CRA_INTEGRATION_GUIDE.md`** - Guía técnica de integración CRA
3. **`CACHE_ARCHITECTURE.md`** - Arquitectura de caché Redis
4. **`PDF_OCR_PIPELINE.md`** - Pipeline de procesamiento de PDFs
5. **`DATA_MODEL_CHANGES.md`** - Cambios en modelo de datos
6. **`TESTING_STRATEGY.md`** - Estrategia de testing
7. **`SECURITY_AUDIT.md`** - Auditoría de seguridad
8. **`INFRASTRUCTURE.md`** - Infraestructura y deployment
9. **`REFACTORING_LOG.md`** - Log de refactorización
10. **`RAG_OPTIMIZATION.md`** - Optimización del agente RAG

---

## Próximos Pasos Inmediatos

1. **Crear estructura de documentación** en `DocumentacionHagoProduce/FaseCinco/`
2. **Configurar repositorio** para Sprint 5 (branch `sprint-5`)
3. **Investigación CRA** (semana 1): Requisitos técnicos, schema XML, certificados
4. **Setup Redis** (semana 1): Configuración de desarrollo, pruebas de concepto
5. **Análisis de PDFs** (semana 1): Recolección de muestras, análisis de estructura

---

**Estado:** Planificación completada. Awaiting approval para iniciar Sprint 5.