# HAGO PRODUCE — Guía de Testing del Chatbot
## Sprint 7 — Intents de Consulta

### INTRODUCCIÓN
Este documento guía el proceso de validación manual (QA) de los 8 intents de consulta del chatbot de Hago Produce. El objetivo es asegurar que el bot responda correctamente a preguntas de negocio en español e inglés, manejando adecuadamente errores y ambigüedades antes del despliegue en producción.

---

### CÓMO INTERPRETAR LOS RESULTADOS
| Símbolo | Significado |
| :---: | :--- |
| ✅ | Respuesta correcta (Intent identificado y datos mostrados) |
| ❌ | Bug encontrado (Crash, respuesta vacía o intent incorrecto) |
| ⚠️ | Comportamiento inesperado (Pero no crítico) |
| 📝 | Anotar para revisión (Mejora de UX o texto) |

---

## 1. PRICE_LOOKUP
**Propósito:** Consultar el precio de venta o costo actual de un producto específico.
**Cuándo se activa:** Preguntas sobre "precio", "costo", "cuánto cuesta".

### Mensajes de Prueba

#### ✅ Mensajes que DEBEN funcionar
| # | Mensaje | Qué esperar en la respuesta |
| :--- | :--- | :--- |
| 1 | "Precio del tomate roma" | Lista de precios actuales para Tomate Roma |
| 2 | "How much is the avocado?" | Precios del aguacate (Avocado) en inglés |
| 3 | "Dame el costo de la lechuga" | Costos de lechuga (si el usuario es admin/ventas) |
| 4 | "Precio de limón persa de Don Limón" | Precio específico filtrado por proveedor "Don Limón" |
| 5 | "¿A cómo está el mango ataulfo?" | Precio actual del Mango Ataulfo |

#### ❌ Mensajes que NO deben activar este intent
| # | Mensaje | Intent correcto |
| :--- | :--- | :--- |
| 1 | "¿Quién vende el tomate más barato?" | `BEST_SUPPLIER` |
| 2 | "Información del tomate roma" | `PRODUCT_INFO` |
| 3 | "¿Qué tomates tienes en inventario?" | `INVENTORY_SUMMARY` |

#### ⚠️ Casos especiales a verificar
- [ ] **Producto con typo**
      Mensaje: "Precio del tommate"
      Esperar: Sugerencias de productos ("Quizás quisiste decir: Tomate") o resultado corregido.
- [ ] **Producto inexistente**
      Mensaje: "Precio de kryptonita"
      Esperar: Mensaje amigable indicando que no se encontró el producto (sin crash).
- [ ] **Búsqueda en inglés**
      Mensaje: "Price of strawberries"
      Esperar: Respuesta en inglés con precios de fresas.

---

## 2. BEST_SUPPLIER
**Propósito:** Identificar qué proveedor ofrece el mejor precio para un producto.
**Cuándo se activa:** Preguntas sobre "mejor proveedor", "más barato", "quién vende".

### Mensajes de Prueba

#### ✅ Mensajes que DEBEN funcionar
| # | Mensaje | Qué esperar en la respuesta |
| :--- | :--- | :--- |
| 1 | "¿Quién tiene el mejor precio de tomate?" | El proveedor con el costo más bajo |
| 2 | "Best supplier for limes" | Proveedor más barato para limones (en inglés) |
| 3 | "¿Quién me vende cebolla blanca?" | Lista de proveedores de cebolla ordenados por precio |
| 4 | "Proveedor más barato de aguacate hass" | El proveedor top 1 del ranking |
| 5 | "Dame los 3 mejores proveedores de papaya" | Top 3 proveedores de papaya |

#### ❌ Mensajes que NO deben activar este intent
| # | Mensaje | Intent correcto |
| :--- | :--- | :--- |
| 1 | "¿Cuál es el precio del tomate?" | `PRICE_LOOKUP` |
| 2 | "Datos del proveedor Walmart" | `CUSTOMER_INFO` (o supplier info si existiera) |
| 3 | "Inventario de tomate" | `INVENTORY_SUMMARY` |

