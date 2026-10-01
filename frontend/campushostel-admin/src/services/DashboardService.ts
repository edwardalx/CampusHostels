import { getStoredManagerToken } from './ManagerAuthService'
import type { DashboardSummary, OccupancyTrendPoint } from '../type/dashboard'

function buildPropertyQuery(propertyIds: number[], ownerId?: string) {
  const query = new URLSearchParams()
  propertyIds.forEach((propertyId) => query.append('selectedPropertyIds', String(propertyId)))
  if (ownerId) query.set('ownerId', ownerId)
  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

export async function fetchDashboardSummary(
  signal?: AbortSignal,
  propertyIds: number[] = [],
  ownerId?: string,
): Promise<DashboardSummary> {
  const token = getStoredManagerToken()
  const response = await fetch(`/api/Dashboard/summary${buildPropertyQuery(propertyIds, ownerId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error ?? 'Unable to load dashboard summary')
  }

  const summary = data as DashboardSummary & { pendingPayments?: number }
  return {
    ...summary,
    activeTenanciesNotFullyPaid: summary.activeTenanciesNotFullyPaid ?? summary.pendingPayments ?? 0,
  }
}

export async function fetchOccupancyTrend(
  signal?: AbortSignal,
  propertyIds: number[] = [],
  ownerId?: string,
): Promise<OccupancyTrendPoint[]> {
  const token = getStoredManagerToken()
  const response = await fetch(`/api/Dashboard/occupancy-trend${buildPropertyQuery(propertyIds, ownerId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error ?? 'Unable to load occupancy trend')
  }

  return data as OccupancyTrendPoint[]
}