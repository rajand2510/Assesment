import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { User } from '../models/User.js'
import { getEnv } from '../config/env.js'
import { AppError } from '../utils/AppError.js'

interface RegistrationInput {
  fullName: string
  email: string
  mobileNumber: string
  password: string
  referralCode?: string
}

interface LoginInput {
  email: string
  password: string
}

function createAccessToken(userId: string): string {
  const env = getEnv()
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  })
}

async function generateReferralCode(fullName: string): Promise<string> {
  const prefix = fullName.replace(/[^a-z]/gi, '').slice(0, 4).toUpperCase() || 'NEXA'

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
    const code = `${prefix}${suffix}`
    if (!(await User.exists({ referralCode: code }))) return code
  }

  throw new AppError('Unable to create a unique referral code')
}

function toPublicUser(user: Record<string, unknown>) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    mobileNumber: user.mobileNumber,
    referralCode: user.referralCode,
    accountStatus: user.accountStatus,
  }
}

export async function registerUser(input: RegistrationInput) {
  const existing = await User.findOne({
    $or: [{ email: input.email }, { mobileNumber: input.mobileNumber }],
  }).select('+passwordHash')

  // Repair incomplete accounts created without a password hash.
  if (existing && !existing.passwordHash) {
    existing.fullName = input.fullName
    existing.email = input.email
    existing.mobileNumber = input.mobileNumber
    existing.passwordHash = await bcrypt.hash(input.password, 12)
    existing.accountStatus = 'active'
    await existing.save()

    return {
      token: createAccessToken(String(existing._id)),
      user: toPublicUser(existing.toObject()),
    }
  }

  if (existing) {
    throw new AppError('Email or mobile number is already registered', 409, 'DUPLICATE_USER')
  }

  const referrer = input.referralCode
    ? await User.findOne({ referralCode: input.referralCode, accountStatus: 'active' }).select('_id')
    : null

  if (input.referralCode && !referrer) {
    throw new AppError('Referral code is invalid', 422, 'INVALID_REFERRAL_CODE')
  }

  const passwordHash = await bcrypt.hash(input.password, 12)
  const user = await User.create({
    fullName: input.fullName,
    email: input.email,
    mobileNumber: input.mobileNumber,
    passwordHash,
    referralCode: await generateReferralCode(input.fullName),
    referredBy: referrer?._id ?? null,
  })

  return {
    token: createAccessToken(String(user._id)),
    user: toPublicUser(user.toObject()),
  }
}

export async function loginUser(input: LoginInput) {
  const user = await User.findOne({ email: input.email }).select('+passwordHash')

  if (!user?.passwordHash) {
    throw new AppError('Email or password is incorrect', 401, 'INVALID_CREDENTIALS')
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash)
  if (!passwordMatches) {
    throw new AppError('Email or password is incorrect', 401, 'INVALID_CREDENTIALS')
  }
  if (user.accountStatus !== 'active') {
    throw new AppError('This account is not active', 403, 'ACCOUNT_INACTIVE')
  }

  return {
    token: createAccessToken(String(user._id)),
    user: toPublicUser(user.toObject()),
  }
}

export async function changePassword(userId: string, input: { currentPassword: string; newPassword: string }) {
  const user = await User.findById(userId).select('+passwordHash')
  if (!user?.passwordHash) {
    throw new AppError('User account was not found', 404, 'USER_NOT_FOUND')
  }
  if (user.accountStatus !== 'active') {
    throw new AppError('This account is not active', 403, 'ACCOUNT_INACTIVE')
  }

  const currentMatches = await bcrypt.compare(input.currentPassword, user.passwordHash)
  if (!currentMatches) {
    throw new AppError('Current password is incorrect', 401, 'INVALID_CURRENT_PASSWORD')
  }

  user.passwordHash = await bcrypt.hash(input.newPassword, 12)
  await user.save()

  return { message: 'Password updated successfully' }
}
