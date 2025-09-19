-- 1) Add nullable staffId to User
ALTER TABLE "public"."User" ADD COLUMN "staffId" INTEGER;

-- 2) Backfill staffId for users that already have a Staff row
UPDATE "public"."User" u
SET "staffId" = s."id"
FROM "public"."Staff" s
WHERE s."userId" = u."id" AND u."staffId" IS NULL;

-- 3) Create Staff rows for users without one, then backfill again
INSERT INTO "public"."Staff" ("name", "userId")
SELECT u."username", u."id"
FROM "public"."User" u
WHERE NOT EXISTS (SELECT 1 FROM "public"."Staff" s WHERE s."userId" = u."id");

UPDATE "public"."User" u
SET "staffId" = s."id"
FROM "public"."Staff" s
WHERE s."userId" = u."id" AND u."staffId" IS NULL;

-- 4) Enforce NOT NULL & add constraints on the new relation
ALTER TABLE "public"."User" ALTER COLUMN "staffId" SET NOT NULL;
CREATE UNIQUE INDEX "User_staffId_key" ON "public"."User"("staffId");
ALTER TABLE "public"."User" ADD CONSTRAINT "User_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5) Drop old Staff.userId column & its constraints
ALTER TABLE "public"."Staff" DROP CONSTRAINT IF EXISTS "Staff_userId_fkey";
DROP INDEX IF EXISTS "public"."Staff_userId_key";
ALTER TABLE "public"."Staff" DROP COLUMN IF EXISTS "userId";
