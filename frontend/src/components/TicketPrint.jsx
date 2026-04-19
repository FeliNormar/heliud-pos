const NEGOCIO = 'Heliud Refaccionaria'
const fmt = (n) => `$${Number(n).toFixed(2)}`
const PAYMENT = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' }

export default function TicketPrint({ sale, cambio }) {
  if (!sale) return null

  const subtotal = sale.items.reduce((acc, i) => acc + i.subtotal, 0)
  const fecha = new Date(sale.created_at).toLocaleString('es-MX')
  const linea = '--------------------------------'

  const print = () => window.print()

  return (
    <>
      {/* Ticket oculto en pantalla, visible al imprimir */}
      <div id="ticket-print" style={{ display: 'none' }}>
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>{NEGOCIO}</div>
        <div style={{ textAlign: 'center', fontSize: '11px' }}>{fecha}</div>
        <div style={{ textAlign: 'center', fontSize: '11px' }}>Venta #{sale.id}</div>
        {sale.customer_name && (
          <div style={{ textAlign: 'center', fontSize: '11px' }}>Cliente: {sale.customer_name}</div>
        )}
        <div>{linea}</div>

        {/* Productos */}
        {sale.items.map((item, i) => (
          <div key={i}>
            <div style={{ fontSize: '11px' }}>{item.name || `Producto #${item.product_id}`}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span>{item.quantity} x {fmt(item.unit_price)}</span>
              <span>{fmt(item.subtotal)}</span>
            </div>
          </div>
        ))}

        <div>{linea}</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span>Subtotal</span><span>{fmt(subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span>Descuento</span><span>-{fmt(sale.discount)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}>
          <span>TOTAL</span><span>{fmt(sale.total)}</span>
        </div>

        <div>{linea}</div>

        <div style={{ fontSize: '11px' }}>Pago: {PAYMENT[sale.payment_method] || sale.payment_method}</div>
        {sale.payment_method === 'cash' && cambio != null && (
          <div style={{ fontSize: '11px' }}>Cambio: {fmt(cambio)}</div>
        )}

        <div>{linea}</div>
        <div style={{ textAlign: 'center', fontSize: '11px' }}>¡Gracias por su compra!</div>
      </div>

      {/* Botón visible en pantalla */}
      <button onClick={print}
        className="w-full border border-indigo-600 text-indigo-600 py-2 rounded font-medium hover:bg-indigo-50 text-sm">
        🖨️ Imprimir ticket
      </button>
    </>
  )
}
