# 📚 AUTOMATIZACIONES_MASTER - Hago Produce

## SECCIÓN 1 - Inventario de Automatizaciones

| ID      | Nombre               | Plataforma | Trigger             | Acción                          | Estado | Frecuencia |
|---------|----------------------|-----------|---------------------|---------------------------------|--------|-----------|
| AUTO-01 | Price Extraction     | Make.com  | Nuevo PDF en Drive  | Actualizar precios en DB        | Activo | On-demand |
| AUTO-02 | Invoice Notifications| Internal  | Cambio de estado    | WhatsApp al cliente             | Activo | Event-driven |
| AUTO-03 | Overdue Reminders    | Cron      | Diario 9am          | WhatsApp facturas vencidas      | Activo | Diario    |
| AUTO-04 | WhatsApp Bot         | Twilio    | Mensaje entrante    | Respuesta del bot               | Activo | Real-time |
| AUTO-05 | Telegram Bot         | Telegram  | Mensaje entrante    | Respuesta del bot               | Activo | Real-time |

## SECCIÓN 2 - Diagrama de Flujo Completo

```text
[Google Drive PDF] → [Make.com] → [PDF.co] → [OpenAI] → [Webhook /make] → [DB ProductPrice]
                                                                              ↓
[WhatsApp Usuario] → [Twilio] → [Webhook /whatsapp] → [Bot Query Service] → [OpenAI RAG]
                                                                              ↓
[Invoice Status Change] → [Notifications Service] → [Twilio] → [WhatsApp Cliente]
                                                              → [Email Cliente]
[Cron 9am] → [Overdue Check] → [Twilio] → [WhatsApp Clientes con facturas vencidas]
```

## SECCIÓN 3 - Variables de Entorno Requeridas

- `DATABASE_URL`: cadena de conexión PostgreSQL (Railway → Settings → Connect).
- `OPENAI_API_KEY`: clave de OpenAI (platform.openai.com → API Keys).
- `TWILIO_ACCOUNT_SID`: SID de cuenta Twilio (console.twilio.com → Account Info).
- `TWILIO_AUTH_TOKEN`: Auth Token de Twilio (console.twilio.com → Account Info).
- `TWILIO_WHATSAPP_NUMBER`: número WhatsApp configurado en Twilio (sandbox o producción).
- `TWILIO_WEBHOOK_URL`: URL pública del webhook `/api/v1/bot/webhook/whatsapp`.
- `MAKE_WEBHOOK_API_KEY`: API Key creada en `/admin/bot-api-keys` para Make.com.
- `CHAT_RATE_LIMIT`: límite de requests por minuto en `/api/chat` (default recomendado: 20).
- `CRON_SECRET`: string aleatorio para proteger endpoints de cron internos.
- `JWT_SECRET`: secreto JWT (mínimo 32 caracteres aleatorios).
- `NEXTAUTH_SECRET`: secreto de NextAuth (mínimo 32 caracteres aleatorios).

