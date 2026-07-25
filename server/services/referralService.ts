import { Types } from 'mongoose'
import { MAX_REFERRAL_TREE_DEPTH } from '../config/businessRules.js'
import { User } from '../models/User.js'
import { AppError } from '../utils/AppError.js'

interface ReferralNode {
  id: string
  fullName: string
  referralCode: string
  joinedAt: Date
  level: number
  children: ReferralNode[]
}

export async function getDirectReferrals(userId: string) {
  const users = await User.find({ referredBy: userId })
    .select('fullName referralCode accountStatus createdAt')
    .sort({ createdAt: -1 })
    .lean()

  return users.map((user) => ({
    id: String(user._id),
    fullName: user.fullName,
    referralCode: user.referralCode,
    accountStatus: user.accountStatus,
    joinedAt: user.createdAt,
  }))
}

export async function getReferralTree(userId: string): Promise<ReferralNode[]> {
  const [root] = await User.aggregate<{
    descendants: Array<{
      _id: Types.ObjectId
      fullName: string
      referralCode: string
      referredBy: Types.ObjectId
      createdAt: Date
      level: number
    }>
  }>([
    { $match: { _id: new Types.ObjectId(userId) } },
    {
      $graphLookup: {
        from: 'users',
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: 'referredBy',
        as: 'descendants',
        maxDepth: MAX_REFERRAL_TREE_DEPTH - 1,
        depthField: 'level',
      },
    },
    {
      $project: {
        'descendants._id': 1,
        'descendants.fullName': 1,
        'descendants.referralCode': 1,
        'descendants.referredBy': 1,
        'descendants.createdAt': 1,
        'descendants.level': 1,
      },
    },
  ])

  if (!root) throw new AppError('User was not found', 404, 'USER_NOT_FOUND')

  const nodes = new Map<string, ReferralNode>()
  root.descendants.forEach((user) => {
    nodes.set(String(user._id), {
      id: String(user._id),
      fullName: user.fullName,
      referralCode: user.referralCode,
      joinedAt: user.createdAt,
      level: user.level + 1,
      children: [],
    })
  })

  const tree: ReferralNode[] = []
  root.descendants.forEach((user) => {
    const node = nodes.get(String(user._id))
    if (!node) return
    const parent = nodes.get(String(user.referredBy))
    if (parent) parent.children.push(node)
    else tree.push(node)
  })

  return tree
}
