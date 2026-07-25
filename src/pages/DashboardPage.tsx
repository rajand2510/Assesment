import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/authState'
import { ChangePasswordModal } from '../components/ChangePasswordModal'
import { InvestmentModal } from '../components/InvestmentModal'
import { InvestmentTable } from '../components/InvestmentTable'
import { MobileNav } from '../components/MobileNav'
import { ReferralCard } from '../components/ReferralCard'
import { countNodes, ReferralTree } from '../components/ReferralTree'
import { Sidebar, type AppSection } from '../components/Sidebar'
import { SummaryCard } from '../components/SummaryCard'
import { apiRequest, getErrorMessage } from '../lib/api'
import { buildWeeklyEarnings } from '../lib/earnings'
import { formatCurrency, formatDate } from '../lib/format'
import type {
  DashboardSummary,
  DirectReferral,
  EarningHistory,
  InvestmentList,
  ReferralNode,
} from '../types/api'
import { AlertBanner } from '../ui/AlertBanner'

const EarningsChart = lazy(() => import('../components/EarningsChart').then((module) => ({
  default: module.EarningsChart,
})))

const sectionTitles: Record<AppSection, string> = {
  overview: 'Dashboard',
  investments: 'Investments',
  earnings: 'Earnings',
  network: 'My network',
  settings: 'Settings',
}

