-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" TEXT NOT NULL,
    "changes" JSON,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_notes" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_log_entity_type_idx" ON "audit_log"("entity_type");

-- CreateIndex
CREATE INDEX "audit_log_entity_id_idx" ON "audit_log"("entity_id");

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");

-- CreateIndex
CREATE INDEX "invoice_notes_invoice_id_idx" ON "invoice_notes"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_notes_user_id_idx" ON "invoice_notes"("user_id");

-- AddForeignKey
ALTER TABLE "invoice_notes" ADD CONSTRAINT "invoice_notes_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_notes" ADD CONSTRAINT "invoice_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
