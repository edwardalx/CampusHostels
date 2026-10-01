import { getStoredManagerToken } from './ManagerAuthService'
import type { ManagedPaymentsResponse, PaymentQuery } from '../type/payment'

export async function fetchManagedPayments(
  query: PaymentQuery = {},
  signal?: AbortSignal,
): Promise<ManagedPaymentsResponse> {
  const token = getStoredManagerToken()
  const params = new URLSearchParams()
  if (query.ownerId) params.set('ownerId', query.ownerId)
  if (query.sortBy) params.set('sortBy', query.sortBy)
  if (query.sortDir) params.set('sortDir', query.sortDir)
  if (query.search) params.set('search', query.search)
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  const queryString = params.toString()

  const response = await fetch(`/api/Payments/managed${queryString ? `?${queryString}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error ?? 'Unable to load payments')
  }

  return data as ManagedPaymentsResponse
}
