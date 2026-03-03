
import prisma from '../src/lib/db';
import { ImportStatus } from '@prisma/client';
import { extractPricesFromPdf } from '../src/lib/services/documents/pdf-price-extractor';
import { logger } from '../src/lib/logger/logger.service';

async function main() {
  console.log('Testing Runtime Environment...');
  try {
    // Test Logger
    console.log('Testing Logger...');
    logger.info('Test log message');
    
    // Test Prisma
    console.log('Testing Prisma connection...');
    await prisma.$connect();
    console.log('Prisma connected successfully.');
    
    // Test Imports
    console.log('ImportStatus:', ImportStatus);
    console.log('extractPricesFromPdf type:', typeof extractPricesFromPdf);

    const supplierCount = await prisma.supplier.count();
    console.log('Supplier count:', supplierCount);

  } catch (error) {
    console.error('Runtime Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
