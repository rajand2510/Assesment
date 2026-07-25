export interface AuthUser {
  id: string
  fullName: string
  email: string
  mobileNumber: string
  referralCode: string
  accountStatus: string
}

export interface AuthResult {
  token: string
  user: AuthUser
}

export interface DashboardSummary {
  profile: {
    fullName: string
    referralCode: string
  }
  currency: 'INR'
  totalInvestments: number
  dailyRoi: number
  totalRoiEarned: number
  totalLevelIncome: number
  walletBalance: number
}

export interface Investment {
  id: string
  amount: number
  plan: { name: string; durationDays: number }
  startDate: string
  endDate: string
  dailyRoiPercentage: number
  status: 'active' | 'completed' | 'cancelled'
}

export interface InvestmentList {
  items: Investment[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export interface DirectReferral {
  id: string
  fullName: string
  referralCode: string
  accountStatus: string
  joinedAt: string
}

export interface ReferralNode {
  id: string
  fullName: string
  referralCode: string
  joinedAt: string
  level: number
  children: ReferralNode[]
}

export interface EarningHistory {
  roi: {
    items: Array<{ id: string; amount: number; earningDate: string; status: string; planName?: string }>
    total: number
  }
  referral: {
    items: Array<{ id: string; amount: number; level: number; earnedAt: string; generatedBy?: string }>
    total: number
  }
  pagination: { page: number; limit: number }
}
