import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { ZodType } from 'zod'
import { AppError } from '../utils/AppError.js'

type RequestPart = 'body' | 'query' | 'params'

export function validate(schema: ZodType, part: RequestPart = 'body'): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request[part])

    if (!result.success) {
      next(
        new AppError(
          'Request validation failed',
          422,
          'VALIDATION_ERROR',
          result.error.flatten(),
        ),
      )
      return
    }

    Object.assign(request[part], result.data)
    next()
  }
}
