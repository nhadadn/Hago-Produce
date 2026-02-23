# 📋 Plan de Ejecución Recalibrado - Hago Produce Fase 2

## 📊 Estado Actual del Proyecto (Recalibrado)

### Métricas Actualizadas

| Componente | Objetivo | Actual | Gap | Estado |
|------------|----------|--------|-----|---------|
| Modelos DB Completos | 5/5 | 3/5 | -2 | 🔴 Crítico |
| Admin UI Funcional | 100% | 0% | -100% | 🔴 Crítico |
| Sistema Notificaciones | 100% | 30% | -70% | 🔴 Crítico |
| Chat UI Completa | 100% | 40% | -60% | 🟡 Alto |
| Coverage Tests | >80% | ~40% | -40% | 🟡 Medio |
| Performance Queries | <2s | Variable | Optimizable | 🟢 Bajo |

### Prompts por Estado

**✅ Completados (12/31 - 38.7%)**
- Phase 1: Infrastructure & Core (3/3)
- Phase 2: Conversational Agent (3/3) - Backend completo
- Phase 3: External Integrations (3/3)
- Phase 4: Reports & Analytics (4/4)

**⚠️ Parciales/Críticos (3/31 - 9.7%)**
- [INFRA-01] Modelos DB faltantes (Notification, ReportCache)
- [BOT-01] Admin UI para API Keys
- [CHAT-02] FloatingChatAssistant component

**⏳ Pendientes (16/31 - 51.6%)**
- Phase 5: External Bot (2 prompts parciales)
- Phase 6: Public SPA & Portal (4 prompts)
- Phase 7: Intelligent Invoicing (4 prompts)
- Phase 8: Proactive Notifications (4 prompts)
- Tests y validación final (2 prompts)

### Estado del Repositorio

- **Branch:** main
- **Último Commit:** Phase 1B completado
- **Repository:** https://github.com/nhadadn/Hago-Produce
- **Estado:** Listo para Sprint de Consolidación

---

## 🎯 Estrategia de Ejecución Recalibrada

### Principios Rectores

1. **Pausar avance de nuevas fases** hasta completar gaps críticos
2. **Priorizar estabilidad sobre funcionalidad** para evitar technical debt
3. **Implementación incremental** con rollback inmediato disponible
4. **Testing continuo** para detectar problemas early
5. **Documentación en tiempo real** de cambios y validaciones

### Timeline Recalibrado: 10 Días Hábiles

```
Día 1: ████████████ Fundamentos de Datos (INFRA-01)
Día 2: ████████████ Admin UI (BOT-01)
Día 3: ████████████ Chat Universal (CHAT-02)
Día 4: ████████████ Google Sheets (INT-01)
Día 5: ████████████ QuickBooks (INT-02)
Día 6: ████████████ Make.com (INT-03) + Validación
Día 7: ████████████ UI/UX Final (SPA)
Día 8: ████████████ UI/UX Final (Portal)
Día 9: ████████████ Deploy Staging
Día 10: ████████████ E2E Testing + Documentación
```

---

## 📋 Sprint 1: Consolidación Crítica (Días 1-3)

### 🔴 Día 1: Fundamentos de Datos - [INFRA-01]

#### Objetivo
Implementar modelos faltantes de base de datos para desbloquear funcionalidades críticas.

#### Tareas Específicas

1. **Implementar Modelo Notification**
   ```prisma
   model Notification {
     id        String   @id @default(cuid())
     userId    String
     user      User     @relation(fields: [userId], references: [id])
     type      String   // INFO, WARNING, ERROR, SUCCESS
     title     String
     message   String
     isRead    Boolean  @default(false)
     createdAt DateTime @default(now())
     readAt    DateTime?
     
     @@index([userId])
     @@index([isRead])
   }
   ```

2. **Implementar Modelo ReportCache**
   ```prisma
   model ReportCache {
     id          String   @id @default(cuid())
     reportType  String   // REVENUE, AGING, TOP_PERFORMERS
     parameters  String   // JSON string with filter parameters
     data        String   // JSON string with cached data
     expiresAt   DateTime
     createdAt   DateTime @default(now())
     
     @@index([reportType])
     @@index([expiresAt])
   }
   ```

