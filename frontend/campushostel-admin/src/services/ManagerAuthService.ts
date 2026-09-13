const baseUrl = '/api/Managers'

export interface ManagerAuthResponse {
  token: string
  managerId: string
  username: string
  firstName: string
  lastName: string
  email: string
  tier: 'Standard' | 'Super'
  mustChangePassword: boolean
  expires: string
}

export interface ManagerProfile {
  managerId: string
  username: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  tier: 'Standard' | 'Super'
  mustChangePassword: boolean
}

export async function loginManager(credentials: {
  username: string
  password: string
}): Promise<ManagerAuthResponse> {
  const response = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error ?? 'Login failed')
  }

  localStorage.setItem('managerToken', data.token)
  localStorage.setItem('manager', JSON.stringify(data))
  return data
}

export async function fetchCurrentManager(): Promise<ManagerProfile> {
  const token = localStorage.getItem('managerToken')
  const response = await fetch(`${baseUrl}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error ?? 'Session invalid')
  }

  return data
}

export async function changeManagerPassword(payload: {
  currentPassword: string
  newPassword: string
}): Promise<void> {
  const token = getStoredManagerToken()
  const response = await fetch(`${baseUrl}/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data?.error ?? 'Unable to change password')
  }
}

export function logoutManager() {
  localStorage.removeItem('managerToken')
  localStorage.removeItem('manager')
}

export function getStoredManagerToken(): string | null {
  return localStorage.getItem('managerToken')
}
