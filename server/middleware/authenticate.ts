import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { getEnv } from '../config/env.js'
import { AppError } from '../utils/AppError.js'

interface AccessTokenPayload extends jwt.JwtPayload {
  sub: string
}

export function authenticate(request: Request, _response: Response, next: NextFunction): void {
  const authorization = request.headers.authorization

  if (!authorization?.startsWith('Bearer ')) {
    next(new AppError('Authentication is required', 401, 'AUTH_REQUIRED'))
    return
  }

  try {
    const token = authorization.slice('Bearer '.length)
    const payload = jwt.verify(token, getEnv().JWT_SECRET) as AccessTokenPayload
    request.userId = payload.sub
    next()
  } catch {
    next(new AppError('Authentication token is invalid or expired', 401, 'INVALID_TOKEN'))
  }
}