3. **Validar Referencias en Código Existente**
   - Buscar imports de `Notification` y `ReportCache`
   - Verificar que todos los servicios que los usen están actualizados
   - Validar relaciones con otros modelos

4. **Crear Migración**
   ```bash
   npx prisma migrate dev --name add_notification_and_reportcache
   ```

5. **Ejecutar en Development**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

6. **Verificación**
   - Validar que los modelos existen en DB
   - Probar seed de datos de prueba
   - Verificar relaciones y foreign keys

#### Puntos de Control
- ✅ Modelos creados en schema.prisma
- ✅ Migración generada sin errores
- ✅ Tablas creadas en base de datos
- ✅ Índices validados
- ✅ Relaciones funcionales

#### Rollback Plan
```bash
# Si hay problemas, revertir migración
npx prisma migrate resolve --rolled-back [migration-name]
git checkout HEAD~1 -- prisma/schema.prisma
```

#### Tiempo Estimado: 6 horas

---

### 🔴 Día 2: Admin UI para API Keys - [BOT-01]

#### Objetivo
Crear interfaz administrativa para gestión de API Keys de bots externos.

#### Tareas Específicas

1. **Crear Página de Administración**
   - Ruta: `/admin/bot-api-keys`
   - Componente: `BotApiKeyManagement`
   - Acceso: Solo roles ADMIN

2. **Funcionalidades CRUD**
   - Listar todas las API Keys
   - Crear nueva API Key
   - Editar detalles (name, description)
   - Revocar API Key
   - Ver historial de uso

3. **Validaciones**
   - Nombre obligatorio (3-50 caracteres)
   - Descripción opcional (máx 200 caracteres)
   - Rate limiting configurable
   - Fecha de expiración opcional

4. **UI Components**
   ```tsx
   // Lista de API Keys con tabla
   <BotApiKeyTable />
   
   // Modal para crear/editar
   <BotApiKeyModal />
   
   // Confirmación para revocar
   <BotApiKeyRevokeConfirm />
   
   // Stats de uso
   <BotApiKeyUsageStats />
   ```

5. **Integración con Backend**
   - API Endpoints ya existentes:
     - `GET /api/bot/keys`
     - `POST /api/bot/keys`
     - `PUT /api/bot/keys/:id`
     - `DELETE /api/bot/keys/:id`
   - Manejo de errores
   - Loading states

6. **Features Adicionales**
   - Filtro por estado (active/revoked)
   - Búsqueda por nombre
   - Export a CSV
   - Indicador de health check

#### Puntos de Control
- ✅ Página creada en `/admin/bot-api-keys`
- ✅ CRUD completo funcional
- ✅ Validaciones implementadas
- ✅ API integration working
- ✅ Tests de UI pasados

#### Rollback Plan
- El backend ya existe, solo es rollback de UI
- Borrar rutas y componentes creados
- Git revert del frontend

#### Tiempo Estimado: 8 horas

---

### 🟡 Día 3: Chat Universal - [CHAT-02]

#### Objetivo
Implementar componente flotante de chat accesible desde cualquier página.

#### Tareas Específicas

1. **Crear Componente FloatingChatAssistant**
   ```tsx
   // components/chat/FloatingChatAssistant.tsx
   interface Props {
     position?: 'bottom-right' | 'bottom-left'
     theme?: 'light' | 'dark'
     initialOpen?: boolean
   }
   ```

2. **Funcionalidades del Chat**
   - Toggle open/close con animación
   - Input de texto con auto-resize
   - Historial de conversación en sesión
   - Indicador de "typing" del bot
   - Botón para cerrar conversación

3. **Integración con Backend**
   - API Endpoint existente: `/api/chat`
   - Context management con session ID
   - Manejo de errores y retry
   - Streaming de respuestas (si aplica)

4. **Features del Asistente**
   ```tsx
   // Sugerencias proactivas
   <QuickSuggestions suggestions={[
     "Ver reporte de ventas",
     "Crear factura nueva",
     "Consultar precios"
   ]} />
   
   // Historial persistente
   <ChatHistory />
   
   // Context-aware
   <ContextIndicator context={currentContext} />
   ```

