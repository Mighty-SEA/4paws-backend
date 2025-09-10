-- CreateTable
CREATE TABLE "public"."Visit" (
    "id" SERIAL NOT NULL,
    "bookingPetId" INTEGER NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DECIMAL(5,2),
    "temperature" DECIMAL(4,1),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Visit" ADD CONSTRAINT "Visit_bookingPetId_fkey" FOREIGN KEY ("bookingPetId") REFERENCES "public"."BookingPet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
