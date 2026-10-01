import { getStoredManagerToken } from './ManagerAuthService'
import type { ManagedTenantsResponse, TenantQuery } from '../type/tenant'

export async function fetchManagedTenants(
  query: TenantQuery = {},
  signal?: AbortSignal,
): Promise<ManagedTenantsResponse> {
  const token = getStoredManagerToken()
  const params = new URLSearchParams()
  if (query.ownerId) params.set('ownerId', query.ownerId)
  if (query.sortBy) params.set('sortBy', query.sortBy)
  if (query.sortDir) params.set('sortDir', query.sortDir)
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  const queryString = params.toString()

  const response = await fetch(`/api/Tenants${queryString ? `?${queryString}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error ?? 'Unable to load tenants')
  }

  return data as ManagedTenantsResponse
}
