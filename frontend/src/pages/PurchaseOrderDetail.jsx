import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import Toast from '../components/Toast'

const STATUS = {
  draft:      { label: 'Borrador',   cls: 'bg-gray-100 text-gray-600' },
  sent:       { label: 'Enviada',    cls: 'bg-yellow-100 text-yellow-700' },
  received:   { label: 'Recibida',   cls: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'Cancelada',  cls: 'bg-red-100 text-red-600' },
}
const fmt = (n) => n != null ? Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : '—'

function ReceiveModal({ order, onClose, onReceived }) {
  const [items, setItems] = useState(
    order.items.map((i) => ({
      item_id: i.id,
      name: i.product_name,
      quantity_ordered: i.quantity_ordered,
      unit_cost_estimated: i.unit_cost_estimated,
      quantity_received: i.quantity_ordered,
      unit_cost_actual: i.unit_cost_estimated,
    }))
  )
  const [notes, setNotes] = useState(order.notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (idx, field, val) =>
    setItems(items.map((it, i) => i === idx ? { ...it, [field]: Number(val) } : it))

  const totalActual = items.reduce((acc, i) => acc + i.quantity_received * i.unit_cost_actual, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/purchase-orders/${order.id}/receive`, {
        items: items.map(({ item_id, quantity_received, unit_cost_actual }) =>
          ({ item_id, quantity_received, unit_cost_actual })),
        notes: notes || null,
      })
      onReceived()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al recibir')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Recibir mercancía — Orden #{order.id}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>{['Producto','Pedido','Cant. recibida','Costo real','Subtotal real'].map((h) => (
                <th key={h} className="px-2 py-1 text-left">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-2 py-1">{item.name}</td>
                  <td className="px-2 py-1 text-gray-500">{item.quantity_ordered}</td>
                  <td className="px-2 py-1">
                    <input type="number" min={0} max={item.quantity_ordered} value={item.quantity_received}
                      onChange={(e) => update(idx, 'quantity_received', e.target.value)}
                      className="border rounded px-1 py-0.5 w-16 text-sm" />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" min={0} step="0.01" value={item.unit_cost_actual}
                      onChange={(e) => update(idx, 'unit_cost_actual', e.target.value)}
                      className="border rounded px-1 py-0.5 w-20 text-sm" />
                  </td>
                  <td className="px-2 py-1 font-medium">{fmt(item.quantity_received * item.unit_cost_actual)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Total real:</span>
            <span className="font-bold text-green-600 text-lg">{fmt(totalActual)}</span>
          </div>

          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas (opcional)" rows={2}
            className="w-full border rounded px-3 py-1.5 text-sm resize-none" />

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100 text-sm">Cancelar</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Procesando...' : 'Confirmar recepción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PurchaseOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [showReceive, setShowReceive] = useState(false)
  const [toast, setToast] = useState(null)

  const load = async () => {
    const { data } = await api.get(`/purchase-orders/${id}`)
    setOrder(data)
  }

  useEffect(() => { load() }, [id])

  const action = async (endpoint, confirmMsg) => {
    if (confirmMsg && !confirm(confirmMsg)) return
    try {
      await api.post(`/purchase-orders/${id}/${endpoint}`)
      load()
      setToast({ message: `Orden ${endpoint === 'send' ? 'enviada' : 'cancelada'}`, type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Error', type: 'error' })
    }
  }

  if (!order) return <p className="text-gray-400 text-sm">Cargando...</p>

  const s = STATUS[order.status] || { label: order.status, cls: 'bg-gray-100' }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/purchase-orders')} className="text-indigo-600 hover:underline text-sm">← Órdenes</button>
        <h2 className="text-xl font-bold">Orden #{order.id}</h2>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl shadow p-4 grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-gray-500">Proveedor:</span> <span className="font-medium">{order.supplier_name}</span></div>
        <div><span className="text-gray-500">Creada:</span> {new Date(order.created_at).toLocaleString('es-MX')}</div>
        {order.received_at && <div><span className="text-gray-500">Recibida:</span> {new Date(order.received_at).toLocaleString('es-MX')}</div>}
        {order.notes && <div className="col-span-2"><span className="text-gray-500">Notas:</span> {order.notes}</div>}
        <div><span className="text-gray-500">Total estimado:</span> <span className="font-medium">{fmt(order.total_estimated)}</span></div>
        {order.total_actual != null && <div><span className="text-gray-500">Total real:</span> <span className="font-medium text-green-600">{fmt(order.total_actual)}</span></div>}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl shadow overflow-auto">
        <div className="px-4 py-3 border-b font-medium text-sm">Productos</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>{['Producto','Cant. pedida','Costo est.','Cant. recibida','Costo real','Subtotal'].map((h) => (
              <th key={h} className="px-4 py-2 text-left">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-2">{item.product_name}</td>
                <td className="px-4 py-2">{item.quantity_ordered}</td>
                <td className="px-4 py-2">{fmt(item.unit_cost_estimated)}</td>
                <td className="px-4 py-2">{item.quantity_received ?? '—'}</td>
                <td className="px-4 py-2">{item.unit_cost_actual != null ? fmt(item.unit_cost_actual) : '—'}</td>
                <td className="px-4 py-2 font-medium">
                  {item.quantity_received != null
                    ? fmt(item.quantity_received * item.unit_cost_actual)
                    : fmt(item.quantity_ordered * item.unit_cost_estimated)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Acciones */}
      <div className="flex gap-3">
        {order.status === 'draft' && <>
          <button onClick={() => action('send')}
            className="bg-yellow-500 text-white px-4 py-2 rounded text-sm hover:bg-yellow-600">Enviar orden</button>
          <button onClick={() => action('cancel', '¿Cancelar esta orden?')}
            className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600">Cancelar</button>
        </>}
        {order.status === 'sent' && <>
          <button onClick={() => setShowReceive(true)}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">Recibir mercancía</button>
          <button onClick={() => action('cancel', '¿Cancelar esta orden?')}
            className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600">Cancelar</button>
        </>}
      </div>

      {showReceive && (
        <ReceiveModal order={order} onClose={() => setShowReceive(false)}
          onReceived={() => { setShowReceive(false); load(); setToast({ message: 'Mercancía recibida y stock actualizado', type: 'success' }) }} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
