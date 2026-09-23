-- AlterTable
ALTER TABLE "Order" ADD COLUMN "idempotencyHash" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "stock" INTEGER NOT NULL DEFAULT 30;