# 🛠 RUNBOOK_OPERACIONES - Operación y Soporte Hago Produce

## SECCIÓN - Troubleshooting Común

| Problema                     | Síntoma                          | Diagnóstico                          | Solución                                   |
|------------------------------|----------------------------------|--------------------------------------|--------------------------------------------|
| Make.com no envía precios    | `ProductPrice` no se actualiza   | Revisar `WebhookLog` en DB           | Verificar API Key (`MAKE_WEBHOOK_API_KEY`) y URL del webhook |
| WhatsApp bot no responde     | Mensajes sin respuesta           | Revisar tabla `Message` (platform='whatsapp') | Verificar `TWILIO_AUTH_TOKEN` y URL del webhook en Twilio |
| Chat lento                   | Respuestas > 5 segundos          | Revisar logs de OpenAI / tiempos de respuesta | Verificar `OPENAI_API_KEY`, modelo y límites de rate de OpenAI |
| Notificaciones no llegan     | Registros en `notifications` sin envío real | Revisar campo `errorMessage` o logs de notificación | Verificar número de teléfono del cliente y credenciales de Twilio |

## SECCIÓN - Comandos de Diagnóstico

```sql
-- Ver últimos webhooks recibidos
SELECT * FROM webhook_log ORDER BY created_at DESC LIMIT 20;

-- Ver mensajes de WhatsApp recientes
SELECT * FROM messages WHERE platform = 'whatsapp' ORDER BY created_at DESC LIMIT 20;

-- Ver notificaciones fallidas
SELECT * FROM notifications WHERE is_read = false ORDER BY created_at DESC LIMIT 20;

-- Ver precios actualizados hoy por Make.com
SELECT *
FROM product_prices
WHERE source = 'make_automation'
  AND created_at > NOW() - INTERVAL '24 hours';
```

## SECCIÓN - Gestión de Caché de Reportes

### Verificación de Estado

```sql
-- Ver cachés activos y vigentes
SELECT * FROM report_cache WHERE expires_at > NOW();

-- Ver distribución de cachés por tipo
SELECT report_type, COUNT(*) FROM report_cache GROUP BY report_type;
```

### Invalidación Manual

Para forzar la actualización de datos (ej. después de una carga masiva):

```bash
# Invalidar TODO el caché (requiere token de admin)
curl -X DELETE https://api.hagoproduce.com/api/v1/reports/cache \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Invalidar solo reportes de Revenue
curl -X DELETE "https://api.hagoproduce.com/api/v1/reports/cache?type=REVENUE" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Configuración de Cron (Railway)

Para la limpieza automática de cachés expirados:

1.  Ir a **Railway Project** -> **Settings** -> **Cron Jobs**.
2.  Agregar nuevo Cron Job:
    *   **Schedule**: `0 * * * *` (Cada hora)
    *   **Command**:
        ```bash
        curl -X GET "https://${RAILWAY_PUBLIC_DOMAIN}/api/v1/cron/clean-report-cache" \
          -H "x-cron-secret: ${CRON_SECRET}"
        ```
