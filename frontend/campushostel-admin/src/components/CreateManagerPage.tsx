import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createManager, setManagerFunctions } from '../services/ManagerService'
import { FunctionType, type FunctionType as FunctionTypeValue, type ManagerTier } from '../type/manager'

const functionOptions: { label: string; value: FunctionTypeValue }[] = [
  { label: 'Manage managers', value: FunctionType.ManageManagers },
  { label: 'Manage users', value: FunctionType.ManageUsers },
  { label: 'View reports', value: FunctionType.ViewReports },
  { label: 'Manage properties', value: FunctionType.ManageProperties },
]

export function CreateManagerPage() {
  const { manager } = useAuth()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [tier, setTier] = useState<ManagerTier>('Standard')
  const [functions, setFunctions] = useState<FunctionTypeValue[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!manager) return <Navigate to="/login" replace />
  if (manager.tier !== 'Super') return <Navigate to="/" replace />

  function toggleFunction(value: FunctionTypeValue) {
    setFunctions((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const profile = await createManager({
        firstName,
        lastName,
        username,
        email,
        phoneNumber,
        password,
        tier,
      })

      if (functions.length > 0) {
        await setManagerFunctions(profile.managerId, functions)
      }

      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create manager')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-lg flex-col gap-5 rounded-2xl bg-white p-8 shadow-sm"
      >
        <div>
          <p className="text-sm font-medium text-slate-500">Managers</p>
          <h1 className="text-2xl font-semibold text-slate-900">Add manager</h1>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            First name
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Last name
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Username
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Phone number
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Temporary password
          <input
            type="password"
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Tier
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
            value={tier}
            onChange={(e) => setTier(e.target.value as 'Standard' | 'Super')}
          >
            <option value="Standard">Standard</option>
            <option value="Super">Super</option>
          </select>
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-slate-700">Functions</legend>
          <div className="grid grid-cols-2 gap-2">
            {functionOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={functions.includes(option.value)}
                  onChange={() => toggleFunction(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-row justify-end gap-2">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate('/')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create manager'}
          </button>
        </div>
      </form>
    </div>
  )
}
