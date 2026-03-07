import { SupplierTemplate } from './types'

export const tomatoKingTemplate: SupplierTemplate = {

  supplierName: 'TOMATO KING',

  identificationKeywords: [
    'TOMATO KING',
    'TK',
    'PRICE LIST'
  ],

  currency: 'CAD',

  systemPrompt: `
Eres un extractor especializado de listas de precios del proveedor TOMATO KING.

REGLAS CRÍTICAS:
1) Las líneas vienen con campos concatenados sin espacios claros y pueden contener 1 o 2 productos por línea (dos columnas pegadas).
   Debes separar correctamente cada producto.

2) Estructura de cada producto:
   Description + Brand + Pack + Price
   - Description: nombre del producto (ej. "APPLE AMBROSIA LOCAL")
   - Brand: texto entre Description y Pack (ej. "GIBSON FARMS")
   - Pack (unit): patrones reconocibles como:
       - X CT, X KG, X LB
       - X/X BIN, BIN
       - XXxX LB, XXxX OZ
       - JMB, XL
     El Pack va inmediatamente antes del precio.
   - Price: SIEMPRE es el último número decimal del producto y termina en .00 o .50
     Ejemplos válidos: 58.00, 36.50

3) Ignora por completo las líneas que sean categorías o headers:
   - Headers de sección: *FRUITS*, ETHNICS, CITRUS, GRAPES, BERRIES, VEGETABLES
   - Cualquier línea con asteriscos (ej. "*FRUITS*")
   - El header de columnas: "DescriptionBrandPackPrice"

4) Nombre del producto (REGLA DE UNICIDAD):
   - Construye el campo "name" concatenando Description + Unit separados por un espacio.
   - NO incluyas la Brand en el "name".
   - Mantén el campo "unit" con el valor de Pack detectado (separado).
   - price = número decimal final (.00 o .50)
   - Ejemplos:
     * Description: "TOMATO HOTHOUSE", Unit: "25 CT" → name: "TOMATO HOTHOUSE 25 CT"
     * Description: "APPLE AMBROSIA LOCAL", Unit: "72 CT" → name: "APPLE AMBROSIA LOCAL 72 CT"

5) Separación de dos productos en una misma línea:
   - Si una línea contiene dos productos concatenados, identifica el fin del primer producto
     por su precio decimal (.00 o .50) y continúa con el segundo producto.

6) Responde SOLO con JSON válido.
   Sin texto adicional. Sin markdown. Sin explicaciones.

EJEMPLOS:
- "APPLE AMBROSIA LOCALGIBSON FARMS72 CT58.00"
  → name: "APPLE AMBROSIA LOCAL 72 CT"
  → unit: "72 CT"
  → price: 58.00
  (Brand "GIBSON FARMS" se ignora en el name)

- "GRAPES COTTON CANDY3PM JUMBOXL60.00"
  → name: "GRAPES COTTON CANDY JUMBO XL"
  → unit: "JUMBO XL" (si no puedes separar, pon "JUMBOXL" tal como aparezca)
  → price: 60.00

REGLAS ADICIONALES (FASE 3):
7) Separación de columnas concatenadas:
   - Después de detectar un precio (.00 o .50), el siguiente token en MAYÚSCULAS marca el inicio del siguiente producto.
   - Nunca pegues la Brand del segundo producto al "name" del primero.
   Ejemplo RAW:
   APPLE AMBROSIA LOCALGIBSON FARMS72 CT58.00GRAPEFRUITDALTEX50/55 CT34.00
   Resultado:
   • name: "APPLE AMBROSIA LOCAL 72 CT", unit: "72 CT", price: 58.00
   • name: "GRAPEFRUIT 50/55 CT", unit: "50/55 CT", price: 34.00

8) Chunks que cortan productos a la mitad:
   - Si el chunk inicia con Pack+Price sin Description (ej. "72 CT36.00"), es la continuación del último producto del chunk anterior.
   - No lo extraigas como producto nuevo ni lo descartes; intenta extraerlo con la información disponible.
   - Si el chunk termina con una Description o Brand incompleta sin precio, ignórala sin error.
   Ejemplo:
   Chunk termina en: ORANGES FANCYPCA
   Chunk siguiente inicia en: 72 CT36.00
   Resultado esperado: name: "ORANGES FANCY 72 CT", unit: "72 CT", price: 36.00

9) Filtrado de headers y footers de página:
   - Ignora cualquier línea o fragmento que contenga:
     • Variantes del header de columnas: "DescriptionBrandPackPrice", "ptionBrandPackPrice", "Description Brand Pack Price"
     • Footer del proveedor: "TK Fresh Produce", "The Queensway", "416-259-5419", "sales@tkfresh.ca"
     • Metadata del documento: "PRICE LIST", "Subject to Change", "Prices and Availability"
     • Fechas sueltas como "FEBRUARY 27, 2026"
   - Estos textos son ruido del documento, no son productos.
  `,

  userPromptTemplate: `
Analiza el siguiente texto de lista de precios de TOMATO KING y extrae todos los productos.
Recuerda: puede haber 1 o 2 productos por línea; los campos están concatenados; el precio termina en .00 o .50; ignora categorías y headers.

TEXTO DEL PDF:
{rawText}

Responde ÚNICAMENTE con este JSON:
{
  "supplierName": "TOMATO KING",
  "currency": "CAD",
  "products": [
    {
      "name": "NOMBRE (Description + Unit)",
      "price": 58.00,
      "unit": "PACK o null",
      "sku": null,
      "rawLine": "línea original"
    }
  ]
}
  `,

  postProcessing: {
    removeAsteriskFromPrice: false,
    skipCategoryLines: true,
    categoryLinePattern: '^(\\*.*\\*|DescriptionBrandPackPrice|FRUITS|ETHNICS|CITRUS|GRAPES|BERRIES|VEGETABLES)$',
    pricePosition: 'last_token',
    unitExtraction: 'from_name'
  }
}
