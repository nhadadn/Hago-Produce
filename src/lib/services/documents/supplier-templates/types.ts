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
