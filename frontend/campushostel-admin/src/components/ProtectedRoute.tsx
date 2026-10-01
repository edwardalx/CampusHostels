import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { FunctionType as FunctionTypeValue } from '../type/manager'

export function ProtectedRoute({
  children,
  requiredFunction,
}: {
  children: ReactNode
  requiredFunction?: FunctionTypeValue
}) {
  const { manager, isLoading } = useAuth()

  if (isLoading) return null
  if (!manager) return <Navigate to="/login" replace />
  if (manager.mustChangePassword) return <Navigate to="/change-password" replace />
  if (
    requiredFunction !== undefined &&
    manager.tier !== 'Super' &&
    !manager.functions.includes(requiredFunction)
  ) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
