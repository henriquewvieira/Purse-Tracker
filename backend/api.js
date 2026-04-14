import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import cors from 'cors'

import { requireAuth } from './src/middleware/auth.js'
import { errorHandler } from './src/middleware/errorHandler.js'
import authRoutes from './src/routes/auth.js'
import materialsRoutes from './src/routes/materials.js'
import purseTypesRoutes from './src/routes/purse-types.js'
import productionRecordsRoutes from './src/routes/production-records.js'
import reportsRoutes from './src/routes/reports.js'
import settingsRoutes from './src/routes/settings.js'

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

app.use(errorHandler)

export default app
