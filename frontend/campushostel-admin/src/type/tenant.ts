export interface ManagedTenant {
  tenancyId: number
  tenantId: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  propertyId: number
  propertyName: string
  ownerManagerId?: string | null
  unitId: number
  roomNumber?: string | null
  contractStartDate: string
  contractEndDate?: string | null
  status: TenantContractStatus
}

export type TenantContractStatus = 'Active' | 'EndingSoon' | 'Inactive'

export interface TenantSummary {
  activeContracts: number
  endingSoon: number
}

export interface ManagedTenantsResponse {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  summary: TenantSummary
  items: ManagedTenant[]
}

export type TenantSortBy = 'name' | 'startDate'
export type SortDirection = 'asc' | 'desc'

export interface TenantQuery {
  ownerId?: string
  sortBy?: TenantSortBy
  sortDir?: SortDirection
  page?: number
  pageSize?: number
}
