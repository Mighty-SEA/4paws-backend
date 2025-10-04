import { PrismaClient } from '@prisma/client';

export async function seedServices(prisma: PrismaClient): Promise<void> {
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
}

// Standalone execution support
if (require.main === module) {
  const prisma = new PrismaClient();
  seedServices(prisma)
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('Services & Service Types seeding completed.');
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

