# 🚀 PLAN ESTRATÉGICO SPRINT 4: PRODUCTIZACIÓN Y UX
## Hago Produce | Fase 2 → Staging Ready

**Estado**: Borrador — Pendiente Aprobación  
**Fecha**: 2026-02-24  
**Autor**: Tech Lead / Senior PM  
**Branch objetivo**: `feature/sprint4-productizacion`  
**Commit base**: `2120c74` (Sprint 2 closure + Sprint 3 prompts)

---

## 1. RESUMEN EJECUTIVO

### 1.1 Estado Actual del Proyecto

El proyecto Hago Produce ha completado exitosamente las fases de infraestructura (Sprints 1-3), con un backend sólido que incluye: sistema de facturación, chat conversacional con RAG, integraciones Make.com/Twilio/WhatsApp, notificaciones automáticas y reportes. Sin embargo, el análisis del repositorio revela **3 brechas críticas** que bloquean el lanzamiento a Staging:

| Dimensión | Estado Actual | Objetivo Sprint 4 | Gap |
|-----------|--------------|-------------------|-----|
| **Frontend Público** | Placeholder básico (`page.tsx` con slate-50) | Landing Page institucional con Design System | 🔴 Crítico |
| **Portal Cliente UX** | Funcional pero sin gráficos ni descarga masiva | Dashboard con Chart.js + JSZip | 🟡 Alto |
| **Calidad / Tests** | ~40% coverage, intents test sin mock OpenAI | >80% coverage, 0 tests fallando | 🔴 Crítico |
| **Design System** | CSS variables genéricas (shadcn defaults) | Tokens de marca Hago Produce integrados | 🟡 Alto |
| **CI/CD** | Sin pipeline de staging | Vercel Preview + GitHub Actions | 🟡 Alto |

### 1.2 Riesgos Principales

1. **🔴 CRÍTICO**: Tests de `analyzeIntent` requieren mock de OpenAI API — sin esto, CI falla en cada push
2. **🔴 CRÍTICO**: `globals.css` usa variables HSL genéricas de shadcn — Design Tokens de marca NO están integrados
3. **🟡 ALTO**: Portal cliente carece de gráficos interactivos (Chart.js no instalado)
4. **🟡 ALTO**: No existe manejo de errores global en Frontend (Error Boundaries, 404, 500)
5. **🟢 MEDIO**: SPA pública sin SEO básico (meta tags, Open Graph, sitemap)

### 1.3 Objetivo del Sprint 4

Transformar Hago Produce de un sistema funcional a un **producto productizable**, integrando el Design System de marca, completando la UX del portal cliente, y dejando el sistema listo para un deploy en Staging con CI/CD configurado.

---

## 2. ALCANCE DEL SPRINT (SCOPE)

### 2.1 Priorización MoSCoW

#### 🔴 MUST HAVE (Bloqueantes para Staging)

| ID | Historia de Usuario | Criterio de Éxito |
|----|--------------------|--------------------|
| **S4-P00** | Como Dev, necesito integrar los Design Tokens de marca en `globals.css` y `tailwind.config.ts` | CSS variables con colores Hago Produce, WCAG AA |
| **S4-P01-A** | Como Dev QA, necesito que todos los tests pasen al 100% | 0 tests fallando, mocks de OpenAI configurados |
| **S4-P01-B** | Como Dev QA, necesito coverage >80% en módulos críticos | Jest coverage report >80% en chat, notifications, reports |
| **S4-P02** | Como visitante, quiero ver una Landing Page profesional | LCP <2.5s, Lighthouse >90, SEO básico |
| **S4-P03** | Como cliente, quiero ver gráficos de mi facturación | Chart.js integrado, datos reales de API |

#### 🟡 SHOULD HAVE (Alta Prioridad)

| ID | Historia de Usuario | Criterio de Éxito |
|----|--------------------|--------------------|
| **S4-P04** | Como cliente, quiero descargar múltiples facturas en ZIP | JSZip funcional, descarga <5s para 10 facturas |
| **S4-P05** | Como usuario, quiero ver estados de carga (Skeletons) | Skeleton components en todas las tablas y cards |
| **S4-P06** | Como Dev, necesito CI/CD con deploy a Staging | GitHub Actions + Vercel Preview URL por PR |

#### 🟢 COULD HAVE (Si el tiempo lo permite)

| ID | Historia de Usuario | Criterio de Éxito |
|----|--------------------|--------------------|
| **S4-P07** | Como visitante, quiero ver Open Graph tags para compartir | og:title, og:description, og:image configurados |
| **S4-P08** | Como admin, quiero ver métricas de uso del chatbot | Dashboard con sesiones activas, intents más usados |
| **S4-P09** | Como usuario, quiero manejo de errores global | Error Boundary, páginas 404/500 personalizadas |

#### ⚫ WON'T HAVE (Sprint 5)

- Integración QuickBooks completa
- App móvil nativa
- Multi-tenancy
- Internacionalización completa (i18n)

---

## 3. CRITERIOS DE ACEPTACIÓN TÉCNICOS

### 3.1 Definition of Done (DoD) — Frontend

```
✅ Componente renderiza sin errores en dev y build
✅ Design Tokens de Hago Produce aplicados (no shadcn defaults)
✅ Responsive: mobile (375px), tablet (768px), desktop (1280px)
✅ Estados implementados: loading (skeleton), error (toast), empty (empty state)
✅ Core Web Vitals: LCP < 2.5s, CLS < 0.1, FID < 100ms
✅ Contraste WCAG AA verificado (Primary-800 #2E7D32 sobre White = 5.2:1 ✅)
✅ Test unitario o de integración cubriendo happy path + error path
✅ No hay console.error en producción
```

### 3.2 Definition of Done (DoD) — Backend

```
✅ Endpoint responde en < 500ms (p95)
✅ Validación de inputs con Zod
✅ Manejo de errores con códigos HTTP correctos
✅ Audit log registrado para acciones críticas
✅ Rate limiting aplicado
✅ Test de integración cubriendo happy path + edge cases
✅ Sin secrets hardcodeados
```

### 3.3 Definition of Done (DoD) — QA

```
✅ Coverage total > 80% (jest --coverage)
✅ 0 tests fallando en CI
✅ E2E Playwright pasa en Chromium, Firefox y WebKit
✅ No hay warnings de TypeScript (strict mode)
✅ ESLint sin errores
✅ Build de producción exitoso (next build)
```

### 3.4 Criterios por Historia de Usuario

#### S4-P00: Design System Integration

