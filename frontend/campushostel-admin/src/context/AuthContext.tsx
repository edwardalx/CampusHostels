import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  changeManagerPassword,
  fetchCurrentManager,
  getStoredManagerToken,
  loginManager,
  logoutManager,
  type ManagerProfile,
} from '../services/ManagerAuthService'

interface AuthContextValue {
  manager: ManagerProfile | null
  isLoading: boolean
  login: (credentials: { username: string; password: string }) => Promise<void>
  logout: () => void
  changePassword: (payload: { currentPassword: string; newPassword: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [manager, setManager] = useState<ManagerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getStoredManagerToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    fetchCurrentManager()
      .then(setManager)
      .catch(() => {
        logoutManager()
        setManager(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  async function login(credentials: { username: string; password: string }) {
    await loginManager(credentials)
    const profile = await fetchCurrentManager()
    setManager(profile)
  }

  function logout() {
    logoutManager()
    setManager(null)
  }

  async function changePassword(payload: { currentPassword: string; newPassword: string }) {
    await changeManagerPassword(payload)
    const profile = await fetchCurrentManager()
    setManager(profile)
  }

  return (
    <AuthContext.Provider value={{ manager, isLoading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
