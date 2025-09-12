-- AlterTable
ALTER TABLE "public"."Deposit" ADD COLUMN     "estimatedEndDate" TIMESTAMP(3),
ADD COLUMN     "estimatedTotal" DECIMAL(12,2);
