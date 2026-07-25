import { Copy, MoveRight, Users } from 'lucide-react'
import type { DirectReferral } from '../types/api'
import { useToast } from '../ui/toastState'

interface ReferralCardProps {
  referralCode: string
  referrals: DirectReferral[]
  onExplore?: () => void
}

export function ReferralCard({ referralCode, referrals, onExplore }: ReferralCardProps) {
  const { pushToast } = useToast()

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(referralCode)
      pushToast({ tone: 'success', title: 'Referral code copied', message: referralCode })
    } catch {
      pushToast({ tone: 'error', title: 'Copy failed', message: 'Could not copy the referral code.' })
    }
  }

  return (
    <section className="panel referral-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Your network</p>
          <h2>Referral growth</h2>
        </div>
        <span className="network-total"><Users size={15} /> {referrals.length}</span>
      </div>

      <div className="referral-code">
        <span>
          <small>Referral code</small>
          <strong>{referralCode}</strong>
        </span>
        <button aria-label="Copy referral code" onClick={() => { void copyCode() }}><Copy size={17} /></button>
      </div>

      <div className="referral-list">
        {referrals.slice(0, 3).map((member, index) => (
          <div className="referral-member" key={member.id}>
            <span className={`member-avatar ${['amber', 'mint', 'blue'][index]}`}>
              {member.fullName.split(' ').map((name) => name[0]).slice(0, 2).join('')}
            </span>
            <span>
              <strong>{member.fullName}</strong>
              <small>Level 1 partner</small>
            </span>
            <strong>Active</strong>
          </div>
        ))}
        {referrals.length === 0 && <p className="referral-empty">Share your code to grow your network.</p>}
      </div>

      {onExplore && (
        <button className="network-button" type="button" onClick={onExplore}>
          Explore full network <MoveRight size={16} />
        </button>
      )}
    </section>
  )
}
