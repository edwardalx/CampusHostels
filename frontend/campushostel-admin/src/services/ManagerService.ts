import { getStoredManagerToken, type FunctionType, type ManagerProfile } from './ManagerAuthService'

const baseUrl = '/api/Managers'

export interface ManagerCreatePayload {
  firstName: string
  lastName: string
  username: string
  email: string
  phoneNumber: string
  password: string
  tier: 'Standard' | 'Super'
}

export interface ManagerUpdatePayload {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  tier: 'Standard' | 'Super'
  isActive: boolean
}

function authHeaders() {
  const token = getStoredManagerToken()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function createManager(payload: ManagerCreatePayload): Promise<ManagerProfile> {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error ?? 'Unable to create manager')
  }

  return data
}

export async function fetchAllManagers(): Promise<ManagerProfile[]> {
  const response = await fetch(baseUrl, {
    headers: authHeaders(),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error ?? 'Unable to load managers')
  }

  return data
}

export async function updateManager(
  managerId: string,
  payload: ManagerUpdatePayload,
): Promise<ManagerProfile> {
  const response = await fetch(`${baseUrl}/${managerId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error ?? 'Unable to update manager')
  }

  return data
}

export async function setManagerFunctions(
  managerId: string,
  functions: FunctionType[],
): Promise<ManagerProfile> {
  const response = await fetch(`${baseUrl}/${managerId}/functions`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ functions }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error ?? 'Unable to set manager functions')
  }

  return data
}
