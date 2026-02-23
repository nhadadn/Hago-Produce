# Fase 2 - Roadmap de Dependencias y Prompts de Implementación
# Hago Produce - Sistema Empresarial

**Fecha:** 22 de Febrero, 2026  
**Proyecto:** Hago Produce  
**Fase:** 2 - Mejoras y Extensiones  
**Repositorio:** https://github.com/nhadadn/Hago-Produce

---

## SECCIÓN 3.2 - DIAGRAMA DE DEPENDENCIAS Y ROADMAP

### 3.2.1 Estado Actual del Proyecto

**✅ Fases Completadas:**
- **Fase 0:** Foundation, Setup, CI/CD, Wireframes
- **Fase 1A:** Auth, Users, Dashboard básico
- **Fase 1B:** Facturación completa, Productos, Suppliers, Precios

**⚠️ Fase Parcial:**
- **Fase 1C:** Chat/Agente backend implementado (40%) - Falta frontend completo

**🚧 Pendientes Fase 2:**
- Reports & Dashboards
- Migración Google Sheets → DB
- Bot Externo (WhatsApp/Telegram)
- SPA Pública
- Portal de Cliente avanzado
- Notificaciones proactivas
- Integraciones con Make.com
- Sistema de facturación inteligente con bot

---

### 3.2.2 Diagrama de Dependencias Técnicas

