/**
 * Extracts a human-readable message from any thrown value.
 *
 * Backend always returns: { statusCode, message: string | string[] }
 */
export function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    // Axios error → err.response.data.message
    const axiosErr = err as Record<string, unknown>
    const response = axiosErr.response as Record<string, unknown> | undefined
    const data = response?.data as Record<string, unknown> | undefined

    if (data?.message) {
      const msg = data.message
      if (Array.isArray(msg)) return msg[0] as string
      if (typeof msg === 'string') return msg
      // Nested object (old filter shape) — extract inner message
      if (typeof msg === 'object') {
        const inner = (msg as Record<string, unknown>).message
        if (Array.isArray(inner)) return inner[0] as string
        if (typeof inner === 'string') return inner
      }
    }

    // err.message is normalized by the axios interceptor to the backend message
    if (err instanceof Error && err.message) return err.message
  }

  if (typeof err === 'string' && err) return err
  return 'Ocurrió un error inesperado'
}
