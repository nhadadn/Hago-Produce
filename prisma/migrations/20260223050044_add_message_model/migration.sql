-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "platform" VARCHAR(20) NOT NULL,
    "platform_user_id" VARCHAR(100) NOT NULL,
    "platform_message_id" VARCHAR(100),
    "message" TEXT NOT NULL,
    "response" TEXT,
    "intent" VARCHAR(50),
    "confidence" DOUBLE PRECISION,
    "is_command" BOOLEAN NOT NULL DEFAULT false,
    "command" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'received',
    "error_message" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_platform_platform_user_id_idx" ON "messages"("platform", "platform_user_id");

-- CreateIndex
CREATE INDEX "messages_status_idx" ON "messages"("status");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");
