import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { apiRequest, getErrorMessage } from '../lib/api'
import {
  validateDailyRoiPercentage,
  validateDurationDays,
  validateInvestmentAmount,
  validatePlanName,
} from '../lib/validation'
import { AlertBanner } from '../ui/AlertBanner'
import { useToast } from '../ui/toastState'

interface InvestmentForm {
  amount: number
  planName: string
  durationDays: number
  dailyRoiPercentage: number
}

export function InvestmentModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const { pushToast } = useToast()
  const { register, handleSubmit, formState: { errors } } = useForm<InvestmentForm>({
    defaultValues: { planName: 'Growth Plan', durationDays: 180, dailyRoiPercentage: 1 },
  })
  const createInvestment = useMutation({
    mutationFn: (input: InvestmentForm) => apiRequest('/api/investments', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['investments'] }),
      ])
      pushToast({
        tone: 'success',
        title: 'Investment created',
        message: 'Your plan is active and daily ROI will start after activation.',
      })
      onClose()
    },
    onError: (error) => {
      pushToast({
        tone: 'error',
        title: 'Could not create investment',
        message: getErrorMessage(error, 'Please check the investment details and try again.'),
      })
    },
  })

  const fieldError = Object.values(errors)[0]
  const apiError = createInvestment.isError
    ? getErrorMessage(createInvestment.error, 'Please check the investment details.')
    : ''

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="investment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="investment-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button>
        <p className="eyebrow">Grow your portfolio</p>
        <h2 id="investment-title">New investment</h2>
        <p>Daily ROI starts after activation.</p>
        <form
          noValidate
          onSubmit={handleSubmit((values) => createInvestment.mutate({
            amount: Number(values.amount),
            planName: values.planName.trim(),
            durationDays: Number(values.durationDays),
            dailyRoiPercentage: Number(values.dailyRoiPercentage),
          }))}
        >
          <label>
            Amount (₹)
            <input
              type="number"
              {...register('amount', { valueAsNumber: true, validate: validateInvestmentAmount })}
              placeholder="10000"
            />
          </label>
          <label>
            Plan
            <input
              {...register('planName', { validate: validatePlanName })}
              placeholder="Growth Plan"
            />
          </label>
          <div className="form-row">
            <label>
              Duration (days)
              <input
                type="number"
                {...register('durationDays', { valueAsNumber: true, validate: validateDurationDays })}
              />
            </label>
            <label>
              Daily ROI (%)
              <input
                type="number"
                step="0.01"
                {...register('dailyRoiPercentage', { valueAsNumber: true, validate: validateDailyRoiPercentage })}
              />
            </label>
          </div>

          {apiError && <AlertBanner tone="error" title="Request failed" message={apiError} />}
          {!apiError && fieldError && (
            <AlertBanner tone="error" title="Check the form" message={String(fieldError.message ?? 'Please check the investment details.')} />
          )}

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button className="auth-submit" disabled={createInvestment.isPending}>
              {createInvestment.isPending ? 'Creating…' : 'Invest now'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
