# Sistema de Importación de Precios PDF

Este módulo implementa la funcionalidad completa para ingerir, procesar y almacenar listas de precios de proveedores a partir de archivos PDF. El sistema utiliza inteligencia artificial (OpenAI) para extraer datos estructurados de documentos no estructurados.

## 📋 Resumen

El sistema permite a los usuarios subir archivos PDF de proveedores (como Ippolito). El backend procesa estos archivos en segundo plano, extrae los productos y precios, y actualiza la base de datos de precios del sistema ERP.

**Características principales:**
- **Cero almacenamiento en disco:** Los archivos se procesan en memoria (`Buffer`) para mayor seguridad y efímera.
- **Detección automática de proveedor:** Identifica el proveedor basado en el contenido del PDF.
- **Templates extensibles:** Configuración específica por proveedor para mejorar la precisión.
- **Validación estricta:** Uso de Zod para asegurar la integridad de los datos extraídos.
- **Transaccionalidad:** Actualización atómica de precios (expiración de versiones anteriores + creación de nuevas).
- **Optimización:** Minimización de queries a base de datos mediante mapeos en memoria.

---

## 🏗 Arquitectura

El flujo de datos sigue el siguiente pipeline:

1. **Upload (`/api/v1/imports/upload`)**:
   - Recibe `file` (PDF) y `supplierId`.
   - Valida tamaño (<10MB), tipo y existencia del proveedor.
   - Crea un registro `PriceImport` con estado `PENDING`.

2. **Orquestador (`pdf-price-extractor.ts`)**:
   - **Paso 1:** Extracción de texto crudo usando `pdf-parse`.
   - **Paso 2:** Detección de proveedor con OpenAI (`gpt-4o-mini`, max 50 tokens).
   - **Paso 3:** Selección de `SupplierTemplate` (estrategia pattern matching).
   - **Paso 4:** Extracción estructurada con OpenAI (`gpt-4o-mini`, JSON mode).
   - **Paso 5:** Validación de esquema y tipos con `Zod`.
   - **Paso 6:** Post-procesamiento (limpieza de precios, filtrado de categorías).

3. **Persistencia (Prisma)**:
   - Carga optimizada de productos existentes (`productMap`).
   - Deduplicación de items del PDF.
   - Gestión de `PriceList` (búsqueda o creación).
   - Transacción ACID:
     - `updateMany`: Caducar precios anteriores (`validTo = NOW`).
     - `createMany`: Insertar nuevos precios con referencia al `importId`.
   - Actualización final del `PriceImport` a `COMPLETED` o `FAILED`.

---

## 🛠 Componentes del Sistema

### 1. API Endpoint
**Archivo:** `src/app/api/v1/imports/upload/route.ts`
- Maneja la petición HTTP POST `multipart/form-data`.
- Responsable del ciclo de vida del `PriceImport`.
- Ejecuta la lógica de negocio de reconciliación de productos.

### 2. Servicio de Extracción
**Archivo:** `src/lib/services/documents/pdf-price-extractor.ts`
- Servicio puro (sin efectos secundarios en DB).
- Entrada: `Buffer`.
- Salida: `ExtractionResult`.
- Maneja reintentos y timeouts con OpenAI.

### 3. Sistema de Templates
**Directorio:** `src/lib/services/documents/supplier-templates/`
- `types.ts`: Definiciones de interfaces (`SupplierTemplate`, `ExtractionResult`).
- `index.ts`: Registro central de templates (`getTemplateBySupplierName`).
- `ipollito.template.ts`: Configuración específica para el proveedor Ippolito.
- `default.template.ts`: Configuración genérica de fallback.

---

## 📦 Modelo de Datos

### PriceImport
Registro de auditoría de cada intento de importación.
- `status`: `PENDING` -> `PROCESSING` -> `COMPLETED` / `FAILED`.
- `errorLog`: Detalle técnico en caso de fallo.
- `itemCount`: Cantidad de precios importados exitosamente.

### PriceVersion
Histórico de precios por producto.
- `priceListId`: Vinculación a la lista del proveedor.
- `price`: Valor monetario.
- `currency`: Moneda (ej. CAD).
- `validFrom` / `validTo`: Vigencia del precio.
- `source`: Origen del dato (`pdf_import`).
- `importId`: Referencia al `PriceImport` que generó este precio.

---

## 🚀 Cómo agregar un nuevo proveedor

Para soportar un nuevo formato de PDF, sigue estos pasos:

1. **Crear el archivo de template:**
   Crea `src/lib/services/documents/supplier-templates/nuevo-proveedor.template.ts`.

   ```typescript
   import { SupplierTemplate } from './types'

   export const nuevoProveedorTemplate: SupplierTemplate = {
     supplierName: 'Nuevo Proveedor Inc.',
     identificationKeywords: ['NUEVO PROVEEDOR', 'NEW SUPPLIER'], // Keywords para detección
     currency: 'CAD',
     systemPrompt: 'Eres un experto extrayendo datos de...',
     userPromptTemplate: 'Analiza el siguiente texto de lista de precios:\n\n{rawText}',
     postProcessing: {
       removeAsteriskFromPrice: true,
       skipCategoryLines: true,
       categoryLinePattern: '^CATEGORIA.*$',
       pricePosition: 'last_token',
       unitExtraction: 'dedicated_column'
     }
   }
   ```

2. **Registrar el template:**
   Edita `src/lib/services/documents/supplier-templates/index.ts`:

   ```typescript
   import { nuevoProveedorTemplate } from './nuevo-proveedor.template'

   export const TEMPLATE_REGISTRY: SupplierTemplate[] = [
     ipollitoTemplate,
     nuevoProveedorTemplate, // <-- Agregar aquí
     defaultTemplate
   ]
   ```

3. **(Opcional) Ajustar Post-procesamiento:**
   Si el proveedor requiere reglas de limpieza únicas, actualiza `pdf-price-extractor.ts` en la sección `PASO 6`.

---

## ⚠️ Manejo de Errores

| Código HTTP | Escenario | Acción del Cliente |
| :--- | :--- | :--- |
| `400 Bad Request` | Archivo no válido, >10MB, o no es PDF. | Corregir archivo y reintentar. |
| `404 Not Found` | `supplierId` no existe. | Verificar ID del proveedor. |
| `422 Unprocessable` | PDF ilegible o sin productos válidos. | Verificar que el PDF sea de texto (no imagen escaneada). |
| `500 Server Error` | Fallo en base de datos o OpenAI. | Contactar soporte técnico. |

En caso de error `422` o `500`, consultar el campo `errorLog` en la tabla `PriceImport` para detalles específicos (ej. `OPENAI_TIMEOUT`, `PDF_EMPTY_OR_UNREADABLE`).