#### ⚠️ Casos especiales a verificar
- [ ] **Múltiples proveedores**
      Mensaje: "Mejor proveedor de tomate saladette"
      Esperar: Lista comparativa si hay varios, destacando el mejor.
- [ ] **Proveedor único**
      Mensaje: [Producto con 1 solo proveedor]
      Esperar: Respuesta directa sin comparativa innecesaria.
- [ ] **Sin proveedores activos**
      Mensaje: "Mejor proveedor de [producto_nuevo]"
      Esperar: Aviso de que no hay proveedores activos para ese producto.

---

## 3. INVOICE_STATUS
**Propósito:** Consultar el estado (pagada, vencida, pendiente) de una o varias facturas.
**Cuándo se activa:** Preguntas sobre "factura", "status de factura", "estado".

### Mensajes de Prueba

#### ✅ Mensajes que DEBEN funcionar
| # | Mensaje | Qué esperar en la respuesta |
| :--- | :--- | :--- |
| 1 | "Estado de la factura 12345" | Detalles de la factura #12345 (Status, Monto, Fecha) |
| 2 | "Invoice status for Walmart" | Lista de facturas recientes de Walmart |
| 3 | "¿Cómo va la última factura de Loblaws?" | Estado de la factura más reciente de Loblaws |
| 4 | "Check invoice INV-999" | Búsqueda por formato alfanumérico si aplica |
| 5 | "Estatus factura Costco" | Resumen de facturas de Costco |

#### ❌ Mensajes que NO deben activar este intent
| # | Mensaje | Intent correcto |
| :--- | :--- | :--- |
| 1 | "¿Cuánto me debe Walmart?" | `CUSTOMER_BALANCE` |
| 2 | "Facturas vencidas de Walmart" | `OVERDUE_INVOICES` |
| 3 | "Contacto de facturación de Walmart" | `CUSTOMER_INFO` |

#### ⚠️ Casos especiales a verificar
- [ ] **Búsqueda por número exacto**
      Mensaje: "Factura 1001"
      Esperar: Datos precisos de esa factura única.
- [ ] **Última factura del cliente**
      Mensaje: "Última factura de Sobeys"
      Esperar: La factura con fecha de emisión más reciente.
- [ ] **Lista de facturas**
      Mensaje: "Facturas de Metro"
      Esperar: Lista de las últimas 5-10 facturas con sus estados.

---

## 4. CUSTOMER_BALANCE
**Propósito:** Conocer el saldo total (deuda) de un cliente.
**Cuándo se activa:** Preguntas sobre "saldo", "cuánto debe", "balance", "cuenta".

### Mensajes de Prueba

#### ✅ Mensajes que DEBEN funcionar
| # | Mensaje | Qué esperar en la respuesta |
| :--- | :--- | :--- |
| 1 | "Saldo de Walmart" | Monto total adeudado por Walmart |
| 2 | "What is the balance for Loblaws?" | Saldo en inglés para Loblaws |
| 3 | "¿Cuánto debe Costco?" | Deuda total de Costco |
| 4 | "Dime el saldo de Sobeys" | Balance actual de Sobeys |
| 5 | "Balance general de clientes" | (Si admin) Resumen o Top deudores |

#### ❌ Mensajes que NO deben activar este intent
| # | Mensaje | Intent correcto |
| :--- | :--- | :--- |
| 1 | "Estado de factura de Walmart" | `INVOICE_STATUS` |
| 2 | "¿Qué facturas debe Walmart?" | `OVERDUE_INVOICES` (Sutil diferencia: saldo es monto total, overdue es lista) |
| 3 | "Dirección de Walmart" | `CUSTOMER_INFO` |

#### ⚠️ Casos especiales a verificar
- [ ] **Cliente con solo OVERDUE**
      Mensaje: "Saldo de [Cliente_Moroso]"
      Esperar: Alerta visual o énfasis en que el saldo está vencido.
- [ ] **Consulta global**
      Mensaje: "Saldo total"
      Esperar: Error pidiendo especificar cliente o resumen global de cartera (según permisos).
- [ ] **Cliente al corriente**
      Mensaje: "Saldo de [Cliente_Nuevo]"
      Esperar: "El cliente [X] no tiene saldo pendiente" (Saldo $0.00).

