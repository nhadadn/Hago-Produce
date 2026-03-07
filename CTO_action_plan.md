# Plan de Acción CTO – HAGO PRODUCE

> Misión: Consolidar una “Verdad Absoluta” y una estrategia NLU/omnicanal que desbloquee el Sprint de Consultas con precisión y robustez, sin escribir código en esta fase.

## Objetivos
- Eliminar bloqueadores críticos que degradan la experiencia de usuario.
- Estabilizar la capa NLU y el manejo de sesiones en todos los canales.
- Entregar un Sprint 1 centrado en intents de consulta con métricas de calidad claras.

## Diagnóstico de Bloqueadores
- tool_choice mal estructurado en Function Calling
  - Por qué sucede: La invocación de herramientas exige una estructura estricta; si el selector de herramienta no se especifica correctamente, el modelo no ejecuta la función de extracción aunque el esquema esté definido.
  - Impacto: El LLM responde con texto libre en vez de extraer parámetros estructurados, forzando fallbacks y respuestas poco confiables. La extracción para órdenes/facturas se vuelve frágil y errática.
  - Evidencia: Implementaciones de extracción que usan un selector de función ambiguo (definición conceptual, sin reproducir código) impiden la activación consistente de la Tool.
- Regex “hambrienta” para invoice_number
  - Por qué sucede: Un patrón permisivo captura cualquier número cercano a la palabra “factura” o “invoice”, incluso cuando el usuario no solicita estatus documental.
  - Impacto: Desencadena detecciones falsas de invoice_status, mezclando consultas semánticas con números incidentales. Esto rompe la precisión y “enseña” al usuario que el bot no entiende.
  - Acción: Limitar la regex conceptualmente con anclajes semánticos (frases de intención) y delegar extracción de parámetros a Tools cuando haya API Key; usar reglas más estrictas para entornos sin IA.

## Hoja de Ruta – Sprint 1 (Consultas)
- Alcance: 7 intents de consulta
  - price_lookup, best_supplier, product_info, inventory_summary, invoice_status, overdue_invoices, customer_balance
- Objetivos por intent
  - NLU: Clasificación con prompt de Router + Tools de extracción donde aplique.
  - Extracción: Definición de parámetros mínimos (producto, cliente, filtros) y opcionales (proveedor, días, categoría).
  - Formato de respuesta: Corto, bilingüe (es/en), consistente, con fuentes.
  - Ergonomía: Sugerencias cuando no hay resultados o hay ambigüedad (clientes/productos múltiples).
- Priorización
  - P1: price_lookup, best_supplier, product_info, inventory_summary
  - P2: invoice_status, overdue_invoices
  - P3: customer_balance
- Métricas (Definiciones de éxito)
  - Precisión del intent (Top-1): ≥ 90% en corpus de prueba interno.
  - Tasa de extracción completa (params obligatorios presentes): ≥ 85%.
  - Tasa de respuesta útil (no vacía y con fuentes): ≥ 95%.
  - Latencia percibida: < 2.5 s en consultas típicas (con caché de prompts).
- Historias y criterios de aceptación (por intent)
  - price_lookup: Dado un término de producto, devuelve costos/precios ordenados, con sugerencias si vacío. No confunde frases genéricas (“¿qué tienes?”).
  - best_supplier: Devuelve N mejores proveedores; nunca muestra costos 0; sugiere productos si no hay coincidencias.
  - product_info: Devuelve ficha; si producto inactivo, informa estado; ofrece sugerencias fuzzies.
  - inventory_summary: Devuelve catálogo por categoría/termino; ofrece categorías si filtro vacío.
  - invoice_status: Soporta número exacto, “última” y listados; no captura números ajenos.
  - overdue_invoices: Reporte por cliente y global; etiqueta urgencia por días; sugiere clientes si no encuentra.
  - customer_balance: Devuelve agregados por cliente/global; incluye desglose de estatus y fecha más antigua.

