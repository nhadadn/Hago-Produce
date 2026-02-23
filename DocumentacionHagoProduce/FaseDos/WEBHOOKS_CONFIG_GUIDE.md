# 🌐 WEBHOOKS_CONFIG_GUIDE - Webhooks Externos

## WEBHOOK 1 - Twilio WhatsApp → Hago Produce

- **URL del webhook**: `https://[dominio]/api/v1/bot/webhook/whatsapp`
- **Configuración en Twilio**:
  1. Ingresar a `console.twilio.com`.
  2. Ir a **Phone Numbers** → seleccionar el número de WhatsApp.
  3. Pestaña **Messaging**.
  4. Campo **A message comes in**:
     - Método: `HTTP POST`.
     - URL: `https://[dominio]/api/v1/bot/webhook/whatsapp`.
  5. Guardar cambios.

- **Prueba rápida con curl**:

```bash
curl -X POST "https://[dominio]/api/v1/bot/webhook/whatsapp" \
  -d "Body=hola" \
  -d "From=whatsapp:+1234567890"
```

Si la configuración es correcta, el backend registrará el mensaje en la tabla `Message` y responderá según la lógica del bot.

## WEBHOOK 2 - Make.com → Hago Produce (Precios)

- **URL del webhook**: `https://[dominio]/api/v1/webhooks/make`
- **Headers requeridos**:
  - `X-API-Key: [key generada en /admin/bot-api-keys]`.
  - `X-Idempotency-Key: [identificador único por archivo/item]`.

- **Prueba rápida con curl**:

```bash
curl -X POST "https://[dominio]/api/v1/webhooks/make" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: MI_API_KEY" \
  -H "X-Idempotency-Key: prueba-123" \
  -d '{
    "eventType": "price.updated",
    "data": {
      "product_name": "Manzana Gala",
      "supplier_name": "Frutas Selectas",
      "cost_price": 18.0,
      "sell_price": 22.0,
      "currency": "CAD",
      "effective_date": "2024-01-01",
      "source": "make_automation"
    },
    "timestamp": "2024-01-01T00:00:00Z",
    "idempotencyKey": "prueba-123"
  }'
```

Si el webhook está correctamente configurado, debe responder con `success: true` y registrar un `WebhookLog` con `source = 'make'`.

