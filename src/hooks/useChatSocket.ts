import { useEffect, useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket } from '@/socket'
import type { Message } from '@/types/api'

interface MessagesCache {
  messages: Message[]
  nextCursor: string | null
}

/**
 * Joins the family socket room and keeps the messages query cache
 * up-to-date in real-time. No polling required.
 */
export function useChatSocket(familyId: string | undefined) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!familyId) return

    const socket = getSocket()

    // Join room — handle both "already connected" and "connecting" cases
    function joinRoom() {
      socket.emit('join_family', familyId)
    }
    if (socket.connected) {
      joinRoom()
    } else {
      socket.once('connect', joinRoom)
    }

    function onNewMessage(message: Message) {
      qc.setQueryData<MessagesCache>(['messages', familyId], (old) => {
        if (!old) return { messages: [message], nextCursor: null }
        // Deduplicate — may already be in cache from HTTP response
        if (old.messages.some((m) => m.id === message.id)) return old
        return { ...old, messages: [...old.messages, message] }
      })
    }

    socket.on('new_message', onNewMessage)

    return () => {
      socket.off('connect', joinRoom)
      socket.off('new_message', onNewMessage)
    }
  }, [familyId, qc])
}

/**
 * Typing indicator — returns who is currently typing and helpers
 * to notify others when the current user starts/stops typing.
 */
export function useTypingIndicator(familyId: string | undefined) {
  const [typingUserId, setTypingUserId] = useState<string | null>(null)
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTyping = useRef(false)

  useEffect(() => {
    if (!familyId) return

    const socket = getSocket()

    function onTyping({ userId }: { userId: string }) {
      setTypingUserId(userId)
    }
    function onStopTyping() {
      setTypingUserId(null)
    }

    socket.on('user_typing', onTyping)
    socket.on('user_stop_typing', onStopTyping)

    return () => {
      socket.off('user_typing', onTyping)
      socket.off('user_stop_typing', onStopTyping)
    }
  }, [familyId])

  const sendTyping = useCallback(() => {
    if (!familyId) return
    const socket = getSocket()

    if (!isTyping.current) {
      isTyping.current = true
      socket.emit('typing', familyId)
    }

    // Auto stop after 3 s of no keystrokes
    if (stopTimer.current) clearTimeout(stopTimer.current)
    stopTimer.current = setTimeout(() => {
      isTyping.current = false
      socket.emit('stop_typing', familyId)
    }, 3000)
  }, [familyId])

  const sendStopTyping = useCallback(() => {
    if (!familyId) return
    if (stopTimer.current) clearTimeout(stopTimer.current)
    isTyping.current = false
    getSocket().emit('stop_typing', familyId)
  }, [familyId])

  return { typingUserId, sendTyping, sendStopTyping }
}