**Happy Path:**
- Developer ejecuta `npm run dev` y ve la UI con colores Hago Produce (verde #2E7D32, ámbar #FF6F00)
- Todos los botones primarios usan `bg-hago-primary-800`
- Sidebar usa `bg-hago-primary-900` con texto blanco

**Edge Cases:**
- Dark mode: variables CSS se adaptan correctamente
- High contrast mode: ratios WCAG AA mantenidos

**UI/UX:**
- Transición suave entre colores (no flash de colores incorrectos)
- Favicon actualizado con identidad de marca

#### S4-P01: Tests & Coverage

**Happy Path:**
- `npm test` ejecuta y pasa 100% de tests
- `npm run test:coverage` muestra >80% en módulos críticos

**Edge Cases:**
- Tests de `analyzeIntent` usan mock de OpenAI (no llaman API real)
- Tests de notificaciones mockean Twilio y Telegram
- Tests de Make.com webhook usan payloads de ejemplo

**Performance:**
- Suite completa de tests corre en < 60 segundos

#### S4-P02: Landing Page

**Happy Path:**
- Visitante llega a `/` y ve landing page profesional con:
  - Hero section con propuesta de valor
  - Features section (Facturación, Chat IA, Reportes, Multi-canal)
  - CTA hacia portal admin y portal cliente
  - Footer con información de contacto

**Edge Cases:**
- Sin JavaScript: página renderiza con SSR (Next.js)
- Conexión lenta: LCP < 2.5s con imágenes optimizadas (next/image)
- Mobile: layout responsive sin overflow horizontal

**UI/UX:**
- Skeleton loader durante hidratación
- Animaciones sutiles (no trendy, enterprise-grade)
- SEO: title, description, og:tags configurados

#### S4-P03: Portal Charts

**Happy Path:**
- Cliente ve dashboard con:
  - Gráfico de barras: facturación mensual (últimos 6 meses)
  - Gráfico donut: distribución por estado (PAID/SENT/OVERDUE)
  - KPI cards con tendencias (↑↓ vs mes anterior)

**Edge Cases:**
- Sin datos: empty state con mensaje amigable
- Error de API: toast de error + retry button
- Datos parciales: gráfico renderiza con datos disponibles

**Performance:**
- Chart.js cargado con dynamic import (no bloquea LCP)
- Datos cacheados en cliente por 5 minutos

#### S4-P04: Descarga Masiva ZIP

**Happy Path:**
- Cliente selecciona múltiples facturas → click "Descargar ZIP"
- Progreso visible (barra de progreso o spinner)
- ZIP descargado con PDFs nombrados correctamente

**Edge Cases:**
- 0 facturas seleccionadas: botón deshabilitado
- Error en generación de PDF: toast de error específico
- Timeout (>30s): mensaje de error con opción de reintentar

---

## 4. CRONOGRAMA DE EJECUCIÓN (SEMANA A SEMANA)

### Semana 1 (Días 1-5): Fundamentos — Design System + Tests

| Día | Prompt ID | Tarea | Responsable | Entregable |
|-----|-----------|-------|-------------|------------|
| 1 | **S4-P00** | Integrar Design Tokens en globals.css + tailwind.config.ts | Frontend Dev | CSS variables de marca activas |
| 1-2 | **S4-P01-A** | Fix tests fallando: mocks OpenAI, Twilio, Telegram | QA Dev | 0 tests fallando |
| 2-3 | **S4-P01-B** | Elevar coverage a >80% en módulos críticos | QA Dev | Coverage report >80% |
| 3-4 | **S4-P02-A** | Landing Page: estructura, hero, features | Frontend Dev | `/` con contenido real |
| 4-5 | **S4-P02-B** | Landing Page: SEO, performance, animaciones | Frontend Dev | Lighthouse >90 |
| 5 | **S4-CP1** | Checkpoint Semana 1 | Tech Lead | Aprobación stakeholder |

### Semana 2 (Días 6-10): Portal UX — Gráficos + Descarga

| Día | Prompt ID | Tarea | Responsable | Entregable |
|-----|-----------|-------|-------------|------------|
| 6 | **S4-P03-A** | Instalar Chart.js + componentes base de gráficos | Frontend Dev | ChartWrapper component |
| 6-7 | **S4-P03-B** | Dashboard cliente: gráfico barras + donut + KPIs | Frontend Dev | Dashboard con datos reales |
| 7-8 | **S4-P04** | Descarga masiva ZIP con JSZip | Full Stack Dev | ZIP funcional |
| 8-9 | **S4-P05** | Skeleton loaders en todas las vistas | Frontend Dev | UX sin flashes de contenido |
| 9-10 | **S4-P09** | Error Boundary + páginas 404/500 | Frontend Dev | Manejo de errores global |
| 10 | **S4-CP2** | Checkpoint Semana 2 | Tech Lead | Aprobación stakeholder |

### Semana 3 (Días 11-15): CI/CD + Staging Deploy

| Día | Prompt ID | Tarea | Responsable | Entregable |
|-----|-----------|-------|-------------|------------|
| 11 | **S4-P06-A** | GitHub Actions: lint + test + build | DevOps Dev | CI pipeline verde |
| 11-12 | **S4-P06-B** | Vercel: configuración staging + env vars | DevOps Dev | Preview URL por PR |
| 12-13 | **S4-P07** | Open Graph + sitemap.xml + robots.txt | Frontend Dev | SEO completo |
| 13-14 | **S4-P08** | Dashboard métricas chatbot (admin) | Full Stack Dev | Métricas de uso |
| 14-15 | **Hardening** | Revisión final: performance, a11y, security | Tech Lead | Go/No-Go Staging |
| 15 | **S4-CP3** | Checkpoint Cierre Sprint 4 | Tech Lead | Aprobación deploy |

---

## 5. GESTIÓN DE RIESGOS

### 5.1 Matriz de Riesgo

| ID | Riesgo | Probabilidad | Impacto | Score | Mitigación |
|----|--------|-------------|---------|-------|------------|
| **R01** | Tests de `analyzeIntent` fallan por llamadas reales a OpenAI en CI | Alta | Crítico | 🔴 9/9 | Mock completo de OpenAI client en jest.setup.ts |
| **R02** | Design Tokens rompen componentes shadcn existentes | Media | Alto | 🟡 6/9 | Migración incremental: nuevos tokens como extensión, no reemplazo |
| **R03** | Chart.js aumenta bundle size >200KB | Media | Medio | 🟡 4/9 | Dynamic import + tree shaking, solo importar charts usados |
| **R04** | Generación de PDF para ZIP timeout en >10 facturas | Media | Alto | 🟡 6/9 | Procesamiento en chunks de 5, progress bar, timeout de 60s |
| **R05** | Vercel env vars de staging exponen secrets | Baja | Crítico | 🟡 6/9 | Variables de entorno separadas por environment, no compartir DB prod |
| **R06** | LCP >2.5s en Landing Page por imágenes sin optimizar | Alta | Medio | 🟡 6/9 | next/image obligatorio, WebP format, lazy loading |
| **R07** | Portal cliente sin datos reales en staging | Media | Medio | 🟢 4/9 | Seed script con datos de demo para staging |
| **R08** | Firefox E2E timeout persiste | Media | Medio | 🟢 4/9 | Timeout 30000ms + retry:2 en playwright.config.ts |

### 5.2 Plan de Contingencia

**R01 — Mock OpenAI:**
```typescript
// jest.setup.ts
jest.mock('@/lib/services/chat/openai-client', () => ({
  formatResponse: jest.fn().mockResolvedValue({
    message: 'Mock response',
    intent: 'price_lookup',
    confidence: 0.9
  }),
  analyzeIntent: jest.fn().mockResolvedValue({
    intent: 'price_lookup',
    confidence: 0.9,
    params: {}
  })
}));
```

**R02 — Design Tokens incremental:**
- Semana 1: Solo actualizar `globals.css` con nuevas variables
- Semana 2: Actualizar componentes críticos (botones, sidebar, badges)
- Semana 3: Revisar y ajustar componentes secundarios

---

## 6. MÉTRICAS DE ÉXITO DEL SPRINT

### 6.1 Métricas Técnicas (Medibles en CI)

| Métrica | Baseline Actual | Objetivo Sprint 4 | Cómo Medirlo |
|---------|----------------|-------------------|--------------|
| **Test Coverage** | ~40% | >80% | `jest --coverage` en CI |
| **Tests Fallando** | ~19 | 0 | `jest --ci` exit code 0 |
| **Lighthouse Performance** | N/A (no medido) | >90 | `lhci autorun` en CI |
| **Lighthouse Accessibility** | N/A | >95 | `lhci autorun` en CI |
| **Bundle Size (JS)** | N/A | <500KB gzipped | `next build` output |
| **LCP** | N/A | <2.5s | Lighthouse + Web Vitals |
| **CLS** | N/A | <0.1 | Lighthouse + Web Vitals |
| **TypeScript Errors** | Desconocido | 0 | `tsc --noEmit` en CI |
| **ESLint Errors** | Desconocido | 0 | `next lint` en CI |

### 6.2 Métricas de Negocio (Medibles en Staging)

| Métrica | Objetivo | Cómo Lograrla |
|---------|----------|---------------|
| **Time to First Interaction** | <3s | SSR + optimización de imágenes |
| **Tasa de Error en Portal** | <1% | Error Boundary + logging |
| **Satisfacción UX (NPS simulado)** | >4/5 | Revisión con stakeholder en CP-S4-W3 |
| **Funcionalidades sin bugs críticos** | 100% | QA manual en staging antes de go-live |

### 6.3 Cómo Lograr las Métricas

**Coverage >80%:**
1. Ejecutar `npx jest --coverage --coverageReporters=lcov,text` para identificar gaps
2. Priorizar: `src/lib/services/chat/intents/*.ts`, `src/lib/services/notifications/*.ts`, `src/app/api/v1/reports/`
3. Agregar mocks para dependencias externas (OpenAI, Twilio, Telegram)
4. Escribir tests para edge cases: inputs vacíos, errores de DB, timeouts

**Lighthouse >90:**
1. Usar `next/image` para todas las imágenes con `priority` en above-the-fold
2. Dynamic imports para Chart.js y componentes pesados
3. Preconnect a fuentes externas (Google Fonts)
4. Eliminar CSS no utilizado con PurgeCSS (ya incluido en Tailwind)

---

## 7. PROMPTS DE EJECUCIÓN SPRINT 4

> **Instrucción**: Cada prompt es autocontenido y puede ejecutarse de forma independiente. Leer el contexto del repositorio antes de ejecutar. Seguir convenciones: comentarios en español, código en inglés, ORM único Prisma, formato `{ success, data, error }`.

---

### 🎨 PROMPT S4-P00 — Integración Design System Hago Produce

```
PROMPT #S4-P00 — Design System: Integración de Tokens de Marca Hago Produce
---
Agente: Frontend Developer
Prioridad: 🔴 CRÍTICA — Bloqueante para todos los demás prompts de UI
Resumen: Integrar el sistema de Design Tokens de Hago Produce en globals.css y
tailwind.config.ts, reemplazando las variables genéricas de shadcn con la identidad
de marca definida (verde primario #2E7D32, ámbar secundario #FF6F00).

Contexto del repositorio:
- Archivo a modificar: src/app/globals.css (variables CSS HSL actuales)
- Archivo a modificar: tailwind.config.ts (colores actuales son shadcn defaults)
- Componentes que usan colores: src/components/ui/*.tsx (shadcn components)
- Página principal: src/app/page.tsx (usa bg-slate-50, text-slate-900)
- Portal layout: src/app/portal/customer/layout.tsx
- Admin layout: src/app/(admin)/layout.tsx

PARTE A — Actualizar globals.css:
Reemplazar las variables CSS en :root con el sistema de tokens de Hago Produce:

```css
@layer base {
  :root {
    /* === HAGO PRODUCE DESIGN TOKENS === */
    
    /* Primary Green — Marca principal */
    --hago-primary-900: 27 68% 12%;    /* #1B5E20 */
    --hago-primary-800: 123 41% 34%;   /* #2E7D32 — BASE */
    --hago-primary-700: 123 38% 39%;   /* #388E3C */
    --hago-primary-600: 123 36% 45%;   /* #43A047 */
    --hago-primary-500: 122 39% 49%;   /* #4CAF50 */
    --hago-primary-100: 125 39% 85%;   /* #C8E6C9 */
    --hago-primary-50:  125 39% 93%;   /* #E8F5E9 */
    
    /* Secondary Amber — Acento */
    --hago-secondary-900: 22 100% 45%; /* #E65100 */
    --hago-secondary-800: 26 100% 50%; /* #FF6F00 — BASE */
    --hago-secondary-700: 33 100% 50%; /* #FF8F00 */
    --hago-secondary-600: 37 100% 50%; /* #FFA000 */
    --hago-secondary-50:  37 100% 97%; /* #FFF3E0 */
    
    /* Neutrals */
    --hago-gray-900: 0 0% 13%;   /* #212121 */
    --hago-gray-800: 0 0% 26%;   /* #424242 */
    --hago-gray-700: 0 0% 38%;   /* #616161 */
    --hago-gray-600: 0 0% 46%;   /* #757575 */
    --hago-gray-500: 0 0% 62%;   /* #9E9E9E */
    --hago-gray-400: 0 0% 74%;   /* #BDBDBD */
    --hago-gray-300: 0 0% 88%;   /* #E0E0E0 */
    --hago-gray-200: 0 0% 93%;   /* #EEEEEE */
    --hago-gray-100: 0 0% 96%;   /* #F5F5F5 */
    --hago-gray-50:  0 0% 98%;   /* #FAFAFA */
    
    /* Semantic */
    --hago-success: 122 39% 49%;  /* #4CAF50 */
    --hago-warning: 36 100% 50%;  /* #FF9800 */
    --hago-error:   4 90% 58%;    /* #F44336 */
    --hago-info:    207 90% 54%;  /* #2196F3 */
    
    /* Channel Colors */
    --hago-whatsapp: 142 70% 49%; /* #25D366 */
    --hago-telegram: 200 100% 40%;/* #0088CC */
    --hago-email:    211 71% 46%; /* #1976D2 */
    --hago-make:     263 91% 57%; /* #6B2CF5 */
    
    /* shadcn compatibility — mapear a tokens de marca */
    --background: var(--hago-gray-100);
    --foreground: var(--hago-gray-900);
    --card: 0 0% 100%;
    --card-foreground: var(--hago-gray-900);
    --primary: var(--hago-primary-800);
    --primary-foreground: 0 0% 100%;
    --secondary: var(--hago-secondary-800);
    --secondary-foreground: 0 0% 100%;
    --muted: var(--hago-gray-200);
    --muted-foreground: var(--hago-gray-600);
    --accent: var(--hago-primary-50);
    --accent-foreground: var(--hago-primary-800);
    --destructive: var(--hago-error);
    --destructive-foreground: 0 0% 100%;
    --border: var(--hago-gray-300);
    --input: var(--hago-gray-300);
    --ring: var(--hago-primary-800);
    --radius: 0.5rem;
  }
}
```

PARTE B — Actualizar tailwind.config.ts:
Agregar los tokens de Hago Produce como extensión del tema:

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Hago Produce Design Tokens
        "hago-primary": {
          900: "#1B5E20",
          800: "#2E7D32",
          700: "#388E3C",
          600: "#43A047",
          500: "#4CAF50",
          100: "#C8E6C9",
          50: "#E8F5E9",
        },
        "hago-secondary": {
          900: "#E65100",
          800: "#FF6F00",
          700: "#FF8F00",
          600: "#FFA000",
          500: "#FFB300",
          100: "#FFE0B2",
          50: "#FFF3E0",
        },
        "hago-gray": {
          900: "#212121",
          800: "#424242",
          700: "#616161",
          600: "#757575",
          500: "#9E9E9E",
          400: "#BDBDBD",
          300: "#E0E0E0",
          200: "#EEEEEE",
          100: "#F5F5F5",
          50: "#FAFAFA",
        },
        "hago-success": "#4CAF50",
        "hago-warning": "#FF9800",
        "hago-error": "#F44336",
        "hago-info": "#2196F3",
        "hago-whatsapp": "#25D366",
        "hago-telegram": "#0088CC",
        "hago-email": "#1976D2",
        "hago-make": "#6B2CF5",
        // shadcn compatibility
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

PARTE C — Actualizar src/app/page.tsx:
Reemplazar clases slate-* con tokens de marca:
- `bg-slate-50` → `bg-hago-gray-100`
- `text-slate-900` → `text-hago-gray-900`
- `text-slate-600` → `text-hago-gray-600`
- `border-slate-200` → `border-hago-gray-300`
- Badge verde: `bg-green-100 text-green-700 border-green-200` → `bg-hago-primary-50 text-hago-primary-800 border-hago-primary-100`

PARTE D — Actualizar Admin Layout sidebar:
En src/app/(admin)/layout.tsx, aplicar:
- Sidebar background: `bg-hago-primary-900`
- Active nav item: `bg-hago-primary-800`
- Hover nav item: `hover:bg-hago-primary-700`
- Logo/brand text: `text-white`

Criterios de aceptación:
- [ ] globals.css contiene todas las variables --hago-* definidas
- [ ] tailwind.config.ts tiene colores hago-primary, hago-secondary, hago-gray
- [ ] page.tsx no usa clases slate-*
- [ ] Sidebar admin usa colores de marca (verde oscuro)
- [ ] Contraste WCAG AA verificado: hago-primary-800 sobre white = 5.2:1 ✅
- [ ] `npm run build` exitoso sin errores
- [ ] `npm run lint` sin errores

Dependencias: Ninguna (primer prompt a ejecutar)
```

---

### 🧪 PROMPT S4-P01-A — Fix Tests: Mocks y Suite Completa

```
PROMPT #S4-P01-A — QA: Fix Tests Fallando + Mocks de Dependencias Externas
---
Agente: QA Engineer / Backend Developer
Prioridad: 🔴 CRÍTICA — CI no puede pasar sin esto
Resumen: Corregir los tests fallando causados por llamadas reales a OpenAI API
y otras dependencias externas (Twilio, Telegram). Implementar mocks robustos
en jest.setup.ts para que los tests sean determinísticos y rápidos.

Contexto del repositorio:
- Tests de intents: src/tests/unit/chat/intents.test.ts
  * Llama a analyzeIntent() que internamente usa OpenAI API
  * Sin mock → falla en CI por falta de OPENAI_API_KEY
- Tests de notificaciones: src/tests/unit/notifications/
  * Llama a Twilio y Telegram APIs
- Tests de chat format: src/tests/unit/chat/format-response.test.ts
- Config Jest: jest.config.js o package.json (scripts.test)
- OpenAI client: src/lib/services/chat/openai-client.ts
- Intents index: src/lib/services/chat/intents/ (8 archivos)

PARTE A — Crear jest.setup.ts con mocks globales:

Crear archivo src/tests/jest.setup.ts (o actualizar el existente):

```typescript
// src/tests/jest.setup.ts
import '@testing-library/jest-dom';

// === MOCK: OpenAI Client ===
jest.mock('@/lib/services/chat/openai-client', () => ({
  formatResponse: jest.fn().mockImplementation(
    async (message: string, history: unknown[], language: string) => ({
      success: true,
      data: {
        message: `Mock response for: ${message}`,
        intent: 'price_lookup',
        confidence: 0.9,
        language,
      },
    })
  ),
}));

// === MOCK: analyzeIntent (intents index) ===
// Solo mockear cuando no se está testeando el módulo directamente
// Los tests de intents.test.ts deben usar __mocks__ manual

// === MOCK: Twilio ===
jest.mock('twilio', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    messages: {
      create: jest.fn().mockResolvedValue({ sid: 'SM_mock_sid', status: 'sent' }),
    },
  }),
}));

