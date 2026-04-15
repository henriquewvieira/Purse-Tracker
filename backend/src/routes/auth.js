import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()

const secret = () => process.env.SESSION_SECRET || 'dev-secret'

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { password } = req.body
    if (!password) return res.status(400).json({ error: 'Password required' })

    let settings = await prisma.settings.findUnique({ where: { id: 1 } })
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 1,
          hourly_rate: 15,
          currency: 'USD',
          password_hash: await bcrypt.hash('admin123', 10),
        },
      })
    }

    const match = await bcrypt.compare(password, settings.password_hash)
    if (!match) return res.status(401).json({ error: 'Incorrect password' })

    const token = jwt.sign({ authenticated: true }, secret(), { expiresIn: '7d' })
    res.json({ ok: true, token })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ ok: true })
})

// GET /api/auth/me
router.get('/me', (req, res) => {
  const ok = verifyToken(req.headers.authorization)
  res.status(ok ? 200 : 401).json({ authenticated: ok })
})

export default router
