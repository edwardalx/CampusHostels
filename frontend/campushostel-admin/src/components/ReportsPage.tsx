import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useDashboard } from '../context/DashboardContext'
import { markActivitySeen } from '../services/alertsStore'
import { fetchManagerOwnerOptions } from '../services/ManagerAuthService'
import { fetchRecentActivity, fetchRecentBookings } from '../services/ReportService'
import type { ManagerOwnerOption } from '../type/manager'
import type { ActivityPage, RecentBookingsResponse } from '../type/report'
import { ActivityFeed } from './ActivityFeed'
import { Pagination } from './Pagination'
import { RecentBookingsTable } from './RecentBookingsTable'
import { Sidebar } from './Sidebar'

const BOOKINGS_PAGE_SIZE = 5
const ACTIVITY_PAGE_SIZE = 5

export function ReportsPage() {
  const { manager } = useAuth()
  const isSuper = manager?.tier === 'Super'
  const { ownerFilter, setOwnerFilter } = useDashboard()
  const [owners, setOwners] = useState<ManagerOwnerOption[]>([])
  // Opening Reports clears the sidebar badge; the previous visit time drives the "New" tags.
  const [newSince, setNewSince] = useState<string | null>(null)
  const markedSeen = useRef(false)
  const [bookings, setBookings] = useState<RecentBookingsResponse | null>(null)
  const [activity, setActivity] = useState<ActivityPage | null>(null)
  const [page, setPage] = useState(1)
  const [activityPage, setActivityPage] = useState(1)
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)
  const [bookingsError, setBookingsError] = useState<string | null>(null)
  const [activityError, setActivityError] = useState<string | null>(null)

  useEffect(() => {
    if (markedSeen.current) return
    markedSeen.current = true
    setNewSince(markActivitySeen())
  }, [])

  useEffect(() => {
    if (!isSuper) return
    fetchManagerOwnerOptions()
      .then(setOwners)
      .catch(() => setOwners([]))
  }, [isSuper])

  useEffect(() => {
    const controller = new AbortController()
    setBookingsError(null)
    fetchRecentBookings(
      { ownerId: ownerFilter || undefined, page, pageSize: BOOKINGS_PAGE_SIZE },
      controller.signal,
    )
      .then(setBookings)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setBookingsError(error instanceof Error ? error.message : 'Unable to load recent bookings')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setBookingsLoading(false)
      })

    return () => controller.abort()
  }, [ownerFilter, page])

  useEffect(() => {
    const controller = new AbortController()
    setActivityError(null)
    fetchRecentActivity(
      { ownerId: ownerFilter || undefined, page: activityPage, pageSize: ACTIVITY_PAGE_SIZE },
      controller.signal,
    )
      .then(setActivity)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setActivityError(error instanceof Error ? error.message : 'Unable to load recent updates')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setActivityLoading(false)
      })

    return () => controller.abort()
  }, [ownerFilter, activityPage])

  return (
    <div className="dashboard-shell">
      <Sidebar />
      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Insights</p>
            <h1>Reports</h1>
          </div>
        </header>

        {isSuper && (
          <div className="toolbar">
            <label>
              Owner{' '}
              <select
                value={ownerFilter}
                onChange={(e) => {
                  setOwnerFilter(e.target.value)
                  setPage(1)
                  setActivityPage(1)
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
          </div>
        )}

        <section className="bottom-grid">
          <div>
            <RecentBookingsTable
              bookings={bookings?.items ?? []}
              isLoading={bookingsLoading}
              error={bookingsError}
            />
            {bookings && !bookingsError && (
              <Pagination
                page={bookings.page}
                totalPages={bookings.totalPages}
                totalCount={bookings.totalCount}
                onPageChange={setPage}
              />
            )}
          </div>
          <div>
            <ActivityFeed
              items={activity?.items ?? []}
              isLoading={activityLoading}
              error={activityError}
              newSince={newSince}
            />
            {activity && !activityError && (
              <Pagination
                page={activity.page}
                totalPages={activity.totalPages}
                totalCount={activity.totalCount}
                onPageChange={setActivityPage}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
