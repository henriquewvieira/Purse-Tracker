import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = Router()

// GET /api/materials
router.get('/', async (req, res, next) => {
  try {
    const materials = await prisma.material.findMany({ orderBy: { name: 'asc' } })
    res.json(materials)
  } catch (err) { next(err) }
})

// POST /api/materials
router.post('/', async (req, res, next) => {
  try {
    const { name, unit, price_per_unit, supplier, notes } = req.body
    if (!name || !unit || price_per_unit == null) {
      return res.status(400).json({ error: 'name, unit, and price_per_unit are required' })
    }
    const material = await prisma.material.create({
      data: { name, unit, price_per_unit: Number(price_per_unit), supplier, notes },
    })
    res.status(201).json(material)
  } catch (err) { next(err) }
})

// PUT /api/materials/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, unit, price_per_unit, supplier, notes } = req.body
    const material = await prisma.material.update({
      where: { id: Number(req.params.id) },
      data: { name, unit, price_per_unit: price_per_unit != null ? Number(price_per_unit) : undefined, supplier, notes },
    })
    res.json(material)
  } catch (err) { next(err) }
})

// DELETE /api/materials/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const inUse = await prisma.purseMaterial.findFirst({ where: { material_id: id } })
    if (inUse) {
      return res.status(409).json({ error: 'Cannot delete: material is used by one or more purse types' })
    }
    await prisma.material.delete({ where: { id } })
    res.status(204).send()
  } catch (err) { next(err) }
})

export default router
