import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { manager, isLoading } = useAuth()

  if (isLoading) return null
  if (!manager) return <Navigate to="/login" replace />
  if (manager.mustChangePassword) return <Navigate to="/change-password" replace />

  return <>{children}</>
}
