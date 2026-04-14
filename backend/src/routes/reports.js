import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = Router()

function getDateRange(year, month) {
  const y = Number(year)
  const m = Number(month)
  const start = new Date(Date.UTC(y, m - 1, 1))
  const end = new Date(Date.UTC(y, m, 1))
  return { start, end }
}

// GET /api/reports/monthly?year=YYYY&month=MM
router.get('/monthly', async (req, res, next) => {
  try {
    const { year, month } = req.query
    if (!year || !month) return res.status(400).json({ error: 'year and month required' })

    const { start, end } = getDateRange(year, month)
    const records = await prisma.productionRecord.findMany({
      where: { date_produced: { gte: start, lt: end } },
      include: { purse_type: true },
      orderBy: { date_produced: 'asc' },
    })

    // Summary
    const summary = records.reduce(
      (acc, r) => {
        acc.total_revenue += r.computed_revenue
        acc.total_cost += r.computed_total_cost
        acc.total_profit += r.computed_profit
        acc.records_count += 1
        acc.total_quantity += r.quantity
        return acc
      },
      { total_revenue: 0, total_cost: 0, total_profit: 0, records_count: 0, total_quantity: 0 }
    )
    summary.profit_margin = summary.total_revenue > 0
      ? (summary.total_profit / summary.total_revenue) * 100
      : 0

    // Breakdown by purse type
    const byPurseType = {}
    for (const r of records) {
      const key = r.purse_type_id
      if (!byPurseType[key]) {
        byPurseType[key] = {
          purse_type_id: r.purse_type_id,
          name: r.purse_type.name,
          quantity: 0,
          revenue: 0,
          total_cost: 0,
          profit: 0,
        }
      }
      byPurseType[key].quantity += r.quantity
      byPurseType[key].revenue += r.computed_revenue
      byPurseType[key].total_cost += r.computed_total_cost
      byPurseType[key].profit += r.computed_profit
    }

    res.json({
      year: Number(year),
      month: Number(month),
      summary,
      by_purse_type: Object.values(byPurseType),
      records,
    })
  } catch (err) { next(err) }
})

// GET /api/export/csv?year=YYYY&month=MM
router.get('/csv', async (req, res, next) => {
  try {
    const { year, month } = req.query
    if (!year || !month) return res.status(400).json({ error: 'year and month required' })

    const { start, end } = getDateRange(year, month)
    const records = await prisma.productionRecord.findMany({
      where: { date_produced: { gte: start, lt: end } },
      include: { purse_type: true },
      orderBy: { date_produced: 'asc' },
    })

    const headers = [
      'id', 'date', 'purse_type', 'quantity', 'sale_price_per_unit',
      'labor_minutes', 'other_costs', 'cost_per_unit', 'total_cost',
      'revenue', 'profit', 'notes',
    ]

    const rows = records.map((r) => [
      r.id,
      r.date_produced.toISOString().split('T')[0],
      `"${r.purse_type.name}"`,
      r.quantity,
      r.sale_price_per_unit ?? '',
      r.labor_minutes,
      r.other_costs,
      r.computed_cost_per_unit.toFixed(2),
      r.computed_total_cost.toFixed(2),
      r.computed_revenue.toFixed(2),
      r.computed_profit.toFixed(2),
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="report-${year}-${String(month).padStart(2, '0')}.csv"`)
    res.send(csv)
  } catch (err) { next(err) }
})

export default router
