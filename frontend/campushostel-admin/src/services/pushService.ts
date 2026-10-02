import { getStoredManagerToken } from './ManagerAuthService'

const SW_URL = `${import.meta.env.BASE_URL}sw.js`
const OPT_OUT_KEY = 'push-opted-out'

export type PushState = 'unsupported' | 'blocked' | 'off' | 'on'

export const isPushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredManagerToken()}` }
}

function urlBase64ToUint8Array(base64: string) {
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

async function getRegistration() {
  return navigator.serviceWorker.register(SW_URL, { scope: import.meta.env.BASE_URL })
}

export async function getPushState(): Promise<PushState> {
  if (!isPushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'blocked'
  if (Notification.permission !== 'granted') return 'off'
  const registration = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL)
  const subscription = await registration?.pushManager.getSubscription()
  return subscription ? 'on' : 'off'
}

/** Asks for permission (must follow a user click), subscribes this device and registers it with the API. */
export async function enablePush(): Promise<PushState> {
  if (!isPushSupported()) return 'unsupported'

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'blocked' : 'off'

  const keyResponse = await fetch('/api/Push/public-key', { headers: authHeaders() })
  if (!keyResponse.ok) throw new Error('Push alerts are not available right now.')
  const { publicKey } = (await keyResponse.json()) as { publicKey: string }

  const registration = await getRegistration()
  await navigator.serviceWorker.ready
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }))

  const json = subscription.toJSON()
  const response = await fetch('/api/Push/subscribe', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ endpoint: json.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth }),
  })
  if (!response.ok) throw new Error('Could not register this device for alerts.')

  localStorage.removeItem(OPT_OUT_KEY)
  return 'on'
}

/** Asks the API to push a test alert to this manager's devices; returns how many accepted it. */
export async function sendTestPush(): Promise<number> {
  const response = await fetch('/api/Push/test', { method: 'POST', headers: authHeaders() })
  if (!response.ok) throw new Error('Could not send a test alert.')
  return ((await response.json()) as { delivered: number }).delivered
}

/** Removes this device's subscription from the API and the browser. Best-effort. */
export async function disablePush(options: { remember?: boolean } = {}): Promise<PushState> {
  if (!isPushSupported()) return 'unsupported'
  if (options.remember) localStorage.setItem(OPT_OUT_KEY, '1')

  const registration = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL)
  const subscription = await registration?.pushManager.getSubscription()
  if (subscription) {
    await fetch('/api/Push/unsubscribe', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    }).catch(() => undefined)
    await subscription.unsubscribe().catch(() => undefined)
  }
  return 'off'
}

/**
 * After sign-in on a device that already granted permission, quietly re-register it (sign-out
 * removes the subscription so a shared browser never alerts the previous manager).
 */
export async function restorePush(): Promise<PushState> {
  if (!isPushSupported() || Notification.permission !== 'granted' || localStorage.getItem(OPT_OUT_KEY)) {
    return getPushState()
  }
  try {
    return await enablePush()
  } catch {
    return getPushState()
  }
}