5. **Styling y UX**
   - Floating button con icono de chat
   - Animación suave al abrir/cerrar
   - Responsive design
   - Tema configurable
   - Accesibilidad (ARIA labels)

6. **Integración Global**
   ```tsx
   // app/layout.tsx o _app.tsx
   <FloatingChatAssistant 
     position="bottom-right"
     theme="light"
     initialOpen={false}
   />
   ```

#### Puntos de Control
- ✅ Componente creado e integrado globalmente
- ✅ Chat funcional con backend
- ✅ Sugerencias proactivas working
- ✅ Historial persistente
- ✅ Responsive y accessible
- ✅ Tests de integración pasados

#### Rollback Plan
- Remover componente global de layout
- Borrar archivos de componentes
- Git revert del frontend

#### Tiempo Estimado: 8 horas

---

## 📋 Sprint 2: Integraciones Externas (Días 4-6)

### 🔴 Día 4: Google Sheets Migration - [INT-01]

#### Objetivo
Completar migración de datos desde Google Sheets a base de datos nativa.

#### Tareas Específicas

1. **Configurar Google Sheets API**
   - Credenciales OAuth2 en `.env`
   - Service account con permisos
   - Sheet ID en environment variables

2. **Implementar ETL Pipeline**
   ```typescript
   // services/migration/googleSheetsETL.ts
   class GoogleSheetsETL {
     async extract(): Promise<any[]>
     async transform(data: any[]): Promise<any[]>
     async load(data: any[]): Promise<void>
     async validate(): Promise<boolean>
   }
   ```

3. **Mapeo de Columnas**
   - Sheet columns → DB columns
   - Type conversions
   - Default values
   - Validation rules

4. **Validación de Datos**
   - Check de registros duplicados
   - Validación de campos requeridos
   - Normalización de formatos
   - Data quality checks

5. **Migración de Datos Históricos**
   - Export desde Sheets
   - Transformación
   - Import a DB
   - Verificación de count

6. **Conflict Resolution**
   - Estrategia para conflictos
   - Logging de discrepancias
   - Manual review interface

#### Puntos de Control
- ✅ Google Sheets API configurada
- ✅ ETL pipeline implementado
- ✅ Datos migrados sin errores
- ✅ Validaciones pasadas
- ✅ Conflictos resueltos

#### Rollback Plan
- Backup de DB antes de migración
- Script de rollback para revertir cambios
- Restaurar desde backup si falla

#### Tiempo Estimado: 8 horas

---

### 🔴 Día 5: QuickBooks Integration - [INT-02]

#### Objetivo
Implementar integración bidireccional con QuickBooks para sincronización de facturas y pagos.

#### Tareas Específicas

1. **Configurar QuickBooks OAuth2**
   ```typescript
   // services/quickbooks/oauth.ts
   const oauthConfig = {
     clientId: process.env.QB_CLIENT_ID,
     clientSecret: process.env.QB_CLIENT_SECRET,
     redirectUri: process.env.QB_REDIRECT_URI,
     environment: 'sandbox' // o 'production'
   }
   ```

2. **Implementar OAuth Flow**
   - Endpoint de autorización
   - Callback handler
   - Token refresh logic
   - Token storage seguro

3. **Sincronización de Facturas**
   ```typescript
   // services/quickbooks/sync.ts
   class QuickBooksSync {
     async syncInvoice(invoiceId: string): Promise<void>
     async syncPayment(paymentId: string): Promise<void>
     async syncAll(): Promise<SyncReport>
     async reconcile(): Promise<ReconciliationReport>
   }
   ```

4. **Bidirectional Sync**
   - Hago Produce → QuickBooks (push)
   - QuickBooks → Hago Produce (pull)
   - Webhooks de QuickBooks
   - Queue system para sync async

5. **Reconciliation Engine**
   - Detectar discrepancias
   - Auto-resolver conflictos simples
   - Flag para revisión manual
   - Logs detallados

6. **Error Handling**
   - Retry logic con exponential backoff
   - Dead letter queue
   - Alertas para errores críticos
   - Monitoring dashboard

#### Puntos de Control
- ✅ OAuth flow funcional
- ✅ Sync de invoices working
- ✅ Sync de payments working
- ✅ Reconciliation engine operativo
- ✅ Error handling robusto

