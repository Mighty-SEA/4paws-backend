import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const user = await prisma.user.upsert({
    where: { username: adminUsername },
    update: { passwordHash, role: Role.MANAGER },
    create: { username: adminUsername, passwordHash, role: Role.MANAGER },
  });

  await prisma.staff.upsert({
    where: { userId: user.id },
    update: { name: 'Admin', role: Role.MANAGER },
    create: { userId: user.id, name: 'Admin', role: Role.MANAGER },
  });

  // seed minimal services for future steps (optional, non-breaking)
  await prisma.$transaction(async (tx) => {
    const services = ['Vet', 'Grooming', 'Vaksinasi', 'Sterilisasi', 'Rawat Inap', 'Pet Hotel'];
    for (const name of services) {
      await tx.$executeRawUnsafe(
        'INSERT INTO "services" (name) SELECT $1 WHERE NOT EXISTS (SELECT 1 FROM "services" WHERE name = $1);',
        name,
      );
    }
  }).catch(() => undefined);

  // eslint-disable-next-line no-console
  console.log('Seed completed. Admin user:', adminUsername);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


