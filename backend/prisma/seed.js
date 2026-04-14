import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Settings (singleton row)
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      hourly_rate: 15,
      currency: 'USD',
      password_hash: bcrypt.hashSync('admin123', 10),
    },
  })

  // Materials
  const oxford = await prisma.material.create({
    data: { name: 'Oxford Fabric', unit: 'm²', price_per_unit: 6.50, supplier: 'Local Supplier' },
  })
  const leather = await prisma.material.create({
    data: { name: 'Leather Patch', unit: 'pcs', price_per_unit: 2.00, supplier: 'Supplier B' },
  })
  const zipper = await prisma.material.create({
    data: { name: 'Zipper', unit: 'pcs', price_per_unit: 0.90, supplier: 'Supplier C' },
  })

  // Purse type: Mini Tote
  await prisma.purseType.create({
    data: {
      name: 'Mini Tote',
      description: 'A compact tote bag, great for everyday use.',
      purse_materials: {
        create: [
          { material_id: oxford.id, quantity: 0.4 },
          { material_id: leather.id, quantity: 1 },
          { material_id: zipper.id, quantity: 1 },
        ],
      },
    },
  })

  console.log('Seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
