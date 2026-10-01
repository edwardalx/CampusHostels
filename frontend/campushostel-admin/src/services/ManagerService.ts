import { getStoredManagerToken } from './ManagerAuthService'
import type {
  FunctionType,
  ManagerCreatePayload,
  ManagerProfile,
  ManagerUpdatePayload,
} from '../type/manager'

const baseUrl = '/api/Managers'

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
