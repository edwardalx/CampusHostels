import { getStoredManagerToken } from './ManagerAuthService'
import type { Unit, UnitCreatePayload } from '../type/unit'

export async function createUnit(payload: UnitCreatePayload): Promise<Unit> {
  const token = getStoredManagerToken()
  const response = await fetch(`/api/properties/${payload.propertyId}/Units`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const validationMessage = Array.isArray(data)
      ? data.map((e: { errorMessage?: string }) => e.errorMessage).filter(Boolean).join(', ')
      : undefined
    throw new Error(validationMessage || data?.error || 'Unable to create unit')
  }

  return data as Unit
}
