import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = Router()

const secret = () => process.env.SESSION_SECRET || 'dev-secret'

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { password } = req.body
    if (!password) return res.status(400).json({ error: 'Password required' })

    const settings = await prisma.settings.findUnique({ where: { id: 1 } })
    if (!settings) return res.status(500).json({ error: 'App not configured' })

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
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ authenticated: false })
  try {
    jwt.verify(auth.slice(7), secret())
    res.json({ authenticated: true })
  } catch {
    res.status(401).json({ authenticated: false })
  }
})

export default router
