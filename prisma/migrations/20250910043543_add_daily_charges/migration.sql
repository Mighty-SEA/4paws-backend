-- CreateTable
CREATE TABLE "public"."DailyCharge" (
    "id" SERIAL NOT NULL,
    "bookingPetId" INTEGER NOT NULL,
    "chargeDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCharge_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."DailyCharge" ADD CONSTRAINT "DailyCharge_bookingPetId_fkey" FOREIGN KEY ("bookingPetId") REFERENCES "public"."BookingPet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
