/*
  Warnings:

  - You are about to drop the column `role` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."AccountRole" AS ENUM ('MASTER', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "public"."JobRole" AS ENUM ('SUPERVISOR', 'DOCTOR', 'PARAVET');

-- AlterTable
ALTER TABLE "public"."Staff" DROP COLUMN "role",
ADD COLUMN     "jobRole" "public"."JobRole" NOT NULL DEFAULT 'SUPERVISOR';

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "role",
ADD COLUMN     "accountRole" "public"."AccountRole" NOT NULL DEFAULT 'SUPERVISOR';

-- DropEnum
DROP TYPE "public"."Role";
