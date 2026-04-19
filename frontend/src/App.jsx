import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import POS from './pages/POS'
import Inventory from './pages/Inventory'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Reports from './pages/Reports'
import Sales from './pages/Sales'
import Suppliers from './pages/Suppliers'
import PurchaseOrders from './pages/PurchaseOrders'
import PurchaseOrderDetail from './pages/PurchaseOrderDetail'
import Users from './pages/Users'
import CashRegister from './pages/CashRegister'

function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const { token, role } = useAuthStore()
  if (!token) return <Navigate to="/login" />
  if (role !== 'admin') return <Navigate to="/" />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<POS />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/:id" element={<CustomerDetail />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/suppliers" element={<AdminRoute><Suppliers /></AdminRoute>} />
                <Route path="/purchase-orders" element={<AdminRoute><PurchaseOrders /></AdminRoute>} />
                <Route path="/purchase-orders/:id" element={<AdminRoute><PurchaseOrderDetail /></AdminRoute>} />
                <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
                <Route path="/cash-register" element={<AdminRoute><CashRegister /></AdminRoute>} />
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
