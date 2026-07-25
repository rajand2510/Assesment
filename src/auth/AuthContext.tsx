import { useMemo, useState, type ReactNode } from 'react'
import { apiRequest, clearAccessToken, getAccessToken, setAccessToken } from '../lib/api'
import type { AuthResult, AuthUser } from '../types/api'
import { AuthContext, type RegisterInput } from './authState'

const USER_KEY = 'nexavest_user'

function getStoredUser(): AuthUser | null {
  if (!getAccessToken()) return null
  const stored = localStorage.getItem(USER_KEY)
  return stored ? (JSON.parse(stored) as AuthUser) : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser)

  function saveAuth(result: AuthResult) {
    setAccessToken(result.token)
    localStorage.setItem(USER_KEY, JSON.stringify(result.user))
    setUser(result.user)
  }

  async function login(email: string, password: string) {
    saveAuth(await apiRequest<AuthResult>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }))
  }

  async function register(input: RegisterInput) {
    const referralCode = input.referralCode?.trim()
    saveAuth(await apiRequest<AuthResult>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName: input.fullName,
        email: input.email,
        mobileNumber: input.mobileNumber,
        password: input.password,
        ...(referralCode ? { referralCode } : {}),
      }),
    }))
  }

  function logout() {
    clearAccessToken()
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, register, logout }),
    [user],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
