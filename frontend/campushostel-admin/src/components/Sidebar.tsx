import { useAuth } from '../context/AuthContext'

export function Sidebar() {
  const { manager, logout } = useAuth()

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
        <button className="nav-item active">Overview</button>
        <button className="nav-item">Properties</button>
        <button className="nav-item">Tenants</button>
        <button className="nav-item">Payments</button>
        <button className="nav-item">Maintenance</button>
        <button className="nav-item">Reports</button>
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
