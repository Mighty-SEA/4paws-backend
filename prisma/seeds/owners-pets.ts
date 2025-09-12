import { PrismaClient } from '@prisma/client';

export async function seedOwnersAndPets(prisma: PrismaClient): Promise<void> {
  const ownerDefs: Array<{
    name: string;
    phone: string;
    address: string;
    pets: Array<{ name: string; species: string; breed: string; birthdate: string }>;
  }> = [
    {
      name: 'Budi Santoso',
      phone: '081234567890',
      address: 'Jl. Mawar No. 1, Jakarta',
      pets: [
        { name: 'Kuro', species: 'Cat', breed: 'Domestic Short Hair', birthdate: '2019-05-12' },
        { name: 'Shiro', species: 'Cat', breed: 'Persian', birthdate: '2021-09-01' },
      ],
    },
    {
      name: 'Siti Rahma',
      phone: '081298765432',
      address: 'Jl. Melati No. 10, Bandung',
      pets: [
        { name: 'Bruno', species: 'Dog', breed: 'Golden Retriever', birthdate: '2018-02-20' },
      ],
    },
  ];

  for (const o of ownerDefs) {
    let owner = await prisma.owner.findFirst({ where: { name: o.name, phone: o.phone } });
    if (!owner) {
      owner = await prisma.owner.create({ data: { name: o.name, phone: o.phone, address: o.address } });
    } else {
      owner = await prisma.owner.update({ where: { id: owner.id }, data: { address: o.address } });
    }

    for (const p of o.pets) {
      const existingPet = await prisma.pet.findFirst({ where: { ownerId: owner.id, name: p.name } });
      if (!existingPet) {
        await prisma.pet.create({
          data: {
            ownerId: owner.id,
            name: p.name,
            species: p.species,
            breed: p.breed,
            birthdate: new Date(p.birthdate),
          },
        });
      }
    }
  }
}

// Standalone execution support
if (require.main === module) {
  const prisma = new PrismaClient();
  seedOwnersAndPets(prisma)
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('Owners & Pets seeding completed.');
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