#### Rollback Plan
- Desactivar sync en config
- Limpiar tokens OAuth
- Restaurar DB desde backup pre-sync
- Revertir cambios de código

#### Tiempo Estimado: 8 horas

---

### 🔴 Día 6: Make.com Webhook Integration - [INT-03]

#### Objetivo
Mejorar integración con Make.com webhooks con validación, idempotencia y retry logic.

#### Tareas Específicas

1. **Implementar Webhook Receiver**
   ```typescript
   // services/webhooks/makeWebhookHandler.ts
   class MakeWebhookHandler {
     async validatePayload(payload: any): Promise<boolean>
     async isDuplicate(eventId: string): Promise<boolean>
     async processEvent(event: WebhookEvent): Promise<void>
     async retryFailedEvent(eventId: string): Promise<void>
   }
   ```

2. **Payload Validation**
   - Schema validation
   - Required fields check
   - Type validation
   - Signature verification

3. **Idempotency**
   - Event ID tracking
   - Deduplication logic
   - Idempotency keys
   - Idempotency repository

4. **Retry Logic**
   ```typescript
   // services/webhooks/retryQueue.ts
   class RetryQueue {
     maxRetries: 3
     backoffStrategy: 'exponential' | 'linear'
     async enqueue(event: WebhookEvent): Promise<void>
     async process(): Promise<void>
   }
   ```

5. **Webhook Logging**
   - Table: `WebhookLog`
   - Status tracking (received, processed, failed)
   - Error logging
   - Audit trail

6. **Testing**
   - Unit tests para validación
   - Integration tests para endpoints
   - E2E tests para flow completo
   - Load testing para performance

#### Puntos de Control
- ✅ Webhook receiver implementado
- ✅ Validación working
- ✅ Idempotency funcional
- ✅ Retry logic operativo
- ✅ Logging completo
- ✅ Tests pasados

#### Rollback Plan
- Revertir cambios de webhook handler
- Limpiar cola de retry
- Restaurar versión anterior

#### Tiempo Estimado: 6 horas

---

## 📋 Sprint 3: Finalización (Días 7-10)

### 🟡 Día 7-8: UI/UX Final - Phase 6

#### Objetivo
Completar componentes pendientes de SPA Pública y Portal de Clientes.

#### Tareas Específicas

**Día 7: SPA Pública**
1. Landing page completa
2. Feature showcases
3. Pricing section
4. Contact form
5. SEO optimization

**Día 8: Portal de Clientes**
1. Dashboard del cliente
2. Invoice viewer
3. Payment history
4. Profile management
5. Notification center

#### Puntos de Control
- ✅ SPA responsive y funcional
- ✅ Portal de clientes completo
- ✅ Tests de UI pasados
- ✅ Accessibility audit passed

#### Tiempo Estimado: 16 horas (8 horas/día)

---

### 🟡 Día 9: Deploy Staging

#### Objetivo
Desplegar a staging y realizar validación completa.

#### Tareas Específicas

1. **Pre-deploy Checklist**
   - ✅ Todos los tests pasando
   - ✅ Coverage >80%
   - ✅ Linter sin errores
   - ✅ Type checking passed
   - ✅ Environment variables configuradas
   - ✅ Database migrations listas
   - ✅ Assets optimizados

2. **Build Process**
   ```bash
   npm run build
   npm run test:prod
   ```

3. **Deploy a Staging**
   - Push a branch `staging`
   - CI/CD pipeline
   - Database migrations
   - Health checks

4. **Post-deploy Validation**
   - Health endpoint check
   - Smoke tests
   - Performance tests
   - Security scan

#### Puntos de Control
- ✅ Build exitoso
- ✅ Deploy completado
- ✅ Health checks OK
- ✅ Smoke tests pasados
- ✅ Performance aceptable

#### Rollback Plan
- Script de deploy rollback
- Backup de DB pre-deploy
- Revertir a versión anterior

#### Tiempo Estimado: 6 horas

---

### 🟡 Día 10: E2E Testing + Documentación

#### Objetivo
Validación final del sistema y documentación de cambios.

#### Tareas Específicas

