# Documentación Pipeline Make.com → Hago Produce (Precios)

## 1. Diagrama ASCII del Flujo Actual (AUTOMATIZACION.json)

```text
[1]  Google Drive: Watch Files in Folder (HAGO_Precios)
  → [48] BasicFeeder: Iterar archivos
    → [15] Google Drive: Get File (descargar PDF)
      → [30] SetVariable: Guardar nombre del archivo
        → [47] HTTP: Enviar PDF a PDF.co para conversión
          → [5]  PDF.co: Convertir PDF a texto/JSON
            → [18] BasicFeeder: Iterar páginas del PDF
              → [6]  OpenAI GPT: Extraer datos estructurados del texto
                → [23] JSON: Parse respuesta de OpenAI
                  → [17] BasicFeeder: Iterar items (productos/precios)
                    → [36] BasicAggregator: Agrupar filas para Google Sheets
                      → [39] Google Sheets: addMultipleRows (escritura en hoja de cálculo)
```

## 2. Descripción de Módulos y Parámetros (Versión Actual)

**[1] Google Drive: Watch Files in Folder**
- Módulo: `google-drive:watchFilesInAFolder`
- Carpeta: `HAGO_Precios`
- Evento: `By Created Time (create)`
- Límite: `7` archivos por ciclo
- Conexión: `PriceListData (google-restricted)`

**[48] BasicFeeder: Iterar archivos**
- Módulo: `builtin:BasicFeeder`
- Recibe: array con IDs de archivos desde [1]
- Emite: cada ejecución individual para un archivo.

**[15] Google Drive: Get File**
- Módulo: `google-drive:getAFile`
- Entrada: `file = {{48.id}}`
- Conversión de documentos de Google a formatos descargables (docx/xlsx/pptx).

**[30] SetVariable: Guardar nombre del archivo**
- Guarda el nombre del archivo actual para usarlo en logs / claves de idempotencia.

**[47] HTTP → PDF.co**
- Módulo: `http:makeRequest`
- Método: `POST`
- Body: binario del PDF descargado en [15]
- Destino: endpoint de PDF.co para conversión.

**[5] PDF.co: Convertir PDF a texto/JSON**
- Conversión del PDF de precios a JSON estructurado por página.

**[18] BasicFeeder: Iterar páginas**
- Itera la colección de páginas generadas por PDF.co.

**[6] OpenAI GPT: Extraer datos**
- Módulo: `openai-gpt:chatCompletions` (o equivalente en blueprint)
- Prompt: instrucción para extraer una lista de productos con nombre, proveedor, costo, moneda y fecha.

**[23] JSON: Parse respuesta de OpenAI**
- Convierte el texto devuelto por OpenAI en JSON nativo para Make.

**[17] BasicFeeder: Iterar items (productos)**
- Itera el array `productos` devuelto por [23].

**[36] BasicAggregator: Agrupar filas para Sheets**
- Junta los items en una matriz `rows` con columnas alineadas a Google Sheets.

**[39] Google Sheets: addMultipleRows**
- Módulo: `google-sheets:addMultipleRows`
- Spreadsheet: `MasterProducts` / ID configurado en blueprint.
- Hoja: determinada por el agregador [36].
- Inserción: `OVERWRITE`, `USER_ENTERED`.

## 3. Formato del JSON de OpenAI (Módulo [6])

OpenAI devuelve un JSON con una colección principal de productos. El patrón esperado y parseado por [23] y [17] es:

```json
{
  "productos": [
    {
      "product_name": "Manzana Gala",
      "supplier_name": "Frutas Selectas",
      "cost_price": 18.0,
      "sell_price": 22.0,
      "currency": "CAD",
      "effective_date": "2024-01-01"
    },
    {
      "product_name": "Pera Bosc",
      "supplier_name": "Distribuidora Norte",
      "cost_price": 21.5,
      "sell_price": 26.0,
      "currency": "CAD",
      "effective_date": "2024-01-01"
    }
  ]
}
```

## 4. Formato de Datos que Llegan al Módulo [39] (Google Sheets)

El módulo [36] prepara un array `rows` donde cada entrada representa una fila en la hoja de cálculo:

```json
[
  [
    "Manzana Gala",
    18.0,
    22.0,
    "CAD",
    "2024-01-01"
  ],
  [
    "Pera Bosc",
    21.5,
    26.0,
    "CAD",
    "2024-01-01"
  ]
]
```

Columnas típicas en la hoja:

- `NOMBRE_PRODUCTO`
- `COSTO`
- `VENTA`
- `MONEDA`
- `FECHA_EFECTIVA`

## 5. Variables de Entorno Necesarias en Make.com

- `PDFCO_API_KEY`: clave para el servicio PDF.co.
- `OPENAI_API_KEY`: clave para el módulo OpenAI GPT.
- `APP_URL`: base URL de la app HAGO PRODUCE (por ejemplo, `https://app.hagoproduce.com`).
- `MAKE_WEBHOOK_API_KEY`: API key para el webhook `/api/v1/webhooks/make` en HAGO PRODUCE.
- `HAGO_PRECIOS_FOLDER_ID`: ID de la carpeta `HAGO_Precios` en Google Drive.

Todas estas variables se utilizan a través de conexiones o mapeos en Make.com, pero conviene documentarlas para mantener el escenario portable entre entornos.

## 6. Nuevo Módulo HTTP Webhook (Diseño)

El módulo [39] se reemplaza por un módulo HTTP que llama al webhook de HAGO PRODUCE.

**Configuración recomendada:**

- URL: `{APP_URL}/api/v1/webhooks/make`
- Method: `POST`
- Headers:
  - `Content-Type: application/json`
  - `X-API-Key: {{MAKE_WEBHOOK_API_KEY}}`
  - `X-Idempotency-Key: {{30.filename}}_{{now}}`
- Body (JSON):

```json
{
  "eventType": "price.updated",
  "data": {
    "product_name": "{{17.product_name}}",
    "supplier_name": "{{17.supplier_name}}",
    "cost_price": {{17.cost_price}},
    "sell_price": {{17.sell_price}},
    "currency": "{{17.currency}}",
    "effective_date": "{{17.effective_date}}",
    "source": "make_automation"
  },
  "timestamp": "{{now}}",
  "idempotencyKey": "{{30.filename}}_{{17.product_name}}_{{17.supplier_name}}_{{17.effective_date}}"
}
```

Este payload coincide con el schema aceptado por `/api/v1/webhooks/make` después de la adaptación para datos de Make.com.

