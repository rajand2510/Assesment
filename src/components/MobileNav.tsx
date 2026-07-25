import { ChartNoAxesCombined, LayoutDashboard, Network, WalletCards } from 'lucide-react'
import type { AppSection } from './Sidebar'

const items: Array<{ id: AppSection; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Home', icon: LayoutDashboard },
  { id: 'investments', label: 'Invest', icon: WalletCards },
  { id: 'earnings', label: 'Earnings', icon: ChartNoAxesCombined },
  { id: 'network', label: 'Network', icon: Network },
]

interface MobileNavProps {
  activeSection: AppSection
  onNavigate: (section: AppSection) => void
}

export function MobileNav({ activeSection, onNavigate }: MobileNavProps) {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {items.map(({ id, label, icon: Icon }) => (
        <button
          className={activeSection === id ? 'active' : ''}
          key={id}
          onClick={() => onNavigate(id)}
        >
          <Icon size={19} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
