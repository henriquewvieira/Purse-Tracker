import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import cors from 'cors'
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
const PgSession = connectPgSimple(session)

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())

app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'session',
    createTableIfMissing: true,
  }),
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

app.use('/api/auth', authRoutes)

app.use('/api', requireAuth)
app.use('/api/materials', materialsRoutes)
app.use('/api/purse-types', purseTypesRoutes)
app.use('/api/production-records', productionRecordsRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/export', reportsRoutes)
app.use('/api/settings', settingsRoutes)

// Serve frontend in production (non-Vercel deployments)
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../../frontend/dist')
  app.use(express.static(frontendDist))
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}

app.use(errorHandler)

export default app
