
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { extractPricesFromPdf } from '../src/lib/services/documents/pdf-price-extractor';
import { logger } from '../src/lib/logger/logger.service';

async function main() {
  console.log('Testing PDF Extraction Execution...');
  
  const pdfPath = path.join(process.cwd(), 'ipollito-test.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF file not found at:', pdfPath);
    process.exit(1);
  }

  const buffer = fs.readFileSync(pdfPath);
  console.log(`Read PDF: ${buffer.length} bytes`);

  try {
    console.log('Calling extractPricesFromPdf...');
    const result = await extractPricesFromPdf(buffer, 'IPOLLITO');
    console.log('Extraction Success!');
    console.log('Supplier:', result.supplierName);
    console.log('Products found:', result.products.length);
  } catch (error: any) {
    console.error('Extraction Failed:', error);
    if (error.cause) console.error('Cause:', error.cause);
    process.exit(1);
  }
}

main();
