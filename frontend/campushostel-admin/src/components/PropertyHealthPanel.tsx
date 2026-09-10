import type { PropertyHealth } from '../data/dashboardData'

type PropertyHealthPanelProps = {
  properties: PropertyHealth[]
}

export function PropertyHealthPanel({ properties }: PropertyHealthPanelProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h3>Property health</h3>
        </div>
      </div>

      <div className="property-list">
        {properties.map((property) => (
          <div key={property.name} className="property-item">
            <div>
              <strong>{property.name}</strong>
              <span>Occupancy {property.occupancy}</span>
            </div>
            <span className="status-tag">{property.status}</span>
          </div>
        ))}
      </div>

      <div className="revenue-card">
        <p>Net revenue</p>
        <h4>KSh 820K</h4>
        <span>+18.4% from last period</span>
      </div>
    </div>
  )
}
