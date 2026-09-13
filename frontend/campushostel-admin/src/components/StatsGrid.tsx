import type { SummaryCard } from '../data/dashboardData'

type StatsGridProps = {
  cards: SummaryCard[]
}

export function StatsGrid({ cards }: StatsGridProps) {
  return (
    <section className="stats-grid">
      {cards.map((card) => (
        <article key={card.label} className="stat-card">
          <div className="stat-header">
            <p>{card.label}</p>
            <span className="stat-pill">{card.change}</span>
          </div>
          <h3>{card.value}</h3>
          <small>{card.detail}</small>
        </article>
      ))}
    </section>
  )
}
