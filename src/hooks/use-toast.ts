import { useState, useCallback } from 'react'

export type ToastVariant = 'default' | 'success' | 'error'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

let toastQueue: ((toast: Toast) => void)[] = []

export function toast(options: Omit<Toast, 'id'>) {
  const newToast: Toast = { id: Date.now().toString(), ...options }
  toastQueue.forEach((fn) => fn(newToast))
}

export function useToastState() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const register = useCallback((fn: (t: Toast) => void) => {
    toastQueue.push(fn)
    return () => {
      toastQueue = toastQueue.filter((f) => f !== fn)
    }
  }, [])

  const addToast = useCallback((t: Toast) => {
    setToasts((prev) => [...prev, t])
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id))
    }, 4000)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, register, addToast, dismiss }
}
