import { useAuth } from '../context/AuthContext'
import { FunctionType, type FunctionType as FunctionTypeValue } from '../type/manager'
import { useLocation, useNavigate } from 'react-router-dom'

interface NavItem {
  label: string
  path?: string
  requiredFunction?: FunctionTypeValue
}

const navItems: NavItem[] = [
  { label: 'Overview', path: '/' },
  { label: 'Properties', path: '/properties', requiredFunction: FunctionType.ManageProperties },
  { label: 'Tenants', requiredFunction: FunctionType.ManageUsers },
  { label: 'Payments' },
  { label: 'Maintenance' },
  { label: 'Reports', requiredFunction: FunctionType.ViewReports },
]

export function Sidebar() {
  const { manager, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const visibleNavItems = navItems.filter(
    (item) =>
      !item.requiredFunction ||
      manager?.tier === 'Super' ||
      manager?.functions.includes(item.requiredFunction),
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
        {visibleNavItems.map((item) => (
          <button
            key={item.label}
            className={`nav-item${item.path === location.pathname ? ' active' : ''}`}
            onClick={() => item.path && navigate(item.path)}
            type="button"
          >
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
