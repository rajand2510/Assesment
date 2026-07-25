import { LEVEL_INCOME_BASIS_POINTS } from '../config/businessRules.js'
import { calculateBasisPoints } from './money.js'

export interface LevelIncomePayout {
  level: number
  basisPoints: number
  amountInPaise: number
}

export function calculateLevelIncomePayouts(amountInPaise: number): LevelIncomePayout[] {
  return LEVEL_INCOME_BASIS_POINTS.map((basisPoints, index) => ({
    level: index + 1,
    basisPoints,
    amountInPaise: calculateBasisPoints(amountInPaise, basisPoints),
  }))
}
