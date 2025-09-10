/*
  Warnings:

  - You are about to drop the column `baseUnit` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `ProductUnit` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ProductUnit" DROP CONSTRAINT "ProductUnit_productId_fkey";

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "baseUnit",
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'unit',
ADD COLUMN     "unitContentAmount" DECIMAL(12,4),
ADD COLUMN     "unitContentName" TEXT;

-- DropTable
DROP TABLE "public"."ProductUnit";
