import type { Request, Response } from 'express'
import { getDashboardSummary, getEarningHistory } from '../services/dashboardService.js'

export async function summary(request: Request, response: Response): Promise<void> {
  const data = await getDashboardSummary(request.userId!)
  response.json({ success: true, data })
}

export async function history(request: Request, response: Response): Promise<void> {
  const { page, limit } = request.query as unknown as { page: number; limit: number }
  const data = await getEarningHistory(request.userId!, page, limit)
  response.json({ success: true, data })
}
