import type { PrismaClient } from '@prisma/client'

export async function seedPetSpecies(prisma: PrismaClient) {
  const data: Array<{ kind: string; name: string; sortOrder?: number; isActive?: boolean }> = [
    // Umum dipelihara
    { kind: 'Anjing', name: 'Anjing' },
    { kind: 'Kucing', name: 'Kucing' },
    { kind: 'Kelinci', name: 'Kelinci' },
    { kind: 'Hamster', name: 'Hamster' },
    { kind: 'Guinea Pig', name: 'Guinea Pig' },
    { kind: 'Burung', name: 'Burung' },
    { kind: 'Ikan', name: 'Ikan' },
    { kind: 'Kura-kura', name: 'Kura-kura' },
    { kind: 'Sugar Glider', name: 'Sugar Glider' },
    { kind: 'Ferret', name: 'Ferret' },
    { kind: 'Chinchilla', name: 'Chinchilla' },
    { kind: 'Landak Mini', name: 'Landak Mini' },
    { kind: 'Ular', name: 'Ular' },
    { kind: 'Kadal', name: 'Kadal' },
    { kind: 'Katak', name: 'Katak' },
  ]

  for (let i = 0; i < data.length; i += 1) {
    const it = data[i]
    const sortOrder = i
    const exists = await prisma.petSpecies.findFirst({ where: { kind: it.kind, name: it.name } })
    if (!exists) {
      await prisma.petSpecies.create({ data: { kind: it.kind, name: it.name, sortOrder, isActive: it.isActive ?? true } })
    }
  }
}


