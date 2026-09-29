import './App.css'
import { Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { DashboardHeader } from './components/DashboardHeader'
import { StatsGrid } from './components/StatsGrid'
import { OccupancyChart } from './components/OccupancyChart'
import { PropertyHealthPanel } from './components/PropertyHealthPanel'
import { RecentReservationsTable } from './components/RecentReservationsTable'
import { ActivityFeed } from './components/ActivityFeed'
import { LoginPage } from './components/LoginPage'
import { ChangePasswordPage } from './components/ChangePasswordPage'
import { CreateManagerPage } from './components/CreateManagerPage'
import { ManagersListPage } from './components/ManagersListPage'
import { CreatePropertyPage } from './components/CreatePropertyPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import {
  activityFeed,
  occupancyData,
  properties,
  recentReservations,
  summaryCards,
} from './data/dashboardData'

function Dashboard() {
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

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route
        path="/managers"
        element={
          <ProtectedRoute>
            <ManagersListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/managers/new"
        element={
          <ProtectedRoute>
            <CreateManagerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/properties/new"
        element={
          <ProtectedRoute>
            <CreatePropertyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
