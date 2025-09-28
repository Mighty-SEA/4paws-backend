-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "primaryDiscountAmount" DECIMAL(12,2),
ADD COLUMN     "primaryDiscountPercent" DECIMAL(5,2);