## Estrategia Omnicanal – Persistencia de sessionId
- Principio: Unificar el ciclo de vida de sesión en Web, WhatsApp y Telegram para sostener multi-turno.
- Web (Next.js)
  - Persistir sessionId en almacenamiento del cliente (cookie/localStorage) y enviarlo en cada request.
  - Renovación: Regenerar si inactivo > X horas, manteniendo contexto si el usuario permanece en el hilo.
- WhatsApp
  - Mapeo determinista: phone_number → sessionId estable por hilo/conversación.
  - Reglas: Si el usuario inicia un nuevo tópico (palabras clave de “nuevo”/“cancelar”), cerrar sesión previa y crear nueva; caso contrario, reutilizar.
  - Seguridad: Lista de remitentes permitidos; TTL de sesión y auditoría de confirmaciones.
- Telegram
  - Mapeo determinista: chat_id → sessionId; comportamiento idéntico a WhatsApp.
  - Reglas: Sesiones por chat (no por usuario global), con cierres al confirmar/cancelar flujos transaccionales.
- Consideraciones comunes
  - Conflictos: Si hay múltiples canales simultáneos, priorizar el último canal activo pero mantener contexto coherente.
  - Auditoría: Log de decisiones críticas en confirmaciones (órdenes/facturas), con vínculo a sessionId.

## Matriz de Responsabilidad de Archivos
- Orquestación y sesión
  - src/app/api/chat/route.ts: Recupera/crea ChatSession, actualiza context y messages, limpia pending* tras confirm/cancel, soporta SSE.
  - Responsabilidad: Fuente de verdad de contexto por sessionId. Debe ser neutral al canal y robusto a reintentos.
- Cerebro NLU
  - src/lib/services/chat/openai-client.ts: System prompt, Router prompt, formato de respuesta, gestión de errores.
  - Responsabilidad: Clasificación y enunciados; activar Tools de extracción y dar respuestas consistentes aun sin IA (fallback pedagógico).
- Dispatcher
  - src/lib/services/chat/query-executor.ts: Mapa determinista de intent → handler, pasando language/context.
  - Responsabilidad: No debe contener lógica de negocio; solo enrutar y regresar resultados.
- Detección inicial
  - src/lib/services/chat/intents.ts: Reglas de confirm/cancel en multi-turno; señales ligeras; delega a NLU completo con Tools.
  - Responsabilidad: No invadir con regex hambrientas; preferir preguntas aclaratorias si ambiguo.
- Handlers (17)
  - src/lib/services/chat/intents/*.ts: Implementan consulta/acción, sanitización, sugerencias, fuentes y conformidad con tipos.
  - Responsabilidad: No tomar decisiones NLU; recibir parámetros ya validados y responder con estructura consistente.
- Utilidades
  - src/lib/services/chat/utils/text-utils.ts: Limpieza semántica de términos (stopwords), conservadora.
  - Responsabilidad: Evitar reducciones que destruyan significado; loguear refinamientos.

## Resumen Ejecutivo
- La experiencia actual se degrada por fallos de invocación de Tools y heurísticas permisivas. La estrategia plantea un Router con prompts precisos, Tools de extracción bien definidas y una sesión omnicanal estable que preserva el contexto.
- El Sprint 1 prioriza consultas con métricas claras, respuestas bilingües, sugerencias cuando falte información y auditoría en eventos críticos. Con esto, el bot gana precisión y confianza del usuario sin cambios de arquitectura mayores.

## Checklist de QA (Sprint 1)
1. El Router asigna correctamente los 7 intents de consulta en corpus de prueba.
2. El bot pregunta aclaraciones cuando falta el producto/cliente en consultas.
3. No se dispara invoice_status por números presentes en texto no documental.
4. price_lookup no se activa si el usuario pide catálogo o info genérica.
5. best_supplier nunca devuelve precios 0 y ordena por costo ascendente.
6. product_info informa producto inactivo y ofrece sugerencias fuzzies.
7. inventory_summary devuelve resumen por categoría y sugiere categorías si vacío.
8. overdue_invoices etiqueta urgencia según días y maneja global/cliente.
9. customer_balance refleja agregados correctos y desgloses por estatus.
10. sessionId se mantiene estable en Web/WhatsApp/Telegram y limpia pending* tras confirm/cancel.

