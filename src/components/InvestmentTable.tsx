import { ArrowUpRight, MoreHorizontal } from 'lucide-react'
import { formatCurrency, formatDate } from '../lib/format'
import type { Investment } from '../types/api'

interface InvestmentTableProps {
  investments: Investment[]
  onViewAll?: () => void
}

export function InvestmentTable({ investments, onViewAll }: InvestmentTableProps) {
  return (
    <section className="panel investments-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Portfolio</p>
          <h2>Recent investments</h2>
        </div>
        {onViewAll && (
          <button className="text-button" type="button" onClick={onViewAll}>
            View all <ArrowUpRight size={15} />
          </button>
        )}
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Plan</th>
              <th>Invested</th>
              <th>Amount</th>
              <th>Return</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {investments.map((investment) => (
              <tr key={investment.id}>
                <td>
                  <span className="plan-cell">
                    <i>{investment.plan.name.charAt(0)}</i>
                    <strong>{investment.plan.name}</strong>
                  </span>
                </td>
                <td>{formatDate(investment.startDate)}</td>
                <td>{formatCurrency(investment.amount)}</td>
                <td className="positive">{investment.dailyRoiPercentage}% daily</td>
                <td>
                  <span className={`status ${investment.status}`}>
                    {investment.status}
                  </span>
                </td>
                <td>
                  <button className="icon-button" aria-label={`Actions for ${investment.plan.name}`}>
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {investments.length === 0 && (
              <tr><td className="empty-cell" colSpan={6}>No investments yet. Create your first plan to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
