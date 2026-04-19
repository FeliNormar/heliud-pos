import { useState } from 'react'
import { useCartStore } from '../store/cartStore'

const fmt = (n) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

export default function Cart({ onCheckout, hasCustomer }) {
  const { items, discount, paymentMethod, updateQty, removeItem, setDiscount, setPaymentMethod, getTotal } = useCartStore()
  const [montoRecibido, setMontoRecibido] = useState('')

  const total = getTotal()
  const monto = parseFloat(montoRecibido) || 0
  const cambio = monto - total
  const insuficiente = paymentMethod === 'cash' && montoRecibido !== '' && monto < total
  const puedecobrar = items.length > 0 && (paymentMethod !== 'cash' || (monto >= total))

  const handleCheckout = () => {
    onCheckout(monto > 0 ? monto : null)
    setMontoRecibido('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto space-y-2">
        {items.length === 0 && <p className="text-gray-400 text-sm text-center mt-8">Carrito vacío</p>}
        {items.map((item) => (
          <div key={item.product_id} className="flex items-center gap-2 bg-white rounded p-2 shadow-sm">
            <div className="flex-1 text-sm">
              <p className="font-medium">{item.name}</p>
              <p className="text-gray-500">${item.unit_price.toFixed(2)} c/u</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => updateQty(item.product_id, item.quantity - 1)}
                className="w-6 h-6 bg-gray-200 rounded text-sm">-</button>
              <span className="w-6 text-center text-sm">{item.quantity}</span>
              <button onClick={() => updateQty(item.product_id, item.quantity + 1)}
                className="w-6 h-6 bg-gray-200 rounded text-sm">+</button>
            </div>
            <span className="text-sm font-medium w-16 text-right">${(item.unit_price * item.quantity).toFixed(2)}</span>
            <button onClick={() => removeItem(item.product_id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
          </div>
        ))}
      </div>

      <div className="border-t pt-3 space-y-2">
        <div className="flex gap-2">
          <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))}
            placeholder="Descuento" className="border rounded px-2 py-1 text-sm w-full" />
          <select value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setMontoRecibido('') }}
            className="border rounded px-2 py-1 text-sm">
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="transfer">Transferencia</option>
            {hasCustomer && <option value="credit">Crédito</option>}
          </select>
        </div>

        {paymentMethod === 'cash' && (
          <div className="space-y-1">
            <input
              type="number"
              value={montoRecibido}
              onChange={(e) => setMontoRecibido(e.target.value)}
              placeholder="Monto recibido"
              className={`w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 ${
                insuficiente ? 'border-red-400 focus:ring-red-300' : 'focus:ring-indigo-400'
              }`}
            />
            {insuficiente && (
              <p className="text-red-500 text-xs">Monto insuficiente</p>
            )}
            {montoRecibido !== '' && !insuficiente && monto > 0 && (
              <div className="flex justify-between text-sm bg-green-50 rounded px-2 py-1">
                <span className="text-gray-600">Cambio</span>
                <span className="font-bold text-green-600">{fmt(cambio)}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>{fmt(total)}</span>
        </div>

        <button onClick={handleCheckout} disabled={!puedecobrar}
          className="w-full bg-indigo-600 text-white py-2 rounded font-medium hover:bg-indigo-700 disabled:opacity-50">
          Cobrar
        </button>
      </div>
    </div>
  )
}
