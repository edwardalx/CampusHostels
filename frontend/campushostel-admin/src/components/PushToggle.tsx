import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { disablePush, enablePush, getPushState, restorePush, sendTestPush, type PushState } from '../services/pushService'

const labels: Record<PushState, string> = {
  unsupported: 'Alerts not supported on this browser',
  blocked: 'Alerts blocked in browser settings',
  off: 'Turn on alerts',
  on: 'Turn off alerts',
}

export function PushToggle() {
  const { manager } = useAuth()
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void restorePush().then(setState)
  }, [])

  if (state === null) return null

  async function toggle() {
    setBusy(true)
    setError('')
    try {
      setState(state === 'on' ? await disablePush({ remember: true }) : await enablePush())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setState(await getPushState())
    } finally {
      setBusy(false)
    }
  }

  async function test() {
    setBusy(true)
    setError('')
    try {
      const delivered = await sendTestPush()
      if (delivered === 0) setError('No device accepted the test. Try turning alerts off and on.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        className="nav-item"
        disabled={busy || state === 'unsupported' || state === 'blocked'}
        onClick={toggle}
        type="button"
      >
        {labels[state]}
      </button>
      {state === 'on' && manager?.tier === 'Super' && (
        <button className="nav-item" disabled={busy} onClick={test} type="button">
          Send test alert
        </button>
      )}
      {error && <span role="alert">{error}</span>}
    </>
  )
}
