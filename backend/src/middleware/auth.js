import jwt from 'jsonwebtoken'

const secret = () => process.env.SESSION_SECRET || 'dev-secret'

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  try {
    jwt.verify(auth.slice(7), secret())
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}
