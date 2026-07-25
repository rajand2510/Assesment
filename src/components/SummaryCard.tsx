interface SummaryCardProps {
  label: string
  value: string
  change: string
  tone?: string
}

export function SummaryCard({ label, value, change }: SummaryCardProps) {
  return (
    <article className="summary-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span className="metric-change">{change}</span>
    </article>
  )
}
