import mongoose from 'mongoose'

const { model, models, Schema } = mongoose

const roiHistorySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    investment: { type: Schema.Types.ObjectId, ref: 'Investment', required: true },
    amountInPaise: { type: Number, required: true, min: 0 },
    earningDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['credited', 'reversed'],
      default: 'credited',
    },
  },
  { timestamps: true, versionKey: false },
)

roiHistorySchema.index({ investment: 1, earningDate: 1 }, { unique: true })
roiHistorySchema.index({ user: 1, earningDate: -1 })

export const ROIHistory = models.ROIHistory ?? model('ROIHistory', roiHistorySchema)
