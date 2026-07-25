import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { ToastContext, type ToastItem, type ToastTone } from './toastState'

const icons: Record<ToastTone, typeof Info> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current.slice(-3), { ...toast, id }])
    window.setTimeout(() => dismissToast(id), toast.tone === 'error' ? 6000 : 4000)
  }, [dismissToast])

  const value = useMemo(() => ({ pushToast, dismissToast }), [pushToast, dismissToast])

  return (
    <ToastContext value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => {
          const Icon = icons[toast.tone]
          return (
            <article className={`toast toast-${toast.tone}`} key={toast.id} role="status">
              <Icon size={18} aria-hidden="true" />
              <div>
                <strong>{toast.title}</strong>
                {toast.message && <p>{toast.message}</p>}
              </div>
              <button type="button" aria-label="Dismiss" onClick={() => dismissToast(toast.id)}>
                <X size={16} />
              </button>
            </article>
          )
        })}
      </div>
    </ToastContext>
  )
}
