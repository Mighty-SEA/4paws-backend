-- CreateTable
CREATE TABLE "public"."MixProduct" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MixProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MixComponent" (
    "id" SERIAL NOT NULL,
    "mixProductId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantityBase" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "MixComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MixUsage" (
    "id" SERIAL NOT NULL,
    "bookingPetId" INTEGER NOT NULL,
    "mixProductId" INTEGER NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MixUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MixProduct_name_key" ON "public"."MixProduct"("name");

-- AddForeignKey
ALTER TABLE "public"."MixComponent" ADD CONSTRAINT "MixComponent_mixProductId_fkey" FOREIGN KEY ("mixProductId") REFERENCES "public"."MixProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MixComponent" ADD CONSTRAINT "MixComponent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MixUsage" ADD CONSTRAINT "MixUsage_bookingPetId_fkey" FOREIGN KEY ("bookingPetId") REFERENCES "public"."BookingPet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MixUsage" ADD CONSTRAINT "MixUsage_mixProductId_fkey" FOREIGN KEY ("mixProductId") REFERENCES "public"."MixProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
