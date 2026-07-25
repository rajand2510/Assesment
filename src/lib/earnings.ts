import type { EarningHistory } from '../types/api'

export interface EarningsPoint {
  day: string
  dateKey: string
  roi: number
  referral: number
}

function toUtcDayKey(value: string | Date | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

export function buildWeeklyEarnings(history: EarningHistory): EarningsPoint[] {
  const points = new Map<string, EarningsPoint>()

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date()
    date.setUTCHours(12, 0, 0, 0)
    date.setUTCDate(date.getUTCDate() - offset)
    const key = date.toISOString().slice(0, 10)
    points.set(key, {
      dateKey: key,
      day: new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' }).format(date),
      roi: 0,
      referral: 0,
    })
  }

  history.roi.items.forEach((item) => {
    const key = toUtcDayKey(item.earningDate)
    const point = key ? points.get(key) : undefined
    if (point) point.roi += item.amount
  })

  history.referral.items.forEach((item) => {
    const key = toUtcDayKey(item.earnedAt)
    const point = key ? points.get(key) : undefined
    if (point) point.referral += item.amount
  })

  return [...points.values()]
}
