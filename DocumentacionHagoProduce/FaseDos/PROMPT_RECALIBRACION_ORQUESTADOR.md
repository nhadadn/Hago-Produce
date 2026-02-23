# 🤖 PROMPT MAESTRO DE RECALIBRACIÓN - HAGO PRODUCE

**Rol:** Agente Orquestador / Arquitecto de Soluciones
**Contexto Actual:** Fin del Sprint 1 (Fase 2 - Consolidación) -> Inicio Sprint 2 (Integraciones)
**Objetivo:** Recalibrar la estrategia de ejecución para el Sprint 2 y asegurar una transición sólida hacia la Fase 3, basándose en la auditoría del Sprint 1.

---

## 1. 📥 INPUT DE CONTEXTO (Estado Actual)

Has completado exitosamente el **Sprint 1** de la Fase 2.
- **Logros:** Admin UI de API Keys, Chat Universal Flotante, Persistencia Local, Tests Base.
- **Deuda Técnica Identificada (Gaps):**
  - *Testing:* Flakiness en tests E2E (Timeouts en Firefox).
  - *Seguridad:* Falta Rate Limiting estricto en el endpoint público del chat.
  - *Integración:* La conexión con OpenAI/WhatsApp es simulada o básica; se requiere implementación real de negocio.
  - *UX Móvil:* Ajustes finos de superposición en viewports pequeños.

## 2. 📚 REFERENCIAS DOCUMENTALES CLAVE

Para comprender la profundidad del estado actual y la arquitectura deseada, **DEBES** analizar los siguientes documentos antes de planificar:

### A. Estado del Sprint 1 (Fase 2)
1.  **`DocumentacionHagoProduce/FaseDos/CHECKPOINT_DIA3_SPRINT1.md`**
    *   *Contenido:* Informe de cierre del Sprint 1, métricas de calidad, estado de componentes (Chat, Admin UI) y decisión de continuidad.
    *   *Uso:* Verificar qué está completado al 100% y qué quedó pendiente (Gaps).

2.  **`DocumentacionHagoProduce/FaseDos/PROMPTS_SPRINT1_CONSOLIDACION.md`**
    *   *Contenido:* Historial detallado de prompts ejecutados, respuestas de agentes y validaciones técnicas.
    *   *Uso:* Entender el "cómo" se implementó cada feature y evitar duplicar esfuerzos.

3.  **`DocumentacionHagoProduce/FaseDos/ROADMAP_TECNICO_DETALLADO.md`**
    *   *Contenido:* Plan maestro de la Fase 2.
    *   *Uso:* Actualizar este documento moviendo tareas completadas y ajustando las prioridades del Sprint 2.

### B. Arquitectura Base (Documentación Core)
4.  **`DocumentacionHagoProduce/docs/02_data_model.md`**
    *   *Contenido:* Definición de modelos Prisma (User, Tenant, Invoice, etc.).
    *   *Uso:* Asegurar que las nuevas tablas (Webhooks, ChatSessions) respeten las relaciones y convenciones existentes.

5.  **`DocumentacionHagoProduce/docs/03_api_contracts.md`**
    *   *Contenido:* Estándares de respuesta API, manejo de errores y autenticación.
    *   *Uso:* Mantener consistencia en los nuevos endpoints de integración (WhatsApp, Make).

## 3. 🧠 NUEVAS DIRECTRICES DE EJECUCIÓN (Lecciones Aprendidas)

Para la generación de los siguientes prompts (Sprint 2 en adelante), DEBES seguir estas reglas estrictas de recalibración:

### A. Estrategia de "Meta-Prompts" (Batching)
❌ **NO** generes prompts atómicos y fragmentados (ej: Prompt A: "Crear tabla", Prompt B: "Crear servicio", Prompt C: "Crear UI").
✅ **SÍ** genera prompts de funcionalidad completa (Vertical Slicing).
   - *Ejemplo:* "Implementar Webhook de WhatsApp Completo: Modelo DB + Endpoint API + Validación de Firma + Log en Base de Datos".

### B. TDD & Security First (Shift-Left)
❌ **NO** dejes los tests y la seguridad para un prompt final de "Limpieza".
✅ **SÍ** incluye requisitos de Testing y Seguridad en CADA prompt de implementación.
   - *Requisito:* "Implementar endpoint X **con validación Zod, Rate Limiting de 10 req/min y Tests de Integración que validen 200 y 400**".

### C. Definición de Integraciones
❌ **NO** uses términos vagos como "Integrar servicio".
✅ **SÍ** especifica el nivel de integración:
   - *Nivel 1 (Stub):* Mockear respuesta para UI.
   - *Nivel 2 (Conexión):* Auth exitosa y ping.
   - *Nivel 3 (Negocio):* Flujo completo con transformación de datos.

### D. Automatización y Orquestación de Flujos
✅ **REQUERIMIENTO CRÍTICO:** El Agente Orquestador debe entender y desarrollar las automatizaciones necesarias (internas o externas) para la operatividad total de los chatbots.
   - *Make.com (Integromat):* Diseñar y documentar escenarios para orquestar flujos complejos (ej: "Nuevo Pedido en Chat" -> "Webhook Make" -> "Validar Stock" -> "Notificar Almacén").
   - *Internal Automation:* Jobs programados (Cron) para limpieza de sesiones, reintento de webhooks fallidos.
   - *External Triggers:* Configuración explícita de webhooks en proveedores (Meta, Stripe) para cerrar el ciclo de eventos.

## 4. 🎯 OBJETIVOS DEL SPRINT 2 (RECALIBRADO)

Tu tarea es generar el plan de ejecución para el **Sprint 2: Integraciones Externas & Lógica de Negocio**.

**Focos Prioritarios:**
1.  **Hardening del Chat:** Resolver GAP-01 (Tests) y GAP-03 (Rate Limit) inmediatamente.
2.  **WhatsApp Business API:** Implementación real de webhooks (Recepción -> Validación -> Proceso -> Respuesta).
3.  **RAG (Retrieval Augmented Generation):** Conectar el chat con la base de datos de productos/inventario real (no mocks).
4.  **Make.com / Webhooks:** Sincronización bidireccional de precios/stock y orquestación de flujos de negocio.

## 5. 📝 INSTRUCCIÓN DE SALIDA

Basado en lo anterior, genera los siguientes entregables:

1.  **Actualización del Roadmap:** Ajusta el `ROADMAP_TECNICO_DETALLADO.md` moviendo los Gaps detectados al inicio del Sprint 2.
2.  **Lista de Prompts del Sprint 2:** Genera la secuencia de prompts (aprox 4-5 Meta-Prompts) para ejecutar el Sprint 2 completo, siguiendo las nuevas directrices.
   - *Prompt 2.1:* Hardening & Security (Cierre de Gaps Sprint 1).
   - *Prompt 2.2:* Infraestructura de Webhooks (WhatsApp + Meta Verify).
   - *Prompt 2.3:* Motor de Inteligencia (RAG Simple para consulta de inventario).
   - *Prompt 2.4:* Integración Transaccional y Automatización (Make.com + Flujos Internos).

---
**Comando de Ejecución:**
"Analiza este prompt de recalibración y las referencias documentales adjuntas, luego procede a generar la estructura de prompts para el Sprint 2."
