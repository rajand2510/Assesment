import mongoose, { type InferSchemaType } from 'mongoose'

const { model, models, Schema } = mongoose

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true },
    mobileNumber: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    referralCode: { type: String, required: true, uppercase: true, trim: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    walletBalanceInPaise: { type: Number, default: 0, min: 0 },
    totalRoiEarnedInPaise: { type: Number, default: 0, min: 0 },
    totalLevelIncomeInPaise: { type: Number, default: 0, min: 0 },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'closed'],
      default: 'active',
    },
  },
  { timestamps: true, versionKey: false },
)

userSchema.index({ email: 1 }, { unique: true })
userSchema.index({ mobileNumber: 1 }, { unique: true })
userSchema.index({ referralCode: 1 }, { unique: true })
userSchema.index({ referredBy: 1, createdAt: -1 })

export type UserDocument = InferSchemaType<typeof userSchema>
export const User = models.User ?? model('User', userSchema)