export function DashboardPage() {
  const { user, logout } = useAuth()
  const [activeSection, setActiveSection] = useState<AppSection>('overview')
  const [showInvestmentForm, setShowInvestmentForm] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [scrollToTree, setScrollToTree] = useState(false)
  const summary = useQuery({ queryKey: ['dashboard'], queryFn: () => apiRequest<DashboardSummary>('/api/dashboard/summary') })
  const investments = useQuery({ queryKey: ['investments'], queryFn: () => apiRequest<InvestmentList>('/api/investments?page=1&limit=10') })
  const referrals = useQuery({ queryKey: ['referrals'], queryFn: () => apiRequest<DirectReferral[]>('/api/referrals/direct') })
  const referralTree = useQuery({
    queryKey: ['referral-tree'],
    queryFn: () => apiRequest<ReferralNode[]>('/api/referrals/tree'),
  })
  const history = useQuery({ queryKey: ['history'], queryFn: () => apiRequest<EarningHistory>('/api/dashboard/history?page=1&limit=100') })

  const weeklyEarnings = useMemo(
    () => (history.data ? buildWeeklyEarnings(history.data) : []),
    [history.data],
  )

  function openNetworkTree() {
    setActiveSection('network')
    setScrollToTree(true)
  }

  useEffect(() => {
    if (activeSection !== 'network' || !scrollToTree) return
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('network-tree')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setScrollToTree(false)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [activeSection, scrollToTree])

  async function retryDashboard() {
    await Promise.all([
      summary.refetch(),
      investments.refetch(),
      referrals.refetch(),
      referralTree.refetch(),
      history.refetch(),
    ])
  }

  if (
    summary.isPending
    || investments.isPending
    || referrals.isPending
    || referralTree.isPending
    || history.isPending
  ) {
    return <div className="page-state"><span className="loading-ring" /><p>Preparing your portfolio…</p></div>
  }
  if (
    summary.isError
    || investments.isError
    || referrals.isError
    || referralTree.isError
    || history.isError
  ) {
    const message = getErrorMessage(
      summary.error
        ?? investments.error
        ?? referrals.error
        ?? referralTree.error
        ?? history.error,
      'We could not load your portfolio data.',
    )
    return (
      <div className="page-state error-state">
        <AlertBanner
          tone="error"
          title="Dashboard unavailable"
          message={message}
          onRetry={() => { void retryDashboard() }}
        />
      </div>
    )
  }

  const fullName = summary.data.profile.fullName
  const initials = fullName.split(' ').map((name) => name[0]).slice(0, 2).join('')
  const activePlans = investments.data.items.filter((item) => item.status === 'active').length
  const completedPlans = investments.data.items.filter((item) => item.status === 'completed').length
  const totalPlans = investments.data.pagination.total
  const referralPayouts = history.data.referral.total
  const roiCredits = history.data.roi.total
  const portfolio = summary.data.totalInvestments

  function portfolioShare(amount: number) {
    if (portfolio <= 0) return 'No investments yet'
    return `${((amount / portfolio) * 100).toFixed(2)}% of portfolio`
  }

  const metrics = [
    {
      label: 'Total investments',
      value: formatCurrency(summary.data.totalInvestments),
      change: `${activePlans} active · ${totalPlans} total`,
      tone: 'amber',
    },
    {
      label: 'Daily ROI',
      value: formatCurrency(summary.data.dailyRoi),
      change: summary.data.dailyRoi > 0 ? `Today · ${portfolioShare(summary.data.dailyRoi)}` : 'No ROI credited today',
      tone: 'mint',
    },
    {
      label: 'Level income',
      value: formatCurrency(summary.data.totalLevelIncome),
      change: `${referralPayouts} payouts · ${portfolioShare(summary.data.totalLevelIncome)}`,
      tone: 'blue',
    },
    {
      label: 'Wallet balance',
      value: formatCurrency(summary.data.walletBalance),
      change: `ROI ${formatCurrency(summary.data.totalRoiEarned)} · Level ${formatCurrency(summary.data.totalLevelIncome)}`,
      tone: 'violet',
    },
  ]
  const recentHistory = [
    ...history.data.roi.items.map((item) => ({
      id: `roi-${item.id}`,
      title: item.planName ? `Daily ROI · ${item.planName}` : 'Daily ROI',
      date: item.earningDate,
      amount: item.amount,
      status: item.status,
    })),
    ...history.data.referral.items.map((item) => ({
      id: `ref-${item.id}`,
      title: `Level ${item.level} income`,
      date: item.earnedAt,
      amount: item.amount,
      status: 'paid',
    })),
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 8)

  return (
    <div className="app-shell">
      <Sidebar activeSection={activeSection} onNavigate={setActiveSection} onLogout={logout} />
      <main className="dashboard">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark">N</span><strong>NexaVest</strong></div>
          <div className="topbar-heading">
            <p className="topbar-eyebrow">Portfolio</p>
            <h1 className="topbar-title">{sectionTitles[activeSection]}</h1>
          </div>
          <div className="topbar-actions">
            <button className="primary-button topbar-cta" onClick={() => setShowInvestmentForm(true)}>
              <Plus size={16} /> New investment
            </button>
            <div className="topbar-user">
              <span className="topbar-avatar">{initials}</span>
              <span>
                <strong>{fullName}</strong>
                <small>{user?.email}</small>
              </span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {activeSection === 'overview' && (
            <>
              <section className="welcome">
                <div>
                  <p>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                  <h1>Welcome back, {fullName.split(' ')[0]}</h1>
                  <span>
                    {activePlans} active plans · wallet {formatCurrency(summary.data.walletBalance)}
                  </span>
                </div>
              </section>
              <section className="summary-grid" aria-label="Portfolio summary">
                {metrics.map((metric) => <SummaryCard {...metric} key={metric.label} />)}
              </section>
              <section className="insights-grid">
                <Suspense fallback={<section className="panel chart-placeholder">Loading earnings…</section>}>
                  <EarningsChart earnings={weeklyEarnings} />
                </Suspense>
                <ReferralCard
                  referralCode={summary.data.profile.referralCode}
                  referrals={referrals.data}
                  onExplore={openNetworkTree}
                />
              </section>
              <InvestmentTable
                investments={investments.data.items}
                onViewAll={() => setActiveSection('investments')}
              />
            </>
          )}

          {activeSection === 'investments' && (
            <section className="section-stack">
              <section className="welcome">
                <div>
                  <p>Portfolio</p>
                  <h1>Investments</h1>
                  <span>{activePlans} active plans · {formatCurrency(summary.data.totalInvestments)} invested</span>
                </div>
                <button className="primary-button compact-mobile" onClick={() => setShowInvestmentForm(true)}>
                  <Plus size={18} /> New investment
                </button>
              </section>
              <section className="summary-grid" aria-label="Investment summary">
                <SummaryCard
                  label="Active plans"
                  value={String(activePlans)}
                  change={`${completedPlans} completed · ${totalPlans} total`}
                  tone="mint"
                />
                <SummaryCard
                  label="Total invested"
                  value={formatCurrency(summary.data.totalInvestments)}
                  change={`${activePlans} active plans`}
                  tone="amber"
                />
                <SummaryCard
                  label="Today's ROI"
                  value={formatCurrency(summary.data.dailyRoi)}
                  change={summary.data.dailyRoi > 0 ? portfolioShare(summary.data.dailyRoi) : 'No credit today'}
                  tone="blue"
                />
                <SummaryCard
                  label="Wallet"
                  value={formatCurrency(summary.data.walletBalance)}
                  change={`Lifetime ROI ${formatCurrency(summary.data.totalRoiEarned)}`}
                  tone="violet"
                />
              </section>
              <InvestmentTable investments={investments.data.items} />
            </section>
          )}

          {activeSection === 'earnings' && (
            <section className="section-stack">
              <section className="welcome">
                <div>
                  <p>Performance</p>
                  <h1>Earnings</h1>
                  <span>Track daily ROI and referral income.</span>
                </div>
              </section>
              <section className="summary-grid" aria-label="Earnings summary">
                <SummaryCard
                  label="Daily ROI total"
                  value={formatCurrency(summary.data.totalRoiEarned)}
                  change={`${roiCredits} ROI credits`}
                  tone="mint"
                />
                <SummaryCard
                  label="Level income"
                  value={formatCurrency(summary.data.totalLevelIncome)}
                  change={`${referralPayouts} referral payouts`}
                  tone="blue"
                />
                <SummaryCard
                  label="Today"
                  value={formatCurrency(summary.data.dailyRoi)}
                  change={summary.data.dailyRoi > 0 ? portfolioShare(summary.data.dailyRoi) : 'No ROI today'}
                  tone="amber"
                />
                <SummaryCard
                  label="Wallet"
                  value={formatCurrency(summary.data.walletBalance)}
                  change={`Combined earnings ${formatCurrency(summary.data.totalRoiEarned + summary.data.totalLevelIncome)}`}
                  tone="violet"
                />
              </section>
              <Suspense fallback={<section className="panel chart-placeholder">Loading earnings…</section>}>
                <EarningsChart earnings={weeklyEarnings} />
              </Suspense>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">History</p>
                    <h2>Recent earnings</h2>
                  </div>
                </div>
                <div className="history-list">
                  {recentHistory.map((item) => (
                    <div className="history-item" key={item.id}>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{formatDate(item.date)} · {item.status}</small>
                      </span>
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  {recentHistory.length === 0 && <p className="referral-empty">No earnings yet.</p>}
                </div>
              </section>
            </section>
          )}

          {activeSection === 'network' && (
            <section className="section-stack">
              <section className="welcome">
                <div>
                  <p>Referrals</p>
                  <h1>My network</h1>
                  <span>Share your code and grow level income.</span>
                </div>
              </section>
              <section className="summary-grid" aria-label="Network summary">
                <SummaryCard
                  label="Direct referrals"
                  value={String(referrals.data.length)}
                  change={`${referrals.data.filter((member) => member.accountStatus === 'active').length} active`}
                  tone="mint"
                />
                <SummaryCard
                  label="Full network"
                  value={String(countNodes(referralTree.data))}
                  change="Nested downline (all levels)"
                  tone="blue"
                />
                <SummaryCard
                  label="Level income"
                  value={formatCurrency(summary.data.totalLevelIncome)}
                  change={`${referralPayouts} payouts received`}
                  tone="amber"
                />
                <SummaryCard
                  label="Referral code"
                  value={summary.data.profile.referralCode}
                  change="Share to grow your tree"
                  tone="violet"
                />
              </section>
              <ReferralCard referralCode={summary.data.profile.referralCode} referrals={referrals.data} />
              <ReferralTree tree={referralTree.data} />
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Level 1</p>
                    <h2>Direct referrals</h2>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Joined</th>
                        <th>Code</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.data.map((member) => (
                        <tr key={member.id}>
                          <td><strong>{member.fullName}</strong></td>
                          <td>{formatDate(member.joinedAt)}</td>
                          <td>{member.referralCode}</td>
                          <td><span className="status active">{member.accountStatus}</span></td>
                        </tr>
                      ))}
                      {referrals.data.length === 0 && (
                        <tr><td className="empty-cell" colSpan={4}>No referrals yet. Share your code to get started.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </section>
          )}

          {activeSection === 'settings' && (
            <section className="section-stack settings-grid">
              <section className="welcome">
                <div>
                  <p>Account</p>
                  <h1>Settings</h1>
                  <span>Manage your profile and security.</span>
                </div>
              </section>
              <section className="panel settings-card">
                <p className="eyebrow">Profile</p>
                <h2>Personal details</h2>
                <label>Full name<input value={fullName} disabled readOnly /></label>
                <label>Email<input value={user?.email ?? ''} disabled readOnly /></label>
                <label>Mobile number<input value={user?.mobileNumber ?? ''} disabled readOnly /></label>
                <label>Referral code<input value={summary.data.profile.referralCode} disabled readOnly /></label>
              </section>
              <section className="panel settings-card">
                <p className="eyebrow">Account</p>
                <h2>Security</h2>
                <p className="auth-intro">Update your password or sign out of this device.</p>
                <div className="modal-actions">
                  <button type="button" className="secondary-button" onClick={() => setShowPasswordForm(true)}>
                    Change password
                  </button>
                  <button type="button" className="primary-button" onClick={logout}>Logout</button>
                </div>
              </section>
            </section>
          )}
        </div>
      </main>
      <MobileNav activeSection={activeSection} onNavigate={setActiveSection} />
      {showInvestmentForm && <InvestmentModal onClose={() => setShowInvestmentForm(false)} />}
      {showPasswordForm && <ChangePasswordModal onClose={() => setShowPasswordForm(false)} />}
    </div>
  )
}