```
Fase 2 - Arquitectura de Dependencias

═══════════════════════════════════════════════════════════════════
🏗️ CAPA INFRAESTRUCTURA (Base - DEBE SER PRIMERO)
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│ 1. INFRAESTRUCURA & CORE (Semana 1-2)                          │
├─────────────────────────────────────────────────────────────────┤
│ [A] Prisma Schema Extensions                                    │
│     ├── Model Notification (para notificaciones)                │
│     ├── Model Message (para chat y bots)                        │
│     ├── Model WebhookLog (para Make.com tracking)               │
│     ├── Model BotApiKey (para bot externo API)                  │
│     └── Model ReportCache (para cache de reportes)              │
│                                                                  │
│ [B] Security & Authentication Improvements                      │
│     ├── Rate limiting global (Redis o in-memory)                │
│     ├── Middleware protection robusto                           │
│     ├── API key rotation system                                 │
│     └── Enhanced role-based access control                      │
│                                                                  │
│ [C] Database Migrations                                         │
│     ├── Migraciones para nuevos modelos                         │
│     ├── Índices adicionales para queries de reportes            │
│     └── Data validation scripts                                 │
│                                                                  │
│ DEPENDEN DE: Nada (base del sistema)                            │
│ BLOQUEAN: Todos los demás componentes                           │
│ PRIORIDAD: 🔴🔴🔴 CRÍTICA                                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
═══════════════════════════════════════════════════════════════════
🤖 CAPA AGENTE CONVERSACIONAL (NÚCLEO CENTRAL - PRIORIDAD MÁXIMA)
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│ 2. AGENTE CONVERSACIONAL (Chatbot) - Semana 2-4                 │
├─────────────────────────────────────────────────────────────────┤
│ [A] Backend Chat Service (Extensión Fase 1C)                    │
│     ├── Intent detection mejorado (ML-based o NLP)              │
│     ├── Context management (conversaciones multi-turno)          │
│     ├── Memory system (recuerda interacciones previas)          │
│     ├── Proactive suggestions (sugerencias inteligentes)        │
│     └── Invoice creation workflow via chat                      │
│                                                                  │
│ [B] Frontend Chat UI Component                                   │
│     ├── Floating assistant widget (integrado en todas las páginas)│
│     ├── Chat interface moderna y responsive                     │
│     ├── Voice input/output (speech-to-text, text-to-speech)     │
│     ├── Rich text responses (formatting, links, actions)        │
│     └── Integration con sistema de notificaciones               │
│                                                                  │
│ [C] Chat Integration Points                                      │
│     ├── Dashboard admin (asistente para equipo interno)          │
│     ├── Portal cliente (asistente para clientes)                │
│     ├── Creación de facturas (flujo conversacional)             │
│     ├── Consultas de precios (real-time)                        │
│     └── Reportes y KPIs (visualización vía chat)                │
│                                                                  │
│ DEPENDEN DE: Infraestructura [1A-1C]                            │
│ BLOQUEAN: Reports, Bot Externo, Facturación Inteligente         │
│ PRIORIDAD: 🔴🔴🔴🔴 MÁXIMA (COMPONENTE CENTRAL)                  │
│                                                                  │
│ NOTA: Este es el COMPONENTE MÁS CRÍTICO del proyecto. Debe ser   │
│       potente, actual y comparable a CLIP de WORD pero mejor.   │
│       Funciona como asistente en vivo para equipo interno y     │
│       clientes.                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
═══════════════════════════════════════════════════════════════════
🔄 CAPA INTEGRACIONES EXTERNAS (Migraciones y Webhooks)
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│ 3. MIGRACIÓN INTEGRACIONES (Semana 3-5)                         │
├─────────────────────────────────────────────────────────────────┤
│ [A] Google Sheets Migration                                      │
│     ├── Google Sheets API client implementation                  │
│     ├── Data mapping & validation schemas                       │
│     ├── Migration script con dry-run mode                       │
│     ├── Data verification post-migration                        │
│     └── Rollback plan y error handling                          │
│                                                                  │
│ [B] QuickBooks Integration                                       │
│     ├── QuickBooks API client (OAuth2)                          │
│     ├── Bidirectional sync (invoices, payments, customers)       │
│     ├── Webhook handlers para QuickBooks events                  │
│     └── Reconciliation engine (conciliación de datos)           │
│                                                                  │
│ [C] Make.com Webhook Integration                                 │
│     ├── Public webhook endpoint (/api/v1/webhooks/make)         │
│     ├── Payload validation con Zod                              │
│     ├── Idempotency handling                                    │
│     ├── Retry logic con exponential backoff                     │
│     ├── Queue system para procesar webhooks                     │
│     └── WebhookLog tracking en DB                               │
│                                                                  │
│ DEPENDEN DE: Infraestructura [1A-1C], Agente [2A-2C]           │
│ BLOQUEAN: Reports, Bot Externo, Facturación Inteligente         │
│ PRIORIDAD: 🔴🔴🔴 CRÍTICA (Make.com expertise requerido)          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
═══════════════════════════════════════════════════════════════════
📊 CAPA ANALYTICS & REPORTS (Dashboards y KPIs)
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│ 4. REPORTES AVANZADOS (Semana 4-7)                              │
├─────────────────────────────────────────────────────────────────┤
│ [A] Reports Backend Service                                      │
│     ├── KPIs aggregation service                                │
│     ├── Revenue metrics (monthly, yearly, YoY)                  │
│     ├── Aging report (buckets de vencimiento)                   │
│     ├── Top performers (customers, products, suppliers)          │
│     ├── Price trends & volatility analysis                      │
│     └── Customer segmentation & insights                        │
│                                                                  │
│ [B] Reports API Endpoints                                        │
│     ├── POST /api/v1/reports/kpi                                │
│     ├── POST /api/v1/reports/revenue                            │
│     ├── POST /api/v1/reports/aging                              │
│     ├── POST /api/v1/reports/top                                │
│     └── POST /api/v1/reports/price-trends                       │
│                                                                  │
│ [C] Reports Frontend Components                                  │
│     ├── Dashboard principal con KPI cards                        │
│     ├── Interactive charts (Recharts/Chart.js)                  │
│     ├── Date range filters con presets                          │
│     ├── Drill-down capabilities (click to detail)               │
│     ├── Export to PDF/CSV buttons                               │
│     └── Report scheduling & email delivery                      │
│                                                                  │
│ [D] Customer Portal Reports                                      │
│     ├── Customer-specific dashboard                              │
│     ├── Invoice history & status                                │
│     ├── Payment tracking                                        │
│     └── Budget vs actual comparison                             │
│                                                                  │
│ DEPENDEN DE: Infraestructura [1A-1C], Agente [2A-2C],           │
│           Integraciones [3A-3C]                                  │
│ BLOQUEAN: Bot Externo, Facturación Inteligente                  │
│ PRIORIDAD: 🔴🔴 ALTA                                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
═══════════════════════════════════════════════════════════════════
🤖 CAPA BOT EXTERNO (WhatsApp/Telegram)
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│ 5. BOT EXTERNO MULTICANAL (Semana 5-8)                          │
├─────────────────────────────────────────────────────────────────┤
│ [A] Bot API Key Management                                      │
│     ├── Secure API key generation (UUID + timestamp)            │
│     ├── Key rotation mechanism                                  │
│     ├── Rate limiting por key                                   │
│     └── Key usage analytics                                     │
│                                                                  │
│ [B] Public Bot API Endpoints                                     │
│     ├── POST /api/v1/bot/query (query service)                  │
│     ├── Rate limiting por IP/key                                │
│     ├── Authentication via API key                              │
│     └── Response caching (TTL configurable)                     │
│                                                                  │
│ [C] WhatsApp Business Integration                                │
│     ├── Twilio WhatsApp API client                              │
│     ├── Webhook handler para incoming messages                  │
│     ├── Outgoing message queue                                  │
│     ├── Template messages para notificaciones                   │
│     └── Message status tracking                                 │
│                                                                  │
│ [D] Telegram Bot Integration                                     │
│     ├── Telegram Bot API client                                 │
│     ├── Webhook setup & verification                            │
│     ├── Command handlers (/start, /help, /status, etc.)        │
│     ├── Inline keyboards para interacciones                     │
│     └── Rich media messages support                             │
│                                                                  │
│ [E] Bot Business Logic                                           │
│     ├── Consultas de precios a proveedores                       │
│     ├── Sugerencias de precios a clientes                        │
│     ├── Creación de facturas vía chat                           │
│     ├── Status updates (facturas, pagos)                        │
│     ├── Proactive notifications (vencimientos, promociones)    │
│     └── Multi-language support (ES/EN)                          │
│                                                                  │
│ [F] Bot Dashboard UI                                             │
│     ├── Bot monitoring dashboard                                │
│     ├── Message logs & analytics                                │
│     ├── Bot performance metrics                                 │
│     └── Manual message override                                │
│                                                                  │
│ DEPENDEN DE: Infraestructura [1A-1C], Agente [2A-2C],           │
│           Integraciones [3A-3C], Reports [4A-4D]                │
│ BLOQUEAN: Facturación Inteligente, Notificaciones Proactivas    │
│ PRIORIDAD: 🔴🔴 ALTA                                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
═══════════════════════════════════════════════════════════════════
🌐 CAPA PORTAL PÚBLICO & CLIENTE
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│ 6. SPA PÚBLICA & PORTAL CLIENTE (Semana 5-8)                    │
├─────────────────────────────────────────────────────────────────┤
│ [A] Public SPA Structure                                         │
│     ├── Landing page institucional                              │
│     ├── SEO optimization (meta tags, sitemap, robots.txt)       │
│     ├── Responsive design (mobile-first)                        │
│     ├── Performance optimization (lazy loading, caching)        │
│     └── Analytics integration (Google Analytics)                │
│                                                                  │
│ [B] Customer Portal Auth                                          │
│     ├── Login con TaxID + password                              │
│     ├── JWT tokens para clientes                                 │
│     ├── Role-based access (CUSTOMER only)                       │
│     ├── Data isolation (solo ven sus datos)                     │
│     └── Password reset flow                                      │
│                                                                  │
│ [C] Customer Portal Dashboard                                    │
│     ├── KPIs personalizados (facturas pendientes, total pagado)  │
│     ├── Invoice list con filtros                                │
│     ├── Invoice detail view                                     │
│     ├── PDF download capability                                 │
│     ├── Payment history                                         │
│     └── Chat assistant integration                              │
│                                                                  │
│ [D] Advanced Customer Features                                   │
│     ├── Budget tracking                                          │
│     ├── Payment scheduling                                      │
│     ├── Invoice dispute workflow                                │
│     ├── Document upload (comprobantes, contratos)               │
│     └── Communication center (mensajes, notificaciones)          │
│                                                                  │
│ DEPENDEN DE: Infraestructura [1A-1C], Agente [2A-2C],           │
│           Reports [4A-4D]                                       │
│ BLOQUEAN: Nada (paralelo con Bot Externo)                       │
│ PRIORIDAD: 🟡 MEDIA                                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
═══════════════════════════════════════════════════════════════════
📝 CAPA FACTURACIÓN INTELIGENTE
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│ 7. FACTURACIÓN INTELIGENTE (Semana 8-10)                        │
├─────────────────────────────────────────────────────────────────┤
│ [A] Chat-based Invoice Creation                                  │
│     ├── Natural language invoice creation                      │
│     ├── AI-powered line item suggestions                       │
│     ├── Automatic pricing lookup                               │
│     ├── Customer selection via chat                            │
│     └── Invoice preview & approval workflow                    │
│                                                                  │
│ [B] Smart Invoice Features                                       │
│     ├── Recurring invoices automation                           │
│     ├── Invoice templates (customizable)                        │
│     ├── Bulk invoice generation                                 │
│     ├── Email notifications automáticas                         │
│     └── Payment reminders (3, 7, 14 días antes)                │
│                                                                  │
│ [C] Invoice Analytics                                            │
│     ├── Revenue forecasting                                     │
│     ├── Customer payment patterns                               │
│     ├── Invoice aging analysis                                 │
│     └── Product profitability analysis                          │
│                                                                  │
│ [D] Integration with Bot Externo                                 │
│     ├── Invoice creation via WhatsApp                           │
│     ├── Invoice creation via Telegram                           │
│     ├── Status updates via bot                                 │
│     └── Payment collection via bot                              │
│                                                                  │
│ DEPENDEN DE: Infraestructura [1A-1C], Agente [2A-2C],           │
│           Integraciones [3A-3C], Reports [4A-4D],               │
│           Bot Externo [5A-5F]                                   │
│ BLOQUEAN: Nada (feature avanzada)                               │
│ PRIORIDAD: 🟡 MEDIA                                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
═══════════════════════════════════════════════════════════════════
🔔 CAPA NOTIFICACIONES PROACTIVAS
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│ 8. NOTIFICACIONES PROACTIVAS (Semana 9-11)                      │
├─────────────────────────────────────────────────────────────────┤
│ [A] Notification Engine                                           │
│     ├── Trigger system (events-based)                           │
│     ├── Channel management (Email, WhatsApp, Telegram)          │
│     ├── Template system (customizable templates)                │
│     ├── Priority queues (urgent vs normal)                     │
│     └── Retry mechanism con exponential backoff                 │
│                                                                  │
│ [B] Notification Types                                           │
│     ├── Invoice status changes                                  │
│     ├── Payment confirmations                                   │
│     ├── Overdue reminders                                       │
│     ├── Price alerts (cambios significativos)                   │
│     ├── New product announcements                               │
│     └── System maintenance alerts                               │
│                                                                  │
│ [C] User Preferences                                             │
│     ├── Channel selection (Email, WhatsApp, Telegram)          │
│     ├── Frequency settings                                      │
│     ├── Timezone preferences                                    │
│     └── Opt-out management                                      │
│                                                                  │
│ [D] Notification Dashboard UI                                    │
│     ├── Notification history                                    │
│     ├── Template management                                     │
│     ├── Trigger configuration                                   │
│     └── Analytics (delivery rates, open rates, click rates)    │
│                                                                  │
│ DEPENDEN DE: Infraestructura [1A-1C], Agente [2A-2C],           │
│           Integraciones [3A-3C], Reports [4A-4D],               │
│           Bot Externo [5A-5F], SPA [6A-6D]                      │
│ BLOQUEAN: Nada (feature avanzada)                               │
│ PRIORIDAD: 🟢 BAJA (nice to have)                               │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
```

