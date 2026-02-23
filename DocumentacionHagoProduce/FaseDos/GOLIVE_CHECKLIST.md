# ✅ GOLIVE_CHECKLIST - Puesta en Producción Hago Produce

- [ ] `DATABASE_URL` apunta a la base de datos de **producción**.
- [ ] `OPENAI_API_KEY` configurado y con créditos suficientes.
- [ ] `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN` de cuenta de **producción**.
- [ ] `TWILIO_WHATSAPP_NUMBER` es número de producción (no sandbox).
- [ ] Escenario de Make.com activo y apuntando a la URL de producción.
- [ ] API Key **"Make.com Price Automation"** creada en Admin UI (`/admin/bot-api-keys`).
- [ ] Webhook URL de Twilio apunta a `/api/v1/bot/webhook/whatsapp` en producción.
- [ ] `CRON_SECRET` configurado y usado en endpoints de cron.
- [ ] `JWT_SECRET` y `NEXTAUTH_SECRET` son strings seguros (32+ caracteres aleatorios).
- [ ] SSL/HTTPS activo en el dominio de producción.
- [ ] Endpoint `/api/health` responde `200` en producción.
- [ ] Test de WhatsApp: enviar "hola" al número de producción y recibir respuesta del bot.
- [ ] Test de Make.com: subir PDF de prueba y verificar actualización de precios en DB.
- [ ] Test de notificaciones: cambiar estado de una factura de prueba y verificar recepción de WhatsApp/email.

