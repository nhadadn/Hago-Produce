-- CreateTable
CREATE TABLE "price_lists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_versions" (
    "id" TEXT NOT NULL,
    "price_list_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_invoices" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pre_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_invoice_items" (
    "id" TEXT NOT NULL,
    "pre_invoice_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "pre_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_decisions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "decision" TEXT NOT NULL,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_lists_supplier_id_idx" ON "price_lists"("supplier_id");

-- CreateIndex
CREATE INDEX "price_lists_is_current_idx" ON "price_lists"("is_current");

-- CreateIndex
CREATE INDEX "price_versions_price_list_id_idx" ON "price_versions"("price_list_id");

-- CreateIndex
CREATE INDEX "price_versions_product_id_idx" ON "price_versions"("product_id");

-- CreateIndex
CREATE INDEX "pre_invoices_customer_id_idx" ON "pre_invoices"("customer_id");

-- CreateIndex
CREATE INDEX "pre_invoices_status_idx" ON "pre_invoices"("status");

-- CreateIndex
CREATE INDEX "pre_invoice_items_pre_invoice_id_idx" ON "pre_invoice_items"("pre_invoice_id");

-- CreateIndex
CREATE INDEX "pre_invoice_items_product_id_idx" ON "pre_invoice_items"("product_id");

-- CreateIndex
CREATE INDEX "bot_decisions_session_id_idx" ON "bot_decisions"("session_id");

-- CreateIndex
CREATE INDEX "bot_decisions_intent_idx" ON "bot_decisions"("intent");

-- CreateIndex
CREATE INDEX "bot_decisions_created_at_idx" ON "bot_decisions"("created_at");

-- AddForeignKey
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_versions" ADD CONSTRAINT "price_versions_price_list_id_fkey" FOREIGN KEY ("price_list_id") REFERENCES "price_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_versions" ADD CONSTRAINT "price_versions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_invoices" ADD CONSTRAINT "pre_invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_invoice_items" ADD CONSTRAINT "pre_invoice_items_pre_invoice_id_fkey" FOREIGN KEY ("pre_invoice_id") REFERENCES "pre_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_invoice_items" ADD CONSTRAINT "pre_invoice_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_decisions" ADD CONSTRAINT "bot_decisions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
