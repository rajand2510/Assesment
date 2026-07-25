import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../auth/authState'
import { getErrorMessage } from '../lib/api'
import {
  validateEmail,
  validateFullName,
  validateLoginPassword,
  validateMobileNumber,
  validatePassword,
  validateReferralCode,
} from '../lib/validation'
import { AlertBanner } from '../ui/AlertBanner'
import { useToast } from '../ui/toastState'

interface AuthForm {
  fullName: string
  email: string
  mobileNumber: string
  password: string
  referralCode: string
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isLogin = mode === 'login'
  const auth = useAuth()
  const { pushToast } = useToast()
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AuthForm>()

  async function submit(values: AuthForm) {
    setServerError('')
    try {
      if (isLogin) await auth.login(values.email.trim(), values.password)
      else {
        await auth.register({
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          mobileNumber: values.mobileNumber.trim(),
          password: values.password,
          referralCode: values.referralCode.trim() || undefined,
        })
      }
      pushToast({
        tone: 'success',
        title: isLogin ? 'Welcome back' : 'Account created',
        message: isLogin ? 'You are signed in to your portfolio.' : 'Your NexaVest account is ready.',
      })
      window.history.replaceState({}, '', '/')
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to continue')
      setServerError(message)
      pushToast({
        tone: 'error',
        title: isLogin ? 'Sign in failed' : 'Registration failed',
        message,
      })
    }
  }

  const fieldError = Object.values(errors)[0]?.message

  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="brand">
          <span className="brand-mark">N</span>
          <div className="brand-copy">
            <strong>NexaVest</strong>
            <small>Investment desk</small>
          </div>
        </div>
        <div className="auth-story-body">
          <h1>Capital that compounds.<br />Network that pays.</h1>
          <p>
            Daily ROI, three-level referral income, and a clear view of every rupee —
            built for operators who want clarity over clutter.
          </p>
          <ul className="auth-points">
            <li>Daily ROI credited automatically</li>
            <li>5% / 3% / 2% level income on investments</li>
            <li>Wallet, history, and network in one place</li>
          </ul>
        </div>
        <small>NexaVest · assessment build for Nexachain AI</small>
      </section>

      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
          <div className="mobile-brand"><span className="brand-mark">N</span><strong>NexaVest</strong></div>
          <p className="eyebrow">{isLogin ? 'Welcome back' : 'Start investing'}</p>
          <h2>{isLogin ? 'Sign in to your account' : 'Create your account'}</h2>
          <p className="auth-intro">{isLogin ? 'Enter your details to access your portfolio.' : 'Join the investment network in a few steps.'}</p>

          {!isLogin && (
            <div className="form-row">
              <label>
                Full name
                <input {...register('fullName', { validate: validateFullName })} placeholder="Rajan Kumar" />
              </label>
              <label>
                Mobile number
                <input {...register('mobileNumber', { validate: validateMobileNumber })} placeholder="+919876543210" />
              </label>
            </div>
          )}
          <label>
            Email address
            <input type="email" {...register('email', { validate: validateEmail })} placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input
              type="password"
              {...register('password', { validate: isLogin ? validateLoginPassword : validatePassword })}
              placeholder={isLogin ? 'Your password' : 'Min 8 chars, A-Z, a-z, number'}
            />
          </label>
          {!isLogin && (
            <label>
              Referral code <span>(optional)</span>
              <input {...register('referralCode', { validate: validateReferralCode })} placeholder="NEXA-RK24" />
            </label>
          )}

          {serverError && <AlertBanner tone="error" title="Request failed" message={serverError} />}
          {!serverError && fieldError && <AlertBanner tone="error" title="Check the form" message={fieldError} />}

          <button className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'} <ArrowRight size={17} />
          </button>
          <p className="auth-switch">
            {isLogin ? 'New here?' : 'Already have an account?'}{' '}
            <a href={isLogin ? '/register' : '/login'}>{isLogin ? 'Create an account' : 'Sign in'}</a>
          </p>
        </form>
      </section>
    </main>
  )
}
