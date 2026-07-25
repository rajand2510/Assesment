import { z } from 'zod'

export const createInvestmentSchema = z.object({
  amount: z.number().min(1000).max(10_000_000),
  planName: z.string().trim().min(2).max(80),
  durationDays: z.number().int().min(30).max(1095),
  dailyRoiPercentage: z.number().min(0.01).max(10),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
