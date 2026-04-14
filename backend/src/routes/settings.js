import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const router = Router()

function stripHash(settings) {
  if (!settings) return settings
  const { password_hash, ...rest } = settings
  return rest
}

// GET /api/settings
router.get('/', async (req, res, next) => {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } })
    res.json(stripHash(settings))
  } catch (err) { next(err) }
})

// PUT /api/settings
router.put('/', async (req, res, next) => {
  try {
    const { hourly_rate, currency, new_password } = req.body
    const updateData = {}
    if (hourly_rate != null) updateData.hourly_rate = Number(hourly_rate)
    if (currency) updateData.currency = currency
    if (new_password) updateData.password_hash = await bcrypt.hash(new_password, 10)

    const settings = await prisma.settings.update({
      where: { id: 1 },
      data: updateData,
    })
    res.json(stripHash(settings))
  } catch (err) { next(err) }
})

export default router
