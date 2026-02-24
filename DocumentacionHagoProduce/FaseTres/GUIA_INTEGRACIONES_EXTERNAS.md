# 🔗 Guía Maestra de Integraciones Externas - Hago Produce

> **Fecha de Creación:** 2026-02-24  
> **Versión:** 1.0  
> **Sprint:** 3

Esta guía detalla el proceso completo de configuración para todas las integraciones externas requeridas por el sistema Hago Produce. Sigue estos pasos para asegurar un despliegue exitoso en cualquier entorno (Dev/Staging/Prod).

---

## 📋 1. Inventario de Integraciones

El sistema depende de los siguientes servicios externos para operar al 100% de su capacidad.

| Servicio | Propósito Crítico | Tipo de Autenticación | Variables de Entorno Clave |
| :--- | :--- | :--- | :--- |
| **OpenAI (GPT)** | Inteligencia del Chatbot, extracción de intents y parámetros de órdenes. | Bearer Token | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| **Twilio** | Envío y recepción de mensajes de WhatsApp y SMS. | Basic Auth (SID/Token) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` |
| **Telegram** | Canal alternativo para notificaciones y chat con clientes. | Bot Token | `TELEGRAM_BOT_TOKEN` |
| **Email (Resend/SendGrid)** | Envío transaccional de facturas (PDF) y órdenes de compra. | Bearer Token | `EMAIL_PROVIDER`, `RESEND_API_KEY` o `SENDGRID_API_KEY` |
| **Make.com (Integromat)** | Automatización de flujos y actualización masiva de precios (Webhooks). | Custom Header (`x-api-key`) | `MAKE_WEBHOOK_SECRET` |

---

## 🔐 2. Configuración del Entorno (Seguridad)

**⚠️ ADVERTENCIA DE SEGURIDAD:**  
No existe (y no debe existir) un módulo en el Frontend para ingresar estas claves maestras. Por seguridad, estas credenciales se gestionan **exclusivamente a través de variables de entorno** en el servidor. Nunca deben ser expuestas al navegador ni commiteadas al repositorio.

### Estructura del archivo `.env`
Crea o edita el archivo `.env` en la raíz del proyecto. Usa este template como referencia:

```ini
# ==============================================
# 🤖 INTELLIGENCE (OpenAI)
# ==============================================
# Clave API de OpenAI (debe tener acceso a GPT-4o o GPT-4-Turbo)
OPENAI_API_KEY="sk-proj-..."
# Modelo a utilizar (recomendado: gpt-4o-mini por costo/velocidad)
OPENAI_MODEL="gpt-4o-mini"

# ==============================================
# 💬 MESSAGING (Twilio WhatsApp)
# ==============================================
# SID de la cuenta (Dashboard principal de Twilio)
TWILIO_ACCOUNT_SID="AC..."
# Token de autenticación (Dashboard principal)
TWILIO_AUTH_TOKEN="cx..."
# Número de origen (Sandbox: "whatsapp:+14155238886" / Prod: Tu número verificado)
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"

# ==============================================
# ✈️ MESSAGING (Telegram Bot)
# ==============================================
# Token obtenido de @BotFather
TELEGRAM_BOT_TOKEN="123456789:ABC-DEF..."

# ==============================================
# 📧 EMAIL SERVICE
# ==============================================
# Proveedor activo: 'resend', 'sendgrid', o 'mock' (para pruebas locales sin envío real)
EMAIL_PROVIDER="resend"
# Clave API de Resend (si se usa provider='resend')
RESEND_API_KEY="re_..."
# Clave API de SendGrid (si se usa provider='sendgrid')
# SENDGRID_API_KEY="SG..."

# ==============================================
# 🔄 INTEGRATIONS (Make.com / Webhooks)
# ==============================================
# Clave secreta compartida que Make debe enviar en el header 'x-api-key'
# Genera una cadena aleatoria fuerte (ej. openssl rand -hex 32)
MAKE_WEBHOOK_SECRET="tu_secreto_seguro_para_webhooks_hago_produce_2026"
```

---

## 🛠️ 3. Configuración Paso a Paso por Servicio

### A. OpenAI (GPT) 🤖
1.  **Crear cuenta:** Ve a [platform.openai.com](https://platform.openai.com/).
2.  **API Key:** En el menú lateral, ve a **API Keys** > **Create new secret key**.
    *   **Nombre:** `HagoProduce-Prod` (o Dev).
    *   **Permisos:** "All" (o restringido a Model Capabilities si está disponible).
    *   Copia la clave `sk-...` inmediatamente.
3.  **Configuración:** Pégala en `OPENAI_API_KEY`.
4.  **Billing:** Asegúrate de agregar créditos (Prepaid billing) en **Settings > Billing**, de lo contrario la API rechazará las peticiones.

### B. Twilio (WhatsApp) 💬
1.  **Crear cuenta:** Ve a [twilio.com](https://www.twilio.com/).
2.  **Credenciales:** En el Dashboard principal copia el **Account SID** y **Auth Token**.
3.  **WhatsApp Sandbox (Desarrollo):**
    *   Ve a **Messaging** > **Try it out** > **Send a WhatsApp message**.
    *   Sigue las instrucciones para unir tu número personal al Sandbox enviando un código al número de Twilio.
    *   El número "From" suele ser `whatsapp:+14155238886`.
4.  **Configuración Webhook (Recepción de Mensajes):**
    *   En la configuración de Sandbox de Twilio, busca el campo **"When a message comes in"**.
    *   URL: `https://tu-dominio.com/api/v1/bot/webhook/whatsapp`
    *   Método: `POST`.