---

## 5. PRODUCT_INFO
**Propósito:** Obtener ficha técnica o información general de un producto.
**Cuándo se activa:** Preguntas sobre "información", "qué es", "datos", "detalle".

### Mensajes de Prueba

#### ✅ Mensajes que DEBEN funcionar
| # | Mensaje | Qué esperar en la respuesta |
| :--- | :--- | :--- |
| 1 | "Información del mango ataulfo" | Ficha técnica (origen, calibres, etc.) |
| 2 | "Product info for avocado" | Datos del aguacate en inglés |
| 3 | "¿Qué es el tomate grape?" | Descripción del producto |
| 4 | "Datos técnicos de la papaya maradol" | Especificaciones de la papaya |
| 5 | "Info lechuga romana" | Detalle del producto |

#### ❌ Mensajes que NO deben activar este intent
| # | Mensaje | Intent correcto |
| :--- | :--- | :--- |
| 1 | "Precio del mango" | `PRICE_LOOKUP` |
| 2 | "¿Quién vende mango?" | `BEST_SUPPLIER` |
| 3 | "¿Hay mango?" | `INVENTORY_SUMMARY` |

#### ⚠️ Casos especiales a verificar
- [ ] **Producto inactivo**
      Mensaje: "Info de [producto_descontinuado]"
      Esperar: Datos históricos o aviso de que ya no se maneja.
- [ ] **Producto con typo**
      Mensaje: "Información del aguacatte"
      Esperar: Resolución correcta del nombre (fuzzy search).
- [ ] **Búsqueda en inglés**
      Mensaje: "Info about strawberries"
      Esperar: Respuesta coherente en inglés.

---

## 6. CUSTOMER_INFO
**Propósito:** Obtener datos de contacto, dirección o fiscales de un cliente.
**Cuándo se activa:** Preguntas sobre "contacto", "dirección", "teléfono", "email", "RFC".

### Mensajes de Prueba

#### ✅ Mensajes que DEBEN funcionar
| # | Mensaje | Qué esperar en la respuesta |
| :--- | :--- | :--- |
| 1 | "Dirección de Walmart" | Dirección fiscal/entrega de Walmart |
| 2 | "Contact info for Costco" | Teléfono/Email de contacto de Costco |
| 3 | "RFC de Soriana" | Dato fiscal (Tax ID) |
| 4 | "¿Quién es el contacto de Loblaws?" | Nombre del comprador o contacto registrado |
| 5 | "Datos de cliente Sobeys" | Ficha general del cliente |

#### ❌ Mensajes que NO deben activar este intent
| # | Mensaje | Intent correcto |
| :--- | :--- | :--- |
| 1 | "Saldo de Walmart" | `CUSTOMER_BALANCE` |
| 2 | "Facturas de Walmart" | `INVOICE_STATUS` |
| 3 | "Ventas a Walmart" | (Reporte de ventas - fuera de alcance o intent genérico) |

#### ⚠️ Casos especiales a verificar
- [ ] **Múltiples clientes similares**
      Mensaje: "Datos de Wal"
      Esperar: "¿Te refieres a Walmart Supercenter o Walmart Express?" (Lista de opciones).
- [ ] **Búsqueda por Tax ID**
      Mensaje: "Cliente con RFC XAXX010101000"
      Esperar: Datos del cliente asociado a ese ID fiscal.
- [ ] **Cliente inactivo**
      Mensaje: "Contacto de [Cliente_Baja]"
      Esperar: Datos indicando su estatus inactivo.

---

## 7. OVERDUE_INVOICES
**Propósito:** Listar facturas que ya pasaron su fecha de pago.
**Cuándo se activa:** Preguntas sobre "vencidas", "atrasadas", "morosos", "cobranza".

### Mensajes de Prueba

#### ✅ Mensajes que DEBEN funcionar
| # | Mensaje | Qué esperar en la respuesta |
| :--- | :--- | :--- |
| 1 | "Facturas vencidas de Walmart" | Lista de facturas en status OVERDUE |
| 2 | "Overdue invoices for Loblaws" | Lista en inglés de facturas vencidas |
| 3 | "¿Qué me debe Costco atrasado?" | Facturas pendientes con fecha pasada |
| 4 | "Cobranza de Sobeys" | Resumen de deuda vencida |
| 5 | "Ver vencidos de Metro" | Lista de documentos vencidos |