---

### 3.2.3 Orden de Implementación Recomendado

**Fase 1: Foundation & Core (Semana 1-2) - 🔴 CRÍTICO**

```
Orden Secuencial:
1. Infraestructura [1A] - Prisma Schema Extensions
2. Infraestructura [1B] - Security & Authentication Improvements  
3. Infraestructura [1C] - Database Migrations

Justificación:
- Base técnica fundamental para todos los demás componentes
- Sin esto, no se puede implementar nada más
- Cambios en schema afectan todo el sistema, deben ser primero
- Security improvements deben estar antes de exponer APIs públicas

Riesgos Mitigados:
- Data integrity issues
- Security vulnerabilities
- Technical debt accumulation
- Blocking future development

Tiempo Estimado: 2 semanas
Equipo: 2 developers (Backend + DevOps)
```

---

**Fase 2: Agente Conversacional (Semana 2-4) - 🔴🔴🔴 MÁXIMA PRIORIDAD**

```
Orden Secuencial:
4. Agente [2A] - Backend Chat Service (Extensión)
5. Agente [2B] - Frontend Chat UI Component
6. Agente [2C] - Chat Integration Points

Justificación:
- COMPONENTE CENTRAL DEL PROYECTO
- Bloquea: Reports, Bot Externo, Facturación Inteligente
- Requiere time para entrenar y refinar NLP/ML models
- Early feedback de stakeholders critical
- UI component reusable en múltiples páginas

Riesgos Mitigados:
- Misalignment con requisitos de negocio
- Poor user experience
- Technical debt en chat architecture
- Integration issues con otros módulos

Tiempo Estimado: 3 semanas
Equipo: 2 developers (Backend + Frontend) + 1 ML Engineer (optional)
```

