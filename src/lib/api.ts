const TOKEN_KEY = 'nexavest_access_token'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  error?: {
    message: string
    code?: string
    details?: {
      formErrors?: string[]
      fieldErrors?: Record<string, string[] | undefined>
    }
  }
}

function formatApiErrorMessage(error?: ApiEnvelope<unknown>['error'], fallback = 'Request failed') {
  if (!error) return fallback

  const fieldErrors = error.details?.fieldErrors
  if (fieldErrors) {
    const firstFieldMessage = Object.values(fieldErrors).flat().find(Boolean)
    if (firstFieldMessage) return firstFieldMessage
  }

  const formError = error.details?.formErrors?.find(Boolean)
  if (formError) return formError

  return error.message || fallback
}

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status = 500, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (error instanceof ApiError || error instanceof Error) return error.message
  return fallback
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken()

  let response: Response
  try {
    response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    })
  } catch {
    throw new ApiError('Unable to reach the server. Check your connection and try again.', 0, 'NETWORK')
  }

  let payload: ApiEnvelope<T> | null = null
  try {
    payload = (await response.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiError(
      response.ok ? 'Received an invalid response from the server.' : `Request failed (${response.status}).`,
      response.status,
      'INVALID_RESPONSE',
    )
  }

  if (!response.ok || payload.success === false) {
    if (response.status === 401) clearAccessToken()
    throw new ApiError(
      formatApiErrorMessage(payload.error),
      response.status,
      payload.error?.code,
    )
  }

  return payload.data
}
