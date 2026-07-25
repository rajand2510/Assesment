import { Router } from 'express'
import { runDailyRoi } from '../controllers/cronController.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const cronRouter = Router()

cronRouter.get('/daily-roi', asyncHandler(runDailyRoi))
