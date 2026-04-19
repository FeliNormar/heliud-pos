import { useEffect, useState, useRef } from 'react'
import api from '../services/api'
import Toast from '../components/Toast'
import { useAuthStore } from '../store/authStore'

const ROLE_CFG = {
  admin:   { label: 'Admin',   cls: 'bg-purple-100 text-purple-700' },
  cashier: { label: 'Cajero',  cls: 'bg-blue-100 text-blue-700' },
}

function RoleBadge({ role }) {
  const r = ROLE_CFG[role] || { label: role, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.cls}`}>{r.label}</span>
}

function UserModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial || { username: '', email: '', password: '', role: 'cashier' }
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const isEdit = !!initial

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return setError('Email inválido')
    if (!isEdit && form.password.length < 8)
      return setError('La contraseña debe tener al menos 8 caracteres')
    setSaving(true)
    try { await onSave(form) }
    catch (err) { setError(err.response?.data?.detail || 'Error al guardar') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Username *</label>
            <input value={form.username} onChange={(e) => set('username', e.target.value)} required
              className="w-full border rounded px-3 py-1.5 text-sm mt-0.5" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
              className="w-full border rounded px-3 py-1.5 text-sm mt-0.5" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Rol</label>
            <select value={form.role} onChange={(e) => set('role', e.target.value)}
              className="w-full border rounded px-3 py-1.5 text-sm mt-0.5">
              <option value="cashier">Cajero</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {!isEdit && (
            <div>
              <label className="text-xs text-gray-500">Contraseña * (mín. 8 caracteres)</label>
              <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)}
                required minLength={8} className="w-full border rounded px-3 py-1.5 text-sm mt-0.5" />
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100 text-sm">Cancelar</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ResetPasswordModal({ user, onClose, onDone }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) return setError('Mínimo 8 caracteres')
    setSaving(true)
    try {
      await api.post(`/users/${user.id}/reset-password`, { new_password: password })
      onDone()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold">Resetear contraseña — {user.username}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Nueva contraseña *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required minLength={8} className="w-full border rounded px-3 py-1.5 text-sm mt-0.5" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100 text-sm">Cancelar</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Resetear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)       // null | 'create' | user obj
  const [resetUser, setResetUser] = useState(null)
  const [toast, setToast] = useState(null)
  const { username: currentUsername } = useAuthStore()
  const debounceRef = useRef(null)

  const load = async (q = search) => {
    const params = q ? `?search=${q}` : ''
    const { data } = await api.get(`/users/${params}`)
    setUsers(data)
  }

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => load(search), 300)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  const showToast = (message, type = 'success') => setToast({ message, type })

  const handleSave = async (form) => {
    if (modal === 'create') {
      await api.post('/users/', form)
      showToast('Usuario creado')
    } else {
      const { password, ...rest } = form
      await api.put(`/users/${modal.id}`, rest)
      showToast('Usuario actualizado')
    }
    setModal(null)
    load()
  }

  const toggleActive = async (user) => {
    const action = user.is_active ? 'desactivar' : 'activar'
    if (!confirm(`¿${action} al usuario "${user.username}"?`)) return
    try {
      await api.post(`/users/${user.id}/toggle-active`)
      showToast(`Usuario ${action === 'activar' ? 'activado' : 'desactivado'}`)
      load()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Usuarios</h2>
        <button onClick={() => setModal('create')}
          className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
          + Nuevo usuario
        </button>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por username o email..."
        className="border rounded px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-400" />

      <div className="bg-white rounded-xl shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>{['Username','Email','Rol','Estado','Creado','Acciones'].map((h) => (
              <th key={h} className="px-4 py-2 text-left">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Sin usuarios</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{u.username}</td>
                <td className="px-4 py-2 text-gray-500">{u.email || '—'}</td>
                <td className="px-4 py-2"><RoleBadge role={u.role} /></td>
                <td className="px-4 py-2">
                  {u.is_active
                    ? <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Activo</span>
                    : <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">Inactivo</span>}
                </td>
                <td className="px-4 py-2 text-gray-400">{new Date(u.created_at).toLocaleDateString('es-MX')}</td>
                <td className="px-4 py-2 flex gap-2 flex-wrap">
                  <button onClick={() => setModal(u)} className="text-indigo-600 hover:underline text-xs">Editar</button>
                  <button onClick={() => setResetUser(u)} className="text-orange-500 hover:underline text-xs">Reset pwd</button>
                  {u.username !== currentUsername && (
                    <button onClick={() => toggleActive(u)}
                      className={`text-xs hover:underline ${u.is_active ? 'text-red-500' : 'text-green-600'}`}>
                      {u.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <UserModal
          initial={modal === 'create' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onDone={() => { setResetUser(null); showToast('Contraseña actualizada') }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
