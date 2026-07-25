import { z } from 'zod'

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CRON_SECRET: z.string().min(24, 'CRON_SECRET must contain at least 24 characters'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
})

export type AppEnv = z.infer<typeof envSchema>

let cachedEnv: AppEnv | undefined

export function getEnv(): AppEnv {
  cachedEnv ??= envSchema.parse(process.env)
  return cachedEnv
}
