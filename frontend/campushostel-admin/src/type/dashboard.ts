import type { ReactNode } from 'react'

export type SummaryCard = {
  label: string
  value: ReactNode
  change: string
  detail: string
}

export interface DashboardSummary {
  occupiedRooms: number
  totalRooms: number
  availableBeds: number
  propertyRevenueByCurrency: Record<string, number>
  activeTenancyAgreements: number
  activeTenants?: number
  activeTenanciesNotFullyPaid?: number
  averageRating?: number | null
  ratingCount?: number
  ratingPercentage?: number | null
  year: number
}

export interface OccupancyTrendPoint {
  year: number
  asOfDate: string
  bookedBeds: number
  totalBeds: number
  occupancyPercentage: number
}

