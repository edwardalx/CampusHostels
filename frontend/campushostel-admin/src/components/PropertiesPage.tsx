import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchManagerOwnerOptions } from '../services/ManagerAuthService'
import { fetchManagedProperties } from '../services/PropertyService'
import { FunctionType } from '../type/manager'
import type { ManagerOwnerOption } from '../type/manager'
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
  const { selectedPropertyIds, togglePropertySelection, ownerFilter, setOwnerFilter } = useDashboard()
  const navigate = useNavigate()
  const [properties, setProperties] = useState<ManagedProperty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [owners, setOwners] = useState<ManagerOwnerOption[]>([])
  const [occupancySort, setOccupancySort] = useState<'none' | 'asc' | 'desc'>('none')
  const isSuper = manager?.tier === 'Super'
  const canManageProperties =
    isSuper || manager?.functions.includes(FunctionType.ManageProperties)

  useEffect(() => {
    if (!isSuper) return
    fetchManagerOwnerOptions()
      .then(setOwners)
      .catch(() => setOwners([]))
  }, [isSuper])

  // Filtering and sorting are done by the API; refetch whenever either changes.
  useEffect(() => {
    const controller = new AbortController()
    setError(null)
    fetchManagedProperties(controller.signal, {
      ownerId: ownerFilter || undefined,
      sortOccupancy: occupancySort === 'none' ? undefined : occupancySort,
    })
      .then((result) => {
        setProperties(result)
        setHasLoaded(true)
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load properties')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [ownerFilter, occupancySort])

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
            <div className="topbar-actions">
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
        {!isLoading && !error && properties.length === 0 && !ownerFilter && (
          <p className="properties-message">No properties have been assigned to this manager yet.</p>
        )}

        {hasLoaded && (properties.length > 0 || ownerFilter) && (
          <div className="toolbar">
            {isSuper && (
              <label>
                Owner{' '}
                <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
                  <option value="">All owners</option>
                  {owners.map((owner) => (
                    <option key={owner.managerId} value={owner.managerId}>
                      {owner.firstName} {owner.lastName} (@{owner.username})
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Sort by occupancy{' '}
              <select
                value={occupancySort}
                onChange={(e) => setOccupancySort(e.target.value as 'none' | 'asc' | 'desc')}
              >
                <option value="none">Default</option>
                <option value="asc">Lowest first</option>
                <option value="desc">Highest first</option>
              </select>
            </label>
          </div>
        )}

        {!isLoading && !error && properties.length === 0 && ownerFilter && (
          <p className="properties-message">No properties match the selected owner.</p>
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