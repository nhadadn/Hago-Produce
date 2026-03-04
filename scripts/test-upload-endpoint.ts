
import 'dotenv/config'
import { POST } from '../src/app/api/v1/imports/upload/route'
import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- STARTING TEST ---')

  // 1. Get Supplier ID
  const supplier = await prisma.supplier.findFirst({
    where: { name: 'IPOLLITO' }
  })

  if (!supplier) {
    console.error('Supplier IPOLLITO not found. Run setup-test-data.ts first.')
    process.exit(1)
  }
  console.log(`Found Supplier ID: ${supplier.id}`)

  // 2. Read PDF
  const pdfPath = path.join(process.cwd(), 'ipollito-test.pdf')
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF file not found. Run generate-test-pdf.ts first.')
    process.exit(1)
  }
  const pdfBuffer = fs.readFileSync(pdfPath)
  const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' })
  const pdfFile = new File([pdfBlob], 'ipollito-test.pdf', { type: 'application/pdf' })

  // 3. Create FormData
  const formData = new FormData()
  formData.append('file', pdfFile)
  formData.append('supplierId', supplier.id)

  // 4. Create Request
  // Mocking NextRequest with standard Request
  const req = new Request('http://localhost:3000/api/v1/imports/upload', {
    method: 'POST',
    body: formData
  }) as unknown as NextRequest

  // 5. Call POST
  console.log('Calling POST endpoint...')
  try {
    const response = await POST(req)
    console.log('Response Status:', response.status)
    const json = await response.json()
    console.log('Response Body:', JSON.stringify(json, null, 2))

    if (json.success) {
      console.log('--- SUCCESS ---')
      // Check DB
      const priceImport = await prisma.priceImport.findUnique({
        where: { id: json.importId }
      })
      console.log('PriceImport Status in DB:', priceImport?.status)
    } else {
      console.error('--- FAILED ---')
    }

  } catch (error) {
    console.error('Error calling POST:', error)
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
