import mongoose from 'mongoose'
import { Investment } from '../models/Investment.js'
import { User } from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import { distributeLevelIncome } from './referralIncomeService.js'

interface CreateInvestmentInput {
  userId: string
  amount: number
  planName: string
  durationDays: number
  dailyRoiPercentage: number
}

interface InvestmentView {
  _id: unknown
  amountInPaise: number
  plan: { name: string; durationDays: number }
  startDate: Date
  endDate: Date
  dailyRoiBasisPoints: number
  status: string
  createdAt?: Date
}

function toInvestmentDto(investment: InvestmentView) {
  return {
    id: String(investment._id),
    amount: investment.amountInPaise / 100,
    plan: investment.plan,
    startDate: investment.startDate,
    endDate: investment.endDate,
    dailyRoiPercentage: investment.dailyRoiBasisPoints / 100,
    status: investment.status,
    createdAt: investment.createdAt,
  }
}

export async function createInvestment(input: CreateInvestmentInput) {
  const eligibleUser = await User.exists({ _id: input.userId, accountStatus: 'active' })
  if (!eligibleUser) {
    throw new AppError('Active user was not found', 404, 'USER_NOT_FOUND')
  }

  const session = await mongoose.startSession()
  let createdInvestment

  try {
    await session.withTransaction(async () => {
      const startDate = new Date()
      startDate.setUTCHours(0, 0, 0, 0)
      const endDate = new Date(startDate)
      endDate.setUTCDate(endDate.getUTCDate() + input.durationDays)

      const [investment] = await Investment.create(
        [{
          user: input.userId,
          amountInPaise: Math.round(input.amount * 100),
          plan: { name: input.planName, durationDays: input.durationDays },
          startDate,
          endDate,
          dailyRoiBasisPoints: Math.round(input.dailyRoiPercentage * 100),
        }],
        { session },
      )

      await distributeLevelIncome({
        investorId: investment.user,
        investmentId: investment._id,
        amountInPaise: investment.amountInPaise,
        session,
      })
      createdInvestment = investment
    })
  } finally {
    await session.endSession()
  }

  if (!createdInvestment) throw new AppError('Investment could not be created')
  return toInvestmentDto((createdInvestment as InstanceType<typeof Investment>).toObject())
}

export async function listUserInvestments(userId: string, page: number, limit: number) {
  const filter = { user: userId }
  const [items, total] = await Promise.all([
    Investment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Investment.countDocuments(filter),
  ])

  return {
    items: items.map(toInvestmentDto),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }
}
