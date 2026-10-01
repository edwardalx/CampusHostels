import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import { fetchDashboardSummary, fetchOccupancyTrend } from '../services/DashboardService'
import type { DashboardSummary, OccupancyTrendPoint } from '../type/dashboard'
import { useAuth } from './AuthContext'

interface DashboardContextValue {
  summary: DashboardSummary | null
  occupancyTrend: OccupancyTrendPoint[]
  isLoading: boolean
  error: string | null
  selectedPropertyIds: number[]
  ownerFilter: string
  setOwnerFilter: (ownerId: string) => void
  togglePropertySelection: (propertyId: number) => void
  refresh: () => Promise<void>
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { manager } = useAuth()
  const storageKey = manager ? `dashboard-property-selection:${manager.managerId}` : null
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<number[]>(() => {
    if (!storageKey) return []
    try {
      const savedSelection: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? '[]')
      return Array.isArray(savedSelection)
        ? savedSelection.filter((propertyId): propertyId is number => Number.isInteger(propertyId))
        : []
    } catch {
      return []
    }
  })
  // The same provider instance survives navigation between pages, so the owner filter is keyed to
  // the page it was chosen on. Opening another page starts from "All owners" rather than silently
  // carrying a restriction over.
  const { pathname } = useLocation()
  const [ownerChoice, setOwnerChoice] = useState({ pathname, ownerId: '' })
  const ownerFilter = ownerChoice.pathname === pathname ? ownerChoice.ownerId : ''
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [occupancyTrend, setOccupancyTrend] = useState<OccupancyTrendPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const activeRequest = useRef<AbortController | null>(null)

  const refresh = useCallback(async () => {
    activeRequest.current?.abort()
    const request = new AbortController()
    activeRequest.current = request
    setIsLoading(true)
    setError(null)

    try {
      const [nextSummary, nextTrend] = await Promise.all([
        fetchDashboardSummary(request.signal, selectedPropertyIds, ownerFilter || undefined),
        fetchOccupancyTrend(request.signal, selectedPropertyIds, ownerFilter || undefined),
      ])
      setSummary(nextSummary)
      setOccupancyTrend(nextTrend)
    } catch (caught: unknown) {
      if (request.signal.aborted) return
      setSummary(null)
      setOccupancyTrend([])
      setError(caught instanceof Error ? caught.message : 'Unable to load dashboard summary')
    } finally {
      if (!request.signal.aborted) setIsLoading(false)
    }
  }, [selectedPropertyIds, ownerFilter])

  // Changing owner clears the card selection: selected properties may belong to another owner.
  function setOwnerFilter(ownerId: string) {
    setOwnerChoice({ pathname, ownerId })
    setSelectedPropertyIds([])
  }

  function togglePropertySelection(propertyId: number) {
    setSelectedPropertyIds((currentSelection) =>
      currentSelection.includes(propertyId)
        ? currentSelection.filter((selectedId) => selectedId !== propertyId)
        : [...currentSelection, propertyId],
    )
  }

  useEffect(() => {
    if (storageKey) {
      sessionStorage.setItem(storageKey, JSON.stringify(selectedPropertyIds))
    }
  }, [selectedPropertyIds, storageKey])

  useEffect(() => {
    void refresh()
    return () => activeRequest.current?.abort()
  }, [refresh])

  return (
    <DashboardContext.Provider
      value={{ summary, occupancyTrend, isLoading, error, selectedPropertyIds, ownerFilter, setOwnerFilter, togglePropertySelection, refresh }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) throw new Error('useDashboard must be used within a DashboardProvider')
  return context
}