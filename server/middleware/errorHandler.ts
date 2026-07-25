import type { ErrorRequestHandler } from 'express'
import mongoose from 'mongoose'
import { ZodError } from 'zod'
import { getEnv } from '../config/env.js'
import { AppError } from '../utils/AppError.js'

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  let normalizedError = error

  if (error instanceof mongoose.Error.CastError) {
    normalizedError = new AppError('The requested resource was not found', 404, 'NOT_FOUND')
  } else if (error instanceof ZodError) {
    normalizedError = new AppError('Configuration is invalid', 500, 'CONFIG_ERROR')
  } else if (error?.code === 11000) {
    normalizedError = new AppError('A record with these details already exists', 409, 'DUPLICATE')
  }

  const appError =
    normalizedError instanceof AppError
      ? normalizedError
      : new AppError('An unexpected error occurred')

  response.status(appError.statusCode).json({
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details,
      ...(getEnv().NODE_ENV === 'development' && { stack: normalizedError?.stack }),
    },
  })
}
