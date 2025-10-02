-- AlterTable
ALTER TABLE "public"."ProductUsage" ADD COLUMN     "bookingPetId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."ProductUsage" ADD CONSTRAINT "ProductUsage_bookingPetId_fkey" FOREIGN KEY ("bookingPetId") REFERENCES "public"."BookingPet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
