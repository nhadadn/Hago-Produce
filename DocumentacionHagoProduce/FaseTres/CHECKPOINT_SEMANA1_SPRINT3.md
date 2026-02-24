# Checkpoint Semana 1 - Sprint 3

**Fecha:** 24 de Febrero de 2026
**Responsable:** Tech Lead / AI Assistant

## 1. Estado de Prompts P0 (Críticos)

| Prompt ID | Descripción | Estado | Notas |
|-----------|-------------|--------|-------|
| **S3-P03** | E2E Firefox (Playwright) | ❌ | Tests fallando. El botón "Abrir asistente" no es visible en el tiempo esperado (timeout 5s). |
| **S3-P07** | Email Service | ❌ | Tests fallando. Discrepancia entre la implementación (`sendPurchaseOrderEmail`, `sendInvoiceEmail`) y los tests que esperan `sendEmail`. |
| **S3-P08** | Telegram Service | ✅ | Implementación completa y tests pasando. |
| **S3-P01-A** | Create Order (Extracción) | ✅ | Intent `create-order` extrae parámetros correctamente. |
| **S3-P01-B** | Create Order (Envío) | ✅ | Tests de intent pasan correctamente. |

## 2. Métricas

*   **Coverage total del proyecto:** *Pendiente de cálculo global*
*   **E2E Firefox pasando:** ❌ (0/3 tests pasando)
*   **Tests de Email Service pasando:** 0/7 (Fallos por error de importación/API mismatch)
*   **Tests de Telegram Service pasando:** 5/5
*   **Tests de Create Order pasando:** 2/2

## 3. Archivos Modificados/Creados (Relevantes)

*   `src/lib/services/telegram/telegram.service.ts`
*   `src/lib/services/telegram/__tests__/telegram.service.test.ts`
*   `src/lib/services/bot/chat/intents/create-order.ts`
*   `src/lib/services/bot/chat/intents/__tests__/create-order.test.ts`
*   `playwright.config.ts`
*   `src/tests/unit/reports/report-cache.test.ts` (S3-P02 - Adicional completado)
*   `src/app/api/v1/cron/clean-report-cache/route.ts` (S3-P02 - Adicional completado)

## 4. Variables de Entorno Configuradas

*   **EMAIL_PROVIDER:** No configurado en `.env.example` (Implementación usa fallback a 'mock')
*   **SENDGRID/RESEND API KEY:** No presentes en `.env.example`
*   **TELEGRAM_BOT_TOKEN:** Presente en código pero no en `.env.example`

## 5. Decisión de Continuidad

**¿Listo para continuar a Semana 2 (P1)?**
🔴 **NO**

**Bloqueadores Identificados:**
1.  **E2E Firefox:** El flujo crítico de apertura del chat falla en Firefox. Requiere corrección de selectores o tiempos de espera.
2.  **Email Service:** La implementación actual no coincide con la suite de pruebas. Se debe refactorizar el servicio para exponer `sendEmail` genérico o actualizar los tests para usar los métodos específicos.
3.  **Configuración de Entorno:** Faltan variables críticas en `.env.example` para despliegue real (Email, Telegram).

---
**Próximos Pasos Recomendados:**
1.  Corregir selectores en `tests/chat.spec.ts` para E2E.
2.  Alinear `email.service.ts` con `email.service.test.ts`.
3.  Actualizar `.env.example`.
