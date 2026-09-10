type OccupancyChartProps = {
  data: number[]
}

export function OccupancyChart({ data }: OccupancyChartProps) {
  return (
    <div className="panel chart-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Performance</p>
          <h3>Occupancy trend</h3>
        </div>
        <button className="secondary-button">This year</button>
      </div>

      <div className="bars" aria-label="Occupancy chart">
        {data.map((value, index) => (
          <div key={index} className="bar-col">
            <span className="bar" style={{ height: `${value}%` }} />
            <label>{index + 1}</label>
          </div>
        ))}
      </div>
    </div>
  )
}