#### ❌ Mensajes que NO deben activar este intent
| # | Mensaje | Intent correcto |
| :--- | :--- | :--- |
| 1 | "Saldo de Walmart" | `CUSTOMER_BALANCE` (Saldo total, no solo vencido) |
| 2 | "Estado de factura 123" | `INVOICE_STATUS` |
| 3 | "Facturas de Walmart" | `INVOICE_STATUS` (Si no especifica "vencidas") |

#### ⚠️ Casos especiales a verificar
- [ ] **Cliente sin facturas vencidas**
      Mensaje: "Vencidas de [Cliente_Cumplido]"
      Esperar: "¡Excelente! [Cliente] no tiene facturas vencidas."
- [ ] **Reporte global**
      Mensaje: "Todas las facturas vencidas"
      Esperar: Top 10 clientes con mayor deuda vencida (si es admin).
- [ ] **Filtro por días**
      Mensaje: "Vencidas hace más de 30 días"
      Esperar: (Si está implementado) Filtro por antigüedad de saldo.

---

## 8. INVENTORY_SUMMARY
**Propósito:** Consultar disponibilidad de productos (catálogo).
**Cuándo se activa:** Preguntas sobre "qué tienes", "catálogo", "inventario", "disponible".

### Mensajes de Prueba

#### ✅ Mensajes que DEBEN funcionar
| # | Mensaje | Qué esperar en la respuesta |
| :--- | :--- | :--- |
| 1 | "¿Qué tienes en inventario?" | Resumen general o lista de categorías |
| 2 | "Show me available fruits" | Lista de frutas disponibles |
| 3 | "Catálogo de verduras" | Lista de verduras disponibles |
| 4 | "¿Hay tomate?" | Confirmación de existencia de tomate y variedades |
| 5 | "Resumen de inventario" | Reporte general de stock |

#### ❌ Mensajes que NO deben activar este intent
| # | Mensaje | Intent correcto |
| :--- | :--- | :--- |
| 1 | "Precio del tomate" | `PRICE_LOOKUP` |
| 2 | "Info del tomate" | `PRODUCT_INFO` |
| 3 | "Mejor proveedor de tomate" | `BEST_SUPPLIER` |

#### ⚠️ Casos especiales a verificar
- [ ] **Filtro por categoría**
      Mensaje: "Qué frutas tienes"
      Esperar: Solo productos categorizados como FRUTA.
- [ ] **Catálogo completo**
      Mensaje: "Catálogo"
      Esperar: Lista paginada o agrupada por categorías.
- [ ] **Categoría inexistente**
      Mensaje: "Inventario de electrodomésticos"
      Esperar: "No manejamos esa categoría. Prueba con Frutas o Verduras."

---

### PRUEBAS DE DESAMBIGUACIÓN
Prueba crítica para asegurar que el bot distingue la intención cuando la entidad (Producto/Cliente) es la misma.

**Producto de prueba:** TOMATE
**Cliente de prueba:** WALMART

| Mensaje | Intent Esperado | Señal Clave |
| :--- | :--- | :--- |
| "Precio del tomate" | `PRICE_LOOKUP` | "Precio" |
| "Costo de tomate" | `PRICE_LOOKUP` | "Costo" |
| "Info del tomate" | `PRODUCT_INFO` | "Info" |
| "Ficha técnica tomate" | `PRODUCT_INFO` | "Ficha técnica" |
| "¿Quién vende tomate?" | `BEST_SUPPLIER` | "Quién vende" |
| "Mejor proveedor tomate" | `BEST_SUPPLIER` | "Mejor proveedor" |
| "¿Hay tomate?" | `INVENTORY_SUMMARY` | "Hay" |
| "Inventario de tomate" | `INVENTORY_SUMMARY` | "Inventario" |
| "Datos de Walmart" | `CUSTOMER_INFO` | "Datos" |
| "Contacto Walmart" | `CUSTOMER_INFO` | "Contacto" |
| "Saldo de Walmart" | `CUSTOMER_BALANCE` | "Saldo" |
| "¿Cuánto debe Walmart?" | `CUSTOMER_BALANCE` | "Cuánto debe" |
| "Estado facturas Walmart" | `INVOICE_STATUS` | "Estado facturas" |
| "Factura reciente Walmart" | `INVOICE_STATUS` | "Factura reciente" |
| "Vencidas de Walmart" | `OVERDUE_INVOICES` | "Vencidas" |

