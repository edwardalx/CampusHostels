export type BookingStatus = 'Pending' | 'Confirmed' | 'Checked in' | 'Ended'

export interface RecentBooking {
  tenancyId: number
  tenantName: string
  propertyName: string
  roomNumber?: string | null
  contractStartDate: string
  contractEndDate?: string | null
  status: BookingStatus
}

export interface RecentBookingsResponse {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  items: RecentBooking[]
}

export interface ActivityPage {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  items: ActivityItem[]
}

export interface ActivityItem {
  type: 'Booking' | 'Payment' | 'Maintenance'
  title: string
  detail: string
  occurredAt: string
}
