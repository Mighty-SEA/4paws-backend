-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "discountAmount" DECIMAL(12,2),
ADD COLUMN     "discountPercent" DECIMAL(5,2);
