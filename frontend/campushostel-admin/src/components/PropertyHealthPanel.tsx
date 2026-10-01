import { useState } from 'react'
import type { ManagedProperty } from '../type/property'
import { Pagination } from './Pagination'

const PAGE_SIZE = 4

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
  const [page, setPage] = useState(1)

  // Only the list is paged; the revenue total below always covers every property passed in.
  const totalPages = Math.max(Math.ceil(properties.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, totalPages)
  const pageProperties = properties.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

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
          pageProperties.map((property) => {
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

      {!error && !isLoading && properties.length > PAGE_SIZE && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          totalCount={properties.length}
          onPageChange={setPage}
        />
      )}

      <div className="revenue-card">
        <p>Revenue YTD</p>
        <h4>{formatRevenue(revenueByCurrency)}</h4>
        <span>Successful payments this year</span>
      </div>
    </div>
  )
}
