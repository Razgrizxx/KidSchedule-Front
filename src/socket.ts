import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/authStore'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const token = useAuthStore.getState().token
    const apiUrl = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3000/api/v1'
    const socketBase = apiUrl.replace(/\/api\/v\d+$/, '')
    socket = io(`${socketBase}/chat`, {
      auth: { token },
      path: '/api/v1/socket.io',
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    })
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/** Re-authenticate after token changes (e.g. login) */
export function reconnectSocket() {
  disconnectSocket()
  return getSocket()
}
