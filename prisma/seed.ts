import { PrismaClient, AccountRole, JobRole } from '@prisma/client';
import { seedOwnersAndPets } from './seeds/owners-pets';
import { seedProductsAndMix } from './seeds/products-mix';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const existingUser = await prisma.user.findUnique({ where: { username: adminUsername } });
  if (!existingUser) {
    await prisma.user.create({
      data: {
        username: adminUsername,
        passwordHash,
        accountRole: AccountRole.MASTER,
        staff: {
          create: { name: 'Admin', jobRole: JobRole.SUPERVISOR },
        },
      },
    });
  } else {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        passwordHash,
        accountRole: AccountRole.MASTER,
      },
    });
    // ensure user has staff linked
    const staff = await prisma.staff.findFirst({ where: { id: existingUser.staffId } });
    if (!staff) {
      const s = await prisma.staff.create({ data: { name: 'Admin', jobRole: JobRole.SUPERVISOR } });
      await prisma.user.update({ where: { id: existingUser.id }, data: { staffId: s.id } });
    }
  }

  // Seed Services & ServiceTypes
  const serviceDefs: Array<{
    name: string;
    types?: Array<{ name: string; price: string; pricePerDay?: string | null }>;
  }> = [
    { name: 'Vet', types: [{ name: 'Konsultasi', price: '50000' }] },
    { name: 'Grooming', types: [{ name: 'Grooming Standar', price: '75000' }] },
    { name: 'Vaksinasi', types: [{ name: 'Vaksin Rabies', price: '90000' }] },
    { name: 'Sterilisasi', types: [{ name: 'Steril Betina', price: '750000' }, { name: 'Steril Jantan', price: '500000' }] },
    { name: 'Rawat Inap', types: [{ name: 'Kandang Standar', price: '0', pricePerDay: '75000' }] },
    { name: 'Pet Hotel', types: [{ name: 'Kamar Reguler', price: '0', pricePerDay: '60000' }] },
  ];

  for (const s of serviceDefs) {
    const service = await prisma.service.upsert({
      where: { name: s.name },
      update: {},
      create: { name: s.name },
    });
    if (s.types?.length) {
      for (const t of s.types) {
        const exists = await prisma.serviceType.findFirst({ where: { serviceId: service.id, name: t.name } });
        if (!exists) {
          await prisma.serviceType.create({
            data: {
              serviceId: service.id,
              name: t.name,
              price: t.price,
              pricePerDay: t.pricePerDay ?? null,
            },
          });
        }
      }
    }
  }

  // Seed Owners & Pets
  await seedOwnersAndPets(prisma);

  // Seed Products & Mix
  await seedProductsAndMix(prisma);

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


