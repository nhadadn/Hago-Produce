-- CreateTable
CREATE TABLE "bot_api_key" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "hashed_key" VARCHAR(255) NOT NULL,
    "rate_limit" INTEGER NOT NULL DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_api_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_log" (
    "id" TEXT NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "api_key" VARCHAR(255),
    "idempotency_key" VARCHAR(255),
    "event_type" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "http_status" INTEGER NOT NULL,
    "error_code" VARCHAR(100),
    "error_message" TEXT,
    "payload" JSON,
    "response_body" JSON,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bot_api_key_name_key" ON "bot_api_key"("name");

-- CreateIndex
CREATE INDEX "bot_api_key_is_active_idx" ON "bot_api_key"("is_active");

-- CreateIndex
CREATE INDEX "webhook_log_idempotency_key_idx" ON "webhook_log"("idempotency_key");

-- CreateIndex
CREATE INDEX "webhook_log_event_type_idx" ON "webhook_log"("event_type");
