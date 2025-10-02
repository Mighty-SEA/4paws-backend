import { PrismaClient } from '@prisma/client';

export async function seedProductsAndMix(prisma: PrismaClient): Promise<void> {
  const productDefs: Array<{
    name: string;
    unit: string;
    price: string; // Decimal as string
    unitContentAmount?: string | null; // Decimal as string
    unitContentName?: string | null;
    initialQuantity?: string; // Decimal base unit
  }> = [
    { name: 'Amoxicillin 500mg', unit: 'tablet', price: '5000', unitContentAmount: '500', unitContentName: 'mg', initialQuantity: '200' },
    { name: 'Doxycycline 100mg', unit: 'tablet', price: '7000', unitContentAmount: '100', unitContentName: 'mg', initialQuantity: '150' },
    { name: 'Vitamin B Complex', unit: 'tablet', price: '3000', unitContentAmount: '1', unitContentName: 'tablet', initialQuantity: '300' },
    { name: 'Infusion NaCl 0.9% 500ml', unit: 'botol', price: '18000', unitContentAmount: '500', unitContentName: 'ml', initialQuantity: '40' },
    { name: 'Syringe 3ml', unit: 'pcs', price: '2500', unitContentAmount: '3', unitContentName: 'ml', initialQuantity: '100' },
    { name: 'Antiseptic Solution 100ml', unit: 'botol', price: '12000', unitContentAmount: '100', unitContentName: 'ml', initialQuantity: '50' },
    // Pet foods and supplies
    { name: 'Cat Dry Food 1kg', unit: 'pack', price: '120000', unitContentAmount: '1', unitContentName: 'kg', initialQuantity: '50' },
    { name: 'Cat Wet Food 85g', unit: 'kaleng', price: '9000', unitContentAmount: '85', unitContentName: 'g', initialQuantity: '200' },
    { name: 'Dog Dry Food 1.5kg', unit: 'pack', price: '180000', unitContentAmount: '1.5', unitContentName: 'kg', initialQuantity: '40' },
    { name: 'Cat Litter 10L', unit: 'sak', price: '70000', unitContentAmount: '10', unitContentName: 'L', initialQuantity: '60' },
    { name: 'Cat Treats 60g', unit: 'pack', price: '25000', unitContentAmount: '60', unitContentName: 'g', initialQuantity: '120' },
  ];

  const productNameToId: Record<string, number> = {};
  for (const prod of productDefs) {
    let product = await prisma.product.findFirst({ where: { name: prod.name } });
    if (!product) {
      product = await prisma.product.create({
        data: {
          name: prod.name,
          unit: prod.unit,
          price: prod.price,
          unitContentAmount: prod.unitContentAmount ?? null,
          unitContentName: prod.unitContentName ?? null,
        },
      });
    } else {
      product = await prisma.product.update({
        where: { id: product.id },
        data: {
          unit: prod.unit,
          price: prod.price,
          unitContentAmount: prod.unitContentAmount ?? null,
          unitContentName: prod.unitContentName ?? null,
        },
      });
    }
    productNameToId[product.name] = product.id;

    if (prod.initialQuantity) {
      await prisma.inventory.create({
        data: {
          productId: product.id,
          quantity: prod.initialQuantity,
          type: 'IN',
          note: 'Initial stock seed',
        },
      });
    }
  }

  const mixProductDefs: Array<{
    name: string;
    description?: string | null;
    price: string; // Decimal as string
    components: Array<{ productName: string; quantityBase: string }>;
  }> = [
    {
      name: 'Paket Infus Dasar',
      description: 'NaCl + Syringe',
      price: '23000',
      components: [
        { productName: 'Infusion NaCl 0.9% 500ml', quantityBase: '1' },
        { productName: 'Syringe 3ml', quantityBase: '1' },
      ],
    },
    {
      name: 'Paket Antibiotik Ringan',
      description: 'Amoxicillin + Vitamin B',
      price: '9000',
      components: [
        { productName: 'Amoxicillin 500mg', quantityBase: '1' },
        { productName: 'Vitamin B Complex', quantityBase: '1' },
      ],
    },
    {
      name: 'Paket Makanan Kucing Hemat',
      description: 'Dry food + wet food',
      price: '135000',
      components: [
        { productName: 'Cat Dry Food 1kg', quantityBase: '1' },
        { productName: 'Cat Wet Food 85g', quantityBase: '2' },
      ],
    },
    {
      name: 'Paket Starter Kucing',
      description: 'Dry food + litter',
      price: '180000',
      components: [
        { productName: 'Cat Dry Food 1kg', quantityBase: '1' },
        { productName: 'Cat Litter 10L', quantityBase: '1' },
      ],
    },
    {
      name: 'Paket Makanan Anjing Hemat',
      description: 'Dog dry food + treats',
      price: '200000',
      components: [
        { productName: 'Dog Dry Food 1.5kg', quantityBase: '1' },
        { productName: 'Cat Treats 60g', quantityBase: '1' },
      ],
    },
  ];

  for (const mix of mixProductDefs) {
    let mixProduct = await prisma.mixProduct.findFirst({ where: { name: mix.name } });
    if (mixProduct) {
      mixProduct = await prisma.mixProduct.update({
        where: { id: mixProduct.id },
        data: { description: mix.description ?? null, price: mix.price },
      });
    } else {
      mixProduct = await prisma.mixProduct.create({
        data: { name: mix.name, description: mix.description ?? null, price: mix.price },
      });
    }

    await prisma.mixComponent.deleteMany({ where: { mixProductId: mixProduct.id } });

    for (const comp of mix.components) {
      const pid = productNameToId[comp.productName];
      if (!pid) {
        // eslint-disable-next-line no-console
        console.warn(`Product not found for mix component: ${comp.productName}`);
        continue;
      }
      await prisma.mixComponent.create({
        data: {
          mixProductId: mixProduct.id,
          productId: pid,
          quantityBase: comp.quantityBase,
        },
      });
    }
  }
}

// Standalone execution support
if (require.main === module) {
  const prisma = new PrismaClient();
  seedProductsAndMix(prisma)
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('Products & Mix seeding completed.');
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


