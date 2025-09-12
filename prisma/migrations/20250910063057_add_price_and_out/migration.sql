-- AlterEnum
ALTER TYPE "public"."InventoryType" ADD VALUE 'OUT';

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "price" DECIMAL(12,2) NOT NULL DEFAULT 0;
