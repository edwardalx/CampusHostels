import { getStoredManagerToken } from './ManagerAuthService'

const baseUrl = '/api/Properties'

export interface PropertyCreatePayload {
  name: string
  location: string
  imageUrl?: string
  noOfUnits?: number
  noOfFloors?: number
}

export interface Property {
  id: number
  name: string
  location: string
  imageUrl?: string | null
  noOfUnits?: number | null
  noOfFloors?: number | null
}

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
