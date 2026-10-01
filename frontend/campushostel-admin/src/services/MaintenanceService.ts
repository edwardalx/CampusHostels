import { getStoredManagerToken } from './ManagerAuthService'
import type {
  MaintenanceQuery,
  MaintenanceStatus,
  ManagedMaintenanceResponse,
} from '../type/maintenance'

const baseUrl = '/api/Maintenance'

export async function fetchManagedMaintenance(
  query: MaintenanceQuery = {},
  signal?: AbortSignal,
): Promise<ManagedMaintenanceResponse> {
  const token = getStoredManagerToken()
  const params = new URLSearchParams()
  if (query.ownerId) params.set('ownerId', query.ownerId)
  if (query.status) params.set('status', query.status)
  if (query.sortDir) params.set('sortDir', query.sortDir)
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  const queryString = params.toString()

  const response = await fetch(`${baseUrl}/managed${queryString ? `?${queryString}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error ?? 'Unable to load maintenance requests')
  }

  return data as ManagedMaintenanceResponse
}

export async function updateMaintenanceStatus(id: number, status: MaintenanceStatus): Promise<void> {
  const token = getStoredManagerToken()
  const response = await fetch(`${baseUrl}/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.error ?? 'Unable to update the request')
  }
}
