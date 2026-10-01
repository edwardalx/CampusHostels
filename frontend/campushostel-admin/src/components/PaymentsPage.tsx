import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useDashboard } from '../context/DashboardContext'
import { fetchManagerOwnerOptions } from '../services/ManagerAuthService'
import { fetchManagedPayments } from '../services/PaymentService'
import type { ManagerOwnerOption } from '../type/manager'
import type {
  ManagedPaymentsResponse,
  PaymentSortBy,
  PaymentSortDirection,
  PaymentStatus,
} from '../type/payment'
import { Pagination } from './Pagination'
import { Sidebar } from './Sidebar'
import { StatsGrid } from './StatsGrid'

const statusClass: Record<PaymentStatus, string> = {
  Success: 'confirmed',
  Pending: 'pending',
  Failed: 'failed',
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
}

function formatCollected(byCurrency: Record<string, number>) {
  const amounts = Object.entries(byCurrency).map(([currency, amount]) =>
    new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount),
  )
  return amounts.length > 0 ? amounts.join(' / ') : '—'
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function PaymentsPage() {
  const { manager } = useAuth()
  const isSuper = manager?.tier === 'Super'
  const [data, setData] = useState<ManagedPaymentsResponse | null>(null)
  const [owners, setOwners] = useState<ManagerOwnerOption[]>([])
  // Shared with the sidebar rating card, which follows the selected owner.
  const { ownerFilter, setOwnerFilter } = useDashboard()
  const [sortBy, setSortBy] = useState<PaymentSortBy>('date')
  const [sortDir, setSortDir] = useState<PaymentSortDirection>('desc')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSuper) return
    fetchManagerOwnerOptions()
      .then(setOwners)
      .catch(() => setOwners([]))
  }, [isSuper])

  // Wait for a pause in typing before querying the API.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Filtering, searching and sorting are done by the API; refetch whenever any of them change.
  useEffect(() => {
    const controller = new AbortController()
    setError(null)
    fetchManagedPayments(
      { ownerId: ownerFilter || undefined, sortBy, sortDir, search: search || undefined, page },
      controller.signal,
    )
      .then(setData)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load payments')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [ownerFilter, sortBy, sortDir, search, page])

  const payments = data?.items ?? []

  return (
    <div className="dashboard-shell">
      <Sidebar />
      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Finance</p>
            <h1>Payments</h1>
          </div>
        </header>

        <StatsGrid
          cards={[
            {
              label: 'Collected',
              value: data ? formatCollected(data.summary.collectedThisYearByCurrency) : '—',
              change: 'YTD',
              detail: data ? `successful payments in ${data.summary.year}` : 'successful payments',
            },
            {
              label: 'Pending payments',
              value: data ? String(data.summary.pending) : '—',
              change: 'All time',
              detail: 'awaiting confirmation',
            },
            {
              label: 'Failed payments',
              value: data ? String(data.summary.failed) : '—',
              change: 'All time',
              detail: 'did not complete',
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
            Search{' '}
            <input
              type="search"
              placeholder="Tenant name or email"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </label>
          <label>
            Sort by{' '}
            <select value={sortBy} onChange={(e) => {
                setSortBy(e.target.value as PaymentSortBy)
                setPage(1)
              }}>
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="name">Tenant name</option>
            </select>
          </label>
          <label>
            Order{' '}
            <select value={sortDir} onChange={(e) => {
                setSortDir(e.target.value as PaymentSortDirection)
                setPage(1)
              }}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
        </div>

        {error && <p className="properties-message properties-error" role="alert">{error}</p>}
        {isLoading && <p className="properties-message">Loading payments...</p>}
        {!isLoading && !error && payments.length === 0 && (
          <p className="properties-message">
            {search ? `No payments found for "${search}".` : 'No payments found.'}
          </p>
        )}

        {!isLoading && !error && payments.length > 0 && (
          <div className="panel">
            <table>
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Room</th>
                  <th>Amount</th>
                  <th>Channel</th>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.paymentId}>
                    <td data-label="Tenant" className="capitalize">
                      {payment.tenantName || '—'}
                      <br />
                      {payment.email}
                    </td>
                    <td data-label="Property" className="capitalize">{payment.propertyName}</td>
                    <td data-label="Room">{payment.roomNumber ?? '—'}</td>
                    <td data-label="Amount">{formatMoney(payment.amount, payment.currency)}</td>
                    <td data-label="Channel">{payment.channel ?? '—'}</td>
                    <td data-label="Date">{formatDate(payment.date)}</td>
                    <td data-label="Reference">{payment.reference}</td>
                    <td data-label="Status">
                      <span className={`table-status ${statusClass[payment.status]}`}>{payment.status}</span>
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
