/*
  Warnings:

  - You are about to drop the column `branch` on the `BankAccount` table. All the data in the column will be lost.
  - You are about to drop the column `isDefault` on the `BankAccount` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."BankAccount" DROP COLUMN "branch",
DROP COLUMN "isDefault";
