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

4) Nombre del producto:
   - Usa SOLO Description para el campo "name"
   - NO incluyas la Brand en el "name"
   - unit = Pack detectado
   - price = número decimal final (.00 o .50)

5) Separación de dos productos en una misma línea:
   - Si una línea contiene dos productos concatenados, identifica el fin del primer producto
     por su precio decimal (.00 o .50) y continúa con el segundo producto.

6) Responde SOLO con JSON válido.
   Sin texto adicional. Sin markdown. Sin explicaciones.

EJEMPLOS:
- "APPLE AMBROSIA LOCALGIBSON FARMS72 CT58.00"
  → name: "APPLE AMBROSIA LOCAL"
  → unit: "72 CT"
  → price: 58.00
  (Brand "GIBSON FARMS" se ignora en el name)

- "GRAPES COTTON CANDY3PM JUMBOXL60.00"
  → name: "GRAPES COTTON CANDY"
  → unit: "JUMBO XL" (si no puedes separar, pon "JUMBOXL" tal como aparezca)
  → price: 60.00
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
      "name": "NOMBRE (solo Description)",
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

