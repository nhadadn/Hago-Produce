import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supplierId = params.id

    // Optimización: Una sola query para validar supplier y obtener precios
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: {
        id: true,
        name: true,
        isActive: true,
        priceLists: {
          where: { isCurrent: true },
          take: 1,
          select: {
            prices: {
              where: { validTo: null },
              include: {
                product: {
                  select: { id: true, name: true }
                }
              },
              orderBy: {
                product: { name: 'asc' }
              }
            }
          }
        }
      }
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    if (!supplier.isActive) {
      return NextResponse.json(
        { error: 'El proveedor no está activo' },
        { status: 400 }
      )
    }

    // Aplanar estructura: Supplier -> PriceLists[0] -> Prices
    const currentPriceList = supplier.priceLists[0]
    const rawPrices = currentPriceList?.prices || []

    const prices = rawPrices.map(pv => ({
      id: pv.id,
      productId: pv.productId,
      productName: pv.product.name,
      currentPrice: pv.price.toNumber(),
      currency: pv.currency,
      validFrom: pv.validFrom.toISOString()
    }))

    return NextResponse.json({
      supplierId: supplier.id,
      supplierName: supplier.name,
      priceCount: prices.length,
      prices
    })

  } catch (error: any) {
    console.error('[CURRENT_PRICES_ERROR]', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