---

**Fase 3: Integraciones Externas (Semana 3-5) - 🔴 CRÍTICO**

```
Orden Secuencial:
7. Integraciones [3A] - Google Sheets Migration
8. Integraciones [3B] - QuickBooks Integration
9. Integraciones [3C] - Make.com Webhook Integration

Justificación:
- Elimina dependencias externas críticas (Google Sheets)
- Habilita sincronización bidireccional en tiempo real
- Make.com expertise disponible - priorizar esto
- Data quality essential para reports y analytics
- Bot externo depende de datos migrados

Riesgos Mitigados:
- Data loss durante migración
- Inconsistencies entre sistemas
- Single points of failure (Google Sheets)
- Costos de QuickBooks API
- Make.com integration failures

Tiempo Estimado: 3 semanas (paralelo con Fase 2 desde semana 3)
Equipo: 2 developers (Backend + Integration Specialist)
```

---

**Fase 4: Reports & Analytics (Semana 4-7) - 🔴 ALTA**

```
Orden Secuencial:
10. Reports [4A] - Reports Backend Service
11. Reports [4B] - Reports API Endpoints
12. Reports [4C] - Reports Frontend Components
13. Reports [4D] - Customer Portal Reports

Justificación:
- Requiere datos migrados (Fase 3)
- Critical para business intelligence
- Customer portal depende de reports personalizados
- Agente conversacional usa reports para insights
- Performance critical - caching es key

Riesgos Mitigados:
- Poor performance con datasets grandes
- Incorrect KPI calculations
- Data visualization issues
- User experience problems

Tiempo Estimado: 4 semanas
Equipo: 2 developers (Backend + Frontend) + 1 Data Engineer
```

