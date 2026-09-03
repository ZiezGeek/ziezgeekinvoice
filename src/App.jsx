import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Clients from './pages/Clients.jsx'
import NewInvoice from './pages/NewInvoice.jsx'
import InvoiceHistory from './pages/InvoiceHistory.jsx'
import InvoiceView from './pages/InvoiceView.jsx'

function Loading() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: 'var(--text-dim)' }}>
      Loading…
    </div>
  )
}

function RequireAuth({ children }) {
  const { user } = useAuth()
  if (user === undefined) return <Loading />
  if (user === null) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <div className="app-shell">
              <Sidebar />
              <main style={{ padding: '28px 32px' }}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/invoices" element={<InvoiceHistory />} />
                  <Route path="/invoices/new" element={<NewInvoice />} />
                  <Route path="/invoices/:id" element={<InvoiceView />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </RequireAuth>
        }
      />
    </Routes>
  )
}
