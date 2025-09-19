-- AlterTable
ALTER TABLE "public"."Examination" ADD COLUMN     "doctorId" INTEGER,
ADD COLUMN     "paravetId" INTEGER;

-- AlterTable
ALTER TABLE "public"."Visit" ADD COLUMN     "paravetId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."Examination" ADD CONSTRAINT "Examination_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Examination" ADD CONSTRAINT "Examination_paravetId_fkey" FOREIGN KEY ("paravetId") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Visit" ADD CONSTRAINT "Visit_paravetId_fkey" FOREIGN KEY ("paravetId") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
