# HAGO PRODUCE — Project Brief (Resumen Ejecutivo)

---

## 🎯 En una frase
Sistema web propio para centralizar facturación, gestión de costos y seguimiento de clientes de HAGO PRODUCE, reemplazando QuickBooks y Google Sheets, con un agente digital integrado para toma de decisiones.

---

## 📊 Datos clave

| Concepto | Valor |
|----------|-------|
| **Cliente** | HAGO PRODUCE (venta de frutas, verduras, frutos secos) |
| **Ubicación** | Canadá |
| **Usuarios internos** | ~6 |
| **Clientes externos** | ~70 |
| **Facturas/día** | ~10 |
| **Productos activos** | 400–600 |
| **Horario crítico** | 3:00 a.m. – 6:00 p.m. |
| **Idiomas** | Español + Inglés |
| **Presupuesto** | Bajo / Piloto (~60 CAD infra inicial) |
| **Meta principal** | Dejar QuickBooks antes del 01/04/2026 |

---

## 🏗️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 + TailwindCSS + shadcn/ui |
| Backend | Next.js API Routes (monorepo) |
| Base de datos | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | Supabase Auth (JWT + roles) |
| Chat/Agente | OpenAI API (GPT-4o-mini) + function calling |
| Notificaciones | Twilio (WhatsApp) / Telegram Bot API |
| Hosting | Vercel (frontend) + Supabase (BD + Auth) |
| CI/CD | GitHub Actions |
| Automatizaciones | Make.com (existente, se integra via webhooks) |
| Diseño | Figma → Kombai → código |

---

## 📦 Módulos del MVP (V1)

```
┌─────────────────────────────────────────────────┐
│                  HAGO PRODUCE V1                 │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │   Auth    │  │  Users   │  │  Customers   │  │
│  │  + Roles  │  │  CRUD    │  │  CRUD        │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Products │  │Suppliers │  │Product Prices│  │
│  │  CRUD    │  │  CRUD    │  │ + Make.com   │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │           INVOICES MODULE                 │   │
│  │  Create · Edit · Status · Notes · PDF     │   │
│  │  Filters · History · Audit log            │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────┐  ┌────────────────────┐   │
│  │  Chat / Agent    │  │  Customer Portal   │   │
│  │  Price lookup    │  │  View invoices     │   │
│  │  Best supplier   │  │  Account statement │   │
│  │  Invoice status  │  │  Download PDFs     │   │
│  └──────────────────┘  └────────────────────┘   │
│                                                  │
│  ┌──────────────────┐  ┌────────────────────┐   │
│  │  Webhooks        │  │  Notifications     │   │
│  │  (Make.com)      │  │  (Status changes)  │   │
│  └──────────────────┘  └────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 👥 Roles y permisos (resumen)

| Acción | Admin | Contabilidad | Gerencia | Cliente |
|--------|-------|-------------|----------|---------|
| Crear facturas | ✅ | ❌ | ❌ | ❌ |
| Cambiar estado factura | ✅ | ✅ | ❌ | ❌ |
| Agregar notas internas | ✅ | ✅ | ❌ | ❌ |
| Ver reportes | ✅ | ✅ | ✅ | ❌ |
| Gestionar productos | ✅ | ❌ | ❌ | ❌ |
| Gestionar clientes | ✅ | ❌ | ❌ | ❌ |
| Usar chat/agente | ✅ | ✅ | ✅ | ❌ |
| Ver sus facturas | — | — | — | ✅ |
| Descargar PDFs | ✅ | ✅ | ✅ | ✅ |

---

## 📅 Timeline resumido

| Fase | Qué incluye | Duración | Fecha estimada |
|------|------------|----------|---------------|
| **Fase 0** | Infra, Figma, BD, CI/CD | 2-3 sem | Jul 2025 |
| **Fase 1A** | Auth, Productos, Proveedores, Clientes | 4-5 sem | Sep 2025 |
| **Fase 1B** | Facturas completas, Panel contable, PDF | 4-5 sem | Nov 2025 |
| **Fase 1C** | Chat/Agente, Portal cliente, Notificaciones | 3-4 sem | Dic 2025 |
| **🎯 META** | **Dejar QuickBooks** | — | **< 01/04/2026** |
| **Fase 2** | Reportes, migración Sheets, bot externo, SPA | Continuo | Q2 2026+ |

---

## ✅ Criterios de éxito

1. **Dejar QuickBooks** antes del 01/04/2026.
2. **Crear factura en < 3 min** (vs ~20 min actual).
3. **Información centralizada** en un solo portal.
4. **Agente digital operativo** para consultas de precios y estados.
5. **Clientes con acceso** a su estado de cuenta online.

---

## ⚠️ Top 3 riesgos

1. **Resistencia al cambio** → Mitigación: período de coexistencia QB + sistema nuevo.
2. **Complejidad del agente** → Mitigación: empezar con intents simples y estructurados.
3. **Disponibilidad del equipo** → Mitigación: priorizar por impacto, usar IA para acelerar.

---

## 📁 Documentación del proyecto

| Documento | Archivo | Contenido |
|-----------|---------|-----------|
| Prompt maestro | `00_prompt_maestro_hago_produce.md` | Contexto completo + cuestionario respondido |
| Arquitectura C4 | `01_architecture_c4.md` | 4 niveles C4 + decisiones arquitectónicas + stack |
| Modelo de datos | `02_data_model.md` | ERD completo con 11 tablas, campos, índices, relaciones |
| Contratos de API | `03_api_contracts.md` | Todos los endpoints REST con request/response, permisos |
| Roadmap | `04_roadmap.md` | 5 fases con tareas, criterios, riesgos, estrategia de migración |
| Project Brief | `05_project_brief.md` | Este documento — resumen ejecutivo |