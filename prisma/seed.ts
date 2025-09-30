import { PrismaClient, AccountRole, JobRole } from '@prisma/client';
import { seedOwnersAndPets } from './seeds/owners-pets';
import { seedProductsAndMix } from './seeds/products-mix';
import { seedPetSpecies } from './seeds/pet-species';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create/Update Master
  const masterPass = await bcrypt.hash('master12345', 10);
  const master = await prisma.user.upsert({
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
    { name: 'Petshop', types: [{ name: 'Petshop', price: '0', pricePerDay: null }] },
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

  // Ensure default StoreSetting exists
  const existingSetting = await prisma.storeSetting.findFirst();
  if (!existingSetting) {
    await prisma.storeSetting.create({ data: { address: 'Alamat toko', phone: '08123456789', name: '4PAWS Petcare' } });
  }

  // Seed Pet Species
  await seedPetSpecies(prisma);

  // eslint-disable-next-line no-console
  console.log('Seed completed. Users: master@4paws/master12345, admin@4paws/admin12345');
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


