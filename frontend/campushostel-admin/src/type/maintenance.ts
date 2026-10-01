export type MaintenanceStatus = 'Open' | 'InProgress' | 'Resolved'

export interface ManagedMaintenanceRequest {
  id: number
  propertyId: number
  ownerManagerId?: string | null
  propertyName: string
  roomNumber?: string | null
  tenantName: string
  phoneNumber: string
  email: string
  category: string
  title: string
  description: string
  status: MaintenanceStatus
  createdAt: string
  updatedAt?: string | null
  resolvedAt?: string | null
}

export interface MaintenanceSummary {
  open: number
  inProgress: number
  resolved: number
}

export interface ManagedMaintenanceResponse {
  summary: MaintenanceSummary
  items: ManagedMaintenanceRequest[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface MaintenanceQuery {
  ownerId?: string
  status?: MaintenanceStatus
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}
