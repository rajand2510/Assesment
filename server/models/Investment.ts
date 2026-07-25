import mongoose, { type InferSchemaType } from 'mongoose'

const { model, models, Schema } = mongoose

const investmentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amountInPaise: { type: Number, required: true, min: 100_000 },
    plan: {
      name: { type: String, required: true, trim: true },
      durationDays: { type: Number, required: true, min: 1, max: 3650 },
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    dailyRoiBasisPoints: { type: Number, required: true, min: 1, max: 1000 },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
  },
  { timestamps: true, versionKey: false },
)

investmentSchema.index({ user: 1, createdAt: -1 })
investmentSchema.index({ status: 1, startDate: 1, endDate: 1 })

export type InvestmentDocument = InferSchemaType<typeof investmentSchema>
export const Investment = models.Investment ?? model('Investment', investmentSchema)
