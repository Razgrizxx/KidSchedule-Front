import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, X } from 'lucide-react'
import { useToastState } from '@/hooks/use-toast'
import type { Toast } from '@/hooks/use-toast'

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: (id: string) => void
}) {
  const isError = toast.variant === 'error'
  const isSuccess = toast.variant === 'success'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 w-80 rounded-2xl border px-4 py-3 shadow-lg bg-white ${
        isError
          ? 'border-red-100'
          : isSuccess
            ? 'border-teal-100'
            : 'border-slate-100'
      }`}
    >
      {isSuccess && <CheckCircle className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />}
      {isError && <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-slate-500 mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

export function Toaster() {
  const { toasts, register, addToast, dismiss } = useToastState()

  useEffect(() => {
    const unregister = register(addToast)
    return unregister
  }, [register, addToast])

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}
