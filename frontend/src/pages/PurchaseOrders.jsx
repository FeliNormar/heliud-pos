import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Toast from '../components/Toast'

const STATUS = {
  draft:      { label: 'Borrador',   cls: 'bg-gray-100 text-gray-600' },
  sent:       { label: 'Enviada',    cls: 'bg-yellow-100 text-yellow-700' },
  received:   { label: 'Recibida',   cls: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'Cancelada',  cls: 'bg-red-100 text-red-600' },
}
const fmt = (n) => n != null ? Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : '—'

function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, cls: 'bg-gray-100 text-gray-500' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
}

function CreateModal({ onClose, onCreated }) {
  const [suppliers, setSuppliers] = useState([])
  const [supplierId, setSupplierId] = useState('')
  const [items, setItems] = useState([])
  const [notes, setNotes] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef(null)

  useEffect(() => {
    api.get('/suppliers/?page_size=100').then(({ data }) => setSuppliers(data))
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (productSearch.length < 2) return setProductResults([])
    debounceRef.current = setTimeout(async () => {
      const { data } = await api.get(`/products/?search=${productSearch}`)
      setProductResults(data)
    }, 300)
  }, [productSearch])

  const addProduct = (p) => {
    if (items.find((i) => i.product_id === p.id)) return
    setItems([...items, { product_id: p.id, name: p.name, quantity_ordered: 1, unit_cost_estimated: p.cost || 0 }])
    setProductSearch('')
    setProductResults([])
  }

  const updateItem = (idx, field, val) =>
    setItems(items.map((it, i) => i === idx ? { ...it, [field]: Number(val) } : it))

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx))

  const total = items.reduce((acc, i) => acc + i.quantity_ordered * i.unit_cost_estimated, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!supplierId) return setError('Selecciona un proveedor')
    if (!items.length) return setError('Agrega al menos un producto')
    setSaving(true)
    try {
      await api.post('/purchase-orders/', {
        supplier_id: Number(supplierId),
        notes: notes || null,
        items: items.map(({ product_id, quantity_ordered, unit_cost_estimated }) =>
          ({ product_id, quantity_ordered, unit_cost_estimated }))
      })
      onCreated()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Nueva orden de compra</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500">Proveedor *</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
              className="w-full border rounded px-3 py-1.5 text-sm mt-0.5" required>
              <option value="">Seleccionar...</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="relative">
            <label className="text-xs text-gray-500">Agregar producto</label>
            <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Buscar producto..." className="w-full border rounded px-3 py-1.5 text-sm mt-0.5" />
            {productResults.length > 0 && (
              <ul className="absolute z-10 bg-white border rounded shadow w-full max-h-40 overflow-auto">
                {productResults.map((p) => (
                  <li key={p.id} onClick={() => addProduct(p)}
                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm flex justify-between">
                    <span>{p.name}</span>
                    <span className="text-gray-400">${p.cost?.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>{['Producto','Cantidad','Costo unit.','Subtotal',''].map((h) => (
                  <th key={h} className="px-2 py-1 text-left">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-2 py-1">{item.name}</td>
                    <td className="px-2 py-1">
                      <input type="number" min={1} value={item.quantity_ordered}
                        onChange={(e) => updateItem(idx, 'quantity_ordered', e.target.value)}
                        className="border rounded px-1 py-0.5 w-16 text-sm" />
                    </td>
                    <td className="px-2 py-1">
                      <input type="number" min={0} step="0.01" value={item.unit_cost_estimated}
                        onChange={(e) => updateItem(idx, 'unit_cost_estimated', e.target.value)}
                        className="border rounded px-1 py-0.5 w-20 text-sm" />
                    </td>
                    <td className="px-2 py-1">{fmt(item.quantity_ordered * item.unit_cost_estimated)}</td>
                    <td className="px-2 py-1">
                      <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Total estimado:</span>
            <span className="font-bold text-indigo-600">{fmt(total)}</span>
          </div>

          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas (opcional)" rows={2}
            className="w-full border rounded px-3 py-1.5 text-sm resize-none" />

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100 text-sm">Cancelar</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Creando...' : 'Crear orden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [filterSupplier, setFilterSupplier] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()
  const PAGE_SIZE = 20

  const load = async () => {
    const params = new URLSearchParams({ page, page_size: PAGE_SIZE })
    if (filterSupplier) params.append('supplier_id', filterSupplier)
    if (filterStatus) params.append('status', filterStatus)
    const { data } = await api.get(`/purchase-orders/?${params}`)
    setOrders(data)
    setHasMore(data.length === PAGE_SIZE)
  }

  useEffect(() => {
    api.get('/suppliers/?page_size=100').then(({ data }) => setSuppliers(data))
  }, [])

  useEffect(() => { load() }, [page, filterSupplier, filterStatus])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Órdenes de compra</h2>
        <button onClick={() => setShowCreate(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
          + Nueva orden
        </button>
      </div>

      <div className="flex gap-3">
        <select value={filterSupplier} onChange={(e) => { setFilterSupplier(e.target.value); setPage(1) }}
          className="border rounded px-3 py-1.5 text-sm">
          <option value="">Todos los proveedores</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
          className="border rounded px-3 py-1.5 text-sm">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>{['#','Proveedor','Fecha','Estado','Total estimado','Total real',''].map((h) => (
              <th key={h} className="px-4 py-2 text-left">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">Sin órdenes</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/purchase-orders/${o.id}`)}>
                <td className="px-4 py-2 text-gray-400">#{o.id}</td>
                <td className="px-4 py-2 font-medium">{o.supplier_name}</td>
                <td className="px-4 py-2">{new Date(o.created_at).toLocaleDateString('es-MX')}</td>
                <td className="px-4 py-2"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-2">{fmt(o.total_estimated)}</td>
                <td className="px-4 py-2">{fmt(o.total_actual)}</td>
                <td className="px-4 py-2 text-indigo-600 text-xs hover:underline">Ver →</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 justify-end text-sm">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
          className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-50">← Anterior</button>
        <span className="px-3 py-1 text-gray-500">Página {page}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={!hasMore}
          className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-50">Siguiente →</button>
      </div>

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); setToast({ message: 'Orden creada', type: 'success' }) }} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
