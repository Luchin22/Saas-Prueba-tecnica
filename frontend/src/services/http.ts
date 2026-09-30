import type { ApiErrorBody } from '@/types/api'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1'

let authToken: string | null = null

export function setAuthToken(token: string | null): void {
  authToken = token
}

export class ApiError extends Error {
  readonly statusCode: number
  readonly body: ApiErrorBody

  constructor(body: ApiErrorBody) {
    super(Array.isArray(body.message) ? body.message.join(', ') : body.message)
    this.name = 'ApiError'
    this.statusCode = body.statusCode
    this.body = body
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiErrorBody | null
    throw new ApiError(
      errorBody ?? {
        statusCode: response.status,
        message: response.statusText,
        error: 'Error',
        timestamp: new Date().toISOString(),
        path,
      },
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
