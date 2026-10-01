import { getStoredManagerToken } from './ManagerAuthService'
import type { ActivityPage, RecentBookingsResponse } from '../type/report'

async function getJson<T>(url: string, fallbackError: string, signal?: AbortSignal): Promise<T> {
  const token = getStoredManagerToken()
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error ?? fallbackError)
  }

  return data as T
}

export function fetchRecentBookings(
  query: { ownerId?: string; page?: number; pageSize?: number } = {},
  signal?: AbortSignal,
): Promise<RecentBookingsResponse> {
  const params = new URLSearchParams()
  if (query.ownerId) params.set('ownerId', query.ownerId)
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  const queryString = params.toString()
  return getJson(
    `/api/Reports/recent-bookings${queryString ? `?${queryString}` : ''}`,
    'Unable to load recent bookings',
    signal,
  )
}

export function fetchRecentActivity(
  query: { ownerId?: string; page?: number; pageSize?: number } = {},
  signal?: AbortSignal,
): Promise<ActivityPage> {
  const params = new URLSearchParams()
  if (query.ownerId) params.set('ownerId', query.ownerId)
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  const queryString = params.toString()
  return getJson(
    `/api/Reports/recent-activity${queryString ? `?${queryString}` : ''}`,
    'Unable to load recent updates',
    signal,
  )
}
