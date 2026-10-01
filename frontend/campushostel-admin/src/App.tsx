import './App.css'
import { Routes, Route } from 'react-router-dom'
import { DashboardPage } from './components/DashboardPage'
import { LoginPage } from './components/LoginPage'
import { ChangePasswordPage } from './components/ChangePasswordPage'
import { CreateManagerPage } from './components/CreateManagerPage'
import { ManagersListPage } from './components/ManagersListPage'
import { CreatePropertyPage } from './components/CreatePropertyPage'
import { CreateUnitPage } from './components/CreateUnitPage'
import { PropertiesPage } from './components/PropertiesPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardProvider } from './context/DashboardContext'
import { FunctionType } from './type/manager'

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
        path="/properties"
        element={
          <ProtectedRoute requiredFunction={FunctionType.ManageProperties}>
            <DashboardProvider>
              <PropertiesPage />
            </DashboardProvider>
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
        path="/properties/units/new"
        element={
          <ProtectedRoute>
            <CreateUnitPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardProvider>
              <DashboardPage />
            </DashboardProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
