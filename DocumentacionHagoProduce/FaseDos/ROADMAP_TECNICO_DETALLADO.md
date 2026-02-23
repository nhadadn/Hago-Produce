# 🗺️ ROADMAP TÉCNICO: Fase 2 - Hago Produce

**Proyecto:** Hago Produce  
**Fase:** 2 (Transformación y Escalamiento)  
**Período:** Q2 2026 (8-12 semanas)  
**Documento:** Roadmap técnico con dependencias y estimaciones  

---

## 📊 Visión General

### Objetivos de la Fase 2
1. **📊 Analytics Completo:** Transformar datos en insights accionables
2. **🔄 Independencia de Datos:** Migrar de Google Sheets a DB propia
3. **🤖 Automatización Proactiva:** Bot externo para comunicación
4. **🌐 Presencia Pública:** Landing page institucional

### Métricas de Éxito
- **Performance:** <2s para reportes complejos
- **Seguridad:** 0 vulnerabilidades críticas
- **Disponibilidad:** 99.9% uptime
- **Escalabilidad:** Soporte para 10x usuarios actuales

---

## 📅 CRONOGRAMA DETALLADO

### 🔴 FASE CRÍTICA 1: Seguridad y Estabilidad (Semanas 1-2)
**Dependencias:** Ninguna  
**Bloqueantes para:** Todo el resto del proyecto

#### Semana 1: Seguridad Core
```
Día 1-2: Middleware de Seguridad Completo
├─ Implementar protección por roles (ADMIN, ACCOUNTING, MANAGEMENT, CUSTOMER)
├─ Agregar verificación de tokens JWT en todas las rutas
├─ Implementar logs de acceso no autorizado
└─ Tests de middleware con diferentes escenarios

Día 3-4: Rate Limiting Global
├─ Implementar rate limiting con Redis (100 req/min IP, 500 req/min user)
├─ Agregar headers de rate limit (X-RateLimit-*)
├─ Implementar circuit breaker para servicios externos
└─ Tests de rate limiting y DDoS protection

Día 5: Token Refresh System
├─ Completar endpoint /api/v1/auth/refresh
├─ Implementar rotación de tokens
├─ Agregar blacklist de tokens revocados
└─ Tests de refresh token flow
```

#### Semana 2: Protección de Datos
```
Día 1-2: Input Sanitization & CSRF
├─ Crear utilidad de sanitización en src/lib/utils/sanitization.ts
├─ Aplicar a todos los endpoints POST/PUT/DELETE
├─ Implementar CSRF tokens en todos los formularios
└─ Tests de seguridad (SQL injection, XSS, CSRF)

Día 3-4: Webhook Security
├─ Implementar verificación de firmas para webhooks
├─ Rate limiting específico para webhooks
├─ Validación de origen de webhooks
└─ Tests de seguridad de webhooks

Día 5: Performance Optimization I
├─ Fix queries N+1 en invoices y products
├─ Implementar paginación en todos los endpoints
├─ Agregar índices de base de datos necesarios
└─ Performance testing y benchmarks
```

### 🔴 FASE CRÍTICA 2: Completar Fase 1C (Semanas 3-4)
**Dependencias:** Seguridad completa  
**Bloqueantes para:** Bot notifications, Customer portal

#### Semana 3: Chat System Completo
```
Día 1-2: Chat UI Frontend
├─ Crear src/app/(admin)/chat/page.tsx
├─ Implementar ChatInterface con mensajes en tiempo real
├─ Integrar con backend existente de chat
├─ Agregar indicadores de typing y estado
└─ Responsive design y mobile optimization

Día 3-4: Chat History & Persistence
├─ Crear modelo ChatHistory en Prisma
├─ Implementar endpoint para guardar historial
├─ Agregar paginación de historial
├─ Implementar búsqueda en historial
└─ Tests de chat functionality

Día 5: Chat Enhancements
├─ Mejorar detección de intenciones
├─ Agregar nuevos intents (order_status, payment_history)
├─ Implementar sugerencias de respuesta
└─ Tests de precisión de intenciones
```

#### Semana 4: Notifications & Customer Portal
```
Día 1-2: Notification Engine
├─ Crear modelo Notification en Prisma
├─ Implementar src/lib/services/notifications/engine.ts
├─ Sistema de colas para procesamiento asíncrono
├─ Templates de notificación reutilizables
└─ Tests de notification system

Día 3-4: Customer Portal Auth
├─ Modificar login para aceptar TaxID
├─ Implementar verificación de TaxID
├─ Generar tokens específicos para clientes
├─ Implementar session management para clientes
└─ Tests de autenticación de clientes

Día 5: Customer Dashboard
├─ Crear src/app/(portal)/customer/dashboard/page.tsx
├─ Métricas: total gastado, facturas pendientes, órdenes recientes
├─ Gráficos de gastos mensuales con Recharts
├─ Vista de facturas con filtros y descarga PDF
└─ Responsive design para portal
```

### 🔴 FASE CRÍTICA 3: Reportes & Analytics (Semanas 5-6)
**Dependencias:** Base de datos optimizada, seguridad completa  
**Bloqueantes para:** Decisiones de negocio, KPI tracking

#### Semana 5: Backend de Reportes
```
Día 1-2: Reports Backend Service
├─ Crear src/lib/services/reports/index.ts (servicio principal)
├─ Implementar getRevenueMetrics() con agregaciones
├─ Implementar getAgingReport() con buckets de vencimiento
├─ Optimizar queries para <2s con 10k+ registros
└─ Tests de performance de reportes

Día 3-4: KPI y Analytics Services
├─ getTopCustomers() ordenado por revenue
├─ getTopProducts() por cantidad y revenue
├─ getProductPriceTrends() con análisis temporal
├─ Implementar caché en memoria (TTL 5-15 min)
└─ Tests de precisión de datos

Día 5: Export Service
├─ Implementar exportación a PDF con jspdf-autotable
├─ Exportación a CSV con csv-stringify
├─ Formato profesional con logos y branding
└─ Tests de export functionality
```

