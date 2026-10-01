import { useDashboard } from '../context/DashboardContext'
import type { SummaryCard } from '../type/dashboard'
import { StatsGrid } from './StatsGrid'

const loadingSummaryCards: SummaryCard[] = [
  { label: 'Occupancy', value: '—', change: 'Loading', detail: 'occupied / total rooms; beds available' },
  { label: 'Property revenue', value: '—', change: 'YTD', detail: 'successful payments' },
  { label: 'Active tenancy agreements', value: '—', change: 'Now', detail: 'paid active tenancies' },
  { label: 'Active tenancies not fully paid', value: '—', change: 'Now', detail: 'paid less than unit cost' },
]

function formatRevenue(revenueByCurrency: Record<string, number>) {
  const amounts = Object.entries(revenueByCurrency).map(([currency, amount]) =>
    new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount),
  )

  return amounts.length > 0
    ? amounts.join(' / ')
    : new Intl.NumberFormat('en', {
        style: 'currency',
        currency: 'GHS',
        maximumFractionDigits: 0,
      }).format(0)
}

export function DashboardSummaryCards() {
  const { summary, isLoading, error } = useDashboard()
  const summaryCards: SummaryCard[] = summary
    ? [
        {
          label: 'Occupancy',
          value: (
            <>
              {summary.occupiedRooms} / {summary.totalRooms}{' '}
              <span className="text-sm text-muted">rooms occupied</span>
            </>
          ),
          change: 'Current',
          detail: `${summary.availableBeds} beds available`,
        },
        {
          label: 'Property revenue',
          value: formatRevenue(summary.propertyRevenueByCurrency),
          change: 'YTD',
          detail: `successful payments in ${summary.year}`,
        },
        {
          label: 'Active tenancy agreements',
          value: String(summary.activeTenancyAgreements ?? summary.activeTenants ?? 0),
          change: 'Now',
          detail: 'paid active tenancies',
        },
        {
          label: 'Active tenancies not fully paid',
          value: String(summary.activeTenanciesNotFullyPaid ?? 0),
          change: 'Now',
          detail: 'paid less than unit cost',
        },
      ]
    : loadingSummaryCards

  return (
    <>
      {error && <p role="alert">{error}</p>}
      <StatsGrid cards={isLoading ? loadingSummaryCards : summaryCards} />
    </>
  )
}