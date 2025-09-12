-- AlterTable
ALTER TABLE "public"."MixUsage" ADD COLUMN     "visitId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."MixUsage" ADD CONSTRAINT "MixUsage_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "public"."Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
