import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/\d/, 'Password must include a number')

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.email().transform((value) => value.toLowerCase()),
  mobileNumber: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/),
  password: passwordSchema,
  referralCode: z
    .string()
    .trim()
    .toUpperCase()
    .transform((value) => (value.length === 0 ? undefined : value))
    .pipe(z.string().min(5).max(20).optional()),
})

export const loginSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
}).refine((value) => value.currentPassword !== value.newPassword, {
  message: 'New password must be different from the current password',
  path: ['newPassword'],
})
