import { getStoredManagerToken } from './ManagerAuthService'

export interface AlertCounts {
  newActivity: number
  openMaintenance: number
}

const POLL_INTERVAL_MS = 60_000

let counts: AlertCounts = { newActivity: 0, openMaintenance: 0 }
let managerId: string | null = null
let timer: ReturnType<typeof setInterval> | null = null
const listeners = new Set<() => void>()

const lastSeenKey = (id: string) => `reports-last-seen:${id}`

function setCounts(next: AlertCounts) {
  if (next.newActivity === counts.newActivity && next.openMaintenance === counts.openMaintenance) return
  counts = next
  listeners.forEach((listener) => listener())
}

export function subscribeToAlerts(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAlertCounts() {
  return counts
}

/** Fetches fresh counts. "New activity" is everything since the manager last opened Reports. */
export async function refreshAlerts() {
  if (!managerId) return

  // First visit on this device: start counting from now so existing history is not flagged as new.
  let since = localStorage.getItem(lastSeenKey(managerId))
  if (!since) {
    since = new Date().toISOString()
    localStorage.setItem(lastSeenKey(managerId), since)
  }

  try {
    const response = await fetch(`/api/Reports/alerts?since=${encodeURIComponent(since)}`, {
      headers: { Authorization: `Bearer ${getStoredManagerToken()}` },
    })
    if (!response.ok) return
    setCounts((await response.json()) as AlertCounts)
  } catch {
    // Alerts are best-effort; a failed poll just leaves the previous badges in place.
  }
}

/** Returns the previous "last seen" time (for highlighting) and resets the activity badge. */
export function markActivitySeen(): string | null {
  if (!managerId) return null
  const previous = localStorage.getItem(lastSeenKey(managerId))
  localStorage.setItem(lastSeenKey(managerId), new Date().toISOString())
  setCounts({ ...counts, newActivity: 0 })
  return previous
}

/** Starts polling for the signed-in manager. Returns a function that stops it. */
export function startAlertPolling(id: string) {
  if (managerId !== id) {
    managerId = id
    counts = { newActivity: 0, openMaintenance: 0 }
  }
  void refreshAlerts()
  if (!timer) timer = setInterval(() => void refreshAlerts(), POLL_INTERVAL_MS)

  return () => {
    if (timer) clearInterval(timer)
    timer = null
  }
}
