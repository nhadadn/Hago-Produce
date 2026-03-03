import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { logger } from '@/lib/logger/logger.service'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware'
import { extractPricesFromPdf } from '@/lib/services/documents/pdf-price-extractor'
import { ImportStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return unauthorizedResponse()
    }

    // 2. Get FormData
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const supplierId = formData.get('supplierId') as string | null

    // 3. Validations
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FILE', message: 'No file uploaded' } },
        { status: 400 }
      )
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_FILE_TYPE', message: 'File must be a PDF' } },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json(
        { success: false, error: { code: 'FILE_TOO_LARGE', message: 'File size exceeds 10MB limit' } },
        { status: 400 }
      )
    }

    if (!supplierId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_SUPPLIER_ID', message: 'Supplier ID is required' } },
        { status: 400 }
      )
    }

    // 4. Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    })

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: { code: 'SUPPLIER_NOT_FOUND', message: 'Supplier not found' } },
        { status: 400 }
      )
    }

    // 5. Create PriceImport record (PENDING)
    const priceImport = await prisma.priceImport.create({
      data: {
        supplierId: supplier.id,
        fileName: file.name,
        fileSize: file.size,
        status: ImportStatus.PENDING,
        itemCount: 0,
      },
    })

    try {
      // 6. Convert file to Buffer
      const buffer = Buffer.from(await file.arrayBuffer())

      // 7. Update status to PROCESSING
      await prisma.priceImport.update({
        where: { id: priceImport.id },
        data: { status: ImportStatus.PROCESSING },
      })

      // 8. Extract prices
      const extractionResult = await extractPricesFromPdf(buffer, supplier.name)
      const { 
        products: extractedProducts = [], 
        currency = 'MXN',
        supplierName: detectedSupplierName 
      } = extractionResult

      if (!Array.isArray(extractedProducts) || extractedProducts.length === 0) {
        throw new Error('No products extracted from PDF')
      }

      // 9. Process extracted products (create PriceVersions)
      const now = new Date()
      let itemsProcessed = 0
      let itemsSkipped = 0
      const processedProducts = []
      const skippedProducts = []
      const matchingStats = {
        exactMatches: 0,
        level1Matches: 0,
        noMatches: 0
      }
      const productMap = new Map<string, any>()

      const dedupedByName = new Map<string, any>()
      for (const item of extractedProducts) {
        const key = String(item?.name || '').trim().toLowerCase()
        if (!key) continue
        dedupedByName.set(key, item)
      }

      await prisma.$transaction(async (tx) => {
        await tx.priceVersion.updateMany({
          where: {
            priceList: { supplierId: supplier.id },
            validFrom: { lte: now },
            OR: [{ validTo: null }, { validTo: { gt: now } }],
          },
          data: { validTo: now },
        })

        await tx.priceList.updateMany({
          where: { supplierId: supplier.id, isCurrent: true },
          data: { isCurrent: false, validTo: now },
        })

        const priceList = await tx.priceList.create({
          data: {
            supplierId: supplier.id,
            name: `Imported from ${file.name}`,
            validFrom: now,
            isCurrent: true,
          },
        })

        for (const item of dedupedByName.values()) {
          const normalizedName = String(item.name || '').trim()
          if (!normalizedName) continue

          const existingProduct = await tx.product.findFirst({
            where: {
              name: {
                equals: normalizedName,
                mode: 'insensitive',
              },
            },
          })

          const product = existingProduct
            ? existingProduct
            : productMap.get(normalizedName) ||
              (await tx.product.create({
                data: {
                  name: normalizedName,
                  isActive: true,
                },
              }))

          if (!existingProduct) {
            productMap.set(normalizedName, product)
            matchingStats.noMatches++
          } else {
            matchingStats.exactMatches++
          }

          await tx.priceVersion.create({
            data: {
              priceListId: priceList.id,
              importId: priceImport.id,
              productId: product.id,
              price: Number(item.price),
              currency: currency,
              validFrom: now,
              validTo: null,
              source: 'import',
            },
          })

          processedProducts.push({
            productName: product.name,
            oldPrice: null,
            newPrice: item.price,
            sku: item.sku,
          })
          itemsProcessed++
        }

        await tx.priceImport.update({
          where: { id: priceImport.id },
          data: {
            status: ImportStatus.COMPLETED,
            itemCount: itemsProcessed,
            processedAt: now,
          },
        })
      })

      // 11. Return success response
      return NextResponse.json({
        success: true,
        importId: priceImport.id,
        supplierName: supplier.name,
        templateUsed: detectedSupplierName || 'unknown',
        itemsProcessed,
        itemsSkipped: 0, // Ya no hay productos skipped, todos se crean automáticamente
        skippedProducts: [], // Lista vacía ya que no hay skipped
        currency,
        processedProducts,
        matchingStats: {
          newProductsCreated: matchingStats.noMatches,
          exactMatches: matchingStats.exactMatches,
          totalProducts: itemsProcessed
        }
      })

    } catch (extractionError: any) {
      logger.error(`[UPLOAD_ROUTE] Extraction error: ${extractionError.message}`)
      
      // Update status to FAILED
      await prisma.priceImport.update({
        where: { id: priceImport.id },
        data: {
          status: ImportStatus.FAILED,
          errorLog: extractionError.message,
          processedAt: new Date(),
        },
      })

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EXTRACTION_FAILED',
            message: 'Failed to extract data from PDF',
            details: extractionError.message,
          },
        },
        { status: 422 }
      )
    }

  } catch (error: any) {
    logger.error(`[UPLOAD_ROUTE] System error: ${error.message}`)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}
