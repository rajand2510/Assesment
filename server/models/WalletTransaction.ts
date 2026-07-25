import mongoose from 'mongoose'

const { model, models, Schema } = mongoose

const walletTransactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['roi_credit', 'level_income', 'investment_debit', 'adjustment'],
      required: true,
    },
    amountInPaise: { type: Number, required: true },
    balanceAfterInPaise: { type: Number, required: true, min: 0 },
    referenceModel: {
      type: String,
      enum: ['Investment', 'ROIHistory', 'ReferralIncome'],
      required: true,
    },
    reference: { type: Schema.Types.ObjectId, required: true },
    idempotencyKey: { type: String, required: true },
    description: { type: String, required: true, maxlength: 160 },
  },
  { timestamps: true, versionKey: false },
)

walletTransactionSchema.index({ idempotencyKey: 1 }, { unique: true })
walletTransactionSchema.index({ user: 1, createdAt: -1 })

export const WalletTransaction =
  models.WalletTransaction ?? model('WalletTransaction', walletTransactionSchema)
