import jwt from 'jsonwebtoken'

const secret = () => process.env.SESSION_SECRET || 'dev-secret'

export function verifyToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return false
  try {
    jwt.verify(authHeader.slice(7), secret())
    return true
  } catch {
    return false
  }
}

export function requireAuth(req, res, next) {
  if (!verifyToken(req.headers.authorization)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}