#### Semana 6: Frontend de Reportes
```
Día 1-2: API Endpoints
├─ POST /api/v1/reports/revenue con validación Zod
├─ POST /api/v1/reports/aging con filtros flexibles
├─ POST /api/v1/reports/top/customers y /products
├─ POST /api/v1/reports/export/pdf y /csv
└─ Tests de API con diferentes escenarios

Día 3-4: Reports UI Framework
├─ Crear src/app/(admin)/reports/ estructura completa
├─ Componente DateRangePicker con presets comunes
├─ ReportCard para métricas individuales
├─ ExportButton con opciones PDF/CSV
└─ Responsive layout para reportes

Día 5: Visualizaciones y Dashboards
├─ Integrar Recharts para gráficos interactivos
├─ Revenue Dashboard con tendencias comparativas
├─ Aging Report con gráfico de distribución
├─ Drill-down functionality
└─ Tests de visualizaciones
```

---

## 📊 ESTIMACIONES DETALLADAS

### Estimación por Complejidad

| Complejidad | Días | Ejemplos | Buffer Sugerido |
|-------------|------|----------|------------------|
| **🔴 Alta** | 3-4 días | Middleware completo, Reportes backend | +50% |
| **🟡 Media** | 1-2 días | API endpoints, UI components | +25% |
| **🟢 Baja** | 0.5-1 día | Configuraciones, tests simples | +10% |

### Estimación por Módulo

| Módulo | Semanas | Story Points | Riesgos Principales |
|--------|---------|--------------|-------------------|
| **Seguridad** | 2 | 40 | Complejidad de implementación |
| **Fase 1C** | 2 | 35 | Integración con sistema existente |
| **Reportes** | 2 | 45 | Performance con grandes datasets |
| **Sheets Migration** | 2 | 30 | Calidad de datos existentes |
| **Bot Externo** | 2 | 35 | APIs externas y rate limits |
| **SPA Pública** | 2 | 25 | SEO y performance optimization |
| **Testing** | Paralelo | 20 | Cobertura completa |
| **Documentación** | Paralelo | 15 | Mantener actualizada |

**Total:** 12 semanas / 245 story points

---

## ⚠️ ANÁLISIS DE RIESGOS

### Riesgos Críticos (🔴)

#### Riesgo 1: Performance de Reportes
- **Probabilidad:** Alta
- **Impacto:** Alto
- **Mitigación:** 
  - Implementar agregaciones en base de datos
  - Usar caché agresivamente
  - Optimizar queries con índices
  - Considerar materialized views

#### Riesgo 2: Calidad de Datos en Migración
- **Probabilidad:** Media
- **Impacto:** Alto
- **Mitigación:**
  - Validación exhaustiva antes de migración
  - Scripts de limpieza de datos
  - Proceso de resolución de conflictos
  - Backup completo antes de ejecutar

#### Riesgo 3: APIs Externas (WhatsApp/Telegram)
- **Probabilidad:** Media
- **Impacto:** Medio
- **Mitigación:**
  - Implementar circuit breakers
  - Fallback a canales alternativos
  - Rate limiting respetuoso
  - Monitoreo constante de APIs

---

## 🎯 CRITERIOS DE ACEPTACIÓN POR FASE

### Fase 1: Seguridad ✅
- [ ] 0 vulnerabilidades críticas en security scan
- [ ] 100% endpoints protegidos por auth y rate limiting
- [ ] CSRF protection en todos los formularios
- [ ] Input sanitization en todos los endpoints
- [ ] Token refresh funcionando sin interrupciones

### Fase 2: Performance ✅
- [ ] <2s tiempo de respuesta para reportes complejos
- [ ] 0 queries N+1 en codebase
- [ ] Paginación implementada en todos los listados
- [ ] Caché hit rate >80% para datos frecuentes
- [ ] Componentes memoizados donde sea beneficioso

### Fase 3: Fase 1C Completa ✅
- [ ] Chat UI funcional con mensajes en tiempo real
- [ ] Notification engine procesando colas sin backlog
- [ ] Customer portal con autenticación por TaxID
- [ ] Dashboard de cliente con métricas actualizadas
- [ ] Webhooks de notificaciones externos funcionando

### Fase 4: Reportes ✅
- [ ] Todos los reportes generando datos correctos
- [ ] Exportación PDF/CSV funcionando
- [ ] Visualizaciones interactivas con drill-down
- [ ] Caché de reportes implementado
- [ ] Performance <2s con datasets de producción

### Fase 5: Migración ✅
- [ ] 100% de datos migrados sin pérdida
- [ ] 0 conflictos sin resolver
- [ ] Validación de integridad completa
- [ ] Incremental sync funcionando
- [ ] Backup y rollback testeados

### Fase 6: Bot y SPA ✅
- [ ] WhatsApp y Telegram bots respondiendo
- [ ] Rate limiting respetando límites externos
- [ ] Landing page con Core Web Vitals buenos
- [ ] SEO optimization implementado
- [ ] Analytics y conversion tracking activo

---

**Documento aprobado:** 22 de Febrero, 2026  
**Próxima revisión:** Semanal (cada lunes)  
**Responsable:** Tech Lead  
**Stakeholders:** Development Team, Product Owner, Management