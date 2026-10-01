import type { ActivityItem } from '../type/report'

type ActivityFeedProps = {
  items: ActivityItem[]
  isLoading: boolean
  error: string | null
  /** Items that happened after this ISO time are flagged as new. */
  newSince?: string | null
}

function formatTimeAgo(value: string) {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ActivityFeed({ items, isLoading, error, newSince }: ActivityFeedProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Activity</p>
          <h3>Recent updates</h3>
        </div>
      </div>

      <div className="activity-list">
        {error ? (
          <p className="properties-error" role="alert">{error}</p>
        ) : isLoading ? (
          <p className="properties-message">Loading recent updates...</p>
        ) : items.length === 0 ? (
          <p className="properties-message">No recent activity.</p>
        ) : (
          items.map((item, index) => (
            <div key={`${item.type}-${item.occurredAt}-${index}`} className="activity-item">
              <div>
                <strong>
                  {item.title}
                  {newSince && new Date(item.occurredAt) > new Date(newSince) && (
                    <span className="new-tag">New</span>
                  )}
                </strong>
                <p>{item.detail}</p>
              </div>
              <small>{formatTimeAgo(item.occurredAt)}</small>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
