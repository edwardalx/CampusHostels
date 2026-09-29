import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FunctionType } from '../services/ManagerAuthService'

export function DashboardHeader() {
  const { manager } = useAuth()
  const navigate = useNavigate()
  const canManageProperties =
    manager?.tier === 'Super' || manager?.functions.includes(FunctionType.ManageProperties)

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Overview</p>
        <h1>Hostel dashboard</h1>
      </div>
      <div className="flex flex-row gap-4">
        {canManageProperties && (
          <button className="primary-button" onClick={() => navigate('/properties/new')}>
            ➕ Add property
          </button>
        )}
        {manager?.tier === 'Super' && (
          <button className="primary-button" onClick={() => navigate('/managers/new')}>
            ➕ Add Manager
          </button>
        )}
        {manager?.tier === 'Super' && (
          <button className="primary-button" onClick={() => navigate('/managers')}>
            👥 All Managers
          </button>
        )}

      </div>

    </header>
  )
}
