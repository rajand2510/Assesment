import {
  ChartNoAxesCombined,
  LayoutDashboard,
  LogOut,
  Network,
  Settings,
  WalletCards,
} from 'lucide-react'

export type AppSection = 'overview' | 'investments' | 'earnings' | 'network' | 'settings'

const navigation: Array<{ id: AppSection; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'investments', label: 'Investments', icon: WalletCards },
  { id: 'earnings', label: 'Earnings', icon: ChartNoAxesCombined },
  { id: 'network', label: 'Network', icon: Network },
]

interface SidebarProps {
  activeSection: AppSection
  onNavigate: (section: AppSection) => void
  onLogout: () => void
}

export function Sidebar({ activeSection, onNavigate, onLogout }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">N</span>
        <div className="brand-copy">
          <strong>NexaVest</strong>
          <small>Investment desk</small>
        </div>
      </div>

      <p className="nav-group-label">Workspace</p>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            className={`nav-item ${activeSection === id ? 'active' : ''}`}
            key={id}
            aria-current={activeSection === id ? 'page' : undefined}
            onClick={() => onNavigate(id)}
          >
            <Icon size={18} strokeWidth={1.75} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button
          className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
          aria-current={activeSection === 'settings' ? 'page' : undefined}
          onClick={() => onNavigate('settings')}
        >
          <Settings size={18} strokeWidth={1.75} />
          <span>Settings</span>
        </button>
        <button className="logout-button" onClick={onLogout}>
          <LogOut size={18} strokeWidth={1.75} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