// === MOCK: Telegram Bot API ===
jest.mock('node-telegram-bot-api', () => {
  return jest.fn().mockImplementation(() => ({
    sendMessage: jest.fn().mockResolvedValue({ message_id: 1 }),
    sendDocument: jest.fn().mockResolvedValue({ message_id: 2 }),
  }));
});

// === MOCK: Prisma (para tests unitarios) ===
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    invoice: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'mock-id' }),
      update: jest.fn().mockResolvedValue({ id: 'mock-id' }),
    },
    customer: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    product: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    productPrice: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    chatSession: {
      create: jest.fn().mockResolvedValue({ id: 'session-mock-id' }),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ id: 'session-mock-id' }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-mock-id' }),
    },
    notification: {
      create: jest.fn().mockResolvedValue({ id: 'notif-mock-id' }),
    },
  },
}));

// === MOCK: fetch global ===
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(''),
  status: 200,
});

// === ENV VARS para tests ===
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.TWILIO_ACCOUNT_SID = 'test-twilio-sid';
process.env.TWILIO_AUTH_TOKEN = 'test-twilio-token';
process.env.TELEGRAM_BOT_TOKEN = 'test-telegram-token';
process.env.JWT_SECRET = 'test-jwt-secret-32-chars-minimum!!';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
```

PARTE B — Crear __mocks__ para analyzeIntent:

Crear src/lib/services/chat/__mocks__/intents.ts:

```typescript
// src/lib/services/chat/__mocks__/intents.ts
export const analyzeIntent = jest.fn().mockImplementation(
  async (message: string, language: string) => {
    // Simulación básica de detección de intents
    const msg = message.toLowerCase();
    if (msg.includes('precio') || msg.includes('price')) {
      return { intent: 'price_lookup', confidence: 0.9, params: { productName: 'manzana' } };
    }
    if (msg.includes('proveedor') || msg.includes('supplier')) {
      return { intent: 'best_supplier', confidence: 0.85, params: {} };
    }
    if (msg.includes('factura') || msg.includes('invoice')) {
      return { intent: 'invoice_status', confidence: 0.88, params: { invoiceNumber: 'inv-123' } };
    }
    if (msg.includes('inventario') || msg.includes('inventory')) {
      return { intent: 'inventory_summary', confidence: 0.82, params: {} };
    }
    return { intent: 'price_lookup', confidence: 0.3, params: {} };
  }
);
```

PARTE C — Actualizar jest.config.js:

```javascript
// jest.config.js
const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  setupFilesAfterFramework: ['<rootDir>/src/tests/jest.setup.ts'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'src/lib/services/**/*.ts',
    'src/app/api/**/*.ts',
    'src/components/**/*.tsx',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

PARTE D — Fix tests específicos:

Para src/tests/unit/chat/intents.test.ts:
- Agregar al inicio: `jest.mock('@/lib/services/chat/intents');`
- Importar el mock: `import { analyzeIntent } from '@/lib/services/chat/intents';`
- Usar `(analyzeIntent as jest.Mock).mockResolvedValueOnce(...)` para casos específicos

Para src/tests/unit/notifications/triggers.test.ts:
- Mockear el servicio de notificaciones completo
- Verificar que los triggers se llaman con los parámetros correctos

Criterios de aceptación:
- [ ] `npm test` pasa al 100% (0 tests fallando)
- [ ] jest.setup.ts con mocks de OpenAI, Twilio, Telegram, Prisma
- [ ] __mocks__/intents.ts creado y funcional
- [ ] jest.config.js con coverageThreshold configurado
- [ ] Tests de intents.test.ts pasan sin llamar API real
- [ ] Tests de notifications pasan sin llamar Twilio/Telegram real
- [ ] CI puede ejecutar tests sin variables de entorno reales

Dependencias: Ninguna (puede ejecutarse en paralelo con S4-P00)
```

---

### 🧪 PROMPT S4-P01-B — Coverage >80%: Tests Adicionales

```
PROMPT #S4-P01-B — QA: Elevar Coverage a >80% en Módulos Críticos
---
Agente: QA Engineer
Prioridad: 🔴 CRÍTICA
Resumen: Después de que S4-P01-A pase al 100%, identificar los módulos con
coverage <80% y agregar tests para elevar la cobertura global al objetivo.

Prerrequisito: S4-P01-A completado (0 tests fallando)

Contexto del repositorio:
- Módulos críticos sin tests suficientes (estimado):
  * src/lib/services/chat/intents/*.ts (8 archivos de intents)
  * src/app/api/v1/reports/*.ts (5 endpoints de reportes)
  * src/lib/services/notifications/service.ts
  * src/lib/services/notifications/triggers.ts
  * src/app/api/v1/webhooks/make/route.ts
  * src/app/api/v1/cron/overdue-notifications/route.ts

PARTE A — Análisis de Coverage:
1. Ejecutar: `npx jest --coverage --coverageReporters=text-summary,lcov`
2. Identificar archivos con statements <80%
3. Priorizar por criticidad de negocio

PARTE B — Tests para Reports API:
Para cada endpoint en src/app/api/v1/reports/:
- aging/route.ts: test con datos de facturas vencidas
- revenue/route.ts: test con datos de ingresos mensuales
- top/route.ts: test con top clientes/productos
- export/route.ts: test de exportación CSV/PDF

Estructura de test para reports:
```typescript
// src/tests/unit/reports/aging.test.ts
import { GET } from '@/app/api/v1/reports/aging/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';

describe('GET /api/v1/reports/aging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns aging data for authenticated admin', async () => {
    // Mock auth
    jest.spyOn(require('@/lib/auth/middleware'), 'getAuthenticatedUser')
      .mockResolvedValue({ userId: 'user-1', role: 'ADMIN' });
    
    // Mock prisma
    (prisma.invoice.findMany as jest.Mock).mockResolvedValue([
      { id: '1', total: 1000, dueDate: new Date('2026-01-01'), status: 'OVERDUE', customer: { name: 'Test Co' } }
    ]);

    const req = new NextRequest('http://localhost/api/v1/reports/aging');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });

  it('returns 401 for unauthenticated request', async () => {
    jest.spyOn(require('@/lib/auth/middleware'), 'getAuthenticatedUser')
      .mockResolvedValue(null);
    
    const req = new NextRequest('http://localhost/api/v1/reports/aging');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('handles empty data gracefully', async () => {
    jest.spyOn(require('@/lib/auth/middleware'), 'getAuthenticatedUser')
      .mockResolvedValue({ userId: 'user-1', role: 'ADMIN' });
    (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/v1/reports/aging');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data).toEqual([]);
  });
});
```

PARTE C — Tests para Notifications Service:
```typescript
// src/tests/unit/notifications/service.test.ts (ampliar)
describe('sendNotification', () => {
  it('sends via WhatsApp when channel is whatsapp', async () => { ... });
  it('sends via email when channel is email', async () => { ... });
  it('retries on failure up to maxRetries', async () => { ... });
  it('logs to audit on successful send', async () => { ... });
  it('handles missing NOTIFICATIONS_WEBHOOK_URL gracefully', async () => { ... });
});
```

PARTE D — Tests para Make.com Webhook:
```typescript
// src/tests/integration/make-webhook.test.ts (ampliar)
describe('POST /api/v1/webhooks/make', () => {
  it('processes price update payload correctly', async () => { ... });
  it('handles idempotency key to prevent duplicates', async () => { ... });
  it('returns 400 for invalid payload schema', async () => { ... });
  it('returns 401 for missing webhook secret', async () => { ... });
});
```

Criterios de aceptación:
- [ ] Coverage global >80% (statements, lines, functions)
- [ ] Coverage en src/lib/services/chat/ >80%
- [ ] Coverage en src/app/api/v1/reports/ >75%
- [ ] Coverage en src/lib/services/notifications/ >80%
- [ ] Reporte de coverage generado en coverage/lcov-report/
- [ ] `npm run test:coverage` exitoso en CI

Dependencias: S4-P01-A completado
```

---

### 🌐 PROMPT S4-P02 — Landing Page Institucional

```
PROMPT #S4-P02 — Frontend: Landing Page Institucional con Design System
---
Agente: Frontend Developer
Prioridad: 🔴 CRÍTICA
Resumen: Reemplazar el placeholder actual de src/app/page.tsx con una Landing Page
institucional profesional que refleje la identidad de marca Hago Produce, optimizada
para SEO y Core Web Vitals (LCP <2.5s, Lighthouse >90).

Prerrequisito: S4-P00 completado (Design Tokens integrados)

Contexto del repositorio:
- Archivo a reemplazar: src/app/page.tsx (actualmente es un placeholder básico)
- Layout raíz: src/app/layout.tsx (agregar meta tags aquí)
- Componentes UI disponibles: src/components/ui/* (shadcn)
- Design Tokens disponibles: hago-primary-*, hago-secondary-*, hago-gray-*
- Rutas existentes: /admin (portal admin), /portal/login (portal cliente)

PARTE A — Actualizar src/app/layout.tsx con SEO:
```typescript
// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Hago Produce — Sistema de Gestión de Productos Frescos',
  description: 'Plataforma B2B para la gestión integral de facturación, órdenes de compra y análisis de negocio para la industria de productos frescos.',
  keywords: ['produce management', 'fresh produce', 'B2B invoicing', 'agricultural tech'],
  openGraph: {
    title: 'Hago Produce',
    description: 'Sistema de gestión integral para productos frescos',
    type: 'website',
    locale: 'es_CA',
    siteName: 'Hago Produce',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className={`${inter.className} bg-hago-gray-100 text-hago-gray-900`}>
        {children}
      </body>
    </html>
  );
}
```

PARTE B — Crear src/app/page.tsx (Landing Page completa):

La Landing Page debe tener las siguientes secciones:

1. NAVBAR:
   - Logo "Hago Produce" (texto con ícono de hoja)
   - Links: Características, Portal Admin, Portal Cliente
   - CTA button: "Iniciar Sesión" (bg-hago-primary-800, text-white)
   - Sticky en scroll, bg-white con shadow

2. HERO SECTION:
   - Badge: "Sistema Operativo v2.0" (bg-hago-primary-50, text-hago-primary-800)
   - H1: "Gestión Inteligente de Productos Frescos" (text-5xl, font-bold, text-hago-gray-900)
   - Subtítulo: "Facturación multi-canal, órdenes de compra automatizadas y análisis en tiempo real para tu negocio agrícola." (text-xl, text-hago-gray-600)
   - CTAs: "Acceder al Sistema" (primary) + "Ver Demo" (secondary outline)
   - Imagen/ilustración: placeholder con gradiente hago-primary-50 a hago-primary-100

3. STATS BAR:
   - 4 métricas: "500+ Facturas", "99.9% Uptime", "3 Canales", "< 2s Respuesta"
   - bg-hago-primary-800, text-white
   - Separadores verticales

4. FEATURES SECTION:
   - Título: "Todo lo que necesitas para gestionar tu negocio"
   - 6 feature cards (2x3 grid):
     * 🤖 Chat IA: "Crea facturas y órdenes con lenguaje natural"
     * 📊 Reportes: "KPIs, aging y tendencias en tiempo real"
     * 📱 Multi-Canal: "WhatsApp, Email y Telegram integrados"
     * 🛒 Órdenes: "Sugerencias automáticas de mejores proveedores"
     * 🔒 Seguridad: "Rate limiting, audit logs y roles de acceso"
     * ⚡ Automatización: "Make.com integrado para flujos complejos"
   - Cards: bg-white, border-hago-gray-300, hover:shadow-md
   - Íconos: text-hago-primary-800

5. PORTALS SECTION:
   - Título: "Dos portales, una experiencia"
   - 2 cards grandes:
     * Portal Administrativo: para admin/contabilidad/gerencia
     * Portal Cliente: para clientes externos
   - Cada card con CTA de acceso

6. FOOTER:
   - Logo + tagline
   - Links: Política de Privacidad, Términos de Uso, Soporte
   - Copyright: "© 2026 Hago Produce. Todos los derechos reservados."
   - bg-hago-primary-900, text-white

PARTE C — Optimización de Performance:
- Usar `next/font/google` para Inter (ya en layout.tsx)
- Íconos de lucide-react (ya instalado, tree-shakeable)
- No usar imágenes externas en hero (usar gradientes CSS)
- Agregar `loading="lazy"` a imágenes below-the-fold
- Agregar `<link rel="preconnect">` para recursos externos

PARTE D — Crear src/app/sitemap.ts:
```typescript
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://hagoproduce.ca', lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: 'https://hagoproduce.ca/portal/login', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.8 },
  ];
}
```

Criterios de aceptación:
- [ ] Landing Page visible en `/` con todas las secciones
- [ ] Usa Design Tokens hago-primary-*, hago-gray-* (no slate-*)
- [ ] Meta tags SEO configurados en layout.tsx
- [ ] Open Graph tags configurados
- [ ] Lighthouse Performance >90 (medido con `npx lhci autorun`)
- [ ] LCP <2.5s en desktop y mobile
- [ ] Responsive: mobile (375px), tablet (768px), desktop (1280px)
- [ ] `npm run build` exitoso
- [ ] sitemap.ts creado

Dependencias: S4-P00 completado
```

---

### 📊 PROMPT S4-P03 — Portal Cliente: Gráficos Interactivos

```
PROMPT #S4-P03 — Frontend: Dashboard Cliente con Chart.js + KPIs
---
Agente: Frontend Developer
Prioridad: 🟡 ALTA
Resumen: Agregar gráficos interactivos al dashboard del portal cliente usando
Chart.js con dynamic import. Incluir: gráfico de barras de facturación mensual,
gráfico donut de estados, y KPI cards con tendencias.

Prerrequisito: S4-P00 completado (Design Tokens)

Contexto del repositorio:
- Página a mejorar: src/app/portal/customer/dashboard/page.tsx
- Componente actual: src/components/portal/CustomerDashboardSummary.tsx
- API de reportes disponible: src/app/api/v1/reports/revenue/route.ts
- API de facturas: src/app/api/v1/invoices/route.ts (filtrar por customerId)
- Design Tokens: hago-primary-800 (#2E7D32), hago-secondary-800 (#FF6F00)

PARTE A — Instalar dependencias:
```bash
npm install chart.js react-chartjs-2
npm install --save-dev @types/chart.js
```

PARTE B — Crear componente ChartWrapper con dynamic import:
```typescript
// src/components/portal/charts/ChartWrapper.tsx
'use client';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic import para no bloquear LCP
const Bar = dynamic(() => import('react-chartjs-2').then(m => m.Bar), {
  loading: () => <Skeleton className="h-64 w-full" />,
  ssr: false,
});

const Doughnut = dynamic(() => import('react-chartjs-2').then(m => m.Doughnut), {
  loading: () => <Skeleton className="h-48 w-full" />,
  ssr: false,
});
```

PARTE C — Crear componente RevenueBarChart:
```typescript
// src/components/portal/charts/RevenueBarChart.tsx
'use client';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface RevenueBarChartProps {
  data: { month: string; revenue: number }[];
}

export function RevenueBarChart({ data }: RevenueBarChartProps) {
  const chartData = {
    labels: data.map(d => d.month),
    datasets: [{
      label: 'Facturación',
      data: data.map(d => d.revenue),
      backgroundColor: '#2E7D32',  // hago-primary-800
      borderColor: '#1B5E20',       // hago-primary-900
      borderWidth: 1,
      borderRadius: 6,
    }],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `$${ctx.raw.toLocaleString('en-CA')}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v: any) => `$${(v/1000).toFixed(0)}k` },
        grid: { color: '#E0E0E0' },  // hago-gray-300
      },
      x: { grid: { display: false } },
    },
  };

  return <Bar data={chartData} options={options} />;
}
```

PARTE D — Crear componente InvoiceStatusDoughnut:
```typescript
// src/components/portal/charts/InvoiceStatusDoughnut.tsx
// Colores por estado:
// PAID → hago-primary-800 (#2E7D32)
// SENT → hago-info (#2196F3)
// OVERDUE → hago-error (#F44336)
// DRAFT → hago-gray-400 (#BDBDBD)
// PENDING → hago-warning (#FF9800)
```

PARTE E — Actualizar CustomerDashboardSummary.tsx:
Agregar:
1. KPI Cards row (4 cards):
   - Total Facturado (período): valor + tendencia vs mes anterior
   - Balance Pendiente: suma de facturas SENT/OVERDUE
   - Facturas Vencidas: count de OVERDUE (color hago-error)
   - Total Órdenes: count de facturas del período
2. Gráfico de barras: facturación últimos 6 meses
3. Gráfico donut: distribución por estado
4. Skeleton loaders mientras cargan los datos

PARTE F — Crear hook useCustomerDashboardData:
```typescript
// src/lib/hooks/useCustomerDashboardData.ts
'use client';
import { useState, useEffect } from 'react';

export function useCustomerDashboardData(customerId: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch con cache de 5 minutos en cliente
    const cacheKey = `dashboard-${customerId}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { data: cachedData, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        setData(cachedData);
        setLoading(false);
        return;
      }
    }
    // Fetch real...
  }, [customerId]);

  return { data, loading, error };
}
```

Criterios de aceptación:
- [ ] chart.js y react-chartjs-2 instalados
- [ ] ChartWrapper con dynamic import (no bloquea LCP)
- [ ] RevenueBarChart con colores hago-primary-800
- [ ] InvoiceStatusDoughnut con colores semánticos correctos
- [ ] KPI cards con tendencias (↑↓ vs mes anterior)
- [ ] Skeleton loaders mientras cargan datos
- [ ] Empty state cuando no hay datos
- [ ] Error toast cuando falla la API
- [ ] Cache de 5 minutos en sessionStorage
- [ ] Responsive: charts se adaptan a mobile

Dependencias: S4-P00, S4-P01-A
```

---

### 📦 PROMPT S4-P04 — Descarga Masiva ZIP de Facturas

```
PROMPT #S4-P04 — Frontend + Backend: Descarga Masiva de Facturas en ZIP
---
Agente: Full Stack Developer
Prioridad: 🟡 ALTA
Resumen: Implementar la funcionalidad de descarga masiva de facturas en formato ZIP.
El cliente puede seleccionar múltiples facturas y descargarlas como un archivo ZIP
con PDFs individuales nombrados correctamente.

Contexto del repositorio:
- Página a mejorar: src/app/portal/customer/invoices/page.tsx
- Componente tabla: src/components/portal/CustomerInvoicesTable.tsx
- Componente descarga PDF: src/components/portal/CustomerDownloadPDFButton.tsx
- API de facturas: src/app/api/v1/invoices/route.ts
- jspdf ya instalado (ver package.json)

PARTE A — Instalar JSZip:
```bash
npm install jszip
npm install --save-dev @types/jszip
```

PARTE B — Crear API endpoint para ZIP:
```typescript
// src/app/api/v1/invoices/bulk-download/route.ts
import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { invoiceIds } = await req.json();
  
  if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
    return NextResponse.json({ error: 'invoiceIds required' }, { status: 400 });
  }
  if (invoiceIds.length > 50) {
    return NextResponse.json({ error: 'Max 50 invoices per download' }, { status: 400 });
  }

  // Verificar que todas las facturas pertenecen al cliente
  const invoices = await prisma.invoice.findMany({
    where: {
      id: { in: invoiceIds },
      ...(user.role === 'CUSTOMER' ? { customer: { users: { some: { id: user.userId } } } } : {}),
    },
    include: { customer: true, items: { include: { product: true } } },
  });

  if (invoices.length !== invoiceIds.length) {
    return NextResponse.json({ error: 'Some invoices not found or unauthorized' }, { status: 403 });
  }

  // Generar ZIP con PDFs
  const zip = new JSZip();
  
  for (const invoice of invoices) {
    const pdfBuffer = await generateInvoicePDF(invoice); // función existente
    const filename = `${invoice.number}-${invoice.customer.name.replace(/\s+/g, '_')}.pdf`;
    zip.file(filename, pdfBuffer);
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  
  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="facturas-${new Date().toISOString().split('T')[0]}.zip"`,
    },
  });
}
```

PARTE C — Actualizar CustomerInvoicesTable.tsx:
1. Agregar checkbox de selección en cada fila
2. Agregar "Select All" checkbox en header
3. Mostrar barra de acciones cuando hay selección:
   - "X facturas seleccionadas"
   - Botón "Descargar ZIP" (bg-hago-primary-800)
   - Botón "Deseleccionar todo"
4. Progress indicator durante descarga

PARTE D — Crear componente BulkDownloadButton:
```typescript
// src/components/portal/BulkDownloadButton.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface BulkDownloadButtonProps {
  selectedIds: string[];
  onSuccess?: () => void;
}

export function BulkDownloadButton({ selectedIds, onSuccess }: BulkDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/invoices/bulk-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: selectedIds }),
      });
      if (!res.ok) throw new Error('Error al generar ZIP');
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facturas-${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: '✅ Descarga exitosa', description: `${selectedIds.length} facturas descargadas` });
      onSuccess?.();
    } catch (err) {
      toast({ title: '❌ Error', description: 'No se pudo generar el ZIP', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={selectedIds.length === 0 || loading}
      className="bg-hago-primary-800 hover:bg-hago-primary-900 text-white"
    >
      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
      Descargar ZIP ({selectedIds.length})
    </Button>
  );
}
```

Criterios de aceptación:
- [ ] jszip instalado
- [ ] API POST /api/v1/invoices/bulk-download funcional
- [ ] Máximo 50 facturas por descarga (validación)
- [ ] Checkboxes en tabla de facturas
- [ ] Barra de acciones con count de seleccionadas
- [ ] BulkDownloadButton con loading state
- [ ] Toast de éxito/error
- [ ] ZIP descargado con PDFs nombrados correctamente
- [ ] Autorización: cliente solo descarga sus propias facturas
- [ ] Test de integración para el endpoint

Dependencias: S4-P00, S4-P01-A
```

---

### ⚙️ PROMPT S4-P06 — CI/CD: GitHub Actions + Vercel Staging

```
PROMPT #S4-P06 — DevOps: CI/CD Pipeline + Deploy a Staging en Vercel
---
Agente: DevOps / Full Stack Developer
Prioridad: 🟡 ALTA
Resumen: Configurar un pipeline de CI/CD con GitHub Actions que ejecute lint,
tests y build en cada PR, y despliegue automáticamente a Vercel Staging cuando
se mergea a main.

Contexto del repositorio:
- No existe .github/workflows/ actualmente
- package.json tiene scripts: dev, build, start, lint, test, test:e2e
- Vercel CLI disponible para configuración

PARTE A — Crear .github/workflows/ci.yml:
```yaml
name: CI — Lint, Test & Build

on:
  push:
    branches: [main, 'feature/**']
  pull_request:
    branches: [main]

jobs:
  ci:
    name: CI Pipeline
    runs-on: ubuntu-latest
    
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/hago_test
      JWT_SECRET: test-jwt-secret-32-chars-minimum!!
      OPENAI_API_KEY: test-key-not-real
      TWILIO_ACCOUNT_SID: test-sid
      TWILIO_AUTH_TOKEN: test-token
      TELEGRAM_BOT_TOKEN: test-token
      NEXTAUTH_SECRET: test-nextauth-secret
      NEXTAUTH_URL: http://localhost:3000

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: hago_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate Prisma Client
        run: npx prisma generate
      
      - name: Run Prisma Migrations (test DB)
        run: npx prisma migrate deploy
      
      - name: Lint
        run: npm run lint
      
      - name: TypeScript Check
        run: npx tsc --noEmit
      
      - name: Run Tests with Coverage
        run: npm test -- --coverage --ci --forceExit
      
      - name: Upload Coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          fail_ci_if_error: false
      
      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ env.DATABASE_URL }}
```

PARTE B — Crear .github/workflows/staging.yml:
```yaml
name: Deploy to Staging

on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    name: Deploy to Vercel Staging
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./
```

PARTE C — Crear .env.staging.example:
```env
# Staging Environment Variables
DATABASE_URL=postgresql://user:pass@staging-db-host:5432/hago_staging
JWT_SECRET=staging-jwt-secret-min-32-chars
OPENAI_API_KEY=sk-staging-key
TWILIO_ACCOUNT_SID=AC_staging
TWILIO_AUTH_TOKEN=staging_token
TWILIO_WHATSAPP_FROM=whatsapp:+1staging
TELEGRAM_BOT_TOKEN=staging_bot_token
NEXTAUTH_URL=https://hago-produce-staging.vercel.app
NEXTAUTH_SECRET=staging-nextauth-secret
CHAT_RATE_LIMIT=20
NOTIFICATIONS_WEBHOOK_URL=https://hook.make.com/staging-webhook
```

PARTE D — Crear script de seed para staging:
```typescript
// prisma/seed-staging.ts
// Datos de demo para staging (no datos reales de producción)
// Incluir: 3 clientes demo, 10 productos, 20 facturas de ejemplo
```

Criterios de aceptación:
- [ ] .github/workflows/ci.yml creado y funcional
- [ ] .github/workflows/staging.yml creado
- [ ] CI pasa en GitHub Actions (lint + test + build)
- [ ] Deploy automático a Vercel en push a main
- [ ] .env.staging.example documentado
- [ ] Secrets configurados en GitHub (VERCEL_TOKEN, etc.)
- [ ] Preview URL generada por PR
- [ ] Seed script para datos de demo en staging

Dependencias: S4-P01-A, S4-P01-B (tests pasando)
```

---

### 🎭 PROMPT S4-P05 — Skeleton Loaders + Error Boundaries

```
PROMPT #S4-P05 — Frontend: UX Polish — Skeletons, Error Boundaries, 404/500
---
Agente: Frontend Developer
Prioridad: 🟡 ALTA
Resumen: Implementar estados de carga (Skeleton loaders), Error Boundaries globales
y páginas de error personalizadas (404, 500) para una experiencia de usuario
profesional y sin flashes de contenido.

Contexto del repositorio:
- Skeleton component: src/components/ui/skeleton.tsx (ya existe en shadcn)
- Tablas sin skeleton: CustomerInvoicesTable, RecentInvoices, etc.
- Sin Error Boundary global actualmente
- Sin páginas 404/500 personalizadas

PARTE A — Crear Skeleton components específicos:
```typescript
// src/components/ui/skeletons/TableSkeleton.tsx
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// src/components/ui/skeletons/KPICardSkeleton.tsx
export function KPICardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 border border-hago-gray-300">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

// src/components/ui/skeletons/ChartSkeleton.tsx
export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 border border-hago-gray-300">
      <Skeleton className="h-5 w-40 mb-4" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
```

PARTE B — Crear Error Boundary global:
```typescript
// src/components/ErrorBoundary.tsx
'use client';
import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[ErrorBoundary]', error, info);
    // TODO: enviar a servicio de logging (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-hago-error mb-4" />
          <h2 className="text-xl font-bold text-hago-gray-900 mb-2">Algo salió mal</h2>
          <p className="text-hago-gray-600 mb-4">Ocurrió un error inesperado.</p>
          <Button
            onClick={() => this.setState({ hasError: false })}
            className="bg-hago-primary-800 hover:bg-hago-primary-900 text-white"
          >
            Intentar de nuevo
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

PARTE C — Crear páginas de error personalizadas:
```typescript
// src/app/not-found.tsx (404)
import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="min-h-screen bg-hago-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl font-bold text-hago-primary-800 mb-4">404</div>
        <h1 className="text-2xl font-bold text-hago-gray-900 mb-2">Página no encontrada</h1>
        <p className="text-hago-gray-600 mb-6">La página que buscas no existe.</p>
        <Link href="/" className="bg-hago-primary-800 text-white px-6 py-3 rounded-lg hover:bg-hago-primary-900">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

// src/app/error.tsx (500)
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-hago-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl font-bold text-hago-error mb-4">500</div>
        <h1 className="text-2xl font-bold text-hago-gray-900 mb-2">Error del servidor</h1>
        <p className="text-hago-gray-600 mb-6">Ocurrió un error inesperado.</p>
        <button onClick={reset} className="bg-hago-primary-800 text-white px-6 py-3 rounded-lg">
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
```

Criterios de aceptación:
- [ ] TableSkeleton, KPICardSkeleton, ChartSkeleton creados
- [ ] Skeletons aplicados en CustomerInvoicesTable, CustomerDashboardSummary
- [ ] ErrorBoundary global creado y aplicado en layouts
- [ ] Página 404 personalizada con Design Tokens
- [ ] Página 500 personalizada con Design Tokens
- [ ] No hay flashes de contenido sin skeleton
- [ ] Error Boundary captura errores sin romper la app

Dependencias: S4-P00
```

---

## 8. LECCIONES APRENDIDAS (APLICADAS)

### 8.1 Lección "Backend First" del Sprint 3

**Lección:** El Sprint 3 demostró que implementar backend sólido antes de UI evita retrabajo costoso. Los servicios de chat, notificaciones y reportes están bien estructurados.

**Aplicación en Sprint 4:**
- S4-P01 (Tests) se ejecuta ANTES que cualquier feature de UI
- S4-P00 (Design System) se ejecuta ANTES que cualquier componente nuevo
- Cada prompt de UI tiene como prerrequisito que los tests pasen

### 8.2 Lección "TDD Light" para Frontend

**Aplicación:**
- Cada componente nuevo incluye al menos 1 test (happy path)
- Los hooks (`useCustomerDashboardData`) tienen tests unitarios
- Los endpoints nuevos (`bulk-download`) tienen tests de integración
- No se hace merge a main sin que CI pase

### 8.3 Lección "Design Tokens First"

**Nueva lección del análisis del Sprint 3:**
- El código actual usa `slate-*`, `blue-*`, `green-*` de Tailwind sin sistema
- Esto genera inconsistencia visual y dificulta cambios de marca
- **Aplicación:** S4-P00 es el PRIMER prompt a ejecutar, bloqueante para todos los demás

### 8.4 Lección "Mocks en CI"

**Nueva lección:**
- Los tests que llaman APIs externas (OpenAI, Twilio) son frágiles en CI
- **Aplicación:** jest.setup.ts con mocks globales es obligatorio antes de cualquier test

---

## 9. AJUSTE DE ROADMAP — ¿ES VIABLE SPRINT 5?

### 9.1 Análisis de Viabilidad

| Condición | Estado | Impacto en Sprint 5 |
|-----------|--------|---------------------|
| Tests al 100% | ⏳ Sprint 4 | Bloqueante para CI/CD |
| Design System integrado | ⏳ Sprint 4 | Bloqueante para UX consistente |
| Landing Page | ⏳ Sprint 4 | Necesario para go-live |
| Portal con gráficos | ⏳ Sprint 4 | Necesario para demo a clientes |
| CI/CD configurado | ⏳ Sprint 4 | Bloqueante para deploy |
| Staging funcional | ⏳ Sprint 4 | Necesario para QA final |

### 9.2 Condiciones para Sprint 5 (Go-Live)

**Sprint 5 es viable SI:**
1. ✅ Sprint 4 completa los 6 MUST HAVE (S4-P00 a S4-P06)
2. ✅ Staging funcional con datos de demo
3. ✅ Lighthouse >90 en landing page y portal
4. ✅ 0 bugs críticos en QA manual de staging
5. ✅ Stakeholder aprueba en CP-S4-W3

**Sprint 5 scope tentativo:**
- Integración QuickBooks (Make.com blueprint)
- Email service real (Resend)
- Telegram bot vinculación de clientes
- Métricas de uso del chatbot
- Onboarding de primeros clientes reales

### 9.3 Timeline Actualizado

```
Sprint 1 (Consolidación)     ✅ Completado
Sprint 2 (Integraciones)     ✅ Completado
Sprint 3 (Backend Avanzado)  ✅ Completado
Sprint 4 (Productización)    ⏳ 15 días (3 semanas)
Sprint 5 (Go-Live)           📅 Semanas 16-20 (5 semanas)
```

---

## 10. CHECKPOINTS DE VALIDACIÓN

### CP-S4-W1: Fundamentos (Fin Semana 1)

**Fecha objetivo:** Día 5 del Sprint 4

**Criterios de aprobación:**
- [ ] `npm test` → 0 tests fallando
- [ ] `npm run test:coverage` → >80% global
- [ ] `npm run build` → exitoso
- [ ] `npm run lint` → 0 errores
- [ ] Landing Page visible en `/` con Design Tokens de marca
- [ ] Sidebar admin con colores hago-primary-900
- [ ] Botones primarios con hago-primary-800

**Validación con Stakeholder:**
- Demo de Landing Page en localhost
- Revisión de paleta de colores aplicada
- Confirmación de que los tests pasan en CI

**Go/No-Go:** Si algún criterio falla, no avanzar a Semana 2

---

### CP-S4-W2: Portal UX (Fin Semana 2)

**Fecha objetivo:** Día 10 del Sprint 4

**Criterios de aprobación:**
- [ ] Dashboard cliente con gráficos Chart.js funcionales
- [ ] KPI cards con datos reales de API
- [ ] Descarga masiva ZIP funcional (test con 3 facturas)
- [ ] Skeleton loaders en todas las tablas y cards
- [ ] Error Boundary captura errores sin romper la app
- [ ] Páginas 404/500 personalizadas con Design Tokens

**Validación con Stakeholder:**
- Demo del portal cliente con datos de demo
- Test de descarga ZIP en vivo
- Revisión de estados de carga (skeleton)

**Go/No-Go:** Si gráficos o ZIP fallan, no avanzar a Semana 3

---

### CP-S4-W3: Staging Deploy (Fin Semana 3)

**Fecha objetivo:** Día 15 del Sprint 4

**Criterios de aprobación:**
- [ ] GitHub Actions CI verde en todos los PRs
- [ ] Deploy automático a Vercel Staging funcional
- [ ] URL de Staging accesible públicamente
- [ ] Lighthouse Performance >90 en Staging
- [ ] Lighthouse Accessibility >95 en Staging
- [ ] 0 bugs críticos en QA manual de Staging
- [ ] Seed de datos de demo cargado en Staging
- [ ] Open Graph tags verificados (og:title, og:description)

**Validación con Stakeholder:**
- Demo completo en URL de Staging
- Revisión de Lighthouse report
- Aprobación formal para avanzar a Sprint 5

**Go/No-Go:** Aprobación explícita del stakeholder requerida para Sprint 5

---

## 11. AUDITORÍA TOTAL — PROMPTS DE AUDITORÍA POR FASE

### PROMPT AUDITORÍA FASE 0 (Foundation)

```
PROMPT #AUDIT-F0 — Auditoría Fase 0: Foundation & Setup
---
Agente: Tech Lead / QA
Objetivo: Verificar que todos los entregables de la Fase 0 siguen siendo válidos
y no han sido degradados por cambios posteriores.

Verificar:
1. prisma/schema.prisma: modelos User, Customer, Supplier, Product, Invoice, InvoiceItem, AuditLog
2. src/lib/auth/: jwt.ts, middleware.ts, password.ts, verify-role.ts
3. src/middleware.ts: protección de rutas por rol
4. .env.example: todas las variables documentadas
5. package.json: dependencias correctas y scripts funcionales
6. next.config.js: configuración de Next.js correcta

Ejecutar:
- npx prisma validate (schema válido)
- npx tsc --noEmit (sin errores TypeScript)
- npm run lint (sin errores ESLint)

Reportar: Estado de cada componente (✅ OK / ⚠️ Degradado / ❌ Roto)
```

### PROMPT AUDITORÍA FASE 1A (Core CRUD)

```
PROMPT #AUDIT-F1A — Auditoría Fase 1A: Core CRUD APIs
---
Agente: Backend Developer / QA
Objetivo: Verificar que todos los endpoints CRUD de la Fase 1A funcionan correctamente.

Endpoints a verificar:
- GET/POST /api/v1/customers
- GET/PUT/DELETE /api/v1/customers/[id]
- GET/POST /api/v1/products
- GET/PUT/DELETE /api/v1/products/[id]
- GET/POST /api/v1/suppliers
- GET/PUT/DELETE /api/v1/suppliers/[id]
- GET/POST /api/v1/product-prices
- GET/PUT/DELETE /api/v1/product-prices/[id]
- GET/POST /api/v1/users
- GET/PUT/DELETE /api/v1/users/[id]

Para cada endpoint verificar:
1. Autenticación requerida (401 sin token)
2. Autorización por rol (403 con rol incorrecto)
3. Validación de inputs (400 con datos inválidos)
4. Happy path (200/201 con datos correctos)
5. Test de integración existente y pasando

Reportar: Tabla con endpoint, estado, test coverage, observaciones
```

### PROMPT AUDITORÍA FASE 1B (Invoicing)

```
PROMPT #AUDIT-F1B — Auditoría Fase 1B: Sistema de Facturación
---
Agente: Backend Developer / QA
Objetivo: Verificar el sistema completo de facturación.

Verificar:
1. CRUD de facturas: GET/POST/PUT/DELETE /api/v1/invoices
2. Cambio de estado: PUT /api/v1/invoices/[id]/status
3. Notas internas: GET/POST /api/v1/invoices/[id]/notes
4. Generación de PDF: funcionalidad de export
5. Audit log: cada cambio de estado registrado
6. Notificaciones: trigger al cambiar estado

Verificar modelos Prisma:
- Invoice: todos los campos y relaciones
- InvoiceItem: relación con Product
- InvoiceNote: relación con User
- InvoiceStatus enum: DRAFT, SENT, PENDING, PAID, CANCELLED, OVERDUE

Reportar: Estado de cada funcionalidad con evidencia de tests
```

### PROMPT AUDITORÍA FASE 1C (Chat + Portal)

```
PROMPT #AUDIT-F1C — Auditoría Fase 1C: Chat IA + Portal Cliente
---
Agente: Full Stack Developer / QA
Objetivo: Verificar el sistema de chat conversacional y el portal de cliente.

Chat IA:
1. POST /api/chat: autenticación, rate limiting, sesiones
2. Intents disponibles: price_lookup, best_supplier, invoice_status, 
   inventory_summary, overdue_invoices, create_order, customer_balance, product_info
3. RAG: consultas a DB en tiempo real
4. ChatSession: persistencia en DB
5. FloatingChatAssistant: componente funcional

Portal Cliente:
1. /portal/login: autenticación de clientes
2. /portal/customer/dashboard: KPIs y resumen
3. /portal/customer/invoices: listado con filtros
4. CustomerProtected: protección de rutas
5. PDF download: descarga individual funcional

Reportar: Estado de cada componente con evidencia de tests
```

### PROMPT AUDITORÍA SPRINT 2 (Integraciones)

```
PROMPT #AUDIT-S2 — Auditoría Sprint 2: Integraciones Externas
---
Agente: Backend Developer / QA
Objetivo: Verificar todas las integraciones externas del Sprint 2.

Verificar:
1. Make.com Webhook: POST /api/v1/webhooks/make (idempotencia, validación)
2. WhatsApp Twilio: webhook de recepción + envío de mensajes
3. Notificaciones automáticas: cron de facturas vencidas
4. ChatSession: modelo en DB y persistencia
5. Rate limiting en /api/chat
6. Documentación operacional: AUTOMATIZACIONES_MASTER.md, RUNBOOK_OPERACIONES.md

Variables de entorno requeridas:
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
- MAKE_WEBHOOK_SECRET
- CHAT_RATE_LIMIT

Reportar: Estado de cada integración, variables configuradas, tests pasando
```

---

## 12. REFERENCIAS Y DOCUMENTOS RELACIONADOS

| Documento | Ubicación | Descripción |
|-----------|-----------|-------------|
| Design Tokens | `/workspace/SISTEMA_COLORES_HAGO_PRODUCE.md` | Sistema completo de colores de marca |
| Prompts Figma MAKE | `/workspace/PROMPTS_FIGMA_MAKE_ACTUALIZADOS.md` | Prompts actualizados con Design System |
| Sprint 3 Prompts | `DocumentacionHagoProduce/FaseDos/PROMPTS_SPRINT3_DETALLADOS.md` | Referencia de prompts anteriores |
| Recalibración S3 | `DocumentacionHagoProduce/FaseDos/PROMPT_MAESTRO_RECALIBRACION_SPRINT3.md` | Estado real post-Sprint 3 |
| API Contracts | `DocumentacionHagoProduce/FaseDos/Fase2.0V/03_api_contracts.md` | Contratos de API |
| Data Model | `DocumentacionHagoProduce/FaseDos/Fase2.0V/02_data_model.md` | Modelo de datos Prisma |

---

**Generado por:** SuperNinja AI Agent — Senior PM & Tech Lead  
**Fecha:** 2026-02-24  
**Versión:** 1.0 — Borrador  
**Próxima revisión:** CP-S4-W1 (Día 5 del Sprint 4)