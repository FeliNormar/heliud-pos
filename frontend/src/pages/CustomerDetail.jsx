import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

const fmt = (n) => Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
const TYPE_LABEL = { charge: '🔴 Cargo', payment: '🟢 Abono' }

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [payAmount, setPayAmount] = useState('')
  const [payNotes, setPayNotes] = useState('')
  const [msg, setMsg] = useState('')

  const load = async () => {
    const [c, txs] = await Promise.all([
      api.get(`/customers/${id}`),
      api.get(`/customers/${id}/credit-transactions`),
    ])
    setCustomer(c.data)
    setTransactions(txs.data)
  }

  useEffect(() => { load() }, [id])

  const handlePayment = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/customers/${id}/credit-payment`, {
        amount: Number(payAmount),
        notes: payNotes || null,
      })
      setMsg('✅ Abono registrado')
      setPayAmount('')
      setPayNotes('')
      load()
    } catch (err) {
      setMsg(`❌ ${err.response?.data?.detail || 'Error'}`)
    }
  }

  if (!customer) return <p className="text-gray-400 text-sm">Cargando...</p>

  const balanceNeg = customer.balance < 0

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/customers')} className="text-indigo-600 hover:underline text-sm">← Clientes</button>
        <h2 className="text-xl font-bold">{customer.name}</h2>
      </div>

      {/* Info básica */}
      <div className="bg-white rounded-xl shadow p-4 grid grid-cols-2 gap-2 text-sm">
        {customer.phone && <p><span className="text-gray-500">Teléfono:</span> {customer.phone}</p>}
        {customer.email && <p><span className="text-gray-500">Email:</span> {customer.email}</p>}
        {customer.address && <p className="col-span-2"><span className="text-gray-500">Dirección:</span> {customer.address}</p>}
      </div>

      {/* Balance */}
      <div className={`rounded-xl shadow p-5 flex items-center justify-between ${balanceNeg ? 'bg-red-50' : 'bg-green-50'}`}>
        <div>
          <p className="text-sm text-gray-500">Cuenta corriente</p>
          <p className={`text-3xl font-bold ${balanceNeg ? 'text-red-600' : 'text-green-600'}`}>
            {balanceNeg ? `Debe: ${fmt(Math.abs(customer.balance))}` : `Saldo: ${fmt(customer.balance)}`}
          </p>
        </div>
        {balanceNeg && (
          <form onSubmit={handlePayment} className="flex gap-2 items-end">
            <div className="space-y-1">
              <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                placeholder="Monto abono" required min="0.01" step="0.01"
                className="border rounded px-2 py-1 text-sm w-32" />
              <input value={payNotes} onChange={(e) => setPayNotes(e.target.value)}
                placeholder="Notas (opcional)" className="border rounded px-2 py-1 text-sm w-32" />
            </div>
            <button type="submit" className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700">
              Registrar abono
            </button>
          </form>
        )}
      </div>
      {msg && <p className="text-sm">{msg}</p>}

      {/* Historial */}
      <div className="bg-white rounded-xl shadow overflow-auto">
        <div className="px-4 py-3 border-b font-medium text-sm">Historial de movimientos</div>
        {transactions.length === 0
          ? <p className="text-gray-400 text-sm p-4">Sin movimientos</p>
          : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {['Fecha', 'Tipo', 'Monto', 'Saldo resultante', 'Notas'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-t">
                    <td className="px-4 py-2 text-gray-500">{new Date(tx.created_at).toLocaleString('es-MX')}</td>
                    <td className="px-4 py-2">{TYPE_LABEL[tx.type]}</td>
                    <td className={`px-4 py-2 font-medium ${tx.type === 'charge' ? 'text-red-600' : 'text-green-600'}`}>
                      {tx.type === 'charge' ? '-' : '+'}{fmt(tx.amount)}
                    </td>
                    <td className={`px-4 py-2 ${tx.balance_after < 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {fmt(tx.balance_after)}
                    </td>
                    <td className="px-4 py-2 text-gray-400">{tx.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  )
}
