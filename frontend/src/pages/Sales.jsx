import { useEffect, useState } from 'react'
import api from '../services/api'
import ReturnModal from '../components/ReturnModal'
import ExportButtons from '../components/ExportButtons'

const fmt = (n) => Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
const PAYMENT = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', credit: 'Crédito' }

const STATUS_CFG = {
  completed:  { label: 'Completada',       cls: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'Cancelada',        cls: 'bg-red-100 text-red-600' },
  returned:   { label: 'Devuelta',         cls: 'bg-gray-100 text-gray-600' },
}

function StatusBadge({ status, hasReturns }) {
  const cfg = STATUS_CFG[status] || { label: status, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className="flex gap-1 flex-wrap">
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>
      {hasReturns && status !== 'returned' && (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Con devoluciones</span>
      )}
    </span>
  )
}

export default function Sales() {
  const [sales, setSales] = useState([])
  const [selected, setSelected] = useState(null)
  const [returns, setReturns] = useState([])
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    const { data } = await api.get('/sales/')
    setSales(data)
  }

  const loadDetail = async (sale) => {
    const [saleRes, returnsRes] = await Promise.all([
      api.get(`/sales/${sale.id}`),
      api.get(`/sales/${sale.id}/returns`),
    ])
    setSelected(saleRes.data)
    setReturns(returnsRes.data)
  }

  useEffect(() => { load() }, [])

  const cancel = async (id) => {
    if (!confirm('¿Cancelar esta venta? El stock será devuelto.')) return
    try {
      await api.post(`/sales/${id}/cancel`)
      setMsg('✅ Venta cancelada y stock devuelto')
      setSelected(null)
      load()
    } catch (err) {
      setMsg(`❌ ${err.response?.data?.detail || 'Error al cancelar'}`)
    }
  }

  const handleReturnSuccess = async () => {
    setShowReturnModal(false)
    setMsg('✅ Devolución procesada correctamente')
    await loadDetail(selected)
    load()
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Lista */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Ventas registradas</h2>
          <ExportButtons
            excelUrl="/export/sales/excel"
            pdfUrl="/export/sales/pdf"
            excelName={`ventas_${new Date().toISOString().slice(0,10)}.xlsx`}
            pdfName={`ventas_${new Date().toISOString().slice(0,10)}.pdf`}
          />
        </div>
        {msg && <div className="p-3 bg-white rounded shadow text-sm">{msg}</div>}
        <div className="bg-white rounded-xl shadow overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>{['#','Fecha','Cliente','Total','Pago','Estado',''].map((h) => (
                <th key={h} className="px-4 py-2 text-left">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}
                  className={`border-t cursor-pointer hover:bg-indigo-50 ${selected?.id === s.id ? 'bg-indigo-50' : ''}`}
                  onClick={() => loadDetail(s)}>
                  <td className="px-4 py-2 text-gray-400">#{s.id}</td>
                  <td className="px-4 py-2">{new Date(s.created_at).toLocaleString('es-MX')}</td>
                  <td className="px-4 py-2">{s.customer_name || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-2 font-medium">{fmt(s.total)}</td>
                  <td className="px-4 py-2">{PAYMENT[s.payment_method] || s.payment_method}</td>
                  <td className="px-4 py-2"><StatusBadge status={s.status} hasReturns={s.has_returns} /></td>
                  <td className="px-4 py-2">
                    {s.status === 'completed' && (
                      <button onClick={(e) => { e.stopPropagation(); cancel(s.id) }}
                        className="text-red-500 hover:underline text-xs">Cancelar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalle */}
      {selected && (
        <div className="w-80 bg-white rounded-xl shadow p-4 space-y-3 text-sm overflow-auto">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base">Venta #{selected.id}</h3>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <p className="text-gray-500">{new Date(selected.created_at).toLocaleString('es-MX')}</p>
          {selected.customer_name && <p className="text-indigo-600">👤 {selected.customer_name}</p>}
          <p>Pago: {PAYMENT[selected.payment_method]}</p>
          <StatusBadge status={selected.status} hasReturns={selected.has_returns} />

          <div className="border-t pt-2 space-y-1">
            {selected.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.quantity}x {item.name || `#${item.product_id}`}</span>
                <span>{fmt(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 space-y-1">
            {selected.discount > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Descuento</span><span>-{fmt(selected.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base">
              <span>Total</span><span>{fmt(selected.total)}</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="space-y-2 pt-1">
            {selected.status === 'completed' && (
              <>
                <button onClick={() => setShowReturnModal(true)}
                  className="w-full bg-yellow-500 text-white py-1.5 rounded hover:bg-yellow-600 text-sm">
                  📦 Devolución parcial
                </button>
                <button onClick={() => cancel(selected.id)}
                  className="w-full bg-red-500 text-white py-1.5 rounded hover:bg-red-600 text-sm">
                  Cancelar venta
                </button>
              </>
            )}
          </div>

          {/* Historial de devoluciones */}
          {returns.length > 0 && (
            <div className="border-t pt-3 space-y-2">
              <p className="font-medium text-sm">Devoluciones realizadas</p>
              {returns.map((r) => (
                <div key={r.id} className="bg-yellow-50 rounded p-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{new Date(r.created_at).toLocaleString('es-MX')}</span>
                    <span className="font-medium text-yellow-700">-{fmt(r.total_refunded)}</span>
                  </div>
                  {r.items.map((ri) => (
                    <div key={ri.id} className="flex justify-between text-gray-600">
                      <span>{ri.quantity}x item #{ri.sale_item_id}</span>
                      <span>{fmt(ri.quantity * ri.unit_price)}</span>
                    </div>
                  ))}
                  {r.notes && <p className="text-gray-400 italic">{r.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal devolución */}
      {showReturnModal && selected && (
        <ReturnModal
          sale={selected}
          onClose={() => setShowReturnModal(false)}
          onSuccess={handleReturnSuccess}
        />
      )}
    </div>
  )
}
