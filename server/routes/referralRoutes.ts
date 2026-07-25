import { Router } from 'express'
import { direct, tree } from '../controllers/referralController.js'
import { authenticate } from '../middleware/authenticate.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const referralRouter = Router()

referralRouter.use(authenticate)
referralRouter.get('/direct', asyncHandler(direct))
referralRouter.get('/tree', asyncHandler(tree))
