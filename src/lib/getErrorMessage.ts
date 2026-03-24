/**
 * Extracts a human-readable message from any thrown value.
 *
 * Priority:
 *  1. NestJS/backend error in axios response  → response.data.message
 *  2. Standard Error                           → error.message
 *  3. Plain string
 *  4. Fallback
 */
export function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    // Axios error: { response: { data: { message: string | string[] } } }
    const response = (err as Record<string, unknown>).response
    if (response && typeof response === 'object') {
      const data = (response as Record<string, unknown>).data
      if (data && typeof data === 'object') {
        const msg = (data as Record<string, unknown>).message
        if (Array.isArray(msg)) return msg[0] as string
        if (typeof msg === 'string' && msg) return msg
      }
    }
    // Standard Error
    if (err instanceof Error && err.message) return err.message
  }
  if (typeof err === 'string' && err) return err
  return 'Ocurrió un error inesperado'
}
