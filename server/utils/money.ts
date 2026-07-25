export function calculateBasisPoints(amountInPaise: number, basisPoints: number): number {
  return Math.round((amountInPaise * basisPoints) / 10_000)
}

export function paiseToRupees(amountInPaise: number): number {
  return amountInPaise / 100
}
