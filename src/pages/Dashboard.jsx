import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listInvoices, listClients } from '../lib/firestore.js'

function Stat({ label, value }) {
  return (
    <div className="panel" style={{ padding: 20 }}>
      <p style={{ color: 'var(--text-dim)', fontSize: 12.5, textTransform: 'uppercase', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, margin: 0 }}>{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const [invoices, setInvoices] = useState([])
  const [clientCount, setClientCount] = useState(0)

  useEffect(() => {
    listInvoices().then(setInvoices)
    listClients().then((c) => setClientCount(c.length))
  }, [])

  const outstanding = invoices.filter((i) => i.status === 'sent').reduce((s, i) => s + Number(i.total || 0), 0)
  const paidThisMonth = invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + Number(i.total || 0), 0)

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 4 }}>Dashboard</h1>
      <p style={{ color: 'var(--text-dim)', marginTop: 0, marginBottom: 24 }}>Overview for the whole team.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <Stat label="Total invoices" value={invoices.length} />
        <Stat label="Outstanding (sent)" value={`R ${outstanding.toFixed(2)}`} />
        <Stat label="Paid" value={`R ${paidThisMonth.toFixed(2)}`} />
        <Stat label="Clients" value={clientCount} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <Link to="/invoices/new" className="btn btn-primary">+ New invoice</Link>
        <Link to="/clients" className="btn btn-ghost">Manage clients</Link>
      </div>

      <div className="panel" style={{ padding: 4 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)', fontWeight: 600, fontSize: 14 }}>
          Recent activity
        </div>
        {invoices.length === 0 ? (
          <p style={{ padding: 20, color: 'var(--text-dim)' }}>No invoices yet — create your first one.</p>
        ) : (
          <table>
            <tbody>
              {invoices.slice(0, 6).map((inv) => (
                <tr key={inv.id}>
                  <td><Link to={`/invoices/${inv.id}`} style={{ color: 'var(--cyan-soft)', textDecoration: 'none' }}>{inv.number}</Link></td>
                  <td>{inv.clientSnapshot?.name}</td>
                  <td>R {Number(inv.total || 0).toFixed(2)}</td>
                  <td><span className={`status-pill status-${inv.status}`}>{inv.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