### C. Telegram Bot ✈️
1.  **Crear Bot:** Abre Telegram y busca a **@BotFather**.
2.  **Comando:** Envía `/newbot`.
    *   Elige un nombre visual (ej. "Hago Produce Bot").
    *   Elige un username único (debe terminar en `bot`, ej. `hago_produce_dev_bot`).
3.  **Token:** BotFather te dará un token como `123456:ABC-DEF...`.
4.  **Configuración:** Pégalo en `TELEGRAM_BOT_TOKEN`.
5.  **Webhook:**
    *   Telegram requiere configurar el webhook manualmente una vez. Visita esta URL en tu navegador (reemplazando los valores):
    *   `https://api.telegram.org/bot<TU_TOKEN>/setWebhook?url=https://tu-dominio.com/api/v1/bot/webhook/telegram`
    *   Debes recibir una respuesta JSON: `{"ok":true, "result":true, "description":"Webhook was set"}`.

### D. Email (Resend - Recomendado) 📧
1.  **Crear cuenta:** Ve a [resend.com](https://resend.com/).
2.  **API Key:** Crea una nueva API Key con permisos de "Sending emails".
3.  **Verificación de Dominio:**
    *   Agrega tu dominio (ej. `hagoproduce.com`).
    *   Agrega los registros DNS (DKIM, SPF) que Resend te proporciona en tu proveedor de dominio (GoDaddy, Cloudflare, etc.).
    *   **Nota:** En desarrollo, solo puedes enviar correos a la dirección de email con la que te registraste, a menos que verifiques el dominio.

### E. Make.com (Integromat) 🔄
Esta integración permite que Make actualice precios o inventarios en Hago Produce.

1.  **Seguridad:** Define una contraseña segura en `MAKE_WEBHOOK_SECRET` en tu `.env`.
2.  **En Make.com:**
    *   Crea un escenario.
    *   Agrega un módulo **HTTP** > **Make a request**.
    *   **URL:** `https://tu-dominio.com/api/v1/webhooks/make/prices` (para actualización de precios).
    *   **Method:** `POST`.
    *   **Headers:**
        *   Key: `x-api-key`
        *   Value: (El valor de tu `MAKE_WEBHOOK_SECRET`)
        *   Key: `Content-Type`
        *   Value: `application/json`
    *   **Body type:** `Raw`.
    *   **Content type:** `JSON (application/json)`.
    *   **Request content:** (Ejemplo para precios)
        ```json
        {
          "prices": [
             { "productSku": "TOM-001", "price": 25.50, "supplierId": "SUP-123" }
          ]
        }
        ```

---

## 🧩 4. Sobre el Módulo Frontend de API Keys

**¿Existe una interfaz visual para esto?**
Sí, existe en: `Admin > Configuración > Bot API Keys`.

**¿Para qué sirve?**
⚠️ **NO sirve para configurar OpenAI o Twilio.**
Este módulo sirve para **GENERAR** claves de API internas de Hago Produce.

*   **Caso de Uso:** Si tienes un cliente externo (ej. un script de un proveedor logístico) que necesita consultar *tu* API, tú le generas una clave aquí.
*   **Funcionamiento:** Crea, rota y revoca claves que se guardan en la base de datos.
*   **Uso:** El cliente externo debe enviar esta clave en el header `x-api-key` al consumir tus endpoints.

---

## 🩺 5. Pruebas de Conectividad (Health Check)

Puedes verificar el estado de las integraciones ejecutando los siguientes comandos:

### Ejecutar Tests de Integración
El proyecto cuenta con tests automatizados para validar estas conexiones:

```bash
# 1. Probar integración de Notificaciones (Twilio/Telegram)
npm test src/tests/unit/notifications/twilio-telegram.test.ts

# 2. Probar integración de Chat (OpenAI)
# Nota: Esto puede consumir créditos reales si no está mockeado
npm test src/lib/services/chat/openai-client.ts
```

### Endpoint de Health (Próximamente)
Se recomienda implementar un endpoint `/api/health/integrations` que retorne el estado de configuración:

```json
{
  "status": "ok",
  "integrations": {
    "openai": true,
    "twilio": true,
    "telegram": true,
    "email": "resend",
    "make_webhook": true
  }
}
```

---

## 🆘 6. Procedimientos de Respaldo y Fallos

### Fallo de OpenAI
*   **Síntoma:** El chat responde "Lo siento, no puedo procesar tu solicitud en este momento".
*   **Acción Automática:** El sistema hace fallback a expresiones regulares (Regex) para intentar extraer pedidos simples.
*   **Recuperación:** Verificar créditos en OpenAI o cambiar la API Key.

### Fallo de Email
*   **Síntoma:** Error en logs `[EMAIL_SEND_ERROR]`.
*   **Acción Automática:** El sistema reintenta el envío hasta 3 veces con espera exponencial.
*   **Recuperación:** Si persiste, verificar límites diarios del proveedor (SendGrid/Resend) y revisar la carpeta de Spam del destinatario.

### Compromiso de Claves
Si sospechas que una clave (ej. OpenAI) ha sido expuesta:
1.  **Revocar:** Elimina la clave inmediatamente en el dashboard del proveedor (OpenAI/Twilio).
2.  **Generar:** Crea una nueva clave.
3.  **Actualizar:** Edita el archivo `.env` en el servidor.
4.  **Reiniciar:** Reinicia el servicio de Node.js (`npm run start` o reinicio del contenedor) para que tome los cambios. No es necesario volver a construir (build) la aplicación.
