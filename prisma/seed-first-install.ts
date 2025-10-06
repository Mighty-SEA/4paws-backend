import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seeds/users';

const prisma = new PrismaClient();

/**
 * Seed data for first-time installation
 * Only seeds:
 * - Users (Master & Admin)
 * - Services (without ServiceTypes)
 */

async function seedServicesOnly(prisma: PrismaClient): Promise<void> {
  // Seed Services only (no ServiceTypes)
  const serviceNames = [
    'Vet',
    'Grooming',
    'Vaksinasi',
    'Sterilisasi',
    'Rawat Inap',
    'Pet Hotel',
    'Petshop',
  ];

  for (const name of serviceNames) {
    await prisma.service.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

async function main() {
  // eslint-disable-next-line no-console
  console.log('🌱 Starting first-time installation seeding...');

  // Seed Users (Master & Admin)
  // eslint-disable-next-line no-console
  console.log('👤 Seeding users...');
  await seedUsers(prisma);
  // eslint-disable-next-line no-console
  console.log('✅ Users seeded');

  // Seed Services only (no ServiceTypes)
  // eslint-disable-next-line no-console
  console.log('🛠️  Seeding services...');
  await seedServicesOnly(prisma);
  // eslint-disable-next-line no-console
  console.log('✅ Services seeded');

  // eslint-disable-next-line no-console
  console.log('✅ First-time installation seed completed!');
  // eslint-disable-next-line no-console
  console.log('📋 Default credentials:');
  // eslint-disable-next-line no-console
  console.log('   Master: master@4paws / master12345');
  // eslint-disable-next-line no-console
  console.log('   Admin:  admin@4paws / admin12345');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