---

### REPORTE DE BUGS
Copia y pega este formato para reportar incidencias en el canal de Slack o Jira:

```markdown
**Bug encontrado:**
- Mensaje enviado: "[Escribe aquí el mensaje exacto]"
- Intent activado (incorrecto): [Nombre del intent que respondió]
- Intent esperado: [Nombre del intent correcto]
- Respuesta recibida: "[Resumen o captura de la respuesta]"
- Severidad: [CRÍTICO (Crash) / ALTO (Info errónea) / MEDIO (Intent incorrecto) / BAJO (Estilo)]
```

---

### CRITERIOS DE ÉXITO
Para considerar el sprint aprobado y pasar a producción:

- [ ] Los 8 intents responden correctamente a sus 5 mensajes básicos (Total 40 pruebas exitosas).
- [ ] Ningún mensaje de la tabla de desambiguación activa el intent incorrecto (0 falsos positivos en casos críticos).
- [ ] Los mensajes en inglés funcionan igual que en español (Multilenguaje verificado).
- [ ] No hay crashes (error 500) ni timeouts en ningún caso de prueba.


--Creacion de Ipollito template.

Actúa como un Senior TypeScript Engineer
especializado en procesamiento de texto
y OpenAI API.

CONTEXTO:
HAGO PRODUCE necesita extraer precios
de PDFs de proveedores de frutas y
verduras en Canadá.
Currency: siempre CAD.

ARCHIVOS A REVISAR ANTES DE IMPLEMENTAR:
[pega src/lib/services/documents/pdf-ingestion.service.ts]
[pega src/lib/types/pdf.types.ts]

ESTRUCTURA CONFIRMADA DEL PDF IPOLLITO:
El texto extraído por pdf-parse mezcla
las 3 columnas en líneas continuas.

EJEMPLO REAL:
** ASPARAGUS ** CARROTS TRI COLOR TOPS US 24'S 43.00 GARLIC ELEPHANT US CASE 89.00*
ASPARAGUS WHITE PER 11LBS 49.00* CARROTS VACCUM TRI COLOR 5LBS 40.00* GARLIC IN OIL US 12X32OZ 55.50
** BEANS ** CARROTS VACUUM GUAT 5LBS 32.00* GARLIC PEELED BAG CH 3LBS 5.50

REGLAS IDENTIFICADAS:
  1. Categorías: líneas con ** → ignorar
  2. Precio: último token numérico
     del producto (puede tener * al final)
  3. Asterisco en precio: indicador especial
     43.00* → precio real es 43.00
  4. Unidad: está dentro del nombre
     "24'S", "CASE", "11LBS", "25LBS"
  5. Origen geográfico en el nombre:
     US, MEX, CDN, CH, CR, HOL, SPN

TAREA:
Crear 4 archivos en este orden.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARCHIVO 1 DE 4:
src/lib/services/documents/
  supplier-templates/types.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Exportar estas interfaces exactas:

export interface SupplierTemplate {
  supplierName: string
  identificationKeywords: string[]
  currency: string
  systemPrompt: string
  userPromptTemplate: string
  postProcessing: PostProcessingConfig
}

export interface PostProcessingConfig {
  removeAsteriskFromPrice: boolean
  skipCategoryLines: boolean
  categoryLinePattern: string
    // regex pattern para detectar categorías
    // IPOLLITO: "^\\*\\*.*\\*\\*$"
  pricePosition: 'last_token' | 'second_column'
  unitExtraction: 'from_name' | 'dedicated_column' | null
}

export interface ExtractedProduct {
  name: string
  price: number
  unit: string | null
  sku: string | null
  rawLine: string
    // línea original para debugging
}

