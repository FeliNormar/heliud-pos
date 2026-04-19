import { useState, useEffect } from 'react'
import api from '../services/api'

const fmt = (n) => Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

export default function ReturnModal({ sale, onClose, onSuccess }) {
  const [quantities, setQuantities] = useState({})
  const [notes, setNotes] = useState('')
  const [alreadyReturned, setAlreadyReturned] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Cargar devoluciones previas para calcular máximos
    api.get(`/sales/${sale.id}/returns`).then(({ data }) => {
      const map = {}
      data.forEach((r) => r.items.forEach((ri) => {
        map[ri.sale_item_id] = (map[ri.sale_item_id] || 0) + ri.quantity
      }))
      setAlreadyReturned(map)
    })
    // Init quantities a 0
    const init = {}
    sale.items.forEach((i) => { init[i.id] = 0 })
    setQuantities(init)
  }, [sale.id])

  const maxFor = (item) => item.quantity - (alreadyReturned[item.id] || 0)

  const totalRefund = sale.items.reduce((acc, item) => {
    const unitPrice = item.quantity > 0 ? item.subtotal / item.quantity : 0
    return acc + (quantities[item.id] || 0) * unitPrice
  }, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const items = sale.items
      .filter((i) => (quantities[i.id] || 0) > 0)
      .map((i) => ({ sale_item_id: i.id, quantity: quantities[i.id] }))
    if (!items.length) return setError('Selecciona al menos un producto a devolver')
    setLoading(true)
    try {
      await api.post(`/sales/${sale.id}/returns`, { items, notes: notes || null })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al procesar devolución')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Devolución parcial — Venta #{sale.id}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                {['Producto', 'Original', 'Ya devuelto', 'A devolver'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => {
                const max = maxFor(item)
                const done = max === 0
                return (
                  <tr key={item.id} className={`border-t ${done ? 'opacity-40' : ''}`}>
                    <td className="px-3 py-2">{item.name || `#${item.product_id}`}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">{alreadyReturned[item.id] || 0}</td>
                    <td className="px-3 py-2">
                      {done
                        ? <span className="text-xs text-gray-400">Ya devuelto</span>
                        : <input type="number" min={0} max={max}
                            value={quantities[item.id] || 0}
                            onChange={(e) => setQuantities({ ...quantities, [item.id]: Math.min(Number(e.target.value), max) })}
                            className="border rounded px-2 py-1 w-16 text-sm" />
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <input value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas (opcional)" className="w-full border rounded px-3 py-1.5 text-sm" />

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Total a reembolsar:</span>
            <span className="font-bold text-lg text-indigo-600">{fmt(totalRefund)}</span>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded bg-gray-100 text-sm hover:bg-gray-200">Cancelar</button>
            <button type="submit" disabled={loading || totalRefund === 0}
              className="px-4 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Procesando...' : 'Confirmar devolución'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
