import type { Request, Response } from 'express'
import { getEnv } from '../config/env.js'
import { processDailyRoi } from '../services/roiService.js'
import { AppError } from '../utils/AppError.js'

export async function runDailyRoi(request: Request, response: Response): Promise<void> {
  if (request.headers.authorization !== `Bearer ${getEnv().CRON_SECRET}`) {
    throw new AppError('Cron authorization failed', 401, 'INVALID_CRON_SECRET')
  }

  const result = await processDailyRoi()
  response.json({ success: true, data: result })
}
