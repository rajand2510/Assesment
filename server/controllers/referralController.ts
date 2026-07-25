import type { Request, Response } from 'express'
import { getDirectReferrals, getReferralTree } from '../services/referralService.js'

export async function direct(request: Request, response: Response): Promise<void> {
  const data = await getDirectReferrals(request.userId!)
  response.json({ success: true, data })
}

export async function tree(request: Request, response: Response): Promise<void> {
  const data = await getReferralTree(request.userId!)
  response.json({ success: true, data })
}
