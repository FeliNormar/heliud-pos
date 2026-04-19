import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

const fmt = (n) => n != null ? Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : '—'
const PAYMENT_LABEL = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', credit: 'Crédito' }

function OpenModal({ onClose, onDone }) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/cash-register/open', { opening_amount: Number(amount), notes: notes || null })
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
          <h3 className="font-bold text-lg">Abrir caja</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Fondo inicial *</label>
            <input type="number" min="0" step="0.01" value={amount}
              onChange={(e) => setAmount(e.target.value)} required
              className="w-full border rounded px-3 py-1.5 text-sm mt-0.5" placeholder="$0.00" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Notas</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-1.5 text-sm mt-0.5" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100 text-sm">Cancelar</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Abriendo...' : 'Abrir caja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CloseModal({ register, onClose, onDone }) {
  const [closing, setClosing] = useState('')
  const [notes, setNotes] = useState('')
  const [summary, setSummary] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/cash-register/${register.id}`).then(({ data }) => setSummary(data))
  }, [register.id])

  const expected = summary?.expected_cash ?? 0
  const counted = parseFloat(closing) || 0
  const diff = counted - expected
  const diffColor = diff >= 0 ? 'text-green-600' : 'text-red-600'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/cash-register/close', { closing_amount: counted, notes: notes || null })
      onDone()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Cerrar caja</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {summary && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
            <p className="font-medium text-gray-600">Resumen del turno</p>
            <div className="space-y-1">
              {Object.entries(summary.by_method || {}).map(([method, total]) => (
                <div key={method} className="flex justify-between">
                  <span className="text-gray-500">{PAYMENT_LABEL[method] || method}</span>
                  <span>{fmt(total)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 flex justify-between font-medium">
              <span>Ventas ({summary.sales_count})</span>
              <span>{fmt(Object.values(summary.by_method || {}).reduce((a, b) => a + b, 0))}</span>
            </div>
            {summary.cash_returns > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Devoluciones efectivo</span>
                <span>-{fmt(summary.cash_returns)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-indigo-600">
              <span>Efectivo esperado</span>
              <span>{fmt(expected)}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Efectivo contado *</label>
            <input type="number" min="0" step="0.01" value={closing}
              onChange={(e) => setClosing(e.target.value)} required
              className="w-full border rounded px-3 py-1.5 text-sm mt-0.5" placeholder="$0.00" />
          </div>
          {closing !== '' && (
            <div className={`flex justify-between font-bold text-sm ${diffColor}`}>
              <span>Diferencia</span>
              <span>{diff >= 0 ? '+' : ''}{fmt(diff)}</span>
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500">Notas</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-1.5 text-sm mt-0.5" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100 text-sm">Cancelar</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50">
              {saving ? 'Cerrando...' : 'Cerrar caja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CashRegisterWidget({ onChanged }) {
  const [current, setCurrent] = useState(undefined) // undefined=loading, null=no hay
  const [modal, setModal] = useState(null) // null | 'open' | 'close'
  const { role } = useAuthStore()
  const isAdmin = role === 'admin'

  const load = async () => {
    try {
      const { data } = await api.get('/cash-register/current')
      setCurrent(data ?? null)
    } catch {
      setCurrent(null)
    }
  }

  useEffect(() => { load() }, [])

  const handleDone = () => { setModal(null); load(); onChanged?.() }

  // Mientras carga mostramos un placeholder mínimo en lugar de null
  if (current === undefined) {
    return <div className="rounded-xl p-4 text-sm bg-gray-50 border border-gray-200 text-gray-400">Verificando caja...</div>
  }

  return (
    <>
      <div className={`rounded-xl p-4 text-sm flex items-center justify-between shadow
        ${current ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
        <div>
          <p className={`font-bold ${current ? 'text-green-700' : 'text-gray-500'}`}>
            {current ? '🟢 Turno activo' : '🔴 Sin turno activo'}
          </p>
          {current && (
            <p className="text-gray-500 text-xs mt-0.5">
              Abierta {new Date(current.opened_at).toLocaleTimeString('es-MX')} —
              Fondo: {Number(current.opening_amount).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
            </p>
          )}
        </div>
        {isAdmin && (
          <div>
            {!current && (
              <button onClick={() => setModal('open')}
                className="bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700">
                Abrir caja
              </button>
            )}
            {current && (
              <button onClick={() => setModal('close')}
                className="bg-red-500 text-white px-3 py-1.5 rounded text-xs hover:bg-red-600">
                Cerrar caja
              </button>
            )}
          </div>
        )}
      </div>

      {modal === 'open' && <OpenModal onClose={() => setModal(null)} onDone={handleDone} />}
      {modal === 'close' && current && (
        <CloseModal register={current} onClose={() => setModal(null)} onDone={handleDone} />
      )}
    </>
  )
}