---

**Fase 5: Bot Externo Multicanal (Semana 5-8) - 🔴 ALTA**

```
Orden Secuencial:
14. Bot [5A] - Bot API Key Management
15. Bot [5B] - Public Bot API Endpoints
16. Bot [5C] - WhatsApp Business Integration
17. Bot [5D] - Telegram Bot Integration
18. Bot [5E] - Bot Business Logic
19. Bot [5F] - Bot Dashboard UI

Justificación:
- Requiere agente conversacional funcional (Fase 2)
- Requiere reports para consultas (Fase 4)
- Integración compleja con APIs externas
- Business logic depende de datos migrados
- Proactive notifications workflow

Riesgos Mitigados:
- API rate limiting issues
- Message delivery failures
- Poor user experience en bots
- Security vulnerabilities en API pública
- Integration issues con WhatsApp/Telegram

Tiempo Estimado: 4 semanas (paralelo con Fase 6 desde semana 5)
Equipo: 2 developers (Backend + Integration) + 1 Bot Specialist
```

---

**Fase 6: SPA Pública & Portal Cliente (Semana 5-8) - 🟡 MEDIA**

```
Orden Secuencial:
20. SPA [6A] - Public SPA Structure
21. SPA [6B] - Customer Portal Auth
22. SPA [6C] - Customer Portal Dashboard
23. SPA [6D] - Advanced Customer Features

Justificación:
- Paralelo a Bot Externo (no dependencies directas)
- Requiere reports backend (Fase 4)
- SEO optimization importante desde el inicio
- Customer retention depende de portal UX
- Accessibility requirements

Riesgos Mitigados:
- Poor SEO ranking
- Security issues en customer portal
- Poor user experience
- Accessibility compliance issues
- Performance problems

Tiempo Estimado: 4 semanas
Equipo: 2 developers (Frontend + UX)
```

