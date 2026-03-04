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
