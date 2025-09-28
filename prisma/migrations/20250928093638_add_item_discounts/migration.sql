-- AlterTable
ALTER TABLE "public"."BookingItem" ADD COLUMN     "discountAmount" DECIMAL(12,2),
ADD COLUMN     "discountPercent" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "public"."MixUsage" ADD COLUMN     "discountAmount" DECIMAL(12,2),
ADD COLUMN     "discountPercent" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "public"."ProductUsage" ADD COLUMN     "discountAmount" DECIMAL(12,2),
ADD COLUMN     "discountPercent" DECIMAL(5,2);
