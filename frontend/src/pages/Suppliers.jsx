import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import Toast from '../components/Toast'

const empty = { name: '', contact_name: '', phone: '', email: '', address: '', tax_id: '', notes: '' }

function Modal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || empty)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return setError('Email inválido')
    }
    setSaving(true)
    try {
      await onSave(form)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">{initial ? 'Editar proveedor' : 'Nuevo proveedor'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-500">Nombre *</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} required
                className="w-full border rounded px-3 py-1.5 text-sm mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Nombre de contacto</label>
              <input value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)}
                className="w-full border rounded px-3 py-1.5 text-sm mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Teléfono</label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
                className="w-full border rounded px-3 py-1.5 text-sm mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Email</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                className="w-full border rounded px-3 py-1.5 text-sm mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-gray-500">RFC / Tax ID</label>
              <input value={form.tax_id} onChange={(e) => set('tax_id', e.target.value.toUpperCase())}
                className="w-full border rounded px-3 py-1.5 text-sm mt-0.5 font-mono" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500">Dirección</label>
              <input value={form.address} onChange={(e) => set('address', e.target.value)}
                className="w-full border rounded px-3 py-1.5 text-sm mt-0.5" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500">Notas</label>
              <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3}
                className="w-full border rounded px-3 py-1.5 text-sm mt-0.5 resize-none" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded bg-gray-100 text-sm hover:bg-gray-200">Cancelar</button>
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

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [modal, setModal] = useState(null) // null | 'create' | supplier obj
  const [toast, setToast] = useState(null)
  const debounceRef = useRef(null)
  const PAGE_SIZE = 20

  const load = async (q = search, p = page) => {
    const params = new URLSearchParams({ page: p, page_size: PAGE_SIZE })
    if (q) params.append('search', q)
    const { data } = await api.get(`/suppliers/?${params}`)
    setSuppliers(data)
    setHasMore(data.length === PAGE_SIZE)
  }

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setPage(1); load(search, 1) }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  useEffect(() => { load() }, [page])

  const showToast = (message, type = 'success') => setToast({ message, type })

  const handleSave = async (form) => {
    const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
    if (modal === 'create') {
      await api.post('/suppliers/', payload)
      showToast('Proveedor creado correctamente')
    } else {
      await api.put(`/suppliers/${modal.id}`, payload)
      showToast('Proveedor actualizado')
    }
    setModal(null)
    load()
  }

  const handleDeactivate = async (s) => {
    if (!confirm(`¿Desactivar a "${s.name}"?`)) return
    try {
      await api.delete(`/suppliers/${s.id}`)
      showToast('Proveedor desactivado')
      load()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Proveedores</h2>
        <button onClick={() => setModal('create')}
          className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
          + Nuevo proveedor
        </button>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, contacto o RFC..."
        className="border rounded px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-400" />

      <div className="bg-white rounded-xl shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>{['Nombre', 'Contacto', 'Teléfono', 'Email', 'RFC', 'Estado', 'Acciones'].map((h) => (
              <th key={h} className="px-4 py-2 text-left">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {suppliers.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">Sin proveedores</td></tr>
            )}
            {suppliers.map((s) => (
              <tr key={s.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{s.name}</td>
                <td className="px-4 py-2 text-gray-600">{s.contact_name || '—'}</td>
                <td className="px-4 py-2">{s.phone || '—'}</td>
                <td className="px-4 py-2">{s.email || '—'}</td>
                <td className="px-4 py-2 font-mono text-xs">{s.tax_id || '—'}</td>
                <td className="px-4 py-2">
                  {s.is_active
                    ? <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Activo</span>
                    : <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">Inactivo</span>}
                </td>
                <td className="px-4 py-2 space-x-2">
                  <button onClick={() => setModal(s)} className="text-indigo-600 hover:underline text-xs">Editar</button>
                  {s.is_active && (
                    <button onClick={() => handleDeactivate(s)} className="text-red-500 hover:underline text-xs">Desactivar</button>
                  )}
                  <Link to={`/purchase-orders?supplier_id=${s.id}`} className="text-green-600 hover:underline text-xs">Órdenes</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex gap-2 justify-end text-sm">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
          className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-50">← Anterior</button>
        <span className="px-3 py-1 text-gray-500">Página {page}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={!hasMore}
          className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-50">Siguiente →</button>
      </div>

      {modal && (
        <Modal
          initial={modal === 'create' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
