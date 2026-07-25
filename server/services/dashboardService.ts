import { Types } from 'mongoose'
import { Investment } from '../models/Investment.js'
import { ReferralIncome } from '../models/ReferralIncome.js'
import { ROIHistory } from '../models/ROIHistory.js'
import { User } from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import { paiseToRupees } from '../utils/money.js'

export async function getDashboardSummary(userId: string) {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const [user, investmentTotals, dailyRoi] = await Promise.all([
    User.findById(userId)
      .select('fullName referralCode walletBalanceInPaise totalRoiEarnedInPaise totalLevelIncomeInPaise')
      .lean(),
    Investment.aggregate<{ total: number }>([
      { $match: { user: new Types.ObjectId(userId), status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$amountInPaise' } } },
    ]),
    ROIHistory.aggregate<{ total: number }>([
      {
        $match: {
          user: new Types.ObjectId(userId),
          earningDate: today,
          status: 'credited',
        },
      },
      { $group: { _id: null, total: { $sum: '$amountInPaise' } } },
    ]),
  ])

  if (!user) throw new AppError('User was not found', 404, 'USER_NOT_FOUND')

  return {
    profile: {
      fullName: user.fullName,
      referralCode: user.referralCode,
    },
    currency: 'INR',
    totalInvestments: paiseToRupees(investmentTotals[0]?.total ?? 0),
    dailyRoi: paiseToRupees(dailyRoi[0]?.total ?? 0),
    totalRoiEarned: paiseToRupees(user.totalRoiEarnedInPaise),
    totalLevelIncome: paiseToRupees(user.totalLevelIncomeInPaise),
    walletBalance: paiseToRupees(user.walletBalanceInPaise),
  }
}

export async function getEarningHistory(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit
  const [roiItems, referralItems, roiTotal, referralTotal] = await Promise.all([
    ROIHistory.find({ user: userId })
      .populate('investment', 'plan.name')
      .sort({ earningDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ReferralIncome.find({ recipient: userId })
      .populate('generatedBy', 'fullName')
      .sort({ earnedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ROIHistory.countDocuments({ user: userId }),
    ReferralIncome.countDocuments({ recipient: userId }),
  ])

  return {
    roi: {
      items: roiItems.map((item) => ({
        id: String(item._id),
        amount: paiseToRupees(item.amountInPaise),
        earningDate: item.earningDate,
        status: item.status,
        planName: (item.investment as unknown as { plan?: { name?: string } })?.plan?.name,
      })),
      total: roiTotal,
    },
    referral: {
      items: referralItems.map((item) => ({
        id: String(item._id),
        amount: paiseToRupees(item.amountInPaise),
        level: item.level,
        earnedAt: item.earnedAt,
        generatedBy: (item.generatedBy as unknown as { fullName?: string })?.fullName,
      })),
      total: referralTotal,
    },
    pagination: { page, limit },
  }
}
