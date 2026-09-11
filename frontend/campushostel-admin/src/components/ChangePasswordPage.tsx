import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { manager, changePassword } = useAuth()
  const navigate = useNavigate()

  if (!manager) return <Navigate to="/login" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match')
      return
    }

    setIsSubmitting(true)
    try {
      await changePassword({ currentPassword, newPassword })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to change password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>CampusHostels Admin</h1>
        <p className="eyebrow">
          {manager.mustChangePassword
            ? 'You must set a new password before continuing'
            : 'Change your password'}
        </p>

        <label>
          Current password
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </label>

        <label>
          New password
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>

        <label>
          Confirm new password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>

        {error && <p className="login-error">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