export interface ExtractionResult {
  supplierName: string
  supplierNameDetected: string | null
    // nombre detectado en el PDF
  currency: string
  products: ExtractedProduct[]
  templateUsed: string
    // 'ipollito' | 'default' | etc
  rawProductCount: number
  skippedLines: number
    // líneas ignoradas (categorías, vacías)
}

export interface TemplateRegistry {
  [key: string]: SupplierTemplate
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARCHIVO 2 DE 4:
src/lib/services/documents/
  supplier-templates/ipollito.template.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { SupplierTemplate } from './types'

export const ipollitoTemplate: SupplierTemplate = {

  supplierName: 'IPOLLITO',

  identificationKeywords: [
    'IPOLLITO',
    'ipollito',
    // Agregar más cuando se vea el PDF real
    // (teléfono, dirección, email del proveedor)
  ],

  currency: 'CAD',

  systemPrompt: `
Eres un extractor especializado de listas
de precios del proveedor IPOLLITO.

REGLAS CRÍTICAS:
1. El texto viene de 3 columnas mezcladas.
   Cada producto termina cuando encuentras
   un número decimal (el precio).

2. Ignora completamente las líneas de
   categoría. Una línea de categoría
   contiene ** antes y después del nombre.
   Ejemplos a IGNORAR:
   ** ASPARAGUS **
   ** BEANS **
   ** BROCCOLI **

3. El precio es SIEMPRE el último número
   decimal de cada producto.
   Si el precio termina en * ignóralo:
   43.00* → precio es 43.00
   49.00  → precio es 49.00

4. La unidad de medida está al final
   del nombre del producto, antes del precio:
   "CARROTS TRI COLOR TOPS US 24'S 43.00"
   → name: "CARROTS TRI COLOR TOPS US 24'S"
   → unit: "24'S"
   → price: 43.00

   "GARLIC ELEPHANT US CASE 89.00"
   → name: "GARLIC ELEPHANT US CASE"
   → unit: "CASE"
   → price: 89.00

   Unidades comunes: LBS, KG, CS, CASE,
   OZ, ML, CLM, 24'S, 12'S, 30LBS, etc.

5. Responde SOLO con JSON válido.
   Sin texto adicional. Sin markdown.
   Sin explicaciones.
  `,

  userPromptTemplate: `
Extrae todos los productos y precios
de este texto de lista de precios IPOLLITO.

TEXTO DEL PDF:
{rawText}

Responde ÚNICAMENTE con este JSON:
{
  "supplierName": "IPOLLITO",
  "currency": "CAD",
  "products": [
    {
      "name": "NOMBRE COMPLETO DEL PRODUCTO",
      "price": 43.00,
      "unit": "UNIDAD O null",
      "sku": null,
      "rawLine": "línea original"
    }
  ]
}

RECORDATORIO FINAL:
- Líneas con ** son categorías → NO incluir
- Precio sin asterisco: 43.00* → 43.00
- Un objeto por producto
- No inventar productos
  `,

  postProcessing: {
    removeAsteriskFromPrice: true,
    skipCategoryLines: true,
    categoryLinePattern: '\\*\\*',
    pricePosition: 'last_token',
    unitExtraction: 'from_name'
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARCHIVO 3 DE 4:
src/lib/services/documents/
  supplier-templates/default.template.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Template genérico para proveedores
sin template específico.

import { SupplierTemplate } from './types'

export const defaultTemplate: SupplierTemplate = {

  supplierName: 'UNKNOWN',

  identificationKeywords: [],

  currency: 'CAD',

  systemPrompt: `
Eres un extractor de listas de precios
de proveedores de frutas y verduras.

Extrae todos los productos con sus precios.
Si no encuentras productos devuelve
{ "products": [] }

Responde SOLO con JSON válido.
Sin texto adicional.
  `,

  userPromptTemplate: `
Extrae todos los productos y precios
de esta lista de precios de proveedor.

TEXTO:
{rawText}

Responde con este JSON exacto:
{
  "supplierName": null,
  "currency": "CAD",
  "products": [
    {
      "name": "nombre del producto",
      "price": 0.00,
      "unit": null,
      "sku": null,
      "rawLine": "línea original"
    }
  ]
}
  `,

  postProcessing: {
    removeAsteriskFromPrice: false,
    skipCategoryLines: false,
    categoryLinePattern: '',
    pricePosition: 'last_token',
    unitExtraction: null
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARCHIVO 4 DE 4:
src/lib/services/documents/
  supplier-templates/index.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Registry central de templates.
Aquí se agregan los nuevos proveedores.

import { SupplierTemplate } from './types'
import { ipollitoTemplate } from './ipollito.template'
import { defaultTemplate } from './default.template'

const TEMPLATE_REGISTRY: SupplierTemplate[] = [
  ipollitoTemplate,
  // AGREGAR NUEVOS TEMPLATES AQUÍ:
  // import { nuevoTemplate } from './nuevo.template'
  // nuevoTemplate,
]

export function getTemplateBySupplierName(
  detectedName: string | null
): SupplierTemplate {
  if (!detectedName) return defaultTemplate

  const normalized = detectedName
    .toUpperCase()
    .trim()

  const found = TEMPLATE_REGISTRY.find(template =>
    template.identificationKeywords.some(keyword =>
      normalized.includes(keyword.toUpperCase())
    )
  )

  return found ?? defaultTemplate
}

export function getAllTemplateNames(): string[] {
  return TEMPLATE_REGISTRY.map(t => t.supplierName)
}

export { defaultTemplate, ipollitoTemplate }
export type { SupplierTemplate, ExtractionResult,
  ExtractedProduct } from './types'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESTRICCIONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - TypeScript estricto en todos los archivos
  - Sin dependencias externas nuevas
  - Los templates son configuración pura
    (sin lógica de negocio ni imports de Prisma)
  - Todos los archivos deben compilar
    sin errores de TypeScript

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENTREGA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Entregar los 4 archivos completos
en orden: types → ipollito → default → index

Al final una tabla:
| Archivo | Exporta | Usado por |


continuacin



Actúa como un Senior TypeScript Engineer
especializado en Next.js App Router
y Prisma ORM.

CONTEXTO:
HAGO PRODUCE necesita un endpoint para
obtener los precios actuales de un
proveedor ANTES de subir un nuevo PDF.
Esto permite a la UI calcular diferencias
(precio anterior vs precio nuevo).

ARCHIVOS A REVISAR:
[pega prisma/schema.prisma — modelos:
  Supplier, Product, PriceList,
  PriceVersion]
[pega src/lib/db.ts]

TAREA:
Crear endpoint:
src/app/api/v1/suppliers/
  [supplierId]/current-prices/route.ts

MÉTODO: GET
PARÁMETRO: supplierId (en la URL)

LÓGICA:
  1. Verificar que el supplier existe
     y está activo.
     Si no → 404

  2. Obtener todos los PriceVersions
     activos del supplier:
     - A través de PriceList del supplier
     - Donde validTo IS NULL
       (precio vigente, no expirado)
     - Incluir nombre del producto

  3. Retornar array ordenado por
     nombre de producto ASC.

RESPONSE EXITOSO (200):
  {
    supplierId: string,
    supplierName: string,
    priceCount: number,
    prices: Array<{
      productId: string,
      productName: string,
      currentPrice: number,
      currency: string,
      validFrom: string
    }>
  }

OPTIMIZACIÓN:
  Una sola query con include/join.
  No hacer queries separadas por producto.

  Estructura de query sugerida:
  prisma.priceVersion.findMany({
    where: {
      validTo: null,
      priceList: {
        supplierId: supplierId,
        isCurrent: true
      }
    },
    include: {
      product: {
        select: { id, name }
      }
    },
    orderBy: {
      product: { name: 'asc' }
    }
  })

RESTRICCIONES:
  - Next.js App Router
    (NextRequest, NextResponse)
  - Máximo 1 query a DB
  - Sin autenticación por ahora
    (endpoint interno)
  - Reutilizar cliente Prisma existente

ENTREGA:
  PARTE A: route.ts completo

  PARTE B: Ejemplo de response
    con datos reales del dominio

  PARTE C: Una línea explicando
    por qué validTo: null identifica
    el precio vigente correctamente
