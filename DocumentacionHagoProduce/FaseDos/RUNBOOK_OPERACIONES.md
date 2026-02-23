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

