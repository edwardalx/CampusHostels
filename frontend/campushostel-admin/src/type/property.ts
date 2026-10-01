export interface PropertyCreatePayload {
  name: string
  location: string
  imageUrl?: string
  noOfUnits?: number
  noOfFloors?: number
  startingPrice?: number
  ownerManagerId: string
}

export interface Property {
  id: number
  name: string
  location: string
  imageUrl?: string | null
  noOfUnits?: number | null
  noOfFloors?: number | null
  startingPrice?: number | null
  ownerManagerId?: string | null
  availability?: boolean
}

export interface ManagedPropertiesPage {
  items: ManagedProperty[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface ManagedProperty extends Property {
  noOfUnits: number
  occupiedRooms: number
  occupancyPercentage: number
  revenueByCurrency: Record<string, number>
}