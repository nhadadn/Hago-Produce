
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding test data...')

  // 1. Create Supplier
  const supplier = await prisma.supplier.upsert({
    where: { name: 'IPOLLITO' },
    update: {},
    create: {
      name: 'IPOLLITO',
      email: 'orders@ipollito.com',
      isActive: true
    }
  })
  console.log('Supplier created/found:', supplier.id)

  // 2. Create Products
  const products = [
    { name: 'CARROTS TRI COLOR TOPS US', unit: "24'S" },
    { name: 'GARLIC ELEPHANT US', unit: 'CASE' },
    { name: 'ASPARAGUS GREEN LRG', unit: '11LB' },
    { name: 'BROCCOLI CROWNS', unit: 'CASE' },
    { name: 'CABBAGE GREEN', unit: '50LB' }
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: `TEST-${p.name.replace(/\s+/g, '-')}` },
      update: {},
      create: {
        name: p.name, // Matching exact name for simplicity
        sku: `TEST-${p.name.replace(/\s+/g, '-')}`,
        unit: p.unit,
        isActive: true
      }
    })
  }
  console.log('Products seeded.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
