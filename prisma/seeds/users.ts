import { PrismaClient, AccountRole, JobRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  // Create/Update Master
  const masterPass = await bcrypt.hash('master12345', 10);
  await prisma.user.upsert({
    where: { username: 'master@4paws' },
    update: { passwordHash: masterPass, accountRole: AccountRole.MASTER },
    create: {
      username: 'master@4paws',
      passwordHash: masterPass,
      accountRole: AccountRole.MASTER,
      staff: { create: { name: 'Master', jobRole: JobRole.SUPERVISOR } },
    },
  });

  // Create/Update Admin
  const adminPass = await bcrypt.hash('admin12345', 10);
  await prisma.user.upsert({
    where: { username: 'admin@4paws' },
    update: { passwordHash: adminPass, accountRole: AccountRole.ADMIN },
    create: {
      username: 'admin@4paws',
      passwordHash: adminPass,
      accountRole: AccountRole.ADMIN,
      staff: { create: { name: 'Admin', jobRole: JobRole.ADMIN } },
    },
  });
}

// Standalone execution support
if (require.main === module) {
  const prisma = new PrismaClient();
  seedUsers(prisma)
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('Users seeding completed. Users: master@4paws/master12345, admin@4paws/admin12345');
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

