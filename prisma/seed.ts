import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seeds/users';
import { seedServices } from './seeds/services';
import { seedStoreSettings } from './seeds/store-settings';
import { seedPetSpecies } from './seeds/pet-species';
import { seedOwnersAndPets } from './seeds/owners-pets';
import { seedProductsAndMix } from './seeds/products-mix';

const prisma = new PrismaClient();

async function main() {
  // Seed Users (Master & Admin)
  await seedUsers(prisma);

  // Seed Services & ServiceTypes
  await seedServices(prisma);

  // Seed Store Settings
  await seedStoreSettings(prisma);

  // Seed Pet Species
  await seedPetSpecies(prisma);

  // Seed Owners & Pets
  await seedOwnersAndPets(prisma);

  // Seed Products & Mix
  await seedProductsAndMix(prisma);

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


