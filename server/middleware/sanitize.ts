import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../utils/AppError.js'

function containsMongoOperator(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsMongoOperator)
  if (!value || typeof value !== 'object') return false

  return Object.entries(value).some(([key, child]) => (
    key.startsWith('$') || key.includes('.') || containsMongoOperator(child)
  ))
}

export function rejectMongoOperators(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  if (containsMongoOperator(request.body)) {
    next(new AppError('Request contains unsupported field names', 400, 'UNSAFE_INPUT'))
    return
  }
  next()
}
