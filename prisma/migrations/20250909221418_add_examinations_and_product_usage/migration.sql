-- CreateTable
CREATE TABLE "public"."Examination" (
    "id" SERIAL NOT NULL,
    "bookingPetId" INTEGER NOT NULL,
    "weight" DECIMAL(5,2),
    "temperature" DECIMAL(4,1),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Examination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductUsage" (
    "id" SERIAL NOT NULL,
    "examinationId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductUsage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Examination" ADD CONSTRAINT "Examination_bookingPetId_fkey" FOREIGN KEY ("bookingPetId") REFERENCES "public"."BookingPet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductUsage" ADD CONSTRAINT "ProductUsage_examinationId_fkey" FOREIGN KEY ("examinationId") REFERENCES "public"."Examination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
