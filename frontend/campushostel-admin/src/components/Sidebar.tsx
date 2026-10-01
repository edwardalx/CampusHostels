import { useEffect, useSyncExternalStore } from 'react'
import { useAuth } from '../context/AuthContext'
import { useDashboard } from '../context/DashboardContext'
import { FunctionType, type FunctionType as FunctionTypeValue } from '../type/manager'
import { useLocation, useNavigate } from 'react-router-dom'
import { getAlertCounts, startAlertPolling, subscribeToAlerts } from '../services/alertsStore'

interface NavItem {
  label: string
  icon: string
  path?: string
  requiredFunction?: FunctionTypeValue
}

const navItems: NavItem[] = [
  { label: 'Overview', icon: '🏠', path: '/' },
  { label: 'Properties', icon: '🏢', path: '/properties', requiredFunction: FunctionType.ManageProperties },
  { label: 'Tenants', icon: '👥', path: '/tenants', requiredFunction: FunctionType.ManageUsers },
  { label: 'Payments', icon: '💳', path: '/payments' },
  { label: 'Maintenance', icon: '🛠️', path: '/maintenance' },
  { label: 'Reports', icon: '📊', path: '/reports' },
]

export function Sidebar() {
  const { manager, logout } = useAuth()
  const { summary } = useDashboard()
  const location = useLocation()
  const navigate = useNavigate()
  const alerts = useSyncExternalStore(subscribeToAlerts, getAlertCounts)
  const managerId = manager?.managerId

  useEffect(() => {
    if (!managerId) return
    return startAlertPolling(managerId)
  }, [managerId])

  // Reports flags activity since it was last opened; Maintenance flags requests still open.
  const badgeFor = (label: string) =>
    label === 'Reports' ? alerts.newActivity : label === 'Maintenance' ? alerts.openMaintenance : 0

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
            className={`nav-item${item.path === location.pathname ? ' active' : ''}${item.path ? '' : ' nav-item-soon'}`}
            onClick={() => item.path && navigate(item.path)}
            type="button"
          >
            <span aria-hidden="true" className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {badgeFor(item.label) > 0 && (
              <span aria-label={`${badgeFor(item.label)} new`} className="nav-badge">
                {badgeFor(item.label) > 99 ? '99+' : badgeFor(item.label)}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-card rating-card">
        <p className="eyebrow">Customer rating</p>
        <strong>
          {summary?.ratingPercentage != null ? `${summary.ratingPercentage}%` : '—'}
        </strong>
        <span>
          {summary?.averageRating != null
            ? `${summary.averageRating.toFixed(2)} / 5 average from ${summary.ratingCount ?? 0} ${summary.ratingCount === 1 ? 'rating' : 'ratings'}`
            : 'No ratings yet'}
        </span>
      </div>

      <div className="sidebar-card account-card">
        <p className="eyebrow">Signed in as</p>
        <strong>{manager?.firstName} {manager?.lastName}</strong>
        <button className="nav-item" onClick={logout}>
          Log out
        </button>
      </div>
    </aside>
  )
}
