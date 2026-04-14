import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import connectSqlite3 from 'connect-sqlite3'
import cors from 'cors'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'

import { requireAuth } from './middleware/auth.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import materialsRoutes from './routes/materials.js'
import purseTypesRoutes from './routes/purse-types.js'
import productionRecordsRoutes from './routes/production-records.js'
import reportsRoutes from './routes/reports.js'
import settingsRoutes from './routes/settings.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SQLiteStore = connectSqlite3(session)

const app = express()

// CORS — allow frontend origin (same origin in production, dev server locally)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())

// Sessions stored in SQLite so they survive restarts
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, '../prisma') }),
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}))

// Auth routes are public (no requireAuth)
app.use('/api/auth', authRoutes)

// All other /api routes require auth
app.use('/api', requireAuth)
app.use('/api/materials', materialsRoutes)
app.use('/api/purse-types', purseTypesRoutes)
app.use('/api/production-records', productionRecordsRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/export', reportsRoutes)
// Note: /api/reports/monthly and /api/export/csv are both on reportsRoutes
app.use('/api/settings', settingsRoutes)

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../frontend/dist')
  app.use(express.static(frontendDist))
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
