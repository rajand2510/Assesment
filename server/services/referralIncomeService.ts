import type { ClientSession, Types } from 'mongoose'
import { ReferralIncome } from '../models/ReferralIncome.js'
import { User } from '../models/User.js'
import { WalletTransaction } from '../models/WalletTransaction.js'
import { calculateLevelIncomePayouts } from '../utils/referralRules.js'

interface DistributionInput {
  investorId: Types.ObjectId
  investmentId: Types.ObjectId
  amountInPaise: number
  session: ClientSession
}

export async function distributeLevelIncome(input: DistributionInput): Promise<void> {
  let generatedBy = await User.findById(input.investorId)
    .select('referredBy')
    .session(input.session)

  for (const payout of calculateLevelIncomePayouts(input.amountInPaise)) {
    if (!generatedBy?.referredBy) break

    const recipient = await User.findOne({
      _id: generatedBy.referredBy,
      accountStatus: 'active',
    })
      .select('_id referredBy')
      .session(input.session)

    if (!recipient) break

    const [income] = await ReferralIncome.create(
      [{
        recipient: recipient._id,
        generatedBy: input.investorId,
        sourceInvestment: input.investmentId,
        level: payout.level,
        amountInPaise: payout.amountInPaise,
      }],
      { session: input.session },
    )

    const updatedRecipient = await User.findByIdAndUpdate(
      recipient._id,
      {
        $inc: {
          walletBalanceInPaise: payout.amountInPaise,
          totalLevelIncomeInPaise: payout.amountInPaise,
        },
      },
      { new: true, session: input.session },
    )

    await WalletTransaction.create(
      [{
        user: recipient._id,
        type: 'level_income',
        amountInPaise: payout.amountInPaise,
        balanceAfterInPaise: updatedRecipient?.walletBalanceInPaise ?? payout.amountInPaise,
        referenceModel: 'ReferralIncome',
        reference: income._id,
        idempotencyKey: `level:${input.investmentId}:${recipient._id}:${payout.level}`,
        description: `Level ${payout.level} income`,
      }],
      { session: input.session },
    )

    generatedBy = recipient
  }
}
