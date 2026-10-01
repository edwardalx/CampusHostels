import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useDashboard } from '../context/DashboardContext'
import { fetchManagerOwnerOptions } from '../services/ManagerAuthService'
import { fetchManagedTenants } from '../services/TenantService'
import type { ManagerOwnerOption } from '../type/manager'
import type { ManagedTenantsResponse, SortDirection, TenantContractStatus, TenantSortBy } from '../type/tenant'
import { Pagination } from './Pagination'
import { Sidebar } from './Sidebar'
import { StatsGrid } from './StatsGrid'

const statusDisplay: Record<TenantContractStatus, { label: string; className: string }> = {
  Active: { label: 'Active', className: 'confirmed' },
  EndingSoon: { label: 'Ending soon', className: 'pending' },
  Inactive: { label: 'Inactive', className: 'inactive' },
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function TenantsPage() {
  const { manager } = useAuth()
  const isSuper = manager?.tier === 'Super'
  const [data, setData] = useState<ManagedTenantsResponse | null>(null)
  const [owners, setOwners] = useState<ManagerOwnerOption[]>([])
  // Shared with the sidebar rating card, which follows the selected owner.
  const { ownerFilter, setOwnerFilter } = useDashboard()
  const [sortBy, setSortBy] = useState<TenantSortBy>('name')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSuper) return
    fetchManagerOwnerOptions()
      .then(setOwners)
      .catch(() => setOwners([]))
  }, [isSuper])

  // Filtering and sorting are done by the API; refetch whenever any of them change.
  useEffect(() => {
    const controller = new AbortController()
    setError(null)
    fetchManagedTenants({ ownerId: ownerFilter || undefined, sortBy, sortDir, page }, controller.signal)
      .then(setData)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load tenants')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [ownerFilter, sortBy, sortDir, page])

  const tenants = data?.items ?? []

  return (
    <div className="dashboard-shell">
      <Sidebar />
      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">People</p>
            <h1>Tenants</h1>
          </div>
        </header>

        <StatsGrid
          cards={[
            {
              label: 'Active contracts',
              value: data ? String(data.summary.activeContracts) : '—',
              change: 'Now',
              detail: 'paid tenancies covering today',
            },
            {
              label: 'Nearing end of contract',
              value: data ? String(data.summary.endingSoon) : '—',
              change: 'Next 3 months',
              detail: 'active contracts ending within 3 months',
            },
          ]}
        />

        <div className="toolbar">
          {isSuper && (
            <label>
              Owner{' '}
              <select value={ownerFilter} onChange={(e) => {
                  setOwnerFilter(e.target.value)
                  setPage(1)
                }}>
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
            Sort by{' '}
            <select value={sortBy} onChange={(e) => {
                setSortBy(e.target.value as TenantSortBy)
                setPage(1)
              }}>
              <option value="name">Name</option>
              <option value="startDate">Contract start date</option>
            </select>
          </label>
          <label>
            Order{' '}
            <select value={sortDir} onChange={(e) => {
                setSortDir(e.target.value as SortDirection)
                setPage(1)
              }}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
        </div>

        {error && <p className="properties-message properties-error" role="alert">{error}</p>}
        {isLoading && <p className="properties-message">Loading tenants...</p>}
        {!isLoading && !error && tenants.length === 0 && (
          <p className="properties-message">No tenants found.</p>
        )}

        {!isLoading && !error && tenants.length > 0 && (
          <div className="panel">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Property</th>
                  <th>Room</th>
                  <th>Contract start</th>
                  <th>Contract end</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.tenancyId}>
                    <td data-label="Name" className="capitalize">{tenant.firstName} {tenant.lastName}</td>
                    <td data-label="Contact">
                      {tenant.phoneNumber}
                      <br />
                      {tenant.email}
                    </td>
                    <td data-label="Property" className="capitalize">{tenant.propertyName}</td>
                    <td data-label="Room">{tenant.roomNumber ?? '—'}</td>
                    <td data-label="Contract start">{formatDate(tenant.contractStartDate)}</td>
                    <td data-label="Contract end">{formatDate(tenant.contractEndDate)}</td>
                    <td data-label="Status">
                      <span className={`table-status ${statusDisplay[tenant.status].className}`}>
                        {statusDisplay[tenant.status].label}
                      </span>
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
