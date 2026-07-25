import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'

interface AlertBannerProps {
  tone: 'error' | 'success' | 'info'
  title: string
  message?: string
  onRetry?: () => void
}

export function AlertBanner({ tone, title, message, onRetry }: AlertBannerProps) {
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle

  return (
    <div className={`alert-banner alert-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon size={18} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        {message && <p>{message}</p>}
      </div>
      {onRetry && (
        <button type="button" className="secondary-button alert-retry" onClick={onRetry}>
          <RefreshCw size={15} /> Try again
        </button>
      )}
    </div>
  )
}
