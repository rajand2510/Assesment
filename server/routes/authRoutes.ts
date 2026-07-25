import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { login, register, updatePassword } from '../controllers/authController.js'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { changePasswordSchema, loginSchema, registerSchema } from '../validation/authSchemas.js'

export const authRouter = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts' },
  },
})

authRouter.use(authLimiter)
authRouter.post('/register', validate(registerSchema), asyncHandler(register))
authRouter.post('/login', validate(loginSchema), asyncHandler(login))
authRouter.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(updatePassword),
)
