import mongoose from 'mongoose'
import { getEnv } from './env.js'

interface ConnectionCache {
  connection: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

const globalWithMongoose = globalThis as typeof globalThis & {
  mongooseCache?: ConnectionCache
}

const cache = globalWithMongoose.mongooseCache ?? {
  connection: null,
  promise: null,
}

globalWithMongoose.mongooseCache = cache

export async function connectDatabase(): Promise<typeof mongoose> {
  if (cache.connection) {
    return cache.connection
  }

  cache.promise ??= mongoose.connect(getEnv().MONGODB_URI, {
    bufferCommands: false,
    maxPoolSize: 10,
  })

  cache.connection = await cache.promise
  return cache.connection
}
