import { PdfIngestionService } from './pdf-ingestion.service'
import { z } from 'zod'
import {
  getTemplateBySupplierName,
  ExtractionResult,
  ExtractedProduct,
  SupplierTemplate
} from './supplier-templates'
import { logger } from '@/lib/logger/logger.service'
import OpenAI from 'openai'

const TIMEOUT_MS = 60000

// --- Schemas de validación ---

// Esquema intermedio para permitir limpieza de datos
const RawProductSchema = z.object({
  name: z.string().min(1),
  price: z.union([z.number(), z.string()]), // Permite string para limpieza posterior
  unit: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  rawLine: z.string().optional()
})

const OpenAIResponseSchema = z.object({
  supplierName: z.string().nullable().optional(),
  currency: z.string().default('CAD'),
  products: z.array(RawProductSchema)
})

// --- Interfaces internas ---

// --- Función principal ---
//
export async function extractPricesFromPdf(
  buffer: Buffer,
  supplierNameFromDb?: string
): Promise<ExtractionResult> {
  // PASO 1: Extraer texto con PdfIngestionService
  let rawText: string
  try {
    const ingestionService = new PdfIngestionService()
    // Usamos 'unknown-supplier' temporalmente porque aún no lo detectamos
    const result = await ingestionService.extractFromBuffer(buffer, 'unknown-supplier')
    rawText = result.text
  } catch (error: any) {
    logger.error('[PDF_EXTRACTOR] Error parsing PDF', error)
    throw new Error(`PDF_EMPTY_OR_UNREADABLE: ${error.message}`)
  }

  // Validaciones de texto
  if (!rawText || rawText.length < 100) {
    throw new Error('PDF_EMPTY_OR_UNREADABLE: Text content is empty or too short (<100 chars)')
  }

  // Limpiar líneas completamente vacías para reducir tokens
  const cleanText = rawText
    .split('\n')
    .filter(line => line.trim().length > 0)
    .join('\n')

  // PASO 2: Determinar proveedor (DB primero, IA como fallback)
  let detectedSupplierName: string | null = null
  let template: SupplierTemplate

  if (supplierNameFromDb && supplierNameFromDb.trim().length > 0) {
    detectedSupplierName = supplierNameFromDb.trim()
    logger.info(`[PDF_EXTRACTOR] Using supplier from DB: ${detectedSupplierName}`)
    template = getTemplateBySupplierName(detectedSupplierName)
  } else {
    try {
      detectedSupplierName = await detectSupplier(cleanText)
      logger.info(`[PDF_EXTRACTOR] Detected supplier: ${detectedSupplierName}`)
    } catch (error) {
      logger.warn('[PDF_EXTRACTOR] Supplier detection failed, defaulting to UNKNOWN', error)
      // No lanzamos error aquí, seguimos con default template
    }

    template = getTemplateBySupplierName(detectedSupplierName)
  }

  // PASO 3: Seleccionar template (ya calculado arriba)
  logger.info(`[PDF_EXTRACTOR] Selected template: ${template.supplierName}`)

  // PASO 4: Extraer productos en chunks para evitar timeouts
  const chunks = splitIntoChunks(cleanText, 1500)
  logger.info(`[PDF_EXTRACTOR] Processing ${chunks.length} chunks...`)

  // --- TEST DE CONECTIVIDAD ---
  try {
    logger.info('[PDF_EXTRACTOR] Testing OpenAI connectivity...')
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY missing in environment')

    const openai = new OpenAI({ 
      apiKey,
      timeout: 10000, // 10s para test
      maxRetries: 0
    })

    try {
      await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 5
      })
      logger.info('[PDF_EXTRACTOR] OpenAI connectivity OK')
    } catch (apiError: any) {
      if (apiError instanceof OpenAI.APIConnectionTimeoutError) {
        throw new Error('OPENAI_TIMEOUT (connectivity test)')
      }
      throw apiError
    }
  } catch (connError: any) {
    logger.error(`[PDF_EXTRACTOR] Connectivity check failed: ${connError.message}`)
    throw new Error(`OPENAI_CONNECTION_FAILED: ${connError.message}`)
  }
  // ----------------------------

  const allRawProducts: any[] = []
  let detectedCurrency = 'CAD'

  for (let i = 0; i < chunks.length; i++) {
    try {
      logger.info(`[PDF_EXTRACTOR] Processing chunk ${i + 1}/${chunks.length}`)
      const chunkResponse = await extractProductsWithOpenAI(chunks[i], template)
      
      const validationResult = OpenAIResponseSchema.safeParse(chunkResponse)
      if (validationResult.success) {
        const { products, currency } = validationResult.data
        allRawProducts.push(...products)
        if (currency) detectedCurrency = currency
        logger.info(`[PDF_EXTRACTOR] Chunk ${i + 1}/${chunks.length} processed: ${products.length} products found`)
      }
    } catch (error: any) {
      logger.warn(`[PDF_EXTRACTOR] Chunk ${i + 1}/${chunks.length} failed, continuing: ${error.message}`)
      logger.warn(`[PDF_EXTRACTOR] Error details: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`)
    }
  }

  // Deduplicar productos por nombre
  const uniqueRawProducts = allRawProducts.filter(
    (product, index, self) =>
      index === self.findIndex((p) => p.name === product.name)
  )

  logger.info(`[PDF_EXTRACTOR] Total unique products found: ${uniqueRawProducts.length}`)
  
  const rawProductCount = uniqueRawProducts.length
  const products = uniqueRawProducts

  // PASO 6: Post-procesamiento
  let cleanProducts: ExtractedProduct[] = []
  let skippedLines = 0

  const categoryPattern = template.postProcessing.categoryLinePattern 
    ? new RegExp(template.postProcessing.categoryLinePattern) 
    : null

  for (const p of products) {
    // 1. Omitir líneas de categoría
    if (template.postProcessing.skipCategoryLines && categoryPattern && categoryPattern.test(p.name)) {
      skippedLines++
      continue
    }

    // 2. Limpiar precio (quitar asterisco, convertir a número)
    let finalPrice: number
    if (typeof p.price === 'string') {
        let priceStr = p.price
        if (template.postProcessing.removeAsteriskFromPrice) {
            priceStr = priceStr.replace(/\*/g, '').trim()
        }
        finalPrice = parseFloat(priceStr)
    } else {
        finalPrice = p.price
    }

    // 3. Filtrar precios o nombres inválidos
    if (isNaN(finalPrice) || finalPrice <= 0) {
        skippedLines++
        continue
    }

    if (!p.name || p.name.trim().length === 0) {
        skippedLines++
        continue
    }

    cleanProducts.push({
        name: p.name.trim(),
        price: finalPrice,
        unit: p.unit ?? null,
        sku: p.sku ?? null,
        rawLine: p.rawLine ?? ''
    })
  }

  if (cleanProducts.length === 0) {
    throw new Error('NO_PRODUCTS_FOUND: Extraction completed but 0 valid products found')
  }

  // PASO 7: Construir ExtractionResult
  const result: ExtractionResult = {
    supplierName: template.supplierName,
    supplierNameDetected: detectedSupplierName,
    currency: detectedCurrency,
    products: cleanProducts,
    templateUsed: template.supplierName,
    rawProductCount,
    skippedLines
  }

  return result
}

