import type { Request, Response } from 'express'
import { changePassword, loginUser, registerUser } from '../services/authService.js'

export async function register(request: Request, response: Response): Promise<void> {
  const result = await registerUser(request.body)
  response.status(201).json({ success: true, data: result })
}

export async function login(request: Request, response: Response): Promise<void> {
  const result = await loginUser(request.body)
  response.json({ success: true, data: result })
}

export async function updatePassword(request: Request, response: Response): Promise<void> {
  const result = await changePassword(request.userId!, request.body)
  response.json({ success: true, data: result })
}
