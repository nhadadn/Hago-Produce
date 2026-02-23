# Reporte de Hallazgos: Referencias a Modelos Fase 2

**Fecha:** 23 de Febrero, 2026
**Contexto:** Validación de compatibilidad de código existente con nuevos modelos `Notification` y `ReportCache`.

---

## 1. Resumen de Búsqueda

Se realizó una búsqueda exhaustiva en todo el código base para identificar referencias a los nuevos modelos implementados.

| Modelo | Referencias Encontradas | Archivos Clave | Estado de Compatibilidad |
|--------|-------------------------|----------------|--------------------------|
| **Notification** | 63 archivos (mayoría documentación) | `src/lib/services/notifications/service.ts`, `types.ts` | ⚠️ Requiere Refactorización |
| **ReportCache** | 10 archivos (solo documentación/schema) | Ninguno en código fuente | ✅ Seguro (Nueva implementación) |

---

## 2. Análisis Detallado: Modelo Notification

### 🔍 Hallazgos en Código Fuente
El código actual en `src/lib/services/notifications/` implementa un sistema de notificaciones "en memoria" o basado en logs, sin utilizar una tabla dedicada en la base de datos.

**Archivo:** `src/lib/services/notifications/service.ts`
- **Uso actual:** Utiliza `prisma.auditLog.create` para registrar el envío de notificaciones.
- **Inconsistencia:** No utiliza el nuevo modelo `prisma.notification`.
- **Lógica de negocio:** Envía emails y webhooks directamente, registrando el resultado en `AuditLog`.

**Archivo:** `src/lib/services/notifications/types.ts`
- **Tipos definidos:** `NotificationPayload`, `NotificationTrigger`, `NotificationChannel`.
- **Compatibilidad:** Los tipos definidos son para el *payload* de envío, no para la persistencia en base de datos.

### ⚠️ Inconsistencias Detectadas
1.  **Persistencia Incorrecta:** El servicio actual guarda las notificaciones como entradas genéricas en `AuditLog` en lugar de usar la tabla `notifications` recién creada.
2.  **Falta de Relación con Usuario:** El servicio actual maneja `customerId` pero el modelo `Notification` tiene una relación fuerte con `User` (`userId`).
3.  **Campos Faltantes:** El modelo `Notification` requiere `title` y `message`, mientras que el servicio actual trabaja con `payloads` estructurados (JSON) específicos por tipo de trigger.

### 🛠️ Recomendaciones de Ajuste
Es necesario refactorizar `src/lib/services/notifications/service.ts` para:
1.  Crear un registro en `prisma.notification` además (o en lugar) de `AuditLog`.
2.  Generar `title` y `message` legibles a partir del `NotificationPayload` antes de guardar.
3.  Resolver el `userId` a partir del `customerId` (notificar a todos los usuarios del cliente) o adaptar el modelo para permitir `customerId` opcional.

---

## 3. Análisis Detallado: Modelo ReportCache

### 🔍 Hallazgos en Código Fuente
No se encontraron referencias a `ReportCache` ni `prisma.reportCache` en el código fuente (`src/`).

### ✅ Validación
- **Estado:** Limpio. No hay código legado que pueda romperse.
- **Oportunidad:** La implementación del servicio de caché de reportes puede comenzar desde cero utilizando el nuevo modelo sin riesgo de regresión.

---

## 4. Conclusión y Próximos Pasos

El schema implementado es **técnicamente válido**, pero el código existente de notificaciones **no lo está utilizando todavía**.

**Acciones Requeridas:**
1.  **Refactorizar `NotificationsService`**: Modificar `logNotification` para escribir en la tabla `notifications`.
2.  **Mapeo de Datos**: Implementar una función helper que transforme `NotificationPayload` -> `title/message` para la persistencia.
3.  **Implementar `ReportCacheService`**: Crear el servicio nuevo para utilizar el modelo `ReportCache`.

Este reporte confirma que la migración de base de datos es segura de ejecutar (no romperá código existente porque el código no usa los modelos aún), pero la funcionalidad completa requerirá actualizaciones en la capa de servicios.
