import 'dotenv/config'
import express from 'express'
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

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())

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
