import { PrismaClient } from '@prisma/client';

export async function seedStoreSettings(prisma: PrismaClient): Promise<void> {
  // Ensure default StoreSetting exists
  const existingSetting = await prisma.storeSetting.findFirst();
  if (!existingSetting) {
    await prisma.storeSetting.create({
      data: {
        address: 'Alamat toko',
        phone: '08123456789',
        name: '4PAWS Petcare',
      },
    });
  }
}

// Standalone execution support
if (require.main === module) {
  const prisma = new PrismaClient();
  seedStoreSettings(prisma)
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('Store Settings seeding completed.');
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

