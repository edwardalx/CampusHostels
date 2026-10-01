export interface UnitCreatePayload {
  propertyId: number
  floor: number
  roomNumber?: string
  imageUrl?: string
  imageUrls?: string[]
  cost?: number
  maxNoOfPeople?: number
  unitType: string
}

export interface Unit {
  id: number
  propertyId: number
  floor: number
  roomNumber?: string | null
  imageUrl?: string | null
  imageUrls?: string[]
  cost?: number | null
  maxNoOfPeople?: number | null
  unitType: string
}