---

**Fase 7: Facturación Inteligente (Semana 8-10) - 🟡 MEDIA**

```
Orden Secuencial:
24. Facturación [7A] - Chat-based Invoice Creation
25. Facturación [7B] - Smart Invoice Features
26. Facturación [7C] - Invoice Analytics
27. Facturación [7D] - Integration with Bot Externo

Justificación:
- Feature avanzada - nice to have
- Requiere todos los componentes previos completos
- Complex workflow - requiere testing exhaustivo
- Integration con bot externo para automation
- Business value alto pero no blocking

Riesgos Mitigados:
- Poor invoice creation UX
- Incorrect calculations
- Integration failures con bot
- Data inconsistency

Tiempo Estimado: 3 semanas
Equipo: 2 developers (Backend + Frontend)
```

---

**Fase 8: Notificaciones Proactivas (Semana 9-11) - 🟢 BAJA**

```
Orden Secuencial:
28. Notificaciones [8A] - Notification Engine
29. Notificaciones [8B] - Notification Types
30. Notificaciones [8C] - User Preferences
31. Notificaciones [8D] - Notification Dashboard UI

Justificación:
- Feature avanzada - puede posponerse
- Nice to have para customer experience
- No blocking para core functionality
- Requiere todos los componentes previos
- Complexity en template system

Riesgos Mitigados:
- Spam de notificaciones
- Poor delivery rates
- User opt-out
- Technical complexity

Tiempo Estimado: 3 semanas
Equipo: 1 developer (Backend)
```

---

### 3.2.4 Timeline Visual

