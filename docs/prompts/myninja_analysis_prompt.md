# Prompt para Análisis de Progreso y Planificación de Fase 2 - Hago Produce

Copia y pega el siguiente prompt en **myninja.ai** para realizar un análisis profundo del estado del proyecto y planificar los siguientes pasos.

---

## 🤖 Prompt Maestro para MyNinja.ai

**Rol:** Actúa como un Arquitecto de Software Senior y Tech Lead experto en Next.js, TypeScript, Prisma y arquitecturas escalables.

**Contexto del Proyecto:**
Estás analizando "Hago Produce", una plataforma SaaS para la gestión de importaciones/exportaciones (IMMEX).
- **Stack:** Next.js (App Router), TypeScript, Prisma (PostgreSQL), Tailwind CSS, Shadcn/UI.
- **Estado Actual:** Se ha completado la Fase 1C (Chat/Agente + Portal de Cliente + Notificaciones).
- **Documentación Clave:** Revisa `docs/architecture/current_state.md` y `docs/onboarding/setup_local.md` para entender la arquitectura actual.

**Objetivo Principal:**
Realizar una auditoría técnica completa del código existente, identificar deuda técnica y gaps, y generar un plan de ejecución detallado para la Fase 2 (Reportes, Migración de Sheets, Bots externos).

**Instrucciones de Ejecución:**

### 1. 🕵️‍♂️ Análisis del Estado Actual (Checkout)
Revisa sistemáticamente todos los archivos del proyecto, con énfasis en `src/` y la documentación en `docs/`. Presta especial atención al archivo `11_phase1c_tasks` (si está disponible en el contexto) y a los módulos recién implementados:
- **Chat Module:** `src/app/(admin)/chat`, `src/lib/services/chat`, `src/app/api/v1/chat`.
- **Customer Portal:** `src/app/(portal)`, `src/components/portal`, `src/lib/hooks/useCustomerAuth.ts`.
- **Auth & Security:** `src/lib/auth`, middleware, roles y permisos.
- **Database:** `prisma/schema.prisma` y migraciones.

**Salida esperada para esta sección:**
- Inventario de funcionalidades operativas vs. planificadas.
- Diagrama de flujo de datos actual (explicado).
- Evaluación de la estructura de carpetas y patrones de diseño utilizados.

### 2. 🔍 Identificación de Gaps y Mejoras
Analiza el código buscando:
- **Deuda Técnica:** Patrones repetitivos, falta de tipos, componentes monolíticos, "magic strings".
- **Seguridad:** Validación de inputs (Zod), manejo de errores, protección de rutas, exposición de datos sensibles.
- **Performance:** Consultas N+1 en Prisma, renderizado innecesario, falta de memoización.
- **Testing:** Cobertura de tests unitarios e integración (revisar `src/tests`).

**Salida esperada:** Lista priorizada de refactorizaciones necesarias (Alta/Media/Baja).

### 3. 🚀 Roadmap Fase 2: Estrategia y Ejecución
Diseña el plan para las siguientes funcionalidades:
1.  **Reportes Avanzados:** Dashboard de KPIs, exportación PDF/CSV.
2.  **Migración Google Sheets:** Eliminar dependencia de Sheets, webhooks directos a Make.com.
3.  **Bot Externo:** Integración con WhatsApp/Telegram para clientes.
4.  **SPA Pública:** Landing page institucional.

**Salida esperada:**
- Breakdown de tareas por módulo.
- Estimación de complejidad (Story Points o T-Shirt sizing).
- Dependencias entre tareas.

### 4. 📝 Generación de Prompts para la Siguiente Fase
Crea 3-5 prompts técnicos y específicos que yo pueda usar posteriormente para implementar las características de la Fase 2.
- **Formato:** [Contexto] + [Tarea] + [Constraints] + [Output esperado].
- **Ejemplo:** "Prompt para implementar el servicio de generación de reportes con PDFKit..."

### 5. 📊 Métricas de Éxito
Define KPIs claros para validar la Fase 2:
- **Calidad:** % de cobertura de tests, tiempo de carga (LCP), puntuación de accesibilidad.
- **Negocio:** Tiempo de generación de reportes, tasa de error en webhooks.

---

**Formato de Respuesta:**
Por favor, entrega el resultado en formato Markdown estructurado, usando tablas para el inventario y listas con checkboxes para el roadmap. Mantén un tono profesional, técnico y orientado a la acción.
