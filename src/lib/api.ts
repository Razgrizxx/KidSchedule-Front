const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3000/api/v1'

interface ApiError {
  message: string | string[]
  statusCode: number
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const data: T | ApiError = await res.json()

  if (!res.ok) {
    const err = data as ApiError
    const msg = Array.isArray(err.message) ? err.message[0] : err.message
    throw new Error(msg || 'Something went wrong')
  }

  return data as T
}

export function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) }, token)
}
