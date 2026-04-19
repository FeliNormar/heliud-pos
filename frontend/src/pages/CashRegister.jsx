import { useEffect, useState } from 'react'
import api from '../services/api'

const fmt = (n) => n != null ? Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : '—'
const PAYMENT_LABEL = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', credit: 'Crédito' }

export default function CashRegister() {
  const [registers, setRegisters] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const PAGE_SIZE = 20

  const load = async () => {
    const { data } = await api.get(`/cash-register/?page=${page}&page_size=${PAGE_SIZE}`)
    setRegisters(data)
    setHasMore(data.length === PAGE_SIZE)
  }

  const loadDetail = async (cr) => {
    setSelected(cr)
    const { data } = await api.get(`/cash-register/${cr.id}`)
    setDetail(data)
  }

  useEffect(() => { load() }, [page])

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 space-y-4">
        <h2 className="text-xl font-bold">Cortes de caja</h2>

        <div className="bg-white rounded-xl shadow overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>{['#','Abrió','Cerró','Fondo inicial','Efectivo esperado','Efectivo contado','Diferencia','Estado'].map((h) => (
                <th key={h} className="px-3 py-2 text-left">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {registers.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">Sin cortes registrados</td></tr>
              )}
              {registers.map((cr) => (
                <tr key={cr.id}
                  className={`border-t cursor-pointer hover:bg-indigo-50 ${selected?.id === cr.id ? 'bg-indigo-50' : ''}`}
                  onClick={() => loadDetail(cr)}>
                  <td className="px-3 py-2 text-gray-400">#{cr.id}</td>
                  <td className="px-3 py-2">
                    <div>{cr.opener_username}</div>
                    <div className="text-xs text-gray-400">{new Date(cr.opened_at).toLocaleString('es-MX')}</div>
                  </td>
                  <td className="px-3 py-2">
                    {cr.closer_username
                      ? <><div>{cr.closer_username}</div><div className="text-xs text-gray-400">{new Date(cr.closed_at).toLocaleString('es-MX')}</div></>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-3 py-2">{fmt(cr.opening_amount)}</td>
                  <td className="px-3 py-2">{fmt(cr.expected_cash)}</td>
                  <td className="px-3 py-2">{fmt(cr.closing_amount)}</td>
                  <td className={`px-3 py-2 font-medium ${cr.difference == null ? '' : cr.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {cr.difference != null ? `${cr.difference >= 0 ? '+' : ''}${fmt(cr.difference)}` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {cr.status === 'open'
                      ? <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Abierta</span>
                      : <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">Cerrada</span>}
                  </td>
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
      </div>

      {/* Panel de detalle */}
      {detail && (
        <div className="w-72 bg-white rounded-xl shadow p-4 space-y-4 text-sm overflow-auto">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Corte #{detail.id}</h3>
            <button onClick={() => { setSelected(null); setDetail(null) }} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="space-y-1 text-xs text-gray-500">
            <p>Abrió: <span className="text-gray-800">{detail.opener_username}</span></p>
            <p>{new Date(detail.opened_at).toLocaleString('es-MX')}</p>
            {detail.closer_username && <>
              <p>Cerró: <span className="text-gray-800">{detail.closer_username}</span></p>
              <p>{new Date(detail.closed_at).toLocaleString('es-MX')}</p>
            </>}
            {detail.notes && <p className="italic">{detail.notes}</p>}
          </div>

          <div className="border-t pt-3 space-y-2">
            <p className="font-medium">Ventas del turno ({detail.sales_count})</p>
            {Object.entries(detail.by_method || {}).map(([method, total]) => (
              <div key={method} className="flex justify-between">
                <span className="text-gray-500">{PAYMENT_LABEL[method] || method}</span>
                <span>{fmt(total)}</span>
              </div>
            ))}
          </div>

          {detail.cash_returns > 0 && (
            <div className="flex justify-between text-red-500">
              <span>Devoluciones efectivo</span>
              <span>-{fmt(detail.cash_returns)}</span>
            </div>
          )}

          <div className="border-t pt-3 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Fondo inicial</span>
              <span>{fmt(detail.opening_amount)}</span>
            </div>
            <div className="flex justify-between font-medium text-indigo-600">
              <span>Efectivo esperado</span>
              <span>{fmt(detail.expected_cash)}</span>
            </div>
            {detail.closing_amount != null && <>
              <div className="flex justify-between">
                <span className="text-gray-500">Efectivo contado</span>
                <span>{fmt(detail.closing_amount)}</span>
              </div>
              <div className={`flex justify-between font-bold ${detail.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span>Diferencia</span>
                <span>{detail.difference >= 0 ? '+' : ''}{fmt(detail.difference)}</span>
              </div>
            </>}
          </div>
        </div>
      )}
    </div>
  )
}
