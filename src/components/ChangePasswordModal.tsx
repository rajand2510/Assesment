import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { apiRequest, getErrorMessage } from '../lib/api'
import { validatePassword } from '../lib/validation'
import { AlertBanner } from '../ui/AlertBanner'
import { useToast } from '../ui/toastState'

interface ChangePasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { pushToast } = useToast()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ChangePasswordForm>()
  const newPassword = watch('newPassword')

  const changePassword = useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      apiRequest<{ message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (result) => {
      pushToast({
        tone: 'success',
        title: 'Password updated',
        message: result.message || 'Your password has been changed successfully.',
      })
      onClose()
    },
    onError: (error) => {
      pushToast({
        tone: 'error',
        title: 'Could not update password',
        message: getErrorMessage(error, 'Please check your details and try again.'),
      })
    },
  })

  const fieldError = Object.values(errors)[0]?.message
  const apiError = changePassword.isError
    ? getErrorMessage(changePassword.error, 'Please check your details and try again.')
    : ''

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="investment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button>
        <p className="eyebrow">Security</p>
        <h2 id="change-password-title">Change password</h2>
        <p>Use a strong password with uppercase, lowercase, and a number.</p>

        <form
          onSubmit={handleSubmit((values) =>
            changePassword.mutate({
              currentPassword: values.currentPassword,
              newPassword: values.newPassword,
            }))}
          >
          <label>
            Current password
            <input
              type="password"
              {...register('currentPassword', { required: 'Current password is required' })}
              placeholder="Enter current password"
            />
          </label>
          <label>
            New password
            <input
              type="password"
              {...register('newPassword', { validate: validatePassword })}
              placeholder="At least 8 characters"
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Confirm your new password',
                validate: (value) => value === newPassword || 'Passwords do not match',
              })}
              placeholder="Re-enter new password"
            />
          </label>

          {apiError && <AlertBanner tone="error" title="Request failed" message={apiError} />}
          {!apiError && fieldError && <AlertBanner tone="error" title="Check the form" message={fieldError} />}

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button className="auth-submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