// --- Helpers privados ---

function splitIntoChunks(text: string, chunkSize: number = 3000): string[] {
  const chunks: string[] = []
  
  // Dividir por líneas para no cortar productos a la mitad
  const lines = text.split('\n')
  let currentChunk = ''
  
  for (const line of lines) {
    if (currentChunk.length + line.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = ''
    }
    currentChunk += line + '\n'
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}

async function detectSupplier(text: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  const model = 'gpt-4o-mini' // Rápido y barato
  
  if (!apiKey) return null

  const truncatedText = text.substring(0, 500)
  
  const openai = new OpenAI({ 
    apiKey,
    timeout: 15000,
    maxRetries: 0
  })

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { 
          role: 'system', 
          content: 'Responde SOLO con el nombre del proveedor o empresa que emitió este documento. Si no puedes determinarlo responde: UNKNOWN' 
        },
        { 
          role: 'user', 
          content: `¿Quién es el proveedor de esta lista de precios?\n\nPRIMERAS 500 CHARS DEL TEXTO:\n${truncatedText}` 
        }
      ],
      max_tokens: 50,
      temperature: 0
    })
    
    const content = response.choices[0]?.message?.content?.trim()
    if (!content || content === 'UNKNOWN') return null
    return content

  } catch (error: any) {
    logger.error(`[PDF_EXTRACTOR] Supplier detection failed: ${error.message}`)
    return null
  }
}

async function extractProductsWithOpenAI(text: string, template: SupplierTemplate): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY
  const model = 'gpt-4o-mini'

  if (!apiKey) throw new Error('OPENAI_API_KEY is missing')

  // Truncar texto para evitar timeouts (YA NO ES NECESARIO SI USAMOS CHUNKS EN LA LLAMADA SUPERIOR)
  // Pero mantenemos por seguridad si se llama directo
  const truncatedText = text.substring(0, 8000)
  const userPrompt = template.userPromptTemplate.replace('{rawText}', truncatedText)

  const openai = new OpenAI({ 
    apiKey,
    timeout: TIMEOUT_MS,
    maxRetries: 0
  })

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: template.systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2500,
      temperature: 0,
      response_format: { type: 'json_object' }
    })
    
    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('OpenAI returned empty content')
    
    try {
      return JSON.parse(content)
    } catch {
      // Intentar reparar JSON truncado
      // agregando el cierre necesario
      const repaired = content
        .trimEnd()
        .replace(/,\s*$/, '') // quitar coma final
        + ']}'  // cerrar array y objeto
      try {
        return JSON.parse(repaired)
      } catch {
        // Si sigue fallando, retornar
        // lo que se pudo parsear
        const match = content.match(
          /"products"\s*:\s*(\[[\s\S]*)/
        )
        if (match) {
          const partialArray = match[1]
            .replace(/,?\s*\{[^}]*$/, '')
            + ']'
          return {
            products: JSON.parse(partialArray),
            currency: 'CAD'
          }
        }
        throw new Error(
          'JSON_PARSE_FAILED: ' + content
            .substring(0, 100)
        )
      }
    }

  } catch (error: any) {
    if (error instanceof OpenAI.APIConnectionTimeoutError) {
      throw new Error(`OPENAI_TIMEOUT (${TIMEOUT_MS}ms exceeded)`)
    }
    throw new Error(`OpenAI API Error: ${error.message}`)
  }
}
