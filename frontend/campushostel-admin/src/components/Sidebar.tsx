import { useAuth } from '../context/AuthContext'
import { FunctionType, type FunctionType as FunctionTypeValue } from '../services/ManagerAuthService'

interface NavItem {
  label: string
  requiredFunction?: FunctionTypeValue
}

const navItems: NavItem[] = [
  { label: 'Overview' },
  { label: 'Properties', requiredFunction: FunctionType.ManageProperties },
  { label: 'Tenants', requiredFunction: FunctionType.ManageUsers },
  { label: 'Payments' },
  { label: 'Maintenance' },
  { label: 'Reports', requiredFunction: FunctionType.ViewReports },
]

export function Sidebar() {
  const { manager, logout } = useAuth()

  const visibleNavItems = navItems.filter(
    (item) => !item.requiredFunction || manager?.functions.includes(item.requiredFunction),
  )

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">CH</div>
        <div>
          <p className="eyebrow">Operations</p>
          <h2>CampusHostels</h2>
        </div>
      </div>

      <nav className="nav">
        {visibleNavItems.map((item, index) => (
          <button key={item.label} className={`nav-item${index === 0 ? ' active' : ''}`}>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-card">
        <p className="eyebrow">System health</p>
        <strong>96.4%</strong>
        <span>All services nominal</span>
      </div>

      <div className="sidebar-card">
        <p className="eyebrow">Signed in as</p>
        <strong>{manager?.firstName} {manager?.lastName}</strong>
        <button className="nav-item" onClick={logout}>
          Log out
        </button>
      </div>
    </aside>
  )
}
