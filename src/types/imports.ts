
// Tipos para el sistema de importación de PDFs
// Basados en los endpoints de suppliers y uploads

// --- API RESPONSES ---

export interface SupplierSummary {
  id: string
  name: string
}

export interface CurrentPrice {
  productId: string
  productName: string
  currentPrice: number
  currency: string
  validFrom: string
}

export interface CurrentPricesResponse {
  supplierId: string
  supplierName: string
  priceCount: number
  prices: CurrentPrice[]
}

export interface ProcessedProduct {
  productName: string
  newPrice: number
  currency: string
  matchLevel: 1 | 2 | 3
}

export interface MatchingStats {
  level1Matches: number
  level2Matches: number
  level3Matches: number
  noMatches: number
}

export interface UploadResponse {
  success: boolean
  importId: string
  supplierName: string
  templateUsed: string
  itemsProcessed: number
  itemsSkipped: number
  skippedProducts: string[]
  currency: string
  matchingStats: MatchingStats
  processedProducts: ProcessedProduct[]
}

// --- APP STATE ---

export interface PriceDiff {
  productName: string
  previousPrice: number | null // null si es producto nuevo para este supplier
  newPrice: number
  diff: number
  changePercent: number
  changeType: 'increased' | 'decreased' | 'unchanged' | 'new'
  matchLevel: 1 | 2 | 3
}

export interface FileItem {
  id: string
  file: File
  status: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'ERROR'
  
  // Selección de usuario
  supplierId: string | null
  supplierName: string | null
  
  // Contexto para cálculo de diferencias (fetched on supplier select)
  previousPrices: CurrentPrice[] | null 
  
  // Resultado del proceso
  result?: UploadResponse
  diffs?: PriceDiff[]
  error?: string
}

// --- HELPERS ---

/**
 * Calcula las diferencias entre los precios procesados y los precios anteriores.
 * Es una función pura que no depende de hooks ni estado externo.
 */
export function calculateDiffs(
  processedProducts: ProcessedProduct[],
  previousPrices: CurrentPrice[] | null
): PriceDiff[] {
  // Convertir array de precios anteriores a Map para búsqueda O(1)
  const previousPricesMap = new Map<string, number>()
  if (previousPrices) {
    previousPrices.forEach(p => previousPricesMap.set(p.productName, p.currentPrice))
  }

  return processedProducts.map(product => {
    const prevPrice = previousPricesMap.get(product.productName) ?? null
    
    let changeType: PriceDiff['changeType'] = 'new'
    let diff = 0
    let changePercent = 0

    if (prevPrice !== null) {
      diff = product.newPrice - prevPrice
      
      if (diff > 0.001) changeType = 'increased'
      else if (diff < -0.001) changeType = 'decreased'
      else changeType = 'unchanged'

      if (prevPrice !== 0) {
        changePercent = (diff / prevPrice) * 100
      }
    }

    return {
      productName: product.productName,
      previousPrice: prevPrice,
      newPrice: product.newPrice,
      diff: Number(diff.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      changeType,
      matchLevel: product.matchLevel
    }
  })
}
