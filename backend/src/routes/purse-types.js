import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = Router()

const includeMaterials = {
  purse_materials: {
    include: { material: true },
  },
}

// GET /api/purse-types
router.get('/', async (req, res, next) => {
  try {
    const types = await prisma.purseType.findMany({
      include: includeMaterials,
      orderBy: { name: 'asc' },
    })
    res.json(types)
  } catch (err) { next(err) }
})

// GET /api/purse-types/:id
router.get('/:id', async (req, res, next) => {
  try {
    const type = await prisma.purseType.findUnique({
      where: { id: Number(req.params.id) },
      include: includeMaterials,
    })
    if (!type) return res.status(404).json({ error: 'Not found' })
    res.json(type)
  } catch (err) { next(err) }
})

// POST /api/purse-types
router.post('/', async (req, res, next) => {
  try {
    const { name, description, image_url, purse_materials = [] } = req.body
    if (!name) return res.status(400).json({ error: 'name is required' })

    const type = await prisma.purseType.create({
      data: {
        name,
        description,
        image_url,
        purse_materials: {
          create: purse_materials.map((pm) => ({
            material_id: Number(pm.material_id),
            quantity: Number(pm.quantity),
          })),
        },
      },
      include: includeMaterials,
    })
    res.status(201).json(type)
  } catch (err) { next(err) }
})

// PUT /api/purse-types/:id
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const { name, description, image_url, purse_materials = [] } = req.body

    const type = await prisma.$transaction(async (tx) => {
      await tx.purseMaterial.deleteMany({ where: { purse_type_id: id } })
      return tx.purseType.update({
        where: { id },
        data: {
          name,
          description,
          image_url,
          purse_materials: {
            create: purse_materials.map((pm) => ({
              material_id: Number(pm.material_id),
              quantity: Number(pm.quantity),
            })),
          },
        },
        include: includeMaterials,
      })
    })
    res.json(type)
  } catch (err) { next(err) }
})

// DELETE /api/purse-types/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const inUse = await prisma.productionRecord.findFirst({ where: { purse_type_id: id } })
    if (inUse) {
      return res.status(409).json({ error: 'Cannot delete: purse type has production records' })
    }
    await prisma.purseType.delete({ where: { id } })
    res.status(204).send()
  } catch (err) { next(err) }
})

export default router
