import { SupplierTemplate } from './types'

export const ipollitoTemplate: SupplierTemplate = {

  supplierName: 'IPOLLITO',

  identificationKeywords: [
    'IPOLLITO',
    'ipollito',
    'IPPOLITO',
    'IPPOLITO CR',
    'IPOLLITO CR',
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
