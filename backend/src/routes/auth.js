import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = Router()

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { password } = req.body
    if (!password) return res.status(400).json({ error: 'Password required' })

    const settings = await prisma.settings.findUnique({ where: { id: 1 } })
    if (!settings) return res.status(500).json({ error: 'App not configured' })

    const match = await bcrypt.compare(password, settings.password_hash)
    if (!match) return res.status(401).json({ error: 'Incorrect password' })

    req.session.authenticated = true
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/logout
router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err)
    res.clearCookie('connect.sid')
    res.json({ ok: true })
  })
})

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (req.session?.authenticated) {
    return res.json({ authenticated: true })
  }
  res.status(401).json({ authenticated: false })
})

export default router
