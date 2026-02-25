# 🚀 PLAN ESTRATÉGICO SPRINT 4: PRODUCTIZACIÓN Y UX
**Estado**: Borrador (Pendiente de Aprobación)
**Fecha**: 2026-02-24
**Versión**: 1.0.0
**Agente**: Senior PM / Tech Lead

---

## 1. Resumen Ejecutivo
El **Sprint 3** consolidó exitosamente el núcleo del Backend (Chat, Email, POs, Reportes), pero dejó una deuda técnica crítica: **19 tests unitarios fallando** y una cobertura baja (~40%). Además, el Frontend Público (SPA) y las mejoras visuales del Portal Cliente (Gráficos, Descargas) siguen pendientes.

El objetivo central del **Sprint 4** es la **Productización**: estabilizar la calidad del código (tests passing), implementar la interfaz pública para captación de usuarios y enriquecer la experiencia en el portal privado.

---

## 2. Alcance del Sprint (Scope) - Priorización MoSCoW

### **Must Have** (Crítico para el éxito)
*   **S4-P03 (Calidad)**: Corregir los 19 tests unitarios fallando en `src/tests/unit/chat/`.
*   **S4-P01 (Frontend Público)**: Implementar la Landing Page (`/app/(public)/page.tsx`) con estructura básica, SEO y navegación.
*   **S4-P02 (Portal UX)**: Implementar gráficos de gastos (Chart.js) en el Dashboard del Cliente.
*   **S4-P04 (Staging)**: Configurar despliegue automático a entorno de Staging (Vercel Preview).

### **Should Have** (Importante)
*   **S4-P02-B (Descargas)**: Funcionalidad de descarga masiva de facturas en ZIP (JSZip).
*   **S4-P03-B (Cobertura)**: Aumentar la cobertura de tests unitarios al >60% (foco en `purchase-orders`).

### **Could Have** (Deseable)
*   **Modo Oscuro**: Toggle de tema en el Portal Cliente.
*   **Notificaciones Toast**: Feedback visual mejorado para acciones de usuario.

### **Won't Have** (Fuera de alcance)
*   Integración con ERPs externos.
*   App Móvil Nativa.

---

## 3. Criterios de Aceptación Técnicos (DoD)

### Frontend (SPA & Portal)
*   **Lighthouse**: Performance > 90, Accessibility > 90, SEO > 90.
*   **Responsive**: Funcional en Móvil (375px), Tablet (768px) y Desktop (1024px+).
*   **Errores**: Manejo global de errores (Error Boundary) sin pantalla blanca.

### Backend & Calidad
*   **Tests**: `npm test` debe pasar al 100% (0 fallos).
*   **Linting**: `npm run lint` sin errores ni warnings bloqueantes.
*   **Build**: `npm run build` exitoso en entorno local y CI.

---

## 4. Cronograma de Ejecución (Semana a Semana)

| Semana | Foco Principal | Entregables Clave | Responsable |
|:------:|:---------------|:------------------|:------------|
| **1** | **Calidad & SPA** | - Fix Tests Unitarios (100% Pass)<br>- Skeleton SPA Público (`/`)<br>- Configuración SEO Básica | Tech Lead / Dev |
| **2** | **Portal UX** | - Gráficos Chart.js en Dashboard<br>- Descarga Masiva ZIP<br>- Feedback Visual (Toasts) | Frontend Dev |
| **3** | **Hardening & Deploy** | - Tests de Integración (Coverage >60%)<br>- Auditoría de Seguridad Básica<br>- Deploy a Staging | DevOps / QA |

---

## 5. Gestión de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|:-------|:-------------|:--------|:-----------|
| **Deuda Técnica en Tests** | Alta | Crítico | Dedicar la **Semana 1 completa** a estabilizar la suite de tests antes de nuevas features. |
| **Complejidad Gráficos** | Media | Medio | Usar librería estándar (`chart.js` + `react-chartjs-2`) con configuración simple inicial. |
| **Despliegue Fallido** | Baja | Alto | Configurar CI/CD en GitHub Actions con validación previa de Build y Tests. |

---

## 6. Métricas de Éxito del Sprint
*   **Pass Rate Tests**: 100% (242+ tests pasando).
*   **Coverage**: > 60% Global.
*   **Lighthouse Performance**: > 90 (Mobile & Desktop).
*   **Tiempo de Carga Dashboard**: < 1.5s (LCP).

---
*Plan Estratégico generado por Trae AI basado en Auditoría Sprint 3*
