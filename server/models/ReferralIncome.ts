import mongoose from 'mongoose'

const { model, models, Schema } = mongoose

const referralIncomeSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sourceInvestment: { type: Schema.Types.ObjectId, ref: 'Investment', required: true },
    level: { type: Number, required: true, min: 1, max: 10 },
    amountInPaise: { type: Number, required: true, min: 0 },
    earnedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false },
)

referralIncomeSchema.index(
  { recipient: 1, sourceInvestment: 1, level: 1 },
  { unique: true },
)
referralIncomeSchema.index({ recipient: 1, earnedAt: -1 })
referralIncomeSchema.index({ generatedBy: 1 })

export const ReferralIncome =
  models.ReferralIncome ?? model('ReferralIncome', referralIncomeSchema)
