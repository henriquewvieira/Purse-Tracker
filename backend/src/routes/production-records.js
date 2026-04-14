import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { computeCosts } from '../lib/computeCosts.js'

const prisma = new PrismaClient()
const router = Router()

// GET /api/production-records
router.get('/', async (req, res, next) => {
  try {
    const records = await prisma.productionRecord.findMany({
      include: { purse_type: true },
      orderBy: { date_produced: 'desc' },
    })
    res.json(records.map(deserializeOverrides))
  } catch (err) { next(err) }
})

// GET /api/production-records/:id
router.get('/:id', async (req, res, next) => {
  try {
    const record = await prisma.productionRecord.findUnique({
      where: { id: Number(req.params.id) },
      include: { purse_type: { include: { purse_materials: { include: { material: true } } } } },
    })
    if (!record) return res.status(404).json({ error: 'Not found' })
    res.json(deserializeOverrides(record))
  } catch (err) { next(err) }
})

// POST /api/production-records
router.post('/', async (req, res, next) => {
  try {
    const {
      purse_type_id,
      date_produced,
      quantity,
      sale_price_per_unit,
      labor_minutes = 0,
      other_costs = 0,
      material_overrides = {},
      notes,
    } = req.body

    if (!purse_type_id || !date_produced || !quantity) {
      return res.status(400).json({ error: 'purse_type_id, date_produced, and quantity are required' })
    }

    // Fetch all required data
    const purseType = await prisma.purseType.findUnique({
      where: { id: Number(purse_type_id) },
      include: { purse_materials: true },
    })
    if (!purseType) return res.status(404).json({ error: 'Purse type not found' })

    const materialIds = purseType.purse_materials.map((pm) => pm.material_id)
    const materialList = await prisma.material.findMany({ where: { id: { in: materialIds } } })
    const materialsMap = Object.fromEntries(materialList.map((m) => [m.id, m]))

    const settings = await prisma.settings.findUnique({ where: { id: 1 } })

    const productionInput = {
      quantity: Number(quantity),
      labor_minutes: Number(labor_minutes),
      other_costs: Number(other_costs),
      sale_price_per_unit: sale_price_per_unit != null ? Number(sale_price_per_unit) : null,
      material_overrides,
    }

    const { cost_per_unit, total_cost, revenue, profit } = computeCosts(
      purseType, materialsMap, productionInput, settings
    )

    const record = await prisma.productionRecord.create({
      data: {
        purse_type_id: Number(purse_type_id),
        date_produced: new Date(date_produced),
        quantity: Number(quantity),
        sale_price_per_unit: productionInput.sale_price_per_unit,
        labor_minutes: productionInput.labor_minutes,
        other_costs: productionInput.other_costs,
        material_overrides: JSON.stringify(material_overrides),
        computed_cost_per_unit: cost_per_unit,
        computed_total_cost: total_cost,
        computed_revenue: revenue,
        computed_profit: profit,
        notes,
      },
      include: { purse_type: true },
    })

    res.status(201).json(deserializeOverrides(record))
  } catch (err) { next(err) }
})

function deserializeOverrides(record) {
  return {
    ...record,
    material_overrides: typeof record.material_overrides === 'string'
      ? JSON.parse(record.material_overrides)
      : record.material_overrides,
  }
}

export default router
