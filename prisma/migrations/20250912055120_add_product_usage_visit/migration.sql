-- DropForeignKey
ALTER TABLE "public"."ProductUsage" DROP CONSTRAINT "ProductUsage_examinationId_fkey";

-- AlterTable
ALTER TABLE "public"."ProductUsage" ADD COLUMN     "visitId" INTEGER,
ALTER COLUMN "examinationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."ProductUsage" ADD CONSTRAINT "ProductUsage_examinationId_fkey" FOREIGN KEY ("examinationId") REFERENCES "public"."Examination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductUsage" ADD CONSTRAINT "ProductUsage_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "public"."Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
