export function normalizeEarningDate(date: Date): Date {
  const normalized = new Date(date)
  normalized.setUTCHours(0, 0, 0, 0)
  return normalized
}

export function buildRoiIdempotencyKey(investmentId: string, earningDate: Date): string {
  return `roi:${investmentId}:${normalizeEarningDate(earningDate).toISOString()}`
}
