export type FunctionType = 0 | 1 | 2 | 3 | 4
export type ManagerTier = 'Standard' | 'Super'

export const FunctionType = {
  None: 0,
  ManageManagers: 1,
  ManageUsers: 2,
  ViewReports: 3,
  ManageProperties: 4,
} as const

export interface ManagerAuthResponse {
  token: string
  managerId: string
  username: string
  firstName: string
  lastName: string
  email: string
  tier: ManagerTier
  mustChangePassword: boolean
  functions: FunctionType[]
  expires: string
}

export interface ManagerProfile {
  managerId: string
  username: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  tier: ManagerTier
  mustChangePassword: boolean
  isActive: boolean
  functions: FunctionType[]
}

export interface ManagerOwnerOption {
  managerId: string
  firstName: string
  lastName: string
  username: string
}

export interface ManagerCreatePayload {
  firstName: string
  lastName: string
  username: string
  email: string
  phoneNumber: string
  password: string
  tier: ManagerTier
}

export interface ManagerUpdatePayload {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  tier: ManagerTier
  isActive: boolean
}

export interface ManagerLoginCredentials {
  username: string
  password: string
}

export interface ManagerPasswordChangePayload {
  currentPassword: string
  newPassword: string
}