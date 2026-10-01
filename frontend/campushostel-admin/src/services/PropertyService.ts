import { getStoredManagerToken } from './ManagerAuthService'
import type { ManagedProperty, Property, PropertyCreatePayload } from '../type/property'

const baseUrl = '/api/Properties'

export async function createProperty(payload: PropertyCreatePayload): Promise<Property> {
  const token = getStoredManagerToken()
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error ?? 'Unable to create property')
  }

  return data
}

export interface ManagedPropertyQuery {
  ownerId?: string
  sortOccupancy?: 'asc' | 'desc'
}

export async function fetchManagedProperties(
  signal?: AbortSignal,
  query: ManagedPropertyQuery = {},
): Promise<ManagedProperty[]> {
  const token = getStoredManagerToken()
  const params = new URLSearchParams()
  if (query.ownerId) params.set('ownerId', query.ownerId)
  if (query.sortOccupancy) params.set('sortOccupancy', query.sortOccupancy)
  const queryString = params.toString()
  const response = await fetch(`${baseUrl}/managed${queryString ? `?${queryString}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error ?? 'Unable to load properties')
  }

  return data as ManagedProperty[]
}
