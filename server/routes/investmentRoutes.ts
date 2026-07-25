import { Router } from 'express'
import { create, list } from '../controllers/investmentController.js'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { createInvestmentSchema, paginationSchema } from '../validation/investmentSchemas.js'

export const investmentRouter = Router()

investmentRouter.use(authenticate)
investmentRouter.post('/', validate(createInvestmentSchema), asyncHandler(create))
investmentRouter.get('/', validate(paginationSchema, 'query'), asyncHandler(list))
