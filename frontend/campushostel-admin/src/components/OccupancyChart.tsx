import type { OccupancyTrendPoint } from '../type/dashboard'

type OccupancyChartProps = {
  data: OccupancyTrendPoint[]
}

const occupancyMarks = [100, 80, 60, 40, 20, 0]

export function OccupancyChart({ data }: OccupancyChartProps) {
  return (
    <div className="panel chart-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Performance</p>
          <h3>Occupancy trend</h3>
        </div>
        <span className="secondary-button">Yearly since 2025</span>
      </div>

      {data.length > 0 ? (
        <div className="chart-visualization">
          <div aria-hidden="true" className="chart-y-axis">
            {occupancyMarks.map((mark) => <span key={mark}>{mark}%</span>)}
          </div>
          <div className="bars" aria-label="Annual occupancy chart">
            {data.map((point) => (
              <div key={point.year} className="bar-col">
                <span
                  className="bar"
                  style={{ height: `${Math.min(point.occupancyPercentage, 100)}%` }}
                  title={`${point.occupancyPercentage}% (${point.bookedBeds}/${point.totalBeds} beds) as of ${new Date(point.asOfDate).toLocaleDateString()}`}
                />
                <label>{point.year}</label>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="properties-message">No annual occupancy snapshots available.</p>
      )}
    </div>
  )
}
