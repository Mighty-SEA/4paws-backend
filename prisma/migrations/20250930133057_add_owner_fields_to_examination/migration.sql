-- DropForeignKey
ALTER TABLE "public"."Examination" DROP CONSTRAINT "Examination_bookingPetId_fkey";

-- AlterTable
ALTER TABLE "public"."Examination" ADD COLUMN     "bookingId" INTEGER,
ADD COLUMN     "ownerId" INTEGER,
ALTER COLUMN "bookingPetId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Examination" ADD CONSTRAINT "Examination_bookingPetId_fkey" FOREIGN KEY ("bookingPetId") REFERENCES "public"."BookingPet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Examination" ADD CONSTRAINT "Examination_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."Owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Examination" ADD CONSTRAINT "Examination_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
