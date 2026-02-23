# 🧩 MAKE_SETUP_GUIDE - Configuración de escenario Make.com

## PASO 1 - Importar Blueprint

1. Ingresar a Make.com y crear un nuevo escenario.
2. En el menú del escenario, hacer clic en `...` → **Import Blueprint**.
3. Seleccionar el archivo `MAKE_BLUEPRINT_V2.json` ubicado en `DocumentacionHagoProduce/FaseDos/`.
4. Confirmar la importación y verificar que aparezcan los 13 módulos esperados.

## PASO 2 - Configurar Conexiones

1. **Módulo Google Drive**
   - Abrir el módulo `[1] Google Drive: Watch Files in Folder`.
   - Conectar la cuenta de Google con acceso a la carpeta `HAGO_Precios`.
   - Seleccionar la carpeta correcta mediante el selector de Drive.

2. **Módulo PDF.co**
   - Abrir el módulo `[5] PDF.co: Convertir PDF a texto/JSON`.
   - Crear o seleccionar una conexión PDF.co.
   - Ingresar `PDFCO_API_KEY` obtenida desde el panel de PDF.co.

3. **Módulo OpenAI**
   - Abrir el módulo `[6] OpenAI GPT`.
   - Configurar la conexión con `OPENAI_API_KEY`.
   - Seleccionar el modelo recomendado (por ejemplo, `gpt-4o-mini` o equivalente soportado).

4. **Módulo HTTP (Webhook Hago Produce)**
   - Abrir el módulo HTTP que reemplaza a Google Sheets (id `50`).
   - En `URL`, usar `{APP_URL}/api/v1/webhooks/make` (por ejemplo, `https://erp.hagoproduce.com/api/v1/webhooks/make`).
   - En `Headers` configurar:
     - `Content-Type: application/json`.
     - `X-API-Key: {{MAKE_WEBHOOK_API_KEY}}` (API Key creada en `/admin/bot-api-keys`).
     - `X-Idempotency-Key` según el mapping definido en `MAKE_PIPELINE_DOCUMENTACION.md`.

## PASO 3 - Configurar Scheduling

1. En la parte superior del escenario, hacer clic en el ícono del reloj.
2. Seleccionar una de las opciones:
   - **Immediately as data arrives**: el trigger de Google Drive se ejecuta cuando hay nuevos PDFs.
   - **Every X minutes/hours**: para hacer polling periódico de la carpeta.
3. Guardar la configuración del schedule.

## PASO 4 - Activar y Probar

1. Encender el escenario cambiando el switch a `ON`.
2. Subir un PDF de prueba de precios a la carpeta `HAGO_Precios` en Google Drive.
3. En Make.com, revisar la sección **History** del escenario y verificar:
   - Que todos los módulos se ejecutan en verde.
   - Que el módulo HTTP devuelve **status 200**.
4. En Hago Produce, verificar en la base de datos que:
   - Se ha creado o actualizado al menos un registro `ProductPrice` con `source = 'make_automation'`.
5. Revisar la tabla `WebhookLog` para confirmar:
   - `source = 'make'`.
   - `eventType = 'price.updated'`.
   - `status = 'success'`.

