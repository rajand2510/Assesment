import { useId, useMemo, useState } from 'react'
import { formatCurrency } from '../lib/format'
import type { EarningsPoint } from '../lib/earnings'

const WIDTH = 640
const HEIGHT = 260
const PAD = { top: 24, right: 48, bottom: 36, left: 48 }

function niceMax(value: number): number {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return nice * magnitude
}

function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let path = `M ${points[0].x} ${points[0].y}`
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index]
    const next = points[index + 1]
    const controlX = (current.x + next.x) / 2
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`
  }
  return path
}

function buildAreaPath(points: Array<{ x: number; y: number }>, baselineY: number): string {
  if (points.length === 0) return ''
  const line = buildSmoothPath(points)
  const first = points[0]
  const last = points[points.length - 1]
  return `${line} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`
}

function compactMoney(value: number): string {
  if (value >= 1000) return `₹${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  if (value >= 100) return `₹${Math.round(value)}`
  return `₹${value.toFixed(value < 10 ? 1 : 0)}`
}

export function EarningsChart({ earnings }: { earnings: EarningsPoint[] }) {
  const gradientId = useId().replace(/:/g, '')
  const [activeIndex, setActiveIndex] = useState(Math.max(earnings.length - 1, 0))

  const chart = useMemo(() => {
    const plotWidth = WIDTH - PAD.left - PAD.right
    const plotHeight = HEIGHT - PAD.top - PAD.bottom
    const maxRoi = niceMax(Math.max(...earnings.map((point) => point.roi), 0))
    const maxReferral = niceMax(Math.max(...earnings.map((point) => point.referral), 0))
    const stepX = earnings.length > 1 ? plotWidth / (earnings.length - 1) : 0

    const toX = (index: number) => PAD.left + index * stepX
    const toRoiY = (value: number) => PAD.top + plotHeight - (value / maxRoi) * plotHeight
    const toReferralY = (value: number) =>
      PAD.top + plotHeight - (value / maxReferral) * plotHeight

    const roiPoints = earnings.map((point, index) => ({
      x: toX(index),
      y: toRoiY(point.roi),
    }))
    const referralPoints = earnings.map((point, index) => ({
      x: toX(index),
      y: toReferralY(point.referral),
    }))

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
      y: PAD.top + plotHeight * (1 - ratio),
      roiLabel: compactMoney(maxRoi * ratio),
      referralLabel: compactMoney(maxReferral * ratio),
    }))

    return {
      plotHeight,
      baselineY: PAD.top + plotHeight,
      maxRoi,
      maxReferral,
      roiPoints,
      referralPoints,
      roiPath: buildSmoothPath(roiPoints),
      referralPath: buildSmoothPath(referralPoints),
      roiArea: buildAreaPath(roiPoints, PAD.top + plotHeight),
      referralArea: buildAreaPath(referralPoints, PAD.top + plotHeight),
      gridLines,
      toX,
    }
  }, [earnings])

  const totalRoi = earnings.reduce((sum, point) => sum + point.roi, 0)
  const totalReferral = earnings.reduce((sum, point) => sum + point.referral, 0)
  const active = earnings[activeIndex] ?? earnings.at(-1)
  const activeRoi = chart.roiPoints[activeIndex]
  const activeReferral = chart.referralPoints[activeIndex]

  if (totalRoi === 0 && totalReferral === 0) {
    return (
      <section className="panel earnings-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Earnings</p>
            <h2>{formatCurrency(0)}</h2>
          </div>
        </div>
        <div className="chart-placeholder">No earnings in the last 7 days yet.</div>
      </section>
    )
  }

  const tooltipLeft = activeRoi
    ? `${((activeRoi.x / WIDTH) * 100).toFixed(2)}%`
    : '50%'

  return (
    <section className="panel earnings-panel earnings-graph">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Earnings trend</p>
          <h2>{formatCurrency(totalRoi + totalReferral)}</h2>
        </div>
        <div className="graph-legend">
          <span className="graph-legend-item roi">
            <i /> Daily ROI
            <strong>{formatCurrency(totalRoi)}</strong>
          </span>
          <span className="graph-legend-item referral">
            <i /> Referral
            <strong>{formatCurrency(totalReferral)}</strong>
          </span>
        </div>
      </div>

      <div
        className="graph-canvas"
        onMouseLeave={() => setActiveIndex(Math.max(earnings.length - 1, 0))}
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="7-day earnings graph"
          className="graph-svg"
        >
          <defs>
            <linearGradient id={`roi-fill-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f766e" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0f766e" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id={`ref-fill-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {chart.gridLines.map((line) => (
            <g key={line.y}>
              <line
                x1={PAD.left}
                y1={line.y}
                x2={WIDTH - PAD.right}
                y2={line.y}
                className="graph-grid"
              />
              <text x={PAD.left - 8} y={line.y + 4} className="graph-axis-label left">
                {line.roiLabel}
              </text>
              <text x={WIDTH - PAD.right + 8} y={line.y + 4} className="graph-axis-label right">
                {line.referralLabel}
              </text>
            </g>
          ))}

          <path d={chart.roiArea} fill={`url(#roi-fill-${gradientId})`} className="graph-area" />
          <path
            d={chart.referralArea}
            fill={`url(#ref-fill-${gradientId})`}
            className="graph-area"
          />
          <path d={chart.roiPath} className="graph-line roi" />
          <path d={chart.referralPath} className="graph-line referral" />

          {earnings.map((point, index) => {
            const x = chart.toX(index)
            return (
              <g key={point.dateKey}>
                <text x={x} y={HEIGHT - 10} className="graph-day-label">
                  {point.day}
                </text>
                <rect
                  x={x - (WIDTH - PAD.left - PAD.right) / earnings.length / 2}
                  y={PAD.top}
                  width={(WIDTH - PAD.left - PAD.right) / Math.max(earnings.length, 1)}
                  height={chart.plotHeight}
                  className="graph-hit"
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                />
              </g>
            )
          })}

          {activeRoi && activeReferral && (
            <g className="graph-active">
              <line
                x1={activeRoi.x}
                y1={PAD.top}
                x2={activeRoi.x}
                y2={chart.baselineY}
                className="graph-crosshair"
              />
              <circle cx={activeRoi.x} cy={activeRoi.y} r="5.5" className="graph-dot roi" />
              <circle
                cx={activeReferral.x}
                cy={activeReferral.y}
                r="5.5"
                className="graph-dot referral"
              />
            </g>
          )}
        </svg>

        {active && (
          <div
            className={`graph-tooltip ${activeIndex < earnings.length / 2 ? 'right' : 'left'}`}
            style={{ left: tooltipLeft }}
          >
            <strong>{active.day}</strong>
            <span className="roi">ROI {formatCurrency(active.roi)}</span>
            <span className="referral">Referral {formatCurrency(active.referral)}</span>
          </div>
        )}
      </div>
    </section>
  )
}
