import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { connectDatabase } from './config/database.js'
import { getEnv } from './config/env.js'
import { mountSwagger } from './docs/swagger.js'
import { errorHandler } from './middleware/errorHandler.js'
import { rejectMongoOperators } from './middleware/sanitize.js'
import { authRouter } from './routes/authRoutes.js'
import { cronRouter } from './routes/cronRoutes.js'
import { dashboardRouter } from './routes/dashboardRoutes.js'
import { investmentRouter } from './routes/investmentRoutes.js'
import { referralRouter } from './routes/referralRoutes.js'
import { AppError } from './utils/AppError.js'
import { asyncHandler } from './utils/asyncHandler.js'

export const app = express()

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
        connectSrc: ["'self'"],
      },
    },
  }),
)
app.use(cors({ origin: getEnv().CLIENT_ORIGIN, credentials: false }))
app.use(express.json({ limit: '20kb' }))
app.use(rejectMongoOperators)

app.get('/api/health', (_request, response) => {
  response.json({ success: true, data: { status: 'ok' } })
})

// Docs before DB middleware so Swagger stays available even if Mongo is down
mountSwagger(app)

app.use(
  '/api',
  asyncHandler(async (_request, _response, next) => {
    // Skip DB connect for static docs assets already handled above
    if (_request.path.startsWith('/docs')) {
      next()
      return
    }
    await connectDatabase()
    next()
  }),
)
app.use('/api/auth', authRouter)
app.use('/api/investments', investmentRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/referrals', referralRouter)
app.use('/api/cron', cronRouter)

app.use((_request, _response, next) => {
  next(new AppError('Route was not found', 404, 'ROUTE_NOT_FOUND'))
})
app.use(errorHandler)
