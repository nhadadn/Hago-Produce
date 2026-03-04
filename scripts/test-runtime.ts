
import prisma from '../src/lib/db';
import { ImportStatus } from '@prisma/client';
import { extractPricesFromPdf } from '../src/lib/services/documents/pdf-price-extractor';

async function main() {
  console.log('Testing Prisma connection...');
  try {
    await prisma.$connect();
    console.log('Prisma connected successfully.');
    
    console.log('Checking ImportStatus enum...');
    console.log('ImportStatus:', ImportStatus);
    
    console.log('Checking extractPricesFromPdf...');
    console.log('extractPricesFromPdf type:', typeof extractPricesFromPdf);

    const supplierCount = await prisma.supplier.count();
    console.log('Supplier count:', supplierCount);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
