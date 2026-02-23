# FASE 2: MEJORAS Y EXTENSIONES - Tareas Detalladas

---

## RESUMEN DE TAREAS - FASE 2

**Duración:** Continuo (Q2 2026 en adelante)  
**Owner Principal:** Nadir (implementación), Arthur (auditoría en paralelo)

| ID | Tarea | Owner | Agente | Prioridad | Paralelo |
|----|-------|-------|--------|-----------|----------|
| 2.1 | Backend: Reports & Dashboards Module | Nadir | Backend Dev | Alta | Sí |
| 2.2 | Frontend: Reports UI & Charts | Nadir | Frontend Dev | Alta | Sí |
| 2.3 | Backend: Migrate Google Sheets → DB | Nadir | Backend Dev | Alta | No |
| 2.4 | Backend: Price History & Trends | Nadir | Backend Dev | Media | Sí |
| 2.5 | Frontend: Price Trends UI | Nadir | Frontend Dev | Media | Sí |
| 2.6 | Backend: External Bot API | Nadir | Backend Dev | Media | Sí |
| 2.7 | Make.com: Direct API Integration | Nadir | Automation | Alta | No |
| 2.8 | Frontend: SPA Pública | Nadir | Frontend Dev | Media | Sí |
| 2.9 | Backend: Advanced Notifications | Nadir | Backend Dev | Media | Sí |
| 2.10 | Frontend: Advanced Notifications UI | Nadir | Frontend Dev | Media | Sí |
| 2.11 | Frontend: Advanced Customer Portal | Nadir | Frontend Dev | Baja | Sí |
| 2.12 | Backend: Multi-currency Support | Nadir | Backend Dev | Baja | Sí |
| 2.13 | Frontend: Multi-currency UI | Nadir | Frontend Dev | Baja | Sí |
| 2.14 | Backend: Online Payments (Stripe) | Nadir | Backend Dev | Baja | No |
| 2.15 | Arthur: Code Review & Performance | Arthur | QA | Alta | Paralelo |
| 2.16 | Arthur: Security Audit | Arthur | Security | Alta | Paralelo |
| 2.17 | Arthur: Final Release Prep | Arthur | Architect | Alta | Paralelo |

---

## CHECKLIST DE PROGRESO

### Nadir - Fase 2
- [ ] 2.1: Backend Reports & Dashboards
- [ ] 2.2: Frontend Reports UI & Charts
- [ ] 2.3: Migrate Google Sheets → DB
- [ ] 2.4: Price History & Trends
- [ ] 2.5: Price Trends UI
- [ ] 2.6: External Bot API
- [ ] 2.7: Make.com Direct API Integration
- [ ] 2.8: SPA Pública
- [ ] 2.9: Advanced Notifications
- [ ] 2.10: Advanced Notifications UI
- [ ] 2.11: Advanced Customer Portal
- [ ] 2.12: Multi-currency Support
- [ ] 2.13: Multi-currency UI
- [ ] 2.14: Online Payments

### Arthur - Fase 2
- [ ] 2.15: Code Review & Performance
- [ ] 2.16: Security Audit
- [ ] 2.17: Final Release Prep

---

## TAREAS DETALLADAS (RESUMIDAS)

### 2.1-2.2: Reports & Dashboards
**Backend:** Endpoints para reports: invoices summary, aging, revenue, top customers/products.

**Frontend:** Dashboard con charts (Chart.js o Recharts), KPIs, filters por fecha.

**Criterios:** Reports generan datos correctos, charts renderizan, performance aceptable.

**Paralelo:** Sí

---

### 2.3: Migrate Google Sheets → DB
**Backend:** Migración de datos de Google Sheets a PostgreSQL. Script de importación, validación, merge con datos existentes.

**Criterios:** Datos migrados correctamente, sin duplicados, validación exitosa.

**NO paralelo** - migración crítica

---

### 2.4-2.5: Price History & Trends
**Backend:** Queries para historial de precios, gráficos de tendencia, alertas de cambios significativos.

**Frontend:** UI para ver historial de precios por producto-proveedor, charts de tendencia.

**Paralelo:** Sí

---

### 2.6: External Bot API
**Backend:** API pública para bots externos (WhatsApp/Telegram). Rate limiting, autenticación por API key.

**Criterios:** API funcional, rate limiting, autenticación.

**Paralelo:** Sí

---

### 2.7: Make.com Direct API Integration
**Automation:** Actualizar Make.com workflows para enviar datos directamente a API del sistema en lugar de Google Sheets.

**Criterios:** Webhook recibe datos, procesa correctamente, Google Sheets desactivado.

**NO paralelo** - migración crítica

---

### 2.8: SPA Pública
**Frontend:** Sitio web público para promover HAGO PRODUCE. Landing page, catálogo visual, información de contacto.

**Criterios:** SEO optimizado, responsive, rápido.

**Paralelo:** Sí

---

### 2.9-2.10: Advanced Notifications
**Backend:** Motor de notificaciones avanzado con recordatorios automáticos (3, 7, 14, 30 días), multi-canal (WA, Telegram, Email).

**Frontend:** UI para configurar reglas de notificaciones, templates, logs.

**Paralelo:** Sí

---

### 2.11: Advanced Customer Portal
**Frontend:** Dashboard avanzado con gráficos de compras, historial completo, descarga masiva de facturas.

**Paralelo:** Sí

---

### 2.12-2.13: Multi-currency Support
**Backend:** Soporte completo para USD, CAD, MXN con tasas de cambio automáticas.

**Frontend:** UI para seleccionar moneda, conversión en tiempo real.

**Paralelo:** Sí

---

### 2.14: Online Payments
**Backend:** Integración con Stripe para pagos online. Webhooks para actualización de estado de factura.

**Criterios:** Pagos procesan correctamente, webhook actualiza factura.

**NO paralelo** - integración compleja

---

## CRITERIOS DE ÉXITO FASE 2

- [ ] Reports y dashboards funcionales
- [ ] Google Sheets completamente migrado
- [ ] Make.com integrado directamente con API
- [ ] Bot externo funcional
- [ ] SPA pública publicada
- [ ] Notificaciones avanzadas operativas
- [ ] **SISTEMA COMPLETO Y ESCALABLE**

---

## NOTAS DE EJECUCIÓN

### Orden de Ejecución - Nadir
**Prioridad Alta:**
1. Task 2.3: Migrate Google Sheets → DB (primero)
2. Task 2.7: Make.com Direct API (después de 2.3)
3. Task 2.1 + 2.2: Reports & Dashboards (paralelo)

**Prioridad Media:**
4. Task 2.6: External Bot API
5. Task 2.4 + 2.5: Price Trends (paralelo)
6. Task 2.8: SPA Pública
7. Task 2.9 + 2.10: Advanced Notifications (paralelo)

**Prioridad Baja:**
8. Task 2.11: Advanced Customer Portal
9. Task 2.12 + 2.13: Multi-currency (paralelo)
10. Task 2.14: Online Payments

### Arthur - Paralelo
- Task 2.15: Code Review & Performance (durante desarrollo)
- Task 2.16: Security Audit (periódico)
- Task 2.17: Final Release Prep (cuando Fase 2 completada)

---

## CRITERIOS DE FINALIZACIÓN DEL PROYECTO

### ✅ Objetivos Cumplidos

1. **QuickBooks Replaced** - Antes del 01/04/2026 ✅
2. **Invoice Creation