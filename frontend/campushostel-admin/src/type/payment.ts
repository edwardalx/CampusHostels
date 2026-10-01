export type PaymentStatus = 'Pending' | 'Success' | 'Failed'

export interface ManagedPayment {
  paymentId: number
  reference: string
  tenantId: string
  tenantName: string
  email: string
  propertyId: number
  propertyName: string
  ownerManagerId?: string | null
  unitId: number
  roomNumber?: string | null
  amount: number
  currency: string
  status: PaymentStatus
  channel?: string | null
  date: string
}

export interface PaymentSummary {
  collectedThisYearByCurrency: Record<string, number>
  pending: number
  failed: number
  year: number
}

export interface ManagedPaymentsResponse {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  summary: PaymentSummary
  items: ManagedPayment[]
}

export type PaymentSortBy = 'date' | 'amount' | 'name'
export type PaymentSortDirection = 'asc' | 'desc'

export interface PaymentQuery {
  ownerId?: string
  sortBy?: PaymentSortBy
  sortDir?: PaymentSortDirection
  search?: string
  page?: number
  pageSize?: number
}
