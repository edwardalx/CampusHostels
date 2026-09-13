export type SummaryCard = {
  label: string
  value: string
  change: string
  detail: string
}

export type PropertyHealth = {
  name: string
  occupancy: string
  status: 'Healthy' | 'Stable' | 'Watch'
}

export type ActivityItem = {
  title: string
  detail: string
  time: string
}

export type ReservationStatus = 'Confirmed' | 'Pending' | 'Checked in'

export const summaryCards: SummaryCard[] = [
  { label: 'Occupied rooms', value: '142', change: '+8.2%', detail: 'vs last month' },
  { label: 'Property revenue', value: 'KSh 1.24M', change: '+12.6%', detail: 'this quarter' },
  { label: 'New tenants', value: '38', change: '+5', detail: 'this week' },
  { label: 'Pending payments', value: '11', change: '-2', detail: 'need follow-up' },
]

export const occupancyData: number[] = [68, 74, 72, 81, 79, 88, 92, 86, 90, 93, 95, 89]

export const properties: PropertyHealth[] = [
  { name: 'Nairobi Central House', occupancy: '94%', status: 'Healthy' },
  { name: 'Kilimani Studio Hub', occupancy: '88%', status: 'Stable' },
  { name: 'Westlands Residences', occupancy: '76%', status: 'Watch' },
  { name: 'Upper Hill Suites', occupancy: '92%', status: 'Healthy' },
]

export const recentReservations: Array<[string, string, string, ReservationStatus]> = [
  ['Mary Wanjiru', 'A-12', 'Aug 12 - Sep 11', 'Confirmed'],
  ['James Oduor', 'B-04', 'Aug 15 - Sep 14', 'Pending'],
  ['Njeri Kamau', 'C-09', 'Aug 18 - Sep 17', 'Checked in'],
  ['Daniel Mugo', 'D-02', 'Aug 20 - Sep 19', 'Confirmed'],
]

export const activityFeed: ActivityItem[] = [
  { title: 'New booking confirmed', detail: 'Aisha M. booked room 204', time: '12 mins ago' },
  { title: 'Payment received', detail: 'KSh 32,500 processed from Daniel K.', time: '48 mins ago' },
  { title: 'Maintenance request', detail: 'Plumbing issue flagged at Westlands Residences', time: '2 hours ago' },
  { title: 'Room availability update', detail: '2 single rooms are now open in Upper Hill', time: 'Today' },
]
