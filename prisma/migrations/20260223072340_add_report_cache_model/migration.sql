-- CreateTable
CREATE TABLE "report_cache" (
    "id" TEXT NOT NULL,
    "report_type" VARCHAR(50) NOT NULL,
    "parameters" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_cache_report_type_idx" ON "report_cache"("report_type");

-- CreateIndex
CREATE INDEX "report_cache_expires_at_idx" ON "report_cache"("expires_at");

-- CreateIndex
CREATE INDEX "report_cache_report_type_expires_at_idx" ON "report_cache"("report_type", "expires_at");
