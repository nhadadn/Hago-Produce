import { SupplierTemplate } from './types'
import { ipollitoTemplate } from './ipollito.template'
import { defaultTemplate } from './default.template'
import { tomatoKingTemplate } from './tomato-king.template'

const TEMPLATE_REGISTRY: SupplierTemplate[] = [
  ipollitoTemplate,
  tomatoKingTemplate,
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

export { defaultTemplate, ipollitoTemplate, tomatoKingTemplate }
export type { SupplierTemplate, ExtractionResult,
  ExtractedProduct } from './types'
