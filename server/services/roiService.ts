import mongoose, { type ClientSession } from 'mongoose'
import { Investment } from '../models/Investment.js'
import { ROIHistory } from '../models/ROIHistory.js'
import { User } from '../models/User.js'
import { WalletTransaction } from '../models/WalletTransaction.js'
import { calculateBasisPoints } from '../utils/money.js'
import { buildRoiIdempotencyKey, normalizeEarningDate } from '../utils/roiRules.js'

interface RoiRunResult {
  earningDate: string
  processed: number
  skipped: number
}

async function creditInvestmentRoi(
  investment: InstanceType<typeof Investment>,
  earningDate: Date,
  session: ClientSession,
): Promise<void> {
  const amountInPaise = calculateBasisPoints(
    investment.amountInPaise,
    investment.dailyRoiBasisPoints,
  )

  const [history] = await ROIHistory.create(
    [{
      user: investment.user,
      investment: investment._id,
      amountInPaise,
      earningDate,
    }],
    { session },
  )

  const user = await User.findByIdAndUpdate(
    investment.user,
    {
      $inc: {
        walletBalanceInPaise: amountInPaise,
        totalRoiEarnedInPaise: amountInPaise,
      },
    },
    { new: true, session },
  )

  await WalletTransaction.create(
    [{
      user: investment.user,
      type: 'roi_credit',
      amountInPaise,
      balanceAfterInPaise: user?.walletBalanceInPaise ?? amountInPaise,
      referenceModel: 'ROIHistory',
      reference: history._id,
      idempotencyKey: buildRoiIdempotencyKey(String(investment._id), earningDate),
      description: `Daily ROI for ${investment.plan.name}`,
    }],
    { session },
  )

  if (earningDate >= investment.endDate) {
    await Investment.updateOne(
      { _id: investment._id, status: 'active' },
      { $set: { status: 'completed' } },
      { session },
    )
  }
}

export async function processDailyRoi(runDate = new Date()): Promise<RoiRunResult> {
  const earningDate = normalizeEarningDate(runDate)
  const result: RoiRunResult = {
    earningDate: earningDate.toISOString(),
    processed: 0,
    skipped: 0,
  }

  const cursor = Investment.find({
    status: 'active',
    startDate: { $lt: earningDate },
    endDate: { $gte: earningDate },
  }).cursor()

  for await (const investment of cursor) {
    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        const alreadyProcessed = await ROIHistory.exists({
          investment: investment._id,
          earningDate,
        }).session(session)

        if (alreadyProcessed) {
          result.skipped += 1
          return
        }

        await creditInvestmentRoi(investment, earningDate, session)
        result.processed += 1
      })
    } catch (error: unknown) {
      if ((error as { code?: number }).code === 11000) {
        result.skipped += 1
      } else {
        throw error
      }
    } finally {
      await session.endSession()
    }
  }

  return result
}
