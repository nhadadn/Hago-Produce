-- AlterTable
ALTER TABLE "bot_api_key" ADD COLUMN     "description" VARCHAR(200),
ADD COLUMN     "expires_at" TIMESTAMP(3);
