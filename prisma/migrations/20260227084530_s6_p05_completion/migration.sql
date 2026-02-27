/*
  Warnings:

  - The `status` column on the `pre_invoices` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[pre_invoice_id]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bot_decision_id]` on the table `pre_invoices` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tax_rate` to the `pre_invoices` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PreInvoiceStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'CONVERTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PreInvoiceSource" AS ENUM ('SYSTEM', 'AI', 'MANUAL');

-- DropForeignKey
ALTER TABLE "bot_decisions" DROP CONSTRAINT "bot_decisions_session_id_fkey";

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "pre_invoice_id" TEXT;

-- AlterTable
ALTER TABLE "pre_invoices" ADD COLUMN     "bot_decision_id" TEXT,
ADD COLUMN     "generated_by" "PreInvoiceSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "tax_rate" DECIMAL(5,4) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PreInvoiceStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE UNIQUE INDEX "invoices_pre_invoice_id_key" ON "invoices"("pre_invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "pre_invoices_bot_decision_id_key" ON "pre_invoices"("bot_decision_id");

-- CreateIndex
CREATE INDEX "pre_invoices_status_idx" ON "pre_invoices"("status");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_pre_invoice_id_fkey" FOREIGN KEY ("pre_invoice_id") REFERENCES "pre_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_invoices" ADD CONSTRAINT "pre_invoices_bot_decision_id_fkey" FOREIGN KEY ("bot_decision_id") REFERENCES "bot_decisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_decisions" ADD CONSTRAINT "bot_decisions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
