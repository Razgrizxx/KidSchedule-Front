import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/authStore'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const token = useAuthStore.getState().token
    console.log('[socket] creating, token present:', !!token)
    socket = io('http://localhost:3000/chat', {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    })
    socket.on('connect', () => console.log('[socket] connected:', socket?.id))
    socket.on('disconnect', (r) => console.log('[socket] disconnected:', r))
    socket.on('connect_error', (e) => console.log('[socket] connect_error:', e.message))
    socket.onAny((event, ...args) => console.log('[socket] event:', event, args))
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
