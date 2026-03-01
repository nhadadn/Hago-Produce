-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "tax_rate" DROP DEFAULT;

-- AlterTable
ALTER TABLE "purchase_orders" ALTER COLUMN "taxRate" DROP DEFAULT;
