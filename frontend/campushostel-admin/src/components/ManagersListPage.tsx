import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FunctionType, type FunctionType as FunctionTypeValue, type ManagerProfile } from '../services/ManagerAuthService'
import {
  fetchAllManagers,
  setManagerFunctions,
  updateManager,
  type ManagerUpdatePayload,
} from '../services/ManagerService'

type EditableFields = Omit<ManagerUpdatePayload, 'tier'> & { tier: 'Standard' | 'Super' }

const functionOptions: { label: string; value: FunctionTypeValue }[] = [
  { label: 'Manage managers', value: FunctionType.ManageManagers },
  { label: 'Manage users', value: FunctionType.ManageUsers },
  { label: 'View reports', value: FunctionType.ViewReports },
  { label: 'Manage properties', value: FunctionType.ManageProperties },
]

function functionLabel(value: FunctionTypeValue) {
  return functionOptions.find((option) => option.value === value)?.label ?? 'Unknown'
}

export function ManagersListPage() {
  const { manager } = useAuth()
  const navigate = useNavigate()

  const [managers, setManagers] = useState<ManagerProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<EditableFields | null>(null)
  const [editFunctions, setEditFunctions] = useState<FunctionTypeValue[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!manager || manager.tier !== 'Super') return

    fetchAllManagers()
      .then(setManagers)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Unable to load managers'))
      .finally(() => setIsLoading(false))
  }, [manager])

  if (!manager) return <Navigate to="/login" replace />
  if (manager.tier !== 'Super') return <Navigate to="/" replace />

  function startEdit(target: ManagerProfile) {
    setEditingId(target.managerId)
    setSaveError(null)
    setEditValues({
      firstName: target.firstName,
      lastName: target.lastName,
      email: target.email,
      phoneNumber: target.phoneNumber,
      tier: target.tier,
      isActive: target.isActive,
    })
    setEditFunctions(target.functions)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValues(null)
    setEditFunctions([])
    setSaveError(null)
  }

  function toggleFunction(value: FunctionTypeValue) {
    setEditFunctions((current) =>
      current.includes(value) ? current.filter((f) => f !== value) : [...current, value],
    )
  }

  async function saveEdit(managerId: string) {
    if (!editValues) return
    setIsSaving(true)
    setSaveError(null)

    try {
      await updateManager(managerId, editValues)
      const updated = await setManagerFunctions(managerId, editFunctions)
      setManagers((current) => current.map((m) => (m.managerId === managerId ? updated : m)))
      setEditingId(null)
      setEditValues(null)
      setEditFunctions([])
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to update manager')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-slate-100 px-6 py-8">
      <div className="flex flex-row items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Managers</p>
          <h1 className="text-2xl font-semibold text-slate-900">All managers</h1>
        </div>
        <div className="flex flex-row gap-2">
          <button className="secondary-button" onClick={() => navigate('/')}>
            Back to dashboard
          </button>
          <button className="primary-button" onClick={() => navigate('/managers/new')}>
            ➕ Add Manager
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        {isLoading && <p className="p-6 text-sm text-slate-500">Loading managers…</p>}
        {loadError && <p className="p-6 text-sm text-red-600">{loadError}</p>}

        {!isLoading && !loadError && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Functions</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((item) => {
                const isEditing = editingId === item.managerId

                return (
                  <tr key={item.managerId} className="border-b border-slate-100 text-slate-800">
                    {isEditing && editValues ? (
                      <>
                        <td className="px-4 py-2">
                          <div className="flex flex-row gap-1">
                            <input
                              className="w-24 rounded border border-slate-300 px-2 py-1"
                              value={editValues.firstName}
                              onChange={(e) =>
                                setEditValues({ ...editValues, firstName: e.target.value })
                              }
                            />
                            <input
                              className="w-24 rounded border border-slate-300 px-2 py-1"
                              value={editValues.lastName}
                              onChange={(e) =>
                                setEditValues({ ...editValues, lastName: e.target.value })
                              }
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2 text-slate-400">{item.username}</td>
                        <td className="px-4 py-2">
                          <input
                            type="email"
                            className="w-48 rounded border border-slate-300 px-2 py-1"
                            value={editValues.email}
                            onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            className="w-32 rounded border border-slate-300 px-2 py-1"
                            value={editValues.phoneNumber}
                            onChange={(e) =>
                              setEditValues({ ...editValues, phoneNumber: e.target.value })
                            }
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            className="rounded border border-slate-300 px-2 py-1"
                            value={editValues.tier}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                tier: e.target.value as 'Standard' | 'Super',
                              })
                            }
                          >
                            <option value="Standard">Standard</option>
                            <option value="Super">Super</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <select
                            className="rounded border border-slate-300 px-2 py-1"
                            value={editValues.isActive ? 'active' : 'inactive'}
                            onChange={(e) =>
                              setEditValues({ ...editValues, isActive: e.target.value === 'active' })
                            }
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-col gap-1">
                            {functionOptions.map((option) => (
                              <label
                                key={option.value}
                                className="flex items-center gap-1 whitespace-nowrap text-xs text-slate-700"
                              >
                                <input
                                  type="checkbox"
                                  checked={editFunctions.includes(option.value)}
                                  onChange={() => toggleFunction(option.value)}
                                />
                                {option.label}
                              </label>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-row gap-2">
                            <button
                              className="primary-button flex items-center h-8"
                              disabled={isSaving}
                              onClick={() => saveEdit(item.managerId)}
                            >
                              {isSaving ? 'Saving…' : 'Save'}
                            </button>
                            <button className="secondary-button flex items-center h-8" disabled={isSaving} onClick={cancelEdit}>
                              Cancel
                            </button>
                          </div>
                          {saveError && <p className="mt-1 text-xs text-red-600">{saveError}</p>}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2">
                          {item.firstName} {item.lastName}
                        </td>
                        <td className="px-4 py-2">{item.username}</td>
                        <td className="px-4 py-2">{item.email}</td>
                        <td className="px-4 py-2">{item.phoneNumber}</td>
                        <td className="px-4 py-2">{item.tier}</td>
                        <td className="px-4 py-2">
                          <span
                            className={
                              item.isActive
                                ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700'
                                : 'rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700'
                            }
                          >
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-600">
                          {item.functions.length > 0 ? item.functions.map(functionLabel).join(', ') : 'None'}
                        </td>
                        <td className="px-4 py-2">
                          <button className="primary-button h-8 flex items-center" onClick={() => startEdit(item)}>
                            Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
