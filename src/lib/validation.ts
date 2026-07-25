const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MOBILE_PATTERN = /^\+?[1-9]\d{7,14}$/

export function validateFullName(value: string) {
  const trimmed = value.trim()
  if (trimmed.length < 2) return 'Full name must be at least 2 characters'
  if (trimmed.length > 100) return 'Full name must be at most 100 characters'
  return true
}

export function validateEmail(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return 'Email is required'
  if (!EMAIL_PATTERN.test(trimmed)) return 'Enter a valid email address'
  return true
}

export function validateMobileNumber(value: string) {
  const trimmed = value.trim()
  if (!MOBILE_PATTERN.test(trimmed)) {
    return 'Enter a valid mobile number with country code (e.g. +919876543210)'
  }
  return true
}

export function validatePassword(value: string) {
  if (value.length < 8) return 'Password must be at least 8 characters'
  if (value.length > 72) return 'Password must be at most 72 characters'
  if (!/[A-Z]/.test(value)) return 'Password must include an uppercase letter'
  if (!/[a-z]/.test(value)) return 'Password must include a lowercase letter'
  if (!/\d/.test(value)) return 'Password must include a number'
  return true
}

export function validateLoginPassword(value: string) {
  if (!value) return 'Password is required'
  return true
}

export function validateReferralCode(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return true
  if (trimmed.length < 5) return 'Referral code must be at least 5 characters'
  if (trimmed.length > 20) return 'Referral code must be at most 20 characters'
  return true
}

export function validateInvestmentAmount(value: number) {
  if (Number.isNaN(value)) return 'Amount is required'
  if (value < 1000) return 'Minimum amount is ₹1,000'
  if (value > 10_000_000) return 'Maximum amount is ₹1,00,00,000'
  return true
}

export function validatePlanName(value: string) {
  const trimmed = value.trim()
  if (trimmed.length < 2) return 'Plan name must be at least 2 characters'
  if (trimmed.length > 80) return 'Plan name must be at most 80 characters'
  return true
}

export function validateDurationDays(value: number) {
  if (!Number.isInteger(value)) return 'Duration must be a whole number of days'
  if (value < 30) return 'Minimum duration is 30 days'
  if (value > 1095) return 'Maximum duration is 1095 days'
  return true
}

export function validateDailyRoiPercentage(value: number) {
  if (Number.isNaN(value)) return 'Daily ROI is required'
  if (value < 0.01) return 'Daily ROI must be at least 0.01%'
  if (value > 10) return 'Daily ROI cannot exceed 10%'
  return true
}
