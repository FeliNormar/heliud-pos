import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const nav = [
  { to: '/', label: '🛒 POS' },
  { to: '/inventory', label: '📦 Inventario' },
  { to: '/customers', label: '👥 Clientes' },
  { to: '/sales', label: '🧾 Ventas' },
  { to: '/reports', label: '📊 Reportes' },
  { to: '/suppliers', label: '🏭 Proveedores', adminOnly: true },
  { to: '/purchase-orders', label: '📋 Órdenes compra', adminOnly: true },
  { to: '/users', label: '👤 Usuarios', adminOnly: true },
  { to: '/cash-register', label: '💰 Corte de caja', adminOnly: true },
]

export default function Layout({ children }) {
  const { logout, role } = useAuthStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleLogout = () => { logout(); navigate('/login') }
  const visibleNav = nav.filter((n) => !n.adminOnly || role === 'admin')

  return (
    <div className="flex h-screen">
      <aside className="w-48 bg-indigo-800 text-white flex flex-col">
        <div className="p-4 text-xl font-bold border-b border-indigo-600">Heliud POS</div>
        <nav className="flex-1 p-2 space-y-1">
          {visibleNav.map((n) => (
            <Link key={n.to} to={n.to}
              className={`block px-3 py-2 rounded text-sm ${pathname === n.to ? 'bg-indigo-600' : 'hover:bg-indigo-700'}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} className="p-4 text-sm text-indigo-300 hover:text-white border-t border-indigo-600">
          Cerrar sesión
        </button>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
