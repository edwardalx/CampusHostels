import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useDashboard } from '../context/DashboardContext'
import { refreshAlerts } from '../services/alertsStore'
import { fetchManagerOwnerOptions } from '../services/ManagerAuthService'
import { fetchManagedMaintenance, updateMaintenanceStatus } from '../services/MaintenanceService'
import type { ManagerOwnerOption } from '../type/manager'
import type { ManagedMaintenanceResponse, MaintenanceStatus } from '../type/maintenance'
import { Pagination } from './Pagination'
import { Sidebar } from './Sidebar'
import { StatsGrid } from './StatsGrid'

const PAGE_SIZE = 10

const statusDisplay: Record<MaintenanceStatus, { label: string; className: string }> = {
  Open: { label: 'Open', className: 'pending' },
  InProgress: { label: 'In progress', className: 'checked-in' },
  Resolved: { label: 'Resolved', className: 'confirmed' },
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function MaintenancePage() {
  const { manager } = useAuth()
  const isSuper = manager?.tier === 'Super'
  const { ownerFilter, setOwnerFilter } = useDashboard()
  const [owners, setOwners] = useState<ManagerOwnerOption[]>([])
  const [data, setData] = useState<ManagedMaintenanceResponse | null>(null)
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | ''>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!isSuper) return
    fetchManagerOwnerOptions()
      .then(setOwners)
      .catch(() => setOwners([]))
  }, [isSuper])

  useEffect(() => {
    const controller = new AbortController()
    setError(null)
    fetchManagedMaintenance(
      {
        ownerId: ownerFilter || undefined,
        status: statusFilter || undefined,
        sortDir,
        page,
        pageSize: PAGE_SIZE,
      },
      controller.signal,
    )
      .then(setData)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load maintenance requests')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [ownerFilter, statusFilter, sortDir, page, reloadKey])

  const changeStatus = useCallback(async (id: number, status: MaintenanceStatus) => {
    setActionError(null)
    setUpdatingId(id)
    try {
      await updateMaintenanceStatus(id, status)
      setReloadKey((key) => key + 1)
      void refreshAlerts()
    } catch (updateError) {
      setActionError(updateError instanceof Error ? updateError.message : 'Unable to update the request')
    } finally {
      setUpdatingId(null)
    }
  }, [])

  const requests = data?.items ?? []

  return (
    <div className="dashboard-shell">
      <Sidebar />
      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operations</p>
            <h1>Maintenance</h1>
          </div>
        </header>

        <StatsGrid
          cards={[
            {
              label: 'Open',
              value: data ? String(data.summary.open) : '—',
              change: 'Needs action',
              detail: 'not yet picked up',
            },
            {
              label: 'In progress',
              value: data ? String(data.summary.inProgress) : '—',
              change: 'Being fixed',
              detail: 'work under way',
            },
            {
              label: 'Resolved',
              value: data ? String(data.summary.resolved) : '—',
              change: 'All time',
              detail: 'completed requests',
            },
          ]}
        />

        <div className="toolbar">
          {isSuper && (
            <label>
              Owner{' '}
              <select
                value={ownerFilter}
                onChange={(e) => {
                  setOwnerFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">All owners</option>
                {owners.map((owner) => (
                  <option key={owner.managerId} value={owner.managerId}>
                    {owner.firstName} {owner.lastName} (@{owner.username})
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Status{' '}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as MaintenanceStatus | '')
                setPage(1)
              }}
            >
              <option value="">All</option>
              <option value="Open">Open</option>
              <option value="InProgress">In progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </label>
          <label>
            Order{' '}
            <select
              value={sortDir}
              onChange={(e) => {
                setSortDir(e.target.value as 'asc' | 'desc')
                setPage(1)
              }}
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </label>
        </div>

        {error && <p className="properties-message properties-error" role="alert">{error}</p>}
        {actionError && <p className="properties-message properties-error" role="alert">{actionError}</p>}
        {isLoading && <p className="properties-message">Loading maintenance requests...</p>}
        {!isLoading && !error && requests.length === 0 && (
          <p className="properties-message">No maintenance requests found.</p>
        )}

        {!isLoading && !error && requests.length > 0 && (
          <div className="panel">
            <table>
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Room</th>
                  <th>Raised</th>
                  <th>Status</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td data-label="Request">
                      <span>
                        <strong>{request.title}</strong>
                        <br />
                        {request.category}: {request.description}
                      </span>
                    </td>
                    <td data-label="Tenant" className="capitalize">
                      <span>
                        {request.tenantName || '—'}
                        <br />
                        {request.phoneNumber}
                      </span>
                    </td>
                    <td data-label="Property" className="capitalize">{request.propertyName}</td>
                    <td data-label="Room">{request.roomNumber ?? '—'}</td>
                    <td data-label="Raised">{formatDate(request.createdAt)}</td>
                    <td data-label="Status">
                      <span className={`table-status ${statusDisplay[request.status].className}`}>
                        {statusDisplay[request.status].label}
                      </span>
                    </td>
                    <td data-label="Update">
                      <select
                        aria-label={`Update status of ${request.title}`}
                        disabled={updatingId === request.id}
                        value={request.status}
                        onChange={(e) => void changeStatus(request.id, e.target.value as MaintenanceStatus)}
                      >
                        <option value="Open">Open</option>
                        <option value="InProgress">In progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && data && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            totalCount={data.totalCount}
            onPageChange={setPage}
          />
        )}
      </main>
    </div>
  )
}
