import type { Request, Response } from 'express'
import { createInvestment, listUserInvestments } from '../services/investmentService.js'

export async function create(request: Request, response: Response): Promise<void> {
  const investment = await createInvestment({
    userId: request.userId!,
    ...request.body,
  })
  response.status(201).json({ success: true, data: investment })
}

export async function list(request: Request, response: Response): Promise<void> {
  const { page, limit } = request.query as unknown as { page: number; limit: number }
  const result = await listUserInvestments(request.userId!, page, limit)
  response.json({ success: true, data: result })
}