```
Fase 2 - Timeline de Implementación (10-11 semanas totales)

Semana 1  Semana 2  Semana 3  Semana 4  Semana 5  Semana 6  Semana 7  Semana 8  Semana 9  Semana 10 Semana 11
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ [1]     │ [1]     │ [2]     │ [2]     │ [3]     │ [3]     │ [4]     │ [4]     │ [5]     │ [7]     │ [8]     │
│ Infra   │ Infra   │ Agente  │ Agente  │ Integ   │ Integ   │ Reports │ Reports │ Bot     │ Fact    │ Notif   │
│         │         │         │         │         │         │         │         │         │         │         │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│         │ [2]     │ [2]     │ [3]     │ [3]     │ [4]     │ [4]     │ [5]     │ [5]     │ [7]     │ [8]     │
│         │ Agente  │ Agente  │ Integ   │ Integ   │ Reports │ Reports │ Bot     │ Bot     │ Fact    │ Notif   │
│         │         │         │         │         │         │         │         │         │         │         │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│         │         │ [3]     │ [3]     │ [4]     │ [4]     │ [5]     │ [5]     │ [6]     │ [7]     │         │
│         │         │ Integ   │ Integ   │ Reports │ Reports │ Bot     │ Bot     │ SPA     │ Fact    │         │
│         │         │         │         │         │         │         │         │         │         │         │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

Leyenda:
[1] = Infraestructura & Core (Foundation)
[2] = Agente Conversacional (Chatbot) - PRIORIDAD MÁXIMA
[3] = Integraciones Externas (Google Sheets, QuickBooks, Make.com)
[4] = Reports & Analytics
[5] = Bot Externo Multicanal (WhatsApp/Telegram)
[6] = SPA Pública & Portal Cliente
[7] = Facturación Inteligente
[8] = Notificaciones Proactivas

Notas:
- Las barras verticales indican desarrollo activo
- Los componentes pueden overlap en semanas específicas
- El Agente Conversacional es el componente más crítico y prioritario
- Las Integraciones Externas son críticas y requieren Make.com expertise
```

---

### 3.2.5 Dependencias Críticas y Bloqueantes

**🔴 CRÍTICAS - Bloquean progreso significativo:**

1. **Infraestructura [1A-1C] → Todo**
   - **Impacto:** Sin esto, nada puede ser implementado
   - **Mitigación:** Priorizar como Fase 1, dedicar recursos senior
   - **Risk:** High - Technical debt accumulation

2. **Agente [2A-2C] → Reports, Bot Externo, Facturación**
   - **Impacto:** Componente central, bloquea múltiples features
   - **Mitigación:** Priorizar como Fase 2, ML engineer support
   - **Risk:** High - Misalignment con requisitos

3. **Integraciones [3A-3C] → Reports, Bot Externo**
   - **Impacto:** Data quality essential para analytics y bots
   - **Mitigación:** Make.com expert dedicado, dry-run mode
   - **Risk:** Critical - Data loss, inconsistency

4. **Reports [4A-4D] → Bot Externo, Portal Cliente**
   - **Impacto:** Bot queries dependen de reports, Portal necesita KPIs
   - **Mitigación:** Data engineer support, caching strategy
   - **Risk:** Medium - Performance issues

**🟡 IMPORTANTES - Bloquean features específicas:**

5. **Bot Externo [5A-5F] → Facturación Inteligente**
   - **Impacto:** Facturación conversacional depende de bot externo
   - **Mitigación:** Bot specialist, comprehensive testing
   - **Risk:** Medium - Integration issues

6. **Portal [6A-6D] → Customer Experience**
   - **Impacto:** Customer retention depende de portal UX
   - **Mitigación:** UX designer focus, accessibility testing
   - **Risk:** Low - Can be iterated post-launch

---

