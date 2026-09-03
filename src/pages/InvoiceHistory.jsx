import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listInvoices } from '../lib/firestore.js'

function fmtDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function InvoiceHistory() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    listInvoices().then((data) => { setInvoices(data); setLoading(false) })
  }, [])

  const filtered = filter === 'all' ? invoices : invoices.filter((i) => i.status === filter)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 4 }}>Invoices & quotes</h1>
          <p style={{ color: 'var(--text-dim)', margin: 0 }}>Full history across you and your staff.</p>
        </div>
        <Link to="/invoices/new" className="btn btn-primary">+ New invoice</Link>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'draft', 'sent', 'paid', 'overdue'].map((f) => (
          <button
            key={f}
            className="btn btn-ghost"
            style={{
              padding: '6px 14px',
              fontSize: 13,
              textTransform: 'capitalize',
              borderColor: filter === f ? 'var(--cyan)' : 'var(--line)',
            }}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="panel" style={{ padding: 4 }}>
        {loading ? (
          <p style={{ padding: 20, color: 'var(--text-dim)' }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: 20, color: 'var(--text-dim)' }}>Nothing here yet.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Reference</th><th>Client</th><th>Type</th><th>Total</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id}>
                  <td><Link to={`/invoices/${inv.id}`} style={{ color: 'var(--cyan-soft)', textDecoration: 'none' }}>{inv.number}</Link></td>
                  <td>{inv.clientSnapshot?.name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{inv.type}</td>
                  <td>R {Number(inv.total || 0).toFixed(2)}</td>
                  <td>{fmtDate(inv.createdAt)}</td>
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
