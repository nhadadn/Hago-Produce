# Guía de Configuración: Twilio WhatsApp Business (Sandbox y Producción)

## SECCIÓN A - Sandbox (Desarrollo)

1. Ingresar a console.twilio.com → Messaging → Try it out → Send a WhatsApp message
2. Conectar tu número enviando "join [sandbox-keyword]" al número de Twilio mostrado
3. En Sandbox Settings configurar Webhook URL:
   - When a message comes in: https://[ngrok-url]/api/v1/bot/webhook/whatsapp
   - Method: HTTP POST
4. Copiar Account SID y Auth Token a `.env.local`:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_WHATSAPP_NUMBER
   - TWILIO_WHATSAPP_FROM (usar formato `whatsapp:+1XXXXXXXXXX`)
   - TWILIO_WEBHOOK_URL
   - TWILIO_SANDBOX_MODE=true
5. Probar enviando un mensaje al número de sandbox

## SECCIÓN B - Producción (WhatsApp Business API)

1. Solicitar acceso a WhatsApp Business API en Twilio Console
2. Registrar el número de teléfono de negocio
3. Completar perfil de negocio (nombre, logo, descripción)
4. Configurar Webhook URL de producción:
   - URL: https://hagoproduce.com/api/v1/bot/webhook/whatsapp
   - Fallback URL: opcional
5. Verificar que el webhook responde correctamente en producción
6. Crear y aprobar templates de mensajes en Meta (para outbound)

## SECCIÓN C - Templates de WhatsApp Requeridos

- invoice_status_change
  - Hola {{1}}, tu factura {{2}} ha cambiado a estado {{3}}. Total: {{4}} CAD.
- invoice_overdue
  - Hola {{1}}, tu factura {{2}} está vencida desde hace {{3}} días. Total pendiente: {{4}} CAD.
- payment_received
  - Hola {{1}}, hemos recibido tu pago de {{2}} CAD para la factura {{3}}. ¡Gracias!

## Notas

- Asegurar variables en `.env.example` y `.env` para Twilio y NOTIFICATIONS_WEBHOOK_URL
- En producción, la firma del webhook de Twilio se valida automáticamente
- El backend aplica rate limiting por número y registra eventos en AuditLog
