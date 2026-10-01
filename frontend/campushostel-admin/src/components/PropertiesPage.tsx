import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchManagedProperties } from '../services/PropertyService'
import { FunctionType } from '../type/manager'
import type { ManagedProperty } from '../type/property'
import { useDashboard } from '../context/DashboardContext'
import { DashboardSummaryCards } from './DashboardSummaryCards'
import { Sidebar } from './Sidebar'

function formatStartingPrice(price?: number | null) {
  if (price == null) return 'Price not set'
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 0,
  }).format(price)
}

export function PropertiesPage() {
  const { manager } = useAuth()
  const { selectedPropertyIds, togglePropertySelection } = useDashboard()
  const navigate = useNavigate()
  const [properties, setProperties] = useState<ManagedProperty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canManageProperties =
    manager?.tier === 'Super' || manager?.functions.includes(FunctionType.ManageProperties)

  useEffect(() => {
    const controller = new AbortController()
    fetchManagedProperties(controller.signal)
      .then(setProperties)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load properties')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [])

  return (
    <div className="dashboard-shell">
      <Sidebar />
      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Portfolio</p>
            <h1>Properties</h1>
          </div>
          {canManageProperties && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="secondary-button" onClick={() => navigate('/properties/new')} type="button">
                ➕ Add Property
              </button>
              <button
                className="primary-button"
                onClick={() =>
                  navigate(
                    selectedPropertyIds.length === 1
                      ? `/properties/units/new?propertyId=${selectedPropertyIds[0]}`
                      : '/properties/units/new',
                  )
                }
                type="button"
              >
                ➕ Add Unit
              </button>
            </div>
          )}
        </header>

        <DashboardSummaryCards />

        {error && <p className="properties-message properties-error" role="alert">{error}</p>}
        {isLoading && <p className="properties-message">Loading properties...</p>}
        {!isLoading && !error && properties.length === 0 && (
          <p className="properties-message">No properties have been assigned to this manager yet.</p>
        )}

        {!isLoading && !error && properties.length > 0 && (
          <section aria-label="Managed properties" className="property-list">
            {properties.map((property) => (
              <button
                aria-pressed={selectedPropertyIds.includes(property.id)}
                className={`property-item managed-property-item${selectedPropertyIds.includes(property.id) ? ' selected' : ''}`}
                key={property.id}
                onClick={() => togglePropertySelection(property.id)}
                type="button"
              >
                <div className="managed-property-copy">
                  <strong className="capitalize">{property.name}</strong>
                  <span>{property.location}</span>
                  <div className="managed-property-facts">
                    <span><strong>Units</strong> {property.noOfUnits ?? 0}</span>
                    <span><strong>Floors</strong> {property.noOfFloors ?? '—'}</span>
                    <span><strong>Occupancy</strong> {property.occupancyPercentage}%</span>
                    <span><strong>From</strong> {formatStartingPrice(property.startingPrice)}</span>
                  </div>
                </div>
                <span className={`status-tag${property.availability ? '' : ' unavailable'}`}>
                  {property.availability ? 'Available' : 'Fully occupied'}
                </span>
              </button>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}