-- CreateTable
CREATE TABLE "public"."PetSpecies" (
    "id" SERIAL NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PetSpecies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PetSpecies_isActive_sortOrder_idx" ON "public"."PetSpecies"("isActive", "sortOrder");
