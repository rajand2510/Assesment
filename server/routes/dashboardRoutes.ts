import { Router } from 'express'
import { history, summary } from '../controllers/dashboardController.js'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { paginationSchema } from '../validation/investmentSchemas.js'

export const dashboardRouter = Router()

dashboardRouter.use(authenticate)
dashboardRouter.get('/summary', asyncHandler(summary))
dashboardRouter.get('/history', validate(paginationSchema, 'query'), asyncHandler(history))
