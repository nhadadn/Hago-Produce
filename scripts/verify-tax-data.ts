
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verifying tax data integrity...');

  // 1. Check for null tax rates (should be 0 because schema enforces NOT NULL, but good to check before migration applied if we were altering column type)
  // Actually, schema has NOT NULL, so this query would fail if we try to select NULLs? No, if we select where it is null.
  // But since it's NOT NULL in DB, we can't have NULLs.
  // However, we want to see distribution of tax rates.

  const invoiceTaxRates = await prisma.invoice.groupBy({
    by: ['taxRate'],
    _count: {
      id: true
    }
  });

  console.log('Invoice Tax Rate Distribution:');
  invoiceTaxRates.forEach(group => {
    console.log(`Rate: ${group.taxRate}, Count: ${group._count.id}`);
  });

  const poTaxRates = await prisma.purchaseOrder.groupBy({
    by: ['taxRate'],
    _count: {
      id: true
    }
  });

  console.log('\nPurchase Order Tax Rate Distribution:');
  poTaxRates.forEach(group => {
    console.log(`Rate: ${group.taxRate}, Count: ${group._count.id}`);
  });

  // Decision: Keep existing 0.13 rates as they are historical.
  // Verification: Ensure no unexpected values (e.g. 0.0 if that was ever possible).
  
  const zeroTaxInvoices = await prisma.invoice.count({
    where: {
      taxRate: 0
    }
  });

  if (zeroTaxInvoices > 0) {
    console.warn(`\nWARNING: Found ${zeroTaxInvoices} invoices with 0% tax rate. Please verify if this is intended (e.g. exempt).`);
  }

  console.log('\nVerification complete. No data modification needed for existing records.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
