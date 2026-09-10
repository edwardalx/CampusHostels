import './App.css'
import { Sidebar } from './components/Sidebar'
import { DashboardHeader } from './components/DashboardHeader'
import { StatsGrid } from './components/StatsGrid'
import { OccupancyChart } from './components/OccupancyChart'
import { PropertyHealthPanel } from './components/PropertyHealthPanel'
import { RecentReservationsTable } from './components/RecentReservationsTable'
import { ActivityFeed } from './components/ActivityFeed'
import {
  activityFeed,
  occupancyData,
  properties,
  recentReservations,
  summaryCards,
} from './data/dashboardData'

function App() {
  return (
    <div className="dashboard-shell">
      <Sidebar />

      <main className="content">
        <DashboardHeader />

        <StatsGrid cards={summaryCards} />

        <section className="main-grid">
          <OccupancyChart data={occupancyData} />
          <PropertyHealthPanel properties={properties} />
        </section>

        <section className="bottom-grid">
          <RecentReservationsTable reservations={recentReservations} />
          <ActivityFeed items={activityFeed} />
        </section>
      </main>
    </div>
  )
}

export default App
