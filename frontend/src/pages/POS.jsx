import { useState } from 'react'
import ProductSearch from '../components/ProductSearch'
import Cart from '../components/Cart'
import CustomerSearch from '../components/CustomerSearch'
import TicketPrint from '../components/TicketPrint'
import CashRegisterWidget from '../components/CashRegisterWidget'
import { useCartStore } from '../store/cartStore'
import api from '../services/api'

const fmt = (n) => Number(n ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

export default function POS() {
  const { items, discount, paymentMethod, getTotal, clear, setCustomerId } = useCartStore()
  const [customer, setCustomer] = useState(null)
  const [lastSale, setLastSale] = useState(null)
  const [lastCambio, setLastCambio] = useState(null)
  const [msg, setMsg] = useState('')

  const handleSelectCustomer = (c) => {
    setCustomer(c)
    setCustomerId(c.id)
  }

  const handleClearCustomer = () => {
    setCustomer(null)
    setCustomerId(null)
  }

  const checkout = async (montoRecibido) => {
    try {
      const payload = {
        customer_id: customer?.id || null,
        items: items.map(({ product_id, quantity, unit_price }) => ({ product_id, quantity, unit_price })),
        discount,
        payment_method: paymentMethod,
      }
      const { data } = await api.post('/sales/', payload)

      // Enriquecer items con nombres del carrito para el ticket
      const enrichedItems = data.items.map((item) => {
        const cartItem = items.find((i) => i.product_id === item.product_id)
        return { ...item, name: cartItem?.name || null }
      })
      const cambio = paymentMethod === 'cash' && montoRecibido ? montoRecibido - data.total : null

      setLastSale({ ...data, items: enrichedItems })
      setLastCambio(cambio)
      setMsg(`✅ Venta #${data.id} registrada por ${fmt(data.total)}${data.customer_name ? ` — ${data.customer_name}` : ''}`)
      clear()
      setCustomer(null)
      setCustomerId(null)
    } catch (err) {
      setMsg(`❌ ${err.response?.data?.detail || 'Error al procesar venta'}`)
    }
  }

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 space-y-4">
        <h2 className="text-xl font-bold">Punto de Venta</h2>
        <CashRegisterWidget />
        <ProductSearch />
        <CustomerSearch selected={customer} onSelect={handleSelectCustomer} onClear={handleClearCustomer} />
        {msg && <div className="p-3 bg-white rounded shadow text-sm">{msg}</div>}
        {lastSale && (
          <div className="bg-white rounded shadow p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <p className="font-medium">Última venta #{lastSale.id}</p>
              {lastSale.customer_name && <p className="text-indigo-600">👤 {lastSale.customer_name}</p>}
            </div>
            {lastSale.items.map((i) => (
              <div key={i.id} className="flex justify-between text-gray-600">
                <span>{i.quantity}x {i.name || `#${i.product_id}`}</span>
                <span>{fmt(i.subtotal)}</span>
              </div>
            ))}
            <div className="border-t pt-2 font-bold flex justify-between">
              <span>Total</span><span>{fmt(lastSale.total)}</span>
            </div>
            {lastCambio != null && (
              <div className="flex justify-between text-green-600">
                <span>Cambio</span><span>{fmt(lastCambio)}</span>
              </div>
            )}
            <TicketPrint sale={lastSale} cambio={lastCambio} />
          </div>
        )}
      </div>
      <div className="w-80 bg-white rounded-xl shadow p-4 flex flex-col">
        <Cart onCheckout={checkout} hasCustomer={!!customer} />
      </div>
    </div>
  )
}
