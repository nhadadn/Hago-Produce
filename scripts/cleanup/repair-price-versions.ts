import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function repair() {
  const now = new Date()
  const suppliers = await prisma.supplier.findMany({
    select: { id: true, name: true },
  })

  for (const supplier of suppliers) {
    const lists = await prisma.priceList.findMany({
      where: { supplierId: supplier.id },
      orderBy: { validFrom: 'desc' },
      select: { id: true, isCurrent: true, validFrom: true, validTo: true },
    })

    if (lists.length === 0) continue

    const current = lists[0]
    const others = lists.slice(1)

    if (!current.isCurrent || current.validTo) {
      await prisma.priceList.update({
        where: { id: current.id },
        data: { isCurrent: true, validTo: null },
      })
    }

    if (others.length > 0) {
      await prisma.priceList.updateMany({
        where: { id: { in: others.map((l) => l.id) } },
        data: { isCurrent: false },
      })

      const closingDate = current.validFrom || now
      await prisma.priceVersion.updateMany({
        where: {
          priceListId: { in: others.map((l) => l.id) },
          OR: [{ validTo: null }, { validTo: { gt: closingDate } }],
        },
        data: { validTo: closingDate },
      })

      await prisma.priceList.updateMany({
        where: {
          id: { in: others.map((l) => l.id) },
          OR: [{ validTo: null }, { validTo: { gt: closingDate } }],
        },
        data: { validTo: closingDate },
      })
    }

    const currentVersions = await prisma.priceVersion.findMany({
      where: { priceListId: current.id },
      select: {
        id: true,
        productId: true,
        validFrom: true,
        validTo: true,
      },
      orderBy: [{ productId: 'asc' }, { validFrom: 'asc' }],
    })

    const byProduct = new Map<string, typeof currentVersions>()
    for (const pv of currentVersions) {
      const arr = byProduct.get(pv.productId) || []
      arr.push(pv)
      byProduct.set(pv.productId, arr)
    }

    for (const [productId, versions] of byProduct.entries()) {
      versions.sort((a, b) => a.validFrom.getTime() - b.validFrom.getTime())
      for (let i = 0; i < versions.length; i++) {
        const v = versions[i]
        const next = versions[i + 1]
        if (next) {
          if (!v.validTo || v.validTo.getTime() !== next.validFrom.getTime()) {
            await prisma.priceVersion.update({
              where: { id: v.id },
              data: { validTo: next.validFrom },
            })
          }
        } else {
          if (v.validTo !== null) {
            await prisma.priceVersion.update({
              where: { id: v.id },
              data: { validTo: null },
            })
          }
        }
      }
    }
  }
}

repair()
  .then(async () => {
    await prisma.$disconnect()
    console.log('Price versions repair completed')
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

