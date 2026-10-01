import type { ManagedProperty } from '../type/property'

type PropertyHealthPanelProps = {
  properties: ManagedProperty[]
  isLoading: boolean
  error: string | null
}

function getHealthStatus(occupancyPercentage: number) {
  if (occupancyPercentage >= 70) return 'Healthy'
  if (occupancyPercentage >= 50) return 'Stable'
  return 'Watch'
}

function formatRevenue(revenueByCurrency: Record<string, number>) {
  const totals = Object.entries(revenueByCurrency)
  if (totals.length === 0) totals.push(['GHS', 0])

  return totals
    .map(([currency, amount]) =>
      new Intl.NumberFormat('en', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(amount),
    )
    .join(' / ')
}

export function PropertyHealthPanel({ properties, isLoading, error }: PropertyHealthPanelProps) {
  const revenueByCurrency = properties.reduce<Record<string, number>>((totals, property) => {
    Object.entries(property.revenueByCurrency).forEach(([currency, amount]) => {
      totals[currency] = (totals[currency] ?? 0) + amount
    })
    return totals
  }, {})

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h3>Property health</h3>
        </div>
      </div>

      <div className="property-list">
        {error ? (
          <p className="properties-error" role="alert">{error}</p>
        ) : isLoading ? (
          <p className="properties-message">Loading property health...</p>
        ) : properties.length === 0 ? (
          <p className="properties-message">No properties to show.</p>
        ) : (
          properties.map((property) => {
            const status = getHealthStatus(property.occupancyPercentage)
            return (
              <div key={property.id} className="property-item">
                <div>
                  <strong className="capitalize">{property.name}</strong>
                  <span>Occupancy {property.occupancyPercentage}%</span>
                </div>
                <span className={`status-tag ${status.toLowerCase()}`}>{status}</span>
              </div>
            )
          })
        )}
      </div>

      <div className="revenue-card">
        <p>Revenue YTD</p>
        <h4>{formatRevenue(revenueByCurrency)}</h4>
        <span>Successful payments this year</span>
      </div>
    </div>
  )
}