### 3.2.6 Riesgos Potenciales y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Data loss durante migración Google Sheets** | Media | Crítico | - Implementar dry-run mode<br>- Backup completo antes de migrar<br>- Rollback plan detallado<br>- Validación post-migración automatizada<br>- Data verification scripts |
| **Performance issues en reportes con datasets grandes** | Alta | Alto | - Implementar paginación en todas las queries<br>- Caching agresivo con Redis<br>- Agregaciones en DB, no en backend<br>- Índices adicionales en Prisma<br>- Query optimization y profiling |
| **Agente conversacional no cumple expectativas** | Media | Crítico | - Early MVP y feedback loops<br>- A/B testing de responses<br>- Human-in-the-loop para training<br>- Fallback mechanisms robustos<br>- Continuous monitoring y retraining |
| **Make.com integration failures** | Media | Alto | - Idempotency handling<br>- Retry con exponential backoff<br>- Queue system para webhooks<br>- Comprehensive logging<br>- Circuit breakers para API failures |
| **Bot externo API abuse/DDoS** | Alta | Alto | - Rate limiting agresivo por IP/key<br>- API key rotation automática<br>- Rate limit aware de tiers<br>- CAPTCHA cuando sea apropiado<br>- Monitoring de suspicious activity |
| **Costos de OpenAI descontrolados** | Media | Alto | - Caching de respuestas repetidas<br>- Prompt optimization para reducir tokens<br>- Rate limiting por usuario<br>- Cost monitoring en tiempo real<br>- Fallback a modelos más baratos |
| **Security vulnerabilities en APIs públicas** | Media | Crítico | - Input validation exhaustiva (Zod)<br>- Output sanitization<br>- SQL injection prevention<br>- XSS prevention<br>- Regular security audits<br>- Penetration testing |
| **QuickBooks API changes/breaking** | Baja | Medio | - Abstracción en service layer<br>- Version pinning de APIs<br>- Integration testing automatizado<br>- Monitoring de API status<br>- Fallback mechanisms |
| **SEO no optimizado en SPA pública** | Media | Medio | - Server Components para contenido crítico<br>- Meta tags dinámicos<br>- Sitemap y robots.txt<br>- Performance optimization<br>- Accessibility compliance |
| **Customer portal poor UX** | Media | Medio | - User testing temprano<br>- Accessibility audit<br>- Mobile-first responsive design<br>- Performance monitoring<br>- Feedback loops |
| **Facturación conversacional errors** | Media | Alto | - Comprehensive testing unit/integration/E2E<br>- Human review workflow<br>- Audit trail de todas las acciones<br>- Rollback capability<br>- Error handling robusto |
| **Notification spam** | Media | Medio | - User preferences enforcement<br>- Rate limiting por usuario<br>- Opt-out mechanisms<br>- Content approval workflows<br>- Analytics de engagement |

---

### 3.2.7 Recomendaciones Estratégicas

**1. Priorizar Agente Conversacional como Componente Central**
- Es el "brain" del sistema
- Bloquea múltiples features
- Requiere más tiempo para refinar
- Early feedback crítico

**2. Make.com Expertise como Ventaja Competitiva**
- Dedicar Integration Specialist a Fase 3
- Crear reusable Make.com modules
- Documentar best practices
- Training para equipo

**3. Testing como Prioridad No-Negotiable**
- Unit tests: ≥80% coverage
- Integration tests: All APIs
- E2E tests: Critical workflows
- Performance tests: Reports, Bot
- Security tests: All public endpoints

**4. Security First Approach**
- Implementar security improvements primero
- Regular security audits
- Penetration testing pre-deploy
- OAuth2 para integraciones
- Rate limiting en todo

**5. Data Quality Foundation**
- Google Sheets migration con validación
- Reconciliation engine para QuickBooks
- Data governance policies
- Regular data integrity checks
- Backup y disaster recovery

**6. User Experience Focus**
- Early prototyping de UI components
- User testing iterativo
- Accessibility compliance (WCAG 2.1)
- Performance monitoring
- Analytics de user behavior

**7. Scalability from Day One**
- Caching strategy (Redis)
- Database indexing strategy
- API rate limiting
- Horizontal readiness
- CDN para assets

**8. Observability & Monitoring**
- Logging estructurado (JSON)
- Metrics (Prometheus/Grafana)
- Tracing (OpenTelemetry)
- Alerts proactivos
- APM (Datadog/New Relic)

---