1. **E2E Testing**
   ```bash
   npm run test:e2e
   ```
   - Critical user flows
   - Integraciones externas
   - Performance benchmarks
   - Security validation

2. **Performance Validation**
   - Query response times <2s
   - Page load times <3s
   - API response times <200ms
   - Memory usage estable

3. **Security Audit**
   - Vulnerability scan
   - Dependency audit
   - Auth flow testing
   - Rate limiting validation

4. **Documentación Final**
   - Actualizar README
   - Documentar nuevos endpoints
   - Diagramas actualizados
   - Deployment guide
   - Troubleshooting guide

5. **Handoff Documentation**
   - Guía de administración
   - Onboarding para equipo
   - Known issues
   - Next steps

#### Puntos de Control
- ✅ E2E tests pasando
- ✅ Performance validada
- ✅ Security audit passed
- ✅ Documentación completa
- ✅ Handoff listo

#### Tiempo Estimado: 8 horas

---

## 🎯 Checklist de Validación por Sprint

### Sprint 1: Consolidación Crítica

- [ ] [INFRA-01] Modelos Notification y ReportCache creados
- [ ] [INFRA-01] Migración ejecutada sin errores
- [ ] [INFRA-01] Relaciones validadas
- [ ] [BOT-01] Admin UI para API Keys funcional
- [ ] [BOT-01] CRUD completo y validado
- [ ] [CHAT-02] FloatingChatAssistant implementado
- [ ] [CHAT-02] Chat integrado globalmente
- [ ] [CHAT-02] Sugerencias proactivas working

### Sprint 2: Integraciones Externas

- [ ] [INT-01] Google Sheets API configurada
- [ ] [INT-01] ETL pipeline funcional
- [ ] [INT-01] Datos migrados y validados
- [ ] [INT-02] QuickBooks OAuth flow working
- [ ] [INT-02] Sync de invoices funcional
- [ ] [INT-02] Reconciliation engine operativo
- [ ] [INT-03] Webhook receiver mejorado
- [ ] [INT-03] Idempotency implementada
- [ ] [INT-03] Retry logic operativo
- [ ] Validación de integraciones completa

### Sprint 3: Finalización

- [ ] SPA Pública completa
- [ ] Portal de clientes funcional
- [ ] Deploy a staging exitoso
- [ ] E2E tests pasando
- [ ] Performance validada
- [ ] Security audit passed
- [ ] Documentación completa
- [ ] Handoff listo

---

## ⚠️ Mitigación de Riesgos

### Riesgo 1: Complejidad de Integración
**Mitigación:** Implementación incremental con testing continuo

### Riesgo 2: Data Loss en Migración
**Mitigación:** Backups antes de cada operación crítica

### Riesgo 3: Performance Degradation
**Mitigación:** Caching con ReportCache, índices optimizados

### Riesgo 4: Security Vulnerabilities
**Mitigación:** Security audit, rate limiting, input validation

### Riesgo 5: Dependencies Break
**Mitigación:** Version locking, regular updates, fallbacks

---

## 📊 Métricas de Éxito

### Técnicas
- Coverage de tests >80%
- Query response times <2s
- API response times <200ms
- Page load times <3s
- Zero critical bugs

### de Negocio
- Tiempo de implementación ≤10 días
- Zero downtime en deploy
- 100% de funcionalidades documentadas
- 95%+ de user satisfaction en UAT

---

## 🚀 Próximos Pasos

1. **Iniciar Sprint 1 - Día 1** con [INFRA-01]
2. **Validar cada día** con puntos de control
3. **Documentar cambios** en tiempo real
4. **Comunicar progreso** diariamente
5. **Preparar rollback** para cada cambio crítico

---

## 📞 Puntos de Contacto

- **Repository:** https://github.com/nhadadn/Hago-Produce
- **Branch:** main → feature/sprint-consolidation
- **Documentation:** `/workspace/ESTADO_PROYECTO_FASE2.md`
- **Prompts:** `/workspace/FASE2_PROMPTS_IMPLEMENTACION.md`

---

**Fecha de Recalibración:** 2024
**Próxima Revisión:** Post-Sprint 1 (Día 3)
**Estado:** ✅ Plan Validado - Listo para Ejecución