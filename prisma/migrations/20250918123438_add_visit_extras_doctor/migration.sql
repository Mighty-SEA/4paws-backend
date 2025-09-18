-- AlterTable
ALTER TABLE "public"."Visit" ADD COLUMN     "appetite" TEXT,
ADD COLUMN     "condition" TEXT,
ADD COLUMN     "defecation" TEXT,
ADD COLUMN     "doctorId" INTEGER,
ADD COLUMN     "symptoms" TEXT,
ADD COLUMN     "urine" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Visit" ADD CONSTRAINT "Visit_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
