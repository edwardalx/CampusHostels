import type { ActivityItem } from '../data/dashboardData'

type ActivityFeedProps = {
  items: ActivityItem[]
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Activity</p>
          <h3>Recent updates</h3>
        </div>
      </div>

      <div className="activity-list">
        {items.map((item) => (
          <div key={item.title} className="activity-item">
            <div>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
            <small>{item.time}</small>
          </div>
        ))}
      </div>
    </div>
  )
}
