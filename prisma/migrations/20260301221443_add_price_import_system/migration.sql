/*
  Warnings:

  - Changed the type of `decision` on the `bot_decisions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "bot_decisions" DROP COLUMN "decision",
ADD COLUMN     "decision" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "price_versions" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'CAD',
ADD COLUMN     "import_id" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual';

-- CreateTable
CREATE TABLE "price_imports" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMP(3),
    "error_log" TEXT,
    "item_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_imports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_imports_supplier_id_idx" ON "price_imports"("supplier_id");

-- CreateIndex
CREATE INDEX "price_imports_status_idx" ON "price_imports"("status");

-- CreateIndex
CREATE INDEX "price_imports_created_at_idx" ON "price_imports"("created_at");

-- CreateIndex
CREATE INDEX "bot_decisions_executed_at_idx" ON "bot_decisions"("executed_at");

-- CreateIndex
CREATE INDEX "price_versions_import_id_idx" ON "price_versions"("import_id");

-- AddForeignKey
ALTER TABLE "price_versions" ADD CONSTRAINT "price_versions_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "price_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_imports" ADD CONSTRAINT "price_imports_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
