-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."JobRole" ADD VALUE 'ADMIN';
ALTER TYPE "public"."JobRole" ADD VALUE 'GROOMER';

-- AlterTable
ALTER TABLE "public"."Examination" ADD COLUMN     "adminId" INTEGER,
ADD COLUMN     "groomerId" INTEGER;

-- AlterTable
ALTER TABLE "public"."Visit" ADD COLUMN     "adminId" INTEGER,
ADD COLUMN     "groomerId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."Examination" ADD CONSTRAINT "Examination_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Examination" ADD CONSTRAINT "Examination_groomerId_fkey" FOREIGN KEY ("groomerId") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Visit" ADD CONSTRAINT "Visit_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Visit" ADD CONSTRAINT "Visit_groomerId_fkey" FOREIGN KEY ("groomerId") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
